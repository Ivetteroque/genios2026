import React, { useState } from 'react';
import { X, Star, MapPin, MessageSquare, Globe, Instagram, Facebook, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { Genius } from '../utils/geniusUtils';
import { getReviewsForGenius, calculateGeniusRatingStats } from '../utils/reviewUtils';
import LocationChips from './LocationChips';

interface GeniusProfilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  geniusData: Genius;
}

const GeniusProfilePreviewModal: React.FC<GeniusProfilePreviewModalProps> = ({
  isOpen,
  onClose,
  geniusData
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Get real reviews and rating stats for this genius
  const reviews = getReviewsForGenius(geniusData.id);
  const ratingStats = calculateGeniusRatingStats(geniusData.id);

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev + 3 >= geniusData.portfolio.length ? 0 : prev + 3
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev - 3 < 0 ? Math.max(0, geniusData.portfolio.length - 3) : prev - 3
    );
  };

  const visibleImages = geniusData.portfolio.slice(currentImageIndex, currentImageIndex + 3);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
          <h3 className="font-heading text-xl font-bold text-text">
            👁️ Vista Previa del Perfil Público
          </h3>
          <button
            onClick={onClose}
            className="text-text/60 hover:text-text transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Preview Content */}
        <div className="p-6">
          {/* Hero Section */}
          <section className="bg-white shadow-sm rounded-lg mb-6">
            <div className="p-6">
              <div className="flex flex-col items-center relative">
                {/* Profile Image */}
                <img
                  src={geniusData.profilePhoto || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'}
                  alt={geniusData.fullName}
                  className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover shadow-lg mb-4"
                />

                <h1 className="font-heading text-2xl md:text-4xl font-bold text-text mb-2">
                  {geniusData.fullName || 'Nombre del Genio'}
                </h1>
                <p className="text-text/60 text-lg mb-4">
                  {geniusData.subcategories.join(' / ') || 'Subcategorías'}
                </p>
                
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < Math.floor(ratingStats.averageRating) ? 'text-primary' : 'text-gray-300'}`}
                      fill={i < Math.floor(ratingStats.averageRating) ? 'currentColor' : 'none'}
                    />
                  ))}
                  <span className="ml-2 text-text/60">
                    ({ratingStats.averageRating} de {ratingStats.totalReviews} opiniones)
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 justify-center items-center">
                  {geniusData.homeLocation && (
                    <div className="flex items-center text-text/60">
                      <Home className="w-5 h-5 mr-1" />
                      {geniusData.homeLocation.districtName}, {geniusData.homeLocation.provinceName}
                    </div>
                  )}
                  <div className="flex items-center text-primary">
                    <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                    Disponible
                  </div>
                  <button className="bg-primary text-white px-6 py-2 rounded-full hover:bg-primary-dark transition-colors flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Contactar por WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* About Section */}
          <section className="py-6 bg-gray-50 rounded-lg mb-6">
            <div className="px-6">
              <h2 className="font-heading text-2xl font-bold mb-4">Acerca de mí</h2>
              <p className="text-text/80 leading-relaxed max-w-3xl">
                "{geniusData.description || 'Descripción del genio aparecerá aquí...'}"
              </p>

              {(geniusData.instagram || geniusData.facebook || geniusData.tiktok) && (
                <div className="flex justify-center mt-6 space-x-4">
                  {geniusData.instagram && (
                    <a href={geniusData.instagram} target="_blank" rel="noopener noreferrer" className="text-text/60 hover:text-primary transition-colors">
                      <Instagram className="w-6 h-6" />
                    </a>
                  )}
                  {geniusData.facebook && (
                    <a href={geniusData.facebook} target="_blank" rel="noopener noreferrer" className="text-text/60 hover:text-primary transition-colors">
                      <Facebook className="w-6 h-6" />
                    </a>
                  )}
                  {geniusData.tiktok && (
                    <a href={geniusData.tiktok} target="_blank" rel="noopener noreferrer" className="text-text/60 hover:text-primary transition-colors">
                      <div className="w-6 h-6 bg-black rounded flex items-center justify-center text-white text-xs font-bold">
                        TT
                      </div>
                    </a>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Portfolio Section */}
          {geniusData.portfolio.length > 0 && (
            <section className="py-6 bg-white rounded-lg mb-6">
              <div className="px-6">
                <h2 className="font-heading text-2xl font-bold mb-6">Trabajos realizados</h2>
                <div className="relative max-w-5xl mx-auto">
                  {geniusData.portfolio.length > 3 && (
                    <button
                      onClick={prevImage}
                      className="absolute -left-4 top-1/2 transform -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md z-10"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  )}
                  
                  <div className="overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {visibleImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Trabajo ${currentImageIndex + index + 1}`}
                            className="w-full h-48 object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm">Ver más detalles</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {geniusData.portfolio.length > 3 && (
                    <button
                      onClick={nextImage}
                      className="absolute -right-4 top-1/2 transform -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md z-10"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Location Section */}
          {geniusData.homeLocation && (
            <section className="py-6 bg-gray-50 rounded-lg mb-6">
              <div className="px-6 space-y-6">
                <div>
                  <h2 className="font-heading text-2xl font-bold mb-4 flex items-center">
                    <Home className="w-6 h-6 mr-2 text-primary" />
                    Ubicación
                  </h2>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-text">
                      <span className="font-medium">Vive en:</span> {geniusData.homeLocation.districtName}, {geniusData.homeLocation.provinceName}, {geniusData.homeLocation.departmentName}
                    </p>
                  </div>
                </div>

                <div>
                  <h2 className="font-heading text-2xl font-bold mb-4 flex items-center">
                    <MapPin className="w-6 h-6 mr-2 text-primary" />
                    Zonas de Atención
                  </h2>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <LocationChips
                      coverageType={geniusData.coverageType || 'my-district'}
                      homeLocation={geniusData.homeLocation}
                      customDistricts={geniusData.workLocations}
                      showRemoveButton={false}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Fallback for old data structure */}
          {!geniusData.homeLocation && geniusData.workLocations.length > 0 && (
            <section className="py-6 bg-gray-50 rounded-lg mb-6">
              <div className="px-6">
                <h2 className="font-heading text-2xl font-bold mb-4">Zonas de Trabajo</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {geniusData.workLocations.map((location, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-gray-200">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-text text-sm">{location.districtName || location.fullName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Reviews Section */}
          <section className="py-6 bg-gray-50 rounded-lg">
            <div className="px-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="font-heading text-2xl font-bold mb-4">⭐ VALORACIONES DEL GENIO</h2>
                
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.slice(0, 2).map((review) => (
                      <div key={review.id} className="p-4 bg-background rounded-xl border border-gray-100">
                        <div className="flex items-start space-x-4">
                          <img
                            src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2"
                            alt={review.clientName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-text">{review.clientName}</h4>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${i < review.rating ? 'text-primary' : 'text-gray-300'}`}
                                    fill={i < review.rating ? 'currentColor' : 'none'}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-text/80 text-sm">"{review.comment}"</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-text/60">
                    <Star className="w-12 h-12 mx-auto mb-4 text-text/40" />
                    <p className="text-lg font-medium mb-2">Aún no hay reseñas</p>
                    <p>¡Sé el primero en compartir tu experiencia!</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-white p-4 border-t">
          <div className="text-center">
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-full transition-colors"
            >
              Cerrar Vista Previa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeniusProfilePreviewModal;