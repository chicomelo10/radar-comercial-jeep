/*
  # Otimizar Políticas RLS para Performance

  1. Objetivo
    - Resolver alertas de "Auth RLS Initialization Plan"
    - Melhorar performance usando (SELECT auth.uid()) em vez de auth.uid()
    - Isso evita re-avaliação da função auth.uid() para cada linha

  2. Estratégia
    - Dropar políticas antigas
    - Recriar com (SELECT auth.uid()) para melhor performance
    - Consolidar políticas permissivas duplicadas em usuarios

  3. Tabelas Afetadas
    - lojas
    - usuarios
    - vendedores
    - disponibilidade_equipe
    - metas_mensais
    - lancamentos_loja
    - lancamentos_vendedor
    - acompanhamentos_gerente
    - historico_alteracoes
*/

-- ============================================
-- LOJAS: Otimizar políticas
-- ============================================

DROP POLICY IF EXISTS "Apenas regionais podem atualizar lojas" ON lojas;
DROP POLICY IF EXISTS "Apenas regionais podem inserir lojas" ON lojas;

CREATE POLICY "Apenas regionais podem atualizar lojas"
  ON lojas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (SELECT auth.uid())
      AND usuarios.perfil = 'regional'
      AND usuarios.ativo = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (SELECT auth.uid())
      AND usuarios.perfil = 'regional'
      AND usuarios.ativo = true
    )
  );

CREATE POLICY "Apenas regionais podem inserir lojas"
  ON lojas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = (SELECT auth.uid())
      AND usuarios.perfil = 'regional'
      AND usuarios.ativo = true
    )
  );

-- ============================================
-- USUARIOS: Consolidar e otimizar políticas
-- ============================================

DROP POLICY IF EXISTS "Apenas regionais podem inserir usuários" ON usuarios;
DROP POLICY IF EXISTS "Gerentes podem ver usuários da mesma loja" ON usuarios;
DROP POLICY IF EXISTS "Regionais podem ver todos os usuários" ON usuarios;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON usuarios;

CREATE POLICY "Apenas regionais podem inserir usuários"
  ON usuarios FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = (SELECT auth.uid())
      AND u.perfil = 'regional'
      AND u.ativo = true
    )
  );

-- Consolidar as 3 políticas SELECT em uma única política
CREATE POLICY "Usuários podem ver perfis permitidos"
  ON usuarios FOR SELECT
  TO authenticated
  USING (
    -- Ver próprio perfil
    id = (SELECT auth.uid())
    OR
    -- Regionais veem todos
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = (SELECT auth.uid())
      AND u.perfil = 'regional'
      AND u.ativo = true
    )
    OR
    -- Gerentes veem usuários da mesma loja
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = (SELECT auth.uid())
      AND u.perfil IN ('gerente', 'apoio_loja')
      AND u.loja_vinculada = usuarios.loja_vinculada
      AND u.ativo = true
    )
  );

-- ============================================
-- VENDEDORES: Otimizar políticas
-- ============================================

DROP POLICY IF EXISTS "Gerentes e regionais podem atualizar vendedores" ON vendedores;
DROP POLICY IF EXISTS "Gerentes e regionais podem inserir vendedores" ON vendedores;
DROP POLICY IF EXISTS "Usuários podem ver vendedores da própria loja" ON vendedores;

CREATE POLICY "Gerentes e regionais podem atualizar vendedores"
  ON vendedores FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = (SELECT auth.uid())
      AND u.ativo = true
      AND (
        u.perfil = 'regional'
        OR (u.perfil IN ('gerente', 'apoio_loja') AND u.loja_vinculada = vendedores.loja_vinculada AND u.pode_editar_equipe = true)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = (SELECT auth.uid())
      AND u.ativo = true
      AND (
        u.perfil = 'regional'
        OR (u.perfil IN ('gerente', 'apoio_loja') AND u.loja_vinculada = vendedores.loja_vinculada AND u.pode_editar_equipe = true)
      )
    )
  );

CREATE POLICY "Gerentes e regionais podem inserir vendedores"
  ON vendedores FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = (SELECT auth.uid())
      AND u.ativo = true
      AND (
        u.perfil = 'regional'
        OR (u.perfil IN ('gerente', 'apoio_loja') AND u.pode_editar_equipe = true)
      )
    )
  );

CREATE POLICY "Usuários podem ver vendedores da própria loja"
  ON vendedores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = (SELECT auth.uid())
      AND u.ativo = true
      AND (
        u.perfil = 'regional'
        OR u.loja_vinculada = vendedores.loja_vinculada
      )
    )
  );

-- ============================================
-- DISPONIBILIDADE_EQUIPE: Otimizar políticas
-- ============================================

