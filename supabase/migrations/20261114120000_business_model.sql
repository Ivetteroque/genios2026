/*
  # Sprint 1 — Modelo de negocio

  ## Reglas
  - **Quién aparece en el directorio:** genios con `status = 'active'` y una
    membresía vigente (beta o anual). `platform_settings.require_membership`
    permite abrir el directorio a todos en una emergencia.
  - **Beta:** el genio canjea un código de `beta_codes` (RPC `redeem_beta_code`)
    y recibe una membresía beta. Un código beta por genio.
  - **Cobro anual:** construido pero apagado (`payment_settings.payments_enabled
    = false`) durante la beta. El genio sube su voucher a un bucket privado y
    crea la solicitud (RPC `submit_payment_request`); el admin la aprueba o
    rechaza en una sola operación (RPC `approve_payment_request` /
    `reject_payment_request`).
  - **Una sola membresía por genio:** `memberships` con UNIQUE en
    `genius_profile_id`. Lo que hubiera en `genius_subscriptions` se copia aquí;
    esa tabla queda en desuso.
  - **Verificado:** el admin revisa el DNI (bucket privado `identity-documents`)
    y lo aprueba (`verified_at`). Si el genio cambia su DNI, vuelve a
    "pendiente".
  - **Suspensión:** `genius_profiles.status = 'suspended'` lo saca del
    directorio; solo el admin puede cambiarlo.

  ## Primera aplicación (una sola vez)
  - Los genios existentes reciben una membresía beta "de fundador" por 90 días,
    para que no desaparezcan del directorio.
  - El cobro anual queda apagado.
  Estas dos acciones no se repiten si la migración se vuelve a correr.
*/

-- ---------------------------------------------------------------------------
-- 1. genius_profiles: estado, verificación y campos de admin
-- ---------------------------------------------------------------------------

