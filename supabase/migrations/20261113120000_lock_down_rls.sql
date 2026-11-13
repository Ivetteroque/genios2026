/*
  # Sprint 0 — Cerrar las reglas de acceso (RLS)

  Hasta ahora varias tablas aceptaban escrituras de cualquiera: `USING (true)`
  para `authenticated` y, en algunos casos, sin rol (o sea, también `anon`).
  Las razones históricas (el admin y los clientes se autenticaban en
  localStorage, sin identidad en el servidor) ya no aplican: los clientes y
  genios entran con Google por Supabase Auth y el admin tiene su rol en
  `app_metadata`, que lee `is_admin()`.

  ## Qué cambia

  | Tabla | Leer | Escribir |
  |---|---|---|
  | payment_settings, platform_settings | todos | solo admin |
  | payment_requests | dueño (genio) o admin | el genio crea la suya en 'pending'; el resto, admin |
  | memberships, payment_history, genius_subscriptions | dueño o admin | solo admin |
  | beta_codes | solo admin | solo admin (el canje llegará por RPC en el Sprint 1) |
  | genius_reviews | visibles: todos; propias: el autor; todas: admin | el autor la suya; moderar y borrar: admin |
  | client_profiles | el propio cliente o admin | el propio cliente; estado y notas: admin |
  | user_favorites | los propios o admin | los propios |
  | whatsapp_clicks | admin | cualquiera (analítica) |
  | reports | autor o admin | cualquiera crea en 'pending'; el resto, admin |
  | storage (fotos, portafolio, reseñas) | todos | usuario con sesión, solo en su carpeta `<auth.uid()>/…` |

  Los campos que solo debe tocar un admin (`moderation_status`, `status`,
  `internal_notes`…) se protegen con triggers: una política no puede limitar
  columnas, y el admin usa el mismo rol `authenticated` que cualquier usuario.

  ## Datos

  - Se elimina `genius_access_credentials` (guardaba contraseñas sin cifrar).
    Las altas de genios pasan a ser por invitación + Google.
  - Los perfiles de cliente creados con un id anterior a Supabase Auth se
    re-asocian por email al id real, junto con sus favoritos y reseñas, para
    que las nuevas reglas (que comparan contra `auth.uid()`) los reconozcan.

  La migración es idempotente: se puede volver a correr sin efectos extra.
*/

-- ---------------------------------------------------------------------------
-- 0. Helpers
-- ---------------------------------------------------------------------------

-- ¿Quién ejecuta? Las migraciones (postgres) y la service_role no deben
-- quedar limitadas por los triggers de "solo admin". Los triggers que la usan
-- son SECURITY INVOKER, así que `current_user` es el rol de quien escribe:
-- `anon`/`authenticated` vía la API, `service_role` con esa clave, `postgres`
-- en el SQL Editor o con psql.
CREATE OR REPLACE FUNCTION is_privileged()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT is_admin()
      OR current_user IN ('postgres', 'supabase_admin', 'service_role');
$$;

