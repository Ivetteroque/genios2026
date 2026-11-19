/*
  # Panel del genio

  1. `my_genius_stats()`: los números que el genio ve en su inicio (visitas,
     mensajes por WhatsApp, cuántos lo guardaron y sus reseñas). Corre como
     definer porque los favoritos de cada cliente son privados: el genio solo
     recibe el total, nunca quién lo guardó.

  2. Gracia mientras se revisa un pago: si el genio ya tuvo acceso, se le venció
     y subió su comprobante, sigue visible hasta que el admin lo apruebe o lo
     rechace. Así nadie pierde clientes por una demora nuestra. Quien nunca
     tuvo acceso no gana visibilidad solo por subir una imagen, y una membresía
     suspendida tampoco.

  3. Las funciones de pago y canje dejan de ser ejecutables por visitantes sin
     sesión (Supabase las concede a `anon` por defecto; igual validaban la
     sesión por dentro).
*/

-- 1. Números del genio --------------------------------------------------------

CREATE OR REPLACE FUNCTION my_genius_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'profile_views',   coalesce(gp.profile_views, 0),
    'whatsapp_clicks', coalesce(gp.whatsapp_clicks, 0),
    'favorites',       (SELECT count(*) FROM user_favorites f WHERE f.genius_id = gp.id::text),
    'reviews_count',   (SELECT count(*) FROM genius_reviews r
                         WHERE r.reviewed_genius_id = gp.id::text
                           AND r.reviewer_type = 'client'
                           AND r.moderation_status = 'visible'),
    'rating_avg',      (SELECT round(avg(r.rating)::numeric, 1) FROM genius_reviews r
                         WHERE r.reviewed_genius_id = gp.id::text
                           AND r.reviewer_type = 'client'
                           AND r.moderation_status = 'visible')
  )
  FROM genius_profiles gp
  WHERE gp.user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION my_genius_stats() FROM public, anon;
GRANT EXECUTE ON FUNCTION my_genius_stats() TO authenticated;

-- 2. Visibilidad con gracia por pago en revisión ------------------------------

CREATE OR REPLACE FUNCTION is_listed_by_membership(p_genius_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_active_membership(p_genius_id)
      OR (
        EXISTS (SELECT 1 FROM memberships m
                WHERE m.genius_profile_id = p_genius_id AND m.status <> 'suspended')
        AND EXISTS (SELECT 1 FROM payment_requests pr
                    WHERE pr.genius_profile_id = p_genius_id AND pr.status = 'pending')
      );
$$;

REVOKE ALL ON FUNCTION is_listed_by_membership(uuid) FROM public;
GRANT EXECUTE ON FUNCTION is_listed_by_membership(uuid) TO anon, authenticated;

-- Mismas columnas y orden que en 20261114120000; solo cambia la condición.
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
    OR is_listed_by_membership(gp.id)
  );

ALTER VIEW public_genius_profiles SET (security_invoker = false);
GRANT SELECT ON public_genius_profiles TO anon, authenticated;

-- 3. Funciones de pago: solo con sesión ---------------------------------------

REVOKE EXECUTE ON FUNCTION redeem_beta_code(text) FROM anon;
REVOKE EXECUTE ON FUNCTION submit_payment_request(text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION approve_payment_request(uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION reject_payment_request(uuid, text) FROM anon;
