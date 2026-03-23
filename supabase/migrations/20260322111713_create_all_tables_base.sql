/*
  # Criar todas as tabelas base do Radar Comercial Jeep
  
  1. Novas tabelas
    - `lojas` - cadastro de lojas/concessionárias
    - `usuarios` - perfis de usuários do sistema
    - `vendedores` - cadastro de vendedores
    - `disponibilidade_equipe` - controle de disponibilidade
    - `metas_mensais` - metas e premissas por loja
    - `lancamentos_loja` - lançamentos diários da loja
    - `lancamentos_vendedor` - lançamentos diários do vendedor
    - `acompanhamentos_gerente` - acompanhamento gerencial
    - `historico_alteracoes` - auditoria de alterações
    
  2. Segurança
    - RLS habilitado em todas as tabelas
    - Policies serão criadas em migração separada
*/

-- Tabela de lojas
CREATE TABLE IF NOT EXISTS lojas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_loja text NOT NULL,
  grupo text NOT NULL,
  cidade text NOT NULL,
  uf text NOT NULL,
  gerente_responsavel text,
  email_gerente text,
  apoio_loja text,
  email_apoio text,
  qtd_planejada_vendedores integer DEFAULT 0,
  loja_ativa boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_usuario text NOT NULL,
  email_usuario text NOT NULL UNIQUE,
  perfil text NOT NULL CHECK (perfil IN ('regional', 'gerente', 'apoio_loja', 'vendedor')),
  loja_vinculada uuid REFERENCES lojas(id),
  ativo boolean DEFAULT true,
  pode_editar_metas boolean DEFAULT false,
  pode_editar_equipe boolean DEFAULT false,
  pode_lancar_por_terceiros boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Tabela de vendedores
CREATE TABLE IF NOT EXISTS vendedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_vendedor text NOT NULL,
  email_vendedor text,
  loja_vinculada uuid NOT NULL REFERENCES lojas(id),
  status_vendedor text DEFAULT 'ativo' CHECK (status_vendedor IN ('ativo', 'inativo')),
  data_entrada date DEFAULT CURRENT_DATE,
  data_saida date,
  meta_mensal_atual numeric(10,2) DEFAULT 0,
  peso_historico_meta numeric(5,2) DEFAULT 1.0,
  observacoes_cadastro text,
  created_at timestamptz DEFAULT now()
);

-- Tabela de disponibilidade da equipe
CREATE TABLE IF NOT EXISTS disponibilidade_equipe (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_vinculada uuid NOT NULL REFERENCES lojas(id),
  vendedor_id uuid NOT NULL REFERENCES vendedores(id),
  tipo_disponibilidade text NOT NULL CHECK (tipo_disponibilidade IN (
    'presente', 'presente_parcial', 'falta', 'ferias', 'folga', 
    'atestado', 'treinamento', 'apoio_externo_rua', 'outros'
  )),
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  observacao text,
  lancado_por uuid REFERENCES usuarios(id),
  created_at timestamptz DEFAULT now()
);

-- Tabela de metas mensais
CREATE TABLE IF NOT EXISTS metas_mensais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mes_referencia date NOT NULL,
  loja_vinculada uuid NOT NULL REFERENCES lojas(id),
  objetivo_vendas integer NOT NULL DEFAULT 0,
  objetivo_faturamento numeric(12,2) DEFAULT 0,
  conversao_atendimento_venda numeric(5,4) DEFAULT 0.10,
  conversao_agendamento_comparecimento numeric(5,4) DEFAULT 0.70,
  conversao_comparecimento_testdrive numeric(5,4) DEFAULT 0.80,
  conversao_testdrive_venda numeric(5,4) DEFAULT 0.30,
  modo_distribuicao_meta text DEFAULT 'igual' CHECK (modo_distribuicao_meta IN ('igual', 'ponderada_por_historico')),
  leads_necessarios_calculado integer DEFAULT 0,
  atendimentos_necessarios_calculado integer DEFAULT 0,
  agendamentos_necessarios_calculado integer DEFAULT 0,
  comparecimentos_necessarios_calculado integer DEFAULT 0,
  testdrives_necessarios_calculado integer DEFAULT 0,
  meta_diaria_calculada numeric(10,2) DEFAULT 0,
  premissa_padrao_mercado boolean DEFAULT true,
  observacoes text,
  aprovado_por_gerente boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(mes_referencia, loja_vinculada)
);

