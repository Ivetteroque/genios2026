import React, { useState, useEffect, useRef } from 'react';
import { Star, MapPin, MessageSquare, Instagram, Facebook, Video, ChevronLeft, ChevronRight, Calendar, Upload, X, Check, MoreVertical, Share2, Copy, Flag } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { handleWhatsAppContact } from '../utils/whatsappUtils';
import FavoriteButton from '../components/FavoriteButton';
import ReviewForm from '../components/ReviewForm';
import GeniusAvailabilityBadge from '../components/GeniusAvailabilityBadge';
import PublicAvailabilityCalendar from '../components/PublicAvailabilityCalendar';
import GeniusPeerReviews from '../components/GeniusPeerReviews';
import ReportModal from '../components/ReportModal';
import { useGeniusAvailability } from '../hooks/useGeniusAvailability';
import {
  getClientReviewsForGenius,
  getRatingStatsForGenius,
  GeniusReview,
  RatingStats,
} from '../services/supabaseGeniusReviewsService';
import { getPublicGeniusById, DirectoryGenius } from '../services/publicGeniusDirectoryService';

/** Un promedio siempre con decimal: "3" se muestra "3.0", igual que "3.5". */
const formatAverage = (average: number) =>
  average.toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * Resume la calificación en una frase legible. "3 de 1 opiniones" mezclaba dos
 * números distintos —promedio y cantidad— con un "de" que los hacía parecer
 * parte de la misma fracción.
 */
const ratingSummary = (average: number, count: number, singular: string, plural: string) =>
  count === 0
    ? `Sin ${plural} aún`
    : `${formatAverage(average)} · ${count} ${count === 1 ? singular : plural}`;

