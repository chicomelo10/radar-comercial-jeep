# Radar Comercial Jeep

Sistema de gestão comercial em tempo real para concessionárias Jeep.

## Sobre o Sistema

O Radar Comercial Jeep é um aplicativo web responsivo desenvolvido para gestão diária de vendas e acompanhamento de performance de concessionárias Jeep. O sistema oferece dashboards personalizados por perfil, controle de metas, lançamentos diários e ferramentas de acompanhamento gerencial.

## Tecnologias Utilizadas

- **Frontend**: Next.js 13 + React + TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Deploy**: Vercel (recomendado)

## Perfis de Acesso

### 1. Regional
- Visualiza todas as lojas
- Acesso a comparativos e rankings regionais
- Gerencia lojas e usuários
- Acesso a relatórios consolidados

### 2. Gerente
- Visualiza apenas sua loja
- Gerencia vendedores da loja
- Registra lançamentos diários
- Acompanha performance da equipe
- Registra acompanhamentos gerenciais

### 3. Apoio da Loja
- Visualiza sua loja
- Preenche lançamentos diários
- Gerencia disponibilidade da equipe

### 4. Vendedor
- Visualiza apenas seus dados
- Registra lançamentos pessoais
- Acompanha performance individual
- Visualiza ranking e metas

## Estrutura do Banco de Dados

### Tabelas Principais

1. **lojas**: Cadastro de concessionárias
2. **usuarios**: Perfis de acesso ao sistema
3. **vendedores**: Equipe de vendas
4. **disponibilidade_equipe**: Controle de presença/ausências
5. **metas_mensais**: Objetivos e premissas por loja
6. **lancamentos_loja**: Dados diários da loja
7. **lancamentos_vendedor**: Dados diários por vendedor
8. **acompanhamentos_gerente**: Registro de coaching e reuniões
9. **historico_alteracoes**: Auditoria de alterações

## Lojas Piloto

O sistema foi configurado com 3 lojas piloto:

1. **Stark Vitória da Conquista** - BA
2. **Brione Itabuna** - BA
3. **Radar Arapiraca** - AL

## Janelas de Preenchimento

As janelas oficiais para lançamento de dados são:

- **Meio do dia**: 11:30 às 11:45
- **Fechamento**: 17:30 às 17:45

## Funcionalidades Principais

### Dashboard
- Cards executivos com métricas do dia
- Ranking de lojas/vendedores
- Funil comercial
- Semáforo de performance (verde/amarelo/vermelho)

### Sistema de Pontuação
```
pontuacao = (firm_orders × 10) + (test_drives × 5) +
            (comparecimentos × 3) + (agendamentos × 2) +
            (atendimentos × 1) + (follow_ups × 1)
```

### Semáforo da Loja
Score composto baseado em:
- Cadência de vendas: 40%
- Conversão do funil: 25%
- Produtividade da equipe: 20%
- Disciplina de preenchimento: 15%

Faixas:
- 🟢 Verde: ≥ 90%
- 🟡 Amarelo: 70-89%
- 🔴 Vermelho: < 70%

## Configuração do Projeto

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` com as seguintes variáveis:

```bash
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
```

### 2. Instalação

```bash
npm install
```

### 3. Desenvolvimento

```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`

### 4. Build para Produção

```bash
npm run build
npm start
```

## Deploy na Vercel

### Passo a Passo

1. Crie uma conta na [Vercel](https://vercel.com)
2. Conecte seu repositório GitHub
3. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy automático será feito a cada push na branch main

### Configuração Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute as migrations do diretório `supabase/migrations/`
3. Configure RLS (Row Level Security) conforme as policies criadas
4. Copie a URL e Anon Key para as variáveis de ambiente

## Estrutura de Pastas

```
/app
  /(protected)      # Rotas protegidas por autenticação
    /dashboard      # Dashboard principal
    /vendedores     # Gestão de vendedores
    /lancamentos    # Lançamentos diários
    /metas          # Metas mensais
    /equipe         # Disponibilidade da equipe
    /acompanhamento # Acompanhamento gerencial
    /lojas          # Gestão de lojas (regional)
    /usuarios       # Gestão de usuários (regional)
    /relatorios     # Relatórios (regional)
  /login            # Página de login
  /layout.tsx       # Layout raiz com AuthProvider
  /page.tsx         # Página inicial (redirect)

/components
  /dashboard        # Componentes do dashboard
  /layout           # Header e navegação
  /ui               # Componentes shadcn/ui

/lib
  /auth-context.tsx # Contexto de autenticação
  /supabase.ts      # Cliente Supabase e tipos
  /utils.ts         # Utilitários

/supabase
  /migrations       # Migrations do banco de dados
```

## Dados de Teste

O sistema foi configurado com dados de exemplo:
- 3 lojas cadastradas
- Vendedores de exemplo para cada loja
- Metas mensais configuradas
- Lançamentos de exemplo para o dia atual

## Próximos Passos para Produção

### 1. Criar Usuário Admin
```sql
-- No Supabase SQL Editor
-- Primeiro, crie o usuário via Supabase Auth Dashboard
-- Depois, vincule ao perfil:
INSERT INTO usuarios (id, nome_usuario, email_usuario, perfil, ativo)
VALUES (
  'uuid_do_usuario_auth',
  'Administrador Regional',
  'admin@email.com',
  'regional',
  true
);
```

### 2. Implementar Funcionalidades Pendentes
- Formulários de lançamento completos
- CRUD de vendedores
- CRUD de usuários
- Sistema de notificações
- Relatórios exportáveis
- Gráficos e análises avançadas

### 3. Melhorias Recomendadas
- Implementar upload de fotos de perfil
- Adicionar notificações push
- Criar aplicativo mobile (React Native)
- Implementar backup automático
- Adicionar testes automatizados
- Configurar CI/CD

## Segurança

- ✅ Row Level Security (RLS) habilitado em todas as tabelas
- ✅ Políticas restritivas por perfil
- ✅ Autenticação via Supabase Auth
- ✅ Variáveis de ambiente seguras
- ✅ Histórico de alterações para auditoria

## Suporte

Para dúvidas ou problemas:
1. Verifique a documentação do Supabase
2. Consulte a documentação do Next.js
3. Revise as políticas RLS no banco de dados

## Licença

Propriedade da rede de concessionárias Jeep participantes.

---

**Desenvolvido para gestão comercial eficiente e em tempo real.**
