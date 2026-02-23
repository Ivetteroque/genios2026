// Favorites utility functions

export interface FavoriteGenius {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  image: string;
  rating: number;
  available: boolean;
  phone: string;
  addedAt: string;
}

// Get user's favorites from localStorage
export const getUserFavorites = (userId: string): FavoriteGenius[] => {
  try {
    const favorites = localStorage.getItem(`favorites_${userId}`);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Error loading favorites:', error);
    return [];
  }
};

// Save user's favorites to localStorage
export const saveUserFavorites = (userId: string, favorites: FavoriteGenius[]): void => {
  try {
    localStorage.setItem(`favorites_${userId}`, JSON.stringify(favorites));
    
    // Dispatch event to notify components of favorites change
    window.dispatchEvent(new CustomEvent('favoritesChanged', { 
      detail: { userId, favorites } 
    }));
  } catch (error) {
    console.error('Error saving favorites:', error);
  }
};

// Check if genius is in user's favorites
export const isGeniusFavorite = (userId: string, geniusId: string): boolean => {
  const favorites = getUserFavorites(userId);
  return favorites.some(fav => fav.id === geniusId);
};

// Add genius to favorites
export const addToFavorites = (userId: string, genius: FavoriteGenius): boolean => {
  try {
    const favorites = getUserFavorites(userId);
    
    // Check if already in favorites
    if (favorites.some(fav => fav.id === genius.id)) {
      return false; // Already in favorites
    }
    
    const newFavorite = {
      ...genius,
      addedAt: new Date().toISOString()
    };
    
    const updatedFavorites = [...favorites, newFavorite];
    saveUserFavorites(userId, updatedFavorites);
    
    // Update genius stats
    try {
      const { updateGeniusStats, getGeniusById } = require('./geniusUtils');
      const geniusData = getGeniusById(genius.id);
      if (geniusData) {
        updateGeniusStats(genius.id, {
          favoritesCount: geniusData.stats.favoritesCount + 1
        });
      }
    } catch (error) {
      console.error('Error updating genius favorites stats:', error);
    }

    console.log(`Added ${genius.name} to favorites`);
    return true;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return false;
  }
};

// Remove genius from favorites
export const removeFromFavorites = (userId: string, geniusId: string): boolean => {
  try {
    const favorites = getUserFavorites(userId);
    const updatedFavorites = favorites.filter(fav => fav.id !== geniusId);
    
    if (updatedFavorites.length === favorites.length) {
      return false; // Genius was not in favorites
    }
    
    saveUserFavorites(userId, updatedFavorites);
    
    // Update genius stats
    try {
      const { updateGeniusStats, getGeniusById } = require('./geniusUtils');
      const geniusData = getGeniusById(geniusId);
      if (geniusData) {
        updateGeniusStats(geniusId, {
          favoritesCount: Math.max(0, geniusData.stats.favoritesCount - 1)
        });
      }
    } catch (error) {
      console.error('Error updating genius favorites stats:', error);
    }

    console.log(`Removed genius ${geniusId} from favorites`);
    return true;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return false;
  }
};

// Toggle genius favorite status
export const toggleFavorite = (userId: string, genius: FavoriteGenius): boolean => {
  const isFavorite = isGeniusFavorite(userId, genius.id);
  
  if (isFavorite) {
    return removeFromFavorites(userId, genius.id);
  } else {
    return addToFavorites(userId, genius);
  }
};

// Get favorites count for user
export const getFavoritesCount = (userId: string): number => {
  return getUserFavorites(userId).length;
};

// Clear all favorites for user
export const clearAllFavorites = (userId: string): void => {
  try {
    localStorage.removeItem(`favorites_${userId}`);
    
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('favoritesChanged', { 
      detail: { userId, favorites: [] } 
    }));
    
    console.log(`Cleared all favorites for user ${userId}`);
  } catch (error) {
    console.error('Error clearing favorites:', error);
  }
};

// Export favorites data
export const exportFavorites = (userId: string): void => {
  const favorites = getUserFavorites(userId);
  
  const exportData = {
    userId,
    favorites,
    exportedAt: new Date().toISOString(),
    totalCount: favorites.length
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `mis_favoritos_${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

// Get recently added favorites
export const getRecentFavorites = (userId: string, limit: number = 5): FavoriteGenius[] => {
  const favorites = getUserFavorites(userId);
  return favorites
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    .slice(0, limit);
};

// Search favorites
export const searchFavorites = (userId: string, query: string): FavoriteGenius[] => {
  const favorites = getUserFavorites(userId);
  const lowercaseQuery = query.toLowerCase();
  
  return favorites.filter(fav =>
    fav.name.toLowerCase().includes(lowercaseQuery) ||
    fav.category.toLowerCase().includes(lowercaseQuery) ||
    fav.subcategory.toLowerCase().includes(lowercaseQuery)
  );
};