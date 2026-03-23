'use client';

import { useEffect, useState } from 'react';
import { supabase, Vendedor } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Loader as Loader2 } from 'lucide-react';

export default function VendedoresPage() {
  const { usuario } = useAuth();
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);

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
        <Button>
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
                </TableRow>
              ))}
              {vendedores.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500">
                    Nenhum vendedor cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
