/*
  # Adicionar metas específicas do Radar Comercial Jeep

  1. Alterações na tabela metas_mensais
    - Adicionar meta_prospeccao (Prospecção Ativa + Passiva)
    - Adicionar meta_atendimentos (Atendimentos loja ou online)
    - Adicionar meta_test_drives (Test Drives realizados)
    - Adicionar meta_firm_orders (Firm Orders fechados)
    - Adicionar meta_captacao_usado (Captação de Usado - indicador paralelo)

  2. Regras
    - Gerente da loja pode editar metas
    - Vendedor NÃO pode editar metas
    - Metas são usadas no funil e dashboards

  3. Valores padrão
    - meta_prospeccao: 100 (contatos ativos e passivos)
    - meta_atendimentos: 30 (atendimentos qualificados)
    - meta_test_drives: 15 (test drives realizados)
    - meta_firm_orders: 10 (vendas fechadas)
    - meta_captacao_usado: 5 (veículos para troca)
*/

-- Adicionar novas colunas de metas específicas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'metas_mensais' AND column_name = 'meta_prospeccao'
  ) THEN
    ALTER TABLE metas_mensais ADD COLUMN meta_prospeccao integer DEFAULT 100;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'metas_mensais' AND column_name = 'meta_atendimentos'
  ) THEN
    ALTER TABLE metas_mensais ADD COLUMN meta_atendimentos integer DEFAULT 30;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'metas_mensais' AND column_name = 'meta_test_drives'
  ) THEN
    ALTER TABLE metas_mensais ADD COLUMN meta_test_drives integer DEFAULT 15;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'metas_mensais' AND column_name = 'meta_firm_orders'
  ) THEN
    ALTER TABLE metas_mensais ADD COLUMN meta_firm_orders integer DEFAULT 10;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'metas_mensais' AND column_name = 'meta_captacao_usado'
  ) THEN
    ALTER TABLE metas_mensais ADD COLUMN meta_captacao_usado integer DEFAULT 5;
  END IF;
END $$;

-- Atualizar metas mensais existentes com valores padrão
UPDATE metas_mensais
SET
  meta_prospeccao = COALESCE(meta_prospeccao, 100),
  meta_atendimentos = COALESCE(meta_atendimentos, 30),
  meta_test_drives = COALESCE(meta_test_drives, 15),
  meta_firm_orders = COALESCE(meta_firm_orders, objetivo_vendas),
  meta_captacao_usado = COALESCE(meta_captacao_usado, 5)
WHERE meta_prospeccao IS NULL
   OR meta_atendimentos IS NULL
   OR meta_test_drives IS NULL
   OR meta_firm_orders IS NULL
   OR meta_captacao_usado IS NULL;