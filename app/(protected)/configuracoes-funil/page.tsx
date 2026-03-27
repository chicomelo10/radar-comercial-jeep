'use client';

import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Save } from 'lucide-react';
import { toast } from 'sonner';

type ParametrosFunil = {
  id?: string;
  loja_vinculada?: string;
  vendedor_id?: string;
  taxa_contato_base: number;
  taxa_agendamento: number;
  taxa_comparecimento: number;
  taxa_conversao_venda: number;
  usa_historico: boolean;
};

type Loja = {
  id: string;
  nome_loja: string;
};

type Vendedor = {
  id: string;
  nome_vendedor: string;
};

export default function ConfiguracoesFunilPage() {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [lojaFiltro, setLojaFiltro] = useState<string>('');
  const [vendedorFiltro, setVendedorFiltro] = useState<string>('');

  const [parametros, setParametros] = useState<ParametrosFunil>({
    taxa_contato_base: 0.10,
    taxa_agendamento: 0.30,
    taxa_comparecimento: 0.30,
    taxa_conversao_venda: 0.33,
    usa_historico: false,
  });

  useEffect(() => {
    if (usuario?.perfil === 'regional') {
      loadLojas();
    } else if (usuario?.loja_vinculada) {
      setLojaFiltro(usuario.loja_vinculada);
      loadVendedores(usuario.loja_vinculada);
    }
  }, [usuario]);

  useEffect(() => {
    if (lojaFiltro) {
      loadVendedores(lojaFiltro);
      loadParametros();
    }
  }, [lojaFiltro, vendedorFiltro]);

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

  const loadVendedores = async (lojaId: string) => {
    try {
      const { data } = await supabase
        .from('vendedores')
        .select('id, nome_vendedor')
        .eq('loja_vinculada', lojaId)
        .eq('vendedor_ativo', true)
        .order('nome_vendedor');

      if (data) setVendedores(data);
    } catch (error) {
      console.error('Erro ao carregar vendedores:', error);
    }
  };

  const loadParametros = async () => {
    setLoading(true);
    try {
      let query = supabase.from('parametros_funil').select('*');

      if (vendedorFiltro) {
        query = query.eq('vendedor_id', vendedorFiltro);
      } else if (lojaFiltro) {
        query = query.eq('loja_vinculada', lojaFiltro).is('vendedor_id', null);
      }

      const { data } = await query.maybeSingle();

      if (data) {
        setParametros({
          id: data.id,
          loja_vinculada: data.loja_vinculada,
          vendedor_id: data.vendedor_id,
          taxa_contato_base: parseFloat(data.taxa_contato_base),
          taxa_agendamento: parseFloat(data.taxa_agendamento),
          taxa_comparecimento: parseFloat(data.taxa_comparecimento),
          taxa_conversao_venda: parseFloat(data.taxa_conversao_venda),
          usa_historico: data.usa_historico,
        });
      } else {
        setParametros({
          taxa_contato_base: 0.10,
          taxa_agendamento: 0.30,
          taxa_comparecimento: 0.30,
          taxa_conversao_venda: 0.33,
          usa_historico: false,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar parâmetros:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dadosSalvar = {
        loja_vinculada: lojaFiltro || null,
        vendedor_id: vendedorFiltro || null,
        taxa_contato_base: parametros.taxa_contato_base,
        taxa_agendamento: parametros.taxa_agendamento,
        taxa_comparecimento: parametros.taxa_comparecimento,
        taxa_conversao_venda: parametros.taxa_conversao_venda,
        usa_historico: parametros.usa_historico,
        atualizado_em: new Date().toISOString(),
      };

      if (parametros.id) {
        const { error } = await supabase
          .from('parametros_funil')
          .update(dadosSalvar)
          .eq('id', parametros.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('parametros_funil')
          .insert(dadosSalvar);

        if (error) throw error;
      }

      toast.success('Parâmetros salvos com sucesso!');
      loadParametros();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error(error.message || 'Erro ao salvar parâmetros');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Configurações do Funil</h1>
        <p className="text-slate-600 mt-1">Configure as taxas de conversão do funil de vendas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {usuario?.perfil === 'regional' && (
          <div>
            <Label>Loja</Label>
            <Select value={lojaFiltro} onValueChange={(value) => {
              setLojaFiltro(value);
              setVendedorFiltro('');
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma loja" />
              </SelectTrigger>
              <SelectContent>
                {lojas.map((loja) => (
                  <SelectItem key={loja.id} value={loja.id}>
                    {loja.nome_loja}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {lojaFiltro && vendedores.length > 0 && (
          <div>
            <Label>Vendedor (opcional)</Label>
            <Select value={vendedorFiltro} onValueChange={setVendedorFiltro}>
              <SelectTrigger>
                <SelectValue placeholder="Padrão da loja" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Padrão da loja</SelectItem>
                {vendedores.map((vendedor) => (
                  <SelectItem key={vendedor.id} value={vendedor.id}>
                    {vendedor.nome_vendedor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {lojaFiltro && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Parâmetros do Funil
            </CardTitle>
            <CardDescription>
              Defina as taxas de conversão para cada etapa do funil de vendas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxa_contato">Taxa de Contato (%)</Label>
                  <p className="text-xs text-slate-600">
                    Percentual da base que você consegue contatar
                  </p>
                  <Input
                    id="taxa_contato"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={(parametros.taxa_contato_base * 100).toFixed(0)}
                    onChange={(e) => setParametros({
                      ...parametros,
                      taxa_contato_base: parseFloat(e.target.value) / 100
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxa_agendamento">Taxa de Agendamento (%)</Label>
                  <p className="text-xs text-slate-600">
                    Percentual de contatos que viram agendamento
                  </p>
                  <Input
                    id="taxa_agendamento"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={(parametros.taxa_agendamento * 100).toFixed(0)}
                    onChange={(e) => setParametros({
                      ...parametros,
                      taxa_agendamento: parseFloat(e.target.value) / 100
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxa_comparecimento">Taxa de Comparecimento (%)</Label>
                  <p className="text-xs text-slate-600">
                    Percentual de agendados que comparecem
                  </p>
                  <Input
                    id="taxa_comparecimento"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={(parametros.taxa_comparecimento * 100).toFixed(0)}
                    onChange={(e) => setParametros({
                      ...parametros,
                      taxa_comparecimento: parseFloat(e.target.value) / 100
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxa_conversao">Taxa de Conversão (%)</Label>
                  <p className="text-xs text-slate-600">
                    Percentual de atendimentos que viram venda
                  </p>
                  <Input
                    id="taxa_conversao"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={(parametros.taxa_conversao_venda * 100).toFixed(0)}
                    onChange={(e) => setParametros({
                      ...parametros,
                      taxa_conversao_venda: parseFloat(e.target.value) / 100
                    })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <div className="space-y-1">
                  <Label htmlFor="usa_historico">Usar Histórico Real</Label>
                  <p className="text-xs text-slate-600">
                    Calcular taxas baseadas no histórico dos últimos 3 meses
                  </p>
                </div>
                <Switch
                  id="usa_historico"
                  checked={parametros.usa_historico}
                  onCheckedChange={(checked) => setParametros({
                    ...parametros,
                    usa_historico: checked
                  })}
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm text-slate-700">Exemplo de Cálculo</h4>
              <p className="text-sm text-slate-600">
                Para atingir <strong>10 vendas</strong>, você precisará de:
              </p>
              <ul className="text-sm text-slate-600 space-y-1 ml-4">
                <li>• {Math.ceil(10 / parametros.taxa_conversao_venda)} atendimentos</li>
                <li>• {Math.ceil(10 / parametros.taxa_conversao_venda / parametros.taxa_comparecimento)} agendamentos</li>
                <li>• {Math.ceil(10 / parametros.taxa_conversao_venda / parametros.taxa_comparecimento / parametros.taxa_agendamento)} contatos com sucesso</li>
                <li>• {Math.ceil(10 / parametros.taxa_conversao_venda / parametros.taxa_comparecimento / parametros.taxa_agendamento / parametros.taxa_contato_base)} contatos na base</li>
              </ul>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </CardContent>
        </Card>
      )}

      {!lojaFiltro && usuario?.perfil === 'regional' && (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecione uma loja para configurar os parâmetros do funil</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
