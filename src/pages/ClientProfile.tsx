import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, MapPin, Mail, Phone, CreditCard as Edit, Lock, Star, Heart, MessageSquare, LogOut, Calendar, CheckCircle, X, Camera, ChevronRight } from 'lucide-react';
import { formatDateToSpanish, getFirstName } from '../utils/commonUtils';
import { getCurrentUser, logout, updateUser } from '../utils/authUtils';
import { getUserFavorites, FavoriteGenius } from '../utils/favoritesUtils';
import { getReviewsByClient, Review as ReviewType } from '../utils/reviewUtils';
import EditProfileModal from '../components/EditProfileModal';
import { handleWhatsAppContact } from '../utils/whatsappUtils';

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
    if (!currentUser) {
      window.location.href = '/';
      return;
    }
    loadFavorites();
    loadClientReviews();
  }, [currentUser]);

  useEffect(() => {
    const handleFavoritesChange = (event: CustomEvent) => {
      if (currentUser && event.detail.userId === currentUser.id) loadFavorites();
    };
    window.addEventListener('favoritesChanged', handleFavoritesChange as EventListener);
    return () => window.removeEventListener('favoritesChanged', handleFavoritesChange as EventListener);
  }, [currentUser]);

  useEffect(() => {
    window.addEventListener('reviewsChanged', loadClientReviews);
    return () => window.removeEventListener('reviewsChanged', loadClientReviews);
  }, [currentUser]);

  const loadFavorites = async () => {
    if (currentUser) {
      const favorites = await getUserFavorites(currentUser.id);
      setFavoriteGenios(favorites);
    }
  };

  const loadClientReviews = () => {
    if (currentUser) {
      setClientReviews(getReviewsByClient(currentUser.id));
    }
  };

  const getGeniusName = (geniusId: string): string => {
    const geniusNames: Record<string, string> = {
      'carla-maquilladora': 'Carla Maquilladora',
      '1': 'Ana Estilista', '2': 'Luis Técnico', '3': 'Sofía Nutricionista',
      '4': 'Diego Desarrollador', '5': 'Carmen Limpieza', '6': 'Roberto DJ',
      '7': 'María Diseñadora', '8': 'Carlos Gasfitero',
    };
    return geniusNames[geniusId] || `Genio ${geniusId}`;
  };

  const handleLogout = () => {
    if (window.confirm('¿Cerrar sesión?')) logout();
  };

  const handleSaveProfile = async (updatedData: any) => {
    if (!currentUser) return;
    setIsSavingProfile(true);
    try {
      const success = updateUser(currentUser.id, updatedData);
      if (success) setCurrentUser({ ...currentUser, ...updatedData });
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (!currentUser) return null;

  const firstName = getFirstName(currentUser.name);
  const visibleReviews = clientReviews.slice(0, 3);

  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      <div className="container mx-auto px-4 max-w-2xl space-y-6">

        {/* Welcome card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.profileImage || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400'}
              alt={currentUser.name}
              className="w-14 h-14 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h1 className="font-heading text-lg font-semibold text-text">
                Hola, {firstName}
              </h1>
              <p className="text-sm text-text/45 mt-0.5">
                Encuentra, guarda y califica a tus genios favoritos.
              </p>
            </div>
          </div>

          {/* User meta */}
          <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-2 gap-y-2.5 gap-x-4">
            {[
              { icon: Mail, label: currentUser.email },
              { icon: Phone, label: `+51 ${currentUser.phone || '999 123 456'}` },
              { icon: MapPin, label: 'Tacna' },
              { icon: Calendar, label: `Desde ${formatDateToSpanish(currentUser.registeredAt, { month: 'long', year: 'numeric' })}` },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-xs text-text/50 min-w-0">
                <Icon className="w-3.5 h-3.5 flex-shrink-0 text-text/30" />
                <span className="truncate">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm text-text/70 bg-white border border-gray-200 hover:border-gray-300 hover:text-text transition-colors shadow-sm"
          >
            <Edit className="w-3.5 h-3.5" />
            Editar datos
          </button>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm text-text/70 bg-white border border-gray-200 hover:border-gray-300 hover:text-text transition-colors shadow-sm"
          >
            <Lock className="w-3.5 h-3.5" />
            Contraseña
          </button>
          <Link
            to="/categories"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm text-text/70 bg-white border border-gray-200 hover:border-gray-300 hover:text-text transition-colors shadow-sm"
          >
            <Heart className="w-3.5 h-3.5" />
            Ver favoritos
          </Link>
        </div>

        {/* Favorites */}
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-heading text-base font-semibold text-text">Tus genios favoritos</h2>
            {favoriteGenios.length > 0 && (
              <span className="text-xs text-text/35">{favoriteGenios.length}</span>
            )}
          </div>

          {favoriteGenios.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {favoriteGenios.map((genius) => (
                <Link
                  key={genius.id}
                  to={`/profile/${genius.id}`}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
                >
                  <div className="relative">
                    <img
                      src={genius.image}
                      alt={genius.name}
                      className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className={`absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      genius.available ? 'bg-white/90 text-green-700' : 'bg-white/90 text-red-600'
                    }`}>
                      {genius.available ? '● Disponible' : '● Ocupado'}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-text truncate leading-tight">{genius.name}</p>
                    <p className="text-xs text-text/40 truncate mb-1.5">{genius.subcategory}</p>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.floor(genius.rating) ? 'text-amber-400' : 'text-gray-200'}`} fill={i < Math.floor(genius.rating) ? 'currentColor' : 'none'} />
                      ))}
                      <span className="text-[10px] text-text/35 ml-1">{genius.rating}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 py-10 text-center">
              <Heart className="w-8 h-8 mx-auto mb-3 text-text/15" />
              <p className="text-sm text-text/40 mb-4">Aún no tienes favoritos</p>
              <Link to="/categories" className="text-xs font-medium text-text/60 hover:text-text underline underline-offset-2 transition-colors">
                Explorar genios
              </Link>
            </div>
          )}
        </div>

        {/* Reviews */}
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-heading text-base font-semibold text-text">Tus calificaciones</h2>
            {clientReviews.length > 3 && (
              <button
                onClick={() => setShowAllReviews(true)}
                className="text-xs text-text/40 hover:text-text/70 transition-colors flex items-center gap-0.5"
              >
                Ver todas <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {clientReviews.length > 0 ? (
            <div className="divide-y divide-gray-100 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {visibleReviews.map((review) => (
                <div key={review.id} className="flex gap-3 px-4 py-4">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center">
                    <User className="w-4 h-4 text-text/30" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-text">{getGeniusName(review.geniusId)}</span>
                      <span className="text-xs text-text/30">
                        {new Date(review.serviceDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 mb-1.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-amber-400' : 'text-gray-200'}`} fill={i < review.rating ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                    <p className="text-xs text-text/55 leading-relaxed">"{review.comment}"</p>
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {review.images.slice(0, 3).map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt=""
                            onClick={() => setSelectedImage(img)}
                            className="w-10 h-10 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 py-10 text-center">
              <Star className="w-8 h-8 mx-auto mb-3 text-text/15" />
              <p className="text-sm text-text/40 mb-4">Aún no has calificado a ningún genio</p>
              <Link to="/categories" className="text-xs font-medium text-text/60 hover:text-text underline underline-offset-2 transition-colors">
                Explorar genios
              </Link>
            </div>
          )}
        </div>

        {/* Support */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text">Necesitas ayuda</p>
            <p className="text-xs text-text/40 mt-0.5">Estamos a un mensaje de distancia.</p>
          </div>
          <button
            onClick={() => setShowSupportModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-text bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Conversemos
          </button>
        </div>

        {/* Logout */}
        <div className="text-center pt-2 pb-4">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-sm text-text/35 hover:text-text/60 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* All Reviews Modal */}
      {showAllReviews && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-heading text-base font-semibold text-text">
                Calificaciones ({clientReviews.length})
              </h3>
              <button onClick={() => setShowAllReviews(false)} className="text-text/40 hover:text-text transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {clientReviews.map((review) => (
                <div key={review.id} className="flex gap-3 px-5 py-4">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center">
                    <User className="w-4 h-4 text-text/30" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-text">{getGeniusName(review.geniusId)}</span>
                      <span className="text-xs text-text/30">
                        {new Date(review.serviceDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 mb-1.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-amber-400' : 'text-gray-200'}`} fill={i < review.rating ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                    <p className="text-xs text-text/55 leading-relaxed">"{review.comment}"</p>
                    {review.images && review.images.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {review.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt=""
                            onClick={() => setSelectedImage(img)}
                            className="w-12 h-12 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Image lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
          <button onClick={() => setSelectedImage(null)} className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        currentUser={currentUser}
        onSave={handleSaveProfile}
      />

      {/* Password modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center">
            <Lock className="w-8 h-8 mx-auto mb-3 text-text/25" />
            <h3 className="font-heading text-base font-semibold text-text mb-2">Cambiar contraseña</h3>
            <p className="text-sm text-text/45 mb-5">Esta funcionalidad estará disponible próximamente.</p>
            <button
              onClick={() => setShowPasswordModal(false)}
              className="px-6 py-2.5 bg-text text-white text-sm font-medium rounded-full hover:bg-text/85 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Support modal */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center">
            <MessageSquare className="w-8 h-8 mx-auto mb-3 text-text/25" />
            <h3 className="font-heading text-base font-semibold text-text mb-2">Contactar soporte</h3>
            <p className="text-sm text-text/45 mb-5">Esta funcionalidad estará disponible próximamente.</p>
            <button
              onClick={() => setShowSupportModal(false)}
              className="px-6 py-2.5 bg-text text-white text-sm font-medium rounded-full hover:bg-text/85 transition-colors"
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
