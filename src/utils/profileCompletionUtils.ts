interface GeniusProfile {
  profile_photo?: string;
  full_name?: string;
  dni?: string;
  email?: string;
  phone?: string;
  description?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  category?: string;
  subcategories?: any[];
  service_name?: string;
  home_location?: any;
  coverage_type?: string;
  work_locations?: any[];
  portfolio?: any[];
  documents?: any[];
}

export function calculateProfileCompletion(profile: GeniusProfile | null): number {
  if (!profile) return 0;

  const fields = [
    { value: profile.profile_photo, weight: 10 },
    { value: profile.full_name, weight: 10 },
    { value: profile.dni, weight: 5 },
    { value: profile.email, weight: 5 },
    { value: profile.phone, weight: 5 },
    { value: profile.description, weight: 10 },
    { value: profile.category, weight: 10 },
    { value: profile.subcategories && profile.subcategories.length > 0, weight: 10 },
    { value: profile.service_name, weight: 10 },
    { value: profile.home_location, weight: 5 },
    { value: profile.work_locations && profile.work_locations.length > 0, weight: 10 },
    { value: profile.portfolio && profile.portfolio.length > 0, weight: 5 },
    { value: profile.documents && profile.documents.length > 0, weight: 5 },
  ];

  const totalWeight = fields.reduce((sum, field) => sum + field.weight, 0);
  const completedWeight = fields.reduce((sum, field) => {
    return sum + (field.value ? field.weight : 0);
  }, 0);

  return Math.round((completedWeight / totalWeight) * 100);
}

export function getProfileCompletionMessage(percentage: number): string {
  if (percentage === 100) {
    return '¡Tu perfil está completo!';
  } else if (percentage >= 80) {
    return 'Casi listo, completa tu información para destacar.';
  } else if (percentage >= 50) {
    return 'Completa tu información para aparecer en más búsquedas.';
  } else {
    return 'Completa tu información para aparecer en más búsquedas.';
  }
}