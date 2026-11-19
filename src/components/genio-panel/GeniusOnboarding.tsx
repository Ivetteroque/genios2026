import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { getCurrentUser } from '../../utils/authUtils';
import { saveDraft, loadDraft, deleteDraft } from '../../services/supabaseGeniusService';
import { createMyGeniusProfile } from '../../services/geniusPanelService';
import WizardSuccess from '../WizardSuccess';
import { BottomBar, PageTitle, btnPrimary, btnSecondary } from './ui';
import {
  PART_COPY, PartFields, emptyDraft, patchFor, validatePart, TACNA_HOME, type Doc, type ProfileDraft,
} from './profileParts';
import type { ProfilePart } from './types';

/**
 * Formulario de alta del genio: una cosa por pantalla, en 7 pasos cortos.
 * Usa las mismas pantallas que "Mi perfil", así entrar y editar se sienten
 * igual. Se guarda un borrador solo, para retomar si se corta.
 */

// Lo fácil primero (nombre, servicio, zona); la foto cuando ya se siente avanzado.
const STEPS: ProfilePart[] = ['contact', 'service', 'zone', 'photo', 'about', 'portfolio', 'identity'];
const OPTIONAL: ProfilePart[] = ['portfolio'];
const DRAFT_VERSION = 2;

interface GeniusOnboardingProps {
  onComplete: () => void;
  onCancel: () => void;
}

/** Borradores del formulario anterior (camelCase) al formato nuevo. */
const fromLegacyDraft = (old: Record<string, unknown>, base: ProfileDraft): ProfileDraft => ({
  ...base,
  profile_photo: (old.profilePhoto as string) || base.profile_photo,
  full_name: (old.fullName as string) || base.full_name,
  phone: (old.phone as string) || '',
  description: (old.description as string) || '',
  instagram: (old.instagram as string) || '',
  facebook: (old.facebook as string) || '',
  tiktok: (old.tiktok as string) || '',
  category: (old.category as string) || '',
  subcategories: (old.subcategories as string[]) || [],
  service_name: (old.serviceName as string) || '',
  home_location: (old.homeLocation as ProfileDraft['home_location']) || { ...TACNA_HOME },
  coverage_type: (old.coverageType as ProfileDraft['coverage_type']) || 'my-district',
  portfolio: (old.portfolio as string[]) || [],
  dni: (old.dni as string) || '',
  email: (old.email as string) || base.email,
  documents: (old.documents as Doc[]) || [],
});

