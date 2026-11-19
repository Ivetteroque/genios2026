import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import ImageUploadField from '../ImageUploadField';
import MultiImageUploadField from '../MultiImageUploadField';
import DocumentUploadField from '../DocumentUploadField';
import HierarchicalLocationSelector from '../HierarchicalLocationSelector';
import WorkZoneSelector from '../WorkZoneSelector';
import type { SelectedLocation } from '../FlexibleLocationSelector';
import { getActiveCategories } from '../../utils/categoryUtils';
import { CoverageType, HomeLocation, expandCoverageToDistricts } from '../../utils/locationUtils';
import { getCurrentUser } from '../../utils/authUtils';
import { Field, PrivateNote, inputClass, textareaClass } from './ui';
import type { PanelGeniusProfile, ProfilePart } from './types';

/**
 * Las partes del perfil del genio, compartidas por el formulario de alta y por
 * "Mi perfil": los mismos campos, las mismas reglas y los mismos textos.
 * Así entrar a Genios y editar después se sienten igual.
 */

export type Doc = { id?: string; name: string; type: string; url: string; uploadedAt: string; verified: boolean };

/** Todo lo que el genio llena, en un solo objeto. */
export interface ProfileDraft {
  profile_photo: string;
  full_name: string;
  phone: string;
  description: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  category: string;
  subcategories: string[];
  service_name: string;
  home_location: HomeLocation | null;
  coverage_type: CoverageType;
  custom_districts: SelectedLocation[];
  portfolio: string[];
  dni: string;
  email: string;
  documents: Doc[];
}

/** Genios es de Tacna: departamento y provincia ya elegidos; el distrito, no. */
export const TACNA_HOME: HomeLocation = {
  departmentId: 'tacna', departmentName: 'Tacna', provinceId: 'tacna-prov', provinceName: 'Tacna', districtId: '', districtName: '',
};

export const emptyDraft = (name = '', email = ''): ProfileDraft => ({
  profile_photo: '', full_name: name, phone: '', description: '', instagram: '', facebook: '', tiktok: '',
  category: '', subcategories: [], service_name: '', home_location: { ...TACNA_HOME }, coverage_type: 'my-district',
  custom_districts: [], portfolio: [], dni: '', email, documents: [],
});

export const draftFromProfile = (p: PanelGeniusProfile): ProfileDraft => ({
  profile_photo: p.profile_photo ?? '',
  full_name: p.full_name ?? '',
  phone: p.phone ?? '',
  description: p.description ?? '',
  instagram: p.instagram ?? '',
  facebook: p.facebook ?? '',
  tiktok: p.tiktok ?? '',
  category: p.category ?? '',
  subcategories: p.subcategories ?? [],
  service_name: p.service_name ?? '',
  home_location: (p.home_location as HomeLocation | null) ?? null,
  coverage_type: (p.coverage_type as CoverageType) || 'my-district',
  custom_districts: p.coverage_type === 'custom'
    ? ((p.work_locations ?? []) as HomeLocation[]).map((d) => ({ ...d, fullName: d.districtName, type: 'district' as const }))
    : [],
  portfolio: p.portfolio ?? [],
  dni: p.dni ?? '',
  email: p.email ?? '',
  documents: (p.documents ?? []) as Doc[],
});

/** Qué falta en una parte, en palabras simples (vacío = está bien). */
export const validatePart = (part: ProfilePart, d: ProfileDraft): Record<string, string> => {
  const e: Record<string, string> = {};
  if (part === 'photo' && !d.profile_photo) e.photo = 'Sube una foto para continuar.';
  if (part === 'contact') {
    if (!d.full_name.trim()) e.name = 'Escribe tu nombre.';
    if (d.phone.length !== 9) e.phone = 'Tu celular debe tener 9 números.';
  }
  if (part === 'about' && d.description.trim().length < 20) e.description = 'Escribe al menos un par de frases (20 letras o más).';
  if (part === 'service') {
    if (!d.category) e.category = 'Elige una categoría.';
    if (d.subcategories.length === 0) e.subs = 'Elige al menos una especialidad.';
    if (!d.service_name.trim()) e.serviceName = 'Ponle un nombre a tu servicio.';
  }
  if (part === 'zone' && !d.home_location?.districtId) e.zone = 'Elige el distrito donde vives.';
  if (part === 'identity') {
    if (d.dni.length !== 8) e.dni = 'Tu DNI debe tener 8 números.';
    if (!/^\S+@\S+\.\S+$/.test(d.email.trim())) e.email = 'Escribe un correo válido.';
  }
  return e;
};