-- ¿Es `p_genius_id` (texto o uuid) un perfil de genio del usuario actual?
CREATE OR REPLACE FUNCTION owns_genius_profile(p_genius_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM genius_profiles gp
    WHERE gp.id::text = p_genius_id AND gp.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION owns_genius_profile(text) FROM public;
GRANT EXECUTE ON FUNCTION owns_genius_profile(text) TO anon, authenticated;

-- Borra TODAS las políticas de una tabla de `public` para recrearlas limpias.
-- Así no dependemos de los nombres que tuvieran en migraciones anteriores.
CREATE OR REPLACE FUNCTION pg_temp.drop_all_policies(p_table text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = p_table
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, p_table);
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- 1. Credenciales en texto plano: fuera
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS genius_access_credentials;

-- ---------------------------------------------------------------------------
-- 2. Re-asociar clientes con id heredado al id de Supabase Auth
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS pg_temp.client_id_remap;
CREATE TEMP TABLE client_id_remap AS
SELECT cp.id AS old_id, u.id::text AS new_id
FROM client_profiles cp
JOIN auth.users u ON lower(u.email) = lower(cp.email)
WHERE cp.id <> u.id::text
  AND NOT EXISTS (SELECT 1 FROM client_profiles other WHERE other.id = u.id::text);

UPDATE client_profiles cp
SET id = r.new_id
FROM client_id_remap r
WHERE cp.id = r.old_id;

-- Favoritos: si el usuario ya tiene el mismo genio con el id nuevo, se descarta
-- el duplicado heredado.
DELETE FROM user_favorites f
USING client_id_remap r
WHERE f.user_id = r.old_id
  AND EXISTS (SELECT 1 FROM user_favorites n
              WHERE n.user_id = r.new_id AND n.genius_id = f.genius_id);

UPDATE user_favorites f
SET user_id = r.new_id
FROM client_id_remap r
WHERE f.user_id = r.old_id;

-- Reseñas de cliente: misma lógica (una por cliente y genio).
UPDATE genius_reviews g
SET reviewer_user_id = r.new_id
FROM client_id_remap r
WHERE g.reviewer_type = 'client'
  AND g.reviewer_user_id = r.old_id
  AND NOT EXISTS (SELECT 1 FROM genius_reviews n
                  WHERE n.reviewer_type = 'client'
                    AND n.reviewer_user_id = r.new_id
                    AND n.reviewed_genius_id = g.reviewed_genius_id);

DROP TABLE client_id_remap;

-- ---------------------------------------------------------------------------
-- 3. Configuración: lectura pública, escritura solo admin
-- ---------------------------------------------------------------------------

SELECT pg_temp.drop_all_policies('payment_settings');
SELECT pg_temp.drop_all_policies('platform_settings');

CREATE POLICY "Public read payment settings"
  ON payment_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert payment settings"
  ON payment_settings FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins update payment settings"
  ON payment_settings FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public read platform settings"
  ON platform_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert platform settings"
  ON platform_settings FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins update platform settings"
  ON platform_settings FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- 4. Pagos y membresías
-- ---------------------------------------------------------------------------

SELECT pg_temp.drop_all_policies('payment_requests');
SELECT pg_temp.drop_all_policies('beta_codes');
SELECT pg_temp.drop_all_policies('memberships');
SELECT pg_temp.drop_all_policies('payment_history');
SELECT pg_temp.drop_all_policies('genius_subscriptions');

-- payment_requests: el genio ve y crea las suyas (pendientes); el admin todo.
CREATE POLICY "Owner or admin read payment requests"
  ON payment_requests FOR SELECT TO authenticated
  USING (is_admin() OR owns_genius_profile(genius_profile_id::text));
CREATE POLICY "Genius creates own pending payment request"
  ON payment_requests FOR INSERT TO authenticated
  WITH CHECK (
    is_admin()
    OR (owns_genius_profile(genius_profile_id::text) AND status = 'pending')
  );
CREATE POLICY "Admins update payment requests"
  ON payment_requests FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admins delete payment requests"
  ON payment_requests FOR DELETE TO authenticated USING (is_admin());

-- beta_codes: solo admin. El canje del genio se hará con una RPC.
CREATE POLICY "Admins manage beta codes"
  ON beta_codes FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- memberships
CREATE POLICY "Owner or admin read memberships"
  ON memberships FOR SELECT TO authenticated
  USING (is_admin() OR owns_genius_profile(genius_profile_id::text));
CREATE POLICY "Admins insert memberships"
  ON memberships FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins update memberships"
  ON memberships FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admins delete memberships"
  ON memberships FOR DELETE TO authenticated USING (is_admin());

-- payment_history
CREATE POLICY "Owner or admin read payment history"
  ON payment_history FOR SELECT TO authenticated
  USING (is_admin() OR owns_genius_profile(genius_profile_id::text));
CREATE POLICY "Admins insert payment history"
  ON payment_history FOR INSERT TO authenticated WITH CHECK (is_admin());

-- genius_subscriptions (modelo antiguo; se unifica con memberships en Sprint 1)
CREATE POLICY "Owner or admin read subscription"
  ON genius_subscriptions FOR SELECT TO authenticated
  USING (is_admin() OR owns_genius_profile(genius_id::text));
CREATE POLICY "Admins manage subscriptions"
  ON genius_subscriptions FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins update subscriptions"
  ON genius_subscriptions FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- 5. Reseñas
-- ---------------------------------------------------------------------------

SELECT pg_temp.drop_all_policies('genius_reviews');

-- Autor de la fila: el cliente por su id de Auth, o el genio por su perfil.
CREATE OR REPLACE FUNCTION is_review_author(
  p_reviewer_type text,
  p_reviewer_user_id text,
  p_reviewer_genius_id text
)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    (p_reviewer_type = 'client' AND p_reviewer_user_id = auth.uid()::text)
    OR (p_reviewer_type = 'genius' AND owns_genius_profile(p_reviewer_genius_id))
  );
$$;

CREATE POLICY "Read visible, own or all if admin"
  ON genius_reviews FOR SELECT TO anon, authenticated
  USING (
    moderation_status = 'visible'
    OR is_admin()
    OR is_review_author(reviewer_type, reviewer_user_id, reviewer_genius_id)
  );

-- Nadie se reseña a sí mismo como genio.
CREATE POLICY "Authors insert own review"
  ON genius_reviews FOR INSERT TO authenticated
  WITH CHECK (
    is_admin()
    OR (
      is_review_author(reviewer_type, reviewer_user_id, reviewer_genius_id)
      AND NOT owns_genius_profile(reviewed_genius_id)
    )
  );

CREATE POLICY "Authors update own review"
  ON genius_reviews FOR UPDATE TO authenticated
  USING (is_admin() OR is_review_author(reviewer_type, reviewer_user_id, reviewer_genius_id))
  WITH CHECK (is_admin() OR is_review_author(reviewer_type, reviewer_user_id, reviewer_genius_id));

