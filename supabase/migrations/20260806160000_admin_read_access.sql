/*
  # Lectura del panel de administración

  El panel mostraba ceros en todos sus indicadores. No era un error de la UI: el
  login de admin vivía solo en el navegador (`adminAuthUtils` comparaba contra
  dos usuarios escritos en el código con la contraseña `admin123`), así que para
  Supabase el panel era un visitante anónimo idéntico a cualquiera que abra la
  web, y RLS le devolvía cero filas.

  A partir de esta migración los admins inician sesión con Supabase Auth de
  verdad, y se los reconoce por `app_metadata.role`.

  ## Por qué app_metadata y no una tabla

  `app_metadata` solo se puede escribir con la service_role: ni el propio
  usuario puede ascenderse a admin editando su perfil. Con `user_metadata` sí
  podría, y una tabla `admin_users` obligaría a una consulta extra en cada
  política. El rol viaja dentro del JWT, así que `is_admin()` no toca disco.

  Los admins se crean con `node scripts/create-admin.mjs` (usa la service_role).

  ## Qué abre y qué no

  Se agrega lectura para admins en las tres tablas que el panel necesita y no
  podía ver: `genius_profiles`, `client_profiles` y `reports`. Son políticas
  aditivas: las de dueño-de-su-propia-fila siguen intactas, y nadie más gana
  acceso.

  `payment_requests`, `memberships` y `payment_history` no se tocan: ya tenían
  SELECT para cualquier usuario autenticado. Conviene revisarlas —hoy un cliente
  que entra con Google puede leer los pagos de toda la plataforma—, pero eso es
  un cambio aparte, con riesgo de romper el alta de solicitudes de los genios.
*/

-- Un admin es quien tiene el rol grabado en app_metadata, dentro de su JWT.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('admin', 'super_admin');
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE tablename = 'genius_profiles' AND policyname = 'Admins can read all genius profiles') THEN
    CREATE POLICY "Admins can read all genius profiles"
      ON genius_profiles FOR SELECT
      TO authenticated
      USING (is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE tablename = 'client_profiles' AND policyname = 'Admins can read all client profiles') THEN
    CREATE POLICY "Admins can read all client profiles"
      ON client_profiles FOR SELECT
      TO authenticated
      USING (is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE tablename = 'reports' AND policyname = 'Admins can read all reports') THEN
    CREATE POLICY "Admins can read all reports"
      ON reports FOR SELECT
      TO authenticated
      USING (is_admin());
  END IF;

  -- Moderar un reporte es cambiarle el estado; sin esto el panel puede verlos
  -- pero no resolverlos.
  IF NOT EXISTS (SELECT 1 FROM pg_policies
                 WHERE tablename = 'reports' AND policyname = 'Admins can update reports') THEN
    CREATE POLICY "Admins can update reports"
      ON reports FOR UPDATE
      TO authenticated
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END $$;
