'use client';

import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

type Usuario = {
  id: string;
  nome_usuario: string;
  email_usuario: string;
  perfil: string;
  ativo: boolean;
  loja_vinculada?: string;
  nome_loja?: string;
};

export default function UsuariosPage() {
  const { usuario: usuarioLogado } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      const { data } = await supabase
        .from('usuarios')
        .select('*, lojas:loja_vinculada(nome_loja)')
        .order('nome_usuario');

      if (data) {
        const usuariosFormatados = data.map((u: any) => ({
          id: u.id,
          nome_usuario: u.nome_usuario,
          email_usuario: u.email_usuario,
          perfil: u.perfil,
          ativo: u.ativo,
          loja_vinculada: u.loja_vinculada,
          nome_loja: u.lojas?.nome_loja,
        }));
        setUsuarios(usuariosFormatados);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerfilLabel = (perfil: string) => {
    const perfis: Record<string, string> = {
      regional: 'Regional',
      gerente: 'Gerente',
      apoio_loja: 'Apoio Comercial',
      vendedor: 'Vendedor',
    };
    return perfis[perfil] || perfil;
  };

  const getPerfilVariant = (perfil: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      regional: 'destructive',
      gerente: 'default',
      apoio_loja: 'secondary',
      vendedor: 'outline',
    };
    return variants[perfil] || 'default';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Usuários</h1>
        <p className="text-slate-600 mt-1">Gerenciamento de acessos ao sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários Cadastrados ({usuarios.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {usuarios.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Loja</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium">{usuario.nome_usuario}</TableCell>
                    <TableCell>{usuario.email_usuario}</TableCell>
                    <TableCell>
                      <Badge variant={getPerfilVariant(usuario.perfil)}>
                        {getPerfilLabel(usuario.perfil)}
                      </Badge>
                    </TableCell>
                    <TableCell>{usuario.nome_loja || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={usuario.ativo ? 'default' : 'outline'}>
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <p className="text-lg font-medium">Nenhum usuário cadastrado</p>
              <p className="text-sm mt-2">Para criar o primeiro usuário, consulte CRIAR_USUARIO_ADMIN.md</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