CREATE POLICY "Admins delete reviews"
  ON genius_reviews FOR DELETE TO authenticated USING (is_admin());

-- Moderación e identidad: solo las cambia un admin.
CREATE OR REPLACE FUNCTION protect_review_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_privileged() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.moderation_status := 'visible';
    NEW.moderation_note   := '';
    NEW.moderated_at      := NULL;
  ELSE
    NEW.moderation_status  := OLD.moderation_status;
    NEW.moderation_note    := OLD.moderation_note;
    NEW.moderated_at       := OLD.moderated_at;
    NEW.reviewer_type      := OLD.reviewer_type;
    NEW.reviewer_user_id   := OLD.reviewer_user_id;
    NEW.reviewer_genius_id := OLD.reviewer_genius_id;
    NEW.reviewed_genius_id := OLD.reviewed_genius_id;
    NEW.created_at         := OLD.created_at;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS genius_reviews_protect_admin_fields ON genius_reviews;
CREATE TRIGGER genius_reviews_protect_admin_fields
  BEFORE INSERT OR UPDATE ON genius_reviews
  FOR EACH ROW EXECUTE FUNCTION protect_review_admin_fields();

-- ---------------------------------------------------------------------------
-- 6. Perfiles de cliente
-- ---------------------------------------------------------------------------

SELECT pg_temp.drop_all_policies('client_profiles');

CREATE POLICY "Client or admin read profile"
  ON client_profiles FOR SELECT TO authenticated
  USING (is_admin() OR id = auth.uid()::text);

-- El id y el email deben ser los de la sesión: nadie crea el perfil de otro.
CREATE POLICY "Client inserts own profile"
  ON client_profiles FOR INSERT TO authenticated
  WITH CHECK (
    id = auth.uid()::text
    AND lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

CREATE POLICY "Client or admin update profile"
  ON client_profiles FOR UPDATE TO authenticated
  USING (is_admin() OR id = auth.uid()::text)
  WITH CHECK (is_admin() OR id = auth.uid()::text);

CREATE OR REPLACE FUNCTION protect_client_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_privileged() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status         := 'active';
    NEW.internal_notes := '';
  ELSE
    NEW.status         := OLD.status;
    NEW.internal_notes := OLD.internal_notes;
    NEW.id             := OLD.id;
    NEW.email          := OLD.email;
    NEW.created_at     := OLD.created_at;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS client_profiles_protect_admin_fields ON client_profiles;
CREATE TRIGGER client_profiles_protect_admin_fields
  BEFORE INSERT OR UPDATE ON client_profiles
  FOR EACH ROW EXECUTE FUNCTION protect_client_admin_fields();

-- ---------------------------------------------------------------------------
-- 7. Favoritos
-- ---------------------------------------------------------------------------

SELECT pg_temp.drop_all_policies('user_favorites');

CREATE POLICY "Owner or admin read favorites"
  ON user_favorites FOR SELECT TO authenticated
  USING (is_admin() OR user_id = auth.uid()::text);
CREATE POLICY "Owner inserts favorites"
  ON user_favorites FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Owner deletes favorites"
  ON user_favorites FOR DELETE TO authenticated
  USING (user_id = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- 8. Analítica de WhatsApp: cualquiera registra, solo admin lee
-- ---------------------------------------------------------------------------

SELECT pg_temp.drop_all_policies('whatsapp_clicks');

CREATE POLICY "Anyone records whatsapp click"
  ON whatsapp_clicks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read whatsapp clicks"
  ON whatsapp_clicks FOR SELECT TO authenticated USING (is_admin());

-- Las RPC de contadores corren como definer: fijar search_path evita que un
-- esquema ajeno suplante `genius_profiles`.
ALTER FUNCTION increment_genius_whatsapp_clicks(text) SET search_path = public;
ALTER FUNCTION increment_genius_profile_views(text) SET search_path = public;

-- ---------------------------------------------------------------------------
-- 9. Reportes: también los visitantes sin sesión pueden reportar
-- ---------------------------------------------------------------------------

SELECT pg_temp.drop_all_policies('reports');

CREATE POLICY "Anyone submits pending report"
  ON reports FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND coalesce(admin_notes, '') = ''
    AND (reporter_id IS NULL OR reporter_id = auth.uid())
  );
CREATE POLICY "Reporter or admin read reports"
  ON reports FOR SELECT TO authenticated
  USING (is_admin() OR reporter_id = auth.uid());
CREATE POLICY "Admins update reports"
  ON reports FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admins delete reports"
  ON reports FOR DELETE TO authenticated USING (is_admin());

-- ---------------------------------------------------------------------------
-- 10. Storage: subir solo con sesión y dentro de la carpeta propia
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Anyone can upload profile-photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload portfolios" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload review images" ON storage.objects;
DROP POLICY IF EXISTS "Users upload to own folder" ON storage.objects;

CREATE POLICY "Users upload to own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('profile-photos', 'portfolios', 'review-images')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
