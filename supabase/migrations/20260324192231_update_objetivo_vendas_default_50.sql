/*
  # Atualizar objetivo de vendas padrão para 50

  1. Alterações
    - Atualizar DEFAULT da coluna objetivo_vendas para 50 (conforme padrão Jeep)
    - Útil para novos registros de metas mensais

  2. Impacto
    - Novas metas criadas terão objetivo de 50 vendas por padrão
    - Metas existentes não serão alteradas
*/

-- Alterar o DEFAULT da coluna objetivo_vendas para 50
ALTER TABLE metas_mensais 
ALTER COLUMN objetivo_vendas SET DEFAULT 50;
