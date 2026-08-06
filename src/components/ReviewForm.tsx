import React, { useState, useEffect } from 'react';
import { Star, X, Check, Calendar, Camera } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { getCurrentUser } from '../utils/authUtils';
import { validateReviewData } from '../utils/reviewUtils';
import {
  getClientReviewForGenius,
  submitClientReview,
  uploadReviewImages,
  GeniusReview,
} from '../services/supabaseGeniusReviewsService';

interface ReviewFormProps {
  geniusId: string;
  geniusName: string;
  onReviewSubmitted?: (review: any) => void;
}

/**
 * Fecha de hoy en formato `YYYY-MM-DD`, según el reloj de quien reseña.
 * `toISOString()` daría la fecha en UTC: en Perú (UTC-5), a partir de las 19:00
 * devolvería la de mañana, y el formulario arrancaría con un servicio que
 * todavía no ocurrió.
 */
const today = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

/**
 * Tope de fotos por reseña. Dos alcanzan para mostrar un trabajo y mantienen
 * liviana la ficha del genio, que puede llegar a listar decenas de reseñas.
 */
const MAX_REVIEW_IMAGES = 2;

interface ReviewData {
  clientName: string;
  serviceDate: string;
  rating: number;
  comment: string;
  /** Previsualizaciones locales; los archivos originales van en `imageFiles`. */
  images: string[];
}

