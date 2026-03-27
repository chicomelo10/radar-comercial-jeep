'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { StatCard } from '@/components/dashboard/stat-card';
import { SemaforoBadge, calcularSemaforo } from '@/components/dashboard/semaforo-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrendingUp, DollarSign, Users, Award, Building2, CircleAlert as AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type DashboardData = {
  firmOrdersHoje: number;
  faturamentoHoje: number;
  testDrivesHoje: number;
  atendimentosHoje: number;
  lojasVerde: number;
  lojasAmarelo: number;
  lojasVermelho: number;
  lojasPendentes: number;
};

type RankingLoja = {
  id: string;
  nome_loja: string;
  firm_orders: number;
  test_drives: number;
  pontuacao: number;
  percentual_meta: number;
  status: 'verde' | 'amarelo' | 'vermelho';
};

type RankingVendedor = {
  id: string;
  nome_vendedor: string;
  firm_orders: number;
  test_drives: number;
  pontuacao: number;
  percentual_meta: number;
  status: 'verde' | 'amarelo' | 'vermelho';
};

export default function DashboardPage() {
  const { usuario } = useAuth();
  const [data, setData] = useState<DashboardData>({
    firmOrdersHoje: 0,
    faturamentoHoje: 0,
    testDrivesHoje: 0,
    atendimentosHoje: 0,
    lojasVerde: 0,
    lojasAmarelo: 0,
    lojasVermelho: 0,
    lojasPendentes: 0,
  });
  const [rankingLojas, setRankingLojas] = useState<RankingLoja[]>([]);
  const [rankingVendedores, setRankingVendedores] = useState<RankingVendedor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [usuario]);

  const loadDashboard = async () => {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      const mesAtual = new Date().toISOString().slice(0, 7);

      if (usuario?.perfil === 'regional') {
        const { data: lancamentos } = await supabase
          .from('lancamentos_loja')
          .select('*, lojas:loja_vinculada(nome_loja)')
          .eq('data_referencia', hoje);

        const { data: todasLojas } = await supabase
          .from('lojas')
          .select('id, nome_loja, loja_ativa')
          .eq('loja_ativa', true);

        const { data: metas } = await supabase
          .from('metas_mensais')
          .select('*, lojas:loja_vinculada(nome_loja)')
          .eq('mes_referencia', mesAtual);

        const { data: lancamentosMes } = await supabase
          .from('lancamentos_loja')
          .select('*')
          .gte('data_referencia', `${mesAtual}-01`)
          .lte('data_referencia', `${mesAtual}-31`);

        if (lancamentos) {
          const firmOrders = lancamentos.reduce((sum, l) => sum + (l.firm_orders || 0), 0);
          const faturamento = lancamentos.reduce((sum, l) => sum + (l.faturamento || 0), 0);
          const testDrives = lancamentos.reduce((sum, l) => sum + (l.test_drives || 0), 0);
          const atendimentos = lancamentos.reduce((sum, l) => sum + (l.atendimentos || 0), 0);

          let lojasVerde = 0;
          let lojasAmarelo = 0;
          let lojasVermelho = 0;
          let lojasPendentes = 0;

          const lojasComLancamentoHoje = new Set(lancamentos.map(l => l.loja_vinculada));

          if (todasLojas) {
            lojasPendentes = todasLojas.filter(loja => !lojasComLancamentoHoje.has(loja.id)).length;
          }

          if (metas && lancamentosMes) {
            const lojasMeta = new Map();
            metas.forEach(meta => {
              lojasMeta.set(meta.loja_vinculada, meta.meta_firm_orders);
            });

            const lojasRealizacao = new Map();
            lancamentosMes.forEach(lanc => {
              const atual = lojasRealizacao.get(lanc.loja_vinculada) || 0;
              lojasRealizacao.set(lanc.loja_vinculada, atual + (lanc.firm_orders || 0));
            });

            lojasMeta.forEach((meta, lojaId) => {
              const realizado = lojasRealizacao.get(lojaId) || 0;
              const percentual = meta > 0 ? (realizado / meta) * 100 : 0;

              if (percentual >= 90) lojasVerde++;
              else if (percentual >= 70) lojasAmarelo++;
              else lojasVermelho++;
            });
          }

          setData({
            firmOrdersHoje: firmOrders,
            faturamentoHoje: faturamento,
            testDrivesHoje: testDrives,
            atendimentosHoje: atendimentos,
            lojasVerde,
            lojasAmarelo,
            lojasVermelho,
            lojasPendentes,
          });

          const rankingLojasArray: RankingLoja[] = [];
          metas?.forEach(meta => {
            const lojaId = meta.loja_vinculada;
            const realizado = lancamentosMes?.filter(l => l.loja_vinculada === lojaId)
              .reduce((sum, l) => sum + (l.firm_orders || 0), 0) || 0;
            const testDrivesTotal = lancamentosMes?.filter(l => l.loja_vinculada === lojaId)
              .reduce((sum, l) => sum + (l.test_drives || 0), 0) || 0;
            const percentual = meta.meta_firm_orders > 0 ? (realizado / meta.meta_firm_orders) * 100 : 0;
            const pontuacao = (realizado * 10) + (testDrivesTotal * 2);

            let status: 'verde' | 'amarelo' | 'vermelho' = 'vermelho';
            if (percentual >= 90) status = 'verde';
            else if (percentual >= 70) status = 'amarelo';

            rankingLojasArray.push({
              id: lojaId,
              nome_loja: (meta.lojas as any)?.nome_loja || 'Loja',
              firm_orders: realizado,
              test_drives: testDrivesTotal,
              pontuacao,
              percentual_meta: percentual,
              status,
            });
          });

          rankingLojasArray.sort((a, b) => b.pontuacao - a.pontuacao);
          setRankingLojas(rankingLojasArray);
        }
      } else if (usuario?.loja_vinculada) {
        const { data: lancamento } = await supabase
          .from('lancamentos_loja')
          .select('*')
          .eq('data_referencia', hoje)
          .eq('loja_vinculada', usuario.loja_vinculada)
          .maybeSingle();

        if (lancamento) {
          setData({
            firmOrdersHoje: lancamento.firm_orders || 0,
            faturamentoHoje: lancamento.faturamento || 0,
            testDrivesHoje: lancamento.test_drives || 0,
            atendimentosHoje: lancamento.atendimentos || 0,
            lojasVerde: 0,
            lojasAmarelo: 0,
            lojasVermelho: 0,
            lojasPendentes: 0,
          });
        }

        const { data: vendedoresLoja } = await supabase
          .from('vendedores')
          .select('id, nome_vendedor')
          .eq('loja_vinculada', usuario.loja_vinculada)
          .eq('vendedor_ativo', true);

        const { data: metaVendedores } = await supabase
          .from('metas_mensais')
          .select('meta_firm_orders_vendedor')
          .eq('loja_vinculada', usuario.loja_vinculada)
          .eq('mes_referencia', mesAtual)
          .maybeSingle();

        const { data: lancamentosVendedores } = await supabase
          .from('lancamentos_vendedor')
          .select('*')
          .in('vendedor_vinculado', vendedoresLoja?.map(v => v.id) || [])
          .gte('data_referencia', `${mesAtual}-01`)
          .lte('data_referencia', `${mesAtual}-31`);

        const rankingVendedoresArray: RankingVendedor[] = [];
        vendedoresLoja?.forEach(vendedor => {
          const lancamentosVendedor = lancamentosVendedores?.filter(l => l.vendedor_vinculado === vendedor.id) || [];
          const firmOrders = lancamentosVendedor.reduce((sum, l) => sum + (l.firm_orders || 0), 0);
          const testDrives = lancamentosVendedor.reduce((sum, l) => sum + (l.test_drives || 0), 0);
          const pontuacao = (firmOrders * 10) + (testDrives * 2);
          const metaVendedor = metaVendedores?.meta_firm_orders_vendedor || 0;
          const percentual = metaVendedor > 0 ? (firmOrders / metaVendedor) * 100 : 0;

          let status: 'verde' | 'amarelo' | 'vermelho' = 'vermelho';
          if (percentual >= 90) status = 'verde';
          else if (percentual >= 70) status = 'amarelo';

          rankingVendedoresArray.push({
            id: vendedor.id,
            nome_vendedor: vendedor.nome_vendedor,
            firm_orders: firmOrders,
            test_drives: testDrives,
            pontuacao,
            percentual_meta: percentual,
            status,
          });
        });

        rankingVendedoresArray.sort((a, b) => b.pontuacao - a.pontuacao);
        setRankingVendedores(rankingVendedoresArray);
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-800">
          {usuario?.perfil === 'regional' ? 'Regional' : 'Dashboard'}
        </h1>
        <p className="text-slate-500 mt-2">
          {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-green-900">{data.firmOrdersHoje}</div>
            <div className="text-sm text-green-700 font-medium">Firm Orders</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-purple-900">{data.testDrivesHoje}</div>
            <div className="text-sm text-purple-700 font-medium">Test Drives</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-blue-900">{data.atendimentosHoje}</div>
            <div className="text-sm text-blue-700 font-medium">Atendimentos</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 text-amber-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-amber-900">{formatCurrency(data.faturamentoHoje)}</div>
            <div className="text-sm text-amber-700 font-medium">Faturamento</div>
          </CardContent>
        </Card>
      </div>

      {usuario?.perfil === 'regional' && (
        <div className="grid grid-cols-4 gap-3">
          <Card className="bg-green-50 border-green-300">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-green-700">{data.lojasVerde}</div>
              <div className="text-xs text-green-600">Verde</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-300">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-yellow-700">{data.lojasAmarelo}</div>
              <div className="text-xs text-yellow-600">Amarelo</div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-300">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-red-700">{data.lojasVermelho}</div>
              <div className="text-xs text-red-600">Vermelho</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-50 border-slate-300">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-slate-700">{data.lojasPendentes}</div>
              <div className="text-xs text-slate-600">Pendentes</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            {usuario?.perfil === 'regional' ? '🏆 Ranking de Lojas' : '🏆 Ranking da Equipe'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usuario?.perfil === 'regional' ? (
            rankingLojas.length > 0 ? (
              <div className="space-y-2">
                {rankingLojas.slice(0, 5).map((loja, index) => (
                  <div key={loja.id} className={`p-4 rounded-lg border-2 ${
                    index === 0 ? 'bg-yellow-50 border-yellow-300' :
                    index === 1 ? 'bg-slate-100 border-slate-300' :
                    index === 2 ? 'bg-orange-50 border-orange-300' :
                    'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`text-2xl font-bold ${
                          index === 0 ? 'text-yellow-600' :
                          index === 1 ? 'text-slate-600' :
                          index === 2 ? 'text-orange-600' :
                          'text-slate-400'
                        }`}>
                          {index + 1}º
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{loja.nome_loja}</div>
                          <div className="text-sm text-slate-600">{loja.firm_orders} FO • {loja.test_drives} TD</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-slate-900">{loja.pontuacao}</div>
                        <SemaforoBadge status={loja.status} size="sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">
                Nenhuma meta cadastrada
              </p>
            )
          ) : (
            rankingVendedores.length > 0 ? (
              <div className="space-y-2">
                {rankingVendedores.slice(0, 5).map((vendedor, index) => (
                  <div key={vendedor.id} className={`p-4 rounded-lg border-2 ${
                    index === 0 ? 'bg-yellow-50 border-yellow-300' :
                    index === 1 ? 'bg-slate-100 border-slate-300' :
                    index === 2 ? 'bg-orange-50 border-orange-300' :
                    'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`text-2xl font-bold ${
                          index === 0 ? 'text-yellow-600' :
                          index === 1 ? 'text-slate-600' :
                          index === 2 ? 'text-orange-600' :
                          'text-slate-400'
                        }`}>
                          {index + 1}º
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{vendedor.nome_vendedor}</div>
                          <div className="text-sm text-slate-600">{vendedor.firm_orders} FO • {vendedor.test_drives} TD</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-slate-900">{vendedor.pontuacao}</div>
                        <SemaforoBadge status={vendedor.status} size="sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">
                Nenhum vendedor ativo
              </p>
            )
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
        <CardHeader>
          <CardTitle className="text-center">Funil do Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-blue-900">Atendimentos</span>
                <span className="text-2xl font-bold text-blue-900">{data.atendimentosHoje}</span>
              </div>
              <div className="w-full bg-blue-100 rounded-full h-3">
                <div className="bg-blue-600 h-3 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-purple-900">Test Drives</span>
                <span className="text-2xl font-bold text-purple-900">{data.testDrivesHoje}</span>
              </div>
              <div className="w-full bg-purple-100 rounded-full h-3">
                <div
                  className="bg-purple-600 h-3 rounded-full transition-all"
                  style={{
                    width: data.atendimentosHoje > 0
                      ? `${Math.min((data.testDrivesHoje / data.atendimentosHoje) * 100, 100)}%`
                      : '0%'
                  }}
                ></div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border-2 border-green-200">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-green-900">Firm Orders</span>
                <span className="text-2xl font-bold text-green-900">{data.firmOrdersHoje}</span>
              </div>
              <div className="w-full bg-green-100 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all"
                  style={{
                    width: data.testDrivesHoje > 0
                      ? `${Math.min((data.firmOrdersHoje / data.testDrivesHoje) * 100, 100)}%`
                      : '0%'
                  }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
