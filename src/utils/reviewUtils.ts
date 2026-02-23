// Review management utility functions

export interface Review {
  id: string;
  geniusId: string;
  clientId: string;
  clientName: string;
  serviceDate: string;
  rating: number;
  comment: string;
  images: string[];
  createdAt: string;
  verified: boolean;
}

export interface GeniusRatingStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

// Get all reviews from localStorage
export const getAllReviews = (): Review[] => {
  try {
    const reviews = localStorage.getItem('reviews');
    return reviews ? JSON.parse(reviews) : [];
  } catch (error) {
    console.error('Error loading reviews:', error);
    return [];
  }
};

// Save reviews to localStorage
export const saveReviews = (reviews: Review[]): void => {
  try {
    localStorage.setItem('reviews', JSON.stringify(reviews));
    
    // Dispatch event to notify components of review changes
    window.dispatchEvent(new CustomEvent('reviewsChanged', { detail: reviews }));
  } catch (error) {
    console.error('Error saving reviews:', error);
  }
};

// Get reviews for a specific genius
export const getReviewsForGenius = (geniusId: string): Review[] => {
  const allReviews = getAllReviews();
  return allReviews
    .filter(review => review.geniusId === geniusId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Calculate rating statistics for a genius
export const calculateGeniusRatingStats = (geniusId: string): GeniusRatingStats => {
  const reviews = getReviewsForGenius(geniusId);
  
  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }

  // Calculate average rating
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = Math.round((totalRating / reviews.length) * 10) / 10; // Round to 1 decimal

  // Calculate rating distribution
  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(review => {
    ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
  });

  return {
    averageRating,
    totalReviews: reviews.length,
    ratingDistribution
  };
};

// Add a new review
export const addReview = (review: Omit<Review, 'id' | 'createdAt'>): Review => {
  const newReview: Review = {
    ...review,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  };

  const allReviews = getAllReviews();
  allReviews.push(newReview);
  saveReviews(allReviews);

  console.log('New review added:', newReview);
  return newReview;
};

// Update a review
export const updateReview = (reviewId: string, updates: Partial<Review>): boolean => {
  const allReviews = getAllReviews();
  const reviewIndex = allReviews.findIndex(review => review.id === reviewId);
  
  if (reviewIndex === -1) {
    return false;
  }

  allReviews[reviewIndex] = { ...allReviews[reviewIndex], ...updates };
  saveReviews(allReviews);
  
  return true;
};

// Delete a review
export const deleteReview = (reviewId: string): boolean => {
  const allReviews = getAllReviews();
  const filteredReviews = allReviews.filter(review => review.id !== reviewId);
  
  if (filteredReviews.length === allReviews.length) {
    return false; // Review not found
  }

  saveReviews(filteredReviews);
  return true;
};

// Get recent reviews (across all genios)
export const getRecentReviews = (limit: number = 10): Review[] => {
  const allReviews = getAllReviews();
  return allReviews
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
};

// Get reviews by client
export const getReviewsByClient = (clientId: string): Review[] => {
  const allReviews = getAllReviews();
  return allReviews
    .filter(review => review.clientId === clientId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Search reviews
export const searchReviews = (query: string): Review[] => {
  const allReviews = getAllReviews();
  const lowercaseQuery = query.toLowerCase();
  
  return allReviews.filter(review =>
    review.clientName.toLowerCase().includes(lowercaseQuery) ||
    review.comment.toLowerCase().includes(lowercaseQuery)
  );
};

// Get top rated genios
export const getTopRatedGenios = (limit: number = 10): Array<{geniusId: string, stats: GeniusRatingStats}> => {
  const allReviews = getAllReviews();
  const geniusIds = [...new Set(allReviews.map(review => review.geniusId))];
  
  const geniusStats = geniusIds.map(geniusId => ({
    geniusId,
    stats: calculateGeniusRatingStats(geniusId)
  }));

  return geniusStats
    .filter(genius => genius.stats.totalReviews >= 3) // Minimum 3 reviews
    .sort((a, b) => b.stats.averageRating - a.stats.averageRating)
    .slice(0, limit);
};

// Export reviews data
export const exportReviewsData = (): void => {
  const allReviews = getAllReviews();
  
  const exportData = {
    reviews: allReviews,
    exportedAt: new Date().toISOString(),
    totalReviews: allReviews.length,
    summary: {
      totalGeniosWithReviews: new Set(allReviews.map(r => r.geniusId)).size,
      averageRatingOverall: allReviews.length > 0 
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length 
        : 0
    }
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `reviews_${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

// Clean up old reviews (keep only last 6 months)
export const cleanupOldReviews = (): number => {
  const allReviews = getAllReviews();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const recentReviews = allReviews.filter(review => 
    new Date(review.createdAt) >= sixMonthsAgo
  );
  
  const removedCount = allReviews.length - recentReviews.length;
  
  if (removedCount > 0) {
    saveReviews(recentReviews);
    console.log(`Cleaned up ${removedCount} old reviews`);
  }
  
  return removedCount;
};

// Validate review data
export const validateReviewData = (review: Partial<Review>): string[] => {
  const errors: string[] = [];
  
  if (!review.geniusId) {
    errors.push('ID del genio es requerido');
  }
  
  if (!review.clientId) {
    errors.push('ID del cliente es requerido');
  }
  
  if (!review.clientName || review.clientName.trim().length === 0) {
    errors.push('Nombre del cliente es requerido');
  }
  
  if (!review.rating || review.rating < 1 || review.rating > 5) {
    errors.push('Calificación debe ser entre 1 y 5 estrellas');
  }
  
  if (!review.comment || review.comment.trim().length === 0) {
    errors.push('Comentario es requerido');
  }
  
  if (review.comment && review.comment.length > 500) {
    errors.push('Comentario no puede exceder 500 caracteres');
  }
  
  if (!review.serviceDate) {
    errors.push('Fecha del servicio es requerida');
  }
  
  return errors;
};