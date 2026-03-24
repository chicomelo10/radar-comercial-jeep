/*
  # Separar Prospecção Ativa e Passiva no Lançamento do Vendedor

  1. Objetivo
    - Dar clareza sobre tipo de atividade realizada
    - Separar prospecção (contato) de atendimento (cliente presente)
    - Melhorar qualidade dos dados do funil de vendas
    
  2. Mudanças na tabela lancamentos_vendedor
    - Adicionar coluna: prospeccao_ativa (ligações/contatos iniciados pelo vendedor)
    - Adicionar coluna: prospeccao_passiva (retornos de clientes, inbound)
    - Manter coluna: atendimentos (cliente atendido presencial ou digital completo)
    - Remover dependência do campo follow_ups (será substituído)
    
  3. Novos campos
    - prospeccao_ativa: int, default 0 (ligações feitas pelo vendedor)
    - prospeccao_passiva: int, default 0 (clientes que retornaram)
    
  4. Impacto no funil
    - Prospecção Ativa + Passiva = Topo do funil (leads contatados)
    - Atendimentos = Próxima etapa (leads qualificados)
    - Test Drive e Firm Order continuam iguais
    
  5. Compatibilidade
    - Campos antigos mantidos para dados históricos
    - Sistema continua funcionando com dados existentes
*/

-- Adicionar novos campos para separar prospecção ativa e passiva
DO $$
BEGIN
  -- Adicionar prospeccao_ativa
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lancamentos_vendedor' 
    AND column_name = 'prospeccao_ativa'
  ) THEN
    ALTER TABLE lancamentos_vendedor 
    ADD COLUMN prospeccao_ativa int DEFAULT 0;
  END IF;
  
  -- Adicionar prospeccao_passiva
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lancamentos_vendedor' 
    AND column_name = 'prospeccao_passiva'
  ) THEN
    ALTER TABLE lancamentos_vendedor 
    ADD COLUMN prospeccao_passiva int DEFAULT 0;
  END IF;
END $$;

-- Adicionar comentários explicativos nas colunas
COMMENT ON COLUMN lancamentos_vendedor.prospeccao_ativa IS 
'Ligações ou contatos ativos iniciados pelo vendedor';

COMMENT ON COLUMN lancamentos_vendedor.prospeccao_passiva IS 
'Retornos de clientes, respostas de leads, contatos inbound';

COMMENT ON COLUMN lancamentos_vendedor.atendimentos IS 
'Clientes atendidos presencialmente na loja ou com atendimento completo digital';

-- Criar índice para consultas de prospecção
CREATE INDEX IF NOT EXISTS idx_lancamentos_prospeccao 
ON lancamentos_vendedor(vendedor_id, data_referencia, prospeccao_ativa, prospeccao_passiva);