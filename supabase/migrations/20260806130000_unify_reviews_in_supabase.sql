/*
  # Unificar las reseñas en Supabase

  Había dos sistemas de reseñas que no se conocían entre sí:

  - **Clientes → genio**: en `localStorage['reviews']` (src/utils/reviewUtils.ts).
    Invisible para el panel de admin, invisible desde otro dispositivo, y con las
    fotos guardadas como data-URLs base64 (de ahí el manejo de QuotaExceededError
    en ReviewForm).
  - **Genio → genio**: en la tabla `genius_reviews`.

  Resultado: el mismo genio mostraba una estrella en el buscador (calculada sobre
  `genius_reviews`) y otra distinta al abrir su perfil (calculada sobre
  localStorage).

  ## Qué hace esta migración

  1. Convierte `genius_reviews` en la única tabla de reseñas, con un
     discriminador `reviewer_type` ('client' | 'genius'). El nombre de la tabla
     sigue siendo correcto: son reseñas *de* un genio, venga de quien venga.
  2. Añade las columnas que solo tenían las reseñas de cliente: quién la escribió
     (`reviewer_user_id`, `reviewer_name`), la fecha del servicio y las fotos.
  3. Sustituye la restricción única por dos índices parciales, uno por tipo.
  4. Crea el bucket `review-images` para que las fotos dejen de viajar como
     base64.

  ## Sobre la moderación

  La migración 20260522211709 dice en su cabecera que "public SELECT now only
  returns reviews where moderation_status = 'visible'", pero no incluye ninguna
  sentencia de política: la política permisiva original sigue vigente y ocultar
  una reseña no la oculta en ninguna parte.

  No se puede arreglar en la base de datos todavía: el panel de admin se
  autentica por localStorage y usa la misma anon key que un visitante, así que
  una política que filtre por `moderation_status` dejaría al admin sin poder ver
  la cola de moderación. El filtro queda por ahora en las consultas públicas
  (supabaseGeniusReviewsService). Cerrarlo de verdad exige mover el admin a
  Supabase Auth.
*/

-- 1. Discriminador y columnas propias de las reseñas de cliente
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'genius_reviews' AND column_name = 'reviewer_type') THEN
    ALTER TABLE genius_reviews
      ADD COLUMN reviewer_type text NOT NULL DEFAULT 'genius'
      CHECK (reviewer_type IN ('client', 'genius'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'genius_reviews' AND column_name = 'reviewer_user_id') THEN
    ALTER TABLE genius_reviews ADD COLUMN reviewer_user_id text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'genius_reviews' AND column_name = 'reviewer_name') THEN
    ALTER TABLE genius_reviews ADD COLUMN reviewer_name text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'genius_reviews' AND column_name = 'service_date') THEN
    ALTER TABLE genius_reviews ADD COLUMN service_date date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'genius_reviews' AND column_name = 'images') THEN
    ALTER TABLE genius_reviews ADD COLUMN images jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- 2. Una reseña de cliente no tiene perfil de genio como autor
ALTER TABLE genius_reviews ALTER COLUMN reviewer_genius_id DROP NOT NULL;

-- 3. Cada tipo necesita su propio autor
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'genius_reviews_reviewer_identity_check') THEN
    ALTER TABLE genius_reviews ADD CONSTRAINT genius_reviews_reviewer_identity_check CHECK (
      (reviewer_type = 'genius' AND reviewer_genius_id IS NOT NULL) OR
      (reviewer_type = 'client' AND reviewer_user_id IS NOT NULL)
    );
  END IF;
END $$;

-- 4. Una reseña por autor y por genio, calculada por separado para cada tipo.
--    La restricción única original solo contemplaba autores genio.
ALTER TABLE genius_reviews DROP CONSTRAINT IF EXISTS genius_reviews_reviewer_genius_id_reviewed_genius_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS genius_reviews_peer_unique_idx
  ON genius_reviews (reviewer_genius_id, reviewed_genius_id)
  WHERE reviewer_type = 'genius';

CREATE UNIQUE INDEX IF NOT EXISTS genius_reviews_client_unique_idx
  ON genius_reviews (reviewer_user_id, reviewed_genius_id)
  WHERE reviewer_type = 'client';

-- 5. Índice para el listado público de un perfil
CREATE INDEX IF NOT EXISTS genius_reviews_reviewed_visible_idx
  ON genius_reviews (reviewed_genius_id, reviewer_type, moderation_status);

-- 6. Bucket para las fotos de reseñas.
--    Hasta ahora se guardaban como data-URLs base64 dentro de localStorage, lo
--    que agotaba la cuota del navegador con dos fotos.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-images',
  'review-images',
  true,
  2097152, -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE schemaname = 'storage' AND tablename = 'objects'
                   AND policyname = 'Public read review images') THEN
    CREATE POLICY "Public read review images"
      ON storage.objects FOR SELECT
      TO anon, authenticated
      USING (bucket_id = 'review-images');
  END IF;

  -- La escritura queda abierta a la anon key, igual que el resto de tablas de
  -- esta app (el auth de clientes es localStorage, no Supabase Auth). El límite
  -- de 2 MB y la lista de mime types del bucket son el único control real.
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE schemaname = 'storage' AND tablename = 'objects'
                   AND policyname = 'Anyone can upload review images') THEN
    CREATE POLICY "Anyone can upload review images"
      ON storage.objects FOR INSERT
      TO anon, authenticated
      WITH CHECK (bucket_id = 'review-images');
  END IF;
END $$;
