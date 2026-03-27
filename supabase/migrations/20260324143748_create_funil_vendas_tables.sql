/*
  # Criar tabelas para funil de vendas
  
  1. Novas Tabelas
    - `parametros_funil`: Armazena as taxas de conversão do funil (base, agendamento, comparecimento, conversão)
    - `metricas_funil_vendedor`: Métricas diárias/mensais do funil de cada vendedor
    - `historico_conversao`: Histórico para calcular conversões reais ao longo do tempo
    
  2. Campos importantes
    - parametros_funil: taxas globais e por loja/vendedor
    - metricas_funil_vendedor: base_prospeccao, ligacoes, agendamentos, atendimentos, vendas
    - historico_conversao: para calcular taxas reais baseadas no histórico
    
  3. Segurança
    - RLS habilitado em todas as tabelas
    - Acesso baseado em perfil e loja
*/

-- Tabela de parâmetros do funil (taxas de conversão)
CREATE TABLE IF NOT EXISTS parametros_funil (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_vinculada uuid REFERENCES lojas(id),
  vendedor_id uuid REFERENCES vendedores(id),
  
  -- Taxas de conversão (em decimal, ex: 0.10 = 10%)
  taxa_contato_base decimal(5,4) DEFAULT 0.1000, -- 10% da base consegue ligar
  taxa_agendamento decimal(5,4) DEFAULT 0.3000, -- 30% dos contatos viram agendamento
  taxa_comparecimento decimal(5,4) DEFAULT 0.8000, -- 80% dos agendados comparecem
  taxa_conversao_venda decimal(5,4) DEFAULT 0.3300, -- 33% dos atendimentos viram venda
  
  usa_historico boolean DEFAULT false, -- Se true, usa taxas calculadas do histórico
  
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now(),
  
  UNIQUE(loja_vinculada, vendedor_id)
);

-- Tabela de métricas do funil por vendedor
CREATE TABLE IF NOT EXISTS metricas_funil_vendedor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id uuid NOT NULL REFERENCES vendedores(id) ON DELETE CASCADE,
  loja_vinculada uuid NOT NULL REFERENCES lojas(id),
  
  data_referencia date NOT NULL,
  periodo_tipo text NOT NULL CHECK (periodo_tipo IN ('diario', 'mensal')),
  
  -- Dados reais registrados
  base_prospeccao integer DEFAULT 0,
  ligacoes_realizadas integer DEFAULT 0,
  ligacoes_sucesso integer DEFAULT 0,
  agendamentos_feitos integer DEFAULT 0,
  atendimentos_realizados integer DEFAULT 0,
  vendas_realizadas integer DEFAULT 0,
  
  -- Metas calculadas (baseadas na meta de vendas)
  meta_vendas integer,
  meta_atendimentos integer,
  meta_agendamentos integer,
  meta_ligacoes integer,
  meta_base_minima integer,
  
  -- Taxas reais (calculadas automaticamente)
  taxa_real_contato decimal(5,4),
  taxa_real_agendamento decimal(5,4),
  taxa_real_comparecimento decimal(5,4),
  taxa_real_conversao decimal(5,4),
  
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now(),
  
  UNIQUE(vendedor_id, data_referencia, periodo_tipo)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_parametros_funil_loja ON parametros_funil(loja_vinculada);
CREATE INDEX IF NOT EXISTS idx_parametros_funil_vendedor ON parametros_funil(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_metricas_funil_vendedor ON metricas_funil_vendedor(vendedor_id, data_referencia);
CREATE INDEX IF NOT EXISTS idx_metricas_funil_loja ON metricas_funil_vendedor(loja_vinculada, data_referencia);

-- Habilitar RLS
ALTER TABLE parametros_funil ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_funil_vendedor ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para parametros_funil
CREATE POLICY "Usuários podem ver parâmetros da própria loja"
  ON parametros_funil FOR SELECT
  TO authenticated
  USING (
    loja_vinculada IN (
      SELECT loja_vinculada FROM usuarios WHERE id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil = 'regional'
    )
  );

CREATE POLICY "Gerentes e regionais podem inserir parâmetros"
  ON parametros_funil FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND (
        (u.perfil IN ('gerente', 'apoio_loja') AND u.loja_vinculada = parametros_funil.loja_vinculada)
        OR u.perfil = 'regional'
      )
    )
  );

CREATE POLICY "Gerentes e regionais podem atualizar parâmetros"
  ON parametros_funil FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND (
        (u.perfil IN ('gerente', 'apoio_loja') AND u.loja_vinculada = parametros_funil.loja_vinculada)
        OR u.perfil = 'regional'
      )
    )
  );

