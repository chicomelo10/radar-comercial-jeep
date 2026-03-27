'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Radar, TriangleAlert as AlertTriangle, TrendingUp, TrendingDown, Users, Building2, Target, Phone, Calendar, ShoppingCart, FileText } from 'lucide-react';
import { SemaforoBadge } from '@/components/dashboard/semaforo-badge';
import { FonteBadge } from '@/components/dashboard/fonte-badge';

type RadarMetrics = {
  base_prospeccao: number;
  ligacoes_realizadas: number;
  ligacoes_sucesso: number;
  agendamentos_feitos: number;
  atendimentos_realizados: number;
  vendas_realizadas: number;
  meta_vendas: number;
  taxa_conversao: number;
  taxa_comparecimento: number;
};

type LojaPerformance = {
  loja_id: string;
  loja_nome: string;
  vendas: number;
  meta: number;
  percentual: number;
  status: 'verde' | 'amarelo' | 'vermelho';
};

type VendedorPerformance = {
  vendedor_id: string;
  vendedor_nome: string;
  loja_nome: string;
  fonte_nome?: string;
  vendas: number;
  meta: number;
  percentual: number;
  status: 'verde' | 'amarelo' | 'vermelho';
  atendimentos: number;
  agendamentos: number;
};

type FontePerformance = {
  fonte_id: string;
  fonte_nome: string;
  total_vendas: number;
  total_atendimentos: number;
  taxa_conversao: number;
};

type Alerta = {
  tipo: 'critico' | 'atencao' | 'sucesso';
  mensagem: string;
  vendedor?: string;
  loja?: string;
};

