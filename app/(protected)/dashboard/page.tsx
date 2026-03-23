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
      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          {usuario?.perfil === 'regional' ? 'Dashboard Regional' : 'Dashboard da Loja'}
        </h1>
        <p className="text-slate-600 mt-1">
          Acompanhamento em tempo real - {new Date().toLocaleDateString('pt-BR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Firm Orders Hoje"
          value={data.firmOrdersHoje}
          subtitle="Vendas confirmadas"
          icon={Award}
          variant="success"
        />
        <StatCard
          title="Faturamento Hoje"
          value={formatCurrency(data.faturamentoHoje)}
          subtitle="Receita do dia"
          icon={DollarSign}
          variant="default"
        />
        <StatCard
          title="Test Drives"
          value={data.testDrivesHoje}
          subtitle="Realizados hoje"
          icon={TrendingUp}
          variant="default"
        />
        <StatCard
          title="Atendimentos"
          value={data.atendimentosHoje}
          subtitle="Total do dia"
          icon={Users}
          variant="default"
        />
      </div>

      {usuario?.perfil === 'regional' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Lojas Verde"
            value={data.lojasVerde}
            subtitle="≥ 90% da meta"
            variant="success"
          />
          <StatCard
            title="Lojas Amarelo"
            value={data.lojasAmarelo}
            subtitle="70-89% da meta"
            variant="warning"
          />
          <StatCard
            title="Lojas Vermelho"
            value={data.lojasVermelho}
            subtitle="< 70% da meta"
            variant="danger"
          />
          <StatCard
            title="Pendências"
            value={data.lojasPendentes}
            subtitle="Lançamentos atrasados"
            icon={AlertCircle}
            variant="default"
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {usuario?.perfil === 'regional' ? 'Ranking de Lojas' : 'Ranking de Vendedores'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {usuario?.perfil === 'regional' ? (
            rankingLojas.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Posição</TableHead>
                    <TableHead>Loja</TableHead>
                    <TableHead className="text-right">FO</TableHead>
                    <TableHead className="text-right">Test Drives</TableHead>
                    <TableHead className="text-right">Pontuação</TableHead>
                    <TableHead className="text-right">% Meta</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankingLojas.map((loja, index) => (
                    <TableRow key={loja.id}>
                      <TableCell className="font-bold">{index + 1}º</TableCell>
                      <TableCell className="font-medium">{loja.nome_loja}</TableCell>
                      <TableCell className="text-right">{loja.firm_orders}</TableCell>
                      <TableCell className="text-right">{loja.test_drives}</TableCell>
                      <TableCell className="text-right font-bold">{loja.pontuacao}</TableCell>
                      <TableCell className="text-right">{loja.percentual_meta.toFixed(1)}%</TableCell>
                      <TableCell>
                        <SemaforoBadge status={loja.status} size="sm" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">
                Nenhuma meta cadastrada para este mês
              </p>
            )
          ) : (
            rankingVendedores.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Posição</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-right">FO</TableHead>
                    <TableHead className="text-right">Test Drives</TableHead>
                    <TableHead className="text-right">Pontuação</TableHead>
                    <TableHead className="text-right">% Meta</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankingVendedores.map((vendedor, index) => (
                    <TableRow key={vendedor.id}>
                      <TableCell className="font-bold">{index + 1}º</TableCell>
                      <TableCell className="font-medium">{vendedor.nome_vendedor}</TableCell>
                      <TableCell className="text-right">{vendedor.firm_orders}</TableCell>
                      <TableCell className="text-right">{vendedor.test_drives}</TableCell>
                      <TableCell className="text-right font-bold">{vendedor.pontuacao}</TableCell>
                      <TableCell className="text-right">{vendedor.percentual_meta.toFixed(1)}%</TableCell>
                      <TableCell>
                        <SemaforoBadge status={vendedor.status} size="sm" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">
                Nenhum vendedor ativo cadastrado
              </p>
            )
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Funil Comercial do Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Atendimentos</span>
              <span className="text-lg font-bold">{data.atendimentosHoje}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: data.atendimentosHoje > 0 ? '100%' : '0%'
                }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Test Drives</span>
              <span className="text-lg font-bold">{data.testDrivesHoje}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: data.atendimentosHoje > 0
                    ? `${(data.testDrivesHoje / data.atendimentosHoje) * 100}%`
                    : '0%'
                }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Firm Orders</span>
              <span className="text-lg font-bold">{data.firmOrdersHoje}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{
                  width: data.testDrivesHoje > 0
                    ? `${(data.firmOrdersHoje / data.testDrivesHoje) * 100}%`
                    : '0%'
                }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