const GeniusOnboarding: React.FC<GeniusOnboardingProps> = ({ onComplete, onCancel }) => {
  const user = getCurrentUser();
  const [draft, setDraft] = useState<ProfileDraft>(() => emptyDraft(user?.name ?? '', user?.email ?? ''));
  const [stepIndex, setStepIndex] = useState(0);
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedProfileId, setSavedProfileId] = useState<string | null>(null);
  const loaded = useRef(false);

  const part = STEPS[stepIndex];
  const errors = tried ? validatePart(part, draft) : {};

  // Retomar un borrador, si lo hay: se abre en el primer paso pendiente.
  useEffect(() => {
    if (!user) return;
    loadDraft(user.id)
      .then((row) => {
        const data = row?.form_data as Record<string, unknown> | undefined;
        if (!data) return;
        const restored = data.v === DRAFT_VERSION
          ? { ...emptyDraft(user.name, user.email), ...(data.draft as ProfileDraft) }
          : fromLegacyDraft(data, emptyDraft(user.name, user.email));
        setDraft(restored);
        const firstPending = STEPS.findIndex((p) => !OPTIONAL.includes(p) && Object.keys(validatePart(p, restored)).length > 0);
        setStepIndex(firstPending === -1 ? STEPS.length - 1 : firstPending);
      })
      .catch((error) => console.error('Error cargando el borrador:', error))
      .finally(() => { loaded.current = true; });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Borrador automático (en silencio): si se corta, retoma donde iba.
  useEffect(() => {
    if (!user || !loaded.current || savedProfileId) return;
    const timer = setTimeout(() => {
      saveDraft(user.id, stepIndex + 1, { v: DRAFT_VERSION, draft }).catch((error) => console.error('Error guardando borrador:', error));
    }, 1500);
    return () => clearTimeout(timer);
  }, [draft, stepIndex, user, savedProfileId]);

  const goTo = (index: number) => {
    setTried(false);
    setStepIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const finish = async () => {
    if (!user) {
      setSaveError('Tu sesión expiró. Vuelve a iniciar sesión para terminar.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const fields = Object.assign({}, ...STEPS.map((p) => patchFor(p, draft)));
      const id = await createMyGeniusProfile(user.id, fields);
      await deleteDraft(user.id).catch(() => undefined);
      setSavedProfileId(id);
      window.scrollTo({ top: 0 });
    } catch (error) {
      console.error('Error creando el perfil:', error);
      setSaveError('No pudimos guardar tu perfil. Revisa tu conexión e inténtalo de nuevo; tus datos no se perdieron.');
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    setTried(true);
    if (Object.keys(validatePart(part, draft)).length > 0) {
      setTimeout(() => document.querySelector('[role="alert"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 50);
      return;
    }
    if (stepIndex < STEPS.length - 1) goTo(stepIndex + 1);
    else finish();
  };

  if (savedProfileId) {
    const optionalMissing = [
      draft.portfolio.length < 3 && 'Fotos de tus trabajos (3 o más)',
      !draft.documents.some((d) => d.type === 'dni') && 'Foto de tu DNI, para la insignia de verificado',
      !(draft.instagram || draft.facebook || draft.tiktok) && 'Tus redes sociales',
    ].filter(Boolean).map((field) => ({ field: field as string, step: 0, required: false }));
    return <WizardSuccess geniusProfileId={savedProfileId} missingFields={optionalMissing} onGoToPanel={onComplete} />;
  }

  const isLast = stepIndex === STEPS.length - 1;
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  return (
    <form className="max-w-xl mx-auto" onSubmit={(e) => { e.preventDefault(); next(); }} noValidate>
      {/* Avance */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-sm font-medium text-text/60">
          Tu perfil de genio · Paso {stepIndex + 1} de {STEPS.length}
          {OPTIONAL.includes(part) && <span className="text-text/40"> · opcional</span>}
        </p>
        <button type="button" onClick={onCancel} aria-label="Salir del formulario" className="p-2 -mr-2 rounded-lg text-text/40 hover:text-text hover:bg-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="h-1.5 bg-white rounded-full mb-6" aria-hidden="true">
        <div className="h-1.5 bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <PageTitle title={PART_COPY[part].title} subtitle={PART_COPY[part].subtitle} />

      <div className="mt-6 space-y-6 pb-32">
        <PartFields part={part} draft={draft} set={(patch) => setDraft((d) => ({ ...d, ...patch }))} errors={errors} />
        {saveError && <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{saveError}</p>}
        {OPTIONAL.includes(part) && (
          <button type="button" onClick={() => goTo(stepIndex + 1)} className="text-sm font-medium text-ink-blue underline underline-offset-4">
            Saltar por ahora
          </button>
        )}
      </div>

      <BottomBar withPanelNav={false}>
        {stepIndex > 0 && (
          <button type="button" onClick={() => goTo(stepIndex - 1)} className={`flex-1 sm:flex-none sm:px-6 ${btnSecondary}`}>Atrás</button>
        )}
        <button type="submit" disabled={saving} className={`flex-1 sm:flex-none sm:px-10 ${btnPrimary}`}>
          {saving ? 'Guardando…' : isLast ? 'Terminar' : 'Siguiente'}
        </button>
      </BottomBar>
    </form>
  );
};

export default GeniusOnboarding;
