/*
  # Ajustar fontes de prospecção conforme padrão Jeep
  
  1. Alterações
    - Atualizar descrição da fonte "Oficina" para especificar colaboração
    - Renomear "Leads Digital" para "Leads" (termo mais genérico)
    - Manter as 4 fontes principais ativas e priorizadas
  
  2. Fontes principais Jeep
    - Oficina (Colaboration) - ordem 1
    - Exposição Shopping - ordem 2
    - Cliente Espontâneo - ordem 3
    - Leads - ordem 4
*/

-- Atualizar descrição da Oficina para enfatizar colaboração
UPDATE fontes_prospeccao 
SET descricao = 'Clientes da oficina - Colaboração entre serviços e vendas',
    atualizado_em = now()
WHERE nome_fonte = 'Oficina';

-- Renomear "Leads Digital" para apenas "Leads"
UPDATE fontes_prospeccao 
SET nome_fonte = 'Leads',
    descricao = 'Leads recebidos de diversas fontes digitais e canais',
    atualizado_em = now()
WHERE nome_fonte = 'Leads Digital';

-- Garantir que as 4 fontes principais estão ativas e com ordem correta
UPDATE fontes_prospeccao 
SET ativa = true, 
    ordem_exibicao = 1,
    atualizado_em = now()
WHERE nome_fonte = 'Oficina';

UPDATE fontes_prospeccao 
SET ativa = true, 
    ordem_exibicao = 2,
    atualizado_em = now()
WHERE nome_fonte = 'Exposição Shopping';

UPDATE fontes_prospeccao 
SET ativa = true, 
    ordem_exibicao = 3,
    atualizado_em = now()
WHERE nome_fonte = 'Cliente Espontâneo';

UPDATE fontes_prospeccao 
SET ativa = true, 
    ordem_exibicao = 4,
    atualizado_em = now()
WHERE nome_fonte = 'Leads';