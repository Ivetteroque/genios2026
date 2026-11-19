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

/**
 * Guarda solo los campos de una parte del perfil (p. ej. la foto). La RLS
 * deja al genio editar su propia fila; los campos de admin (estado,
 * verificación, destacado) los protege un trigger en la base.
 */
export const updateMyGeniusProfile = async (geniusId: string, patch: Record<string, unknown>): Promise<void> => {
  const { error } = await supabase
    .from('genius_profiles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', geniusId);
  if (error) throw error;
};

/**
 * Crea (o completa) el perfil del genio al terminar el formulario de alta.
 * Los campos de admin (estado, verificación…) los fija un trigger en la base.
 */
export const createMyGeniusProfile = async (userId: string, fields: Record<string, unknown>): Promise<string> => {
  const { data, error } = await supabase
    .from('genius_profiles')
    .upsert(
      { user_id: userId, ...fields, last_wizard_step: 7, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
};
