/*
  # Simplificar lançamentos do vendedor

  1. Objetivo
    - Tornar o lançamento diário simples e rápido (menos de 2 minutos)
    - Remover campos que não são essenciais para gestão diária
    - Focar apenas no que gera decisão prática

  2. Mudanças
    - Remover campos de origem (fontes serão gerenciadas separadamente)
    - Remover campos detalhados de perda (simplificar para análise gerencial)
    - Manter apenas: atendimentos, test_drives, firm_orders, follow_ups
    - Eliminar janela "meio_do_dia" - apenas fechamento diário

  3. Campos mantidos
    - atendimentos: quantos clientes atendeu
    - test_drives: quantos test drives realizou
    - firm_orders: quantas vendas fechou
    - follow_ups: quantos contatos de retorno fez

  4. Impacto
    - Sistema fica mais simples e rápido
    - Vendedor preenche em 1-2 minutos
    - Foco em ação, não em relatório
*/

-- Nenhuma alteração necessária na estrutura do banco
-- Os campos existentes serão mantidos para compatibilidade
-- A simplificação é feita no frontend, não quebrando dados históricos
-- Campos não utilizados simplesmente receberão valor 0

-- Criar índice para melhorar performance de consultas por janela fechamento
CREATE INDEX IF NOT EXISTS idx_lancamentos_vendedor_fechamento 
ON lancamentos_vendedor(vendedor_id, data_referencia) 
WHERE janela = 'fechamento';