DROP POLICY IF EXISTS "Gerentes e apoio podem inserir disponibilidade" ON disponibilidade_equipe;
DROP POLICY IF EXISTS "Usuários podem ver disponibilidade da própria loja" ON disponibilidade_equipe;

CREATE POLICY "Gerentes e apoio podem inserir disponibilidade"
  ON disponibilidade_equipe FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = (SELECT auth.uid())
      AND u.ativo = true
      AND u.perfil IN ('regional', 'gerente', 'apoio_loja')
      AND (u.perfil = 'regional' OR u.loja_vinculada = disponibilidade_equipe.loja_vinculada)
    )
  );

CREATE POLICY "Usuários podem ver disponibilidade da própria loja"
  ON disponibilidade_equipe FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = (SELECT auth.uid())
      AND u.ativo = true
      AND (
        u.perfil = 'regional'
        OR u.loja_vinculada = disponibilidade_equipe.loja_vinculada
      )
    )
  );

-- ============================================
-- METAS_MENSAIS: Otimizar políticas
-- ============================================

DROP POLICY IF EXISTS "Usuários autorizados podem atualizar metas" ON metas_mensais;
DROP POLICY IF EXISTS "Usuários autorizados podem inserir metas" ON metas_mensais;
DROP POLICY IF EXISTS "Usuários podem ver metas da própria loja" ON metas_mensais;

CREATE POLICY "Usuários autorizados podem atualizar metas"
  ON metas_mensais FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = (SELECT auth.uid())
      AND u.ativo = true
      AND u.pode_editar_metas = true
      AND (u.perfil = 'regional' OR u.loja_vinculada = metas_mensais.loja_vinculada)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = (SELECT auth.uid())
      AND u.ativo = true
      AND u.pode_editar_metas = true
      AND (u.perfil = 'regional' OR u.loja_vinculada = metas_mensais.loja_vinculada)
    )
  );

CREATE POLICY "Usuários autorizados podem inserir metas"
  ON metas_mensais FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = (SELECT auth.uid())
      AND u.ativo = true
      AND u.pode_editar_metas = true
    )
  );

CREATE POLICY "Usuários podem ver metas da própria loja"
  ON metas_mensais FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = (SELECT auth.uid())
      AND u.ativo = true
      AND (
        u.perfil = 'regional'
        OR u.loja_vinculada = metas_mensais.loja_vinculada
      )
    )
  );

-- ============================================
-- LANCAMENTOS_LOJA: Otimizar políticas
-- ============================================

DROP POLICY IF EXISTS "Gerentes e apoio podem atualizar lançamentos da loja" ON lancamentos_loja;
DROP POLICY IF EXISTS "Gerentes e apoio podem inserir lançamentos da loja" ON lancamentos_loja;
DROP POLICY IF EXISTS "Usuários podem ver lançamentos da própria loja" ON lancamentos_loja;

CREATE POLICY "Gerentes e apoio podem atualizar lançamentos da loja"
  ON lancamentos_loja FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = (SELECT auth.uid())
      AND u.ativo = true
      AND u.perfil IN ('regional', 'gerente', 'apoio_loja')
      AND (u.perfil = 'regional' OR u.loja_vinculada = lancamentos_loja.loja_vinculada)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = (SELECT auth.uid())
      AND u.ativo = true
      AND u.perfil IN ('regional', 'gerente', 'apoio_loja')
      AND (u.perfil = 'regional' OR u.loja_vinculada = lancamentos_loja.loja_vinculada)
    )
  );

CREATE POLICY "Gerentes e apoio podem inserir lançamentos da loja"
  ON lancamentos_loja FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = (SELECT auth.uid())
      AND u.ativo = true
      AND u.perfil IN ('regional', 'gerente', 'apoio_loja')
      AND (u.perfil = 'regional' OR u.loja_vinculada = lancamentos_loja.loja_vinculada)
    )
  );

CREATE POLICY "Usuários podem ver lançamentos da própria loja"
  ON lancamentos_loja FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = (SELECT auth.uid())
      AND u.ativo = true
      AND (
        u.perfil = 'regional'
        OR u.loja_vinculada = lancamentos_loja.loja_vinculada
      )
    )
  );

-- ============================================
-- LANCAMENTOS_VENDEDOR: Otimizar políticas
-- ============================================

DROP POLICY IF EXISTS "Vendedor e gerente podem atualizar lançamentos" ON lancamentos_vendedor;
DROP POLICY IF EXISTS "Vendedor pode inserir seus próprios lançamentos" ON lancamentos_vendedor;
DROP POLICY IF EXISTS "Vendedor pode ver seus próprios lançamentos" ON lancamentos_vendedor;