ALTER TABLE genius_profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspension_reason text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS verification_note text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS internal_notes text NOT NULL DEFAULT '';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'genius_profiles_status_check') THEN
    ALTER TABLE genius_profiles ADD CONSTRAINT genius_profiles_status_check
      CHECK (status IN ('active', 'suspended'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'genius_profiles_verification_status_check') THEN
    ALTER TABLE genius_profiles ADD CONSTRAINT genius_profiles_verification_status_check
      CHECK (verification_status IN ('none', 'pending', 'verified', 'rejected'));
  END IF;
END $$;

-- Quien ya subió su DNI queda en la cola de verificación.
UPDATE genius_profiles
SET verification_status = 'pending'
WHERE verification_status = 'none'
  AND coalesce(documents, '[]'::jsonb) @> '[{"type": "dni"}]'::jsonb;

-- El documento DNI de una fila (o NULL).
CREATE OR REPLACE FUNCTION dni_document(p_documents jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT d FROM jsonb_array_elements(coalesce(p_documents, '[]'::jsonb)) d
  WHERE d ->> 'type' = 'dni'
  LIMIT 1;
$$;

-- Campos que solo cambia un admin. El genio sigue editando su perfil; si
-- reemplaza su DNI, la verificación vuelve a "pendiente".
CREATE OR REPLACE FUNCTION protect_genius_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF is_privileged() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status            := 'active';
    NEW.suspended_at      := NULL;
    NEW.suspension_reason := '';
    NEW.verified_at       := NULL;
    NEW.verified_by       := '';
    NEW.verification_note := '';
    NEW.is_featured       := false;
    NEW.internal_notes    := '';
    NEW.verification_status := CASE WHEN dni_document(NEW.documents) IS NULL THEN 'none' ELSE 'pending' END;
    NEW.profile_views     := 0;
    NEW.whatsapp_clicks   := 0;
    RETURN NEW;
  END IF;

  NEW.user_id           := OLD.user_id;
  NEW.status            := OLD.status;
  NEW.suspended_at      := OLD.suspended_at;
  NEW.suspension_reason := OLD.suspension_reason;
  NEW.is_featured       := OLD.is_featured;
  NEW.internal_notes    := OLD.internal_notes;
  NEW.profile_views     := OLD.profile_views;
  NEW.whatsapp_clicks   := OLD.whatsapp_clicks;

  IF dni_document(NEW.documents) IS DISTINCT FROM dni_document(OLD.documents) THEN
    NEW.verification_status := CASE WHEN dni_document(NEW.documents) IS NULL THEN 'none' ELSE 'pending' END;
    NEW.verified_at       := NULL;
    NEW.verified_by       := '';
    NEW.verification_note := '';
  ELSE
    NEW.verification_status := OLD.verification_status;
    NEW.verified_at       := OLD.verified_at;
    NEW.verified_by       := OLD.verified_by;
    NEW.verification_note := OLD.verification_note;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS genius_profiles_protect_admin_fields ON genius_profiles;
CREATE TRIGGER genius_profiles_protect_admin_fields
  BEFORE INSERT OR UPDATE ON genius_profiles
  FOR EACH ROW EXECUTE FUNCTION protect_genius_admin_fields();

DROP POLICY IF EXISTS "Admins update genius profiles" ON genius_profiles;
CREATE POLICY "Admins update genius profiles"
  ON genius_profiles FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- 2. Una sola membresía por genio
-- ---------------------------------------------------------------------------

-- Si hubiera duplicadas, se conserva la que vence más tarde.
DELETE FROM memberships m
USING memberships newer
WHERE m.genius_profile_id = newer.genius_profile_id
  AND (m.ends_at < newer.ends_at OR (m.ends_at = newer.ends_at AND m.id < newer.id));

CREATE UNIQUE INDEX IF NOT EXISTS memberships_genius_profile_id_key
  ON memberships (genius_profile_id);

-- Suscripciones del modelo antiguo que sigan vigentes.
INSERT INTO memberships (genius_profile_id, genius_name, genius_email, genius_phone,
                         type, starts_at, ends_at, status)
SELECT s.genius_id, gp.full_name, gp.email, gp.phone,
       'annual', s.subscription_start, s.subscription_end, 'active'
FROM genius_subscriptions s
JOIN genius_profiles gp ON gp.id = s.genius_id
WHERE s.is_active AND s.subscription_end > now()
ON CONFLICT (genius_profile_id) DO NOTHING;

-- Una sola solicitud de pago pendiente por genio.
UPDATE payment_requests pr
SET status = 'rejected', internal_notes = 'Duplicada: había otra solicitud pendiente más reciente.'
WHERE pr.status = 'pending'
  AND EXISTS (SELECT 1 FROM payment_requests newer
              WHERE newer.genius_profile_id = pr.genius_profile_id
                AND newer.status = 'pending'
                AND (newer.created_at > pr.created_at
                     OR (newer.created_at = pr.created_at AND newer.id > pr.id)));

CREATE UNIQUE INDEX IF NOT EXISTS payment_requests_one_pending_idx
  ON payment_requests (genius_profile_id) WHERE status = 'pending';

-- ---------------------------------------------------------------------------
-- 3. Interruptor de visibilidad + acciones de la primera aplicación
-- ---------------------------------------------------------------------------

INSERT INTO platform_settings (platform_name)
SELECT 'Genios'
WHERE NOT EXISTS (SELECT 1 FROM platform_settings);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'platform_settings' AND column_name = 'require_membership') THEN
    ALTER TABLE platform_settings
      ADD COLUMN require_membership boolean NOT NULL DEFAULT true;

    -- Beta: el cobro anual queda apagado hasta que el admin lo encienda.
    UPDATE payment_settings SET payments_enabled = false;

    -- Genios fundadores: membresía beta de 90 días para no salir del directorio.
    INSERT INTO memberships (genius_profile_id, genius_name, genius_email, genius_phone,
                             type, starts_at, ends_at, status)
    SELECT gp.id, gp.full_name, gp.email, gp.phone,
           'beta', now(), now() + interval '90 days', 'active'
    FROM genius_profiles gp
    ON CONFLICT (genius_profile_id) DO NOTHING;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Directorio público: solo activos con membresía vigente
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION has_active_membership(p_genius_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.genius_profile_id = p_genius_id
      AND m.status = 'active'
      AND m.ends_at > now()
  );
$$;

REVOKE ALL ON FUNCTION has_active_membership(uuid) FROM public;
GRANT EXECUTE ON FUNCTION has_active_membership(uuid) TO anon, authenticated;

-- Mismas columnas que antes (en el mismo orden) más `is_verified` e
-- `is_featured` al final, como exige CREATE OR REPLACE VIEW.
CREATE OR REPLACE VIEW public_genius_profiles AS
SELECT
  gp.id,
  gp.full_name,
  gp.profile_photo,
  gp.description,
  gp.category,
  gp.subcategories,
  gp.service_name,
  gp.phone,
  gp.instagram,
  gp.facebook,
  gp.tiktok,
  gp.home_location,
  gp.coverage_type,
  gp.work_locations,
  gp.portfolio,
  (jsonb_array_length(COALESCE(gp.documents, '[]'::jsonb)) > 0) AS has_documents,
  gp.created_at,
  (gp.verified_at IS NOT NULL AND gp.verification_status = 'verified') AS is_verified,
  gp.is_featured
FROM genius_profiles gp
WHERE COALESCE(gp.full_name, '') <> ''
  AND COALESCE(gp.category, '') <> ''
  AND COALESCE(gp.phone, '') <> ''
  AND gp.status = 'active'
  AND (
    NOT COALESCE((SELECT ps.require_membership FROM platform_settings ps LIMIT 1), true)
    OR has_active_membership(gp.id)
  );

ALTER VIEW public_genius_profiles SET (security_invoker = false);
GRANT SELECT ON public_genius_profiles TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Buckets privados: vouchers de pago y documentos de identidad
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('payment-vouchers', 'payment-vouchers', false, 5242880,
   ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('identity-documents', 'identity-documents', false, 5242880,
   ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Owner uploads private files" ON storage.objects;
DROP POLICY IF EXISTS "Owner or admin reads private files" ON storage.objects;

CREATE POLICY "Owner uploads private files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('payment-vouchers', 'identity-documents')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owner or admin reads private files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id IN ('payment-vouchers', 'identity-documents')
    AND ((storage.foldername(name))[1] = auth.uid()::text OR is_admin())
  );

-- ---------------------------------------------------------------------------
-- 6. RPCs
-- ---------------------------------------------------------------------------

-- Errores con código legible: el front los traduce a mensajes en español.
CREATE OR REPLACE FUNCTION raise_app_error(p_code text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = p_code;
END;
$$;

-- 6.1 Canje de código beta (genio)
CREATE OR REPLACE FUNCTION redeem_beta_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid  uuid := auth.uid();
  v_gp   genius_profiles%ROWTYPE;
  v_code beta_codes%ROWTYPE;
  v_mem  memberships%ROWTYPE;
  v_has_mem boolean;
  v_type text;
  v_ends timestamptz;
  v_scope text;
BEGIN
  IF v_uid IS NULL THEN PERFORM raise_app_error('not_authenticated'); END IF;

  SELECT * INTO v_gp FROM genius_profiles WHERE user_id = v_uid;
  IF NOT FOUND THEN PERFORM raise_app_error('no_genius_profile'); END IF;
  IF v_gp.status <> 'active' THEN PERFORM raise_app_error('genius_suspended'); END IF;

  SELECT * INTO v_code FROM beta_codes
  WHERE upper(code) = upper(trim(p_code))
  FOR UPDATE;
  IF NOT FOUND OR NOT v_code.is_active THEN PERFORM raise_app_error('invalid_code'); END IF;
  IF v_code.expires_at IS NOT NULL AND v_code.expires_at < now() THEN PERFORM raise_app_error('expired_code'); END IF;
  IF v_code.used_count >= v_code.max_uses THEN PERFORM raise_app_error('code_exhausted'); END IF;

  v_scope := lower(trim(coalesce(v_code.scope_department, '')));
  IF v_scope <> '' AND v_scope NOT IN (
    lower(coalesce(v_gp.home_location ->> 'departmentId', '')),
    lower(coalesce(v_gp.home_location ->> 'departmentName', ''))
  ) THEN
    PERFORM raise_app_error('out_of_scope');
  END IF;

  SELECT * INTO v_mem FROM memberships WHERE genius_profile_id = v_gp.id FOR UPDATE;
  v_has_mem := FOUND;

  IF v_has_mem AND v_mem.status = 'suspended' THEN PERFORM raise_app_error('membership_suspended'); END IF;
  IF v_has_mem AND v_mem.beta_code_id IS NOT NULL THEN PERFORM raise_app_error('already_redeemed'); END IF;

  -- Suma días sobre lo que quede vigente; una membresía anual sigue siendo anual.
  v_ends := greatest(CASE WHEN v_has_mem THEN v_mem.ends_at ELSE now() END, now())
            + make_interval(days => v_code.duration_days);
  v_type := CASE WHEN v_has_mem AND v_mem.type = 'annual' AND v_mem.ends_at > now()
                 THEN 'annual' ELSE 'beta' END;

  INSERT INTO memberships (genius_profile_id, genius_name, genius_email, genius_phone,
                           type, starts_at, ends_at, status, beta_code_id)
  VALUES (v_gp.id, v_gp.full_name, v_gp.email, v_gp.phone,
          v_type, now(), v_ends, 'active', v_code.id)
  ON CONFLICT (genius_profile_id) DO UPDATE
    SET type = EXCLUDED.type,
        ends_at = EXCLUDED.ends_at,
        status = 'active',
        beta_code_id = EXCLUDED.beta_code_id,
        updated_at = now();

  UPDATE beta_codes SET used_count = used_count + 1, updated_at = now() WHERE id = v_code.id;

  INSERT INTO payment_history (genius_profile_id, genius_name, genius_email, amount,
                               payment_method, operation_reference, status,
                               approved_by, approved_at, internal_notes)
  VALUES (v_gp.id, v_gp.full_name, v_gp.email, 0,
          'beta_code', v_code.code, 'approved',
          'codigo-beta', now(), 'Canje de código beta');

  RETURN jsonb_build_object('type', v_type, 'ends_at', v_ends);
END;
$$;

-- 6.2 Solicitud de pago anual (genio)
CREATE OR REPLACE FUNCTION submit_payment_request(
  p_payment_method text,
  p_operation_reference text,
  p_voucher_path text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_gp  genius_profiles%ROWTYPE;
  v_settings payment_settings%ROWTYPE;
  v_id  uuid;
BEGIN
  IF v_uid IS NULL THEN PERFORM raise_app_error('not_authenticated'); END IF;

  SELECT * INTO v_gp FROM genius_profiles WHERE user_id = v_uid;
  IF NOT FOUND THEN PERFORM raise_app_error('no_genius_profile'); END IF;
  IF v_gp.status <> 'active' THEN PERFORM raise_app_error('genius_suspended'); END IF;

  SELECT * INTO v_settings FROM payment_settings LIMIT 1;
  IF NOT FOUND OR NOT v_settings.payments_enabled THEN PERFORM raise_app_error('payments_disabled'); END IF;

  IF p_payment_method NOT IN ('yape', 'plin', 'transfer') THEN PERFORM raise_app_error('invalid_method'); END IF;
  IF coalesce(p_voucher_path, '') = '' OR split_part(p_voucher_path, '/', 1) <> v_uid::text THEN
    PERFORM raise_app_error('invalid_voucher');
  END IF;

  IF EXISTS (SELECT 1 FROM payment_requests WHERE genius_profile_id = v_gp.id AND status = 'pending') THEN
    PERFORM raise_app_error('request_already_pending');
  END IF;

  INSERT INTO payment_requests (genius_profile_id, genius_name, genius_email, genius_phone,
                                activation_type, payment_method, amount,
                                operation_reference, voucher_url, status)
  VALUES (v_gp.id, v_gp.full_name, v_gp.email, v_gp.phone,
          'annual_payment', p_payment_method, v_settings.annual_price,
          left(coalesce(p_operation_reference, ''), 100), p_voucher_path, 'pending')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 6.3 Aprobar un pago (admin): solicitud, membresía e historial juntos.
CREATE OR REPLACE FUNCTION approve_payment_request(p_request_id uuid, p_days integer DEFAULT 365)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req payment_requests%ROWTYPE;
  v_mem memberships%ROWTYPE;
  v_has_mem boolean;
  v_admin text := coalesce(auth.jwt() ->> 'email', 'admin');
  v_ends timestamptz;
BEGIN
  IF NOT is_admin() THEN PERFORM raise_app_error('forbidden'); END IF;

  SELECT * INTO v_req FROM payment_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN PERFORM raise_app_error('request_not_found'); END IF;
  IF v_req.status NOT IN ('pending', 'observed') THEN PERFORM raise_app_error('request_already_reviewed'); END IF;
  IF v_req.genius_profile_id IS NULL THEN PERFORM raise_app_error('genius_not_found'); END IF;

  SELECT * INTO v_mem FROM memberships WHERE genius_profile_id = v_req.genius_profile_id FOR UPDATE;
  v_has_mem := FOUND;

  -- Lo que quede de una membresía vigente no se pierde: se suma.
  v_ends := greatest(CASE WHEN v_has_mem AND v_mem.status <> 'suspended' THEN v_mem.ends_at ELSE now() END, now())
            + make_interval(days => greatest(coalesce(p_days, 365), 1));

  UPDATE payment_requests
  SET status = 'approved', reviewed_by = v_admin, reviewed_at = now(), updated_at = now()
  WHERE id = v_req.id;

  INSERT INTO memberships (genius_profile_id, genius_name, genius_email, genius_phone,
                           type, starts_at, ends_at, status, payment_request_id)
  VALUES (v_req.genius_profile_id, v_req.genius_name, v_req.genius_email, v_req.genius_phone,
          'annual', now(), v_ends, 'active', v_req.id)
  ON CONFLICT (genius_profile_id) DO UPDATE
    SET type = 'annual',
        ends_at = EXCLUDED.ends_at,
        status = 'active',
        payment_request_id = EXCLUDED.payment_request_id,
        suspended_by = '',
        suspended_at = NULL,
        updated_at = now();

  INSERT INTO payment_history (genius_profile_id, genius_name, genius_email, amount,
                               payment_method, operation_reference, voucher_url,
                               status, approved_by, approved_at)
  VALUES (v_req.genius_profile_id, v_req.genius_name, v_req.genius_email, v_req.amount,
          v_req.payment_method, v_req.operation_reference, v_req.voucher_url,
          'approved', v_admin, now());

  RETURN jsonb_build_object('ends_at', v_ends);
END;
$$;

-- 6.4 Rechazar un pago (admin)
CREATE OR REPLACE FUNCTION reject_payment_request(p_request_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req payment_requests%ROWTYPE;
  v_admin text := coalesce(auth.jwt() ->> 'email', 'admin');
BEGIN
  IF NOT is_admin() THEN PERFORM raise_app_error('forbidden'); END IF;
  IF coalesce(trim(p_reason), '') = '' THEN PERFORM raise_app_error('reason_required'); END IF;

  SELECT * INTO v_req FROM payment_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN PERFORM raise_app_error('request_not_found'); END IF;
  IF v_req.status NOT IN ('pending', 'observed') THEN PERFORM raise_app_error('request_already_reviewed'); END IF;

  UPDATE payment_requests
  SET status = 'rejected', reviewed_by = v_admin, reviewed_at = now(),
      internal_notes = p_reason, updated_at = now()
  WHERE id = v_req.id;

  INSERT INTO payment_history (genius_profile_id, genius_name, genius_email, amount,
                               payment_method, operation_reference, voucher_url,
                               status, rejected_by, rejected_at, rejection_reason)
  VALUES (v_req.genius_profile_id, v_req.genius_name, v_req.genius_email, v_req.amount,
          v_req.payment_method, v_req.operation_reference, v_req.voucher_url,
          'rejected', v_admin, now(), p_reason);
END;
$$;

REVOKE ALL ON FUNCTION redeem_beta_code(text) FROM public;
REVOKE ALL ON FUNCTION submit_payment_request(text, text, text) FROM public;
REVOKE ALL ON FUNCTION approve_payment_request(uuid, integer) FROM public;
REVOKE ALL ON FUNCTION reject_payment_request(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION redeem_beta_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION submit_payment_request(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_payment_request(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_payment_request(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. Clientes suspendidos: no publican ni editan reseñas
-- ---------------------------------------------------------------------------
-- La app además cierra su sesión al entrar (SocialAuthBridge); esto cubre a
-- quien llame a la API directamente con un token todavía válido.

CREATE OR REPLACE FUNCTION is_suspended_client()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM client_profiles cp
    WHERE cp.id = auth.uid()::text AND cp.status = 'suspended'
  );
$$;

REVOKE ALL ON FUNCTION is_suspended_client() FROM public;
GRANT EXECUTE ON FUNCTION is_suspended_client() TO anon, authenticated;

DROP POLICY IF EXISTS "Authors insert own review" ON genius_reviews;
CREATE POLICY "Authors insert own review"
  ON genius_reviews FOR INSERT TO authenticated
  WITH CHECK (
    is_admin()
    OR (
      is_review_author(reviewer_type, reviewer_user_id, reviewer_genius_id)
      AND NOT owns_genius_profile(reviewed_genius_id)
      AND NOT is_suspended_client()
    )
  );

DROP POLICY IF EXISTS "Authors update own review" ON genius_reviews;
CREATE POLICY "Authors update own review"
  ON genius_reviews FOR UPDATE TO authenticated
  USING (is_admin() OR (is_review_author(reviewer_type, reviewer_user_id, reviewer_genius_id) AND NOT is_suspended_client()))
  WITH CHECK (is_admin() OR (is_review_author(reviewer_type, reviewer_user_id, reviewer_genius_id) AND NOT is_suspended_client()));

-- ---------------------------------------------------------------------------
-- 8. Catálogos compartidos: categorías y ubicaciones
-- ---------------------------------------------------------------------------
-- Antes vivían en el localStorage del navegador del admin: lo que editaba no
-- lo veía nadie más. Ahora la fuente es esta tabla; el navegador solo guarda
-- una caché que se refresca en cada visita. Mientras una clave no exista, la
-- app usa los valores por defecto del código.

CREATE TABLE IF NOT EXISTS site_catalogs (
  key        text PRIMARY KEY CHECK (key IN ('categories', 'locations')),
  data       jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text NOT NULL DEFAULT ''
);

ALTER TABLE site_catalogs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read catalogs" ON site_catalogs;
DROP POLICY IF EXISTS "Admins insert catalogs" ON site_catalogs;
DROP POLICY IF EXISTS "Admins update catalogs" ON site_catalogs;

CREATE POLICY "Public read catalogs"
  ON site_catalogs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert catalogs"
  ON site_catalogs FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "Admins update catalogs"
  ON site_catalogs FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

GRANT SELECT ON site_catalogs TO anon, authenticated;
GRANT INSERT, UPDATE ON site_catalogs TO authenticated;
