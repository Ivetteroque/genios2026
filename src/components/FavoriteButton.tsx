import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { getCurrentUser } from '../utils/authUtils';
import { 
  isGeniusFavorite, 
  toggleFavorite, 
  FavoriteGenius 
} from '../utils/favoritesUtils';

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

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ 
  genius, 
  className = '', 
  size = 'md',
  showTooltip = true 
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showTooltipText, setShowTooltipText] = useState(false);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'w-8 h-8',
      icon: 'w-4 h-4',
      tooltip: 'text-xs'
    },
    md: {
      container: 'w-10 h-10',
      icon: 'w-5 h-5',
      tooltip: 'text-sm'
    },
    lg: {
      container: 'w-12 h-12',
      icon: 'w-6 h-6',
      tooltip: 'text-base'
    }
  };

  const config = sizeConfig[size];

  // Check if genius is in favorites when component mounts or user changes
  useEffect(() => {
    if (currentUser) {
      setIsFavorite(isGeniusFavorite(currentUser.id, genius.id));
    }
  }, [currentUser, genius.id]);

  // Listen for auth state changes
  useEffect(() => {
    const handleAuthChange = () => {
      const user = getCurrentUser();
      setCurrentUser(user);
      if (user) {
        setIsFavorite(isGeniusFavorite(user.id, genius.id));
      } else {
        setIsFavorite(false);
      }
    };

    window.addEventListener('authStateChanged', handleAuthChange);
    return () => window.removeEventListener('authStateChanged', handleAuthChange);
  }, [genius.id]);

  // Listen for favorites changes
  useEffect(() => {
    const handleFavoritesChange = (event: CustomEvent) => {
      if (currentUser && event.detail.userId === currentUser.id) {
        setIsFavorite(isGeniusFavorite(currentUser.id, genius.id));
      }
    };

    window.addEventListener('favoritesChanged', handleFavoritesChange as EventListener);
    return () => window.removeEventListener('favoritesChanged', handleFavoritesChange as EventListener);
  }, [currentUser, genius.id]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if user is authenticated
    if (!currentUser) {
      alert('🔐 Inicia sesión para guardar genios favoritos\n\n¡Así podrás encontrarlos fácilmente después!');
      return;
    }

    // Animate the button
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    // Create favorite genius object
    const favoriteGenius: FavoriteGenius = {
      id: genius.id,
      name: genius.name,
      category: genius.category,
      subcategory: genius.subcategory,
      image: genius.image,
      rating: genius.rating,
      available: genius.available,
      addedAt: new Date().toISOString()
    };

    // Toggle favorite status
    const success = toggleFavorite(currentUser.id, favoriteGenius);
    
    if (success) {
      const newIsFavorite = !isFavorite;
      setIsFavorite(newIsFavorite);
      
      // Show feedback message
      if (newIsFavorite) {
        // Show brief success message
        setShowTooltipText(true);
        setTimeout(() => setShowTooltipText(false), 2000);
      }
    }
  };

  const handleMouseEnter = () => {
    if (showTooltip && !showTooltipText) {
      setShowTooltipText(true);
    }
  };

  const handleMouseLeave = () => {
    if (showTooltip) {
      setShowTooltipText(false);
    }
  };

  const getTooltipText = () => {
    if (!currentUser) {
      return 'Inicia sesión para guardar favoritos';
    }
    return isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos';
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`
          ${config.container}
          ${className}
          relative
          bg-white/90 
          backdrop-blur-sm 
          rounded-full 
          shadow-lg 
          hover:shadow-xl 
          border-2 
          ${isFavorite ? 'border-red-200' : 'border-gray-200'}
          hover:border-red-300
          transition-all 
          duration-300 
          flex 
          items-center 
          justify-center
          group
          ${isAnimating ? 'scale-110' : 'hover:scale-105'}
          focus:outline-none 
          focus:ring-2 
          focus:ring-red-300 
          focus:ring-opacity-50
        `}
        aria-label={getTooltipText()}
        title={getTooltipText()}
      >
        <Heart
          className={`
            ${config.icon}
            transition-all 
            duration-300
            ${isFavorite 
              ? 'text-red-500 fill-current' 
              : 'text-gray-400 group-hover:text-red-400'
            }
            ${isAnimating ? 'scale-125' : ''}
          `}
        />
        
        {/* Pulse animation for favorites */}
        {isFavorite && (
          <div className="absolute inset-0 rounded-full bg-red-400 opacity-20 animate-ping"></div>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && showTooltipText && (
        <div className={`
          absolute 
          bottom-full 
          left-1/2 
          transform 
          -translate-x-1/2 
          mb-2 
          px-3 
          py-1 
          bg-gray-800 
          text-white 
          ${config.tooltip}
          rounded-lg 
          whitespace-nowrap 
          z-50
          opacity-0
          animate-in
          fade-in
          slide-in-from-bottom-2
          duration-200
          pointer-events-none
        `}
        style={{
          animation: 'fadeIn 0.2s ease-out forwards'
        }}
        >
          {isFavorite && currentUser ? '❤️ ¡Agregado a favoritos!' : getTooltipText()}
          
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
};

export default FavoriteButton;