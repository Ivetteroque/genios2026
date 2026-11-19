import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, Ban, CheckCircle2, Circle, Clock, Copy, Eye, Heart, MessageCircle, Plane, Share2, Sparkles, Star,
} from 'lucide-react';
import type { AvailabilityStatus } from '../../services/supabaseAvailabilityService';
import {
  EXPIRING_SOON_DAYS, daysUntil, isMembershipActive, type Membership, type PaymentRequestSummary,
} from '../../services/membershipService';
import { publicProfileUrl, shareProfile, type GeniusStats } from '../../services/geniusPanelService';
import { showToast } from '../../utils/toast';
import type { GenioSection, PanelGeniusProfile, ProfilePart } from './types';

/**
 * Inicio del panel: responde lo que el genio quiere saber al entrar.
 * ¿Me pueden encontrar? ¿Estoy disponible hoy? ¿Me está sirviendo?
 * Y le da dos formas de crecer: compartir su perfil y completar pendientes.
 */

const SUPPORT_WHATSAPP = '51952719641';

interface GeniusHomeProps {
  profile: PanelGeniusProfile;
  membership: Membership | null;
  latestRequest: PaymentRequestSummary | null;
  stats: GeniusStats | null;
  todayStatus: AvailabilityStatus;
  onSetToday: (status: AvailabilityStatus) => void;
  onGo: (section: GenioSection) => void;
  onEdit: (part: ProfilePart) => void;
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'long' });
const firstName = (name: string) => (name || '').trim().split(/\s+/)[0] || 'genio';

