'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader as Loader2 } from 'lucide-react';

type Meta = {
  id: string;
  mes_referencia: string;
  objetivo_vendas: number;
  objetivo_faturamento: number;
  conversao_atendimento_venda: number;
  conversao_testdrive_venda: number;
  aprovado_por_gerente: boolean;
};

export default function MetasPage() {
  const { usuario } = useAuth();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeta();
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
      setMeta(data);
    } catch (error) {
      console.error('Erro ao carregar meta:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
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
        <h1 className="text-3xl font-bold text-slate-800">Metas Mensais</h1>
        <p className="text-slate-600 mt-1">
          Objetivos e premissas para {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {meta ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Objetivos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-600">Vendas</p>
                <p className="text-2xl font-bold">{meta.objetivo_vendas} unidades</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Faturamento</p>
                <p className="text-2xl font-bold">{formatCurrency(meta.objetivo_faturamento)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-slate-600">Atendimento → Venda</p>
                <p className="text-2xl font-bold">{(meta.conversao_atendimento_venda * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Test Drive → Venda</p>
                <p className="text-2xl font-bold">{(meta.conversao_testdrive_venda * 100).toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <p className="text-lg font-medium">Nenhuma meta cadastrada para este mês</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
