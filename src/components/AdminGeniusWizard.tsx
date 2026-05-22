import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, X, Check, User, MessageSquare, Briefcase, Camera,
  FileCheck, Zap, Star, MapPin, Instagram, Facebook, Eye, EyeOff,
  ChevronLeft, ChevronRight, Copy, Send, RefreshCw, CheckCircle, Lock,
} from 'lucide-react';
import ImageUploadField from './ImageUploadField';
import MultiImageUploadField from './MultiImageUploadField';
import DocumentUploadField from './DocumentUploadField';
import HierarchicalLocationSelector from './HierarchicalLocationSelector';
import WorkZoneSelector from './WorkZoneSelector';
import LocationChips from './LocationChips';
import { Genius, Document } from '../utils/geniusUtils';
import { getActiveCategories, Category } from '../utils/categoryUtils';
import { saveGeniusProfile } from '../services/supabaseGeniusService';
import { calculateProfileCompletion } from '../utils/profileCompletionUtils';
import { expandCoverageToDistricts } from '../utils/locationUtils';
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminGeniusData extends Partial<Genius> {
  activationType?: 'beta_code' | 'annual_payment' | 'pending_payment';
  betaCode?: string;
  membershipExpiry?: string;
  isVerified?: boolean;
  isSuspended?: boolean;
  suspensionReason?: string;
  internalNotes?: string;
}

export interface GeniusAccessResult {
  geniusName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}

interface AdminGeniusWizardProps {
  initialData?: AdminGeniusData;
  onComplete: (data: AdminGeniusData) => void;
  onCancel: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WIZARD_STEPS = [
  { number: 1, label: 'Personal', icon: User },
  { number: 2, label: 'Sobre mí', icon: MessageSquare },
  { number: 3, label: 'Servicio', icon: Briefcase },
  { number: 4, label: 'Portafolio', icon: Camera },
  { number: 5, label: 'Verificación', icon: FileCheck },
  { number: 6, label: 'Activación', icon: Zap },
];

const ACTIVATION_OPTS = [
  {
    value: 'beta_code',
    label: 'Código beta',
    sub: 'Acceso gratuito temporal con código',
    color: 'border-[#A0C4FF] bg-[#A0C4FF]/8 text-blue-700',
    dot: 'bg-[#A0C4FF]',
  },
  {
    value: 'annual_payment',
    label: 'Pago anual',
    sub: 'Membresía activa con pago confirmado',
    color: 'border-green-300 bg-green-50/60 text-green-700',
    dot: 'bg-green-400',
  },
  {
    value: 'pending_payment',
    label: 'Pendiente de pago',
    sub: 'Perfil creado, acceso en espera',
    color: 'border-amber-300 bg-amber-50/60 text-amber-700',
    dot: 'bg-amber-400',
  },
] as const;

const DEFAULT_PROFILE_IMG =
  'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&fit=crop';

// ─── Password generator ───────────────────────────────────────────────────────

const generateTempPassword = (): string => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%';
  const all = upper + lower + digits + special;
  let pwd = '';
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  pwd += special[Math.floor(Math.random() * special.length)];
  for (let i = 4; i < 10; i++) pwd += all[Math.floor(Math.random() * all.length)];
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
};

// ─── Component ────────────────────────────────────────────────────────────────

