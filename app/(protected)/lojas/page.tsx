'use client';

import { useEffect, useState } from 'react';
import { supabase, Loja } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Loader as Loader2 } from 'lucide-react';

export default function LojasPage() {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLojas();
  }, []);

  const loadLojas = async () => {
    try {
      const { data, error } = await supabase
        .from('lojas')
        .select('*')
        .order('nome_loja');

      if (error) throw error;
      setLojas(data || []);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
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
          <h1 className="text-3xl font-bold text-slate-800">Lojas</h1>
          <p className="text-slate-600 mt-1">Gerenciamento de concessionárias</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Loja
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lojas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead>Vendedores</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lojas.map((loja) => (
                <TableRow key={loja.id}>
                  <TableCell className="font-medium">{loja.nome_loja}</TableCell>
                  <TableCell>{loja.grupo}</TableCell>
                  <TableCell>{loja.cidade}/{loja.uf}</TableCell>
                  <TableCell>{loja.qtd_planejada_vendedores}</TableCell>
                  <TableCell>
                    <Badge variant={loja.loja_ativa ? 'default' : 'secondary'}>
                      {loja.loja_ativa ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