-- Tabela de lançamentos da loja
CREATE TABLE IF NOT EXISTS lancamentos_loja (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_referencia date NOT NULL,
  janela text NOT NULL CHECK (janela IN ('meio_do_dia', 'fechamento')),
  loja_vinculada uuid NOT NULL REFERENCES lojas(id),
  firm_orders integer DEFAULT 0,
  faturamento numeric(12,2) DEFAULT 0,
  leads_recebidos integer DEFAULT 0,
  leads_atendidos integer DEFAULT 0,
  leads_que_viraram_agendamento integer DEFAULT 0,
  agendamentos integer DEFAULT 0,
  comparecimentos integer DEFAULT 0,
  atendimentos integer DEFAULT 0,
  test_drives integer DEFAULT 0,
  perdas_totais integer DEFAULT 0,
  perda_preco integer DEFAULT 0,
  perda_avaliacao_usado integer DEFAULT 0,
  perda_credito_financiamento integer DEFAULT 0,
  perda_parcela_taxa integer DEFAULT 0,
  perda_falta_estoque integer DEFAULT 0,
  perda_testdrive_indisponivel integer DEFAULT 0,
  perda_concorrencia integer DEFAULT 0,
  perda_desistencia_cliente integer DEFAULT 0,
  perda_atendimento_demora integer DEFAULT 0,
  perda_sem_decisao_casal_familia integer DEFAULT 0,
  perda_lead_sem_contato integer DEFAULT 0,
  perda_outros integer DEFAULT 0,
  perda_outros_observacao text,
  contexto_dia text DEFAULT 'dia_normal' CHECK (contexto_dia IN (
    'dia_normal', 'acao_local', 'evento_na_loja', 'feriado_vespera',
    'problema_estoque', 'equipe_reduzida', 'campanha_concorrencia', 'outros'
  )),
  contexto_outros_observacao text,
  observacoes_loja text,
  preenchido_por uuid REFERENCES usuarios(id),
  origem_lancamento text DEFAULT 'web',
  data_hora_envio timestamptz DEFAULT now(),
  status_preenchimento text DEFAULT 'no_prazo' CHECK (status_preenchimento IN ('no_prazo', 'em_atraso', 'corrigido')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(data_referencia, janela, loja_vinculada)
);

-- Tabela de lançamentos do vendedor
CREATE TABLE IF NOT EXISTS lancamentos_vendedor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_referencia date NOT NULL,
  janela text NOT NULL CHECK (janela IN ('meio_do_dia', 'fechamento')),
  loja_vinculada uuid NOT NULL REFERENCES lojas(id),
  vendedor_id uuid NOT NULL REFERENCES vendedores(id),
  atendimentos integer DEFAULT 0,
  agendamentos integer DEFAULT 0,
  comparecimentos integer DEFAULT 0,
  test_drives integer DEFAULT 0,
  follow_ups integer DEFAULT 0,
  firm_orders integer DEFAULT 0,
  perdas_totais integer DEFAULT 0,
  origem_showroom_espontaneo integer DEFAULT 0,
  origem_salesforce_grow integer DEFAULT 0,
  origem_carteira_prospeccao integer DEFAULT 0,
  origem_indicacao integer DEFAULT 0,
  origem_pos_venda integer DEFAULT 0,
  origem_outros integer DEFAULT 0,
  perda_preco integer DEFAULT 0,
  perda_avaliacao_usado integer DEFAULT 0,
  perda_credito_financiamento integer DEFAULT 0,
  perda_parcela_taxa integer DEFAULT 0,
  perda_falta_estoque integer DEFAULT 0,
  perda_testdrive_indisponivel integer DEFAULT 0,
  perda_concorrencia integer DEFAULT 0,
  perda_desistencia_cliente integer DEFAULT 0,
  perda_atendimento_demora integer DEFAULT 0,
  perda_sem_decisao_casal_familia integer DEFAULT 0,
  perda_lead_sem_contato integer DEFAULT 0,
  perda_outros integer DEFAULT 0,
  perda_outros_observacao text,
  observacao_vendedor text,
  preenchido_pelo_proprio_vendedor boolean DEFAULT true,
  ajustado_por_gerente boolean DEFAULT false,
  usuario_ajuste uuid REFERENCES usuarios(id),
  data_hora_envio timestamptz DEFAULT now(),
  status_preenchimento text DEFAULT 'no_prazo' CHECK (status_preenchimento IN ('no_prazo', 'em_atraso', 'corrigido')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(data_referencia, janela, vendedor_id)
);

-- Tabela de acompanhamentos do gerente
CREATE TABLE IF NOT EXISTS acompanhamentos_gerente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_referencia date NOT NULL,
  loja_vinculada uuid NOT NULL REFERENCES lojas(id),
  janela text DEFAULT 'fechamento' CHECK (janela = 'fechamento'),
  houve_reuniao_matinal boolean DEFAULT false,
  tema_reuniao_matinal text CHECK (tema_reuniao_matinal IN (
    'teatro_de_vendas', 'conversoes_e_funil', 'carteira_e_followup',
    'coaching_de_piso', 'pipeline_e_fechamento', 'outros', NULL
  )),
  tema_reuniao_outros text,
  tema_gerencial_dia text,
  tema_gerencial_outros text,
  houve_acompanhamento_individual boolean DEFAULT false,
  vendedor_acompanhado uuid REFERENCES vendedores(id),
  tema_acompanhamento text CHECK (tema_acompanhamento IN (
    'baixa_conversao_atendimento_testdrive', 'baixa_conversao_testdrive_venda',
    'poucos_agendamentos', 'poucos_followups', 'baixa_disciplina_preenchimento',
    'leads_sem_retorno', 'argumentacao_comercial_fraca', 'tratamento_objecoes',
    'pouca_prospeccao_ativa', 'falta_cadencia_dia', 'organizacao_carteira',
    'postura_showroom', 'fechamento_contorno_negociacao', 'outros', NULL
  )),
  tema_acompanhamento_outros text,
  resumo_conversa text,
  proxima_acao_combinada text,
  plano_acao_dia_seguinte text,
  observacoes_gerente text,
  preenchido_por uuid REFERENCES usuarios(id),
  data_hora_envio timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(data_referencia, loja_vinculada)
);

-- Tabela de histórico de alterações
CREATE TABLE IF NOT EXISTS historico_alteracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela text NOT NULL,
  registro_id uuid NOT NULL,
  acao text NOT NULL CHECK (acao IN ('INSERT', 'UPDATE', 'DELETE')),
  dados_anteriores jsonb,
  dados_novos jsonb,
  usuario_id uuid REFERENCES usuarios(id),
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE lojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE disponibilidade_equipe ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas_mensais ENABLE ROW LEVEL SECURITY;
ALTER TABLE lancamentos_loja ENABLE ROW LEVEL SECURITY;
ALTER TABLE lancamentos_vendedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE acompanhamentos_gerente ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_alteracoes ENABLE ROW LEVEL SECURITY;