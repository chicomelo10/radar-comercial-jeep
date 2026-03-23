'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Building2, Users, TrendingUp, FileText, Settings, Calendar, ChartPie as PieChart } from 'lucide-react';

export function Nav() {
  const { usuario } = useAuth();
  const pathname = usePathname();

  if (!usuario) return null;

  const isActive = (path: string) => pathname === path;

  const navItems = {
    regional: [
      { href: '/dashboard', label: 'Dashboard Regional', icon: LayoutDashboard },
      { href: '/lojas', label: 'Lojas', icon: Building2 },
      { href: '/usuarios', label: 'Usuários', icon: Users },
      { href: '/relatorios', label: 'Relatórios', icon: FileText },
    ],
    gerente: [
      { href: '/dashboard', label: 'Dashboard da Loja', icon: LayoutDashboard },
      { href: '/vendedores', label: 'Vendedores', icon: Users },
      { href: '/lancamentos', label: 'Lançamentos', icon: FileText },
      { href: '/metas', label: 'Metas', icon: TrendingUp },
      { href: '/equipe', label: 'Equipe', icon: Calendar },
      { href: '/acompanhamento', label: 'Acompanhamento', icon: PieChart },
    ],
    apoio_loja: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/lancamentos', label: 'Lançamentos', icon: FileText },
      { href: '/equipe', label: 'Equipe', icon: Calendar },
    ],
    vendedor: [
      { href: '/dashboard', label: 'Meu Dashboard', icon: LayoutDashboard },
      { href: '/meu-lancamento', label: 'Meu Lançamento', icon: FileText },
      { href: '/minha-performance', label: 'Performance', icon: TrendingUp },
    ],
  };

  const items = navItems[usuario.perfil] || [];

  return (
    <nav className="border-b bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap',
                  isActive(item.href)
                    ? 'border-b-2 border-slate-800 text-slate-800'
                    : 'text-slate-600 hover:text-slate-800'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