/** Columnas de genius_profiles que guarda cada parte. */
export const patchFor = (part: ProfilePart, d: ProfileDraft): Record<string, unknown> => {
  switch (part) {
    case 'photo': return { profile_photo: d.profile_photo };
    case 'contact': return { full_name: d.full_name.trim(), phone: d.phone };
    case 'about': return {
      description: d.description.trim(),
      instagram: d.instagram.trim() || null, facebook: d.facebook.trim() || null, tiktok: d.tiktok.trim() || null,
    };
    case 'service': return { category: d.category, subcategories: d.subcategories, service_name: d.service_name.trim() };
    case 'zone': return d.home_location ? {
      home_location: d.home_location,
      coverage_type: d.coverage_type,
      work_locations: expandCoverageToDistricts(d.home_location, d.coverage_type, d.custom_districts as never),
    } : {};
    case 'portfolio': return { portfolio: d.portfolio };
    case 'identity': return { dni: d.dni, email: d.email.trim(), documents: d.documents };
  }
};

/** Título y frase de ayuda de cada parte. */
export const PART_COPY: Record<ProfilePart, { title: string; subtitle: string }> = {
  photo: { title: 'Tu foto', subtitle: 'Es lo primero que ven los clientes.' },
  contact: { title: 'Nombre y celular', subtitle: 'Así te presentas y así te escriben los clientes.' },
  about: { title: 'Sobre mí', subtitle: 'Cuéntales a los clientes quién eres y qué haces bien.' },
  service: { title: 'Tu servicio', subtitle: 'Así te encuentran cuando buscan lo que haces.' },
  zone: { title: 'Zona de trabajo', subtitle: 'Dónde vives y hasta dónde vas a trabajar.' },
  portfolio: { title: 'Fotos de tus trabajos', subtitle: 'Muestra lo mejor que has hecho. Con 3 fotos o más recibes más consultas.' },
  identity: { title: 'Datos privados', subtitle: 'Nos ayudan a verificar que eres tú.' },
};

interface PartFieldsProps {
  part: ProfilePart;
  draft: ProfileDraft;
  set: (patch: Partial<ProfileDraft>) => void;
  /** Errores a mostrar (solo después de intentar guardar o seguir). */
  errors: Record<string, string>;
}

const userId = () => getCurrentUser()?.id ?? '';

