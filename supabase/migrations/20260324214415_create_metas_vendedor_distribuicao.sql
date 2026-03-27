/*
  # Criar estrutura de metas individuais por vendedor

  1. Nova Tabela
    - `metas_vendedor` - armazena a meta individual de cada vendedor por mês
    
  2. Campos importantes
    - vendedor_id: referência ao vendedor
    - mes_referencia: mês da meta
    - meta_prospeccao: meta de prospecção individual
    - meta_atendimentos: meta de atendimentos individual
    - meta_test_drives: meta de test drives individual
    - meta_firm_orders: meta de vendas individual
    - meta_captacao_usado: meta de captação individual
    - peso_aplicado: peso usado no cálculo (para histórico)
    - modo_distribuicao: como foi distribuída (igual ou ponderada)
    
  3. Segurança
    - RLS habilitado
    - Gerente pode editar metas dos vendedores da sua loja
    - Vendedor pode visualizar metas da sua loja
*/

-- Criar tabela de metas individuais por vendedor
CREATE TABLE IF NOT EXISTS metas_vendedor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id uuid NOT NULL REFERENCES vendedores(id) ON DELETE CASCADE,
  loja_vinculada uuid NOT NULL REFERENCES lojas(id),
  mes_referencia date NOT NULL,
  
  meta_prospeccao integer DEFAULT 0,
  meta_atendimentos integer DEFAULT 0,
  meta_test_drives integer DEFAULT 0,
  meta_firm_orders integer DEFAULT 0,
  meta_captacao_usado integer DEFAULT 0,
  
  peso_aplicado numeric(5,2) DEFAULT 1.0,
  modo_distribuicao text DEFAULT 'igual' CHECK (modo_distribuicao IN ('igual', 'ponderada_por_historico')),
  
  observacoes text,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now(),
  
  UNIQUE(vendedor_id, mes_referencia)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_metas_vendedor_vendedor ON metas_vendedor(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_metas_vendedor_loja ON metas_vendedor(loja_vinculada);
CREATE INDEX IF NOT EXISTS idx_metas_vendedor_mes ON metas_vendedor(mes_referencia);

-- Habilitar RLS
ALTER TABLE metas_vendedor ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para metas_vendedor

-- Usuários podem ver metas da própria loja
CREATE POLICY "Usuários podem ver metas da própria loja"
  ON metas_vendedor FOR SELECT
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

-- Gerente e regional podem inserir metas
CREATE POLICY "Gerentes e regionais podem inserir metas"
  ON metas_vendedor FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND (
        (u.perfil IN ('gerente', 'apoio_loja') AND u.loja_vinculada = metas_vendedor.loja_vinculada)
        OR u.perfil = 'regional'
      )
    )
  );

-- Gerente e regional podem atualizar metas
CREATE POLICY "Gerentes e regionais podem atualizar metas"
  ON metas_vendedor FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND (
        (u.perfil IN ('gerente', 'apoio_loja') AND u.loja_vinculada = metas_vendedor.loja_vinculada)
        OR u.perfil = 'regional'
      )
    )
  );