'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

export default function MeuLancamentoPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Meu Lançamento Diário</h1>
          <p className="text-slate-600 mt-1">Registre suas atividades do dia</p>
        </div>
        <Button>
          <Save className="h-4 w-4 mr-2" />
          Salvar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lançamento de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            <p className="text-lg font-medium">Recurso em Implementação</p>
            <p className="text-sm mt-2">Formulário de lançamento individual será disponibilizado em breve</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
