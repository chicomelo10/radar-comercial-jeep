'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/stat-card';
import { Award, TrendingUp, Target } from 'lucide-react';

export default function MinhaPerformancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Minha Performance</h1>
        <p className="text-slate-600 mt-1">Acompanhe seu desempenho e metas</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Minha Pontuação"
          value="85"
          subtitle="Pontos no mês"
          icon={Award}
          variant="success"
        />
        <StatCard
          title="Posição no Ranking"
          value="2º"
          subtitle="Entre 8 vendedores"
          icon={TrendingUp}
          variant="default"
        />
        <StatCard
          title="Meta do Mês"
          value="60%"
          subtitle="3 de 5 vendas"
          icon={Target}
          variant="warning"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            <p className="text-lg font-medium">Recurso em Implementação</p>
            <p className="text-sm mt-2">Análises detalhadas serão disponibilizadas em breve</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
