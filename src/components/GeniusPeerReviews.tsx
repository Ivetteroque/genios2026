import React, { useState, useEffect, useCallback } from 'react';
import { Star, User, BadgeCheck, Loader2, Send, Pencil } from 'lucide-react';
import { getCurrentUser } from '../utils/authUtils';
import { getGeniusProfile } from '../services/supabaseGeniusService';
import {
  getReviewsForGenius,
  getMyReviewForGenius,
  submitGeniusReview,
  updateGeniusReview,
  GeniusReview,
} from '../services/supabaseGeniusReviewsService';

interface GeniusPeerReviewsProps {
  reviewedGeniusId: string;
}

const StarPicker: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none"
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              star <= (hovered || value) ? 'text-amber-400' : 'text-gray-200'
            }`}
            fill={star <= (hovered || value) ? 'currentColor' : 'none'}
          />
        </button>
      ))}
    </div>
  );
};

const GeniusPeerReviews: React.FC<GeniusPeerReviewsProps> = ({ reviewedGeniusId }) => {
  const [reviews, setReviews] = useState<GeniusReview[]>([]);
  const [myReview, setMyReview] = useState<GeniusReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewerGeniusId, setReviewerGeniusId] = useState<string | null>(null);

  const currentUser = getCurrentUser();

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getReviewsForGenius(reviewedGeniusId);
    setReviews(data);

    if (currentUser?.role === 'genius') {
      const profile = await getGeniusProfile(currentUser.id);
      if (profile && profile.id !== reviewedGeniusId) {
        setReviewerGeniusId(profile.id);
        const mine = await getMyReviewForGenius(profile.id, reviewedGeniusId);
        setMyReview(mine);
        if (mine) {
          setRating(mine.rating);
          setComment(mine.comment);
        }
      }
    }
    setLoading(false);
  }, [reviewedGeniusId, currentUser?.id, currentUser?.role]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerGeniusId || comment.trim().length < 10) return;

    setSubmitting(true);
    let ok: boolean;

    if (myReview) {
      ok = await updateGeniusReview(myReview.id, rating, comment.trim());
    } else {
      ok = await submitGeniusReview(reviewerGeniusId, reviewedGeniusId, rating, comment.trim());
    }

    if (ok) {
      setIsEditing(false);
      await load();
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-5 h-5 text-text/30 animate-spin" />
      </div>
    );
  }

  const canReview = currentUser?.role === 'genius' && reviewerGeniusId !== null;
  const showForm = canReview && (!myReview || isEditing);

  return (
    <section className="py-10">
      <div className="max-w-2xl mx-auto px-4">

        {/* Section header */}
        <div className="flex items-baseline gap-3 mb-8">
          <h2 className="font-heading text-lg font-semibold text-text">
            Opiniones de colegas
          </h2>
          {reviews.length > 0 && (
            <span className="text-xs text-text/40 font-normal">
              {reviews.length} {reviews.length === 1 ? 'opinión' : 'opiniones'}
            </span>
          )}
        </div>

        {/* Reviews list */}
        {reviews.length > 0 ? (
          <div className="divide-y divide-gray-100 mb-10">
            {reviews.map((review) => (
              <div key={review.id} className="py-5 first:pt-0 last:pb-0">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    {review.reviewer_photo ? (
                      <img
                        src={review.reviewer_photo}
                        alt={review.reviewer_name}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-text/30" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text">
                          {review.reviewer_name}
                        </span>
                        <BadgeCheck className="w-3.5 h-3.5 text-text/25" />
                        {review.reviewer_category && (
                          <span className="text-xs text-text/35">{review.reviewer_category}</span>
                        )}
                      </div>
                      <span className="text-xs text-text/30 ml-2 whitespace-nowrap">
                        {new Date(review.created_at).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 mb-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${s <= review.rating ? 'text-amber-400' : 'text-gray-200'}`}
                          fill={s <= review.rating ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-text/60 leading-relaxed">"{review.comment}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center mb-6">
            <p className="text-sm text-text/30">Aún no hay opiniones de colegas.</p>
          </div>
        )}

        {/* My existing review (not editing) */}
        {myReview && !isEditing && (
          <div className="mb-8 pt-5 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-text/50 uppercase tracking-wide">Tu opinión</span>
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1 text-xs text-text/40 hover:text-text/70 transition-colors"
              >
                <Pencil className="w-3 h-3" />
                Editar
              </button>
            </div>
            <div className="flex items-center gap-0.5 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-3.5 h-3.5 ${s <= myReview.rating ? 'text-amber-400' : 'text-gray-200'}`}
                  fill={s <= myReview.rating ? 'currentColor' : 'none'}
                />
              ))}
            </div>
            <p className="text-sm text-text/55 leading-relaxed">"{myReview.comment}"</p>
          </div>
        )}

        {/* Review form */}
        {showForm && (
          <div className="pt-8 border-t border-gray-100">
            <h3 className="text-xs font-medium text-text/45 uppercase tracking-wide mb-5">
              {myReview ? 'Editar tu opinión' : 'Deja tu opinión'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs text-text/40 mb-2">Calificación</label>
                <StarPicker value={rating} onChange={setRating} />
              </div>
              <div>
                <label className="block text-xs text-text/40 mb-2">
                  Comentario <span className="text-text/25">(mín. 10 caracteres)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 500))}
                  rows={3}
                  placeholder="Comparte tu experiencia con este genio..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-text/20 focus:border-text/30 resize-none bg-white text-text placeholder:text-text/25 transition-colors"
                />
                <p className="text-xs text-text/25 mt-1 text-right">{comment.length}/500</p>
              </div>
              <div className="flex gap-2 justify-end">
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => { setIsEditing(false); setRating(myReview!.rating); setComment(myReview!.comment); }}
                    className="px-4 py-2 text-xs text-text/50 hover:text-text/70 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting || comment.trim().length < 10}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-text text-white text-xs font-medium rounded-lg hover:bg-text/85 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  {myReview ? 'Actualizar' : 'Publicar'}
                </button>
              </div>
            </form>
          </div>
        )}

        {!canReview && !currentUser && (
          <p className="text-xs text-text/30 text-center mt-6">
            Inicia sesión como Genio para dejar tu opinión.
          </p>
        )}
      </div>
    </section>
  );
};

export default GeniusPeerReviews;
