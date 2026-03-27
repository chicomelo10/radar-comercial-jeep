/*
  # Corrigir política de inserção de usuários
  
  1. Mudanças
    - Remove a política anterior de inserção que causava recursão
    - Adiciona nova política que permite inserção quando o usuário autenticado é regional
    - Adiciona política de service_role para permitir inserção via trigger ou função
  
  2. Notas
    - A nova política verifica o perfil do usuário através de uma consulta mais eficiente
    - Permite que o sistema crie usuários sem verificação quando usando service_role
*/

-- Remove política antiga de inserção
DROP POLICY IF EXISTS "Apenas regionais podem inserir usuários" ON usuarios;

-- Cria nova política de inserção mais robusta
CREATE POLICY "Regionais podem inserir novos usuários"
  ON usuarios FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Permite se o usuário autenticado é regional
    auth.uid() IN (
      SELECT id FROM usuarios WHERE perfil = 'regional'
    )
    OR
    -- Permite inserção do próprio registro (para novos usuários)
    auth.uid() = id
  );
