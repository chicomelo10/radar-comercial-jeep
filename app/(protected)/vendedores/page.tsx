'use client';

import { useEffect, useState } from 'react';
import { supabase, Vendedor } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader as Loader2, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';

export default function VendedoresPage() {
  const { usuario } = useAuth();
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nome: '', email: '', meta: '0' });

  useEffect(() => {
    loadVendedores();
  }, [usuario]);

  const loadVendedores = async () => {
    try {
      if (!usuario?.loja_vinculada) return;

      const { data, error } = await supabase
        .from('vendedores')
        .select('*')
        .eq('loja_vinculada', usuario.loja_vinculada)
        .order('nome_vendedor');

      if (error) throw error;
      setVendedores(data || []);
    } catch (error) {
      console.error('Erro ao carregar vendedores:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVendedorStatus = async (vendedorId: string, currentStatus: string) => {
    const novoStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';

    try {
      const { error } = await supabase
        .from('vendedores')
        .update({ status_vendedor: novoStatus })
        .eq('id', vendedorId);

      if (error) {
        if (error.message.includes('policy')) {
          toast.error('Você não tem permissão para alterar status de vendedores');
        } else {
          toast.error('Erro ao alterar status');
        }
        throw error;
      }

      toast.success(novoStatus === 'ativo' ? 'Vendedor ativado' : 'Vendedor desativado');
      loadVendedores();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const deleteVendedor = async (vendedorId: string) => {
    if (!confirm('Tem certeza que deseja excluir este vendedor? Esta ação é irreversível.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vendedores')
        .delete()
        .eq('id', vendedorId);

      if (error) {
        if (error.message.includes('policy')) {
          toast.error('Você não tem permissão para excluir vendedores');
        } else if (error.message.includes('foreign key')) {
          toast.error('Não é possível excluir: vendedor tem lançamentos vinculados');
        } else {
          toast.error('Erro ao excluir vendedor');
        }
        throw error;
      }

      toast.success('Vendedor excluído com sucesso');
      loadVendedores();
    } catch (error) {
      console.error('Erro ao excluir vendedor:', error);
    }
  };

  const handleSaveVendedor = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('vendedores')
          .update({
            nome_vendedor: formData.nome,
            email_vendedor: formData.email || null,
            meta_mensal_atual: parseFloat(formData.meta) || 0,
          })
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Vendedor atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('vendedores')
          .insert({
            nome_vendedor: formData.nome,
            email_vendedor: formData.email || null,
            loja_vinculada: usuario?.loja_vinculada,
            meta_mensal_atual: parseFloat(formData.meta) || 0,
            status_vendedor: 'ativo',
          });

        if (error) throw error;
        toast.success('Vendedor adicionado com sucesso');
      }

      setDialogOpen(false);
      setEditingId(null);
      setFormData({ nome: '', email: '', meta: '0' });
      loadVendedores();
    } catch (error) {
      console.error('Erro ao salvar vendedor:', error);
      toast.error('Erro ao salvar vendedor');
    }
  };

  const openEditDialog = (vendedor: Vendedor) => {
    setEditingId(vendedor.id);
    setFormData({
      nome: vendedor.nome_vendedor,
      email: vendedor.email_vendedor || '',
      meta: vendedor.meta_mensal_atual.toString(),
    });
    setDialogOpen(true);
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
          <h1 className="text-3xl font-bold text-slate-800">Vendedores</h1>
          <p className="text-slate-600 mt-1">Gestão da equipe de vendas</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Vendedor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipe Ativa</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Data de Entrada</TableHead>
                <TableHead>Meta Mensal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendedores.map((vendedor) => (
                <TableRow key={vendedor.id}>
                  <TableCell className="font-medium">{vendedor.nome_vendedor}</TableCell>
                  <TableCell>{vendedor.email_vendedor || '-'}</TableCell>
                  <TableCell>{new Date(vendedor.data_entrada).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>{vendedor.meta_mensal_atual.toFixed(0)} vendas</TableCell>
                  <TableCell>
                    <Badge variant={vendedor.status_vendedor === 'ativo' ? 'default' : 'secondary'}>
                      {vendedor.status_vendedor === 'ativo' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(vendedor)}
                      className="mr-2"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={vendedor.status_vendedor === 'ativo' ? 'ghost' : 'outline'}
                      size="sm"
                      onClick={() => toggleVendedorStatus(vendedor.id, vendedor.status_vendedor)}
                      className="mr-2"
                    >
                      {vendedor.status_vendedor === 'ativo' ? 'Desativar' : 'Ativar'}
                    </Button>
                    {vendedor.status_vendedor === 'inativo' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteVendedor(vendedor.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {vendedores.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500">
                    Nenhum vendedor cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) {
          setEditingId(null);
          setFormData({ nome: '', email: '', meta: '0' });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Vendedor' : 'Adicionar Novo Vendedor'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do vendedor"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="meta">Meta Mensal</Label>
              <Input
                id="meta"
                type="number"
                value={formData.meta}
                onChange={(e) => setFormData({ ...formData, meta: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveVendedor}>{editingId ? 'Salvar' : 'Adicionar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
