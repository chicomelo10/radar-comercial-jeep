# 🔐 CRIAR USUÁRIO ADMINISTRADOR

## ⚠️ CREDENCIAIS DO ADMINISTRADOR

**Email:** chicomelo10@gmail.com
**Senha:** Fr@n7564

---

## 📋 PASSO A PASSO

### **OPÇÃO 1: Via Supabase Dashboard (RECOMENDADO)**

#### **Etapa 1: Criar usuário no Supabase Auth**

1. Acesse: https://hcejiejghtneefeojlkm.supabase.co
2. Faça login
3. Vá em **Authentication** → **Users**
4. Clique em **Add User** (ou **Invite**)
5. Preencha:
   - **Email:** `chicomelo10@gmail.com`
   - **Password:** `Fr@n7564`
   - **Auto Confirm User:** ✅ Marque esta opção
6. Clique em **Create User**
7. **IMPORTANTE:** Copie o **UUID** do usuário criado (está na primeira coluna da tabela)
   - Exemplo: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

#### **Etapa 2: Criar perfil na tabela usuarios**

1. No mesmo Supabase Dashboard, vá em **SQL Editor**
2. Clique em **New Query**
3. Cole o script abaixo **SUBSTITUINDO** o UUID:

```sql
-- SUBSTITUA 'COLE_O_UUID_AQUI' pelo UUID que você copiou acima
INSERT INTO usuarios (
  id,
  nome_usuario,
  email_usuario,
  perfil,
  ativo,
  pode_editar_metas,
  pode_editar_equipe,
  pode_lancar_por_terceiros
) VALUES (
  'COLE_O_UUID_AQUI',  -- ← SUBSTITUA AQUI
  'Francisco Melo',
  'chicomelo10@gmail.com',
  'regional',
  true,
  true,
  true,
  true
);
```

4. Clique em **Run** (ou pressione Ctrl/Cmd + Enter)
5. Se aparecer "Success. No rows returned", está correto! ✅

---

### **OPÇÃO 2: Criar vários usuários de uma vez**

Se você quiser criar usuários para diferentes lojas/perfis:

```sql
-- 1. Primeiro, crie os usuários no Authentication → Users (via interface)
-- 2. Depois, execute este script substituindo os UUIDs:

-- Usuário Regional (Francisco Melo)
INSERT INTO usuarios (id, nome_usuario, email_usuario, perfil, ativo, pode_editar_metas, pode_editar_equipe, pode_lancar_por_terceiros)
VALUES (
  'UUID_DO_REGIONAL',
  'Francisco Melo',
  'chicomelo10@gmail.com',
  'regional',
  true,
  true,
  true,
  true
);

-- Gerente da Stark Vitória da Conquista
INSERT INTO usuarios (id, nome_usuario, email_usuario, perfil, loja_vinculada, ativo, pode_editar_metas, pode_editar_equipe, pode_lancar_por_terceiros)
SELECT
  'UUID_DO_GERENTE_STARK',
  'Maria Santos',
  'gerente.stark@jeep.com',
  'gerente',
  id,  -- busca o ID da loja Stark
  true,
  false,
  true,
  true
FROM lojas WHERE nome_loja = 'Stark Vitória da Conquista';

-- Gerente da Brione Itabuna
INSERT INTO usuarios (id, nome_usuario, email_usuario, perfil, loja_vinculada, ativo, pode_editar_metas, pode_editar_equipe, pode_lancar_por_terceiros)
SELECT
  'UUID_DO_GERENTE_BRIONE',
  'Pedro Costa',
  'gerente.brione@jeep.com',
  'gerente',
  id,
  true,
  false,
  true,
  true
FROM lojas WHERE nome_loja = 'Brione Itabuna';

-- Vendedor
INSERT INTO usuarios (id, nome_usuario, email_usuario, perfil, loja_vinculada, vendedor_vinculado, ativo)
SELECT
  'UUID_DO_VENDEDOR',
  'Ana Paula',
  'vendedor@jeep.com',
  'vendedor',
  v.loja_vinculada,
  v.id,
  true
FROM vendedores v WHERE v.nome_vendedor = 'Carlos Silva';
```

---

## ✅ COMO VERIFICAR SE DEU CERTO

### **Teste 1: Verificar se o usuário foi criado**

```sql
SELECT * FROM usuarios;
```

Se retornar pelo menos 1 linha, está correto! ✅

### **Teste 2: Login no sistema**

1. Acesse: `http://localhost:3000/login`
2. Digite:
   - **Email:** chicomelo10@gmail.com
   - **Senha:** Fr@n7564
3. Se entrar no dashboard → **SUCESSO!** 🎉

---

## 🔍 PERFIS DISPONÍVEIS

| Perfil | Descrição | Permissões |
|--------|-----------|------------|
| **regional** | Administrador Regional | Vê TODAS as lojas, pode editar metas, equipes, lançar por terceiros |
| **gerente** | Gerente de Loja | Vê SUA loja, pode editar equipe e lançar por terceiros |
| **apoio_loja** | Apoio Comercial | Vê SUA loja, pode lançar dados |
| **vendedor** | Vendedor | Vê apenas SEUS dados |

---

## 🚨 PROBLEMAS COMUNS

### **Erro: "duplicate key value violates unique constraint"**

✅ **Solução:** O usuário já existe. Verifique com:
```sql
SELECT * FROM usuarios WHERE email_usuario = 'admin@jeep.com';
```

### **Erro: "permission denied for table usuarios"**

✅ **Solução:** Você está usando o Supabase Dashboard? Use o **SQL Editor**, não o psql local.

### **Login funciona mas não entra no sistema**

✅ **Solução:** Verifique se o email do Auth é EXATAMENTE igual ao da tabela usuarios:
```sql
SELECT email_usuario FROM usuarios WHERE email_usuario = 'chicomelo10@gmail.com';
```

---

## 📞 SUPORTE

Se tiver problemas:

1. Verifique os logs no console do navegador (F12)
2. Verifique se o usuário existe no Auth E na tabela usuarios
3. Certifique-se que o email é idêntico nos dois lugares

---

## 🎯 PRÓXIMOS PASSOS

Após criar o usuário admin:

1. ✅ Faça login no sistema
2. ✅ Teste o dashboard
3. 🚀 Deploy na Vercel (configure as mesmas variáveis de ambiente)
4. 📊 Comece a usar o sistema!