CREATE POLICY "Vendedor e gerente podem atualizar lançamentos"
  ON lancamentos_vendedor FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      LEFT JOIN vendedores v ON u.id = v.id
      WHERE u.id = (SELECT auth.uid())
      AND u.ativo = true
      AND (
        u.perfil = 'regional'
        OR (u.perfil IN ('gerente', 'apoio_loja') AND u.loja_vinculada = lancamentos_vendedor.loja_vinculada AND u.pode_lancar_por_terceiros = true)
        OR (u.perfil = 'vendedor' AND v.id = lancamentos_vendedor.vendedor_id)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      LEFT JOIN vendedores v ON u.id = v.id
      WHERE u.id = (SELECT auth.uid())
      AND u.ativo = true
      AND (
        u.perfil = 'regional'
        OR (u.perfil IN ('gerente', 'apoio_loja') AND u.loja_vinculada = lancamentos_vendedor.loja_vinculada AND u.pode_lancar_por_terceiros = true)
        OR (u.perfil = 'vendedor' AND v.id = lancamentos_vendedor.vendedor_id)
      )
    )
  );

CREATE POLICY "Vendedor pode inserir seus próprios lançamentos"
  ON lancamentos_vendedor FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      LEFT JOIN vendedores v ON u.id = v.id
      WHERE u.id = (SELECT auth.uid())
      AND u.ativo = true
      AND (
        u.perfil = 'regional'
        OR (u.perfil IN ('gerente', 'apoio_loja') AND u.pode_lancar_por_terceiros = true)
        OR (u.perfil = 'vendedor' AND v.id = lancamentos_vendedor.vendedor_id)
      )
    )
  );

CREATE POLICY "Vendedor pode ver seus próprios lançamentos"
  ON lancamentos_vendedor FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      LEFT JOIN vendedores v ON u.id = v.id
      WHERE u.id = (SELECT auth.uid())
      AND u.ativo = true
      AND (
        u.perfil = 'regional'
        OR u.loja_vinculada = lancamentos_vendedor.loja_vinculada
        OR (u.perfil = 'vendedor' AND v.id = lancamentos_vendedor.vendedor_id)
      )
    )
  );

-- ============================================
-- ACOMPANHAMENTOS_GERENTE: Otimizar políticas
-- ============================================

DROP POLICY IF EXISTS "Apenas gerentes podem atualizar acompanhamentos" ON acompanhamentos_gerente;
DROP POLICY IF EXISTS "Apenas gerentes podem inserir acompanhamentos" ON acompanhamentos_gerente;
DROP POLICY IF EXISTS "Gerentes podem ver acompanhamentos da própria loja" ON acompanhamentos_gerente;

CREATE POLICY "Apenas gerentes podem atualizar acompanhamentos"
  ON acompanhamentos_gerente FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = (SELECT auth.uid())
      AND u.ativo = true
      AND u.perfil IN ('regional', 'gerente')
      AND (u.perfil = 'regional' OR u.loja_vinculada = acompanhamentos_gerente.loja_vinculada)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = (SELECT auth.uid())
      AND u.ativo = true
      AND u.perfil IN ('regional', 'gerente')
      AND (u.perfil = 'regional' OR u.loja_vinculada = acompanhamentos_gerente.loja_vinculada)
    )
  );

CREATE POLICY "Apenas gerentes podem inserir acompanhamentos"
  ON acompanhamentos_gerente FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = (SELECT auth.uid())
      AND u.ativo = true
      AND u.perfil IN ('regional', 'gerente')
    )
  );

CREATE POLICY "Gerentes podem ver acompanhamentos da própria loja"
  ON acompanhamentos_gerente FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = (SELECT auth.uid())
      AND u.ativo = true
      AND (
        u.perfil = 'regional'
        OR u.loja_vinculada = acompanhamentos_gerente.loja_vinculada
      )
    )
  );

-- ============================================
-- HISTORICO_ALTERACOES: Otimizar e corrigir política
-- ============================================

DROP POLICY IF EXISTS "Usuários podem ver histórico relacionado" ON historico_alteracoes;
DROP POLICY IF EXISTS "Sistema pode inserir no histórico" ON historico_alteracoes;

CREATE POLICY "Usuários podem ver histórico relacionado"
  ON historico_alteracoes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u
      WHERE u.id = (SELECT auth.uid())
      AND u.ativo = true
      AND (
        u.perfil = 'regional'
        OR usuario_id = (SELECT auth.uid())
      )
    )
  );

-- Política de INSERT mais restritiva (não permite acesso irrestrito)
CREATE POLICY "Usuários autenticados podem inserir histórico"
  ON historico_alteracoes FOR INSERT
  TO authenticated
  WITH CHECK (
    usuario_id = (SELECT auth.uid())
  );