const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [reviews, setReviews] = useState<GeniusReview[]>([]);
  const [ratingStats, setRatingStats] = useState<RatingStats>({
    average: 0,
    count: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [genius, setGenius] = useState<DirectoryGenius | null>(null);
  const [isLoadingGenius, setIsLoadingGenius] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const { isAvailableToday, getDisplayStatus } = useGeniusAvailability(id);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setShowContextMenu(false);
      }
    };
    if (showContextMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showContextMenu]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 1800);
    });
    setShowContextMenu(false);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: geniusData.name, url: window.location.href }).catch(() => {});
    } else {
      handleCopyLink();
    }
    setShowContextMenu(false);
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  // Cargar el perfil público real desde Supabase
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const loadGenius = async () => {
      setIsLoadingGenius(true);
      setLoadError(false);
      try {
        const profile = await getPublicGeniusById(id);
        if (!cancelled) setGenius(profile);
      } catch (error) {
        console.error('Error loading genius profile:', error);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setIsLoadingGenius(false);
      }
    };

    loadGenius();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const homeLocation = genius?.home_location;
  const locationLabel = homeLocation
    ? [homeLocation.districtName, homeLocation.departmentName].filter(Boolean).join(', ')
    : '';

  const geniusData = {
    id: genius?.id ?? id ?? '',
    name: genius?.full_name ?? '',
    category: genius?.category ?? '',
    subcategory: genius?.subcategories?.[0] || genius?.service_name || genius?.category || '',
    phone: genius?.phone ?? '',
    rating: ratingStats.average,
    reviews: ratingStats.count,
    location: locationLabel,
    available: isAvailableToday,
    verified: genius?.has_documents ?? false,
    description: genius?.description ?? '',
    profileImage: genius?.profile_photo ?? '',
    instagram: genius?.instagram ?? '',
    facebook: genius?.facebook ?? '',
    tiktok: genius?.tiktok ?? '',
  };

  const portfolio = genius?.portfolio ?? [];

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

  const loadReviewsAndStats = async () => {
    if (!id) return;

    const [geniusReviews, stats] = await Promise.all([
      getClientReviewsForGenius(id),
      getRatingStatsForGenius(id),
    ]);

    setReviews(geniusReviews);
    setRatingStats(stats);
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

  // La confirmación la da la animación del propio formulario; un alert encima
  // sería una segunda confirmación, y además bloquea la página.
  const handleReviewSubmitted = () => {
    loadReviewsAndStats();
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

  // Secciones como elementos, no como componentes: si fueran funciones
  // declaradas acá dentro, cada render de Profile crearía un tipo nuevo y React
  // desmontaría y volvería a montar todo el subárbol, perdiendo el estado de
  // los hijos (por ejemplo, la animación de éxito de ReviewForm).
  const heroSection = (
    <section className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button + Context Menu */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/categories"
            className="inline-flex items-center text-primary hover:text-primary-dark transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Volver a categorías
          </Link>

          {/* Context menu */}
          <div className="relative" ref={contextMenuRef}>
            <button
              onClick={() => setShowContextMenu(v => !v)}
              className="p-2 rounded-lg text-text/35 hover:text-text/60 hover:bg-gray-50 transition-colors"
              title="Más opciones"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showContextMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-gray-100 shadow-lg z-30 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                <button
                  onClick={handleShare}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-[#2F2F2F]/70 hover:bg-gray-50 hover:text-[#2F2F2F] transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 flex-shrink-0" />
                  Compartir perfil
                </button>
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-[#2F2F2F]/70 hover:bg-gray-50 hover:text-[#2F2F2F] transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 flex-shrink-0" />
                  {copySuccess ? 'Enlace copiado' : 'Copiar enlace'}
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button
                  onClick={() => { setShowContextMenu(false); setShowReportModal(true); }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-400 hover:bg-red-50/60 hover:text-red-500 transition-colors"
                >
                  <Flag className="w-3.5 h-3.5 flex-shrink-0" />
                  Reportar perfil
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center relative">
          {/* Profile Image with Favorite Button */}
          <div className="relative">
            {geniusData.profileImage ? (
              <img
                src={geniusData.profileImage}
                alt={geniusData.name}
                className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover shadow-lg mb-4"
              />
            ) : (
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-surface-blue shadow-lg mb-4 flex items-center justify-center">
                <span className="font-heading font-bold text-4xl md:text-6xl text-ink-blue">
                  {geniusData.name.trim().charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            
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
            {geniusData.name}
          </h1>
          <p className="text-text/60 text-lg mb-4">
            {(genius?.subcategories ?? []).join(' / ') || geniusData.subcategory}
          </p>
          
          <div className="flex items-center mb-4">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${i < Math.floor(ratingStats.average) ? 'text-primary' : 'text-gray-300'}`}
                fill={i < Math.floor(ratingStats.average) ? 'currentColor' : 'none'}
              />
            ))}
            <span className="ml-2 text-text/60">
              {ratingSummary(ratingStats.average, ratingStats.count, 'opinión', 'opiniones')}
            </span>
          </div>

          <div className="flex flex-wrap gap-4 justify-center items-center">
            {geniusData.location && (
              <div className="flex items-center text-text/60">
                <MapPin className="w-5 h-5 mr-1" />
                {geniusData.location}
              </div>
            )}
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
  const aboutSection = (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="font-heading text-2xl font-bold mb-6">Acerca de mí</h2>
        {geniusData.description ? (
          <p className="text-text/80 leading-relaxed max-w-3xl mx-auto">
            "{geniusData.description}"
          </p>
        ) : (
          <p className="text-text/50 max-w-3xl mx-auto">
            Este genio todavía no escribió su presentación.
          </p>
        )}

        <div className="flex justify-center mt-8 space-x-4">
          {geniusData.instagram && (
            <a
              href={geniusData.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-text/60 hover:text-ink-blue transition-colors"
            >
              <Instagram className="w-6 h-6" />
            </a>
          )}
          {geniusData.facebook && (
            <a
              href={geniusData.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-text/60 hover:text-ink-blue transition-colors"
            >
              <Facebook className="w-6 h-6" />
            </a>
          )}
          {geniusData.tiktok && (
            <a
              href={geniusData.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="text-text/60 hover:text-ink-blue transition-colors"
            >
              <Video className="w-6 h-6" />
            </a>
          )}
        </div>
      </div>
    </section>
  );

  const portfolioSection = (
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
                        loading="lazy"
                        decoding="async"
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
  const reviewsSection = (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <h2 className="font-heading text-xl sm:text-2xl font-bold">⭐ VALORACIONES DEL GENIO</h2>
              <div className="flex items-center">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < Math.floor(ratingStats.average) ? 'text-primary' : 'text-gray-300'}`}
                      fill={i < Math.floor(ratingStats.average) ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm sm:text-base text-text/60 whitespace-nowrap">
                  {ratingSummary(ratingStats.average, ratingStats.count, 'valoración', 'valoraciones')}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowReviewModal(true)}
              className="text-primary hover:text-primary-dark transition-colors text-sm sm:text-base text-left lg:text-right whitespace-nowrap"
            >
              🔽 Ver más comentarios
            </button>
          </div>

          {/* Rating Distribution */}
          {ratingStats.count > 0 && (
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
                          width: `${ratingStats.count > 0 
                            ? (ratingStats.distribution[rating as keyof typeof ratingStats.distribution] / ratingStats.count) * 100 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-text/60 w-6 text-right">
                      {ratingStats.distribution[rating as keyof typeof ratingStats.distribution]}
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
                      {new Date(review.service_date ?? review.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="flex items-start space-x-4 pr-16">
                    {/* User profile photo */}
                    <div className="flex-shrink-0">
                      {review.reviewer_photo ? (
                        <img
                          src={review.reviewer_photo}
                          alt={review.reviewer_name}
                          loading="lazy"
                          decoding="async"
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-surface-blue border-2 border-white shadow-sm flex items-center justify-center">
                          <span className="font-heading font-bold text-ink-blue">
                            {review.reviewer_name.trim().charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      {/* User name and stars in same line */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <h4 className="font-semibold text-text text-base sm:text-lg">{review.reviewer_name}</h4>
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
                                loading="lazy"
                                decoding="async"
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
                🧾 TODAS LAS VALORACIONES ({ratingStats.count})
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
                        {new Date(review.service_date ?? review.created_at).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="flex items-start space-x-4 pr-16">
                      {/* User profile photo */}
                      <div className="flex-shrink-0">
                        {review.reviewer_photo ? (
                          <img
                            src={review.reviewer_photo}
                            alt={review.reviewer_name}
                            loading="lazy"
                            decoding="async"
                            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-surface-blue border-2 border-white shadow-sm flex items-center justify-center">
                            <span className="font-heading font-bold text-lg text-ink-blue">
                              {review.reviewer_name.trim().charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        {/* User name and stars in same line */}
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-text text-xl">{review.reviewer_name}</h4>
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
                                  loading="lazy"
                                  decoding="async"
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

  if (isLoadingGenius) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-16 flex flex-col items-center animate-pulse">
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-gray-100 mb-6" />
          <div className="h-8 w-64 bg-gray-100 rounded mb-3" />
          <div className="h-4 w-40 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (loadError || !genius) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="container mx-auto px-4 py-20 text-center max-w-md">
          <h1 className="font-heading text-2xl font-bold text-text mb-3">
            {loadError ? 'No pudimos cargar este perfil' : 'Este perfil no está disponible'}
          </h1>
          <p className="text-text/60 mb-8">
            {loadError
              ? 'Revisa tu conexión e inténtalo de nuevo.'
              : 'Puede que el genio haya quitado su perfil o que aún no esté publicado.'}
          </p>
          <Link
            to="/categories"
            className="inline-flex items-center bg-primary text-text px-6 py-2.5 rounded-full hover:bg-primary-dark transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Volver a categorías
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      {heroSection}
      {aboutSection}
      {portfolio.length > 0 && portfolioSection}
      {reviewsSection}
      <GeniusPeerReviews reviewedGeniusId={id || ''} />

      {/* WhatsApp Float Button */}
      <button
        onClick={handleContactClick}
        className="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:bg-[#128C7E] transition-colors"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="profile"
        targetId={geniusData.id}
        geniusProfileId={geniusData.id}
        targetLabel={geniusData.name}
      />
    </div>
  );
};

export default Profile;