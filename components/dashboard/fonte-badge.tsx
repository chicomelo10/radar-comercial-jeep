'use client';

import { Badge } from '@/components/ui/badge';

type FonteProspeccao = {
  id: string;
  nome_fonte: string;
};

interface FonteBadgeProps {
  fonte?: FonteProspeccao | null;
}

export function FonteBadge({ fonte }: FonteBadgeProps) {
  if (!fonte) {
    return <Badge variant="outline">Sem fonte</Badge>;
  }

  const corPorFonte: Record<string, string> = {
    'Oficina': 'bg-blue-100 text-blue-800 border-blue-300',
    'Exposição Shopping': 'bg-purple-100 text-purple-800 border-purple-300',
    'Cliente Espontâneo': 'bg-green-100 text-green-800 border-green-300',
    'Leads': 'bg-orange-100 text-orange-800 border-orange-300',
  };

  const corClasse = corPorFonte[fonte.nome_fonte] || 'bg-slate-100 text-slate-800 border-slate-300';

  return (
    <Badge variant="outline" className={corClasse}>
      {fonte.nome_fonte}
    </Badge>
  );
}