const ReviewForm: React.FC<ReviewFormProps> = ({ geniusId, geniusName, onReviewSubmitted }) => {
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  /** Estrella sobre la que está el cursor; 0 cuando el mouse está afuera. */
  const [hoverRating, setHoverRating] = useState(0);
  const [imageError, setImageError] = useState('');
  /** Reseña que este cliente ya dejó a este genio; null si todavía no dejó ninguna. */
  const [ownReview, setOwnReview] = useState<GeniusReview | null>(null);
  const [isCheckingOwnReview, setIsCheckingOwnReview] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [reviewData, setReviewData] = useState<ReviewData>({
    clientName: '',
    serviceDate: today(),
    rating: 0,
    comment: '',
    images: []
  });

  // Auto-fill user name if logged in
  useEffect(() => {
    if (currentUser) {
      setReviewData(prev => ({
        ...prev,
        clientName: currentUser.name
      }));
    }
  }, [currentUser]);

  // Listen for auth state changes
  useEffect(() => {
    const handleAuthChange = () => {
      const user = getCurrentUser();
      setCurrentUser(user);
      if (user) {
        setReviewData(prev => ({
          ...prev,
          clientName: user.name
        }));
      } else {
        setReviewData(prev => ({
          ...prev,
          clientName: ''
        }));
      }
    };

    window.addEventListener('authStateChanged', handleAuthChange);
    return () => window.removeEventListener('authStateChanged', handleAuthChange);
  }, []);

  // Una reseña por cliente y por genio: si ya dejó la suya, no se ofrece el
  // formulario de nuevo.
  useEffect(() => {
    let cancelled = false;

    const loadOwnReview = async () => {
      if (!currentUser) {
        setOwnReview(null);
        setIsCheckingOwnReview(false);
        return;
      }

      setIsCheckingOwnReview(true);
      const review = await getClientReviewForGenius(currentUser.id, geniusId);
      if (!cancelled) {
        setOwnReview(review);
        setIsCheckingOwnReview(false);
      }
    };

    loadOwnReview();
    return () => {
      cancelled = true;
    };
  }, [currentUser, geniusId]);

  const handleInputChange = (field: keyof ReviewData, value: any) => {
    setReviewData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStarClick = (rating: number) => {
    setReviewData(prev => ({
      ...prev,
      rating
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Permite volver a elegir el mismo archivo después de quitarlo.
    e.target.value = '';
    if (files.length === 0) return;

    setImageError('');

    const images = files.filter(file => file.type.startsWith('image/'));
    if (images.length < files.length) {
      setImageError('Solo se permiten archivos de imagen.');
    }

    const freeSlots = MAX_REVIEW_IMAGES - reviewData.images.length;
    const accepted = images.slice(0, freeSlots);

    // Recortar en silencio hace creer que se subieron todas: mejor decirlo.
    if (images.length > freeSlots) {
      setImageError(`Solo puedes adjuntar ${MAX_REVIEW_IMAGES} fotos; se tomaron las primeras ${accepted.length}.`);
    }

    if (accepted.length === 0) return;

    setImageFiles(prev => [...prev, ...accepted]);
    setReviewData(prev => ({
      ...prev,
      images: [...prev.images, ...accepted.map(file => URL.createObjectURL(file))]
    }));
  };

  const removeImage = (index: number) => {
    const preview = reviewData.images[index];
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);

    setImageError('');
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setReviewData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  /** Lo que el cursor está previsualizando, o el puntaje ya elegido. */
  const activeStars = hoverRating || reviewData.rating;

  const isFormValid = () => {
    return reviewData.rating > 0 && 
           reviewData.comment.trim().length > 0 && 
           reviewData.serviceDate &&
           currentUser;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) return;

    setIsSubmitting(true);

    try {
      // Validate review data
      const reviewToSubmit = {
        geniusId,
        clientId: currentUser!.id,
        clientName: reviewData.clientName,
        serviceDate: reviewData.serviceDate,
        rating: reviewData.rating,
        comment: reviewData.comment,
        images: reviewData.images,
        verified: true
      };

      const validationErrors = validateReviewData(reviewToSubmit);
      if (validationErrors.length > 0) {
        alert('❌ Error en los datos:\n\n' + validationErrors.join('\n'));
        setIsSubmitting(false);
        return;
      }

      // Las fotos van al bucket de Storage; la reseña guarda solo sus URLs
      const uploadedImages = await uploadReviewImages(imageFiles, geniusId);

      // Una foto que falla se descarta en silencio: sin este aviso, la reseña
      // se publicaría sin ella y el cliente nunca se enteraría.
      if (uploadedImages.length < imageFiles.length) {
        alert('⚠️ No se pudieron subir todas las fotos. La reseña se publicará con las que sí funcionaron.');
      }

      const saved = await submitClientReview({
        reviewedGeniusId: geniusId,
        clientUserId: currentUser!.id,
        clientName: reviewData.clientName,
        clientPhoto: currentUser!.profileImage ?? '',
        rating: reviewData.rating,
        comment: reviewData.comment,
        serviceDate: reviewData.serviceDate,
        images: uploadedImages,
      });

      if (!saved) {
        alert('❌ No se pudo publicar la reseña. Inténtalo de nuevo en un momento.');
        setIsSubmitting(false);
        return;
      }

      // Show success animation
      setShowSuccessAnimation(true);

      // Call callback if provided
      if (onReviewSubmitted) {
        onReviewSubmitted(reviewToSubmit);
      }

      // Reset form
      reviewData.images.forEach(preview => {
        if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
      });
      setImageFiles([]);
      setReviewData({
        clientName: currentUser!.name,
        serviceDate: today(),
        rating: 0,
        comment: '',
        images: []
      });

      // Redirect after animation
      setTimeout(() => {
        setShowSuccessAnimation(false);
        // Just reload the current page to show the new review
        window.location.reload();
      }, 3000);

    } catch (error) {
      console.error('Error submitting review:', error);
      alert('❌ Error al enviar la reseña. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginRedirect = () => {
    // Trigger login modal or redirect to login
    window.dispatchEvent(new CustomEvent('openLoginModal'));
  };

  // Success Animation Component
  const SuccessAnimation = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 text-center max-w-md w-full">
        <div className="mb-6">
          {/* Animated Check Circle */}
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 bg-success rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-success rounded-full w-20 h-20 flex items-center justify-center animate-bounce">
              <Check className="w-10 h-10 text-white animate-pulse" />
            </div>
          </div>
        </div>
        
        <h2 className="font-heading text-xl sm:text-2xl font-bold text-text mb-4">
          ¡Gracias por tu reseña!
        </h2>
        
        <p className="text-text/70 mb-6" style={{ fontFamily: 'Open Sans, sans-serif' }}>
          Tu comentario ayudará a otros clientes a elegir mejor.
        </p>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-success h-2 rounded-full transition-all duration-3000 ease-out"
            style={{ width: '100%', animation: 'progressBar 3s ease-out' }}
          ></div>
        </div>
        
        <p className="text-text/60 text-sm mt-3">
          Redirigiendo en unos segundos...
        </p>
      </div>
    </div>
  );

  // If not logged in, show login prompt
  if (!currentUser) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-8">
        <h2 className="font-heading text-xl sm:text-2xl font-bold mb-6">✍️ COMPARTE TU EXPERIENCIA</h2>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Star className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-text font-medium mb-1">
              🔐 Debes iniciar sesión para dejar una reseña
            </p>
            <p className="text-text/60 text-sm">
              Inicia sesión para compartir tu experiencia con {geniusName} y ayudar a otros clientes.
            </p>
          </div>
          <button
            onClick={handleLoginRedirect}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-full transition-colors shadow-md flex-shrink-0"
            style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  // Mientras se comprueba, no se dibuja el formulario: aparecer y desaparecer
  // sería peor que esperar un instante.
  if (isCheckingOwnReview) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-8">
        <h2 className="font-heading text-xl sm:text-2xl font-bold mb-6">✍️ COMPARTE TU EXPERIENCIA</h2>
        <LoadingSpinner size="md" text="Cargando..." className="py-6" />
      </div>
    );
  }

  // Ya reseñó a este genio: se le muestra lo que escribió, no un formulario en
  // blanco que sugiera que puede opinar de nuevo.
  if (ownReview) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-8">
        <h2 className="font-heading text-xl sm:text-2xl font-bold mb-1">✍️ TU RESEÑA</h2>
        <p className="text-text/60 mb-6">
          Ya compartiste tu experiencia con {geniusName}. Cada cliente puede dejar una sola reseña
          por genio.
        </p>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= ownReview.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            {ownReview.service_date && (
              <span className="text-sm text-text/60">
                Servicio del{' '}
                {new Date(`${ownReview.service_date}T00:00:00`).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </span>
            )}
            {ownReview.moderation_status !== 'visible' && (
              <span className="text-sm text-orange-600">En revisión</span>
            )}
          </div>

          <p className="text-text/80 mb-4">"{ownReview.comment}"</p>

          {ownReview.images.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {ownReview.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Foto ${index + 1} de tu reseña`}
                  loading="lazy"
                  decoding="async"
                  className="w-20 h-20 object-cover rounded-lg border-2 border-white shadow-sm"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-8">
        <div className="mb-6">
          <h2 className="font-heading text-xl sm:text-2xl font-bold mb-1">✍️ COMPARTE TU EXPERIENCIA</h2>
          <p className="text-text/60">
            Tu comentario ayuda a otros a elegir mejor.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* A lo ancho, nombre y fecha entran en la misma fila: dos campos
              cortos estirados a todo el ancho se leen peor que uno al lado del
              otro. */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Name */}
          <div>
            <label className="block text-sm font-medium text-text/80 mb-2">
              👤 Nombre completo (auto-rellenado):
            </label>
            <input
              type="text"
              value={reviewData.clientName}
              onChange={(e) => handleInputChange('clientName', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
              placeholder="Tu nombre completo"
              style={{ fontFamily: 'Open Sans, sans-serif' }}
              required
              readOnly
            />
          </div>

          {/* Service Date */}
          <div>
            <label className="block text-sm font-medium text-text/80 mb-2">
              📅 Fecha del servicio:
            </label>
            <div className="relative">
              <input
                type="date"
                value={reviewData.serviceDate}
                onChange={(e) => handleInputChange('serviceDate', e.target.value)}
                max={today()}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                style={{ fontFamily: 'Open Sans, sans-serif' }}
                required
              />
              <Calendar className="absolute right-4 top-1/2 transform -translate-y-1/2 text-primary/60 pointer-events-none w-5 h-5" />
            </div>
          </div>
          </div>

          {/* Rating Stars */}
          <div>
            <label className="block text-sm font-medium text-text/80 mb-3">
              ⭐ ¿Cómo calificarías su trabajo?
            </label>
            {/* Al pasar el mouse se pintan todas las estrellas hasta donde está
                el cursor: así se ve el puntaje que se va a dar antes de hacer
                clic, en vez de iluminar solo la estrella de debajo. */}
            <div className="flex space-x-2 mb-2" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onFocus={() => setHoverRating(star)}
                  onBlur={() => setHoverRating(0)}
                  className="focus:outline-none transform transition-all hover:scale-110 active:scale-95"
                  aria-label={`${star} de 5 estrellas`}
                >
                  <Star
                    className={`w-10 h-10 sm:w-12 sm:h-12 transition-colors ${
                      star <= activeStars
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {activeStars > 0 && (
              <p className="text-text/60 font-medium">
                {activeStars} de 5 estrellas
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-text/80 mb-2">
              💬 ¿Cómo fue tu experiencia con este genio?
            </label>
            <textarea
              value={reviewData.comment}
              onChange={(e) => {
                if (e.target.value.length <= 300) {
                  handleInputChange('comment', e.target.value);
                }
              }}
              maxLength={300}
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 resize-none"
              placeholder="¿Te gustó? ¿Qué destacarías? ¿Lo recomendarías?"
              style={{ fontFamily: 'Open Sans, sans-serif' }}
              required
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-text/40">
                {300 - reviewData.comment.length} caracteres restantes
              </span>
              {reviewData.comment.length >= 10 && (
                <span className="text-xs text-success flex items-center">
                  <Check className="w-3 h-3 mr-1" />
                  Comentario válido
                </span>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-text/80 mb-3">
              📷 ¿Tienes fotos del trabajo realizado? (máximo {MAX_REVIEW_IMAGES} imágenes)
            </label>
            
            {/* Image Preview */}
            {reviewData.images.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
                {reviewData.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Imagen ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border-2 border-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-md"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            {reviewData.images.length < MAX_REVIEW_IMAGES && (
              <div className="flex items-center justify-center w-full">
                <label className="w-full flex items-center justify-center px-4 sm:px-6 py-4 rounded-xl border-2 border-dashed border-primary/30 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                  <div className="text-center">
                    <Camera className="mx-auto h-8 w-8 text-primary/60 mb-2" />
                    <span className="text-text/60 font-medium">
                      Seleccionar fotos ({reviewData.images.length}/{MAX_REVIEW_IMAGES})
                    </span>
                    <p className="text-xs text-text/40 mt-1">
                      JPG, PNG o WebP. Se optimizan al publicarlas.
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            )}

            {imageError && (
              <p className="text-sm text-red-500 mt-2 flex items-center">
                <X className="w-4 h-4 mr-1" />
                {imageError}
              </p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              type="submit"
              disabled={!isFormValid() || isSubmitting}
              className={`sm:px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-md hover:shadow-lg ${
                isFormValid() && !isSubmitting
                  ? 'bg-primary hover:bg-primary-dark text-white transform hover:scale-[1.02]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Publicando...
                </div>
              ) : (
                '📤 Publicar reseña'
              )}
            </button>
            
            <button
              type="button"
              onClick={() => {
                setReviewData({
                  clientName: currentUser.name,
                  serviceDate: today(),
                  rating: 0,
                  comment: '',
                  images: []
                });
              }}
              disabled={isSubmitting}
              className="sm:px-10 py-4 rounded-xl font-semibold text-lg text-text/60 hover:bg-gray-100 transition-colors border-2 border-gray-200 hover:border-gray-300 disabled:opacity-50"
              style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
            >
              🔄 Limpiar formulario
            </button>
          </div>

          {/* Form Validation Hints */}
          {!isFormValid() && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="text-orange-800 font-medium mb-2">
                Para publicar tu reseña necesitas:
              </p>
              <ul className="text-orange-700 text-sm space-y-1">
                {reviewData.rating === 0 && (
                  <li>• Seleccionar una calificación (estrellas)</li>
                )}
                {!reviewData.serviceDate && (
                  <li>• Indicar la fecha del servicio</li>
                )}
                {reviewData.comment.trim().length === 0 && (
                  <li>• Escribir un comentario sobre tu experiencia</li>
                )}
              </ul>
            </div>
          )}
        </form>
      </div>

      {/* Success Animation */}
      {showSuccessAnimation && <SuccessAnimation />}
    </>
  );
};

export default ReviewForm;