/** Los campos de una parte. */
export const PartFields: React.FC<PartFieldsProps> = ({ part, draft, set, errors }) => {
  switch (part) {
    case 'photo':
      return (
        <>
          <ImageUploadField
            label="Foto de perfil"
            currentImage={draft.profile_photo}
            onImageChange={(url) => set({ profile_photo: url })}
            onImageRemove={() => set({ profile_photo: '' })}
            helpText="Que se vea tu cara, con buena luz y fondo simple."
            pathPrefix={userId()}
          />
          {errors.photo && <p role="alert" className="text-sm text-red-600">{errors.photo}</p>}
        </>
      );

    case 'contact':
      return (
        <>
          <Field label="Nombre" htmlFor="name" error={errors.name} hint="Como quieres que te conozcan.">
            <input id="name" className={inputClass(!!errors.name)} value={draft.full_name} autoComplete="name"
              onChange={(e) => set({ full_name: e.target.value })} />
          </Field>
          <Field label="Celular con WhatsApp" htmlFor="phone" error={errors.phone} hint="Aquí te llegan los mensajes de los clientes.">
            <div className="flex">
              <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-200 bg-surface-blue text-gray-600">+51</span>
              <input id="phone" className={`${inputClass(!!errors.phone)} rounded-l-none`} value={draft.phone}
                onChange={(e) => set({ phone: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                inputMode="numeric" autoComplete="tel-national" placeholder="987654321" />
            </div>
          </Field>
        </>
      );

    case 'about':
      return <AboutFields draft={draft} set={set} errors={errors} />;

    case 'service':
      return <ServiceFields draft={draft} set={set} errors={errors} />;

    case 'zone':
      return (
        <>
          <HierarchicalLocationSelector value={draft.home_location} onChange={(home) => set({ home_location: home })} />
          {errors.zone && <p role="alert" className="text-sm text-red-600 -mt-3">{errors.zone}</p>}
          {draft.home_location?.districtId && (
            <WorkZoneSelector
              homeLocation={draft.home_location}
              coverageType={draft.coverage_type}
              customDistricts={draft.custom_districts}
              onCoverageTypeChange={(t) => set({ coverage_type: t })}
              onCustomDistrictsChange={(c) => set({ custom_districts: c })}
            />
          )}
        </>
      );

    case 'portfolio':
      return (
        <MultiImageUploadField
          label="Tus fotos"
          currentImages={draft.portfolio}
          onImagesChange={(imgs) => set({ portfolio: imgs })}
          maxImages={6}
          helpText="Hasta 6 fotos. Mejor con buena luz y sin texto encima."
          pathPrefix={userId()}
        />
      );

    case 'identity': {
      const dniDoc = draft.documents.find((d) => d.type === 'dni');
      return (
        <>
          <PrivateNote>Nada de esta pantalla se muestra en tu perfil. Solo lo ve nuestro equipo.</PrivateNote>
          <Field label="Número de DNI" htmlFor="dni" error={errors.dni}>
            <input id="dni" className={inputClass(!!errors.dni)} value={draft.dni} inputMode="numeric" autoComplete="off"
              onChange={(e) => set({ dni: e.target.value.replace(/\D/g, '').slice(0, 8) })} placeholder="12345678" />
          </Field>
          <Field label="Correo" htmlFor="email" error={errors.email} hint="Para avisarte de tu cuenta.">
            <input id="email" type="email" className={inputClass(!!errors.email)} value={draft.email} autoComplete="email"
              onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <DocumentUploadField
            label="Foto de tu DNI (opcional, te da la insignia de verificado)"
            documentType="dni"
            currentDocument={dniDoc ? { id: dniDoc.id ?? 'dni', ...dniDoc } : undefined}
            onDocumentChange={(doc) => set({ documents: [...draft.documents.filter((d) => d.type !== 'dni'), { id: Date.now().toString(), ...doc }] })}
            onDocumentRemove={() => set({ documents: draft.documents.filter((d) => d.type !== 'dni') })}
            helpText="Una foto clara de tu DNI. Lo revisamos en menos de 24 horas."
          />
        </>
      );
    }
  }
};

const AboutFields: React.FC<Omit<PartFieldsProps, 'part'>> = ({ draft, set, errors }) => {
  const [showSocials, setShowSocials] = useState(!!(draft.instagram || draft.facebook || draft.tiktok));
  return (
    <>
      <Field label="Tu descripción" htmlFor="description" error={errors.description}
        hint={`${draft.description.length}/500 · Por ejemplo: tus años de experiencia y en qué te especializas.`}>
        <textarea id="description" className={textareaClass(!!errors.description)} value={draft.description} maxLength={500}
          onChange={(e) => set({ description: e.target.value })} placeholder="Soy maquilladora con 5 años de experiencia en novias y eventos…" />
      </Field>
      <div className="border-t border-gray-100 pt-5">
        <button type="button" onClick={() => setShowSocials((v) => !v)} aria-expanded={showSocials} className="w-full flex items-center justify-between text-left">
          <span className="text-sm font-medium text-gray-800">Redes sociales <span className="font-normal text-gray-400">(opcional)</span></span>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showSocials ? 'rotate-180' : ''}`} />
        </button>
        {showSocials && (
          <div className="space-y-4 mt-4">
            <Field label="Instagram" htmlFor="ig"><input id="ig" className={inputClass()} value={draft.instagram} onChange={(e) => set({ instagram: e.target.value })} placeholder="instagram.com/tu_usuario" /></Field>
            <Field label="Facebook" htmlFor="fb"><input id="fb" className={inputClass()} value={draft.facebook} onChange={(e) => set({ facebook: e.target.value })} placeholder="facebook.com/tu_pagina" /></Field>
            <Field label="TikTok" htmlFor="tt"><input id="tt" className={inputClass()} value={draft.tiktok} onChange={(e) => set({ tiktok: e.target.value })} placeholder="tiktok.com/@tu_usuario" /></Field>
          </div>
        )}
      </div>
    </>
  );
};

const ServiceFields: React.FC<Omit<PartFieldsProps, 'part'>> = ({ draft, set, errors }) => {
  const categories = useMemo(() => getActiveCategories(), []);
  const [limitHit, setLimitHit] = useState(false);
  const available = categories.find((c) => c.name === draft.category)?.subcategories.filter((s) => s.isActive !== false) ?? [];
  const toggle = (name: string) => {
    const subs = draft.subcategories;
    if (subs.includes(name)) { set({ subcategories: subs.filter((s) => s !== name) }); setLimitHit(false); return; }
    if (subs.length >= 4) { setLimitHit(true); return; }
    set({ subcategories: [...subs, name] });
  };
  return (
    <>
      <Field label="Categoría" htmlFor="category" error={errors.category}>
        <select id="category" className={inputClass(!!errors.category)} value={draft.category}
          onChange={(e) => { set({ category: e.target.value, subcategories: [] }); setLimitHit(false); }}>
          <option value="">Elige una categoría</option>
          {categories.map((c) => <option key={c.id} value={c.name}>{c.emoji} {c.name}</option>)}
        </select>
      </Field>
      {draft.category && (
        <Field label="Especialidades" error={errors.subs}
          hint={limitHit ? 'Puedes elegir hasta 4. Quita una para cambiarla.' : `Elige hasta 4 (${draft.subcategories.length}/4).`}>
          <div className="flex flex-wrap gap-2">
            {available.map((s) => {
              const on = draft.subcategories.includes(s.name);
              return (
                <button key={s.id} type="button" onClick={() => toggle(s.name)} aria-pressed={on}
                  className={`px-4 h-11 rounded-full border text-sm transition-colors ${on ? 'bg-primary border-primary text-text font-medium' : 'bg-white border-gray-200 text-gray-700 hover:border-primary'}`}>
                  {s.name}
                </button>
              );
            })}
          </div>
        </Field>
      )}
      <Field label="Nombre de tu servicio" htmlFor="serviceName" error={errors.serviceName} hint="Una frase corta que diga qué ofreces.">
        <input id="serviceName" className={inputClass(!!errors.serviceName)} value={draft.service_name}
          onChange={(e) => set({ service_name: e.target.value })} placeholder="Maquillaje para novias y eventos" />
      </Field>
    </>
  );
};
