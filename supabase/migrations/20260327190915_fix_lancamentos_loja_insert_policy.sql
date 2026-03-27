/*
  # Fix INSERT policy for lancamentos_loja

  Adiciona verificação WITH CHECK na política de INSERT para lancamentos_loja.
*/

DROP POLICY IF EXISTS "Gerentes e apoio podem inserir lançamentos da loja" ON lancamentos_loja;

CREATE POLICY "Gerentes e apoio podem inserir lançamentos da loja"
  ON lancamentos_loja
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
        AND u.ativo = true
        AND u.perfil IN ('regional', 'gerente', 'apoio_loja')
        AND (u.perfil = 'regional' OR u.loja_vinculada = lancamentos_loja.loja_vinculada)
    )
  );
