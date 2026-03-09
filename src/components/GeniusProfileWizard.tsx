import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Eye, Save, CheckCircle, X, Sparkles } from 'lucide-react';
import WizardStepsIndicator from './WizardStepsIndicator';
import ImageUploadField from './ImageUploadField';
import MultiImageUploadField from './MultiImageUploadField';
import DocumentUploadField from './DocumentUploadField';
import HierarchicalLocationSelector from './HierarchicalLocationSelector';
import WorkZoneSelector from './WorkZoneSelector';
import { Genius, Document } from '../utils/geniusUtils';
import { getCurrentUser } from '../utils/authUtils';
import { getActiveCategories, Category } from '../utils/categoryUtils';
import { saveDraft, loadDraft, saveGeniusProfile, deleteDraft } from '../services/supabaseGeniusService';
import GeniusProfilePreviewModal from './GeniusProfilePreviewModal';
import { CoverageType, expandCoverageToDistricts } from '../utils/locationUtils';
import { SelectedLocation } from './FlexibleLocationSelector';

interface GeniusProfileWizardProps {
  initialData?: Partial<Genius>;
  onComplete: () => void;
  onCancel: () => void;
}

const GeniusProfileWizard: React.FC<GeniusProfileWizardProps> = ({
  initialData,
  onComplete,
  onCancel
}) => {
  const [currentUser] = useState(getCurrentUser());
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [activeCategories, setActiveCategories] = useState<Category[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const [formData, setFormData] = useState<Genius>({
    id: '',
    profilePhoto: '',
    fullName: '',
    dni: '',
    phone: '',
    email: '',
    description: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    portfolio: [],
    category: '',
    subcategories: [],
    serviceName: '',
    location: '',
    homeLocation: null,
    coverageType: 'my-district',
    workLocations: [],
    documents: [],
    rating: 0,
    reviewCount: 0,
    status: 'pending',
    ...(initialData || {})
  });

  useEffect(() => {
    const categories = getActiveCategories();
    setActiveCategories(categories);
    loadSavedDraft();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentUser) {
        autoSaveDraft();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [formData, currentStep]);

  const loadSavedDraft = async () => {
    if (!currentUser) return;

    try {
      const draft = await loadDraft(currentUser.id);
      if (draft && draft.form_data) {
        setFormData({ ...formData, ...draft.form_data });
        setCurrentStep(draft.current_step || 1);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const autoSaveDraft = async () => {
    if (!currentUser) return;

    setSaveStatus('saving');
    try {
      await saveDraft(currentUser.id, currentStep, formData);
      setSaveStatus('saved');
      setLastSavedTime(new Date());
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error auto-saving draft:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleInputChange = (field: keyof Genius, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.profilePhoto &&
          formData.fullName.trim() &&
          formData.dni.length === 8 &&
          formData.email.trim() &&
          formData.phone.length === 9 &&
          formData.homeLocation
        );
      case 2:
        return formData.description.length >= 50;
      case 3:
        return !!(
          formData.category &&
          formData.subcategories.length > 0 &&
          formData.serviceName.trim()
        );
      case 4:
        return formData.portfolio.length > 0;
      case 5:
        return formData.documents.some(doc => doc.type === 'dni');
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      alert('Por favor completa todos los campos requeridos antes de continuar.');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepClick = (step: number) => {
    if (completedSteps.includes(step) || step === currentStep) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinish = async () => {
    if (!validateStep(5)) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }

    if (!currentUser) {
      alert('Error: Usuario no autenticado');
      return;
    }

    setIsSaving(true);

    try {
      const expandedWorkLocations = expandCoverageToDistricts(
        formData.homeLocation!,
        formData.coverageType || 'my-district',
        formData.workLocations
      );

      const profileData = {
        ...formData,
        workLocations: expandedWorkLocations,
        location: formData.homeLocation
          ? `${formData.homeLocation.districtName}, ${formData.homeLocation.provinceName}, ${formData.homeLocation.departmentName}`
          : ''
      };

      await saveGeniusProfile(currentUser.id, profileData);
      await deleteDraft(currentUser.id);

      setShowSuccess(true);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error al guardar el perfil. Por favor, intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubcategoryToggle = (subcategoryName: string) => {
    const currentSubcategories = formData.subcategories;

    if (currentSubcategories.includes(subcategoryName)) {
      handleInputChange('subcategories', currentSubcategories.filter(sub => sub !== subcategoryName));
    } else {
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

  const getAvailableSubcategories = () => {
    if (!formData.category) return [];
    const selectedCategory = activeCategories.find(cat => cat.name === formData.category);
    return selectedCategory?.subcategories || [];
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Información Personal</h2>
        </div>
        <p className="text-gray-600">Vamos a completar tu perfil paso a paso. Comencemos con tu información básica.</p>
      </div>

      <ImageUploadField
        label="Foto de Perfil"
        currentImage={formData.profilePhoto}
        onImageChange={(imageUrl) => handleInputChange('profilePhoto', imageUrl)}
        onImageRemove={() => handleInputChange('profilePhoto', '')}
        required
        helpText="Una foto clara y profesional ayuda a generar confianza"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre Completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none"
            placeholder="Tu nombre completo"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            DNI <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.dni}
            onChange={(e) => handleInputChange('dni', e.target.value.replace(/\D/g, '').slice(0, 8))}
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none"
            placeholder="12345678"
            maxLength={8}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none"
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono <span className="text-red-500">*</span>
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-4 rounded-l-lg border-2 border-r-0 border-gray-300 bg-gray-100 text-gray-600 font-medium">
              +51
            </span>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 9))}
              className="w-full px-4 py-2 rounded-r-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none"
              placeholder="987654321"
              maxLength={9}
            />
          </div>
        </div>
      </div>

      <HierarchicalLocationSelector
        value={formData.homeLocation}
        onChange={(location) => handleInputChange('homeLocation', location)}
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Sobre Mí</h2>
        </div>
        <p className="text-gray-600">¡Vas muy bien! Ahora cuéntanos sobre ti y tu trabajo. Esto ayudará a los clientes a conocerte mejor.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción de tu Trabajo <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => {
            if (e.target.value.length <= 500) {
              handleInputChange('description', e.target.value);
            }
          }}
          rows={6}
          maxLength={500}
          className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none resize-none"
          placeholder="Cuéntanos sobre tu experiencia, especialidad y qué te hace único..."
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-500">
            {formData.description.length}/500 caracteres (mínimo 50)
          </span>
          {formData.description.length >= 50 && (
            <span className="text-sm text-green-600 flex items-center">
              <CheckCircle className="w-4 h-4 mr-1" />
              Completo
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instagram
          </label>
          <input
            type="url"
            value={formData.instagram}
            onChange={(e) => handleInputChange('instagram', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none"
            placeholder="instagram.com/tu_usuario"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Facebook
          </label>
          <input
            type="url"
            value={formData.facebook}
            onChange={(e) => handleInputChange('facebook', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none"
            placeholder="facebook.com/tu_pagina"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            TikTok
          </label>
          <input
            type="url"
            value={formData.tiktok}
            onChange={(e) => handleInputChange('tiktok', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none"
            placeholder="tiktok.com/@tu_usuario"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Detalles del Servicio</h2>
        </div>
        <p className="text-gray-600">¡Excelente progreso! Define tu categoría y especialidades para que los clientes te encuentren fácilmente.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categoría Principal <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.category}
          onChange={(e) => {
            handleInputChange('category', e.target.value);
            handleInputChange('subcategories', []);
          }}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none"
        >
          <option value="">Selecciona una categoría</option>
          {activeCategories.map(category => (
            <option key={category.id} value={category.name}>
              {category.emoji} {category.name}
            </option>
          ))}
        </select>
      </div>

      {formData.category && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subcategorías <span className="text-red-500">*</span>
            <span className="text-gray-500 ml-2">({formData.subcategories.length}/4)</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getAvailableSubcategories().map(subcategory => (
              <label
                key={subcategory.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  formData.subcategories.includes(subcategory.name)
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.subcategories.includes(subcategory.name)}
                  onChange={() => handleSubcategoryToggle(subcategory.name)}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-600 rounded"
                />
                <span className="font-medium text-gray-900">{subcategory.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nombre de tu Servicio <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.serviceName}
          onChange={(e) => handleInputChange('serviceName', e.target.value)}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none"
          placeholder="Ej: Maquillaje profesional para eventos y novias"
        />
      </div>

      {formData.homeLocation && (
        <WorkZoneSelector
          homeLocation={formData.homeLocation}
          coverageType={formData.coverageType || 'my-district'}
          customDistricts={formData.workLocations}
          onCoverageTypeChange={(type) => handleInputChange('coverageType', type)}
          onCustomDistrictsChange={(districts) => handleInputChange('workLocations', districts)}
        />
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Mi Portafolio</h2>
        </div>
        <p className="text-gray-600">¡Ya casi terminas! Muestra tu mejor trabajo. Las fotos de calidad generan hasta 5 veces más consultas.</p>
      </div>

      <MultiImageUploadField
        label="Fotos de tus Trabajos"
        currentImages={formData.portfolio}
        onImagesChange={(images) => handleInputChange('portfolio', images)}
        maxImages={6}
        helpText="Muestra ejemplos de tu mejor trabajo para atraer más clientes"
      />
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Verificación de Identidad</h2>
        </div>
        <p className="text-gray-600">¡Último paso! Verifica tu identidad para generar confianza y seguridad con tus futuros clientes.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-900">
          Los documentos que subas serán revisados por nuestro equipo para verificar tu identidad.
          Este proceso puede tomar hasta 24 horas.
        </p>
      </div>

      <DocumentUploadField
        label="Documento Nacional de Identidad (DNI)"
        documentType="dni"
        currentDocument={getCurrentDocument('dni')}
        onDocumentChange={(doc) => handleDocumentChange('dni', doc)}
        onDocumentRemove={() => handleDocumentRemove('dni')}
        required
        helpText="Foto clara de ambos lados de tu DNI"
      />

      <DocumentUploadField
        label="Certificado Único de Trabajo"
        documentType="certificate"
        currentDocument={getCurrentDocument('certificate')}
        onDocumentChange={(doc) => handleDocumentChange('certificate', doc)}
        onDocumentRemove={() => handleDocumentRemove('certificate')}
        helpText="Certificado que acredite tu experiencia laboral (opcional)"
      />
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  if (showSuccess) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            ¡Perfecto! Tu perfil está actualizado
          </h2>
          <p className="text-gray-600 mb-6">
            Tus cambios se han guardado correctamente y tu perfil ya está actualizado
          </p>
          <button
            onClick={onComplete}
            className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
          >
            Ver mi dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Editar mi perfil</h2>
          <p className="text-gray-600 mt-1">Completa la información en cada paso</p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Cerrar"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <WizardStepsIndicator
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
      />

      <div className="mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          {renderCurrentStep()}
        </div>

        <div className="flex items-center justify-between">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Atrás</span>
            </button>
          )}

          <div className="flex-1"></div>

          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              disabled={!validateStep(currentStep)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                validateStep(currentStep)
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span>Guardar y Continuar</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={isSaving || !validateStep(5)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                isSaving || !validateStep(5)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Finalizar</span>
                </>
              )}
            </button>
          )}
        </div>

        <button
          onClick={() => setShowPreview(true)}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
        >
          <Eye className="w-5 h-5" />
          <span>Vista previa del perfil</span>
        </button>
      </div>

      <div className="fixed top-24 right-8 z-50">
        {saveStatus === 'saving' && (
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow-md flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800"></div>
            <span className="text-sm font-medium">Guardando...</span>
          </div>
        )}
        {saveStatus === 'saved' && (
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow-md flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Guardado</span>
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg shadow-md flex items-center space-x-2">
            <span className="text-sm font-medium">Error al guardar</span>
          </div>
        )}
      </div>

      {showPreview && (
        <GeniusProfilePreviewModal
          genius={formData}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default GeniusProfileWizard;
