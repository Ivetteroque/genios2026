import { supabase } from '../lib/supabase';
import { Genius } from '../utils/geniusUtils';

export interface GeniusProfile {
  id: string;
  user_id: string;
  profile_photo: string;
  full_name: string;
  dni: string;
  email: string;
  phone: string;
  description: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  category: string;
  subcategories: string[];
  service_name: string;
  home_location: any;
  coverage_type: string;
  work_locations: any[];
  portfolio: string[];
  documents: any[];
  created_at: string;
  updated_at: string;
}

export interface GeniusProfileDraft {
  id: string;
  user_id: string;
  current_step: number;
  form_data: any;
  last_saved_at: string;
  created_at: string;
  updated_at: string;
}

export const getGeniusProfile = async (userId: string): Promise<GeniusProfile | null> => {
  const { data, error } = await supabase
    .from('genius_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching genius profile:', error);
    throw error;
  }

  return data;
};

export const saveGeniusProfile = async (
  userId: string,
  profileData: Partial<Genius>,
  completionPercentage?: number,
  lastWizardStep?: number
): Promise<GeniusProfile> => {
  const calculatedCompletion = completionPercentage !== undefined
    ? completionPercentage
    : calculateProfileCompleteness(profileData);

  const profilePayload = {
    user_id: userId,
    profile_photo: profileData.profilePhoto || '',
    full_name: profileData.fullName || '',
    dni: profileData.dni || '',
    email: profileData.email || '',
    phone: profileData.phone || '',
    description: profileData.description || '',
    instagram: profileData.instagram || null,
    facebook: profileData.facebook || null,
    tiktok: profileData.tiktok || null,
    category: profileData.category || '',
    subcategories: profileData.subcategories || [],
    service_name: profileData.serviceName || '',
    home_location: profileData.homeLocation || null,
    coverage_type: profileData.coverageType || 'my-district',
    work_locations: profileData.workLocations || [],
    portfolio: profileData.portfolio || [],
    documents: profileData.documents || [],
    completion_percentage: calculatedCompletion,
    last_wizard_step: lastWizardStep || 6,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('genius_profiles')
    .upsert(profilePayload, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('Error saving genius profile:', error);
    throw error;
  }

  return data;
};

export const saveDraft = async (userId: string, stepNumber: number, formData: any): Promise<void> => {
  const draftPayload = {
    user_id: userId,
    current_step: stepNumber,
    form_data: formData,
    last_saved_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('genius_profile_drafts')
    .upsert(draftPayload, { onConflict: 'user_id' });

  if (error) {
    console.error('Error saving draft:', error);
    throw error;
  }
};

export const loadDraft = async (userId: string): Promise<GeniusProfileDraft | null> => {
  const { data, error } = await supabase
    .from('genius_profile_drafts')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error loading draft:', error);
    throw error;
  }

  return data;
};

export const deleteDraft = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('genius_profile_drafts')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting draft:', error);
    throw error;
  }
};

export const convertGeniusProfileToGenius = (profile: GeniusProfile): Genius => {
  return {
    id: profile.id,
    profilePhoto: profile.profile_photo,
    fullName: profile.full_name,
    dni: profile.dni,
    email: profile.email,
    phone: profile.phone,
    description: profile.description,
    instagram: profile.instagram,
    facebook: profile.facebook,
    tiktok: profile.tiktok,
    category: profile.category,
    subcategories: profile.subcategories,
    serviceName: profile.service_name,
    homeLocation: profile.home_location,
    coverageType: profile.coverage_type,
    workLocations: profile.work_locations,
    portfolio: profile.portfolio,
    documents: profile.documents,
    rating: 0,
    reviews: 0,
    available: true,
    verified: false
  };
};

export const calculateProfileCompleteness = (profileData: Partial<Genius>): number => {
  const requiredFields = [
    profileData.profilePhoto,
    profileData.fullName,
    profileData.dni && profileData.dni.length === 8,
    profileData.email,
    profileData.phone && profileData.phone.length === 9,
    profileData.description && profileData.description.length >= 50,
    profileData.category,
    profileData.subcategories && profileData.subcategories.length > 0,
    profileData.serviceName,
    profileData.homeLocation,
    profileData.portfolio && profileData.portfolio.length > 0,
    profileData.documents && profileData.documents.some(doc => doc.type === 'dni')
  ];

  const completedFields = requiredFields.filter(Boolean).length;
  return Math.round((completedFields / requiredFields.length) * 100);
};
