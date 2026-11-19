/** Secciones del panel del genio (barra de navegación). */
export type GenioSection = 'home' | 'profile' | 'agenda' | 'plan';

/** Partes del perfil que se editan por separado (una por pantalla). */
export type ProfilePart = 'photo' | 'contact' | 'about' | 'service' | 'zone' | 'portfolio' | 'identity';

/** Lo que el panel usa del perfil del genio (fila de genius_profiles). */
export interface PanelGeniusProfile {
  id: string;
  profile_photo: string;
  full_name: string;
  dni: string;
  email: string;
  phone: string;
  description: string;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  category: string;
  subcategories: string[];
  service_name: string;
  home_location: {
    departmentId?: string; departmentName?: string;
    provinceId?: string; provinceName?: string;
    districtId?: string; districtName?: string;
  } | null;
  coverage_type: string;
  work_locations: unknown[];
  portfolio: string[];
  documents: { type: string; name: string; url: string; uploadedAt: string; verified: boolean; id?: string }[];
  status?: 'active' | 'suspended';
  suspension_reason?: string;
  verification_status?: 'none' | 'pending' | 'verified' | 'rejected';
  verification_note?: string;
}
