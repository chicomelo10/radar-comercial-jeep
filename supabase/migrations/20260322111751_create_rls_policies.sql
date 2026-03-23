/*
  # Criar políticas RLS para todas as tabelas
  
  1. Políticas
    - Lojas: todos podem ver, apenas regional pode modificar
    - Usuários: acesso baseado em perfil e loja
    - Vendedores: acesso baseado em loja
    - Demais tabelas: acesso baseado em loja e perfil
    
  2. Segurança
    - Regional vê tudo
    - Gerente vê apenas sua loja
    - Apoio vê apenas sua loja
    - Vendedor vê apenas seus dados
*/

-- Políticas para LOJAS
CREATE POLICY "Usuários autenticados podem visualizar lojas"
  ON lojas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Apenas regionais podem inserir lojas"
  ON lojas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.perfil = 'regional'
    )
  );

CREATE POLICY "Apenas regionais podem atualizar lojas"
  ON lojas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid()
      AND usuarios.perfil = 'regional'
    )
  );

-- Políticas para USUÁRIOS
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON usuarios FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Regionais podem ver todos os usuários"
  ON usuarios FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.perfil = 'regional'
    )
  );

CREATE POLICY "Gerentes podem ver usuários da mesma loja"
  ON usuarios FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.perfil IN ('gerente', 'apoio_loja')
      AND u.loja_vinculada = usuarios.loja_vinculada
    )
  );

CREATE POLICY "Apenas regionais podem inserir usuários"
  ON usuarios FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.perfil = 'regional'
    )
  );

-- Políticas para VENDEDORES
CREATE POLICY "Usuários podem ver vendedores da própria loja"
  ON vendedores FOR SELECT
  TO authenticated
  USING (
    loja_vinculada IN (
      SELECT loja_vinculada FROM usuarios WHERE id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil = 'regional'
    )
  );

CREATE POLICY "Gerentes e regionais podem inserir vendedores"
  ON vendedores FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND (
        (u.perfil = 'gerente' AND u.loja_vinculada = vendedores.loja_vinculada)
        OR u.perfil = 'regional'
      )
    )
  );

CREATE POLICY "Gerentes e regionais podem atualizar vendedores"
  ON vendedores FOR UPDATE
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

-- Políticas para DISPONIBILIDADE_EQUIPE
CREATE POLICY "Usuários podem ver disponibilidade da própria loja"
  ON disponibilidade_equipe FOR SELECT
  TO authenticated
  USING (
    loja_vinculada IN (
      SELECT loja_vinculada FROM usuarios WHERE id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil = 'regional'
    )
  );

CREATE POLICY "Gerentes e apoio podem inserir disponibilidade"
  ON disponibilidade_equipe FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.pode_editar_equipe = true
      AND (u.loja_vinculada = disponibilidade_equipe.loja_vinculada OR u.perfil = 'regional')
    )
  );

-- Políticas para METAS_MENSAIS
CREATE POLICY "Usuários podem ver metas da própria loja"
  ON metas_mensais FOR SELECT
  TO authenticated
  USING (
    loja_vinculada IN (
      SELECT loja_vinculada FROM usuarios WHERE id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil = 'regional'
    )
  );

CREATE POLICY "Usuários autorizados podem inserir metas"
  ON metas_mensais FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND (u.pode_editar_metas = true OR u.perfil = 'regional')
      AND (u.loja_vinculada = metas_mensais.loja_vinculada OR u.perfil = 'regional')
    )
  );

CREATE POLICY "Usuários autorizados podem atualizar metas"
  ON metas_mensais FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND (u.pode_editar_metas = true OR u.perfil = 'regional')
      AND (u.loja_vinculada = metas_mensais.loja_vinculada OR u.perfil = 'regional')
    )
  );

-- Políticas para LANCAMENTOS_LOJA
CREATE POLICY "Usuários podem ver lançamentos da própria loja"
  ON lancamentos_loja FOR SELECT
  TO authenticated
  USING (
    loja_vinculada IN (
      SELECT loja_vinculada FROM usuarios WHERE id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil = 'regional'
    )
  );