export default function RadarComercialPage() {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mesReferencia, setMesReferencia] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [lojaFiltro, setLojaFiltro] = useState<string>('todas');
  const [metricsGerais, setMetricsGerais] = useState<RadarMetrics | null>(null);
  const [lojasPerformance, setLojasPerformance] = useState<LojaPerformance[]>([]);
  const [vendedoresPerformance, setVendedoresPerformance] = useState<VendedorPerformance[]>([]);
  const [fontesPerformance, setFontesPerformance] = useState<FontePerformance[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [lojas, setLojas] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [mesReferencia, lojaFiltro, usuario]);

  useEffect(() => {
    loadLojas();
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

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        processarDados(data);
      } else {
        setMetricsGerais({
          base_prospeccao: 0,
          ligacoes_realizadas: 0,
          ligacoes_sucesso: 0,
          agendamentos_feitos: 0,
          atendimentos_realizados: 0,
          vendas_realizadas: 0,
          meta_vendas: 0,
          taxa_conversao: 0.33,
          taxa_comparecimento: 0.30,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados do radar:', error);
    } finally {
      setLoading(false);
    }
  };

  const processarDados = (data: any[]) => {
    const metrics: RadarMetrics = {
      base_prospeccao: 0,
      ligacoes_realizadas: 0,
      ligacoes_sucesso: 0,
      agendamentos_feitos: 0,
      atendimentos_realizados: 0,
      vendas_realizadas: 0,
      meta_vendas: 0,
      taxa_conversao: 0.33,
      taxa_comparecimento: 0.30,
    };

    const lojaMap = new Map<string, LojaPerformance>();
    const vendedorList: VendedorPerformance[] = [];
    const fonteMap = new Map<string, FontePerformance>();
    const alertasList: Alerta[] = [];

    data.forEach((item: any) => {
      metrics.base_prospeccao += item.base_prospeccao || 0;
      metrics.ligacoes_realizadas += item.ligacoes_realizadas || 0;
      metrics.ligacoes_sucesso += item.ligacoes_sucesso || 0;
      metrics.agendamentos_feitos += item.agendamentos_feitos || 0;
      metrics.atendimentos_realizados += item.atendimentos_realizados || 0;
      metrics.vendas_realizadas += item.vendas_realizadas || 0;
      metrics.meta_vendas += item.meta_vendas || 0;

      const lojaId = item.loja_vinculada;
      const lojaNome = item.lojas?.nome_loja || 'Loja';

      if (!lojaMap.has(lojaId)) {
        lojaMap.set(lojaId, {
          loja_id: lojaId,
          loja_nome: lojaNome,
          vendas: 0,
          meta: 0,
          percentual: 0,
          status: 'vermelho',
        });
      }

      const lojaData = lojaMap.get(lojaId)!;
      lojaData.vendas += item.vendas_realizadas || 0;
      lojaData.meta += item.meta_vendas || 0;

      const vendedorPercentual = item.meta_vendas > 0
        ? ((item.vendas_realizadas || 0) / item.meta_vendas) * 100
        : 0;

      let vendedorStatus: 'verde' | 'amarelo' | 'vermelho' = 'vermelho';
      if (vendedorPercentual >= 90) vendedorStatus = 'verde';
      else if (vendedorPercentual >= 70) vendedorStatus = 'amarelo';

      vendedorList.push({
        vendedor_id: item.vendedor_id,
        vendedor_nome: item.vendedores?.nome_vendedor || 'Vendedor',
        loja_nome: lojaNome,
        fonte_nome: item.fontes_prospeccao?.nome_fonte,
        vendas: item.vendas_realizadas || 0,
        meta: item.meta_vendas || 0,
        percentual: vendedorPercentual,
        status: vendedorStatus,
        atendimentos: item.atendimentos_realizados || 0,
        agendamentos: item.agendamentos_feitos || 0,
      });

      if (vendedorPercentual < 50 && item.meta_vendas > 0) {
        alertasList.push({
          tipo: 'critico',
          mensagem: `Performance crítica (${vendedorPercentual.toFixed(0)}% da meta)`,
          vendedor: item.vendedores?.nome_vendedor,
          loja: lojaNome,
        });
      } else if (vendedorPercentual >= 100) {
        alertasList.push({
          tipo: 'sucesso',
          mensagem: `Meta batida! (${vendedorPercentual.toFixed(0)}%)`,
          vendedor: item.vendedores?.nome_vendedor,
          loja: lojaNome,
        });
      }

      if (item.fontes_prospeccao) {
        const fonteId = item.fontes_prospeccao.id;
        const fonteNome = item.fontes_prospeccao.nome_fonte;

        if (!fonteMap.has(fonteId)) {
          fonteMap.set(fonteId, {
            fonte_id: fonteId,
            fonte_nome: fonteNome,
            total_vendas: 0,
            total_atendimentos: 0,
            taxa_conversao: 0,
          });
        }

        const fonteData = fonteMap.get(fonteId)!;
        fonteData.total_vendas += item.vendas_realizadas || 0;
        fonteData.total_atendimentos += item.atendimentos_realizados || 0;
      }
    });

    lojaMap.forEach((loja) => {
      loja.percentual = loja.meta > 0 ? (loja.vendas / loja.meta) * 100 : 0;
      if (loja.percentual >= 90) loja.status = 'verde';
      else if (loja.percentual >= 70) loja.status = 'amarelo';
      else loja.status = 'vermelho';
    });

    fonteMap.forEach((fonte) => {
      fonte.taxa_conversao = fonte.total_atendimentos > 0
        ? (fonte.total_vendas / fonte.total_atendimentos) * 100
        : 0;
    });

    if (metrics.atendimentos_realizados > 0) {
      metrics.taxa_conversao = metrics.vendas_realizadas / metrics.atendimentos_realizados;
    }
    if (metrics.agendamentos_feitos > 0) {
      metrics.taxa_comparecimento = metrics.atendimentos_realizados / metrics.agendamentos_feitos;
    }

    setMetricsGerais(metrics);
    setLojasPerformance(Array.from(lojaMap.values()).sort((a, b) => b.vendas - a.vendas));
    setVendedoresPerformance(vendedorList.sort((a, b) => b.vendas - a.vendas));
    setFontesPerformance(Array.from(fonteMap.values()).sort((a, b) => b.total_vendas - a.total_vendas));
    setAlertas(alertasList.slice(0, 10));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando Radar Comercial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Radar className="h-8 w-8 text-slate-700" />
            <h1 className="text-3xl font-bold text-slate-800">Radar Comercial Jeep</h1>
          </div>
          <p className="text-slate-600 mt-1">Visão gerencial de performance e gargalos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Select value={lojaFiltro} onValueChange={setLojaFiltro}>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Ligações c/ Sucesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{metricsGerais?.ligacoes_sucesso || 0}</div>
            <p className="text-xs text-slate-500 mt-1">
              {metricsGerais?.ligacoes_realizadas || 0} tentativas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{metricsGerais?.agendamentos_feitos || 0}</div>
            <p className="text-xs text-slate-500 mt-1">
              Taxa: {metricsGerais ? ((metricsGerais.taxa_comparecimento * 100).toFixed(0)) : 0}% comparecimento
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Atendimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{metricsGerais?.atendimentos_realizados || 0}</div>
            <p className="text-xs text-slate-500 mt-1">
              Taxa: {metricsGerais ? ((metricsGerais.taxa_conversao * 100).toFixed(0)) : 0}% conversão
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Vendas Realizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{metricsGerais?.vendas_realizadas || 0}</div>
            <p className="text-xs text-green-600 mt-1">
              Meta: {metricsGerais?.meta_vendas || 0} ({metricsGerais && metricsGerais.meta_vendas > 0 ? ((metricsGerais.vendas_realizadas / metricsGerais.meta_vendas) * 100).toFixed(0) : 0}%)
            </p>
          </CardContent>
        </Card>
      </div>

      {alertas.length > 0 && (
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Alertas e Destaques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alertas.map((alerta, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    alerta.tipo === 'critico'
                      ? 'bg-red-50 border border-red-200'
                      : alerta.tipo === 'atencao'
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'bg-green-50 border border-green-200'
                  }`}
                >
                  {alerta.tipo === 'critico' ? (
                    <TrendingDown className="h-4 w-4 text-red-600 mt-0.5" />
                  ) : alerta.tipo === 'sucesso' ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  )}
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-slate-800">{alerta.mensagem}</p>
                    {alerta.vendedor && (
                      <p className="text-slate-600 text-xs mt-1">
                        {alerta.vendedor} • {alerta.loja}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Resumo do Funil
            </CardTitle>
            <CardDescription>Visão consolidada das etapas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Contatos</span>
                </div>
                <span className="text-lg font-bold">{metricsGerais?.ligacoes_sucesso || 0}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-teal-600" />
                  <span className="text-sm font-medium">Agendamentos</span>
                </div>
                <span className="text-lg font-bold">{metricsGerais?.agendamentos_feitos || 0}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-teal-600 h-2 rounded-full"
                  style={{
                    width: metricsGerais && metricsGerais.ligacoes_sucesso > 0
                      ? `${(metricsGerais.agendamentos_feitos / metricsGerais.ligacoes_sucesso) * 100}%`
                      : '0%'
                  }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium">Atendimentos</span>
                </div>
                <span className="text-lg font-bold">{metricsGerais?.atendimentos_realizados || 0}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-amber-600 h-2 rounded-full"
                  style={{
                    width: metricsGerais && metricsGerais.agendamentos_feitos > 0
                      ? `${(metricsGerais.atendimentos_realizados / metricsGerais.agendamentos_feitos) * 100}%`
                      : '0%'
                  }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Vendas</span>
                </div>
                <span className="text-lg font-bold text-green-700">{metricsGerais?.vendas_realizadas || 0}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: metricsGerais && metricsGerais.atendimentos_realizados > 0
                      ? `${(metricsGerais.vendas_realizadas / metricsGerais.atendimentos_realizados) * 100}%`
                      : '0%'
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Fontes de Prospecção
            </CardTitle>
            <CardDescription>Performance por origem</CardDescription>
          </CardHeader>
          <CardContent>
            {fontesPerformance.length > 0 ? (
              <div className="space-y-3">
                {fontesPerformance.map((fonte) => (
                  <div key={fonte.fonte_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <FonteBadge fonte={{ id: fonte.fonte_id, nome_fonte: fonte.fonte_nome }} />
                      <p className="text-xs text-slate-600 mt-1">
                        {fonte.total_atendimentos} atendimentos
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-800">{fonte.total_vendas}</p>
                      <p className="text-xs text-slate-600">vendas</p>
                      <p className="text-xs text-green-600 font-medium">
                        {fonte.taxa_conversao.toFixed(0)}% conversão
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">
                Nenhuma fonte com dados no período
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {usuario?.perfil === 'regional' && lojasPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Performance por Loja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loja</TableHead>
                  <TableHead className="text-right">Vendas</TableHead>
                  <TableHead className="text-right">Meta</TableHead>
                  <TableHead className="text-right">% Meta</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lojasPerformance.map((loja) => (
                  <TableRow key={loja.loja_id}>
                    <TableCell className="font-medium">{loja.loja_nome}</TableCell>
                    <TableCell className="text-right font-bold">{loja.vendas}</TableCell>
                    <TableCell className="text-right">{loja.meta}</TableCell>
                    <TableCell className="text-right">{loja.percentual.toFixed(1)}%</TableCell>
                    <TableCell>
                      <SemaforoBadge status={loja.status} size="sm" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Ranking de Vendedores
          </CardTitle>
          <CardDescription>Top performance do período</CardDescription>
        </CardHeader>
        <CardContent>
          {vendedoresPerformance.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posição</TableHead>
                  <TableHead>Vendedor</TableHead>
                  {usuario?.perfil === 'regional' && <TableHead>Loja</TableHead>}
                  <TableHead className="text-right">Vendas</TableHead>
                  <TableHead className="text-right">Meta</TableHead>
                  <TableHead className="text-right">% Meta</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendedoresPerformance.slice(0, 10).map((vendedor, index) => (
                  <TableRow key={vendedor.vendedor_id}>
                    <TableCell className="font-bold">
                      {index < 3 ? (
                        <Badge variant={index === 0 ? 'default' : 'secondary'}>
                          {index + 1}º
                        </Badge>
                      ) : (
                        `${index + 1}º`
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{vendedor.vendedor_nome}</TableCell>
                    {usuario?.perfil === 'regional' && (
                      <TableCell className="text-sm text-slate-600">{vendedor.loja_nome}</TableCell>
                    )}
                    <TableCell className="text-right font-bold text-green-700">{vendedor.vendas}</TableCell>
                    <TableCell className="text-right">{vendedor.meta}</TableCell>
                    <TableCell className="text-right">{vendedor.percentual.toFixed(1)}%</TableCell>
                    <TableCell>
                      <SemaforoBadge status={vendedor.status} size="sm" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">
              Nenhum vendedor com dados no período
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
