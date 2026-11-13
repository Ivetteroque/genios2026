import { supabase } from '../lib/supabase';
import type { Membership } from './membershipService';

/**
 * Lecturas y acciones del panel admin sobre genios. Todo pasa por la RLS:
 * solo un usuario con `app_metadata.role = admin` puede leer todos los
 * perfiles y cambiar estado, verificación, destacado o notas internas.
 */

export interface AdminGenius {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  profile_photo: string;
  category: string;
  home_location: { districtName?: string; provinceName?: string; departmentName?: string } | null;
  status: 'active' | 'suspended';
  suspension_reason: string;
  verification_status: 'none' | 'pending' | 'verified' | 'rejected';
  verification_note: string;
  verified_at: string | null;
  is_featured: boolean;
  internal_notes: string;
  profile_views: number;
  whatsapp_clicks: number;
  created_at: string;
  /** Datos agregados al leer */
  membership: Membership | null;
  favorites_count: number;
}

export interface GeniusDocument {
  id?: string;
  name: string;
  type: string;
  /** Ruta en el bucket privado o, en documentos antiguos, data-URL base64. */
  url: string;
  uploadedAt?: string;
}

export interface GeniusWithDocuments {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  profile_photo: string;
  verification_status: AdminGenius['verification_status'];
  verification_note: string;
  verified_at: string | null;
  verified_by: string;
  documents: GeniusDocument[];
  updated_at: string;
}

const ADMIN_COLUMNS =
  'id, user_id, full_name, email, phone, profile_photo, category, home_location, status, suspension_reason, ' +
  'verification_status, verification_note, verified_at, is_featured, internal_notes, profile_views, whatsapp_clicks, created_at';

export const listGeniusesForAdmin = async (): Promise<AdminGenius[]> => {
  const [profiles, memberships, favorites] = await Promise.all([
    supabase.from('genius_profiles').select(ADMIN_COLUMNS).order('created_at', { ascending: false }),
    supabase.from('memberships').select('id, genius_profile_id, type, starts_at, ends_at, status, beta_code_id'),
    supabase.from('user_favorites').select('genius_id'),
  ]);

  if (profiles.error) throw profiles.error;

  const membershipByGenius = new Map(
    ((memberships.data ?? []) as Membership[]).map((m) => [m.genius_profile_id, m])
  );
  const favoritesByGenius = new Map<string, number>();
  for (const row of favorites.data ?? []) {
    favoritesByGenius.set(row.genius_id, (favoritesByGenius.get(row.genius_id) ?? 0) + 1);
  }

  return ((profiles.data ?? []) as unknown as Omit<AdminGenius, 'membership' | 'favorites_count'>[]).map((p) => ({
    ...p,
    membership: membershipByGenius.get(p.id) ?? null,
    favorites_count: favoritesByGenius.get(p.id) ?? 0,
  }));
};

type AdminEditableFields = Partial<Pick<AdminGenius,
  'status' | 'suspension_reason' | 'is_featured' | 'internal_notes' | 'verification_status' | 'verification_note'
>> & { suspended_at?: string | null; verified_at?: string | null; verified_by?: string };

export const updateGeniusAsAdmin = async (id: string, patch: AdminEditableFields): Promise<void> => {
  const { error } = await supabase
    .from('genius_profiles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
};

export const suspendGenius = (id: string, reason: string) =>
  updateGeniusAsAdmin(id, { status: 'suspended', suspension_reason: reason, suspended_at: new Date().toISOString() });

export const reactivateGenius = (id: string) =>
  updateGeniusAsAdmin(id, { status: 'active', suspension_reason: '', suspended_at: null });

export const listGeniusesWithDocuments = async (): Promise<GeniusWithDocuments[]> => {
  const { data, error } = await supabase
    .from('genius_profiles')
    .select('id, full_name, email, phone, profile_photo, verification_status, verification_note, verified_at, verified_by, documents, updated_at')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as GeniusWithDocuments[]).filter((g) => Array.isArray(g.documents) && g.documents.length > 0);
};

export const approveVerification = (id: string, adminEmail: string) =>
  updateGeniusAsAdmin(id, {
    verification_status: 'verified',
    verification_note: '',
    verified_at: new Date().toISOString(),
    verified_by: adminEmail,
  });

export const rejectVerification = (id: string, adminEmail: string, reason: string) =>
  updateGeniusAsAdmin(id, {
    verification_status: 'rejected',
    verification_note: reason,
    verified_at: null,
    verified_by: adminEmail,
  });

/** Perfil completo (para la vista previa del admin). */
export const getFullGeniusProfile = async (id: string) => {
  const { data, error } = await supabase.from('genius_profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
};
