import { supabase } from '../lib/supabase';
import { HomeLocation } from '../utils/locationUtils';

/**
 * Directorio público de genios.
 *
 * Lee la vista `public_genius_profiles` (migración
 * 20260806120000_create_public_genius_directory.sql), que expone solo las
 * columnas seguras de `genius_profiles` — sin dni, email ni documentos — y
 * únicamente perfiles publicables (con nombre, categoría y teléfono).
 */

export interface PublicGeniusProfile {
  id: string;
  full_name: string;
  profile_photo: string;
  description: string;
  category: string;
  subcategories: string[];
  service_name: string;
  phone: string;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  home_location: HomeLocation | null;
  coverage_type: string;
  work_locations: Array<Partial<HomeLocation>>;
  portfolio: string[];
  has_documents: boolean;
  created_at: string;
}

/**
 * Perfil público enriquecido con reseñas y disponibilidad de hoy.
 *
 * `rating` cuenta solo reseñas de clientes visibles. Las opiniones entre
 * colegas se muestran aparte en el perfil y no entran en esta cifra.
 */
export interface DirectoryGenius extends PublicGeniusProfile {
  rating: number;
  reviews_count: number;
  is_available_today: boolean;
}

const todayISO = () => new Date().toISOString().split('T')[0];

const normalizeArrays = (profile: any): PublicGeniusProfile => ({
  ...profile,
  subcategories: Array.isArray(profile.subcategories) ? profile.subcategories : [],
  work_locations: Array.isArray(profile.work_locations) ? profile.work_locations : [],
  portfolio: Array.isArray(profile.portfolio) ? profile.portfolio : [],
});

/** Nombres de varios genios por id, para listados que solo muestran el nombre. */
export const getGeniusNamesByIds = async (ids: string[]): Promise<Map<string, string>> => {
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase
    .from('public_genius_profiles')
    .select('id, full_name')
    .in('id', ids);

  if (error) {
    console.error('Error fetching genius names:', error);
    return new Map();
  }

  return new Map((data ?? []).map((row) => [row.id, row.full_name]));
};

/**
 * Un solo perfil público por id, para la página /profile/:id.
 * Devuelve null si el id no existe o si el perfil aún no es publicable.
 */
export const getPublicGeniusById = async (id: string): Promise<DirectoryGenius | null> => {
  const { data: profile, error } = await supabase
    .from('public_genius_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching public genius profile:', error);
    throw error;
  }

  if (!profile) return null;

  const [reviewsResult, availabilityResult] = await Promise.all([
    supabase
      .from('genius_reviews')
      .select('rating')
      .eq('reviewed_genius_id', id)
      .eq('reviewer_type', 'client')
      .eq('moderation_status', 'visible'),
    supabase.from('genius_availability').select('status').eq('genius_id', id).eq('date', todayISO()).maybeSingle(),
  ]);

  if (reviewsResult.error) {
    console.error('Error fetching ratings for profile:', reviewsResult.error);
  }
  if (availabilityResult.error) {
    console.error('Error fetching availability for profile:', availabilityResult.error);
  }

  const ratings = (reviewsResult.data ?? []).map((r) => r.rating);
  const average = ratings.length
    ? Math.round((ratings.reduce((sum, value) => sum + value, 0) / ratings.length) * 10) / 10
    : 0;

  return {
    ...normalizeArrays(profile),
    rating: average,
    reviews_count: ratings.length,
    is_available_today: availabilityResult.data?.status === 'available',
  };
};

/**
 * Trae el directorio completo en 3 consultas (perfiles, reseñas, disponibilidad
 * de hoy) en vez de una consulta por genio.
 */
export const getPublicGeniusDirectory = async (): Promise<DirectoryGenius[]> => {
  // Solo las columnas que pinta la tarjeta. `portfolio` queda fuera a propósito:
  // el listado no lo muestra y traerlo multiplica el peso de la respuesta por
  // cada genio. La ficha individual sí lo pide entero.
  // El select va como literal porque supabase-js infiere los tipos del string.
  const { data: profiles, error } = await supabase
    .from('public_genius_profiles')
    .select('id, full_name, profile_photo, description, category, subcategories, service_name, phone, home_location, coverage_type, work_locations, has_documents, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching public genius directory:', error);
    throw error;
  }

  if (!profiles || profiles.length === 0) return [];

  const ids = profiles.map((p) => p.id);

  const [reviewsResult, availabilityResult] = await Promise.all([
    supabase
      .from('genius_reviews')
      .select('reviewed_genius_id, rating')
      .in('reviewed_genius_id', ids)
      .eq('reviewer_type', 'client')
      .eq('moderation_status', 'visible'),
    supabase.from('genius_availability').select('genius_id, status').eq('date', todayISO()).in('genius_id', ids),
  ]);

  if (reviewsResult.error) {
    console.error('Error fetching ratings for directory:', reviewsResult.error);
  }
  if (availabilityResult.error) {
    console.error('Error fetching availability for directory:', availabilityResult.error);
  }

  const ratingTotals = new Map<string, { sum: number; count: number }>();
  for (const review of reviewsResult.data ?? []) {
    const current = ratingTotals.get(review.reviewed_genius_id) ?? { sum: 0, count: 0 };
    current.sum += review.rating;
    current.count += 1;
    ratingTotals.set(review.reviewed_genius_id, current);
  }

  const availableToday = new Set(
    (availabilityResult.data ?? [])
      .filter((row) => row.status === 'available')
      .map((row) => row.genius_id)
  );

  return profiles.map((profile) => {
    const totals = ratingTotals.get(profile.id);
    return {
      ...normalizeArrays(profile),
      rating: totals ? Math.round((totals.sum / totals.count) * 10) / 10 : 0,
      reviews_count: totals?.count ?? 0,
      is_available_today: availableToday.has(profile.id),
    };
  });
};
