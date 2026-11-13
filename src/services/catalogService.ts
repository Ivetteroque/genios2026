import { supabase } from '../lib/supabase';

/**
 * Catálogos compartidos (categorías y ubicaciones) en la tabla `site_catalogs`.
 *
 * La app los lee de forma síncrona desde una caché en localStorage
 * (categoryUtils / locationUtils). Esta capa:
 * - al cargar la app, trae la versión del servidor y refresca la caché;
 * - cuando el admin guarda, publica la nueva versión para todos.
 * Leer está abierto a cualquiera; escribir, solo a admins (RLS).
 */

export type CatalogKey = 'categories' | 'locations';

export const fetchCatalog = async <T>(key: CatalogKey): Promise<T | null> => {
  const { data, error } = await supabase
    .from('site_catalogs')
    .select('data')
    .eq('key', key)
    .maybeSingle();

  if (error) {
    console.error(`Error cargando el catálogo ${key}:`, error);
    return null;
  }
  return (data?.data as T) ?? null;
};

/** Publica el catálogo. Lanza el error si falla (p. ej. sin sesión de admin). */
export const publishCatalog = async (key: CatalogKey, data: unknown): Promise<void> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const { error } = await supabase.from('site_catalogs').upsert({
    key,
    data,
    updated_at: new Date().toISOString(),
    updated_by: sessionData.session?.user.email ?? '',
  });
  if (error) throw error;
};

/** Quita el estado de interfaz (`isExpanded`) antes de publicar. */
export const stripUiState = <T>(value: T): T =>
  JSON.parse(JSON.stringify(value, (k, v) => (k === 'isExpanded' ? undefined : v)));

let publishErrorShown = false;

/** Publica en segundo plano; si falla, avisa al admin una vez. */
export const publishCatalogInBackground = (key: CatalogKey, data: unknown) => {
  publishCatalog(key, stripUiState(data)).catch((error) => {
    console.error(`Error publicando el catálogo ${key}:`, error);
    if (!publishErrorShown) {
      publishErrorShown = true;
      alert(
        'No se pudo guardar el cambio en el servidor: los visitantes no lo verán.\n' +
          'Revisa tu sesión de admin y vuelve a intentarlo.'
      );
      setTimeout(() => { publishErrorShown = false; }, 5000);
    }
  });
};
