import { supabase } from '../lib/supabase';

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

export const getUserFavorites = async (userId: string): Promise<FavoriteGenius[]> => {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('genius_snapshot, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading favorites:', error);
    return [];
  }

  return (data || []).map((row) => ({
    ...(row.genius_snapshot as Omit<FavoriteGenius, 'addedAt'>),
    addedAt: row.created_at,
  }));
};

export const isGeniusFavorite = async (userId: string, geniusId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('genius_id', geniusId)
    .maybeSingle();

  if (error) return false;
  return data !== null;
};

export const addToFavorites = async (userId: string, genius: FavoriteGenius): Promise<boolean> => {
  const snapshot = {
    id: genius.id,
    name: genius.name,
    category: genius.category,
    subcategory: genius.subcategory,
    image: genius.image,
    rating: genius.rating,
    available: genius.available,
    phone: genius.phone,
  };

  const { error } = await supabase
    .from('user_favorites')
    .insert({ user_id: userId, genius_id: genius.id, genius_snapshot: snapshot });

  if (error) {
    if (error.code === '23505') return false; // already exists
    console.error('Error adding to favorites:', error);
    return false;
  }

  window.dispatchEvent(new CustomEvent('favoritesChanged', { detail: { userId } }));
  return true;
};

export const removeFromFavorites = async (userId: string, geniusId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('genius_id', geniusId);

  if (error) {
    console.error('Error removing from favorites:', error);
    return false;
  }

  window.dispatchEvent(new CustomEvent('favoritesChanged', { detail: { userId } }));
  return true;
};

export const toggleFavorite = async (userId: string, genius: FavoriteGenius): Promise<boolean> => {
  const isFav = await isGeniusFavorite(userId, genius.id);
  if (isFav) {
    return removeFromFavorites(userId, genius.id);
  } else {
    return addToFavorites(userId, genius);
  }
};

export const getFavoritesCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('user_favorites')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) return 0;
  return count ?? 0;
};

export const searchFavorites = async (userId: string, query: string): Promise<FavoriteGenius[]> => {
  const favorites = await getUserFavorites(userId);
  const q = query.toLowerCase();
  return favorites.filter(
    (fav) =>
      fav.name.toLowerCase().includes(q) ||
      fav.category.toLowerCase().includes(q) ||
      fav.subcategory.toLowerCase().includes(q)
  );
};
