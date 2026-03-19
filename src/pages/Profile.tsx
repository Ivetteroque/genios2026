import React, { useState, useEffect } from 'react';
import { Star, MapPin, MessageSquare, Globe, Instagram, Facebook, Video, ChevronLeft, ChevronRight, Calendar, Upload, X, Check } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { handleWhatsAppContact } from '../utils/whatsappUtils';
import FavoriteButton from '../components/FavoriteButton';
import ReviewForm from '../components/ReviewForm';
import GeniusAvailabilityBadge from '../components/GeniusAvailabilityBadge';
import PublicAvailabilityCalendar from '../components/PublicAvailabilityCalendar';
import { useGeniusAvailability } from '../hooks/useGeniusAvailability';
import {
  getReviewsForGenius,
  calculateGeniusRatingStats,
  Review as ReviewType,
  GeniusRatingStats
} from '../utils/reviewUtils';

const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [ratingStats, setRatingStats] = useState<GeniusRatingStats>({
    averageRating: 4.9,
    totalReviews: 42,
    ratingDistribution: { 5: 30, 4: 8, 3: 3, 2: 1, 1: 0 }
  });

  const { isAvailableToday, getDisplayStatus } = useGeniusAvailability(id);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const geniusData = {
    id: id || 'carla-maquilladora',
    name: 'Carla Maquilladora',
    category: 'Belleza y Estética',
    subcategory: 'Maquillaje Profesional',
    phone: '51999123456',
    rating: ratingStats.averageRating,
    reviews: ratingStats.totalReviews,
    location: 'Tacna, Perú',
    available: isAvailableToday,
    verified: true,
    description: 'Hola, soy Carla, maquilladora profesional con más de 5 años de experiencia en eventos, novias y sesiones fotográficas. Amo resaltar la belleza natural de cada persona y hacer que cada ocasión se sienta especial. He trabajado con productoras, novias y artistas locales.',
    profileImage: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  };

  const portfolio = [
    'https://images.pexels.com/photos/2681751/pexels-photo-2681751.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'https://images.pexels.com/photos/2681751/pexels-photo-2681751.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    'https://images.pexels.com/photos/2681751/pexels-photo-2681751.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  ];

  // Load reviews and rating stats
  useEffect(() => {
    loadReviewsAndStats();
  }, [id]);

  // Listen for review changes
  useEffect(() => {
    const handleReviewsChange = () => {
      loadReviewsAndStats();
    };

    window.addEventListener('reviewsChanged', handleReviewsChange);
    return () => window.removeEventListener('reviewsChanged', handleReviewsChange);
  }, [id]);

  const loadReviewsAndStats = () => {
    if (id) {
      const geniusReviews = getReviewsForGenius(id);
      const stats = calculateGeniusRatingStats(id);
      
      setReviews(geniusReviews);
      setRatingStats(stats);
      
      console.log(`Loaded ${geniusReviews.length} reviews for genius ${id}`);
      console.log('Rating stats:', stats);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev + 3 >= portfolio.length ? 0 : prev + 3
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev - 3 < 0 ? Math.max(0, portfolio.length - 3) : prev - 3
    );
  };

  const handleReviewSubmitted = (review: any) => {
    console.log('New review submitted:', review);
    
    // Reload reviews and stats to reflect the new review
    loadReviewsAndStats();
    
    // Show success message
    alert('✅ ¡Reseña publicada exitosamente!\n\nTu comentario ya es visible en el perfil del genio.');
  };

  const visibleImages = portfolio.slice(currentImageIndex, currentImageIndex + 3);

  // Handle WhatsApp contact
  const handleContactClick = () => {
    handleWhatsAppContact(
      geniusData.id,
      geniusData.name,
      geniusData.category,
      geniusData.phone
    );
  };

  // Hero Section Component
  const HeroSection = () => (
    <section className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            to="/categories"
            className="inline-flex items-center text-primary hover:text-primary-dark transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Volver a categorías
          </Link>
        </div>

        <div className="flex flex-col items-center relative">
          {/* Profile Image with Favorite Button */}
          <div className="relative">
            <img
              src={geniusData.profileImage}
              alt={geniusData.name}
              className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover shadow-lg mb-4"
            />
            
            {/* Favorite Button - positioned on top right of profile image */}
            <div className="absolute top-2 right-2 md:top-4 md:right-4">
              <FavoriteButton
                genius={{
                  id: geniusData.id,
                  name: geniusData.name,
                  category: geniusData.category,
                  subcategory: geniusData.subcategory,
                  image: geniusData.profileImage,
                  rating: geniusData.rating,
                  available: geniusData.available,
                  phone: geniusData.phone
                }}
                size="md"
                showTooltip={true}
              />
            </div>
          </div>

          <h1 className="font-heading text-2xl md:text-4xl font-bold text-text mb-2">
            {geniusData.name} 💄
          </h1>
          <p className="text-text/60 text-lg mb-4">
            {geniusData.subcategory} / Eventos / Novias
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
            <div className="flex items-center text-text/60">
              <MapPin className="w-5 h-5 mr-1" />
              {geniusData.location}
            </div>
            <GeniusAvailabilityBadge geniusId={geniusData.id} showIcon={true} showNextDate={true} />
            <button
              onClick={handleContactClick}
              className="bg-primary text-white px-6 py-2 rounded-full hover:bg-primary-dark transition-colors flex items-center"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Contactar por WhatsApp
            </button>
          </div>
        </div>
      </div>
    </section>
  );

  // About Section Component
  const AboutSection = () => (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-2xl font-bold mb-6">Acerca de mí</h2>
        <p className="text-text/80 leading-relaxed max-w-3xl mx-auto">
          "{geniusData.description}"
        </p>

        <div className="flex justify-center mt-8 space-x-4">
          <a href="#web" className="text-text/60 hover:text-primary transition-colors">
            <Globe className="w-6 h-6" />
          </a>
          <a href="#instagram" className="text-text/60 hover:text-primary transition-colors">
            <Instagram className="w-6 h-6" />
          </a>
          <a href="#facebook" className="text-text/60 hover:text-primary transition-colors">
            <Facebook className="w-6 h-6" />
          </a>
          <a href="#tiktok" className="text-text/60 hover:text-primary transition-colors">
            <Video className="w-6 h-6" />
          </a>
        </div>
      </div>
    </section>
  );

  const PortfolioSection = () => (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          <div className="lg:col-span-2">
            <h2 className="font-heading text-2xl font-bold mb-6">Trabajos realizados</h2>
            <div className="relative">
              <button
                onClick={prevImage}
                className="absolute -left-4 top-1/2 transform -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
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
              <button
                onClick={nextImage}
                className="absolute -right-4 top-1/2 transform -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <h2 className="font-heading text-2xl font-bold mb-6">Disponibilidad</h2>
            <PublicAvailabilityCalendar geniusId={geniusData.id} compact={true} />
          </div>
        </div>
      </div>
    </section>
  );

  // Reviews Section Component
  const ReviewsSection = () => (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <h2 className="font-heading text-2xl font-bold">⭐ VALORACIONES DEL GENIO</h2>
              <div className="ml-4 flex items-center">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < Math.floor(ratingStats.averageRating) ? 'text-primary' : 'text-gray-300'}`}
                      fill={i < Math.floor(ratingStats.averageRating) ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>
                <span className="ml-2 text-text/60">
                  ({ratingStats.averageRating} de {ratingStats.totalReviews} valoraciones)
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowReviewModal(true)}
              className="text-primary hover:text-primary-dark transition-colors"
            >
              🔽 Ver más comentarios
            </button>
          </div>

          {/* Rating Distribution */}
          {ratingStats.totalReviews > 0 && (
            <div className="mb-6 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-text text-sm mb-2">Distribución de calificaciones:</h4>
              <div className="space-y-1.5">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center space-x-2">
                    <span className="text-xs font-medium w-6 text-text/70">{rating}★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-primary h-1.5 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${ratingStats.totalReviews > 0 
                            ? (ratingStats.ratingDistribution[rating as keyof typeof ratingStats.ratingDistribution] / ratingStats.totalReviews) * 100 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-text/60 w-6 text-right">
                      {ratingStats.ratingDistribution[rating as keyof typeof ratingStats.ratingDistribution]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {reviews.length > 0 ? reviews.slice(0, 3).map((review) => (
              <div key={review.id} className="p-5 bg-background rounded-xl hover:shadow-md transition-all duration-300 border border-gray-100">
                <div className="relative">
                  {/* Date in top right corner */}
                  <div className="absolute top-0 right-0">
                    <span className="text-xs text-text/50 font-medium bg-gray-50 px-2 py-1 rounded-md">
                      {new Date(review.serviceDate).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="flex items-start space-x-4 pr-16">
                    {/* User profile photo */}
                    <div className="flex-shrink-0">
                      <img
                        src={`https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000)}/pexels-photo-${Math.floor(Math.random() * 1000000)}.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2`}
                        alt={review.clientName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                        onError={(e) => {
                          // Fallback to a default avatar if image fails to load
                          (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2';
                        }}
                      />
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      {/* User name and stars in same line */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-text text-lg">{review.clientName}</h4>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'text-primary' : 'text-gray-300'}`}
                                fill={i < review.rating ? 'currentColor' : 'none'}
                              />
                            ))}
                          </div>
                        </div>
                        {review.verified && (
                          <div className="flex-shrink-0">
                            <Check className="w-4 h-4 text-success" />
                          </div>
                        )}
                      </div>
                      
                      {/* Review comment - aligned with user name */}
                      <p className="text-text/80 leading-relaxed mb-4 text-base">
                        "{review.comment}"
                      </p>
                      
                      {/* Photo thumbnails below comment */}
                      {review.images && review.images.length > 0 && (
                        <div className="flex space-x-2 mt-3">
                          {review.images.slice(0, 3).map((image, index) => (
                            <div
                              key={index}
                              className="relative group cursor-pointer"
                              onClick={() => setSelectedImage(image)}
                            >
                              <img
                                src={image}
                                alt={`Foto del trabajo ${index + 1}`}
                                className="w-16 h-16 rounded-lg object-cover shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-105 border-2 border-white"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-300"></div>
                            </div>
                          ))}
                          {review.images.length > 3 && (
                            <div 
                              className="w-16 h-16 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                              onClick={() => setSelectedImage(review.images[3])}
                            >
                              <span className="text-xs text-gray-500 font-medium">
                                +{review.images.length - 3}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-text/60">
                <Star className="w-12 h-12 mx-auto mb-4 text-text/40" />
                <p className="text-lg font-medium mb-2">Aún no hay reseñas</p>
                <p>¡Sé el primero en compartir tu experiencia con {geniusData.name}!</p>
              </div>
            )}
          </div>
        </div>

        {/* Review Form Component */}
        <ReviewForm 
          geniusId={geniusData.id}
          geniusName={geniusData.name}
          onReviewSubmitted={handleReviewSubmitted}
        />
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h3 className="font-heading text-xl font-bold">
                🧾 TODAS LAS VALORACIONES ({ratingStats.totalReviews})
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-text/60 hover:text-text transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {reviews.length > 0 ? reviews.map((review) => (
                <div key={review.id} className="border-b pb-6 mb-6 last:border-b-0 last:pb-0 last:mb-0">
                  <div className="relative">
                    {/* Date in top right corner */}
                    <div className="absolute top-0 right-0">
                      <span className="text-xs text-text/50 font-medium bg-gray-50 px-2 py-1 rounded-md">
                        {new Date(review.serviceDate).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="flex items-start space-x-4 pr-16">
                      {/* User profile photo */}
                      <div className="flex-shrink-0">
                        <img
                          src={`https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000)}/pexels-photo-${Math.floor(Math.random() * 1000000)}.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2`}
                          alt={review.clientName}
                          className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                          onError={(e) => {
                            // Fallback to a default avatar if image fails to load
                            (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2';
                          }}
                        />
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        {/* User name and stars in same line */}
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-text text-xl">{review.clientName}</h4>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-5 h-5 ${i < review.rating ? 'text-primary' : 'text-gray-300'}`}
                                  fill={i < review.rating ? 'currentColor' : 'none'}
                                />
                              ))}
                            </div>
                          </div>
                          {review.verified && (
                            <div className="flex-shrink-0">
                              <Check className="w-5 h-5 text-success" />
                            </div>
                          )}
                        </div>
                        
                        {/* Review comment - aligned with user name */}
                        <p className="text-text/80 leading-relaxed mb-4 text-base">
                          "{review.comment}"
                        </p>
                        
                        {/* Photo thumbnails below comment */}
                        {review.images && review.images.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {review.images.map((image, index) => (
                              <div
                                key={index}
                                className="relative group cursor-pointer"
                                onClick={() => setSelectedImage(image)}
                              >
                                <img
                                  src={image}
                                  alt={`Foto del trabajo ${index + 1}`}
                                  className="w-20 h-20 rounded-lg object-cover shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105 border-2 border-white"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-300"></div>
                                <div className="absolute top-1 right-1 bg-white/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12 text-text/60">
                  <Star className="w-16 h-16 mx-auto mb-4 text-text/40" />
                  <p className="text-lg font-medium mb-2">No hay reseñas aún</p>
                  <p>Este genio aún no tiene reseñas de clientes.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full size review"
            className="max-w-full max-h-[90vh] object-contain"
          />
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
        </div>
      )}
    </section>
  );

  return (
    <div className="min-h-screen bg-background pt-20">
      <HeroSection />
      <AboutSection />
      <PortfolioSection />
      <ReviewsSection />
      
      {/* WhatsApp Float Button */}
      <button
        onClick={handleContactClick}
        className="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:bg-[#128C7E] transition-colors"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    </div>
  );
};

export default Profile;