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
            className={`w-7 h-7 transition-colors ${
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
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
      </div>
    );
  }

  const canReview = currentUser?.role === 'genius' && reviewerGeniusId !== null;
  const showForm = canReview && (!myReview || isEditing);

  return (
    <section className="py-10 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="font-heading text-xl font-bold text-gray-900">
              Opiniones de colegas Genios
            </h2>
            {reviews.length > 0 && (
              <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full border border-blue-100">
                {reviews.length} {reviews.length === 1 ? 'opinión' : 'opiniones'}
              </span>
            )}
          </div>

          {/* Existing reviews */}
          {reviews.length > 0 ? (
            <div className="space-y-4 mb-8">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="flex-shrink-0">
                    {review.reviewer_photo ? (
                      <img
                        src={review.reviewer_photo}
                        alt={review.reviewer_name}
                        className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white shadow-sm">
                        <User className="w-5 h-5 text-blue-500" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm">
                        {review.reviewer_name}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        <BadgeCheck className="w-3 h-3" />
                        Genio verificado
                      </span>
                      {review.reviewer_category && (
                        <span className="text-xs text-gray-400">{review.reviewer_category}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-amber-400' : 'text-gray-200'}`}
                          fill={s <= review.rating ? 'currentColor' : 'none'}
                        />
                      ))}
                      <span className="text-xs text-gray-400 ml-1">
                        {new Date(review.created_at).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">"{review.comment}"</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 mb-6">
              <BadgeCheck className="w-10 h-10 mx-auto mb-2 text-gray-200" />
              <p className="text-sm">Aún no hay opiniones de colegas genios.</p>
            </div>
          )}

          {/* My existing review (not editing) */}
          {myReview && !isEditing && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">Tu opinión</span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Editar
                </button>
              </div>
              <div className="flex items-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s <= myReview.rating ? 'text-amber-400' : 'text-gray-200'}`}
                    fill={s <= myReview.rating ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-700">"{myReview.comment}"</p>
            </div>
          )}

          {/* Review form */}
          {showForm && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                {myReview ? 'Editar tu opinión' : 'Deja tu opinión como colega Genio'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Calificación</label>
                  <StarPicker value={rating} onChange={setRating} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2">
                    Comentario <span className="text-gray-400">(mín. 10 caracteres)</span>
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value.slice(0, 500))}
                    rows={3}
                    placeholder="Comparte tu experiencia o lo que destacas de este genio..."
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{comment.length}/500</p>
                </div>
                <div className="flex gap-2 justify-end">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => { setIsEditing(false); setRating(myReview!.rating); setComment(myReview!.comment); }}
                      className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submitting || comment.trim().length < 10}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {myReview ? 'Actualizar opinión' : 'Publicar opinión'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {!canReview && !currentUser && (
            <p className="text-xs text-gray-400 text-center mt-4">
              Inicia sesión como Genio para dejar tu opinión.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default GeniusPeerReviews;
