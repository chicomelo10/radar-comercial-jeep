'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Relatórios</h1>
          <p className="text-slate-600 mt-1">Análises e exportações de dados</p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Relatório de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">Exportar dados de vendas por período</p>
            <Button variant="outline" className="mt-4">
              Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Análise de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">Funil de vendas e taxas de conversão</p>
            <Button variant="outline" className="mt-4">
              Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance de Vendedores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">Ranking e indicadores individuais</p>
            <Button variant="outline" className="mt-4">
              Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Análise de Perdas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">Motivos de perda de vendas</p>
            <Button variant="outline" className="mt-4">
              Gerar Relatório
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
