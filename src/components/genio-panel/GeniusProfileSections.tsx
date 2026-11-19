import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Camera, ExternalLink, FileCheck2, Images, Pencil, UserRound } from 'lucide-react';
import type { PanelGeniusProfile } from './types';

/**
 * "Mi perfil" por partes: cada tarjeta muestra lo que hay y tiene su botón
 * Editar. Cambiar la foto o la descripción ya no obliga a recorrer los 5
 * pasos del formulario.
 */

interface GeniusProfileSectionsProps {
  profile: PanelGeniusProfile;
  onEditStep: (step: number) => void;
}

const VERIFICATION: Record<string, { label: string; cls: string }> = {
  verified: { label: 'Verificado', cls: 'bg-green-50 text-green-700' },
  pending: { label: 'En revisión', cls: 'bg-amber-50 text-amber-700' },
  rejected: { label: 'Rechazado: vuelve a subirlo', cls: 'bg-red-50 text-red-700' },
  none: { label: 'Sin subir', cls: 'bg-gray-100 text-gray-600' },
};

const GeniusProfileSections: React.FC<GeniusProfileSectionsProps> = ({ profile, onEditStep }) => {
  const verification = VERIFICATION[profile.verification_status ?? 'none'] ?? VERIFICATION.none;
  const location = [profile.home_location?.districtName, profile.home_location?.provinceName].filter(Boolean).join(', ');
  const socials = [profile.instagram && 'Instagram', profile.facebook && 'Facebook', profile.tiktok && 'TikTok'].filter(Boolean);

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Mi perfil</h2>
          <p className="text-sm text-gray-600 mt-1">Toca “Editar” en la parte que quieras cambiar.</p>
        </div>
        <Link
          to={`/profile/${profile.id}`}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-800"
        >
          <ExternalLink className="w-4 h-4" />
          Ver cómo me ven los clientes
        </Link>
      </div>

      <SectionCard icon={UserRound} title="Foto y datos de contacto" onEdit={() => onEditStep(1)}>
        <div className="flex items-center gap-3">
          {profile.profile_photo
            ? <img src={profile.profile_photo} alt="" className="w-14 h-14 rounded-full object-cover" />
            : <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center"><Camera className="w-5 h-5 text-gray-400" /></div>}
          <div className="text-sm text-gray-700 min-w-0">
            <p className="font-medium text-gray-900 truncate">{profile.full_name}</p>
            <p>+51 {profile.phone}</p>
            {location && <p className="text-gray-500">{location}</p>}
          </div>
        </div>
      </SectionCard>

      <SectionCard icon={Pencil} title="Sobre mí" onEdit={() => onEditStep(2)}>
        <p className="text-sm text-gray-700 line-clamp-3">{profile.description || 'Todavía no escribiste nada.'}</p>
        <p className="text-xs text-gray-500 mt-2">Redes: {socials.length ? socials.join(', ') : 'ninguna'}</p>
      </SectionCard>

      <SectionCard icon={Briefcase} title="Tu servicio y zona de trabajo" onEdit={() => onEditStep(3)}>
        <p className="text-sm font-medium text-gray-900">{profile.service_name || 'Sin nombre de servicio'}</p>
        <p className="text-sm text-gray-600">{profile.category}</p>
        {profile.subcategories?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {profile.subcategories.map((s) => (
              <span key={s} className="text-xs bg-blue-50 text-blue-700 rounded-full px-2.5 py-1">{s}</span>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard icon={Images} title="Fotos de tus trabajos" onEdit={() => onEditStep(4)} editLabel={profile.portfolio?.length ? 'Editar' : 'Subir fotos'}>
        {profile.portfolio?.length ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {profile.portfolio.slice(0, 6).map((src) => (
              <img key={src} src={src} alt="" className="aspect-square w-full rounded-lg object-cover" />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">Los perfiles con fotos reciben muchas más consultas. Sube al menos 3.</p>
        )}
      </SectionCard>

      <SectionCard icon={FileCheck2} title="Verificación de identidad" onEdit={() => onEditStep(5)}
        editLabel={profile.verification_status === 'none' || profile.verification_status === 'rejected' ? 'Subir DNI' : 'Ver'}>
        <span className={`inline-block text-xs font-medium rounded-full px-2.5 py-1 ${verification.cls}`}>{verification.label}</span>
        {profile.verification_status === 'rejected' && profile.verification_note && (
          <p className="text-sm text-red-600 mt-2">Motivo: {profile.verification_note}</p>
        )}
        <p className="text-xs text-gray-500 mt-2">Tu DNI nunca se muestra en tu perfil; solo lo ve nuestro equipo.</p>
      </SectionCard>
    </div>
  );
};

const SectionCard: React.FC<{
  icon: React.FC<{ className?: string }>;
  title: string;
  onEdit: () => void;
  editLabel?: string;
  children: React.ReactNode;
}> = ({ icon: Icon, title, onEdit, editLabel = 'Editar', children }) => (
  <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
    <div className="flex items-center justify-between gap-3 mb-3">
      <h3 className="flex items-center gap-2 font-semibold text-gray-900">
        <Icon className="w-5 h-5 text-gray-400" />
        {title}
      </h3>
      <button onClick={onEdit} className="shrink-0 text-sm font-medium text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50">
        {editLabel}
      </button>
    </div>
    {children}
  </section>
);

export default GeniusProfileSections;
