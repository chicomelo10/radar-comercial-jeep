'use client';

import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useEffect, useState, type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, TrendingUp, Users, Phone, Target, CircleAlert as AlertCircle, CarFront, Award } from 'lucide-react';
import { FonteBadge } from '@/components/dashboard/fonte-badge';

type FonteProspeccao = {
  id: string;
  nome_fonte: string;
};

type FunilData = {
  vendedor_nome?: string;
  loja_nome?: string;
  fonte?: FonteProspeccao | null;
  meta_vendas: number;
  meta_atendimentos: number;
  meta_agendamentos: number;
  meta_test_drives: number;
  meta_ligacoes: number;
  meta_base_minima: number;
  base_prospeccao: number;
  ligacoes_realizadas: number;
  ligacoes_sucesso: number;
  agendamentos_feitos: number;
  atendimentos_realizados: number;
  test_drives_realizados: number;
  vendas_realizadas: number;
  taxa_conversao: number;
  taxa_comparecimento: number;
  taxa_agendamento: number;
  taxa_contato: number;
};

type Loja = {
  id: string;
  nome_loja: string;
};

type Vendedor = {
  id: string;
  nome_vendedor: string;
  loja_vinculada: string;
};

export default function FunilVendasPage() {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [funilData, setFunilData] = useState<FunilData[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [fontes, setFontes] = useState<FonteProspeccao[]>([]);
  const [lojaFiltro, setLojaFiltro] = useState<string>('todas');
  const [vendedorFiltro, setVendedorFiltro] = useState<string>('todos');
  const [fonteFiltro, setFonteFiltro] = useState<string>('todas');
  const [mesReferencia, setMesReferencia] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    loadData();
  }, [mesReferencia, lojaFiltro, vendedorFiltro, fonteFiltro]);

  useEffect(() => {
    loadLojas();
    loadFontes();
    if ((usuario?.perfil === 'gerente' || usuario?.perfil === 'apoio_loja') && usuario?.loja_vinculada) {
      loadVendedoresPorLoja(usuario.loja_vinculada);
    }
  }, [usuario]);

  const loadLojas = async () => {
    try {
      const { data } = await supabase
        .from('lojas')
        .select('id, nome_loja')
        .eq('loja_ativa', true)
        .order('nome_loja');

      if (data) setLojas(data);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
    }
  };

  const loadFontes = async () => {
    try {
      const { data } = await supabase
        .from('fontes_prospeccao')
        .select('id, nome_fonte')
        .eq('ativa', true)
        .order('ordem_exibicao');

      if (data) setFontes(data);
    } catch (error) {
      console.error('Erro ao carregar fontes:', error);
    }
  };

  const loadVendedoresPorLoja = async (lojaId?: string) => {
    if (!lojaId && lojaFiltro === 'todas') return;

    try {
      let query = supabase
        .from('vendedores')
        .select('id, nome_vendedor, loja_vinculada')
        .eq('vendedor_ativo', true)
        .order('nome_vendedor');

      if (lojaId) {
        query = query.eq('loja_vinculada', lojaId);
      } else if (lojaFiltro !== 'todas') {
        query = query.eq('loja_vinculada', lojaFiltro);
      }

      const { data } = await query;
      if (data) setVendedores(data);
    } catch (error) {
      console.error('Erro ao carregar vendedores:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const dataInicio = `${mesReferencia}-01`;
      const dataFim = new Date(mesReferencia + '-01');
      dataFim.setMonth(dataFim.getMonth() + 1);
      const dataFimStr = dataFim.toISOString().slice(0, 10);

      let query = supabase
        .from('metricas_funil_vendedor')
        .select(`
          *,
          vendedores!inner(nome_vendedor, loja_vinculada),
          lojas:loja_vinculada(nome_loja),
          fontes_prospeccao:fonte_prospeccao_id(id, nome_fonte)
        `)
        .eq('periodo_tipo', 'mensal')
        .gte('data_referencia', dataInicio)
        .lt('data_referencia', dataFimStr);

      if (usuario?.perfil === 'gerente' || usuario?.perfil === 'apoio_loja') {
        query = query.eq('loja_vinculada', usuario.loja_vinculada);
      } else if (usuario?.perfil === 'vendedor') {
        const { data: vendedorData } = await supabase
          .from('vendedores')
          .select('id')
          .eq('email_vendedor', usuario.email_usuario)
          .maybeSingle();

        if (vendedorData) {
          query = query.eq('vendedor_id', vendedorData.id);
        }
      }

      if (lojaFiltro !== 'todas' && usuario?.perfil === 'regional') {
        query = query.eq('loja_vinculada', lojaFiltro);
      }

      if (vendedorFiltro !== 'todos') {
        query = query.eq('vendedor_id', vendedorFiltro);
      }

      if (fonteFiltro !== 'todas') {
        query = query.eq('fonte_prospeccao_id', fonteFiltro);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        const funilFormatado = data.map((item: any) => ({
          vendedor_nome: item.vendedores?.nome_vendedor,
          loja_nome: item.lojas?.nome_loja,
          fonte: item.fontes_prospeccao || null,
          meta_vendas: item.meta_vendas || 0,
          meta_atendimentos: item.meta_atendimentos || 0,
          meta_agendamentos: item.meta_agendamentos || 0,
          meta_test_drives: item.meta_test_drives || 0,
          meta_ligacoes: item.meta_ligacoes || 0,
          meta_base_minima: item.meta_base_minima || 0,
          base_prospeccao: item.base_prospeccao || 0,
          ligacoes_realizadas: item.ligacoes_realizadas || 0,
          ligacoes_sucesso: item.ligacoes_sucesso || 0,
          agendamentos_feitos: item.agendamentos_feitos || 0,
          atendimentos_realizados: item.atendimentos_realizados || 0,
          test_drives_realizados: item.test_drives_realizados || 0,
          vendas_realizadas: item.vendas_realizadas || 0,
          taxa_conversao: item.taxa_real_conversao || 0.33,
          taxa_comparecimento: item.taxa_real_comparecimento || 0.30,
          taxa_agendamento: item.taxa_real_agendamento || 0.30,
          taxa_contato: item.taxa_real_contato || 0.10,
        }));

        setFunilData(funilFormatado);
      } else {
        criarMetricasPadrao();
      }
    } catch (error) {
      console.error('Erro ao carregar dados do funil:', error);
      criarMetricasPadrao();
    } finally {
      setLoading(false);
    }
  };

  const criarMetricasPadrao = () => {
    const funilPadrao: FunilData = {
      meta_vendas: 10,
      meta_atendimentos: 30,
      meta_agendamentos: 100,
      meta_test_drives: 15,
      meta_ligacoes: 333,
      meta_base_minima: 3333,
      base_prospeccao: 0,
      ligacoes_realizadas: 0,
      ligacoes_sucesso: 0,
      agendamentos_feitos: 0,
      atendimentos_realizados: 0,
      test_drives_realizados: 0,
      vendas_realizadas: 0,
      taxa_conversao: 0.33,
      taxa_comparecimento: 0.30,
      taxa_agendamento: 0.30,
      taxa_contato: 0.10,
    };

    setFunilData([funilPadrao]);
  };

  const agregaDados = (dados: FunilData[]): FunilData => {
    if (dados.length === 0) {
      return {
        meta_vendas: 0,
        meta_atendimentos: 0,
        meta_agendamentos: 0,
        meta_test_drives: 0,
        meta_ligacoes: 0,
        meta_base_minima: 0,
        base_prospeccao: 0,
        ligacoes_realizadas: 0,
        ligacoes_sucesso: 0,
        agendamentos_feitos: 0,
        atendimentos_realizados: 0,
        test_drives_realizados: 0,
        vendas_realizadas: 0,
        taxa_conversao: 0.33,
        taxa_comparecimento: 0.30,
        taxa_agendamento: 0.30,
        taxa_contato: 0.10,
      };
    }

    const agregado = dados.reduce(
      (acc, curr) => ({
        meta_vendas: acc.meta_vendas + curr.meta_vendas,
        meta_atendimentos: acc.meta_atendimentos + curr.meta_atendimentos,
        meta_agendamentos: acc.meta_agendamentos + curr.meta_agendamentos,
        meta_test_drives: acc.meta_test_drives + curr.meta_test_drives,
        meta_ligacoes: acc.meta_ligacoes + curr.meta_ligacoes,
        meta_base_minima: acc.meta_base_minima + curr.meta_base_minima,
        base_prospeccao: acc.base_prospeccao + curr.base_prospeccao,
        ligacoes_realizadas: acc.ligacoes_realizadas + curr.ligacoes_realizadas,
        ligacoes_sucesso: acc.ligacoes_sucesso + curr.ligacoes_sucesso,
        agendamentos_feitos: acc.agendamentos_feitos + curr.agendamentos_feitos,
        atendimentos_realizados: acc.atendimentos_realizados + curr.atendimentos_realizados,
        test_drives_realizados: acc.test_drives_realizados + curr.test_drives_realizados,
        vendas_realizadas: acc.vendas_realizadas + curr.vendas_realizadas,
        taxa_conversao: curr.taxa_conversao,
        taxa_comparecimento: curr.taxa_comparecimento,
        taxa_agendamento: curr.taxa_agendamento,
        taxa_contato: curr.taxa_contato,
      }),
      {
        meta_vendas: 0,
        meta_atendimentos: 0,
        meta_agendamentos: 0,
        meta_test_drives: 0,
        meta_ligacoes: 0,
        meta_base_minima: 0,
        base_prospeccao: 0,
        ligacoes_realizadas: 0,
        ligacoes_sucesso: 0,
        agendamentos_feitos: 0,
        atendimentos_realizados: 0,
        test_drives_realizados: 0,
        vendas_realizadas: 0,
        taxa_conversao: 0.33,
        taxa_comparecimento: 0.30,
        taxa_agendamento: 0.30,
        taxa_contato: 0.10,
      }
    );

    const totalAtendimentos = agregado.atendimentos_realizados;
    const totalAgendamentos = agregado.agendamentos_feitos;
    const totalLigacoes = agregado.ligacoes_sucesso;
    const totalLigacoesRealizadas = agregado.ligacoes_realizadas;

    if (totalAtendimentos > 0) {
      agregado.taxa_conversao = agregado.vendas_realizadas / totalAtendimentos;
    }
    if (totalAgendamentos > 0) {
      agregado.taxa_comparecimento = totalAtendimentos / totalAgendamentos;
    }
    if (totalLigacoes > 0) {
      agregado.taxa_agendamento = totalAgendamentos / totalLigacoes;
    }
    if (totalLigacoesRealizadas > 0) {
      agregado.taxa_contato = totalLigacoes / totalLigacoesRealizadas;
    }

    return agregado;
  };

  const dadosAgregados = agregaDados(funilData);

  const calcularProgresso = (realizado: number, meta: number) => {
    if (meta === 0) return 0;
    return Math.min((realizado / meta) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando funil de vendas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Funil de Vendas</h1>
          <p className="text-slate-600 mt-1">Acompanhe as etapas da jornada de vendas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Mês de Referência
          </label>
          <input
            type="month"
            value={mesReferencia}
            onChange={(e) => setMesReferencia(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>

        {usuario?.perfil === 'regional' && (
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Filtrar por Loja
            </label>
            <Select
              value={lojaFiltro}
              onValueChange={(value) => {
                setLojaFiltro(value);
                setVendedorFiltro('todos');
                if (value !== 'todas') {
                  loadVendedoresPorLoja(value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Lojas</SelectItem>
                {lojas.map((loja) => (
                  <SelectItem key={loja.id} value={loja.id}>
                    {loja.nome_loja}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {(usuario?.perfil === 'regional' || usuario?.perfil === 'gerente') && vendedores.length > 0 && (
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Filtrar por Vendedor
            </label>
            <Select value={vendedorFiltro} onValueChange={setVendedorFiltro}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Vendedores</SelectItem>
                {vendedores.map((vendedor) => (
                  <SelectItem key={vendedor.id} value={vendedor.id}>
                    {vendedor.nome_vendedor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Filtrar por Fonte
          </label>
          <Select value={fonteFiltro} onValueChange={setFonteFiltro}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as Fontes</SelectItem>
              {fontes.map((fonte) => (
                <SelectItem key={fonte.id} value={fonte.id}>
                  {fonte.nome_fonte}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-slate-700" />
            Visão Geral do Funil
            {fonteFiltro !== 'todas' && (
              <span className="text-sm font-normal text-slate-600">
                - {fontes.find((f) => f.id === fonteFiltro)?.nome_fonte}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Taxas de conversão: Contato {(dadosAgregados.taxa_contato * 100).toFixed(0)}%
            • Agendamento {(dadosAgregados.taxa_agendamento * 100).toFixed(0)}%
            • Comparecimento {(dadosAgregados.taxa_comparecimento * 100).toFixed(0)}%
            • Venda {(dadosAgregados.taxa_conversao * 100).toFixed(0)}%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-sm text-slate-600 bg-white rounded-lg p-4 border border-slate-200">
              <p className="font-medium mb-2">Funil Simplificado:</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                  Prospecção
                </Badge>
                <ArrowRight className="h-4 w-4 text-slate-400 self-center" />
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                  Atendimentos
                </Badge>
                <ArrowRight className="h-4 w-4 text-slate-400 self-center" />
                <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-300">
                  Test Drives
                </Badge>
                <ArrowRight className="h-4 w-4 text-slate-400 self-center" />
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                  Firm Orders
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-2">Captação de usado não faz parte do funil</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-7 gap-4 items-center">
              <FunilEtapa
                icon={<Phone className="h-5 w-5" />}
                titulo="Prospecção"
                subtitulo="Ativa + Passiva"
                meta={dadosAgregados.meta_ligacoes}
                realizado={dadosAgregados.ligacoes_sucesso}
                cor="orange"
                descricao="Contatos"
              />

              <div className="flex items-center justify-center">
                <ArrowRight className="h-6 w-6 text-slate-400" />
              </div>

              <FunilEtapa
                icon={<Users className="h-5 w-5" />}
                titulo="Atendimentos"
                subtitulo=""
                meta={dadosAgregados.meta_atendimentos}
                realizado={dadosAgregados.atendimentos_realizados}
                cor="blue"
                descricao="Atendidos"
              />

              <div className="flex items-center justify-center">
                <ArrowRight className="h-6 w-6 text-slate-400" />
              </div>

              <FunilEtapa
                icon={<CarFront className="h-5 w-5" />}
                titulo="Test Drives"
                subtitulo=""
                meta={dadosAgregados.meta_test_drives}
                realizado={dadosAgregados.test_drives_realizados}
                cor="violet"
                descricao="Realizados"
              />

              <div className="flex items-center justify-center">
                <ArrowRight className="h-6 w-6 text-slate-400" />
              </div>

              <FunilEtapa
                icon={<Award className="h-5 w-5" />}
                titulo="Firm Orders"
                subtitulo=""
                meta={dadosAgregados.meta_vendas}
                realizado={dadosAgregados.vendas_realizadas}
                cor="green"
                descricao="Fechadas"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Base de Prospecção</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-2xl font-bold text-slate-800">
                  {dadosAgregados.base_prospeccao.toLocaleString()}
                </span>
                <span className="text-sm text-slate-600">
                  Meta: {dadosAgregados.meta_base_minima.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-slate-600 h-2 rounded-full transition-all"
                  style={{ width: `${calcularProgresso(dadosAgregados.base_prospeccao, dadosAgregados.meta_base_minima)}%` }}
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <AlertCircle className="h-4 w-4" />
                <span>
                  {calcularProgresso(dadosAgregados.base_prospeccao, dadosAgregados.meta_base_minima).toFixed(0)}% da meta
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Ligações c/ Sucesso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-2xl font-bold text-slate-800">
                  {dadosAgregados.ligacoes_sucesso}
                </span>
                <span className="text-sm text-slate-600">
                  Meta: {dadosAgregados.meta_ligacoes}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${calcularProgresso(dadosAgregados.ligacoes_sucesso, dadosAgregados.meta_ligacoes)}%` }}
                />
              </div>
              <div className="text-sm text-slate-600">
                {dadosAgregados.ligacoes_realizadas} ligações realizadas
                ({dadosAgregados.ligacoes_realizadas > 0
                  ? ((dadosAgregados.ligacoes_sucesso / dadosAgregados.ligacoes_realizadas) * 100).toFixed(0)
                  : 0}
                % sucesso)
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-2xl font-bold text-slate-800">
                  {dadosAgregados.agendamentos_feitos}
                </span>
                <span className="text-sm text-slate-600">
                  Meta: {dadosAgregados.meta_agendamentos}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${calcularProgresso(dadosAgregados.agendamentos_feitos, dadosAgregados.meta_agendamentos)}%` }}
                />
              </div>
              <div className="text-sm text-slate-600">
                Taxa de agendamento: {(dadosAgregados.taxa_agendamento * 100).toFixed(0)}%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Atendimentos Realizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-3xl font-bold text-slate-800">
                  {dadosAgregados.atendimentos_realizados}
                </span>
                <span className="text-sm text-slate-600">
                  Meta: {dadosAgregados.meta_atendimentos}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full transition-all"
                  style={{ width: `${calcularProgresso(dadosAgregados.atendimentos_realizados, dadosAgregados.meta_atendimentos)}%` }}
                />
              </div>
              <div className="text-sm text-slate-600">
                Taxa de comparecimento: {(dadosAgregados.taxa_comparecimento * 100).toFixed(0)}%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Vendas Realizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-3xl font-bold text-green-700">
                  {dadosAgregados.vendas_realizadas}
                </span>
                <span className="text-sm text-green-700">
                  Meta: {dadosAgregados.meta_vendas}
                </span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${calcularProgresso(dadosAgregados.vendas_realizadas, dadosAgregados.meta_vendas)}%` }}
                />
              </div>
              <div className="text-sm text-green-700 font-medium">
                Taxa de conversão: {(dadosAgregados.taxa_conversao * 100).toFixed(0)}%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {funilData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhamento por {vendedorFiltro !== 'todos' ? 'Vendedor' : 'Vendedores'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {funilData.map((item, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-800">{item.vendedor_nome}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-slate-600">{item.loja_nome}</p>
                        {item.fonte && <FonteBadge fonte={item.fonte} />}
                      </div>
                    </div>
                    <Badge variant={item.vendas_realizadas >= item.meta_vendas ? 'default' : 'secondary'}>
                      {item.vendas_realizadas}/{item.meta_vendas} vendas
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-7 gap-3 text-sm">
                    <div>
                      <p className="text-slate-600">Base</p>
                      <p className="font-semibold">{item.base_prospeccao}/{item.meta_base_minima}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Ligações</p>
                      <p className="font-semibold">{item.ligacoes_sucesso}/{item.meta_ligacoes}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Agendamentos</p>
                      <p className="font-semibold">{item.agendamentos_feitos}/{item.meta_agendamentos}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Atendimentos</p>
                      <p className="font-semibold">{item.atendimentos_realizados}/{item.meta_atendimentos}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Test Drives</p>
                      <p className="font-semibold">{item.test_drives_realizados}/{item.meta_test_drives}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Vendas</p>
                      <p className="font-semibold text-green-600">{item.vendas_realizadas}/{item.meta_vendas}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Conversão</p>
                      <p className="font-semibold">{(item.taxa_conversao * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FunilEtapa({
  icon,
  titulo,
  subtitulo,
  meta,
  realizado,
  cor,
  descricao,
}: {
  icon: ReactNode;
  titulo: string;
  subtitulo?: string;
  meta: number;
  realizado: number;
  cor: string;
  descricao: string;
}) {
  const progresso = meta > 0 ? (realizado / meta) * 100 : 0;

  const corClasses = {
    slate: 'bg-slate-100 text-slate-700 border-slate-300',
    blue: 'bg-blue-100 text-blue-700 border-blue-300',
    teal: 'bg-teal-100 text-teal-700 border-teal-300',
    amber: 'bg-amber-100 text-amber-700 border-amber-300',
    green: 'bg-green-100 text-green-700 border-green-300',
    orange: 'bg-orange-100 text-orange-700 border-orange-300',
    violet: 'bg-violet-100 text-violet-700 border-violet-300',
  };

  return (
    <div className={`border-2 rounded-lg p-3 ${corClasses[cor as keyof typeof corClasses]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <div>
          <h3 className="font-semibold text-xs leading-tight">{titulo}</h3>
          {subtitulo && <h4 className="text-xs leading-tight">{subtitulo}</h4>}
        </div>
      </div>
      <div className="space-y-2">
        <div>
          <div className="text-2xl font-bold">{realizado}</div>
          <div className="text-xs opacity-75">{descricao}</div>
        </div>
        <div className="text-xs">Meta: {meta}</div>
        <div className="w-full bg-white bg-opacity-50 rounded-full h-1.5">
          <div
            className="bg-current h-1.5 rounded-full transition-all"
            style={{ width: `${Math.min(progresso, 100)}%` }}
          />
        </div>
        <div className="text-xs font-medium">{progresso.toFixed(0)}%</div>
      </div>
    </div>
  );
}
