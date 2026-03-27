'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';

export default function MinhaPerformancePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Minha Performance</h1>
        <p className="text-slate-600 mt-1">Acompanhe seu desempenho no mês</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Em Desenvolvimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">
            Esta página está sendo desenvolvida e em breve exibirá suas metas individuais e performance detalhada.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
