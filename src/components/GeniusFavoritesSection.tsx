import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search, Star, MessageSquare, ExternalLink, Loader2 } from 'lucide-react';
import { getCurrentUser } from '../utils/authUtils';
import { getUserFavorites, removeFromFavorites, FavoriteGenius } from '../utils/favoritesUtils';

const GeniusFavoritesSection: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteGenius[]>([]);
  const [filtered, setFiltered] = useState<FavoriteGenius[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const currentUser = getCurrentUser();

  const loadFavorites = useCallback(async () => {
    if (!currentUser) { setLoading(false); return; }
    setLoading(true);
    const data = await getUserFavorites(currentUser.id);
    setFavorites(data);
    setFiltered(data);
    setLoading(false);
  }, [currentUser?.id]);

  useEffect(() => { loadFavorites(); }, [loadFavorites]);

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (currentUser && e.detail.userId === currentUser.id) loadFavorites();
    };
    window.addEventListener('favoritesChanged', handler as EventListener);
    return () => window.removeEventListener('favoritesChanged', handler as EventListener);
  }, [loadFavorites, currentUser?.id]);

  useEffect(() => {
    if (!query.trim()) {
      setFiltered(favorites);
    } else {
      const q = query.toLowerCase();
      setFiltered(
        favorites.filter(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            f.category.toLowerCase().includes(q) ||
            f.subcategory.toLowerCase().includes(q)
        )
      );
    }
  }, [query, favorites]);

  const handleRemove = async (geniusId: string) => {
    if (!currentUser) return;
    setRemovingId(geniusId);
    await removeFromFavorites(currentUser.id, geniusId);
    setRemovingId(null);
  };

  const handleWhatsApp = (e: React.MouseEvent, phone: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    const msg = encodeURIComponent(`Hola ${name}, te encontré en Genius y me gustaría contratarte.`);
    window.open(`https://wa.me/51${phone.replace(/\s/g, '')}?text=${msg}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Genios Favoritos</h1>
        <p className="text-gray-500 text-sm">
          {favorites.length === 0
            ? 'Aún no has guardado ningún genio favorito'
            : `${favorites.length} genio${favorites.length !== 1 ? 's' : ''} guardado${favorites.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {favorites.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, categoría..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
          />
        </div>
      )}

      {favorites.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-red-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No tienes favoritos aún</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
            Explora perfiles de otros genios y guarda los que más te interesen para acceder rápidamente.
          </p>
          <Link
            to="/categories"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Explorar Genios
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Search className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Sin resultados para "{query}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((genius) => (
            <div
              key={genius.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
            >
              {/* Card image */}
              <div className="relative">
                <img
                  src={genius.image}
                  alt={genius.name}
                  className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Remove button */}
                <button
                  onClick={() => handleRemove(genius.id)}
                  disabled={removingId === genius.id}
                  className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full shadow flex items-center justify-center hover:bg-red-50 border border-white transition-colors"
                  title="Quitar de favoritos"
                >
                  {removingId === genius.id ? (
                    <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                  ) : (
                    <Heart className="w-4 h-4 text-red-500 fill-current" />
                  )}
                </button>
                {/* Availability badge */}
                <div className="absolute bottom-3 left-3">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      genius.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {genius.available ? '● Disponible' : '● No disponible'}
                  </span>
                </div>
              </div>

              {/* Card info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-0.5 truncate">{genius.name}</h3>
                <p className="text-gray-500 text-xs mb-2 truncate">{genius.subcategory}</p>

                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < Math.floor(genius.rating) ? 'text-amber-400' : 'text-gray-200'}`}
                      fill={i < Math.floor(genius.rating) ? 'currentColor' : 'none'}
                    />
                  ))}
                  <span className="text-xs text-gray-400 ml-1">({genius.rating})</span>
                </div>

                <div className="flex gap-2">
                  <Link
                    to={`/profile/${genius.id}`}
                    className="flex-1 text-center text-xs font-medium py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Ver perfil
                  </Link>
                  <button
                    onClick={(e) => handleWhatsApp(e, genius.phone, genius.name)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Contactar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GeniusFavoritesSection;
