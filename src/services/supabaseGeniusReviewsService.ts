import { supabase } from '../lib/supabase';

export interface GeniusReview {
  id: string;
  reviewer_genius_id: string;
  reviewed_genius_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  reviewer_name?: string;
  reviewer_photo?: string;
  reviewer_category?: string;
}

export const getReviewsForGenius = async (reviewedGeniusId: string): Promise<GeniusReview[]> => {
  const { data, error } = await supabase
    .from('genius_reviews')
    .select('*')
    .eq('reviewed_genius_id', reviewedGeniusId)
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
      ...row,
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
    .maybeSingle();

  if (error) return null;
  return data;
};

export const submitGeniusReview = async (
  reviewerGeniusId: string,
  reviewedGeniusId: string,
  rating: number,
  comment: string
): Promise<boolean> => {
  const { error } = await supabase.from('genius_reviews').insert({
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

export const getAverageRatingForGenius = async (
  reviewedGeniusId: string
): Promise<{ average: number; count: number }> => {
  const { data, error } = await supabase
    .from('genius_reviews')
    .select('rating')
    .eq('reviewed_genius_id', reviewedGeniusId);

  if (error || !data || data.length === 0) return { average: 0, count: 0 };

  const sum = data.reduce((acc, r) => acc + r.rating, 0);
  return { average: Math.round((sum / data.length) * 10) / 10, count: data.length };
};
