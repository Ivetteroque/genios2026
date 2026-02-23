import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  MapPin, 
  Mail, 
  Phone, 
  Edit, 
  Lock, 
  Star, 
  Heart, 
  MessageSquare, 
  ArrowLeft, 
  Home, 
  LogOut,
  ChevronRight,
  Calendar,
  CheckCircle,
  ExternalLink,
  X,
  Camera
} from 'lucide-react';
import { formatDateToSpanish, getFirstName } from '../utils/commonUtils';
import { getCurrentUser, logout, updateUser } from '../utils/authUtils';
import { getUserFavorites, FavoriteGenius } from '../utils/favoritesUtils';
import { getReviewsByClient, Review as ReviewType } from '../utils/reviewUtils';
import EditProfileModal from '../components/EditProfileModal';


const ClientProfile: React.FC = () => {
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [favoriteGenios, setFavoriteGenios] = useState<FavoriteGenius[]>([]);
  const [clientReviews, setClientReviews] = useState<ReviewType[]>([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);


  useEffect(() => {
    // Redirect if not authenticated
    if (!currentUser) {
      window.location.href = '/';
      return;
    }

    // Load user's favorites
    loadFavorites();
    // Load user's reviews
    loadClientReviews();
  }, [currentUser]);

  // Listen for favorites changes
  useEffect(() => {
    const handleFavoritesChange = (event: CustomEvent) => {
      if (currentUser && event.detail.userId === currentUser.id) {
        loadFavorites();
      }
    };

    window.addEventListener('favoritesChanged', handleFavoritesChange as EventListener);
    return () => window.removeEventListener('favoritesChanged', handleFavoritesChange as EventListener);
  }, [currentUser]);

  // Listen for review changes
  useEffect(() => {
    const handleReviewsChange = () => {
      loadClientReviews();
    };

    window.addEventListener('reviewsChanged', handleReviewsChange);
    return () => window.removeEventListener('reviewsChanged', handleReviewsChange);
  }, [currentUser]);
  const loadFavorites = () => {
    if (currentUser) {
      const favorites = getUserFavorites(currentUser.id);
      setFavoriteGenios(favorites);
    }
  };

  const loadClientReviews = () => {
    if (currentUser) {
      const reviews = getReviewsByClient(currentUser.id);
      setClientReviews(reviews);
      console.log(`Loaded ${reviews.length} reviews for client ${currentUser.id}`);
    }
  };

  // Get genius name from review (in a real app, this would be fetched from genius data)
  const getGeniusName = (geniusId: string): string => {
    // Mock genius names based on ID
    const geniusNames: Record<string, string> = {
      'carla-maquilladora': 'Carla Maquilladora',
      '1': 'Ana Estilista',
      '2': 'Luis Técnico',
      '3': 'Sofía Nutricionista',
      '4': 'Diego Desarrollador',
      '5': 'Carmen Limpieza',
      '6': 'Roberto DJ',
      '7': 'María Diseñadora',
      '8': 'Carlos Gasfitero'
    };
    return geniusNames[geniusId] || `Genio ${geniusId}`;
  };
  const handleLogout = () => {
    const confirmLogout = window.confirm('¿Estás seguro de que quieres cerrar sesión?');
    if (confirmLogout) {
      logout();
      alert('¡Hasta pronto!\n\nHas cerrado sesión exitosamente.');
    }
  };

  const handleSaveProfile = async (updatedData: any) => {
    if (!currentUser) return;

    setIsSavingProfile(true);

    try {
      // Update user data
      const success = updateUser(currentUser.id, updatedData);
      
      if (success) {
        // Update local state
        setCurrentUser({ ...currentUser, ...updatedData });
        
        // Show success message
        alert('✅ ¡Perfil actualizado exitosamente!\n\nTus cambios se han guardado correctamente.');
      } else {
        alert('❌ Error al actualizar el perfil. Por favor, intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('❌ Error al guardar los cambios. Por favor, intenta nuevamente.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const formatMemberSince = (dateString: string) => {
    return formatDateToSpanish(dateString, { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  if (!currentUser) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            {/* Profile Photo */}
            <img
              src={currentUser.profileImage || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'}
              alt={currentUser.name}
              className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-primary/20 shadow-md"
            />
            
            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-text mb-2">
                🧑‍🦱 Hola {currentUser.name}
              </h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-text/70">
                <div className="flex items-center justify-center md:justify-start">
                  <span className="text-lg mr-2">🪪</span>
                  <span style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    DNI: {currentUser.dni || '12345678'}
                  </span>
                </div>
                
                <div className="flex items-center justify-center md:justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    Miembro desde: {formatMemberSince(currentUser.registeredAt)}
                  </span>
                </div>
                
                <div className="flex items-center justify-center md:justify-start">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span style={{ fontFamily: 'Open Sans, sans-serif' }}>
                     Zona: Tacna
                  </span>
                </div>
                
                <div className="flex items-center justify-center md:justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  <span style={{ fontFamily: 'Open Sans, sans-serif' }}>
                    📧 {currentUser.email}
                  </span>
                </div>
                
                <div className="flex items-center justify-center md:justify-start md:col-span-2">
                  <Phone className="w-4 h-4 mr-2" />
                  <span style={{ fontFamily: 'Open Sans, sans-serif' }}>
                     +51 {currentUser.phone || '999 123 456'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Settings Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center justify-center space-x-3 bg-secondary/10 hover:bg-secondary/20 text-text p-4 rounded-xl transition-colors border border-secondary/20"
              style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
            >
              <Edit className="w-5 h-5" />
              <span> Editar mis datos</span>
            </button>
            
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center justify-center space-x-3 bg-primary/10 hover:bg-primary/20 text-text p-4 rounded-xl transition-colors border border-primary/20"
              style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
            >
              <Lock className="w-5 h-5" />
              <span> Cambiar contraseña</span>
            </button>
          </div>
        </div>

        {/* Client Reviews Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="font-heading text-xl font-bold text-text mb-4 text-center">
            ════════ ⭐ Genios Calificados ═════════
          </h2>
          
          {clientReviews.length > 0 ? (
            <>
              <div className="space-y-4 mb-4">
                {clientReviews.slice(0, 2).map((review) => (
                  <div key={review.id} className="p-4 bg-success/5 rounded-xl border border-success/20 hover:shadow-md transition-all duration-300">
                    <div className="relative">
                      {/* Date in top right corner */}
                      <div className="absolute top-0 right-0">
                        <span className="text-xs text-text/50 font-medium bg-white px-2 py-1 rounded-md shadow-sm">
                          {new Date(review.serviceDate).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit'
                          })}
                        </span>
                      </div>

                      <div className="flex items-start space-x-4 pr-16">
                        {/* Genius profile photo placeholder */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-2 border-success/30 shadow-sm">
                            <User className="w-6 h-6 text-success" />
                          </div>
                        </div>

                        {/* Main content */}
                        <div className="flex-1 min-w-0">
                          {/* Genius name and stars in same line */}
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-text text-lg">
                                ✅ {getGeniusName(review.geniusId)}
                              </h4>
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
                                <CheckCircle className="w-4 h-4 text-success" />
                              </div>
                            )}
                          </div>
                          
                          {/* Review comment - aligned with genius name */}
                          <p className="text-text/80 leading-relaxed mb-3 text-sm">
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
                                    className="w-12 h-12 rounded-lg object-cover shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-105 border-2 border-white"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-300"></div>
                                </div>
                              ))}
                              {review.images.length > 3 && (
                                <div 
                                  className="w-12 h-12 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
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
                ))}
              </div>
              
              <button 
                onClick={() => setShowAllReviews(true)}
                className="w-full flex items-center justify-center space-x-2 text-primary hover:text-primary-dark transition-colors p-3 rounded-lg hover:bg-primary/5"
              >
                <ChevronRight className="w-4 h-4" />
                <span style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}>
                  ▶️ Ver todos mis comentarios ({clientReviews.length})
                </span>
              </button>
            </>
          ) : (
            <div className="text-center py-8 text-text/60">
              <Star className="w-12 h-12 mx-auto mb-4 text-text/40" />
              <p className="text-lg font-medium mb-2">Aún no has dejado valoraciones</p>
              <p className="mb-4">Cuando contrates un genio, podrás calificar su trabajo aquí</p>
              <Link 
                to="/categories"
                className="inline-block bg-primary text-white px-6 py-3 rounded-full hover:bg-primary-dark transition-colors"
              >
                Explorar Genios
              </Link>
            </div>
          )}
        </div>

        {/* Favorite Genios Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="font-heading text-xl font-bold text-text mb-4 text-center">
            ════════ 💖 Genios Favoritos ═══════
          </h2>
          
          {favoriteGenios.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {favoriteGenios.map((genius) => (
                <Link
                  key={genius.id}
                  to={`/profile/${genius.id}`}
                  className="bg-secondary/5 rounded-xl border border-secondary/20 p-4 hover:shadow-md hover:bg-secondary/10 transition-all duration-300 group"
                >
                  {/* Genius Image */}
                  <div className="relative mb-3">
                    <img
                      src={genius.image}
                      alt={genius.name}
                      className="w-full aspect-square rounded-lg object-cover border-2 border-secondary/30 group-hover:border-secondary/50 transition-colors"
                    />
                    {/* Favorite Heart Icon */}
                    <div className="absolute top-2 right-2">
                      <Heart className="w-5 h-5 text-secondary fill-current drop-shadow-sm" />
                    </div>
                    {/* Availability Status */}
                    <div className="absolute bottom-2 left-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        genius.available 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {genius.available ? '● Disponible' : '● No disponible'}
                      </span>
                    </div>
                  </div>

                  {/* Genius Info */}
                  <div className="space-y-2">
                    <h3 className="font-heading font-bold text-text text-sm leading-tight group-hover:text-primary transition-colors">
                      {genius.name}
                    </h3>
                    
                    <p className="text-text/60 text-xs">
                      {genius.subcategory}
                    </p>
                    
                    {/* Rating */}
                    <div className="flex items-center space-x-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < Math.floor(genius.rating) ? 'text-primary' : 'text-gray-300'}`}
                            fill={i < Math.floor(genius.rating) ? 'currentColor' : 'none'}
                          />
                        ))}
                      </div>
                      <span className="text-text/60 text-xs">({genius.rating})</span>
                    </div>
                    
                    {/* Phone Number with WhatsApp Icon */}
                    <div 
                      className="flex items-center space-x-2 text-green-600 hover:text-green-700 transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleWhatsAppContact(genius.id, genius.name, genius.category, genius.phone);
                      }}
                      title="Contactar por WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-xs font-medium">
                        +51 {genius.phone}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-text/60">
              <Heart className="w-12 h-12 mx-auto mb-4 text-text/40" />
              <p className="text-lg font-medium mb-2">No tienes genios favoritos aún</p>
              <p className="mb-4">Explora las categorías y marca a tus genios preferidos</p>
              <Link 
                to="/categories"
                className="inline-block bg-primary text-white px-6 py-3 rounded-full hover:bg-primary-dark transition-colors"
              >
                Explorar Genios
              </Link>
            </div>
          )}
        </div>

        {/* Client Reviews Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="font-heading text-xl font-bold text-text mb-4 text-center">
            ════════ 📩 Soporte o Sugerencias ═══════
          </h2>
          
          <div className="text-center">
            <p className="text-text/70 mb-4" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              ¿Tienes dudas o comentarios?
            </p>
            <button
              onClick={() => setShowSupportModal(true)}
              className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-full transition-colors shadow-md flex items-center space-x-2 mx-auto"
              style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
            >
              <MessageSquare className="w-5 h-5" />
              <span>✉️ Enviar mensaje al equipo</span>
            </button>
          </div>
        </div>

        {/* Quick Navigation Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/categories"
              className="flex items-center justify-center space-x-3 bg-primary/10 hover:bg-primary/20 text-text p-4 rounded-xl transition-colors border border-primary/20"
              style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>🔁 Volver a Categorías</span>
            </Link>
            
            <Link
              to="/"
              className="flex items-center justify-center space-x-3 bg-success/10 hover:bg-success/20 text-text p-4 rounded-xl transition-colors border border-success/20"
              style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
            >
              <Home className="w-5 h-5" />
              <span>🏠 Inicio – Ir a la Portada</span>
            </Link>
          </div>
        </div>

        {/* Logout Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="text-center">
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full transition-colors shadow-md flex items-center space-x-2 mx-auto"
              style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
            >
              <LogOut className="w-5 h-5" />
              <span>🔓 Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* All Reviews Modal */}
      {showAllReviews && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
              <h3 className="font-heading text-xl font-bold">
                🧾 TODOS MIS COMENTARIOS ({clientReviews.length})
              </h3>
              <button
                onClick={() => setShowAllReviews(false)}
                className="text-text/60 hover:text-text transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {clientReviews.length > 0 ? clientReviews.map((review) => (
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
                      {/* Genius profile photo placeholder */}
                      <div className="flex-shrink-0">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-2 border-success/30 shadow-sm">
                          <User className="w-7 h-7 text-success" />
                        </div>
                      </div>

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        {/* Genius name and stars in same line */}
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-text text-xl">
                              ✅ {getGeniusName(review.geniusId)}
                            </h4>
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
                              <CheckCircle className="w-5 h-5 text-success" />
                            </div>
                          )}
                        </div>
                        
                        {/* Review comment - aligned with genius name */}
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
                                  <Camera className="w-3 h-3 text-gray-600" />
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
                  <p className="text-lg font-medium mb-2">No has dejado comentarios aún</p>
                  <p>Cuando contrates un genio, podrás calificar su trabajo aquí.</p>
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
      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        currentUser={currentUser}
        onSave={handleSaveProfile}
      />

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="font-heading text-xl font-bold text-text mb-4 text-center">
              🔒 Cambiar contraseña
            </h3>
            <p className="text-text/60 text-center mb-6" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Esta funcionalidad estará disponible próximamente.
            </p>
            <button
              onClick={() => setShowPasswordModal(false)}
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-full transition-colors"
              style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="font-heading text-xl font-bold text-text mb-4 text-center">
              📩 Contactar Soporte
            </h3>
            <p className="text-text/60 text-center mb-6" style={{ fontFamily: 'Open Sans, sans-serif' }}>
              Esta funcionalidad estará disponible próximamente.
            </p>
            <button
              onClick={() => setShowSupportModal(false)}
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-full transition-colors"
              style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientProfile;