import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Usuario = {
  id: string;
  nome_usuario: string;
  email_usuario: string;
  perfil: 'regional' | 'gerente' | 'apoio_loja' | 'vendedor';
  loja_vinculada: string | null;
  ativo: boolean;
  pode_editar_metas: boolean;
  pode_editar_equipe: boolean;
  pode_lancar_por_terceiros: boolean;
};

export type Loja = {
  id: string;
  nome_loja: string;
  grupo: string;
  cidade: string;
  uf: string;
  gerente_responsavel: string | null;
  email_gerente: string | null;
  apoio_loja: string | null;
  email_apoio: string | null;
  qtd_planejada_vendedores: number;
  loja_ativa: boolean;
};

export type Vendedor = {
  id: string;
  nome_vendedor: string;
  email_vendedor: string | null;
  loja_vinculada: string;
  status_vendedor: 'ativo' | 'inativo';
  data_entrada: string;
  data_saida: string | null;
  meta_mensal_atual: number;
  peso_historico_meta: number;
  observacoes_cadastro: string | null;
};

export type LancamentoLoja = {
  id: string;
  data_referencia: string;
  janela: 'meio_do_dia' | 'fechamento';
  loja_vinculada: string;
  firm_orders: number;
  faturamento: number;
  leads_recebidos: number;
  leads_atendidos: number;
  agendamentos: number;
  comparecimentos: number;
  atendimentos: number;
  test_drives: number;
  perdas_totais: number;
  status_preenchimento: 'no_prazo' | 'em_atraso' | 'corrigido';
};

export type LancamentoVendedor = {
  id: string;
  data_referencia: string;
  janela: 'meio_do_dia' | 'fechamento';
  loja_vinculada: string;
  vendedor_id: string;
  atendimentos: number;
  agendamentos: number;
  comparecimentos: number;
  test_drives: number;
  follow_ups: number;
  firm_orders: number;
  perdas_totais: number;
  status_preenchimento: 'no_prazo' | 'em_atraso' | 'corrigido';
};
