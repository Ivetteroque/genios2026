import { supabase } from '../lib/supabase';

/** Números del inicio del genio (migración 20261119120000_genio_panel.sql). */
export interface GeniusStats {
  profile_views: number;
  whatsapp_clicks: number;
  favorites: number;
  reviews_count: number;
  rating_avg: number | null;
}

export const getMyGeniusStats = async (): Promise<GeniusStats | null> => {
  const { data, error } = await supabase.rpc('my_genius_stats');
  if (error) {
    console.error('Error cargando estadísticas del genio:', error);
    return null;
  }
  return (data as GeniusStats | null) ?? null;
};

/** Enlace público del perfil, para compartir. */
export const publicProfileUrl = (geniusId: string) => `${window.location.origin}/profile/${geniusId}`;

/**
 * Comparte el perfil: en el celular abre el menú nativo de compartir
 * (WhatsApp, Instagram, etc.); si no existe, abre WhatsApp con el mensaje.
 */
export const shareProfile = async (geniusId: string, text: string) => {
  const url = publicProfileUrl(geniusId);
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Mi perfil en Genios', text, url });
      return;
    } catch {
      // La persona cerró el menú: no hacemos nada más.
      return;
    }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank', 'noopener');
};