-- Políticas RLS para metricas_funil_vendedor
CREATE POLICY "Vendedor pode ver suas próprias métricas"
  ON metricas_funil_vendedor FOR SELECT
  TO authenticated
  USING (
    vendedor_id IN (
      SELECT id FROM vendedores v
      WHERE v.email_vendedor = (SELECT email_usuario FROM usuarios WHERE id = auth.uid())
    )
    OR
    loja_vinculada IN (
      SELECT loja_vinculada FROM usuarios WHERE id = auth.uid() AND perfil IN ('gerente', 'apoio_loja')
    )
    OR
    EXISTS (
      SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil = 'regional'
    )
  );

CREATE POLICY "Gerentes e vendedores podem inserir métricas"
  ON metricas_funil_vendedor FOR INSERT
  TO authenticated
  WITH CHECK (
    vendedor_id IN (
      SELECT id FROM vendedores v
      WHERE v.email_vendedor = (SELECT email_usuario FROM usuarios WHERE id = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND (
        (u.perfil IN ('gerente', 'apoio_loja') AND u.loja_vinculada = metricas_funil_vendedor.loja_vinculada)
        OR u.perfil = 'regional'
      )
    )
  );

CREATE POLICY "Gerentes e vendedores podem atualizar métricas"
  ON metricas_funil_vendedor FOR UPDATE
  TO authenticated
  USING (
    vendedor_id IN (
      SELECT id FROM vendedores v
      WHERE v.email_vendedor = (SELECT email_usuario FROM usuarios WHERE id = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND (
        (u.perfil IN ('gerente', 'apoio_loja') AND u.loja_vinculada = metricas_funil_vendedor.loja_vinculada)
        OR u.perfil = 'regional'
      )
    )
  );

-- Função para calcular metas do funil baseado na meta de vendas
CREATE OR REPLACE FUNCTION calcular_metas_funil(
  p_meta_vendas integer,
  p_taxa_conversao decimal,
  p_taxa_comparecimento decimal,
  p_taxa_agendamento decimal,
  p_taxa_contato decimal
) RETURNS TABLE (
  meta_atendimentos integer,
  meta_agendamentos integer,
  meta_ligacoes integer,
  meta_base_minima integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CEIL(p_meta_vendas / p_taxa_conversao)::integer as meta_atendimentos,
    CEIL(p_meta_vendas / p_taxa_conversao / p_taxa_comparecimento)::integer as meta_agendamentos,
    CEIL(p_meta_vendas / p_taxa_conversao / p_taxa_comparecimento / p_taxa_agendamento)::integer as meta_ligacoes,
    CEIL(p_meta_vendas / p_taxa_conversao / p_taxa_comparecimento / p_taxa_agendamento / p_taxa_contato)::integer as meta_base_minima;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular taxas reais do histórico
CREATE OR REPLACE FUNCTION calcular_taxas_reais(
  p_vendedor_id uuid,
  p_meses_historico integer DEFAULT 3
) RETURNS TABLE (
  taxa_contato decimal,
  taxa_agendamento decimal,
  taxa_comparecimento decimal,
  taxa_conversao decimal
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE 
      WHEN SUM(ligacoes_realizadas) > 0 
      THEN ROUND(SUM(ligacoes_sucesso)::decimal / SUM(ligacoes_realizadas), 4)
      ELSE 0.10
    END as taxa_contato,
    CASE 
      WHEN SUM(ligacoes_sucesso) > 0 
      THEN ROUND(SUM(agendamentos_feitos)::decimal / SUM(ligacoes_sucesso), 4)
      ELSE 0.30
    END as taxa_agendamento,
    CASE 
      WHEN SUM(agendamentos_feitos) > 0 
      THEN ROUND(SUM(atendimentos_realizados)::decimal / SUM(agendamentos_feitos), 4)
      ELSE 0.80
    END as taxa_comparecimento,
    CASE 
      WHEN SUM(atendimentos_realizados) > 0 
      THEN ROUND(SUM(vendas_realizadas)::decimal / SUM(atendimentos_realizados), 4)
      ELSE 0.33
    END as taxa_conversao
  FROM metricas_funil_vendedor
  WHERE vendedor_id = p_vendedor_id
    AND data_referencia >= CURRENT_DATE - (p_meses_historico || ' months')::interval
    AND periodo_tipo = 'mensal';
END;
$$ LANGUAGE plpgsql;