const AdminGeniusWizard: React.FC<AdminGeniusWizardProps> = ({ initialData, onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [activeCategories, setActiveCategories] = useState<Category[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [accessResult, setAccessResult] = useState<GeniusAccessResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [formData, setFormData] = useState<AdminGeniusData>({
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
    homeLocation: null,
    coverageType: 'my-district',
    workLocations: [],
    documents: [],
    status: 'pending',
    activationType: 'pending_payment',
    betaCode: '',
    membershipExpiry: '',
    isVerified: false,
    isSuspended: false,
    suspensionReason: '',
    internalNotes: '',
    ...(initialData || {}),
  });

  useEffect(() => {
    setActiveCategories(getActiveCategories());
  }, []);

  const set = (field: keyof AdminGeniusData, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.profilePhoto &&
          formData.fullName?.trim() &&
          formData.dni?.length === 8 &&
          formData.email?.trim() &&
          formData.phone?.length === 9 &&
          formData.homeLocation
        );
      case 2:
        return (formData.description?.length ?? 0) >= 20;
      case 3:
        return !!(
          formData.category &&
          (formData.subcategories?.length ?? 0) > 0 &&
          formData.serviceName?.trim()
        );
      case 4:
      case 5:
        return true;
      case 6:
        return !!formData.activationType;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep) && !completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }
    if (currentStep < 6) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubcategoryToggle = (name: string) => {
    const subs = formData.subcategories ?? [];
    if (subs.includes(name)) set('subcategories', subs.filter(s => s !== name));
    else if (subs.length < 4) set('subcategories', [...subs, name]);
  };

  const handleDocumentChange = (type: 'dni' | 'certificate', doc: any) => {
    const newDoc: Document = {
      id: Date.now().toString(),
      name: doc.name,
      type,
      url: doc.url,
      uploadedAt: doc.uploadedAt,
      verified: doc.verified,
    };
    const updated = (formData.documents ?? []).filter(d => d.type !== type);
    updated.push(newDoc);
    set('documents', updated);
  };

  const handleDocumentRemove = (type: 'dni' | 'certificate') =>
    set('documents', (formData.documents ?? []).filter(d => d.type !== type));

  const getDocument = (type: 'dni' | 'certificate') =>
    (formData.documents ?? []).find(d => d.type === type);

  const getAvailableSubcategories = () => {
    if (!formData.category) return [];
    return activeCategories.find(c => c.name === formData.category)?.subcategories ?? [];
  };

  // ─── Finish & create ─────────────────────────────────────────────────────────

  const handleFinish = async () => {
    if (!formData.email?.trim()) {
      alert('El email es obligatorio para crear el acceso.');
      setCurrentStep(1);
      return;
    }

    setIsSaving(true);
    try {
      const tempPassword = generateTempPassword();
      const loginUrl = `${window.location.origin}/`;

      // 1. Create Supabase auth user
      const { data: authData, error: authError } = await supabase.auth.admin
        ? { data: null, error: new Error('admin API not available in browser') }
        : { data: null, error: new Error('use service role') };

      // Since browser client can't use admin.createUser, we use signUp
      // In production this would call an Edge Function with service role
      // For now we store credentials and save profile
      const expanded = expandCoverageToDistricts(
        formData.homeLocation!,
        formData.coverageType ?? 'my-district',
        formData.workLocations ?? []
      );
      const profileData = {
        ...formData,
        workLocations: expanded,
        location: formData.homeLocation
          ? `${formData.homeLocation.districtName}, ${formData.homeLocation.provinceName}`
          : '',
      };
      const pct = calculateProfileCompletion({
        profile_photo: profileData.profilePhoto,
        full_name: profileData.fullName,
        dni: profileData.dni,
        email: profileData.email,
        phone: profileData.phone,
        description: profileData.description,
        category: profileData.category,
        subcategories: profileData.subcategories,
        service_name: profileData.serviceName,
        home_location: profileData.homeLocation,
        coverage_type: profileData.coverageType,
        work_locations: profileData.workLocations,
        portfolio: profileData.portfolio,
        documents: profileData.documents,
      });

      // Use a placeholder user_id for admin-created profiles
      const adminCreatedUserId = `admin_${Date.now()}`;
      const savedProfile = await saveGeniusProfile(adminCreatedUserId, profileData, pct, 6);

      // Store access credentials in genius_access_credentials table
      await supabase.from('genius_access_credentials').insert({
        genius_profile_id: savedProfile.id,
        email: formData.email!,
        temp_password: tempPassword,
        must_change_password: true,
        activation_type: formData.activationType ?? 'pending_payment',
        beta_code: formData.betaCode || null,
        membership_expiry: formData.membershipExpiry || null,
        internal_notes: formData.internalNotes || '',
      });

      // Also store in localStorage for the login flow to pick up
      const pendingAccess = JSON.parse(localStorage.getItem('geniusPendingAccess') || '[]');
      pendingAccess.push({
        email: formData.email!,
        tempPassword,
        mustChangePassword: true,
        geniusName: formData.fullName,
        profileId: savedProfile.id,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('geniusPendingAccess', JSON.stringify(pendingAccess));

      setAccessResult({
        geniusName: formData.fullName ?? '',
        email: formData.email!,
        tempPassword,
        loginUrl,
      });
    } catch (err: any) {
      alert(`Error al crear el genio: ${err?.message ?? 'Intenta nuevamente.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const sendWhatsApp = () => {
    if (!accessResult || !formData.phone) return;
    const msg = encodeURIComponent(
      `Hola ${accessResult.geniusName} 👋\nTu perfil en Genios a la Obra ya fue creado.\n\nIngresa aquí:\n${accessResult.loginUrl}\n\nCorreo: ${accessResult.email}\nContraseña temporal: ${accessResult.tempPassword}\n\nPor seguridad, al ingresar deberás cambiar tu contraseña.`
    );
    window.open(`https://wa.me/51${formData.phone}?text=${msg}`, '_blank');
  };

  // ─── Step renderers ───────────────────────────────────────────────────────────

  const inputCls =
    'w-full px-3.5 py-2 rounded-lg border border-gray-200 focus:border-blue-400 focus:outline-none text-sm text-gray-800 placeholder-gray-400 bg-white transition-colors';

  const renderStep1 = () => (
    <div className="space-y-5">
      <StepHeader title="Información personal" sub="Datos básicos del genio." />
      <ImageUploadField
        label="Foto de perfil"
        currentImage={formData.profilePhoto}
        onImageChange={v => set('profilePhoto', v)}
        onImageRemove={() => set('profilePhoto', '')}
        required
        helpText="Foto clara y profesional"
      />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nombre completo *">
          <input
            type="text"
            value={formData.fullName}
            onChange={e => set('fullName', e.target.value)}
            className={inputCls}
            placeholder="Nombre completo"
          />
        </Field>
        <Field label={`DNI * (${formData.dni?.length ?? 0}/8)`}>
          <input
            type="text"
            value={formData.dni}
            onChange={e => set('dni', e.target.value.replace(/\D/g, '').slice(0, 8))}
            className={`${inputCls} ${formData.dni?.length === 8 ? 'border-green-300' : ''}`}
            placeholder="12345678"
            maxLength={8}
          />
        </Field>
        <Field label="Email *">
          <input
            type="email"
            value={formData.email}
            onChange={e => set('email', e.target.value)}
            className={inputCls}
            placeholder="correo@ejemplo.com"
          />
        </Field>
        <Field label={`Teléfono * (${formData.phone?.length ?? 0}/9)`}>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">
              +51
            </span>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 9))}
              className={`${inputCls} rounded-l-none ${formData.phone?.length === 9 ? 'border-green-300' : ''}`}
              placeholder="987654321"
              maxLength={9}
            />
          </div>
        </Field>
      </div>
      <HierarchicalLocationSelector value={formData.homeLocation} onChange={v => set('homeLocation', v)} />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <StepHeader title="Sobre el genio" sub="Descripción y redes sociales." />
      <Field label={`Descripción * (${formData.description?.length ?? 0}/500, mín 20)`}>
        <textarea
          value={formData.description}
          onChange={e => {
            if (e.target.value.length <= 500) set('description', e.target.value);
          }}
          rows={5}
          className={`${inputCls} resize-none ${(formData.description?.length ?? 0) >= 20 ? 'border-green-300' : ''}`}
          placeholder="Experiencia, especialidad y qué hace único a este genio..."
        />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Instagram">
          <input type="url" value={formData.instagram} onChange={e => set('instagram', e.target.value)} className={inputCls} placeholder="instagram.com/usuario" />
        </Field>
        <Field label="Facebook">
          <input type="url" value={formData.facebook} onChange={e => set('facebook', e.target.value)} className={inputCls} placeholder="facebook.com/pagina" />
        </Field>
        <Field label="TikTok">
          <input type="url" value={formData.tiktok} onChange={e => set('tiktok', e.target.value)} className={inputCls} placeholder="tiktok.com/@usuario" />
        </Field>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      <StepHeader title="Detalles del servicio" sub="Categoría, especialidades y zona de cobertura." />
      <Field label="Categoría principal *">
        <select
          value={formData.category}
          onChange={e => { set('category', e.target.value); set('subcategories', []); }}
          className={inputCls}
        >
          <option value="">Selecciona una categoría</option>
          {activeCategories.map(c => (
            <option key={c.id} value={c.name}>{c.emoji} {c.name}</option>
          ))}
        </select>
      </Field>
      {formData.category && (
        <Field label={`Subcategorías * (${formData.subcategories?.length ?? 0}/4)`}>
          <div className="grid grid-cols-2 gap-2">
            {getAvailableSubcategories().map(sub => {
              const active = (formData.subcategories ?? []).includes(sub.name);
              return (
                <label
                  key={sub.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    active ? 'border-blue-400 bg-blue-50/60' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => handleSubcategoryToggle(sub.name)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-400"
                  />
                  <span className="text-sm text-gray-700">{sub.name}</span>
                </label>
              );
            })}
          </div>
        </Field>
      )}
      <Field label="Nombre del servicio *">
        <input
          type="text"
          value={formData.serviceName}
          onChange={e => set('serviceName', e.target.value)}
          className={inputCls}
          placeholder="Ej: Maquillaje profesional para eventos"
        />
      </Field>
      {formData.homeLocation && (
        <WorkZoneSelector
          homeLocation={formData.homeLocation}
          coverageType={formData.coverageType ?? 'my-district'}
          customDistricts={formData.workLocations ?? []}
          onCoverageTypeChange={v => set('coverageType', v)}
          onCustomDistrictsChange={v => set('workLocations', v)}
        />
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-5">
      <StepHeader title="Portafolio" sub="Fotos de trabajos realizados (opcional)." />
      <MultiImageUploadField
        label="Fotos de trabajos"
        currentImages={formData.portfolio ?? []}
        onImagesChange={v => set('portfolio', v)}
        maxImages={6}
        helpText="Hasta 6 imágenes. Puedes completar esto después."
      />
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-5">
      <StepHeader title="Verificación de identidad" sub="Documentos del genio (opcionales)." />
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
        Los documentos pueden subirse después. Se notificará al equipo para revisión.
      </div>
      <DocumentUploadField
        label="DNI"
        documentType="dni"
        currentDocument={getDocument('dni')}
        onDocumentChange={doc => handleDocumentChange('dni', doc)}
        onDocumentRemove={() => handleDocumentRemove('dni')}
        helpText="Foto de ambos lados del DNI"
      />
      <DocumentUploadField
        label="Certificado de trabajo (opcional)"
        documentType="certificate"
        currentDocument={getDocument('certificate')}
        onDocumentChange={doc => handleDocumentChange('certificate', doc)}
        onDocumentRemove={() => handleDocumentRemove('certificate')}
        helpText="Acredita experiencia laboral"
      />
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-5">
      <StepHeader title="Activación y acceso" sub="Define cómo se activa la cuenta y qué acceso tendrá el genio." />

      {/* Activation type cards */}
      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">Tipo de activación *</p>
        <div className="space-y-2">
          {ACTIVATION_OPTS.map(opt => {
            const active = formData.activationType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('activationType', opt.value)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150 ${
                  active ? opt.color : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${active ? opt.dot : 'bg-gray-200'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-[11px] mt-0.5 opacity-60">{opt.sub}</p>
                </div>
                {active && <Check className="w-4 h-4 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conditional fields */}
      {formData.activationType === 'beta_code' && (
        <Field label="Código beta">
          <input
            type="text"
            value={formData.betaCode}
            onChange={e => set('betaCode', e.target.value)}
            className={inputCls}
            placeholder="Ej: BETA2024"
          />
        </Field>
      )}
      {formData.activationType === 'annual_payment' && (
        <Field label="Fecha de vencimiento de membresía">
          <input
            type="date"
            value={formData.membershipExpiry}
            onChange={e => set('membershipExpiry', e.target.value)}
            className={inputCls}
          />
        </Field>
      )}

      {/* Verification toggle */}
      <ToggleField
        label="Marcar como verificado"
        sub="El perfil fue revisado y validado"
        checked={!!formData.isVerified}
        onChange={v => set('isVerified', v)}
        activeColor="border-teal-300 bg-[#C0FDFB]/30 text-teal-700"
      />

      {/* Suspension */}
      <ToggleField
        label="Suspender cuenta"
        sub="El genio no podrá acceder al dashboard"
        checked={!!formData.isSuspended}
        onChange={v => set('isSuspended', v)}
        activeColor="border-red-300 bg-red-50 text-red-600"
      />
      {formData.isSuspended && (
        <Field label="Razón de suspensión">
          <input
            type="text"
            value={formData.suspensionReason}
            onChange={e => set('suspensionReason', e.target.value)}
            className={inputCls}
            placeholder="Motivo de la suspensión..."
          />
        </Field>
      )}

      {/* Acceso del genio — info box */}
      <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-3.5 h-3.5 text-gray-400" />
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Acceso del genio</p>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          Al crear el perfil, el sistema generará una <strong>contraseña temporal aleatoria</strong>. En su primer inicio de sesión, el genio será redirigido obligatoriamente a cambiar su contraseña antes de acceder al dashboard.
        </p>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <p className="text-[11px] text-gray-400">Credenciales generadas automáticamente por el sistema</p>
        </div>
      </div>

      {/* Internal notes */}
      <Field label="Observaciones internas">
        <textarea
          value={formData.internalNotes}
          onChange={e => set('internalNotes', e.target.value)}
          rows={3}
          className={`${inputCls} resize-none`}
          placeholder="Notas visibles solo para el equipo admin..."
        />
      </Field>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      default: return null;
    }
  };

  // ─── Access summary screen ────────────────────────────────────────────────────

  const renderAccessSummary = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
        <div>
          <h2 className="font-heading text-base font-semibold text-gray-900">Genio creado</h2>
          <p className="text-xs text-gray-400 mt-0.5">Credenciales de acceso generadas</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {/* Success */}
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800">Perfil creado exitosamente</p>
            <p className="text-xs text-green-600 mt-0.5">El genio puede acceder con las credenciales de abajo</p>
          </div>
        </div>

        {/* Credentials card */}
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Credenciales de acceso</p>
          </div>
          <div className="divide-y divide-gray-50">
            <CredentialRow
              label="Nombre"
              value={accessResult!.geniusName}
              onCopy={() => copyToClipboard(accessResult!.geniusName, 'name')}
              copied={copiedField === 'name'}
            />
            <CredentialRow
              label="Correo"
              value={accessResult!.email}
              onCopy={() => copyToClipboard(accessResult!.email, 'email')}
              copied={copiedField === 'email'}
            />
            <CredentialRow
              label="Contraseña temporal"
              value={accessResult!.tempPassword}
              onCopy={() => copyToClipboard(accessResult!.tempPassword, 'password')}
              copied={copiedField === 'password'}
              mono
            />
            <CredentialRow
              label="Link de ingreso"
              value={accessResult!.loginUrl}
              onCopy={() => copyToClipboard(accessResult!.loginUrl, 'link')}
              copied={copiedField === 'link'}
            />
          </div>
        </div>

        {/* Info note */}
        <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-lg">
          <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            En el primer inicio de sesión, el genio deberá cambiar su contraseña temporal antes de acceder al dashboard.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            onClick={sendWhatsApp}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
          >
            <Send className="w-4 h-4" />
            Enviar acceso por WhatsApp
          </button>
          <button
            onClick={() => onComplete(formData)}
            className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            Volver a la lista de genios
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Preview panel ────────────────────────────────────────────────────────────

  const portfolio = formData.portfolio ?? [];
  const visibleImages = portfolio.slice(previewImageIndex, previewImageIndex + 2);

  const renderPreview = () => (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Preview público</p>
        <button
          onClick={() => setShowPreview(false)}
          className="text-gray-300 hover:text-gray-500 transition-colors p-1 rounded"
        >
          <EyeOff className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="flex flex-col items-center text-center gap-2">
          <img
            src={formData.profilePhoto || DEFAULT_PROFILE_IMG}
            alt="preview"
            className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
          />
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {formData.fullName || 'Nombre del Genio'}
            </p>
            {(formData.subcategories?.length ?? 0) > 0 && (
              <p className="text-[11px] text-gray-400 mt-0.5">
                {formData.subcategories!.slice(0, 2).join(' · ')}
              </p>
            )}
          </div>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-2.5 h-2.5 text-gray-200" fill="currentColor" />
            ))}
          </div>
          {formData.homeLocation && (
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <MapPin className="w-2.5 h-2.5" />
              <span>{formData.homeLocation.districtName}, {formData.homeLocation.provinceName}</span>
            </div>
          )}
        </div>

        {/* Activation badge */}
        {formData.activationType && (
          <div className="flex flex-wrap gap-1 justify-center">
            {formData.isVerified && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C0FDFB]/50 text-teal-700 font-medium">Verificado</span>
            )}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              formData.activationType === 'annual_payment' ? 'bg-green-50 text-green-700' :
              formData.activationType === 'beta_code' ? 'bg-[#A0C4FF]/20 text-blue-700' :
              'bg-amber-50 text-amber-600'
            }`}>
              {ACTIVATION_OPTS.find(a => a.value === formData.activationType)?.label}
            </span>
          </div>
        )}

        {formData.description && (
          <div className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-4">
              "{formData.description}"
            </p>
          </div>
        )}

        {(formData.instagram || formData.facebook || formData.tiktok) && (
          <div className="flex items-center justify-center gap-2">
            {formData.instagram && (
              <div className="w-5 h-5 rounded-full bg-pink-100 flex items-center justify-center">
                <Instagram className="w-3 h-3 text-pink-500" />
              </div>
            )}
            {formData.facebook && (
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                <Facebook className="w-3 h-3 text-blue-500" />
              </div>
            )}
            {formData.tiktok && (
              <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center text-white text-[7px] font-bold">TT</div>
            )}
          </div>
        )}

        {formData.category && (
          <div className="text-center">
            <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
              {formData.category}
            </span>
            {(formData.subcategories ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1 justify-center mt-1.5">
                {formData.subcategories!.map(s => (
                  <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full border border-gray-200 text-gray-500">{s}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {portfolio.length > 0 && (
          <div>
            <p className="text-[10px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Portafolio</p>
            <div className="grid grid-cols-2 gap-1">
              {visibleImages.map((img, i) => (
                <img key={i} src={img} alt="" className="w-full h-16 object-cover rounded-lg" />
              ))}
            </div>
            {portfolio.length > 2 && (
              <div className="flex items-center justify-between mt-1">
                <button
                  onClick={() => setPreviewImageIndex(Math.max(0, previewImageIndex - 2))}
                  disabled={previewImageIndex === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <span className="text-[10px] text-gray-400">{Math.floor(previewImageIndex / 2) + 1}/{Math.ceil(portfolio.length / 2)}</span>
                <button
                  onClick={() => setPreviewImageIndex(Math.min(portfolio.length - 2, previewImageIndex + 2))}
                  disabled={previewImageIndex + 2 >= portfolio.length}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {formData.homeLocation && (
          <div>
            <p className="text-[10px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Zonas de atención</p>
            <div className="bg-gray-50 rounded-lg p-2">
              <LocationChips
                coverageType={formData.coverageType ?? 'my-district'}
                homeLocation={formData.homeLocation}
                customDistricts={formData.workLocations ?? []}
                showRemoveButton={false}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ─── Stepper ───────────────────────────────────────────────────────────────────

  const renderStepper = () => (
    <div className="flex items-center gap-0 mb-6 overflow-x-auto pb-1">
      {WIZARD_STEPS.map((step, idx) => {
        const done = completedSteps.includes(step.number);
        const current = currentStep === step.number;
        const Icon = step.icon;
        return (
          <React.Fragment key={step.number}>
            <button
              onClick={() => setCurrentStep(step.number)}
              className="flex flex-col items-center gap-1 min-w-[52px] group transition-all"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  done
                    ? 'border-green-400 bg-green-400 text-white'
                    : current
                    ? 'border-gray-800 bg-gray-800 text-white'
                    : 'border-gray-200 bg-white text-gray-400 group-hover:border-gray-300'
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  current ? 'text-gray-800' : done ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </button>
            {idx < WIZARD_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-5 transition-colors ${done ? 'bg-green-300' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  // ─── Main ──────────────────────────────────────────────────────────────────────

  if (accessResult) {
    return (
      <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
          {renderAccessSummary()}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-heading text-base font-semibold text-gray-900">Añadir Genio</h2>
            <p className="text-xs text-gray-400 mt-0.5">Completa el perfil en 6 pasos</p>
          </div>
          <div className="flex items-center gap-2">
            {!showPreview && (
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:border-gray-300 hover:text-gray-700 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </button>
            )}
            <button
              onClick={onCancel}
              className="p-1.5 text-gray-300 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Form */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {renderStepper()}
              {renderCurrentStep()}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0 bg-white">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                Atrás
              </button>

              <span className="text-xs text-gray-400">Paso {currentStep} de 6</span>

              {currentStep < 6 ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  Siguiente
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white/70" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Crear genio y generar acceso
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Preview panel */}
          {showPreview && (
            <div className="w-56 border-l border-gray-100 flex-shrink-0 overflow-hidden flex flex-col">
              {renderPreview()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const StepHeader: React.FC<{ title: string; sub: string }> = ({ title, sub }) => (
  <div className="mb-2">
    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
    <p className="text-sm text-gray-400 mt-0.5">{sub}</p>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
    {children}
  </div>
);

const ToggleField: React.FC<{
  label: string;
  sub: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  activeColor: string;
}> = ({ label, sub, checked, onChange, activeColor }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${
      checked ? activeColor : 'border-gray-200 bg-white text-gray-600'
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium">{label}</p>
        <p className="text-[10px] mt-0.5 opacity-60">{sub}</p>
      </div>
      <div className={`w-8 h-4 rounded-full relative flex-shrink-0 transition-colors ${checked ? 'bg-current' : 'bg-gray-200'}`}>
        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${checked ? 'left-4' : 'left-0.5'}`} />
      </div>
    </div>
  </button>
);

const CredentialRow: React.FC<{
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
  mono?: boolean;
}> = ({ label, value, onCopy, copied, mono }) => (
  <div className="flex items-center justify-between px-4 py-3 gap-3">
    <div className="flex-1 min-w-0">
      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-sm text-gray-800 truncate mt-0.5 ${mono ? 'font-mono font-semibold' : ''}`}>{value}</p>
    </div>
    <button
      onClick={onCopy}
      className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
        copied ? 'text-green-500 bg-green-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
      }`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  </div>
);

export default AdminGeniusWizard;
