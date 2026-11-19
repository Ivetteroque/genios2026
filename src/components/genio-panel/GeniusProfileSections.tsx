import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Camera, ChevronRight, ExternalLink, Images, Lock, MapPin, Phone, Pencil } from 'lucide-react';
import type { PanelGeniusProfile, ProfilePart } from './types';

/**
 * "Mi perfil" como una lista ordenada, al estilo de los ajustes del celular:
 * cada fila es una parte del perfil con un resumen corto; tocarla abre solo
 * esa parte. Separado en "lo que ven los clientes" y "privado".
 */

interface GeniusProfileSectionsProps {
  profile: PanelGeniusProfile;
  onEdit: (part: ProfilePart) => void;
}

const VERIFICATION: Record<string, { label: string; cls: string }> = {
  verified: { label: 'Verificado', cls: 'bg-ink-blue text-white' },
  pending: { label: 'En revisión', cls: 'bg-primary/25 text-ink-blue' },
  rejected: { label: 'Vuelve a subirlo', cls: 'bg-red-50 text-red-700' },
  none: { label: 'Sin verificar', cls: 'bg-gray-100 text-text/65' },
};

const GeniusProfileSections: React.FC<GeniusProfileSectionsProps> = ({ profile, onEdit }) => {
  const verification = VERIFICATION[profile.verification_status ?? 'none'] ?? VERIFICATION.none;
  const zone = [profile.home_location?.districtName, profile.home_location?.provinceName].filter(Boolean).join(', ');
  const photos = profile.portfolio?.length ?? 0;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-text">Mi perfil</h2>
        <p className="text-text/65 mt-1">Toca lo que quieras cambiar.</p>
      </div>

      <Group title="Lo que ven los clientes">
        <Row
          onClick={() => onEdit('photo')}
          leading={profile.profile_photo
            ? <img src={profile.profile_photo} alt="" className="w-10 h-10 rounded-full object-cover" />
            : <IconBubble icon={Camera} />}
          title="Foto"
          summary={profile.profile_photo ? 'Lista' : 'Agrega tu foto'}
          missing={!profile.profile_photo}
        />
        <Row onClick={() => onEdit('contact')} leading={<IconBubble icon={Phone} />} title="Nombre y celular"
          summary={`${profile.full_name || 'Sin nombre'} · +51 ${profile.phone || '—'}`} />
        <Row onClick={() => onEdit('about')} leading={<IconBubble icon={Pencil} />} title="Sobre mí"
          summary={profile.description?.trim() || 'Cuéntales quién eres'} missing={!profile.description?.trim()} />
        <Row onClick={() => onEdit('service')} leading={<IconBubble icon={Briefcase} />} title="Tu servicio"
          summary={profile.service_name || profile.category || 'Elige qué ofreces'} missing={!profile.category} />
        <Row onClick={() => onEdit('zone')} leading={<IconBubble icon={MapPin} />} title="Zona de trabajo"
          summary={zone || 'Elige tu distrito'} missing={!zone} />
        <Row onClick={() => onEdit('portfolio')} leading={<IconBubble icon={Images} />} title="Fotos de tus trabajos"
          summary={photos ? `${photos} ${photos === 1 ? 'foto' : 'fotos'}` : 'Sube al menos 3'} missing={photos < 3} />
      </Group>

      <Group title="Privado" note="Solo lo ve nuestro equipo.">
        <Row onClick={() => onEdit('identity')} leading={<IconBubble icon={Lock} />} title="DNI y correo"
          summary={<span className={`inline-block text-xs font-medium rounded-full px-2 py-0.5 ${verification.cls}`}>{verification.label}</span>} />
      </Group>

      <Link
        to={`/profile/${profile.id}`}
        className="flex items-center justify-center gap-2 h-12 rounded-xl border border-gray-200 bg-white hover:bg-surface-blue text-text/90 font-medium"
      >
        <ExternalLink className="w-4 h-4" />
        Ver cómo me ven los clientes
      </Link>
    </div>
  );
};

const Group: React.FC<{ title: string; note?: string; children: React.ReactNode }> = ({ title, note, children }) => (
  <section>
    <div className="flex items-baseline justify-between px-1 mb-2">
      <h3 className="text-sm font-semibold text-text/55">{title}</h3>
      {note && <span className="text-xs text-gray-400">{note}</span>}
    </div>
    <ul className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">{children}</ul>
  </section>
);

const IconBubble: React.FC<{ icon: React.FC<{ className?: string }> }> = ({ icon: Icon }) => (
  <span className="w-10 h-10 rounded-full bg-surface-blue flex items-center justify-center">
    <Icon className="w-5 h-5 text-text/55" />
  </span>
);

const Row: React.FC<{
  onClick: () => void;
  leading: React.ReactNode;
  title: string;
  summary: React.ReactNode;
  missing?: boolean;
}> = ({ onClick, leading, title, summary, missing }) => (
  <li>
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-surface-blue transition-colors">
      <span className="shrink-0">{leading}</span>
      <span className="flex-1 min-w-0">
        <span className="block font-medium text-text">{title}</span>
        <span className={`block text-sm truncate ${missing ? 'text-ink-rose' : 'text-text/55'}`}>{summary}</span>
      </span>
      <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
    </button>
  </li>
);

export default GeniusProfileSections;
