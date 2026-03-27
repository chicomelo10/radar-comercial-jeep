/*
  # Adicionar campo observacao_gerente à tabela lancamentos_loja

  1. Alterações
    - Adiciona coluna `observacao_gerente` na tabela `lancamentos_loja`
    - Campo de texto livre para coaching e acompanhamento
    - Permite registro de conversas com vendedores
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lancamentos_loja' AND column_name = 'observacao_gerente'
  ) THEN
    ALTER TABLE lancamentos_loja ADD COLUMN observacao_gerente text;
  END IF;
END $$;