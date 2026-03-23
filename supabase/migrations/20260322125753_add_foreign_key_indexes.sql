/*
  # Adicionar Índices para Foreign Keys

  1. Objetivo
    - Melhorar performance de queries que utilizam foreign keys
    - Resolver alertas de "Unindexed foreign keys"

  2. Índices Criados
    - `acompanhamentos_gerente`: loja_vinculada, preenchido_por, vendedor_acompanhado
    - `disponibilidade_equipe`: lancado_por, loja_vinculada, vendedor_id
    - `historico_alteracoes`: usuario_id
    - `lancamentos_loja`: loja_vinculada, preenchido_por
    - `lancamentos_vendedor`: loja_vinculada, usuario_ajuste, vendedor_id
    - `metas_mensais`: loja_vinculada
    - `usuarios`: loja_vinculada
    - `vendedores`: loja_vinculada

  3. Benefícios
    - Queries com JOINs mais rápidas
    - Melhor performance em buscas por loja/vendedor
    - Otimização de consultas relacionadas
*/

-- Índices para acompanhamentos_gerente
CREATE INDEX IF NOT EXISTS idx_acompanhamentos_gerente_loja_vinculada
  ON acompanhamentos_gerente(loja_vinculada);

CREATE INDEX IF NOT EXISTS idx_acompanhamentos_gerente_preenchido_por
  ON acompanhamentos_gerente(preenchido_por);

CREATE INDEX IF NOT EXISTS idx_acompanhamentos_gerente_vendedor_acompanhado
  ON acompanhamentos_gerente(vendedor_acompanhado);

-- Índices para disponibilidade_equipe
CREATE INDEX IF NOT EXISTS idx_disponibilidade_equipe_lancado_por
  ON disponibilidade_equipe(lancado_por);

CREATE INDEX IF NOT EXISTS idx_disponibilidade_equipe_loja_vinculada
  ON disponibilidade_equipe(loja_vinculada);

CREATE INDEX IF NOT EXISTS idx_disponibilidade_equipe_vendedor_id
  ON disponibilidade_equipe(vendedor_id);

-- Índices para historico_alteracoes
CREATE INDEX IF NOT EXISTS idx_historico_alteracoes_usuario_id
  ON historico_alteracoes(usuario_id);

-- Índices para lancamentos_loja
CREATE INDEX IF NOT EXISTS idx_lancamentos_loja_loja_vinculada
  ON lancamentos_loja(loja_vinculada);

CREATE INDEX IF NOT EXISTS idx_lancamentos_loja_preenchido_por
  ON lancamentos_loja(preenchido_por);

-- Índices para lancamentos_vendedor
CREATE INDEX IF NOT EXISTS idx_lancamentos_vendedor_loja_vinculada
  ON lancamentos_vendedor(loja_vinculada);

CREATE INDEX IF NOT EXISTS idx_lancamentos_vendedor_usuario_ajuste
  ON lancamentos_vendedor(usuario_ajuste);

CREATE INDEX IF NOT EXISTS idx_lancamentos_vendedor_vendedor_id
  ON lancamentos_vendedor(vendedor_id);

-- Índices para metas_mensais
CREATE INDEX IF NOT EXISTS idx_metas_mensais_loja_vinculada
  ON metas_mensais(loja_vinculada);

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_loja_vinculada
  ON usuarios(loja_vinculada);

-- Índices para vendedores
CREATE INDEX IF NOT EXISTS idx_vendedores_loja_vinculada
  ON vendedores(loja_vinculada);

-- Índices compostos úteis para queries comuns
CREATE INDEX IF NOT EXISTS idx_lancamentos_loja_data_loja
  ON lancamentos_loja(data_referencia, loja_vinculada);

CREATE INDEX IF NOT EXISTS idx_lancamentos_vendedor_data_vendedor
  ON lancamentos_vendedor(data_referencia, vendedor_id);

CREATE INDEX IF NOT EXISTS idx_disponibilidade_equipe_data_loja
  ON disponibilidade_equipe(data_inicio, loja_vinculada);

CREATE INDEX IF NOT EXISTS idx_acompanhamentos_gerente_data_loja
  ON acompanhamentos_gerente(data_referencia, loja_vinculada);