const GeniusHome: React.FC<GeniusHomeProps> = ({
  profile, membership, latestRequest, stats, todayStatus, onSetToday, onGo, onEdit,
}) => {
  const active = isMembershipActive(membership);
  // Copia sin estrechar: en las ramas "no activa" TypeScript daría membership
  // por nula, pero puede existir vencida.
  const anyMembership: Membership | null = membership;
  const pending = latestRequest?.status === 'pending';
  const days = active && membership ? daysUntil(membership.ends_at) : 0;
  const shareText = `¡Hola! Ahora puedes encontrarme en Genios como ${profile.service_name || profile.category}. Escríbeme por WhatsApp desde aquí:`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicProfileUrl(profile.id));
      showToast('Enlace copiado');
    } catch {
      showToast('No se pudo copiar el enlace', 'error');
    }
  };

  // ─── Estado de visibilidad ──────────────────────────────────────────────
  let statusCard: React.ReactNode;
  if (profile.status === 'suspended') {
    statusCard = (
      <StatusCard tone="danger" icon={Ban} title="Tu perfil está suspendido"
        text={profile.suspension_reason ? `Motivo: ${profile.suspension_reason}` : 'No aparece en las búsquedas por ahora.'}
        action={<a className="underline font-medium" target="_blank" rel="noopener noreferrer"
          href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent('Hola, mi perfil de genio aparece suspendido y quisiera revisarlo.')}`}>Escribirnos</a>} />
    );
  } else if (active && membership) {
    statusCard = (
      <StatusCard tone="success" icon={Eye} title="Tu perfil está visible"
        text={membership.type === 'beta' ? `Acceso beta · quedan ${days} ${days === 1 ? 'día' : 'días'}` : `Plan anual · hasta el ${fmtDate(membership.ends_at)}`}
        action={<Link className="underline font-medium" to={`/profile/${profile.id}`}>Ver cómo me ven</Link>} />
    );
  } else if (pending) {
    statusCard = (
      <StatusCard tone="warning" icon={Clock} title="Estamos revisando tu pago"
        text={anyMembership && anyMembership.status !== 'suspended'
          ? 'Sigues visible mientras lo revisamos. Normalmente en menos de 24 horas.'
          : 'Apenas lo aprobemos, apareces en las búsquedas. Normalmente en menos de 24 horas.'} />
    );
  } else {
    statusCard = (
      <StatusCard tone="warning" icon={AlertTriangle} title="Todavía no apareces en las búsquedas"
        text={anyMembership ? 'Tu acceso terminó. Renuévalo para que los clientes vuelvan a encontrarte.' : 'Activa tu perfil con tu código de invitación.'}
        action={<button onClick={() => onGo('plan')} className="underline font-medium">{anyMembership ? 'Renovar' : 'Activar mi perfil'}</button>} />
    );
  }

  // ─── Pendientes ─────────────────────────────────────────────────────────
  const portfolioCount = profile.portfolio?.length ?? 0;
  const tasks: { done: boolean; label: string; cta: string; onClick: () => void; note?: string }[] = [
    { done: !!profile.profile_photo, label: 'Foto de perfil', cta: 'Agregar', onClick: () => onEdit('photo') },
    { done: (profile.description ?? '').trim().length >= 80, label: 'Cuéntales sobre ti y tu experiencia', cta: 'Escribir', onClick: () => onEdit('about') },
    { done: portfolioCount >= 3, label: `Sube 3 fotos de tus trabajos (${Math.min(portfolioCount, 3)}/3)`, cta: 'Subir', onClick: () => onEdit('portfolio') },
    {
      done: profile.verification_status === 'verified',
      label: 'Verifica tu DNI',
      cta: profile.verification_status === 'rejected' ? 'Volver a subir' : 'Subir',
      note: profile.verification_status === 'pending' ? 'En revisión' : undefined,
      onClick: () => onEdit('identity'),
    },
    { done: !!(profile.instagram || profile.facebook || profile.tiktok), label: 'Agrega tus redes sociales', cta: 'Agregar', onClick: () => onEdit('about') },
    {
      done: (stats?.reviews_count ?? 0) > 0,
      label: 'Consigue tu primera reseña',
      cta: 'Pedir',
      onClick: () => shareProfile(profile.id, '¡Hola! Si te gustó mi trabajo, ¿me dejas una reseña en mi perfil de Genios? Me ayuda muchísimo:'),
    },
  ];
  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-text">Hola, {firstName(profile.full_name)}</h2>
        <p className="text-sm text-text/65">{[profile.service_name || profile.category, profile.home_location?.districtName].filter(Boolean).join(' · ')}</p>
      </div>

      {statusCard}

      {active && days <= EXPIRING_SOON_DAYS && profile.status !== 'suspended' && !pending && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-secondary bg-surface-rose p-4">
          <p className="flex-1 text-sm text-ink-rose">
            Tu acceso termina en <strong>{days} {days === 1 ? 'día' : 'días'}</strong>. Renuévalo para no dejar de aparecer.
          </p>
          <button onClick={() => onGo('plan')} className="shrink-0 bg-white border border-secondary text-ink-rose text-sm font-medium px-4 py-2 rounded-xl">
            Ver Mi plan
          </button>
        </div>
      )}

      {/* Hoy */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
        <p className="text-sm text-text/65 mb-2">Hoy estoy</p>
        {todayStatus === 'vacation' ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border-2 bg-gray-100 border-gray-300 text-gray-700 px-4 py-3">
            <span className="flex items-center gap-2 font-semibold"><Plane className="w-5 h-5" /> De vacaciones</span>
            <button onClick={() => onSetToday('available')} className="text-sm underline">Volver a disponible</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Disponibilidad de hoy">
            {([
              { value: 'available', label: 'Disponible', icon: CheckCircle2, on: 'border-primary bg-primary/25 text-ink-blue' },
              { value: 'full', label: 'Ocupado', icon: Clock, on: 'border-secondary bg-surface-rose text-ink-rose' },
            ] as const).map(({ value, label, icon: Icon, on }) => (
              <button
                key={value}
                role="radio"
                aria-checked={todayStatus === value}
                onClick={() => todayStatus !== value && onSetToday(value)}
                className={`flex items-center justify-center gap-2 h-12 rounded-xl border-2 font-semibold transition-colors ${
                  todayStatus === value ? on : 'border-gray-100 text-text/55 hover:border-gray-200'
                }`}
              >
                <Icon className="w-5 h-5" /> {label}
              </button>
            ))}
          </div>
        )}
        <button onClick={() => onGo('agenda')} className="mt-3 text-sm text-ink-blue underline underline-offset-2">
          Ver mi agenda
        </button>
      </section>

      {/* Números */}
      {stats && (
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
          <p className="text-sm text-text/65 mb-3">Desde que estás en Genios</p>
          <div className="grid grid-cols-3 gap-2">
            <Metric icon={Eye} value={stats.profile_views} label="vieron tu perfil" />
            <Metric icon={MessageCircle} value={stats.whatsapp_clicks} label="te escribieron" />
            <Metric icon={Heart} value={stats.favorites} label="te guardaron" />
          </div>
          {stats.reviews_count > 0 && (
            <p className="flex items-center gap-1.5 text-sm text-text/80 mt-3">
              <Star className="w-4 h-4 text-amber-500" />
              <strong>{Number(stats.rating_avg ?? 0).toFixed(1)}</strong> de 5 · {stats.reviews_count} {stats.reviews_count === 1 ? 'reseña' : 'reseñas'}
            </p>
          )}
        </section>
      )}

      {/* Compartir */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
        <p className="font-semibold text-text">Comparte tu perfil</p>
        <p className="text-sm text-text/65 mb-3">Ponlo en tus estados de WhatsApp, en Instagram o mándalo a tus clientes.</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => shareProfile(profile.id, shareText)}
            className="flex items-center justify-center gap-2 h-11 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors">
            <Share2 className="w-4 h-4" /> Compartir
          </button>
          <button onClick={copyLink}
            className="flex items-center justify-center gap-2 h-11 rounded-xl border border-gray-200 hover:bg-surface-blue text-text/90 font-medium transition-colors">
            <Copy className="w-4 h-4" /> Copiar enlace
          </button>
        </div>
      </section>

      {/* Pendientes */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
        <div className="flex items-baseline justify-between">
          <p className="font-semibold text-text">{doneCount === tasks.length ? '¡Tu perfil está completo!' : 'Mejora tu perfil'}</p>
          <span className="text-sm text-text/55">{doneCount} de {tasks.length}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full my-3" aria-hidden="true">
          <div className="h-2 bg-ink-blue rounded-full transition-all" style={{ width: `${(doneCount / tasks.length) * 100}%` }} />
        </div>
        {doneCount < tasks.length ? (
          <ul className="divide-y divide-gray-50">
            {tasks.map((t) => (
              <li key={t.label} className="flex items-center gap-3 py-2.5">
                {t.done
                  ? <CheckCircle2 className="w-5 h-5 text-ink-blue shrink-0" />
                  : <Circle className="w-5 h-5 text-gray-300 shrink-0" />}
                <span className={`flex-1 text-sm ${t.done ? 'text-gray-400 line-through' : 'text-text/90'}`}>{t.label}</span>
                {!t.done && (t.note
                  ? <span className="text-xs font-medium text-ink-blue bg-primary/25 rounded-full px-2.5 py-1">{t.note}</span>
                  : <button onClick={t.onClick} className="text-sm font-medium text-ink-blue px-2 py-1 rounded-lg hover:bg-surface-blue">{t.cta}</button>)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-2 text-sm text-text/65"><Sparkles className="w-4 h-4 text-amber-500" /> Los perfiles completos reciben más consultas. ¡Bien hecho!</p>
        )}
      </section>
    </div>
  );
};

// ─── Piezas ──────────────────────────────────────────────────────────────

const TONES = {
  success: 'bg-primary/25 border-primary text-ink-blue',
  warning: 'bg-surface-rose border-secondary text-ink-rose',
  danger: 'bg-red-50 border-red-200 text-red-900',
};

const StatusCard: React.FC<{
  tone: keyof typeof TONES;
  icon: React.FC<{ className?: string }>;
  title: string;
  text: string;
  action?: React.ReactNode;
}> = ({ tone, icon: Icon, title, text, action }) => (
  <div role="status" className={`flex items-start gap-3 rounded-2xl border p-4 ${TONES[tone]}`}>
    <Icon className="w-6 h-6 shrink-0 mt-0.5" />
    <div className="flex-1 min-w-0">
      <p className="font-semibold">{title}</p>
      <p className="text-sm opacity-90">{text}</p>
      {action && <div className="mt-2 text-sm">{action}</div>}
    </div>
  </div>
);

const Metric: React.FC<{ icon: React.FC<{ className?: string }>; value: number; label: string }> = ({ icon: Icon, value, label }) => (
  <div className="rounded-xl bg-surface-blue p-3">
    <Icon className="w-4 h-4 text-gray-400 mb-1" />
    <p className="font-heading text-2xl font-semibold text-text leading-tight">{value}</p>
    <p className="text-xs text-text/65">{label}</p>
  </div>
);

export default GeniusHome;
