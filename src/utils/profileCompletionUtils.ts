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

interface MissingField {
  field: string;
  step: number;
  required: boolean;
}

export function getMissingFields(profile: GeniusProfile | null): MissingField[] {
  if (!profile) return [];

  const missing: MissingField[] = [];

  if (!profile.profile_photo) {
    missing.push({ field: 'Foto de perfil', step: 1, required: true });
  }
  if (!profile.full_name?.trim()) {
    missing.push({ field: 'Nombre completo', step: 1, required: true });
  }
  if (!profile.dni || profile.dni.length !== 8) {
    missing.push({ field: 'DNI', step: 1, required: true });
  }
  if (!profile.email?.trim()) {
    missing.push({ field: 'Email', step: 1, required: true });
  }
  if (!profile.phone || profile.phone.length !== 9) {
    missing.push({ field: 'Teléfono', step: 1, required: true });
  }
  if (!profile.home_location) {
    missing.push({ field: 'Ubicación de residencia', step: 1, required: true });
  }

  if (!profile.description || profile.description.length < 20) {
    missing.push({ field: 'Descripción de tu trabajo', step: 2, required: true });
  }
  if (!profile.instagram?.trim()) {
    missing.push({ field: 'Instagram', step: 2, required: false });
  }
  if (!profile.facebook?.trim()) {
    missing.push({ field: 'Facebook', step: 2, required: false });
  }
  if (!profile.tiktok?.trim()) {
    missing.push({ field: 'TikTok', step: 2, required: false });
  }

  if (!profile.category) {
    missing.push({ field: 'Categoría principal', step: 3, required: true });
  }
  if (!profile.subcategories || profile.subcategories.length === 0) {
    missing.push({ field: 'Subcategorías', step: 3, required: true });
  }
  if (!profile.service_name?.trim()) {
    missing.push({ field: 'Nombre del servicio', step: 3, required: true });
  }

  if (!profile.portfolio || profile.portfolio.length === 0) {
    missing.push({ field: 'Fotos del portafolio', step: 4, required: false });
  }

  if (!profile.documents || !profile.documents.some((doc: any) => doc.type === 'dni')) {
    missing.push({ field: 'Documento de identidad (DNI)', step: 5, required: false });
  }
  if (!profile.documents || !profile.documents.some((doc: any) => doc.type === 'certificate')) {
    missing.push({ field: 'Certificado de trabajo', step: 5, required: false });
  }

  return missing;
}