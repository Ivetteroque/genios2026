import React, { useState, useEffect } from 'react';
import { Star, X, Check, Calendar, Camera } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { getCurrentUser } from '../utils/authUtils';
import { addReview, validateReviewData } from '../utils/reviewUtils';

interface ReviewFormProps {
  geniusId: string;
  geniusName: string;
  onReviewSubmitted?: (review: any) => void;
}

interface ReviewData {
  clientName: string;
  serviceDate: string;
  rating: number;
  comment: string;
  images: string[];
}

const ReviewForm: React.FC<ReviewFormProps> = ({ geniusId, geniusName, onReviewSubmitted }) => {
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewData, setReviewData] = useState<ReviewData>({
    clientName: '',
    serviceDate: '',
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
    if (files.length === 0) return;

    // Limit to 2 images
    const filesToProcess = files.slice(0, 2 - reviewData.images.length);

    const readers = filesToProcess.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(results => {
      setReviewData(prev => ({
        ...prev,
        images: [...prev.images, ...results].slice(0, 2)
      }));
    });
  };

  const removeImage = (index: number) => {
    setReviewData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Storage management utilities
  const getStorageSize = () => {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  };

  const isStorageAvailable = (dataSize: number) => {
    const currentSize = getStorageSize();
    const maxSize = 5 * 1024 * 1024; // 5MB typical limit
    return (currentSize + dataSize) < (maxSize * 0.8); // Use 80% of limit as safety margin
  };

  const cleanupOldReviews = () => {
    try {
      const existingReviews = JSON.parse(localStorage.getItem('reviews') || '[]');
      if (existingReviews.length > 50) {
        // Keep only the 30 most recent reviews
        const sortedReviews = existingReviews
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 30);
        localStorage.setItem('reviews', JSON.stringify(sortedReviews));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error cleaning up reviews:', error);
      return false;
    }
  };

  const compressImages = (images: string[]): string[] => {
    return images.map(image => {
      try {
        // Create a canvas to compress the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        return new Promise<string>((resolve) => {
          img.onload = () => {
            // Resize to max 800px width while maintaining aspect ratio
            const maxWidth = 800;
            const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            // Compress to 70% quality
            const compressedImage = canvas.toDataURL('image/jpeg', 0.7);
            resolve(compressedImage);
          };
          img.src = image;
        });
      } catch (error) {
        console.error('Error compressing image:', error);
        return image; // Return original if compression fails
      }
    });
  };
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

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Add review using the utility function
      try {
        const newReview = addReview(reviewToSubmit);
        console.log('Review successfully added:', newReview);
        
      } catch (storageError: any) {
        console.error('Storage error:', storageError);
        
        if (storageError.name === 'QuotaExceededError' || storageError.code === 22) {
          // Try saving without images as fallback
          try {
            const reviewWithoutImages = { ...reviewToSubmit, images: [] };
            const newReview = addReview(reviewWithoutImages);
            alert('⚠️ Reseña guardada sin imágenes debido a limitaciones de almacenamiento.');
            console.log('Review saved without images:', newReview);
          } catch (finalError) {
            console.error('Final storage attempt failed:', finalError);
            alert('❌ No se pudo guardar la reseña debido a limitaciones de almacenamiento del navegador.');
            setIsSubmitting(false);
            return;
          }
        } else {
          throw storageError;
        }
      }

      // Show success animation
      setShowSuccessAnimation(true);

      // Call callback if provided
      if (onReviewSubmitted) {
        onReviewSubmitted(reviewToSubmit);
      }

      // Reset form
      setReviewData({
        clientName: currentUser!.name,
        serviceDate: '',
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
        
        <h2 className="font-heading text-2xl font-bold text-text mb-4">
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
      <div className="bg-white rounded-lg shadow-sm p-8 max-w-2xl mx-auto text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-heading text-xl font-bold text-text mb-2">
            Comparte tu experiencia
          </h3>
          <p className="text-text/60">
            Tu comentario ayuda a otros a elegir mejor.
          </p>
        </div>
        
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-6">
          <p className="text-text font-medium mb-4">
            🔐 Debes iniciar sesión para dejar una reseña
          </p>
          <p className="text-text/60 text-sm mb-4">
            Inicia sesión para compartir tu experiencia con {geniusName} y ayudar a otros clientes.
          </p>
          <button
            onClick={handleLoginRedirect}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-full transition-colors shadow-md"
            style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h3 className="font-heading text-2xl font-bold text-text mb-3">
            Comparte tu experiencia
          </h3>
          <p className="text-text/60 text-lg">
            Tu comentario ayuda a otros a elegir mejor.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                style={{ fontFamily: 'Open Sans, sans-serif' }}
                required
              />
              <Calendar className="absolute right-4 top-1/2 transform -translate-y-1/2 text-primary/60 pointer-events-none w-5 h-5" />
            </div>
          </div>

          {/* Rating Stars */}
          <div>
            <label className="block text-sm font-medium text-text/80 mb-3">
              ⭐ ¿Cómo calificarías su trabajo?
            </label>
            <div className="flex justify-center space-x-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  className="focus:outline-none transform transition-all hover:scale-110 active:scale-95"
                >
                  <Star
                    className={`w-12 h-12 transition-colors ${
                      star <= reviewData.rating 
                        ? 'text-primary fill-current' 
                        : 'text-gray-300 hover:text-primary/50'
                    }`}
                  />
                </button>
              ))}
            </div>
            {reviewData.rating > 0 && (
              <p className="text-center text-primary font-medium">
                {reviewData.rating} de 5 estrellas
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
              📷 ¿Tienes fotos del trabajo realizado? (máximo 2 imágenes)
            </label>
            
            {/* Image Preview */}
            {reviewData.images.length > 0 && (
              <div className="flex space-x-3 mb-4">
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
            {reviewData.images.length < 2 && (
              <div className="flex items-center justify-center w-full">
                <label className="w-full flex items-center justify-center px-6 py-4 rounded-xl border-2 border-dashed border-primary/30 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                  <div className="text-center">
                    <Camera className="mx-auto h-8 w-8 text-primary/60 mb-2" />
                    <span className="text-text/60 font-medium">
                      Seleccionar fotos ({reviewData.images.length}/2)
                    </span>
                    <p className="text-xs text-text/40 mt-1">
                      JPG, PNG hasta 5MB cada una
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
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={!isFormValid() || isSubmitting}
              className={`flex-1 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-md hover:shadow-lg ${
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
                  serviceDate: '',
                  rating: 0,
                  comment: '',
                  images: []
                });
              }}
              disabled={isSubmitting}
              className="flex-1 py-4 rounded-xl font-semibold text-lg text-text/60 hover:bg-gray-100 transition-colors border-2 border-gray-200 hover:border-gray-300 disabled:opacity-50"
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

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes progressBar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </>
  );
};

export default ReviewForm;