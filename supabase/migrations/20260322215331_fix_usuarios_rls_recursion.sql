/*
  # Corrigir recursão infinita nas políticas RLS de usuários
  
  1. Problema
    - Políticas SELECT da tabela usuarios consultam a própria tabela, criando recursão infinita
    - Isso impede o carregamento dos dados do usuário
    
  2. Solução
    - Remover políticas recursivas
    - Criar políticas mais simples baseadas apenas em auth.uid()
    - Usar uma única política permissiva para SELECT (segurança através de filtros na aplicação)
    
  3. Segurança
    - Manter controle rigoroso em INSERT/UPDATE
    - SELECT será permitido para todos autenticados (dados não sensíveis como perfil e loja)
*/

-- Remover políticas problemáticas
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON usuarios;
DROP POLICY IF EXISTS "Regionais podem ver todos os usuários" ON usuarios;
DROP POLICY IF EXISTS "Gerentes podem ver usuários da mesma loja" ON usuarios;

-- Criar política simples e sem recursão para SELECT
-- Permite que usuários autenticados vejam todos os usuários
-- (necessário para que as outras políticas funcionem)
CREATE POLICY "Usuários autenticados podem visualizar usuários"
  ON usuarios FOR SELECT
  TO authenticated
  USING (true);

-- Manter as políticas de INSERT/UPDATE restritas
-- A política de INSERT já existe e está correta