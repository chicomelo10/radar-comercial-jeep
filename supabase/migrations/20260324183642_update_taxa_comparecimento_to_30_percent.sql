/*
  # Atualizar taxa de comparecimento de 80% para 30%
  
  1. Alterações
    - Atualizar DEFAULT da coluna taxa_comparecimento para 0.30 (30%)
    - Atualizar registros existentes de 0.80 para 0.30
    - Atualizar função calcular_taxas_reais para usar 0.30 como fallback
  
  2. Impacto
    - Todos os cálculos do funil serão baseados em 30% de comparecimento
    - Metas de agendamentos aumentarão proporcionalmente
*/

-- Atualizar registros existentes na tabela parametros_funil
UPDATE parametros_funil 
SET taxa_comparecimento = 0.30,
    atualizado_em = now()
WHERE taxa_comparecimento = 0.80;

-- Alterar o DEFAULT da coluna para novos registros
ALTER TABLE parametros_funil 
ALTER COLUMN taxa_comparecimento SET DEFAULT 0.3000;

-- Atualizar a função calcular_taxas_reais para usar 0.30 como fallback
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
      ELSE 0.30
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