/*
  # Adicionar dias úteis e etapas do funil

  1. Alterações
    - Adicionar coluna dias_uteis_mes na tabela metas_mensais (padrão 23 dias)
    - Criar tabela etapas_funil para registrar as 5 etapas do processo Jeep

  2. Etapas do Funil Jeep
    - Levantamento de Necessidades (ordem 1)
    - Test Drive (ordem 2)
    - Negociações (ordem 3)
    - Conversão de Vendas (ordem 4)
    - Financiamento (ordem 5)

  3. Segurança
    - RLS habilitado na tabela etapas_funil
    - Todas as etapas são visíveis para usuários autenticados
*/

-- Adicionar coluna dias_uteis_mes à tabela metas_mensais
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'metas_mensais' AND column_name = 'dias_uteis_mes'
  ) THEN
    ALTER TABLE metas_mensais ADD COLUMN dias_uteis_mes integer DEFAULT 23;
  END IF;
END $$;

-- Atualizar metas mensais existentes com dias_uteis_mes = 23
UPDATE metas_mensais
SET dias_uteis_mes = 23
WHERE dias_uteis_mes IS NULL;

-- Criar tabela de etapas do funil
CREATE TABLE IF NOT EXISTS etapas_funil (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_etapa text NOT NULL UNIQUE,
  descricao text,
  ordem_exibicao integer NOT NULL,
  ativa boolean DEFAULT true,
  cor_badge text DEFAULT '#64748b',
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

-- Inserir as 5 etapas do processo Jeep
INSERT INTO etapas_funil (nome_etapa, descricao, ordem_exibicao, ativa, cor_badge)
VALUES
  ('Levantamento de Necessidades', 'Entender as necessidades e perfil do cliente', 1, true, '#3b82f6'),
  ('Test Drive', 'Realizar test drive do veículo de interesse', 2, true, '#8b5cf6'),
  ('Negociações', 'Negociar valores, condições e prazos', 3, true, '#f59e0b'),
  ('Conversão de Vendas', 'Fechamento da venda e assinatura de contrato', 4, true, '#10b981'),
  ('Financiamento', 'Aprovação e conclusão do financiamento', 5, true, '#06b6d4')
ON CONFLICT (nome_etapa) DO NOTHING;

-- Criar índice para ordem de exibição
CREATE INDEX IF NOT EXISTS idx_etapas_funil_ordem ON etapas_funil(ordem_exibicao);

-- Habilitar RLS
ALTER TABLE etapas_funil ENABLE ROW LEVEL SECURITY;

-- Política RLS para etapas_funil - todos podem ler
CREATE POLICY "Usuários autenticados podem ver etapas"
  ON etapas_funil FOR SELECT
  TO authenticated
  USING (true);

-- Política RLS para etapas_funil - apenas regional pode modificar
CREATE POLICY "Apenas regional pode inserir etapas"
  ON etapas_funil FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND perfil = 'regional'
    )
  );

CREATE POLICY "Apenas regional pode atualizar etapas"
  ON etapas_funil FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid()
      AND perfil = 'regional'
    )
  );

-- Adicionar coluna fonte_prospeccao_id na tabela metricas_funil_vendedor
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'metricas_funil_vendedor' AND column_name = 'fonte_prospeccao_id'
  ) THEN
    ALTER TABLE metricas_funil_vendedor
    ADD COLUMN fonte_prospeccao_id uuid REFERENCES fontes_prospeccao(id);
  END IF;
END $$;

-- Criar índice para fonte de prospecção
CREATE INDEX IF NOT EXISTS idx_metricas_funil_fonte ON metricas_funil_vendedor(fonte_prospeccao_id);
