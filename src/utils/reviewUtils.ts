// Review validation and one-time migration of the old localStorage store.
//
// Las reseñas viven ahora en Supabase (`genius_reviews`, ver
// src/services/supabaseGeniusReviewsService.ts). Este módulo conserva solo la
// validación —que es lógica pura— y el rescate de las reseñas que quedaron
// guardadas en el navegador antes de la unificación.

import { submitClientReview, uploadReviewImages } from '../services/supabaseGeniusReviewsService';

export interface Review {
  id: string;
  geniusId: string;
  clientId: string;
  clientName: string;
  serviceDate: string;
  rating: number;
  comment: string;
  images: string[];
  createdAt: string;
  verified: boolean;
}

export interface GeniusRatingStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

// Validate review data
export const validateReviewData = (review: Partial<Review>): string[] => {
  const errors: string[] = [];

  if (!review.geniusId) {
    errors.push('ID del genio es requerido');
  }

  if (!review.clientId) {
    errors.push('ID del cliente es requerido');
  }

  if (!review.clientName || review.clientName.trim().length === 0) {
    errors.push('Nombre del cliente es requerido');
  }

  if (!review.rating || review.rating < 1 || review.rating > 5) {
    errors.push('Calificación debe ser entre 1 y 5 estrellas');
  }

  if (!review.comment || review.comment.trim().length === 0) {
    errors.push('Comentario es requerido');
  }

  if (review.comment && review.comment.length > 500) {
    errors.push('Comentario no puede exceder 500 caracteres');
  }

  if (!review.serviceDate) {
    errors.push('Fecha del servicio es requerida');
  }

  return errors;
};

const LEGACY_KEY = 'reviews';
const MIGRATION_FLAG = 'reviewsMigratedToSupabase';

/**
 * Sube a Supabase las reseñas que quedaron en localStorage antes de la
 * unificación y limpia la clave. Es idempotente: el índice único parcial
 * (reviewer_user_id, reviewed_genius_id) evita duplicados si se ejecuta dos
 * veces, y la bandera evita el trabajo repetido en el mismo navegador.
 *
 * Se ejecuta una vez por dispositivo al arrancar la app. Si falla, deja los
 * datos intactos para reintentar en la siguiente visita.
 */
export const migrateLegacyReviews = async (): Promise<number> => {
  if (localStorage.getItem(MIGRATION_FLAG) === 'true') return 0;

  let legacy: Review[] = [];
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    legacy = raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Error reading legacy reviews:', error);
    localStorage.setItem(MIGRATION_FLAG, 'true');
    return 0;
  }

  if (legacy.length === 0) {
    localStorage.setItem(MIGRATION_FLAG, 'true');
    return 0;
  }

  let migrated = 0;
  const pending: Review[] = [];

  for (const review of legacy) {
    // Una reseña inválida nunca pudo publicarse; se descarta en vez de bloquear
    // la migración para siempre.
    if (validateReviewData(review).length > 0) continue;

    try {
      const images = await uploadReviewImages(review.images ?? [], review.geniusId);
      const ok = await submitClientReview({
        reviewedGeniusId: review.geniusId,
        clientUserId: review.clientId,
        clientName: review.clientName,
        rating: review.rating,
        comment: review.comment,
        serviceDate: review.serviceDate,
        images,
      });
      if (ok) {
        migrated += 1;
      } else {
        pending.push(review);
      }
    } catch (error) {
      console.error('Error migrating legacy review:', error);
      pending.push(review);
    }
  }

  // Solo se descarta lo que llegó a Supabase. Lo que falló se conserva para
  // reintentarlo en la siguiente visita — nunca se borra sin confirmar.
  if (pending.length > 0) {
    localStorage.setItem(LEGACY_KEY, JSON.stringify(pending));
    console.warn(`${pending.length} reseñas no se pudieron migrar; se reintentarán.`);
    return migrated;
  }

  localStorage.removeItem(LEGACY_KEY);
  localStorage.setItem(MIGRATION_FLAG, 'true');
  if (migrated > 0) console.log(`Migradas ${migrated} reseñas de localStorage a Supabase`);
  return migrated;
};
