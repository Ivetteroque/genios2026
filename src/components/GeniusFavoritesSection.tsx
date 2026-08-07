import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search, Star, MessageSquare, ExternalLink, Loader2, X } from 'lucide-react';
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 text-text/30 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="font-heading text-lg font-semibold text-text">Genios favoritos</h1>
          <p className="text-xs text-text/40 mt-0.5">
            {favorites.length === 0
              ? 'Aún no guardaste ningún genio'
              : `${favorites.length} guardado${favorites.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {favorites.length > 0 && (
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text/30" />
          <input
            type="text"
            placeholder="Buscar por nombre o categoría..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-text/20 focus:border-text/30 bg-white text-text placeholder:text-text/30 transition-colors"
          />
        </div>
      )}

      {favorites.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-14 text-center">
          <Heart className="w-8 h-8 text-text/15 mx-auto mb-3" />
          <p className="text-sm text-text/40 mb-4">No tienes favoritos aún</p>
          <Link
            to="/categories"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-text/55 hover:text-text underline underline-offset-2 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Explorar genios
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-14 text-center">
          <Search className="w-7 h-7 mx-auto mb-3 text-text/20" />
          <p className="text-sm text-text/40">Sin resultados para "{query}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((genius) => (
            <div
              key={genius.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
            >
              <div className="relative">
                <img
                  src={genius.image}
                  alt={genius.name}
                  className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  onClick={() => handleRemove(genius.id)}
                  disabled={removingId === genius.id}
                  className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full shadow-sm flex items-center justify-center hover:bg-red-50 transition-colors"
                  title="Quitar de favoritos"
                >
                  {removingId === genius.id ? (
                    <Loader2 className="w-3.5 h-3.5 text-red-400 animate-spin" />
                  ) : (
                    <X className="w-3 h-3 text-text/40" />
                  )}
                </button>
                <span className={`absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  genius.available ? 'bg-white/90 text-green-700' : 'bg-white/90 text-red-600'
                }`}>
                  {genius.available ? '● Disponible' : '● Ocupado'}
                </span>
              </div>

              <div className="p-3">
                <p className="text-sm font-medium text-text truncate leading-tight">{genius.name}</p>
                <p className="text-xs text-text/40 truncate mb-1.5">{genius.subcategory}</p>
                <div className="flex items-center gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${i < Math.floor(genius.rating) ? 'text-amber-400' : 'text-gray-200'}`}
                      fill={i < Math.floor(genius.rating) ? 'currentColor' : 'none'}
                    />
                  ))}
                  <span className="text-[10px] text-text/35 ml-1">{genius.rating}</span>
                </div>

                <div className="flex gap-1.5">
                  <Link
                    to={`/profile/${genius.id}`}
                    className="flex-1 text-center text-xs font-medium py-1.5 rounded-lg bg-text text-white hover:bg-text/85 transition-colors"
                  >
                    Ver perfil
                  </Link>
                  <button
                    onClick={(e) => handleWhatsApp(e, genius.phone, genius.name)}
                    className="flex items-center justify-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-gray-100 text-text/60 hover:bg-gray-200 transition-colors"
                    title="Contactar por WhatsApp"
                  >
                    <MessageSquare className="w-3 h-3" />
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
