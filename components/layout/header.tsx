'use client';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, ChartBar as BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function Header() {
  const { usuario, signOut } = useAuth();

  const perfilLabel = {
    regional: 'Regional',
    gerente: 'Gerente',
    apoio_loja: 'Apoio',
    vendedor: 'Vendedor',
  };

  const perfilColor = {
    regional: 'bg-blue-600',
    gerente: 'bg-green-600',
    apoio_loja: 'bg-yellow-600',
    vendedor: 'bg-gray-600',
  };

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-slate-800" />
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Radar Comercial Jeep
            </h1>
            <p className="text-xs text-slate-500">Gestão Comercial em Tempo Real</p>
          </div>
        </div>

        {usuario && (
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-800">
                {usuario.nome_usuario}
              </p>
              <Badge
                className={`${
                  perfilColor[usuario.perfil]
                } text-white text-xs`}
              >
                {perfilLabel[usuario.perfil]}
              </Badge>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="sm:hidden">
                  <div>
                    <p className="font-medium">{usuario.nome_usuario}</p>
                    <p className="text-xs text-slate-500">
                      {perfilLabel[usuario.perfil]}
                    </p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}
