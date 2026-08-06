import { supabase } from '../lib/supabase';

export type ReviewerType = 'client' | 'genius';
export type ModerationStatus = 'visible' | 'pending' | 'hidden';

export interface GeniusReview {
  id: string;
  reviewer_type: ReviewerType;
  /** Autor cuando reviewer_type = 'genius' (genius_profiles.id) */
  reviewer_genius_id: string | null;
  /** Autor cuando reviewer_type = 'client' (id del usuario de la app) */
  reviewer_user_id: string | null;
  reviewer_name: string;
  reviewed_genius_id: string;
  rating: number;
  comment: string;
  service_date: string | null;
  images: string[];
  moderation_status: ModerationStatus;
  created_at: string;
  updated_at: string;
  reviewer_photo?: string;
  reviewer_category?: string;
}

export interface RatingStats {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

const emptyDistribution = (): RatingStats['distribution'] => ({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

/** Solo las reseñas aprobadas son visibles fuera del panel de admin. */
const VISIBLE = 'visible';

const normalize = (row: any): GeniusReview => ({
  ...row,
  reviewer_name: row.reviewer_name ?? '',
  images: Array.isArray(row.images) ? row.images : [],
});

/** Opiniones de colegas (genio → genio) visibles públicamente. */
export const getReviewsForGenius = async (reviewedGeniusId: string): Promise<GeniusReview[]> => {
  const { data, error } = await supabase
    .from('genius_reviews')
    .select('*')
    .eq('reviewed_genius_id', reviewedGeniusId)
    .eq('reviewer_type', 'genius')
    .eq('moderation_status', VISIBLE)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching genius reviews:', error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Enrich with reviewer profile data
  const reviewerIds = [...new Set(data.map((r) => r.reviewer_genius_id))];
  const { data: profiles } = await supabase
    .from('genius_profiles')
    .select('id, full_name, profile_photo, category')
    .in('id', reviewerIds);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  return data.map((row) => {
    const profile = profileMap.get(row.reviewer_genius_id);
    return {
      ...normalize(row),
      reviewer_name: profile?.full_name ?? 'Genio verificado',
      reviewer_photo: profile?.profile_photo ?? '',
      reviewer_category: profile?.category ?? '',
    };
  });
};

export const getMyReviewForGenius = async (
  reviewerGeniusId: string,
  reviewedGeniusId: string
): Promise<GeniusReview | null> => {
  const { data, error } = await supabase
    .from('genius_reviews')
    .select('*')
    .eq('reviewer_genius_id', reviewerGeniusId)
    .eq('reviewed_genius_id', reviewedGeniusId)
    .eq('reviewer_type', 'genius')
    .maybeSingle();

  if (error) return null;
  return data ? normalize(data) : null;
};

export const submitGeniusReview = async (
  reviewerGeniusId: string,
  reviewedGeniusId: string,
  rating: number,
  comment: string
): Promise<boolean> => {
  const { error } = await supabase.from('genius_reviews').insert({
    reviewer_type: 'genius',
    reviewer_genius_id: reviewerGeniusId,
    reviewed_genius_id: reviewedGeniusId,
    rating,
    comment,
  });

  if (error) {
    console.error('Error submitting genius review:', error);
    return false;
  }
  return true;
};

export const updateGeniusReview = async (
  reviewId: string,
  rating: number,
  comment: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('genius_reviews')
    .update({ rating, comment, updated_at: new Date().toISOString() })
    .eq('id', reviewId);

  if (error) {
    console.error('Error updating genius review:', error);
    return false;
  }
  return true;
};

/* ------------------------------------------------------------------ *
 * Reseñas de clientes
 * ------------------------------------------------------------------ */

/** Reseñas de clientes visibles para un genio, las más recientes primero. */
export const getClientReviewsForGenius = async (
  reviewedGeniusId: string
): Promise<GeniusReview[]> => {
  const { data, error } = await supabase
    .from('genius_reviews')
    .select('*')
    .eq('reviewed_genius_id', reviewedGeniusId)
    .eq('reviewer_type', 'client')
    .eq('moderation_status', VISIBLE)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching client reviews:', error);
    return [];
  }

  return (data ?? []).map(normalize);
};

/** Todas las reseñas que escribió un cliente (para su propio perfil). */
export const getReviewsByClient = async (clientUserId: string): Promise<GeniusReview[]> => {
  const { data, error } = await supabase
    .from('genius_reviews')
    .select('*')
    .eq('reviewer_user_id', clientUserId)
    .eq('reviewer_type', 'client')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviews by client:', error);
    return [];
  }

  return (data ?? []).map(normalize);
};

const REVIEW_IMAGES_BUCKET = 'review-images';

/**
 * Sube las fotos de una reseña al bucket y devuelve sus URLs públicas.
 * Acepta tanto File como data-URL base64 (el formato que usaba el sistema
 * anterior en localStorage), para que la migración de datos existentes funcione.
 */
export const uploadReviewImages = async (
  images: Array<File | string>,
  reviewedGeniusId: string
): Promise<string[]> => {
  const uploaded: string[] = [];

  for (const [index, image] of images.entries()) {
    // Una URL ya subida no se vuelve a subir
    if (typeof image === 'string' && !image.startsWith('data:')) {
      uploaded.push(image);
      continue;
    }

    try {
      const blob = typeof image === 'string' ? await (await fetch(image)).blob() : image;
      const extension = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
      const path = `${reviewedGeniusId}/${Date.now()}-${index}.${extension}`;

      const { error } = await supabase.storage
        .from(REVIEW_IMAGES_BUCKET)
        .upload(path, blob, { contentType: blob.type, upsert: false });

      if (error) {
        console.error('Error uploading review image:', error);
        continue;
      }

      const { data } = supabase.storage.from(REVIEW_IMAGES_BUCKET).getPublicUrl(path);
      uploaded.push(data.publicUrl);
    } catch (err) {
      console.error('Error preparing review image:', err);
    }
  }

  return uploaded;
};

export interface ClientReviewInput {
  reviewedGeniusId: string;
  clientUserId: string;
  clientName: string;
  rating: number;
  comment: string;
  serviceDate: string;
  images: string[];
}

/**
 * Publica o actualiza la reseña de un cliente. El índice único parcial
 * (reviewer_user_id, reviewed_genius_id) garantiza una sola por genio.
 */
export const submitClientReview = async (input: ClientReviewInput): Promise<boolean> => {
  const { error } = await supabase.from('genius_reviews').upsert(
    {
      reviewer_type: 'client',
      reviewer_user_id: input.clientUserId,
      reviewer_name: input.clientName,
      reviewed_genius_id: input.reviewedGeniusId,
      rating: input.rating,
      comment: input.comment,
      service_date: input.serviceDate || null,
      images: input.images,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'reviewer_user_id,reviewed_genius_id' }
  );

  if (error) {
    console.error('Error submitting client review:', error);
    return false;
  }
  return true;
};

/* ------------------------------------------------------------------ *
 * Estadísticas
 * ------------------------------------------------------------------ */

/**
 * Calificación pública de un genio: promedio sobre las reseñas de clientes
 * visibles. Las opiniones de colegas se muestran aparte y no entran en esta
 * cifra — son dos señales distintas y mezclarlas haría el número ilegible.
 */
export const getRatingStatsForGenius = async (
  reviewedGeniusId: string,
  reviewerType: ReviewerType = 'client'
): Promise<RatingStats> => {
  const { data, error } = await supabase
    .from('genius_reviews')
    .select('rating')
    .eq('reviewed_genius_id', reviewedGeniusId)
    .eq('reviewer_type', reviewerType)
    .eq('moderation_status', VISIBLE);

  if (error || !data || data.length === 0) {
    return { average: 0, count: 0, distribution: emptyDistribution() };
  }

  const distribution = emptyDistribution();
  let sum = 0;
  for (const row of data) {
    sum += row.rating;
    if (row.rating >= 1 && row.rating <= 5) {
      distribution[row.rating as 1 | 2 | 3 | 4 | 5] += 1;
    }
  }

  return {
    average: Math.round((sum / data.length) * 10) / 10,
    count: data.length,
    distribution,
  };
};
