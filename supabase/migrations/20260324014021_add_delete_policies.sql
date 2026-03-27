/*
  # Adicionar políticas de DELETE para usuários e vendedores

  1. Mudanças
    - Adiciona política DELETE para tabela usuarios (apenas regional)
    - Adiciona política DELETE para tabela vendedores (gerente e regional)
    
  2. Segurança
    - Regional pode excluir qualquer usuário
    - Gerente pode excluir vendedores apenas de sua loja
    - Regional pode excluir vendedores de qualquer loja
*/

-- Política DELETE para usuários (apenas regional)
CREATE POLICY "Apenas regionais podem excluir usuários"
  ON usuarios FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.perfil = 'regional'
    )
  );

-- Política DELETE para vendedores (gerente e regional)
CREATE POLICY "Gerentes e regionais podem excluir vendedores"
  ON vendedores FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND (
        (u.perfil = 'gerente' AND u.loja_vinculada = vendedores.loja_vinculada)
        OR u.perfil = 'regional'
      )
    )
  );

-- Política UPDATE para usuários (apenas regional)
CREATE POLICY "Apenas regionais podem atualizar usuários"
  ON usuarios FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.perfil = 'regional'
    )
  );