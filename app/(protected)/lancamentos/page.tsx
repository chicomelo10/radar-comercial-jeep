'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Loader as Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Lancamento = {
  id: string;
  data_referencia: string;
  janela: string;
  firm_orders: number;
  faturamento: number;
  test_drives: number;
  atendimentos: number;
  leads_recebidos: number;
  status_preenchimento: string;
  observacao_gerente?: string;
};

export default function LancamentosPage() {
  const { usuario } = useAuth();
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    data_referencia: new Date().toISOString().split('T')[0],
    janela: 'fechamento',
    firm_orders: '0',
    faturamento: '0',
    test_drives: '0',
    atendimentos: '0',
    leads_recebidos: '0',
    observacao_gerente: '',
  });

  useEffect(() => {
    loadLancamentos();
  }, [usuario]);

  const loadLancamentos = async () => {
    try {
      if (!usuario?.loja_vinculada) return;

      const { data, error } = await supabase
        .from('lancamentos_loja')
        .select('*')
        .eq('loja_vinculada', usuario.loja_vinculada)
        .order('data_referencia', { ascending: false })
        .limit(10);

      if (error) throw error;
      setLancamentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar lançamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const { error } = await supabase
        .from('lancamentos_loja')
        .insert({
          data_referencia: formData.data_referencia,
          janela: formData.janela,
          loja_vinculada: usuario?.loja_vinculada,
          firm_orders: parseFloat(formData.firm_orders),
          faturamento: parseFloat(formData.faturamento),
          test_drives: parseFloat(formData.test_drives),
          atendimentos: parseFloat(formData.atendimentos),
          leads_recebidos: parseFloat(formData.leads_recebidos),
          observacao_gerente: formData.observacao_gerente,
          preenchido_por: usuario?.id,
          origem_lancamento: 'manual',
          status_preenchimento: 'enviado',
        });

      if (error) throw error;

      toast.success('Lançamento registrado com sucesso');
      setDialogOpen(false);
      setFormData({
        data_referencia: new Date().toISOString().split('T')[0],
        janela: 'fechamento',
        firm_orders: '0',
        faturamento: '0',
        test_drives: '0',
        atendimentos: '0',
        leads_recebidos: '0',
        observacao_gerente: '',
      });
      loadLancamentos();
    } catch (error) {
      console.error('Erro ao salvar lançamento:', error);
      toast.error('Erro ao salvar lançamento');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Lançamentos Diários</h1>
          <p className="text-slate-600 mt-1">Registro de vendas e atividades da loja</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Lançamento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Janela</TableHead>
                <TableHead>Atendimentos</TableHead>
                <TableHead>Test Drives</TableHead>
                <TableHead>Firm Orders</TableHead>
                <TableHead>Faturamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lancamentos.map((lanc) => (
                <TableRow key={lanc.id}>
                  <TableCell>{new Date(lanc.data_referencia).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{lanc.janela === 'fechamento' ? 'Fechamento' : 'Meio do Dia'}</TableCell>
                  <TableCell>{lanc.atendimentos}</TableCell>
                  <TableCell>{lanc.test_drives}</TableCell>
                  <TableCell>{lanc.firm_orders}</TableCell>
                  <TableCell>R$ {lanc.faturamento.toLocaleString('pt-BR')}</TableCell>
                </TableRow>
              ))}
              {lancamentos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500">
                    Nenhum lançamento registrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Lançamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={formData.data_referencia}
                onChange={(e) => setFormData({ ...formData, data_referencia: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="janela">Janela</Label>
              <Select value={formData.janela} onValueChange={(v) => setFormData({ ...formData, janela: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fechamento">Fechamento</SelectItem>
                  <SelectItem value="meio_do_dia">Meio do Dia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="atendimentos">Atendimentos</Label>
              <Input
                id="atendimentos"
                type="number"
                value={formData.atendimentos}
                onChange={(e) => setFormData({ ...formData, atendimentos: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="test_drives">Test Drives</Label>
              <Input
                id="test_drives"
                type="number"
                value={formData.test_drives}
                onChange={(e) => setFormData({ ...formData, test_drives: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="firm_orders">Firm Orders</Label>
              <Input
                id="firm_orders"
                type="number"
                value={formData.firm_orders}
                onChange={(e) => setFormData({ ...formData, firm_orders: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="faturamento">Faturamento</Label>
              <Input
                id="faturamento"
                type="number"
                value={formData.faturamento}
                onChange={(e) => setFormData({ ...formData, faturamento: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="observacao_gerente">Observações de Coaching</Label>
              <Textarea
                id="observacao_gerente"
                placeholder="Anote aqui suas conversas e orientações com os vendedores..."
                value={formData.observacao_gerente}
                onChange={(e) => setFormData({ ...formData, observacao_gerente: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
