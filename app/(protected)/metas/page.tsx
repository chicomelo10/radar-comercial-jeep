'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader as Loader2, Save, Target, TrendingUp, Users, Car, Award, PhoneOutgoing, User } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

type Meta = {
  id: string;
  mes_referencia: string;
  meta_prospeccao: number;
  meta_atendimentos: number;
  meta_test_drives: number;
  meta_firm_orders: number;
  meta_captacao_usado: number;
  modo_distribuicao_meta: string;
};

type Vendedor = {
  id: string;
  nome_vendedor: string;
  status_vendedor: string;
  peso_historico_meta: number;
};

type MetaVendedor = {
  vendedor_id: string;
  meta_prospeccao: number;
  meta_atendimentos: number;
  meta_test_drives: number;
  meta_firm_orders: number;
  meta_captacao_usado: number;
};

export default function MetasPage() {
  const { usuario } = useAuth();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [metasVendedor, setMetasVendedor] = useState<MetaVendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [formData, setFormData] = useState({
    meta_prospeccao: 100,
    meta_atendimentos: 30,
    meta_test_drives: 15,
    meta_firm_orders: 10,
    meta_captacao_usado: 5,
    modo_distribuicao_meta: 'igual' as 'igual',
  });

  const isGerente = usuario?.perfil === 'gerente' || usuario?.perfil === 'regional';

  useEffect(() => {
    loadMeta();
    loadVendedores();
  }, [usuario]);

  const loadMeta = async () => {
    try {
      if (!usuario?.loja_vinculada) return;

      const mesAtual = new Date().toISOString().slice(0, 7) + '-01';

      const { data, error } = await supabase
        .from('metas_mensais')
        .select('*')
        .eq('loja_vinculada', usuario.loja_vinculada)
        .eq('mes_referencia', mesAtual)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setMeta(data);
        setFormData({
          meta_prospeccao: data.meta_prospeccao ?? 100,
          meta_atendimentos: data.meta_atendimentos ?? 30,
          meta_test_drives: data.meta_test_drives ?? 15,
          meta_firm_orders: data.meta_firm_orders ?? 10,
          meta_captacao_usado: data.meta_captacao_usado ?? 5,
          modo_distribuicao_meta: 'igual',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar meta:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVendedores = async () => {
    try {
      if (!usuario?.loja_vinculada) return;

      const { data, error } = await supabase
        .from('vendedores')
        .select('id, nome_vendedor, status_vendedor, peso_historico_meta')
        .eq('loja_vinculada', usuario.loja_vinculada)
        .eq('status_vendedor', 'ativo');

      if (error) throw error;
      setVendedores(data || []);

      const mesAtual = new Date().toISOString().slice(0, 7) + '-01';
      const { data: metasData } = await supabase
        .from('metas_vendedor')
        .select('*')
        .eq('loja_vinculada', usuario.loja_vinculada)
        .eq('mes_referencia', mesAtual);

      if (metasData) {
        setMetasVendedor(metasData);
      }
    } catch (error) {
      console.error('Erro ao carregar vendedores:', error);
    }
  };

  const calcularDistribuicao = (dadosFormulario = formData) => {
    if (vendedores.length === 0) return [];

    const vendedoresAtivos = vendedores.filter(v => v.status_vendedor === 'ativo');
    const distribuicao: MetaVendedor[] = [];

    const metaPorVendedor = {
      meta_prospeccao: Math.floor(dadosFormulario.meta_prospeccao / vendedoresAtivos.length),
      meta_atendimentos: Math.floor(dadosFormulario.meta_atendimentos / vendedoresAtivos.length),
      meta_test_drives: Math.floor(dadosFormulario.meta_test_drives / vendedoresAtivos.length),
      meta_firm_orders: Math.floor(dadosFormulario.meta_firm_orders / vendedoresAtivos.length),
      meta_captacao_usado: Math.floor(dadosFormulario.meta_captacao_usado / vendedoresAtivos.length),
    };

    vendedoresAtivos.forEach(v => {
      distribuicao.push({
        vendedor_id: v.id,
        ...metaPorVendedor,
      });
    });

    return distribuicao;
  };

  const handleSave = async () => {
    if (!usuario?.loja_vinculada) {
      toast.error('Loja não identificada');
      return;
    }

    setSaving(true);
    const mesAtual = new Date().toISOString().slice(0, 7) + '-01';

    try {
      if (meta) {
        const { data: updatedData, error } = await supabase
          .from('metas_mensais')
          .update({
            meta_prospeccao: formData.meta_prospeccao,
            meta_atendimentos: formData.meta_atendimentos,
            meta_test_drives: formData.meta_test_drives,
            meta_firm_orders: formData.meta_firm_orders,
            meta_captacao_usado: formData.meta_captacao_usado,
            modo_distribuicao_meta: formData.modo_distribuicao_meta,
            objetivo_vendas: formData.meta_firm_orders,
          })
          .eq('id', meta.id)
          .select();

        if (error) {
          console.error('Erro ao atualizar meta:', error);
          throw error;
        }
        console.log('Meta atualizada:', updatedData);
      } else {
        const { error } = await supabase
          .from('metas_mensais')
          .insert([{
            mes_referencia: mesAtual,
            loja_vinculada: usuario.loja_vinculada,
            objetivo_vendas: formData.meta_firm_orders,
            ...formData,
          }]);

        if (error) throw error;
      }

      const distribuicao = calcularDistribuicao();

      for (const metaVend of distribuicao) {
        const { error } = await supabase
          .from('metas_vendedor')
          .upsert({
            vendedor_id: metaVend.vendedor_id,
            loja_vinculada: usuario.loja_vinculada,
            mes_referencia: mesAtual,
            meta_prospeccao: metaVend.meta_prospeccao,
            meta_atendimentos: metaVend.meta_atendimentos,
            meta_test_drives: metaVend.meta_test_drives,
            meta_firm_orders: metaVend.meta_firm_orders,
            meta_captacao_usado: metaVend.meta_captacao_usado,
            modo_distribuicao: formData.modo_distribuicao_meta,
          }, {
            onConflict: 'vendedor_id,mes_referencia'
          });

        if (error) throw error;
      }

      toast.success('Metas distribuídas com sucesso!');
      setEditMode(false);
      await loadMeta();
      await loadVendedores();
    } catch (error) {
      console.error('Erro ao salvar metas:', error);
      toast.error('Erro ao salvar metas');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: number | string) => {
    const novoFormData = { ...formData, [field]: value };
    setFormData(novoFormData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  const distribuicaoSugerida = calcularDistribuicao(formData);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Metas Mensais</h1>
          <p className="text-slate-600 mt-1">
            Defina os objetivos da equipe para {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        {isGerente && !editMode && (
          <Button onClick={() => setEditMode(true)}>
            <Target className="h-4 w-4 mr-2" />
            Editar Metas
          </Button>
        )}
      </div>

      {!meta && !editMode ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-600 mb-2">Nenhuma meta cadastrada</p>
            <p className="text-slate-500 mb-6">Defina as metas do mês para acompanhar o desempenho da equipe</p>
            {isGerente && (
              <Button onClick={() => setEditMode(true)}>
                Criar Metas do Mês
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PhoneOutgoing className="h-4 w-4 text-orange-600" />
                  Prospecção
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <Input
                    type="number"
                    min="0"
                    value={formData.meta_prospeccao}
                    onChange={(e) => updateField('meta_prospeccao', parseInt(e.target.value) || 0)}
                    className="text-xl h-12"
                  />
                ) : (
                  <p className="text-2xl font-bold text-orange-600">{formData.meta_prospeccao}</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-blue-600" />
                  Atendimentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <Input
                    type="number"
                    min="0"
                    value={formData.meta_atendimentos}
                    onChange={(e) => updateField('meta_atendimentos', parseInt(e.target.value) || 0)}
                    className="text-xl h-12"
                  />
                ) : (
                  <p className="text-2xl font-bold text-blue-600">{formData.meta_atendimentos}</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-violet-600" />
                  Test Drives
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <Input
                    type="number"
                    min="0"
                    value={formData.meta_test_drives}
                    onChange={(e) => updateField('meta_test_drives', parseInt(e.target.value) || 0)}
                    className="text-xl h-12"
                  />
                ) : (
                  <p className="text-2xl font-bold text-violet-600">{formData.meta_test_drives}</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Award className="h-4 w-4 text-green-600" />
                  Firm Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <Input
                    type="number"
                    min="0"
                    value={formData.meta_firm_orders}
                    onChange={(e) => updateField('meta_firm_orders', parseInt(e.target.value) || 0)}
                    className="text-xl h-12 bg-white"
                  />
                ) : (
                  <p className="text-2xl font-bold text-green-600">{formData.meta_firm_orders}</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Car className="h-4 w-4 text-slate-600" />
                  Captação Usado
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <Input
                    type="number"
                    min="0"
                    value={formData.meta_captacao_usado}
                    onChange={(e) => updateField('meta_captacao_usado', parseInt(e.target.value) || 0)}
                    className="text-xl h-12"
                  />
                ) : (
                  <p className="text-2xl font-bold text-slate-700">{formData.meta_captacao_usado}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {editMode && distribuicaoSugerida.length > 0 && (
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle>Distribuição Sugerida por Vendedor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {distribuicaoSugerida.map((dist) => {
                    const vendedor = vendedores.find(v => v.id === dist.vendedor_id);
                    return (
                      <div key={dist.vendedor_id} className="bg-white p-4 rounded-lg border">
                        <div className="font-medium text-slate-800 mb-2">{vendedor?.nome_vendedor}</div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                          <div>
                            <span className="text-slate-600">Prosp:</span> <span className="font-semibold">{dist.meta_prospeccao}</span>
                          </div>
                          <div>
                            <span className="text-slate-600">Atend:</span> <span className="font-semibold">{dist.meta_atendimentos}</span>
                          </div>
                          <div>
                            <span className="text-slate-600">TD:</span> <span className="font-semibold">{dist.meta_test_drives}</span>
                          </div>
                          <div>
                            <span className="text-slate-600">FO:</span> <span className="font-semibold">{dist.meta_firm_orders}</span>
                          </div>
                          <div>
                            <span className="text-slate-600">Usado:</span> <span className="font-semibold">{dist.meta_captacao_usado}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {!editMode && metasVendedor.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Metas por Vendedor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metasVendedor.map((metaVend) => {
                    const vendedor = vendedores.find(v => v.id === metaVend.vendedor_id);
                    return (
                      <div key={metaVend.vendedor_id} className="p-4 rounded-lg border bg-slate-50">
                        <div className="font-medium text-slate-800 mb-2">{vendedor?.nome_vendedor}</div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                          <div>
                            <span className="text-slate-600">Prospecção:</span> <span className="font-semibold">{metaVend.meta_prospeccao}</span>
                          </div>
                          <div>
                            <span className="text-slate-600">Atendimentos:</span> <span className="font-semibold">{metaVend.meta_atendimentos}</span>
                          </div>
                          <div>
                            <span className="text-slate-600">Test Drives:</span> <span className="font-semibold">{metaVend.meta_test_drives}</span>
                          </div>
                          <div>
                            <span className="text-slate-600">Firm Orders:</span> <span className="font-semibold text-green-600">{metaVend.meta_firm_orders}</span>
                          </div>
                          <div>
                            <span className="text-slate-600">Captação:</span> <span className="font-semibold">{metaVend.meta_captacao_usado}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {editMode && (
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                size="lg"
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar e Distribuir Metas'}
              </Button>
              <Button
                onClick={() => {
                  setEditMode(false);
                  if (meta) {
                    setFormData({
                      meta_prospeccao: meta.meta_prospeccao ?? 100,
                      meta_atendimentos: meta.meta_atendimentos ?? 30,
                      meta_test_drives: meta.meta_test_drives ?? 15,
                      meta_firm_orders: meta.meta_firm_orders ?? 10,
                      meta_captacao_usado: meta.meta_captacao_usado ?? 5,
                      modo_distribuicao_meta: 'igual',
                    });
                  }
                }}
                variant="outline"
                size="lg"
                disabled={saving}
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