CREATE POLICY "Gerentes e apoio podem inserir lançamentos da loja"
  ON lancamentos_loja FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.perfil IN ('gerente', 'apoio_loja', 'regional')
      AND (u.loja_vinculada = lancamentos_loja.loja_vinculada OR u.perfil = 'regional')
    )
  );

CREATE POLICY "Gerentes e apoio podem atualizar lançamentos da loja"
  ON lancamentos_loja FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.perfil IN ('gerente', 'apoio_loja', 'regional')
      AND (u.loja_vinculada = lancamentos_loja.loja_vinculada OR u.perfil = 'regional')
    )
  );

-- Políticas para LANCAMENTOS_VENDEDOR
CREATE POLICY "Vendedor pode ver seus próprios lançamentos"
  ON lancamentos_vendedor FOR SELECT
  TO authenticated
  USING (
    vendedor_id IN (
      SELECT id FROM vendedores v
      WHERE v.email_vendedor = (SELECT email_usuario FROM usuarios WHERE id = auth.uid())
    )
    OR
    loja_vinculada IN (
      SELECT loja_vinculada FROM usuarios WHERE id = auth.uid() AND perfil IN ('gerente', 'apoio_loja')
    )
    OR
    EXISTS (
      SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil = 'regional'
    )
  );

CREATE POLICY "Vendedor pode inserir seus próprios lançamentos"
  ON lancamentos_vendedor FOR INSERT
  TO authenticated
  WITH CHECK (
    vendedor_id IN (
      SELECT id FROM vendedores v
      WHERE v.email_vendedor = (SELECT email_usuario FROM usuarios WHERE id = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND (u.pode_lancar_por_terceiros = true OR u.perfil = 'regional')
      AND (u.loja_vinculada = lancamentos_vendedor.loja_vinculada OR u.perfil = 'regional')
    )
  );

CREATE POLICY "Vendedor e gerente podem atualizar lançamentos"
  ON lancamentos_vendedor FOR UPDATE
  TO authenticated
  USING (
    vendedor_id IN (
      SELECT id FROM vendedores v
      WHERE v.email_vendedor = (SELECT email_usuario FROM usuarios WHERE id = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND (u.pode_lancar_por_terceiros = true OR u.perfil = 'regional')
      AND (u.loja_vinculada = lancamentos_vendedor.loja_vinculada OR u.perfil = 'regional')
    )
  );

-- Políticas para ACOMPANHAMENTOS_GERENTE
CREATE POLICY "Gerentes podem ver acompanhamentos da própria loja"
  ON acompanhamentos_gerente FOR SELECT
  TO authenticated
  USING (
    loja_vinculada IN (
      SELECT loja_vinculada FROM usuarios WHERE id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil = 'regional'
    )
  );

CREATE POLICY "Apenas gerentes podem inserir acompanhamentos"
  ON acompanhamentos_gerente FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.perfil IN ('gerente', 'regional')
      AND (u.loja_vinculada = acompanhamentos_gerente.loja_vinculada OR u.perfil = 'regional')
    )
  );

CREATE POLICY "Apenas gerentes podem atualizar acompanhamentos"
  ON acompanhamentos_gerente FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = auth.uid()
      AND u.perfil IN ('gerente', 'regional')
      AND (u.loja_vinculada = acompanhamentos_gerente.loja_vinculada OR u.perfil = 'regional')
    )
  );

-- Políticas para HISTORICO_ALTERACOES
CREATE POLICY "Usuários podem ver histórico relacionado"
  ON historico_alteracoes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios WHERE id = auth.uid() AND perfil IN ('regional', 'gerente', 'apoio_loja')
    )
  );

CREATE POLICY "Sistema pode inserir no histórico"
  ON historico_alteracoes FOR INSERT
  TO authenticated
  WITH CHECK (true);