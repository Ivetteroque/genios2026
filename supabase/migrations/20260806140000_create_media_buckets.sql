/*
  # Buckets para fotos de perfil y portafolio

  Hasta ahora las imágenes se guardaban como data-URLs base64 dentro de las
  columnas de `genius_profiles`: `profile_photo` (text) y `portfolio` (jsonb).
  La UI acepta hasta 5 MB por imagen y base64 infla un ~33%, así que un genio
  con foto y portafolio lleno podía ocupar decenas de MB en una sola fila —
  descargados enteros en cada consulta que tocara esas columnas.

  ## Qué crea

  - `profile-photos`: público, 5 MB, jpeg/png/webp
  - `portfolios`: público, 5 MB, jpeg/png/webp

  Ambos son públicos a propósito: es material que la ficha del genio muestra a
  cualquier visitante.

  ## Qué NO se mueve, y por qué

  Los documentos (`genius_profiles.documents`: DNI, certificados) se quedan
  donde están. Esa columna está protegida por la RLS de solo-dueño de
  `genius_profiles` y queda fuera de la vista pública `public_genius_profiles`.
  Como el auth de clientes de esta app es localStorage y no Supabase Auth,
  cualquier bucket tendría que ser accesible con la anon key: mover los
  documentos allí los haría *menos* privados de lo que están hoy. Se quedan en
  base64 hasta que exista Supabase Auth de verdad.

  ## Sobre las políticas de escritura

  Igual que el resto de esta base (`user_favorites`, `genius_reviews`,
  `reports`, `review-images`), la subida queda abierta a la anon key porque no
  hay identidad verificable en el servidor. El límite de tamaño y la lista de
  mime types del bucket son el único control real.

  No se crea política de DELETE a propósito: con la anon key, permitir borrar
  significaría que cualquiera puede borrar los archivos de cualquiera. El coste
  es que reemplazar una foto deja huérfano el archivo anterior; limpiarlos
  requiere una tarea con service_role, no una política.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('profile-photos', 'profile-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('portfolios',     'portfolios',     true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  bucket_name text;
BEGIN
  FOREACH bucket_name IN ARRAY ARRAY['profile-photos', 'portfolios']
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies
                   WHERE schemaname = 'storage' AND tablename = 'objects'
                     AND policyname = 'Public read ' || bucket_name) THEN
      EXECUTE format(
        'CREATE POLICY %I ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = %L)',
        'Public read ' || bucket_name, bucket_name
      );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies
                   WHERE schemaname = 'storage' AND tablename = 'objects'
                     AND policyname = 'Anyone can upload ' || bucket_name) THEN
      EXECUTE format(
        'CREATE POLICY %I ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = %L)',
        'Anyone can upload ' || bucket_name, bucket_name
      );
    END IF;
  END LOOP;
END $$;
