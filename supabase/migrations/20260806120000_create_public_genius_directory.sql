/*
  # Directorio público de genios

  Hasta ahora la búsqueda pública (`/categories`) mostraba 8 personas inventadas
  escritas a mano en `src/pages/Categories.tsx`. Un genio que completaba el
  wizard quedaba guardado en `genius_profiles` pero no aparecía nunca.

  El motivo de fondo: `genius_profiles` solo tiene política de lectura para el
  propio dueño (`auth.uid() = user_id`), así que un visitante anónimo no lee
  ninguna fila. Y no se puede simplemente abrir la tabla al público, porque
  guarda `dni`, `email` y `documents` (documentos de identidad).

  ## Qué crea esta migración

  1. Vista `public_genius_profiles`
     - Expone SOLO las columnas que la tarjeta de resultados necesita.
     - Excluye deliberadamente: user_id, dni, email, documents,
       completion_percentage, last_wizard_step, profile_views, whatsapp_clicks.
     - De `documents` solo deriva un booleano `has_documents` (para el filtro
       "verificado"), nunca el contenido.
     - Solo lista perfiles publicables: con nombre, categoría y teléfono.

  2. Lectura pública de `genius_availability`
     - Sin esto el badge de disponibilidad de cada tarjeta devuelve vacío para
       visitantes anónimos. Solo lectura; escribir sigue restringido al dueño.

  ## Decisiones tomadas

  - **Sin filtro por suscripción.** Durante el periodo de prueba (2 meses desde
    el registro) aparece todo genio con el perfil completo, haya pagado o no.
    Cuando toque cerrar la puerta, el filtro va en el WHERE de la vista usando
    `genius_subscriptions` y/o `created_at` (que la vista ya expone).
  - **El teléfono viaja en la vista.** Es lo que hace funcionar el botón de
    WhatsApp sin pasos extra. Contrapartida asumida: cualquiera puede leer todos
    los teléfonos listados en una sola petición.
  - **`security_invoker = false` (definer).** Es intencional: la vista corre con
    los permisos de su dueño para poder saltarse la RLS de la tabla base. El
    control de qué se expone lo hace la lista de columnas del SELECT, no la RLS.
*/

-- Vista pública: solo columnas seguras, solo perfiles publicables
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
  -- Booleano derivado para el filtro "verificado": nunca el contenido de los documentos
  (jsonb_array_length(COALESCE(gp.documents, '[]'::jsonb)) > 0) AS has_documents,
  gp.created_at
FROM genius_profiles gp
WHERE COALESCE(gp.full_name, '') <> ''
  AND COALESCE(gp.category, '') <> ''
  AND COALESCE(gp.phone, '') <> '';

-- La vista debe correr como definer para atravesar la RLS de genius_profiles.
-- Lo que se expone está acotado por el SELECT de arriba, no por la RLS.
ALTER VIEW public_genius_profiles SET (security_invoker = false);

GRANT SELECT ON public_genius_profiles TO anon, authenticated;

-- Lectura pública de disponibilidad (fechas y estado; nada sensible).
-- Las políticas de escritura existentes siguen intactas.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'genius_availability'
      AND policyname = 'Anyone can read genius availability'
  ) THEN
    CREATE POLICY "Anyone can read genius availability"
      ON genius_availability FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- Índices para el listado y el filtro por categoría
CREATE INDEX IF NOT EXISTS genius_profiles_category_idx ON genius_profiles(category);
CREATE INDEX IF NOT EXISTS genius_availability_date_idx ON genius_availability(date);
