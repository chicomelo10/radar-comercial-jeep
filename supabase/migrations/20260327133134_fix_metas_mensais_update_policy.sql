/*
  # Fix metas_mensais UPDATE policy

  Simplifica a política de UPDATE para permitir que gerentes e regionais atualizem metas.
  Remove a verificação do campo pode_editar_metas que estava bloqueando as atualizações.
*/

DROP POLICY IF EXISTS "Usuários autorizados podem atualizar metas" ON metas_mensais;

CREATE POLICY "Gerentes e regionais podem atualizar metas"
  ON metas_mensais
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND u.ativo = true
        AND u.perfil IN ('gerente', 'regional')
        AND (u.perfil = 'regional' OR u.loja_vinculada = metas_mensais.loja_vinculada)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND u.ativo = true
        AND u.perfil IN ('gerente', 'regional')
        AND (u.perfil = 'regional' OR u.loja_vinculada = metas_mensais.loja_vinculada)
    )
  );
