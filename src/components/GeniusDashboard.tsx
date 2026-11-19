import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, CreditCard, Home, UserRound } from 'lucide-react';
import { getCurrentUser } from '../utils/authUtils';
import { getGeniusProfile, convertGeniusProfileToGenius } from '../services/supabaseGeniusService';
import { AvailabilityStatus, getTodayAvailability, setDayStatus } from '../services/supabaseAvailabilityService';
import {
  getLatestPaymentRequest,
  getMembership,
  type Membership,
  type PaymentRequestSummary,
} from '../services/membershipService';
import { getMyGeniusStats, type GeniusStats } from '../services/geniusPanelService';
import { localDateISO } from '../utils/dateUtils';
import { showToast } from '../utils/toast';
import LoadingSpinner from './LoadingSpinner';
import SubscriptionSection from './SubscriptionSection';
import GeniusAvailabilityCalendar from './GeniusAvailabilityCalendar';
import GeniusProfileWizard from './GeniusProfileWizard';
import GeniusHome from './genio-panel/GeniusHome';
import GeniusAgenda from './genio-panel/GeniusAgenda';
import GeniusProfileSections from './genio-panel/GeniusProfileSections';
import type { GenioSection, PanelGeniusProfile } from './genio-panel/types';

/**
 * Panel del genio: Inicio · Mi perfil · Agenda · Mi plan.
 * En el celular la navegación va abajo (al alcance del pulgar); en
 * computadora, a la izquierda.
 */

interface GeniusDashboardProps {
  onEditProfile: () => void;
  onConfigureCalendar: () => void;
}

const NAV: { id: GenioSection; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'profile', label: 'Mi perfil', icon: UserRound },
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'plan', label: 'Mi plan', icon: CreditCard },
];

const SECTION_TITLES: Record<number, string> = {
  1: 'Foto y datos de contacto',
  2: 'Sobre mí',
  3: 'Tu servicio y zona de trabajo',
  4: 'Fotos de tus trabajos',
  5: 'Verificación de identidad',
};

// onEditProfile / onConfigureCalendar siguen en las props (el contenedor las
// pasa), pero el panel maneja la edición y el calendario por su cuenta.
const GeniusDashboard: React.FC<GeniusDashboardProps> = () => {
  const [currentUser] = useState(getCurrentUser());
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PanelGeniusProfile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [latestRequest, setLatestRequest] = useState<PaymentRequestSummary | null>(null);
  const [stats, setStats] = useState<GeniusStats | null>(null);
  const [todayStatus, setTodayStatus] = useState<AvailabilityStatus>('available');
  const [section, setSection] = useState<GenioSection>('home');
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [showMonth, setShowMonth] = useState(false);

  const load = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    try {
      const row = await getGeniusProfile(currentUser.id);
      if (row) {
        setProfile(row as unknown as PanelGeniusProfile);
        const [m, r, s, today] = await Promise.all([
          getMembership(row.id),
          getLatestPaymentRequest(row.id),
          getMyGeniusStats(),
          getTodayAvailability(row.id),
        ]);
        setMembership(m);
        setLatestRequest(r);
        setStats(s);
        setTodayStatus((today?.status as AvailabilityStatus) ?? 'available');
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { load(); }, [load]);

  const go = (next: GenioSection) => {
    setSection(next);
    setEditingStep(null);
    setShowMonth(false);
    window.scrollTo({ top: 0 });
  };

  const editStep = (step: number) => {
    setSection('profile');
    setEditingStep(step);
    window.scrollTo({ top: 0 });
  };

  const setToday = async (status: AvailabilityStatus) => {
    if (!profile) return;
    const previous = todayStatus;
    setTodayStatus(status);
    try {
      await setDayStatus(profile.id, localDateISO(), status);
      showToast(status === 'available' ? 'Hoy apareces como disponible' : 'Hoy apareces como ocupado');
    } catch (error) {
      console.error('Error guardando el estado de hoy:', error);
      setTodayStatus(previous);
      showToast('No se pudo guardar. Revisa tu conexión.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-24 text-center text-gray-600">
        No encontramos tu perfil de genio. Recarga la página o vuelve a iniciar sesión.
      </div>
    );
  }

  let content: React.ReactNode;
  if (section === 'profile' && editingStep) {
    content = (
      <div className="max-w-3xl">
        <button onClick={() => setEditingStep(null)} className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-3">
          <ArrowLeft className="w-4 h-4" /> Volver a Mi perfil
        </button>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">{SECTION_TITLES[editingStep]}</h2>
        <GeniusProfileWizard
          key={editingStep}
          sectionStep={editingStep}
          initialData={convertGeniusProfileToGenius(profile as never)}
          onComplete={async () => { setEditingStep(null); await load(); }}
          onCancel={() => setEditingStep(null)}
        />
      </div>
    );
  } else if (section === 'profile') {
    content = <GeniusProfileSections profile={profile} onEditStep={editStep} />;
  } else if (section === 'agenda') {
    content = showMonth
      ? <div className="max-w-4xl"><GeniusAvailabilityCalendar onClose={() => { setShowMonth(false); load(); }} /></div>
      : <GeniusAgenda geniusId={profile.id} onOpenMonth={() => setShowMonth(true)} onTodayChange={setTodayStatus} />;
  } else if (section === 'plan') {
    content = (
      <SubscriptionSection
        geniusEmail={profile.email ?? currentUser?.email ?? ''}
        membership={membership}
        latestRequest={latestRequest}
        onChanged={load}
      />
    );
  } else {
    content = (
      <GeniusHome
        profile={profile}
        membership={membership}
        latestRequest={latestRequest}
        stats={stats}
        todayStatus={todayStatus}
        onSetToday={setToday}
        onGo={go}
        onEditStep={editStep}
      />
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 pt-20">
      {/* Navegación en computadora */}
      <aside className="hidden lg:flex lg:flex-col w-56 shrink-0 bg-white border-r border-gray-100 p-3 pt-6">
        <nav aria-label="Panel del genio" className="space-y-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => go(id)}
              aria-current={section === id ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] transition-colors ${
                section === id ? 'bg-blue-50 text-blue-800 font-semibold' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-28 lg:pb-8">{content}</main>

      {/* Navegación en el celular: abajo, como en cualquier app */}
      <nav
        aria-label="Panel del genio"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 grid grid-cols-4"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => go(id)}
            aria-current={section === id ? 'page' : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 h-16 text-xs font-medium ${
              section === id ? 'text-blue-700' : 'text-gray-500'
            }`}
          >
            <Icon className="w-6 h-6" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default GeniusDashboard;
