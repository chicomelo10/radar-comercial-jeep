'use client';

import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Loader as Loader2, CreditCard as Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type Usuario = {
  id: string;
  nome_usuario: string;
  email_usuario: string;
  perfil: string;
  ativo: boolean;
  loja_vinculada?: string;
  nome_loja?: string;
};

type Loja = {
  id: string;
  nome_loja: string;
};

export default function UsuariosPage() {
  const { usuario: usuarioLogado } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nome_usuario: '',
    email_usuario: '',
    senha: '',
    perfil: 'vendedor',
    ativo: true,
    loja_vinculada: '',
  });

  useEffect(() => {
    loadUsuarios();
    loadLojas();
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

  const loadLojas = async () => {
    try {
      const { data } = await supabase
        .from('lojas')
        .select('id, nome_loja')
        .eq('loja_ativa', true)
        .order('nome_loja');

      if (data) {
        setLojas(data);
      }
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email_usuario,
        password: formData.senha,
        options: {
          emailRedirectTo: undefined,
          data: {
            nome_usuario: formData.nome_usuario,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('Email confirmations are disabled')) {
          toast.error('Confirmação de email está habilitada. Configure o Supabase para desenvolvimento.');
        } else if (authError.message.includes('User already registered')) {
          toast.error('Este email já está cadastrado.');
        } else {
          toast.error(authError.message || 'Erro ao criar usuário na autenticação');
        }
        throw authError;
      }

      if (authData.user) {
        const { error: dbError } = await supabase.from('usuarios').insert({
          id: authData.user.id,
          nome_usuario: formData.nome_usuario,
          email_usuario: formData.email_usuario,
          perfil: formData.perfil,
          ativo: formData.ativo,
          loja_vinculada: formData.loja_vinculada || null,
          pode_editar_equipe: formData.perfil === 'gerente' || formData.perfil === 'apoio_loja',
        });

        if (dbError) {
          if (dbError.message.includes('policy')) {
            toast.error('Você não tem permissão para criar usuários. Apenas regionais podem criar usuários.');
          } else {
            toast.error(dbError.message || 'Erro ao salvar usuário no banco de dados');
          }
          throw dbError;
        }

        toast.success('Usuário criado com sucesso!');
        setDialogOpen(false);
        resetForm();
        loadUsuarios();
      }
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome_usuario: '',
      email_usuario: '',
      senha: '',
      perfil: 'vendedor',
      ativo: true,
      loja_vinculada: '',
    });
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

  const toggleUsuarioStatus = async (usuarioId: string, novoStatus: boolean) => {
    try {
      const usuario = usuarios.find(u => u.id === usuarioId);
      const updateData: any = { ativo: novoStatus };

      if (usuario && (usuario.perfil === 'gerente' || usuario.perfil === 'apoio_loja') && novoStatus) {
        updateData.pode_editar_equipe = true;
      }

      const { error } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('id', usuarioId);

      if (error) {
        if (error.message.includes('policy')) {
          toast.error('Você não tem permissão para alterar status de usuários');
        } else {
          toast.error('Erro ao alterar status');
        }
        throw error;
      }

      toast.success(novoStatus ? 'Usuário ativado' : 'Usuário desativado');
      loadUsuarios();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const deleteUsuario = async (usuarioId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação é irreversível.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', usuarioId);

      if (error) {
        if (error.message.includes('policy')) {
          toast.error('Você não tem permissão para excluir usuários');
        } else if (error.message.includes('foreign key')) {
          toast.error('Não é possível excluir: usuário tem registros vinculados');
        } else {
          toast.error('Erro ao excluir usuário');
        }
        throw error;
      }

      toast.success('Usuário excluído com sucesso');
      loadUsuarios();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Usuários</h1>
          <p className="text-slate-600 mt-1">Gerenciamento de acessos ao sistema</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Preencha os dados do novo usuário do sistema
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome_usuario">Nome Completo</Label>
                  <Input
                    id="nome_usuario"
                    value={formData.nome_usuario}
                    onChange={(e) => setFormData({ ...formData, nome_usuario: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_usuario">Email</Label>
                  <Input
                    id="email_usuario"
                    type="email"
                    value={formData.email_usuario}
                    onChange={(e) => setFormData({ ...formData, email_usuario: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="perfil">Perfil de Acesso</Label>
                  <Select
                    value={formData.perfil}
                    onValueChange={(value) => setFormData({ ...formData, perfil: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regional">Regional</SelectItem>
                      <SelectItem value="gerente">Gerente</SelectItem>
                      <SelectItem value="apoio_loja">Apoio Comercial</SelectItem>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loja_vinculada">Loja (opcional)</Label>
                  <Select
                    value={formData.loja_vinculada || undefined}
                    onValueChange={(value) => setFormData({ ...formData, loja_vinculada: value })}
                  >
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

                <div className="flex items-center justify-between">
                  <Label htmlFor="ativo">Usuário Ativo</Label>
                  <Switch
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Usuário'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
                  <TableHead className="text-right">Ações</TableHead>
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
                    <TableCell className="text-right">
                      <Button
                        variant={usuario.ativo ? 'ghost' : 'outline'}
                        size="sm"
                        onClick={() => toggleUsuarioStatus(usuario.id, !usuario.ativo)}
                        className="mr-2"
                      >
                        {usuario.ativo ? 'Desativar' : 'Ativar'}
                      </Button>
                      {!usuario.ativo && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteUsuario(usuario.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
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
