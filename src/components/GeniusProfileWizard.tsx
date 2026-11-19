import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Eye, Save, CheckCircle, X, Sparkles } from 'lucide-react';
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
import WizardSuccess from './WizardSuccess';
import { CoverageType, expandCoverageToDistricts } from '../utils/locationUtils';
import { SelectedLocation } from './FlexibleLocationSelector';
import { calculateProfileCompletion, getMissingFields } from '../utils/profileCompletionUtils';

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
  const [savedProfileId, setSavedProfileId] = useState<string | null>(null);
  // Qué falta para poder avanzar (se muestra arriba de los botones).
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [saveError, setSaveError] = useState('');
  const [subcategoryLimitHit, setSubcategoryLimitHit] = useState(false);
  // Un perfil nuevo no trae id; uno que se edita, sí.
  const isNewProfile = !initialData?.id;
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState<Genius>({
    id: '',
    profilePhoto: '',
    // Nombre y correo vienen de la cuenta de Google: un paso menos.
    fullName: currentUser?.name ?? '',
    dni: '',
    phone: '',
    email: currentUser?.email ?? '',
    description: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    portfolio: [],
    category: '',
    subcategories: [],
    serviceName: '',
    location: '',
    // Genios es de Tacna: departamento y provincia vienen elegidos; el distrito lo elige la persona.
    homeLocation: { departmentId: 'tacna', departmentName: 'Tacna', provinceId: 'tacna-prov', provinceName: 'Tacna', districtId: '', districtName: '' },
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
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      if (currentUser) {
        autoSaveDraft();
      }
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, currentStep]);

  const loadSavedDraft = async () => {
    if (!currentUser) return;

    try {
      const draft = await loadDraft(currentUser.id);
      if (draft && draft.form_data) {
        setFormData({ ...formData, ...draft.form_data });
        setCurrentStep(draft.current_step || 1);

        const loadedSteps = [];
        for (let i = 1; i <= 5; i++) {
          if (validateStep(i, draft.form_data)) {
            loadedSteps.push(i);
          }
        }
        setCompletedSteps(loadedSteps);
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
    setSaveError('');
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateStep = (step: number, data: Genius = formData): boolean => {
    switch (step) {
      case 1:
        return !!(
          data.profilePhoto &&
          data.fullName.trim() &&
          data.dni.length === 8 &&
          data.email.trim() &&
          data.phone.length === 9 &&
          data.homeLocation?.districtId
        );
      case 2:
        return data.description.length >= 20;
      case 3:
        return !!(
          data.category &&
          data.subcategories.length > 0 &&
          data.serviceName.trim()
        );
      case 4:
        return data.portfolio.length > 0;
      case 5:
        return data.documents.some(doc => doc.type === 'dni');
      default:
        return false;
    }
  };

  /** Lo que falta en un paso, en palabras simples. Pasos 4 y 5 son opcionales. */
  const missingForStep = (step: number, data: Genius = formData): string[] => {
    const missing: string[] = [];
    if (step === 1) {
      if (!data.profilePhoto) missing.push('Tu foto de perfil');
      if (!data.fullName.trim()) missing.push('Tu nombre completo');
      if (data.dni.length !== 8) missing.push('Tu DNI (8 números)');
      if (!data.email.trim()) missing.push('Tu correo');
      if (data.phone.length !== 9) missing.push('Tu celular (9 números)');
      if (!data.homeLocation?.districtId) missing.push('El distrito donde vives');
    }
    if (step === 2 && data.description.trim().length < 20) {
      missing.push('Una descripción de tu trabajo (mínimo 20 letras)');
    }
    if (step === 3) {
      if (!data.category) missing.push('La categoría de tu servicio');
      if (data.subcategories.length === 0) missing.push('Al menos una especialidad');
      if (!data.serviceName.trim()) missing.push('El nombre de tu servicio');
    }
    return missing;
  };

  /** Primer paso obligatorio incompleto, o null si los tres están bien. */
  const firstIncompleteRequiredStep = (): number | null => {
    for (const step of [1, 2, 3]) {
      if (missingForStep(step).length > 0) return step;
    }
    return null;
  };

  /** Lleva la vista al aviso de "te falta…", que está junto a los botones. */
  const showErrors = (missing: string[]) => {
    setStepErrors(missing);
    setTimeout(() => {
      document.getElementById('wizard-errors')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 50);
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = () => {
    const missing = missingForStep(currentStep);
    if (missing.length > 0) {
      showErrors(missing);
      return;
    }
    setStepErrors([]);
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    if (currentStep < 5) goToStep(currentStep + 1);
  };

  const handleBack = () => {
    setStepErrors([]);
    if (currentStep > 1) goToStep(currentStep - 1);
  };

  // Volver siempre se puede; adelantarse, solo si los pasos anteriores están completos.
  const handleStepClick = (step: number) => {
    if (step <= currentStep) {
      setStepErrors([]);
      goToStep(step);
      return;
    }
    const blocking = [1, 2, 3].find((s) => s < step && missingForStep(s).length > 0);
    if (blocking) {
      setCurrentStep(blocking);
      showErrors(missingForStep(blocking));
      return;
    }
    setStepErrors([]);
    goToStep(step);
  };

  const handleFinish = async () => {
    if (!currentUser) {
      setSaveError('Tu sesión expiró. Vuelve a iniciar sesión para guardar.');
      return;
    }

    const incomplete = firstIncompleteRequiredStep();
    if (incomplete) {
      setCurrentStep(incomplete);
      showErrors(missingForStep(incomplete));
      return;
    }
    await handleSaveProgress();
  };

  const handleSaveProgress = async () => {
    if (!currentUser) {
      setSaveError('Tu sesión expiró. Vuelve a iniciar sesión para guardar.');
      return;
    }
    if (!formData.homeLocation?.districtId) {
      setCurrentStep(1);
      showErrors(missingForStep(1));
      return;
    }

    setIsSaving(true);
    setSaveError('');

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

      const completionPercentage = calculateProfileCompletion(profileData);

      const saved = await saveGeniusProfile(currentUser.id, profileData, completionPercentage, 6);
      await deleteDraft(currentUser.id).catch(() => undefined);

      setSavedProfileId(saved.id);
      setShowSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveError('No pudimos guardar tu perfil. Revisa tu conexión e inténtalo de nuevo; tus datos no se perdieron.');
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
        setSubcategoryLimitHit(false);
        handleInputChange('subcategories', [...currentSubcategories, subcategoryName]);
      } else {
        setSubcategoryLimitHit(true);
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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Información personal</h2>
        </div>
        <p className="text-gray-600">Empecemos con lo básico. Tu nombre y correo ya vienen de tu cuenta de Google.</p>
      </div>

      <ImageUploadField
        label="Foto de perfil"
        currentImage={formData.profilePhoto}
        onImageChange={(imageUrl) => handleInputChange('profilePhoto', imageUrl)}
        onImageRemove={() => handleInputChange('profilePhoto', '')}
        required
        helpText="Una foto clara y profesional ayuda a generar confianza"
        pathPrefix={currentUser?.id ?? ''}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none"
            placeholder="Tu nombre completo"
            autoComplete="name"
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
            inputMode="numeric"
            autoComplete="off"
            className={`w-full px-4 py-2 rounded-lg border-2 focus:outline-none ${
              formData.dni.length === 8
                ? 'border-green-300 focus:border-green-600'
                : 'border-gray-300 focus:border-blue-600'
            }`}
            placeholder="12345678"
            maxLength={8}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.dni.length}/8 dígitos
            {formData.dni.length === 8 && <span className="text-green-600 ml-2">✓</span>}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Correo <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none"
            placeholder="tu@email.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Celular (WhatsApp) <span className="text-red-500">*</span>
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-4 rounded-l-lg border-2 border-r-0 border-gray-300 bg-gray-100 text-gray-600 font-medium">
              +51
            </span>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 9))}
              inputMode="numeric"
              autoComplete="tel-national"
              className={`w-full px-4 py-2 rounded-r-lg border-2 focus:outline-none ${
                formData.phone.length === 9
                  ? 'border-green-300 focus:border-green-600'
                  : 'border-gray-300 focus:border-blue-600'
              }`}
              placeholder="987654321"
              maxLength={9}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {formData.phone.length}/9 dígitos
            {formData.phone.length === 9 && <span className="text-green-600 ml-2">✓</span>}
          </p>
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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Sobre mí</h2>
        </div>
        <p className="text-gray-600">¡Vas muy bien! Ahora cuéntanos sobre ti y tu trabajo. Esto ayudará a los clientes a conocerte mejor.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descripción de tu trabajo <span className="text-red-500">*</span>
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
          className={`w-full px-4 py-3 rounded-lg border-2 focus:outline-none resize-none ${
            formData.description.length >= 20
              ? 'border-green-300 focus:border-green-600'
              : 'border-gray-300 focus:border-blue-600'
          }`}
          placeholder="Cuéntanos sobre tu experiencia, especialidad y qué te hace único..."
        />
        <div className="flex justify-between items-center mt-2">
          <span className={`text-sm ${formData.description.length >= 20 ? 'text-green-600' : 'text-gray-500'}`}>
            {formData.description.length}/500 caracteres (mínimo 20)
          </span>
          {formData.description.length >= 20 && (
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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Detalles del servicio</h2>
        </div>
        <p className="text-gray-600">¡Excelente progreso! Define tu categoría y especialidades para que los clientes te encuentren fácilmente.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categoría principal <span className="text-red-500">*</span>
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
            Especialidades <span className="text-red-500">*</span>
            <span className="text-gray-500 ml-2">({formData.subcategories.length}/4)</span>
          </label>
          {subcategoryLimitHit && (
            <p role="status" className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-3">
              Puedes elegir hasta 4. Quita una para cambiarla por otra.
            </p>
          )}
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
          Nombre de tu servicio <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.serviceName}
          onChange={(e) => handleInputChange('serviceName', e.target.value)}
          className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-600 focus:outline-none"
          placeholder="Ej: Maquillaje profesional para eventos y novias"
        />
      </div>

      {formData.homeLocation?.districtId && (
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
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Mi portafolio</h2>
        </div>
        <p className="text-gray-600">¡Ya casi terminas! Muestra tu mejor trabajo. Las fotos de calidad generan hasta 5 veces más consultas.</p>
      </div>

      <MultiImageUploadField
        label="Fotos de tus trabajos (opcional)"
        currentImages={formData.portfolio}
        onImagesChange={(images) => handleInputChange('portfolio', images)}
        maxImages={6}
        helpText="Muestra ejemplos de tu mejor trabajo para atraer más clientes. Puedes agregar fotos más tarde."
        pathPrefix={currentUser?.id ?? ''}
      />
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Verificación de identidad</h2>
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
        label="Foto de tu DNI (opcional, te da la insignia de verificado)"
        documentType="dni"
        currentDocument={getCurrentDocument('dni')}
        onDocumentChange={(doc) => handleDocumentChange('dni', doc)}
        onDocumentRemove={() => handleDocumentRemove('dni')}
        helpText="Foto clara de ambos lados de tu DNI. Puedes subirlo más tarde."
      />

      <DocumentUploadField
        label="Certificado Único Laboral (opcional)"
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

  if (showSuccess && savedProfileId) {
    const missingFields = getMissingFields({
      profile_photo: formData.profilePhoto,
      full_name: formData.fullName,
      dni: formData.dni,
      email: formData.email,
      phone: formData.phone,
      description: formData.description,
      instagram: formData.instagram,
      facebook: formData.facebook,
      tiktok: formData.tiktok,
      category: formData.category,
      subcategories: formData.subcategories,
      service_name: formData.serviceName,
      home_location: formData.homeLocation,
      coverage_type: formData.coverageType,
      work_locations: formData.workLocations,
      portfolio: formData.portfolio,
      documents: formData.documents,
    });
    return <WizardSuccess geniusProfileId={savedProfileId} missingFields={missingFields} onGoToPanel={onComplete} />;
  }

  // Una vez mostrado, el aviso refleja lo que falta AHORA en este paso: se
  // achica mientras la persona completa y desaparece solo.
  const visibleErrors = stepErrors.length > 0 ? missingForStep(currentStep) : [];

  return (
    <div className="relative">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {isNewProfile ? 'Crea tu perfil de genio' : 'Editar mi perfil'}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {isNewProfile ? '5 pasos · unos 10 minutos · los 2 últimos son opcionales' : 'Cambia lo que necesites y guarda al final'}
          </p>
          <p className="text-xs mt-1 h-4" role="status" aria-live="polite">
            {saveStatus === 'saving' && <span className="text-gray-400">Guardando borrador…</span>}
            {saveStatus === 'saved' && <span className="text-green-600">✓ Borrador guardado</span>}
            {saveStatus === 'error' && <span className="text-red-500">No se pudo guardar el borrador</span>}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 shrink-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Cerrar"
          aria-label="Cerrar el formulario"
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8 mb-6">
          {renderCurrentStep()}
        </div>

        {(visibleErrors.length > 0 || saveError) && (
          <div id="wizard-errors" role="alert" className="mb-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 scroll-mt-28">
            <p className="flex items-center gap-2 font-semibold mb-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {saveError ? 'No se pudo guardar' : 'Para continuar, completa:'}
            </p>
            {saveError ? (
              <p>{saveError}</p>
            ) : (
              <ul className="list-disc pl-6 space-y-0.5">
                {visibleErrors.map((e) => <li key={e}>{e}</li>)}
              </ul>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Atrás</span>
            </button>
          )}

          <div className="flex-1"></div>

          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
            >
              <span>Continuar</span>
              <ArrowRight className="w-5 h-5 shrink-0" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={isSaving}
              className={`flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 rounded-lg font-medium transition-colors ${
                isSaving
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
                  <span>{isNewProfile ? 'Terminar' : 'Guardar cambios'}</span>
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

      {showPreview && (
        <GeniusProfilePreviewModal
          isOpen={showPreview}
          geniusData={formData}
          onClose={() => setShowPreview(false)}
        />
      )}

    </div>
  );
};

export default GeniusProfileWizard;
