import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Save, 
  Eye, 
  User, 
  MapPin, 
  Briefcase, 
  Camera, 
  FileText,
  Instagram,
  Facebook,
  Globe,
  Home,
  Plus,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import ImageUploadField from './ImageUploadField';
import MultiImageUploadField from './MultiImageUploadField';
import DocumentUploadField from './DocumentUploadField';
import FlexibleLocationSelector from './FlexibleLocationSelector';
import { Genius, Document, SelectedLocation } from '../utils/geniusUtils';
import { getActiveCategories, Category } from '../utils/categoryUtils';
import { getCurrentUser } from '../utils/authUtils';

interface GeniusProfileEditFormProps {
  initialData: Genius;
  onSave: (updatedData: Genius) => void;
  onPreview: (formData: Genius) => void;
}

type SectionKey = 'personal' | 'about' | 'service' | 'portfolio' | 'documents';

const GeniusProfileEditForm: React.FC<GeniusProfileEditFormProps> = ({
  initialData,
  onSave,
  onPreview
}) => {
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [activeCategories, setActiveCategories] = useState<Category[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    personal: true,
    about: false,
    service: false,
    portfolio: false,
    documents: false
  });
  const [formData, setFormData] = useState<Genius>({
    ...initialData,
    profilePhoto: initialData.profilePhoto || '',
    fullName: initialData.fullName || '',
    dni: initialData.dni || '',
    phone: initialData.phone || '',
    email: initialData.email || '',
    description: initialData.description || '',
    instagram: initialData.instagram || '',
    facebook: initialData.facebook || '',
    tiktok: initialData.tiktok || '',
    portfolio: initialData.portfolio || [],
    category: initialData.category || '',
    subcategories: initialData.subcategories || [],
    serviceName: initialData.serviceName || '',
    workLocations: initialData.workLocations || [],
    documents: initialData.documents || []
  });

  // Load active categories on component mount
  useEffect(() => {
    const categories = getActiveCategories();
    setActiveCategories(categories);
  }, []);

  const toggleSection = (section: SectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const calculateSectionCompletion = (section: SectionKey): { completed: number; total: number; isComplete: boolean } => {
    let completed = 0;
    let total = 0;

    switch (section) {
      case 'personal':
        total = 5;
        if (formData.profilePhoto) completed++;
        if (formData.fullName.trim()) completed++;
        if (formData.dni.trim() && formData.dni.length === 8) completed++;
        if (formData.email.trim()) completed++;
        if (formData.phone.trim() && formData.phone.length === 9) completed++;
        if (formData.workLocations.length > 0) completed++;
        total = 6;
        break;
      case 'about':
        total = 1;
        if (formData.description.trim() && formData.description.length >= 50) completed++;
        break;
      case 'service':
        total = 3;
        if (formData.category) completed++;
        if (formData.subcategories.length > 0) completed++;
        if (formData.serviceName.trim()) completed++;
        break;
      case 'portfolio':
        total = 1;
        if (formData.portfolio.length > 0) completed++;
        break;
      case 'documents':
        total = 1;
        if (formData.documents.some(doc => doc.type === 'dni')) completed++;
        break;
    }

    return { completed, total, isComplete: completed === total };
  };

  const calculateOverallProgress = (): number => {
    const sections: SectionKey[] = ['personal', 'about', 'service', 'portfolio', 'documents'];
    let totalCompleted = 0;
    let totalFields = 0;

    sections.forEach(section => {
      const { completed, total } = calculateSectionCompletion(section);
      totalCompleted += completed;
      totalFields += total;
    });

    return Math.round((totalCompleted / totalFields) * 100);
  };

  const handleInputChange = (field: keyof Genius, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddHomeLocation = () => {
    if (!currentUser?.location) {
      alert('No se pudo obtener tu domicilio. Verifica tu información de perfil.');
      return;
    }

    const homeLocation: SelectedLocation = {
      departmentId: currentUser.location.departmentId,
      departmentName: currentUser.location.departmentName,
      provinceId: currentUser.location.provinceId,
      provinceName: currentUser.location.provinceName,
      districtId: currentUser.location.districtId,
      districtName: currentUser.location.districtName,
      fullName: currentUser.location.fullName,
      type: 'district'
    };

    // Check if home location is already in work locations
    const isAlreadyAdded = formData.workLocations.some(loc => 
      loc.districtId === homeLocation.districtId && loc.type === 'district'
    );

    if (isAlreadyAdded) {
      alert('Tu domicilio ya está incluido en las zonas de trabajo.');
      return;
    }

    handleInputChange('workLocations', [...formData.workLocations, homeLocation]);
  };

  const getAvailableSubcategories = () => {
    if (!formData.category) return [];
    
    const selectedCategory = activeCategories.find(cat => cat.name === formData.category);
    return selectedCategory?.subcategories || [];
  };

  const handleSubcategoryToggle = (subcategoryName: string) => {
    const currentSubcategories = formData.subcategories;
    
    if (currentSubcategories.includes(subcategoryName)) {
      // Remove subcategory
      handleInputChange('subcategories', currentSubcategories.filter(sub => sub !== subcategoryName));
    } else {
      // Add subcategory (if under limit)
      if (currentSubcategories.length < 4) {
        handleInputChange('subcategories', [...currentSubcategories, subcategoryName]);
      } else {
        alert('Máximo 4 subcategorías permitidas');
      }
    }
  };

  const handleDocumentChange = (documentType: 'dni' | 'certificate', document: any) => {
    const newDocument: Document = {
      id: Date.now().toString(),
      name: document.name,
      type: documentType,
      url: document.url,
      uploadedAt: document.uploadedAt,
      verified: document.verified
    };

    const updatedDocuments = formData.documents.filter(doc => doc.type !== documentType);
    updatedDocuments.push(newDocument);
    
    handleInputChange('documents', updatedDocuments);
  };

  const handleDocumentRemove = (documentType: 'dni' | 'certificate') => {
    const updatedDocuments = formData.documents.filter(doc => doc.type !== documentType);
    handleInputChange('documents', updatedDocuments);
  };

  const getCurrentDocument = (documentType: 'dni' | 'certificate') => {
    return formData.documents.find(doc => doc.type === documentType);
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.fullName.trim()) errors.push('Nombre completo es requerido');
    if (!formData.dni.trim()) errors.push('DNI es requerido');
    if (!formData.email.trim()) errors.push('Email es requerido');
    if (!formData.phone.trim()) errors.push('Teléfono es requerido');
    if (!formData.description.trim()) errors.push('Descripción es requerida');
    if (!formData.category) errors.push('Categoría principal es requerida');
    if (formData.subcategories.length === 0) errors.push('Al menos una subcategoría es requerida');
    if (!formData.serviceName.trim()) errors.push('Nombre del servicio es requerido');
    if (formData.workLocations.length === 0) errors.push('Al menos una zona de trabajo es requerida');

    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    
    if (errors.length > 0) {
      alert('Por favor completa los siguientes campos:\n\n' + errors.join('\n'));
      return;
    }

    setIsSaving(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      onSave(formData);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error al guardar el perfil. Por favor, intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    onPreview(formData);
  };

  const renderPersonalSection = () => (
    <div className="space-y-6">
      {/* Profile Photo */}
      <ImageUploadField
        label="📸 Foto de Perfil"
        currentImage={formData.profilePhoto}
        onImageChange={(imageUrl) => handleInputChange('profilePhoto', imageUrl)}
        onImageRemove={() => handleInputChange('profilePhoto', '')}
        required
        helpText="Una foto clara y profesional ayuda a generar confianza"
      />

      {/* Personal Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-text/80 mb-2">
            👤 Nombre Completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
            placeholder="Tu nombre completo"
            title="Nombre que aparecerá en tu perfil público"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text/80 mb-2">
            🆔 DNI <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.dni}
            onChange={(e) => handleInputChange('dni', e.target.value.replace(/\D/g, '').slice(0, 8))}
            className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
            placeholder="12345678"
            maxLength={8}
            title="Documento Nacional de Identidad"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text/80 mb-2">
            📧 Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
            placeholder="tu@email.com"
            title="Email de contacto para clientes"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text/80 mb-2">
            📱 Teléfono <span className="text-red-500">*</span>
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-primary/20 bg-gray-50 text-text/60">
              +51
            </span>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 9))}
              className="w-full px-4 py-3 rounded-r-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
              placeholder="987654321"
              maxLength={9}
              title="Número de WhatsApp para contacto directo"
            />
          </div>
        </div>
      </div>

      {/* Work Locations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-text/80">
            🗺️ Zonas de Trabajo <span className="text-red-500">*</span>
          </label>
          {currentUser?.location && (
            <button
              type="button"
              onClick={handleAddHomeLocation}
              className="flex items-center space-x-2 text-primary hover:text-primary-dark transition-colors text-sm"
              title="Agregar tu domicilio como zona de trabajo"
            >
              <Home className="w-4 h-4" />
              <span>Usar mi domicilio</span>
            </button>
          )}
        </div>
        
        <FlexibleLocationSelector
          selectedLocations={formData.workLocations}
          onLocationsChange={(locations) => handleInputChange('workLocations', locations)}
          placeholder="Selecciona las zonas donde ofreces tus servicios..."
          maxSelections={10}
        />
      </div>
    </div>
  );

  const renderAboutSection = () => (
    <div className="space-y-6">
      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-text/80 mb-2">
          📝 Descripción de tu Trabajo <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => {
            if (e.target.value.length <= 500) {
              handleInputChange('description', e.target.value);
            }
          }}
          rows={4}
          maxLength={500}
          className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 resize-none"
          placeholder="Cuéntanos sobre tu experiencia, especialidad y qué te hace único..."
          title="Describe tu trabajo y experiencia para atraer clientes"
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-text/40">
            {500 - formData.description.length} caracteres restantes
          </span>
          {formData.description.length >= 50 && (
            <span className="text-xs text-green-500 flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" />
              Descripción completa
            </span>
          )}
        </div>
      </div>

      {/* Social Media Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-text/80 mb-2">
            📷 Instagram
          </label>
          <div className="relative">
            <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-500 w-5 h-5" />
            <input
              type="url"
              value={formData.instagram}
              onChange={(e) => handleInputChange('instagram', e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
              placeholder="https://instagram.com/tu_usuario"
              title="Tu perfil de Instagram (opcional)"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text/80 mb-2">
            📘 Facebook
          </label>
          <div className="relative">
            <Facebook className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-5 h-5" />
            <input
              type="url"
              value={formData.facebook}
              onChange={(e) => handleInputChange('facebook', e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
              placeholder="https://facebook.com/tu_pagina"
              title="Tu página de Facebook (opcional)"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text/80 mb-2">
            🎵 TikTok
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black font-bold text-sm">
              TT
            </div>
            <input
              type="url"
              value={formData.tiktok}
              onChange={(e) => handleInputChange('tiktok', e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
              placeholder="https://tiktok.com/@tu_usuario"
              title="Tu perfil de TikTok (opcional)"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderServiceSection = () => (
    <div className="space-y-6">
      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-text/80 mb-2">
          🏷️ Categoría Principal <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.category}
          onChange={(e) => {
            handleInputChange('category', e.target.value);
            handleInputChange('subcategories', []); // Reset subcategories when category changes
          }}
          className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
          title="Selecciona la categoría principal de tu servicio"
        >
          <option value="">Selecciona una categoría</option>
          {activeCategories.map(category => (
            <option key={category.id} value={category.name}>
              {category.emoji} {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Subcategories Selection */}
      {formData.category && (
        <div>
          <label className="block text-sm font-medium text-text/80 mb-2">
            🔧 Subcategorías <span className="text-red-500">*</span>
            <span className="text-text/60 ml-2">({formData.subcategories.length}/4)</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getAvailableSubcategories().map(subcategory => (
              <label
                key={subcategory.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  formData.subcategories.includes(subcategory.name)
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200 hover:border-primary/30 hover:bg-primary/5'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.subcategories.includes(subcategory.name)}
                  onChange={() => handleSubcategoryToggle(subcategory.name)}
                  className="w-4 h-4 text-primary focus:ring-primary rounded"
                />
                <span className="font-medium text-text">{subcategory.name}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-text/60 mt-2">
            Selecciona hasta 4 subcategorías que mejor describan tus servicios
          </p>
        </div>
      )}

      {/* Service Name */}
      <div>
        <label className="block text-sm font-medium text-text/80 mb-2">
          ✨ Nombre de tu Servicio <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.serviceName}
          onChange={(e) => handleInputChange('serviceName', e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
          placeholder="Ej: Maquillaje profesional para eventos y novias"
          title="Nombre descriptivo de tu servicio principal"
        />
      </div>
    </div>
  );

  const renderPortfolioSection = () => (
    <div className="space-y-6">
      <MultiImageUploadField
        label="📷 Fotos de tus Trabajos"
        currentImages={formData.portfolio}
        onImagesChange={(images) => handleInputChange('portfolio', images)}
        maxImages={6}
        helpText="Muestra ejemplos de tu mejor trabajo para atraer más clientes"
      />
    </div>
  );

  const renderDocumentsSection = () => (
    <div className="space-y-6">
      <DocumentUploadField
        label="🆔 Documento Nacional de Identidad (DNI)"
        documentType="dni"
        currentDocument={getCurrentDocument('dni')}
        onDocumentChange={(doc) => handleDocumentChange('dni', doc)}
        onDocumentRemove={() => handleDocumentRemove('dni')}
        required
        helpText="Foto clara de ambos lados de tu DNI"
      />

      <DocumentUploadField
        label="📋 Certificado Único de Trabajo"
        documentType="certificate"
        currentDocument={getCurrentDocument('certificate')}
        onDocumentChange={(doc) => handleDocumentChange('certificate', doc)}
        onDocumentRemove={() => handleDocumentRemove('certificate')}
        helpText="Certificado que acredite tu experiencia laboral (opcional)"
      />
    </div>
  );

  const renderCollapsibleSection = (
    sectionKey: SectionKey,
    icon: React.ReactNode,
    title: string,
    renderContent: () => React.ReactNode,
    bgColor: string
  ) => {
    const { completed, total, isComplete } = calculateSectionCompletion(sectionKey);
    const isExpanded = expandedSections[sectionKey];

    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
              {icon}
            </div>
            <div className="text-left">
              <h2 className="font-heading text-lg font-bold text-text">
                {title}
              </h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-text/60">
                  {completed}/{total} completados
                </span>
                {isComplete && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isComplete ? (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            ) : (
              <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-text/60" />
            ) : (
              <ChevronDown className="w-5 h-5 text-text/60" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="p-6 border-t border-gray-200 bg-gray-50/50">
            {renderContent()}
          </div>
        )}
      </div>
    );
  };

  const overallProgress = calculateOverallProgress();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 border-b border-gray-100">
          <h1 className="font-heading text-2xl font-bold text-text mb-2">
            ✏️ Editar mi Perfil de Genio
          </h1>
          <p className="text-text/60 mb-4">
            Completa tu información para que los clientes puedan encontrarte y contactarte
          </p>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text/70">Perfil completado</span>
              <span className="text-sm font-bold text-primary">{overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-success h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Form Sections */}
        <div className="p-6 space-y-4">
          {renderCollapsibleSection(
            'personal',
            <User className="w-5 h-5 text-primary" />,
            'Información Personal y de Contacto',
            renderPersonalSection,
            'bg-primary/10'
          )}

          {renderCollapsibleSection(
            'about',
            <Globe className="w-5 h-5 text-secondary" />,
            'Acerca de Mí y Redes Sociales',
            renderAboutSection,
            'bg-secondary/10'
          )}

          {renderCollapsibleSection(
            'service',
            <Briefcase className="w-5 h-5 text-success" />,
            'Detalles de mi Servicio',
            renderServiceSection,
            'bg-success/10'
          )}

          {renderCollapsibleSection(
            'portfolio',
            <Camera className="w-5 h-5 text-primary" />,
            'Mi Portafolio de Trabajos',
            renderPortfolioSection,
            'bg-primary/20'
          )}

          {renderCollapsibleSection(
            'documents',
            <FileText className="w-5 h-5 text-secondary" />,
            'Documentos de Verificación',
            renderDocumentsSection,
            'bg-secondary/20'
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-md hover:shadow-lg ${
                isSaving
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-dark text-white transform hover:scale-[1.02]'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
                  <span>Guardando cambios...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>

            <button
              onClick={handlePreview}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center space-x-2 py-4 rounded-xl font-semibold text-lg bg-secondary hover:bg-secondary-dark text-text transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50"
            >
              <Eye className="w-5 h-5" />
              <span>Vista Previa</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeniusProfileEditForm;