// Genius management utility functions

import { SelectedLocation } from '../components/FlexibleLocationSelector';
import { HomeLocation, CoverageType } from './locationUtils';

export interface GeniusTag {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Document {
  id: string;
  name: string;
  type: 'dni' | 'certificate' | 'other';
  url: string;
  uploadedAt: string;
  status: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface GeniusStats {
  profileViews: number;
  whatsappClicks: number;
  favoritesCount: number;
  averageRating: number;
  totalReviews: number;
  servicesCompleted: number;
}

export interface Genius {
  id: string;
  profilePhoto: string;
  fullName: string;
  dni: string;
  email: string;
  phone: string;
  description: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  portfolio: string[];
  category: string;
  subcategories: string[];
  serviceName: string;
  homeLocation?: HomeLocation;
  coverageType?: CoverageType;
  workLocations: SelectedLocation[];
  specialty: string;
  subscriptionDate: string;
  expirationDate: string;
  status: 'active' | 'inactive' | 'suspended';
  tags: GeniusTag[];
  averageRating: number;
  location: string;
  isVerified: boolean;
  isNew: boolean;
  isFeatured: boolean;
  documents: Document[];
  stats: GeniusStats;
  internalNotes: string;
  lastActivity: string;
}

// Get genios from localStorage
export const getGenios = (): Genius[] => {
  try {
    const stored = localStorage.getItem('genios');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading genios:', error);
  }
  return [];
};

// Save genios to localStorage
export const saveGenios = (genios: Genius[]): void => {
  try {
    localStorage.setItem('genios', JSON.stringify(genios));
    
    // Dispatch event to notify components of genius changes
    window.dispatchEvent(new CustomEvent('geniosChanged', { detail: genios }));
  } catch (error) {
    console.error('Error saving genios:', error);
  }
};

// Get genius by ID
export const getGeniusById = (id: string): Genius | null => {
  const genios = getGenios();
  return genios.find(genius => genius.id === id) || null;
};

// Update genius
export const updateGenius = (geniusId: string, updates: Partial<Genius>): void => {
  const genios = getGenios();
  const updatedGenios = genios.map(genius => 
    genius.id === geniusId ? { ...genius, ...updates } : genius
  );
  
  saveGenios(updatedGenios);
};

// Add tag to genius
export const addTagToGenius = (geniusId: string, tag: GeniusTag): void => {
  const genios = getGenios();
  const updatedGenios = genios.map(genius => {
    if (genius.id === geniusId) {
      const existingTagIds = genius.tags.map(t => t.id);
      if (!existingTagIds.includes(tag.id)) {
        return { ...genius, tags: [...genius.tags, tag] };
      }
    }
    return genius;
  });
  
  saveGenios(updatedGenios);
};

// Remove tag from genius
export const removeTagFromGenius = (geniusId: string, tagId: string): void => {
  const genios = getGenios();
  const updatedGenios = genios.map(genius => 
    genius.id === geniusId 
      ? { ...genius, tags: genius.tags.filter(tag => tag.id !== tagId) }
      : genius
  );
  
  saveGenios(updatedGenios);
};

// Update genius status
export const updateGeniusStatus = (geniusId: string, status: 'active' | 'inactive' | 'suspended'): void => {
  updateGenius(geniusId, { status });
};

// Mark genius as new
export const markGeniusAsNew = (geniusId: string, isNew: boolean): void => {
  updateGenius(geniusId, { isNew });
};

// Mark genius as featured
export const markGeniusAsFeatured = (geniusId: string, isFeatured: boolean): void => {
  updateGenius(geniusId, { isFeatured });
};

// Update genius internal notes
export const updateGeniusInternalNotes = (geniusId: string, notes: string): void => {
  updateGenius(geniusId, { internalNotes: notes });
};

// Add document to genius
export const addDocumentToGenius = (geniusId: string, document: Omit<Document, 'id'>): void => {
  const genios = getGenios();
  const updatedGenios = genios.map(genius => {
    if (genius.id === geniusId) {
      const newDocument: Document = {
        ...document,
        id: Date.now().toString(),
        status: 'pending'
      };
      return { ...genius, documents: [...genius.documents, newDocument] };
    }
    return genius;
  });
  
  saveGenios(updatedGenios);
};

// Remove document from genius
export const removeDocumentFromGenius = (geniusId: string, documentId: string): void => {
  const genios = getGenios();
  const updatedGenios = genios.map(genius => 
    genius.id === geniusId 
      ? { ...genius, documents: genius.documents.filter(doc => doc.id !== documentId) }
      : genius
  );
  
  saveGenios(updatedGenios);
};

// Update document status
export const updateGeniusDocumentStatus = (
  geniusId: string, 
  documentId: string, 
  newStatus: 'pending' | 'verified' | 'rejected',
  rejectionReason?: string,
  reviewedBy?: string
): void => {
  const genios = getGenios();
  const updatedGenios = genios.map(genius => {
    if (genius.id === geniusId) {
      return {
        ...genius,
        documents: genius.documents.map(doc =>
          doc.id === documentId ? { 
            ...doc, 
            status: newStatus,
            rejectionReason: newStatus === 'rejected' ? rejectionReason : undefined,
            reviewedAt: new Date().toISOString(),
            reviewedBy
          } : doc
        )
      };
    }
    return genius;
  });
  
  saveGenios(updatedGenios);
  
  // Check verification status after document update
  checkGeniusVerificationStatus(geniusId);
};

// Check if genius should be verified based on documents
export const checkGeniusVerificationStatus = (geniusId: string): void => {
  const genius = getGeniusById(geniusId);
  if (!genius) return;

  const dniDoc = genius.documents.find(doc => doc.type === 'dni');
  const cutDoc = genius.documents.find(doc => doc.type === 'certificate');

  // Genius is verified if both DNI and CUT are verified
  const isVerified = dniDoc?.status === 'verified' && cutDoc?.status === 'verified';
  
  updateGenius(geniusId, { isVerified });
  
  console.log(`Genius ${genius.fullName} verification status updated: ${isVerified}`);
};

// Update genius stats
export const updateGeniusStats = (geniusId: string, stats: Partial<GeniusStats>): void => {
  const genios = getGenios();
  const updatedGenios = genios.map(genius => 
    genius.id === geniusId 
      ? { ...genius, stats: { ...genius.stats, ...stats } }
      : genius
  );
  
  saveGenios(updatedGenios);
};

// Get active genios (for public display)
export const getActiveGenios = (): Genius[] => {
  return getGenios().filter(genius => genius.status === 'active');
};

// Get genios by specialty
export const getGeniosBySpecialty = (specialty: string): Genius[] => {
  return getGenios().filter(genius => 
    genius.specialty.toLowerCase().includes(specialty.toLowerCase()) &&
    genius.status === 'active'
  );
};

// Get genios by location
export const getGeniosByLocation = (location: string): Genius[] => {
  return getGenios().filter(genius => 
    genius.location.toLowerCase().includes(location.toLowerCase()) &&
    genius.status === 'active'
  );
};

// Check if genius is new (registered within specified days)
export const isGeniusNew = (genius: Genius, days: number = 30): boolean => {
  if (genius.isNew) return true; // Manual override
  
  const registrationDate = new Date(genius.subscriptionDate);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return registrationDate >= cutoffDate;
};

// Get genios with pending documents
export const getGeniosWithPendingDocuments = (): Genius[] => {
  return getGenios().filter(genius => 
    genius.documents.some(doc => doc.status === 'pending')
  );
};

// Get genios by verification status
export const getGeniosByVerificationStatus = (verified: boolean): Genius[] => {
  return getGenios().filter(genius => genius.isVerified === verified);
};

// Get featured genios
export const getFeaturedGenios = (): Genius[] => {
  return getGenios().filter(genius => genius.isFeatured && genius.status === 'active');
};
// Get expiring subscriptions
export const getExpiringSubscriptions = (days: number = 30): Genius[] => {
  const today = new Date();
  const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
  
  return getGenios().filter(genius => {
    const expirationDate = new Date(genius.expirationDate);
    return expirationDate <= futureDate && expirationDate >= today;
  });
};

// Export genios data
export const exportGeniosData = (format: 'json' | 'csv' = 'json'): void => {
  const genios = getGenios();
  
  if (format === 'json') {
    const dataStr = JSON.stringify(genios, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `genios_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  } else if (format === 'csv') {
    const csvHeaders = [
      'ID', 'Nombre Completo', 'Email', 'Teléfono', 'Especialidad', 
      'Estado', 'Verificado', 'Calificación', 'Ubicación', 
      'Fecha Suscripción', 'Fecha Vencimiento'
    ];
    
    const csvData = genios.map(genius => [
      genius.id,
      genius.fullName,
      genius.email,
      genius.phone,
      genius.specialty,
      genius.status,
      genius.isVerified ? 'Sí' : 'No',
      genius.averageRating,
      genius.location,
      genius.subscriptionDate,
      genius.expirationDate
    ]);
    
    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    const exportFileDefaultName = `genios_${new Date().toISOString().split('T')[0]}.csv`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }
};

// Bulk update genios
export const bulkUpdateGenios = (geniusIds: string[], updates: Partial<Genius>): void => {
  const genios = getGenios();
  const updatedGenios = genios.map(genius => 
    geniusIds.includes(genius.id) ? { ...genius, ...updates } : genius
  );
  
  saveGenios(updatedGenios);
};

// Search genios
export const searchGenios = (query: string): Genius[] => {
  const genios = getGenios();
  const lowercaseQuery = query.toLowerCase();
  
  return genios.filter(genius =>
    genius.fullName.toLowerCase().includes(lowercaseQuery) ||
    genius.email.toLowerCase().includes(lowercaseQuery) ||
    genius.specialty.toLowerCase().includes(lowercaseQuery) ||
    genius.location.toLowerCase().includes(lowercaseQuery)
  );
};

// Get genius statistics
export const getGeniusStatistics = () => {
  const genios = getGenios();
  
  return {
    total: genios.length,
    active: genios.filter(g => g.status === 'active').length,
    inactive: genios.filter(g => g.status === 'inactive').length,
    suspended: genios.filter(g => g.status === 'suspended').length,
    verified: genios.filter(g => g.isVerified).length,
    unverified: genios.filter(g => !g.isVerified).length,
    averageRating: genios.reduce((sum, g) => sum + g.averageRating, 0) / genios.length || 0,
    totalViews: genios.reduce((sum, g) => sum + g.stats.profileViews, 0),
    totalWhatsappClicks: genios.reduce((sum, g) => sum + g.stats.whatsappClicks, 0)
  };
};