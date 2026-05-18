import React, { useState, useEffect, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { getCurrentUser } from '../utils/authUtils';
import { isGeniusFavorite, toggleFavorite, FavoriteGenius } from '../utils/favoritesUtils';

interface FavoriteButtonProps {
  genius: {
    id: string;
    name: string;
    category: string;
    subcategory: string;
    image: string;
    rating: number;
    available: boolean;
    phone: string;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const sizeConfig = {
  sm: { container: 'w-8 h-8', icon: 'w-4 h-4', tooltip: 'text-xs' },
  md: { container: 'w-10 h-10', icon: 'w-5 h-5', tooltip: 'text-sm' },
  lg: { container: 'w-12 h-12', icon: 'w-6 h-6', tooltip: 'text-base' },
};

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  genius,
  className = '',
  size = 'md',
  showTooltip = true,
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showTooltipText, setShowTooltipText] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  const config = sizeConfig[size];

  const checkFavoriteStatus = useCallback(async () => {
    if (!currentUser) { setIsFavorite(false); return; }
    const fav = await isGeniusFavorite(currentUser.id, genius.id);
    setIsFavorite(fav);
  }, [currentUser, genius.id]);

  useEffect(() => { checkFavoriteStatus(); }, [checkFavoriteStatus]);

  useEffect(() => {
    const handleAuthChange = () => {
      const user = getCurrentUser();
      setCurrentUser(user);
    };
    window.addEventListener('authStateChanged', handleAuthChange);
    return () => window.removeEventListener('authStateChanged', handleAuthChange);
  }, []);

  useEffect(() => {
    const handleFavoritesChange = (event: CustomEvent) => {
      if (currentUser && event.detail.userId === currentUser.id) {
        checkFavoriteStatus();
      }
    };
    window.addEventListener('favoritesChanged', handleFavoritesChange as EventListener);
    return () => window.removeEventListener('favoritesChanged', handleFavoritesChange as EventListener);
  }, [currentUser, checkFavoriteStatus]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      alert('Inicia sesión para guardar genios favoritos');
      return;
    }

    if (isLoading) return;

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    setIsLoading(true);

    const favoriteGenius: FavoriteGenius = {
      id: genius.id,
      name: genius.name,
      category: genius.category,
      subcategory: genius.subcategory,
      image: genius.image,
      rating: genius.rating,
      available: genius.available,
      phone: genius.phone,
      addedAt: new Date().toISOString(),
    };

    const success = await toggleFavorite(currentUser.id, favoriteGenius);

    if (success) {
      const newIsFavorite = !isFavorite;
      setIsFavorite(newIsFavorite);
      if (newIsFavorite && showTooltip) {
        setShowTooltipText(true);
        setTimeout(() => setShowTooltipText(false), 2000);
      }
    }

    setIsLoading(false);
  };

  const getTooltipText = () => {
    if (!currentUser) return 'Inicia sesión para guardar favoritos';
    return isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos';
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        onMouseEnter={() => showTooltip && !showTooltipText && setShowTooltipText(true)}
        onMouseLeave={() => showTooltip && setShowTooltipText(false)}
        disabled={isLoading}
        className={`
          ${config.container} ${className}
          relative bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl
          border-2 ${isFavorite ? 'border-red-200' : 'border-gray-200'} hover:border-red-300
          transition-all duration-300 flex items-center justify-center group
          ${isAnimating ? 'scale-110' : 'hover:scale-105'}
          focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-opacity-50
          disabled:opacity-60
        `}
        aria-label={getTooltipText()}
      >
        <Heart
          className={`
            ${config.icon} transition-all duration-300
            ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-400 group-hover:text-red-400'}
            ${isAnimating ? 'scale-125' : ''}
          `}
        />
        {isFavorite && (
          <div className="absolute inset-0 rounded-full bg-red-400 opacity-20 animate-ping" />
        )}
      </button>

      {showTooltip && showTooltipText && (
        <div
          className={`
            absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1
            bg-gray-800 text-white ${config.tooltip} rounded-lg whitespace-nowrap z-50 pointer-events-none
          `}
          style={{ animation: 'fadeIn 0.2s ease-out forwards' }}
        >
          {isFavorite && currentUser ? 'Agregado a favoritos' : getTooltipText()}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
        </div>
      )}
    </div>
  );
};

export default FavoriteButton;
