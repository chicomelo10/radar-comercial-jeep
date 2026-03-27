'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, TrendingUp, Award, PhoneOutgoing, PhoneIncoming, Users, Car } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export default function MeuLancamentoPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [vendedorId, setVendedorId] = useState<string | null>(null);
  const [lojaId, setLojaId] = useState<string | null>(null);
  const [meta, setMeta] = useState<number>(0);
  const [formData, setFormData] = useState({
    prospeccao_ativa: 0,
    prospeccao_passiva: 0,
    atendimentos: 0,
    test_drives: 0,
    firm_orders: 0,
    captacao_usado: 0,
  });

  useEffect(() => {
    loadVendedorData();
  }, [user]);

  const loadVendedorData = async () => {
    if (!user) return;

    const { data: vendedor } = await supabase
      .from('vendedores')
      .select('id, loja_vinculada')
      .eq('email_vendedor', user.email)
      .maybeSingle();

    if (vendedor) {
      setVendedorId(vendedor.id);
      setLojaId(vendedor.loja_vinculada);
      await loadExistingLancamento(vendedor.id, vendedor.loja_vinculada);
      await loadMeta(vendedor.loja_vinculada);
    }
  };

  const loadMeta = async (lId: string) => {
    const mesAtual = new Date().toISOString().slice(0, 7);

    const { data } = await supabase
      .from('metas_mensais')
      .select('meta_firm_orders_vendedor')
      .eq('loja_vinculada', lId)
      .eq('mes_referencia', mesAtual)
      .maybeSingle();

    if (data) {
      setMeta(data.meta_firm_orders_vendedor || 0);
    }
  };

  const loadExistingLancamento = async (vId: string, lId: string) => {
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('lancamentos_vendedor')
      .select('*')
      .eq('vendedor_id', vId)
      .eq('loja_vinculada', lId)
      .eq('data_referencia', today)
      .eq('janela', 'fechamento')
      .maybeSingle();

    if (data) {
      setFormData({
        prospeccao_ativa: data.prospeccao_ativa || 0,
        prospeccao_passiva: data.prospeccao_passiva || 0,
        atendimentos: data.atendimentos || 0,
        test_drives: data.test_drives || 0,
        firm_orders: data.firm_orders || 0,
        captacao_usado: data.captacao_usado || 0,
      });
    }
  };

  const handleSubmit = async () => {
    if (!vendedorId || !lojaId) {
      toast.error('Dados do vendedor não encontrados');
      return;
    }

    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    try {
      const { data: existing } = await supabase
        .from('lancamentos_vendedor')
        .select('id')
        .eq('vendedor_id', vendedorId)
        .eq('data_referencia', today)
        .eq('janela', 'fechamento')
        .maybeSingle();

      const payload = {
        data_referencia: today,
        janela: 'fechamento',
        loja_vinculada: lojaId,
        vendedor_id: vendedorId,
        ...formData,
        follow_ups: 0,
        agendamentos: 0,
        comparecimentos: 0,
        perdas_totais: 0,
        preenchido_pelo_proprio_vendedor: true,
      };

      if (existing) {
        const { error } = await supabase
          .from('lancamentos_vendedor')
          .update(payload)
          .eq('id', existing.id);

        if (error) throw error;
        toast.success('Lançamento salvo com sucesso!');
      } else {
        const { error } = await supabase
          .from('lancamentos_vendedor')
          .insert([payload]);

        if (error) throw error;
        toast.success('Lançamento salvo com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar lançamento');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: number | string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-800">Meu Dia</h1>
        <p className="text-slate-500 mt-1">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>


      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-700">
            <PhoneOutgoing className="h-5 w-5" />
            Prospecção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <PhoneOutgoing className="h-5 w-5 text-orange-600" />
              <Label htmlFor="prospeccao_ativa" className="text-base font-semibold text-orange-900">
                Prospecção Ativa
              </Label>
            </div>
            <Input
              id="prospeccao_ativa"
              type="number"
              min="0"
              value={formData.prospeccao_ativa}
              onChange={(e) => updateField('prospeccao_ativa', parseInt(e.target.value) || 0)}
              className="text-2xl h-14 text-center font-bold"
              placeholder="0"
            />
            <p className="text-sm text-orange-700 mt-2">Ligações ou contatos feitos pelo vendedor</p>
          </div>

          <div className="bg-teal-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <PhoneIncoming className="h-5 w-5 text-teal-600" />
              <Label htmlFor="prospeccao_passiva" className="text-base font-semibold text-teal-900">
                Prospecção Passiva
              </Label>
            </div>
            <Input
              id="prospeccao_passiva"
              type="number"
              min="0"
              value={formData.prospeccao_passiva}
              onChange={(e) => updateField('prospeccao_passiva', parseInt(e.target.value) || 0)}
              className="text-2xl h-14 text-center font-bold"
              placeholder="0"
            />
            <p className="text-sm text-teal-700 mt-2">Clientes que retornaram ou responderam</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-700">
            <Users className="h-5 w-5" />
            Atendimentos e Conversões
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <Label htmlFor="atendimentos" className="text-base font-semibold text-blue-900">
                Atendimentos (loja ou online)
              </Label>
            </div>
            <Input
              id="atendimentos"
              type="number"
              min="0"
              value={formData.atendimentos}
              onChange={(e) => updateField('atendimentos', parseInt(e.target.value) || 0)}
              className="text-2xl h-14 text-center font-bold"
              placeholder="0"
            />
            <p className="text-sm text-blue-700 mt-2">Clientes atendidos presencialmente ou com atendimento completo digital</p>
          </div>

          <div className="bg-violet-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-violet-600" />
              <Label htmlFor="test_drives" className="text-base font-semibold text-violet-900">Test Drives</Label>
            </div>
            <Input
              id="test_drives"
              type="number"
              min="0"
              value={formData.test_drives}
              onChange={(e) => updateField('test_drives', parseInt(e.target.value) || 0)}
              className="text-2xl h-14 text-center font-bold"
              placeholder="0"
            />
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-5 w-5 text-green-600" />
              <Label htmlFor="firm_orders" className="text-base font-semibold text-green-900">Firm Orders</Label>
            </div>
            <Input
              id="firm_orders"
              type="number"
              min="0"
              value={formData.firm_orders}
              onChange={(e) => updateField('firm_orders', parseInt(e.target.value) || 0)}
              className="text-2xl h-14 text-center font-bold border-green-300"
              placeholder="0"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-700">
            <Car className="h-5 w-5" />
            Indicador de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Car className="h-5 w-5 text-slate-600" />
              <Label htmlFor="captacao_usado" className="text-base font-semibold text-slate-900">
                Captação de Usado
              </Label>
            </div>
            <Input
              id="captacao_usado"
              type="number"
              min="0"
              value={formData.captacao_usado}
              onChange={(e) => updateField('captacao_usado', parseInt(e.target.value) || 0)}
              className="text-2xl h-14 text-center font-bold"
              placeholder="0"
            />
            <p className="text-sm text-slate-700 mt-2">Clientes com veículo para troca captados no dia</p>
          </div>
        </CardContent>
      </Card>

      {(formData.atendimentos > 0 || formData.test_drives > 0 || formData.firm_orders > 0) && (
        <Card className="bg-gradient-to-br from-blue-50 to-green-50 border-2 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm font-semibold text-slate-700 mb-3">Hoje você já fez:</p>
            <div className="space-y-2 text-slate-800">
              <p className="text-lg">✓ <strong>{formData.atendimentos}</strong> atendimento{formData.atendimentos !== 1 ? 's' : ''}</p>
              <p className="text-lg">✓ <strong>{formData.test_drives}</strong> test drive{formData.test_drives !== 1 ? 's' : ''}</p>
              <p className="text-lg">✓ <strong>{formData.firm_orders}</strong> venda{formData.firm_orders !== 1 ? 's' : ''}</p>
            </div>
            {meta > 0 && (
              <p className="text-sm font-bold text-green-700 mt-4 pt-3 border-t border-green-200">
                Você já atingiu {((formData.firm_orders / meta) * 100).toFixed(0)}% da sua meta mensal
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Button
        onClick={handleSubmit}
        disabled={loading}
        size="lg"
        className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
      >
        <Save className="h-5 w-5 mr-2" />
        {loading ? 'Salvando...' : 'Salvar meu dia'}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Você pode salvar quantas vezes quiser
      </p>
    </div>
  );
}
