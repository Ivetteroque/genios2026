import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../utils/authUtils';
import { getGeniusProfile, convertGeniusProfileToGenius } from '../services/supabaseGeniusService';
import { getAvailabilitySummary, getTodayAvailability } from '../services/supabaseAvailabilityService';
import {
  getLatestPaymentRequest,
  getMembership,
  isMembershipActive,
  daysUntil,
  type Membership,
  type PaymentRequestSummary,
} from '../services/membershipService';
import { calculateProfileCompletion } from '../utils/profileCompletionUtils';
import LoadingSpinner from './LoadingSpinner';
import DashboardSidebar from './DashboardSidebar';
import ProfileSection from './ProfileSection';
import AvailabilitySection from './AvailabilitySection';
import SubscriptionSection from './SubscriptionSection';
import GeniusAvailabilityCalendar from './GeniusAvailabilityCalendar';
import GeniusProfileWizard from './GeniusProfileWizard';
import GeniusFavoritesSection from './GeniusFavoritesSection';
import Modal from './Modal';

interface GeniusDashboardProps {
  onEditProfile: () => void;
  onConfigureCalendar: () => void;
}

interface GeniusProfile {
  id: string;
  profile_photo: string;
  full_name: string;
  dni: string;
  email: string;
  phone: string;
  description: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  category: string;
  subcategories: any[];
  service_name: string;
  home_location: any;
  coverage_type: string;
  work_locations: any[];
  portfolio: any[];
  documents: any[];
  status?: 'active' | 'suspended';
  suspension_reason?: string;
  verification_status?: 'none' | 'pending' | 'verified' | 'rejected';
  verification_note?: string;
}

// onEditProfile / onConfigureCalendar siguen en las props (el contenedor las
// pasa), pero el panel maneja el asistente y el calendario por su cuenta.
const GeniusDashboard: React.FC<GeniusDashboardProps> = () => {
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [loading, setLoading] = useState(true);
  const [geniusProfile, setGeniusProfile] = useState<GeniusProfile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [latestRequest, setLatestRequest] = useState<PaymentRequestSummary | null>(null);
  const [todayStatus, setTodayStatus] = useState<'available' | 'full' | 'vacation'>('available');
  const [activeSection, setActiveSection] = useState<'profile' | 'availability' | 'subscription' | 'favorites'>('profile');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [pendingSection, setPendingSection] = useState<'profile' | 'availability' | 'subscription' | 'favorites' | null>(null);
  const [showSectionChangeModal, setShowSectionChangeModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      const profile = await getGeniusProfile(currentUser.id);

      if (profile) {
        setGeniusProfile(profile);

        const [membershipData, requestData] = await Promise.all([
          getMembership(profile.id),
          getLatestPaymentRequest(profile.id),
        ]);
        setMembership(membershipData);
        setLatestRequest(requestData);

        const today = await getTodayAvailability(profile.id);
        if (today) {
          setTodayStatus(today.status as 'available' | 'full' | 'vacation');
        } else {
          setTodayStatus('available');
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysRemaining = (): number =>
    isMembershipActive(membership) ? daysUntil(membership.ends_at) : 0;

  const handleSectionChange = (section: 'profile' | 'availability' | 'subscription' | 'favorites') => {
    if (showWizard) {
      setPendingSection(section);
      setShowSectionChangeModal(true);
    } else {
      setActiveSection(section);
      setShowCalendar(false);
    }
  };

  const handleWizardComplete = async () => {
    setShowWizard(false);
    await loadDashboardData();
  };

  const handleWizardCancel = () => {
    setShowWizard(false);
  };

  const handleConfirmSectionChange = () => {
    if (pendingSection) {
      setShowWizard(false);
      setActiveSection(pendingSection);
      setPendingSection(null);
      setShowSectionChangeModal(false);
      setShowCalendar(false);
    }
  };

  const handleCancelSectionChange = () => {
    setPendingSection(null);
    setShowSectionChangeModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const profileCompletion = calculateProfileCompletion(geniusProfile);
  const daysRemaining = calculateDaysRemaining();

  // Por qué el perfil no aparece en las búsquedas, si es el caso.
  const visibilityNotice: { text: string; tone: 'danger' | 'warning'; action?: string } | null =
    !geniusProfile
      ? null
      : geniusProfile.status === 'suspended'
        ? {
            tone: 'danger',
            text: `Tu perfil está suspendido y no aparece en las búsquedas.${
              geniusProfile.suspension_reason ? ` Motivo: ${geniusProfile.suspension_reason}.` : ''
            } Escríbenos por WhatsApp para revisarlo.`,
          }
        : !isMembershipActive(membership)
          ? {
              tone: 'warning',
              text: latestRequest?.status === 'pending'
                ? 'Estamos revisando tu comprobante. Tu perfil aparecerá en las búsquedas en cuanto lo aprobemos.'
                : 'Tu perfil todavía no aparece en las búsquedas: activa tu acceso con un código de invitación.',
              action: latestRequest?.status === 'pending' ? undefined : 'Activar acceso',
            }
          : null;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 pt-20">
      <DashboardSidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        geniusProfile={geniusProfile}
      />

      <div className="flex-1 min-w-0">
        <main className="p-4 sm:p-6 lg:p-8">
          {visibilityNotice && activeSection !== 'subscription' && (
            <div
              role="status"
              className={`max-w-3xl mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border p-4 ${
                visibilityNotice.tone === 'danger' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'
              }`}
            >
              <p className={`flex-1 text-sm ${visibilityNotice.tone === 'danger' ? 'text-red-700' : 'text-amber-800'}`}>
                {visibilityNotice.text}
              </p>
              {visibilityNotice.action && (
                <button
                  onClick={() => handleSectionChange('subscription')}
                  className="shrink-0 bg-white border border-amber-200 hover:border-amber-300 text-amber-800 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  {visibilityNotice.action}
                </button>
              )}
            </div>
          )}

          {activeSection === 'profile' && !showWizard && geniusProfile?.verification_status === 'rejected' && (
            <div role="status" className="max-w-3xl mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              No pudimos verificar tu DNI
              {geniusProfile.verification_note ? `: ${geniusProfile.verification_note}` : '.'} Sube uno nuevo desde
              “Completar perfil” para obtener la insignia de verificado.
            </div>
          )}

          {activeSection === 'profile' && (
            <>
              {!showWizard ? (
                <ProfileSection
                  percentage={profileCompletion}
                  onCompleteProfile={() => setShowWizard(true)}
                />
              ) : (
                <div className="max-w-5xl min-w-0">
                  <GeniusProfileWizard
                    initialData={geniusProfile ? convertGeniusProfileToGenius(geniusProfile) : undefined}
                    onComplete={handleWizardComplete}
                    onCancel={handleWizardCancel}
                  />
                </div>
              )}
            </>
          )}

          {activeSection === 'availability' && (
            <>
              {showCalendar ? (
                <div className="max-w-4xl">
                  <GeniusAvailabilityCalendar onClose={() => setShowCalendar(false)} />
                </div>
              ) : (
                <AvailabilitySection
                  status={todayStatus}
                  daysRemaining={daysRemaining}
                  onChangeAvailability={() => setShowCalendar(true)}
                />
              )}
            </>
          )}

          {activeSection === 'subscription' && (
            <SubscriptionSection
              geniusEmail={geniusProfile?.email ?? currentUser?.email ?? ''}
              membership={membership}
              latestRequest={latestRequest}
              onChanged={loadDashboardData}
            />
          )}

          {activeSection === 'favorites' && (
            <GeniusFavoritesSection />
          )}
        </main>
      </div>

      <Modal
        isOpen={showSectionChangeModal}
        onClose={handleCancelSectionChange}
        title="¿Quieres cambiar de sección?"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Tu progreso se guardará automáticamente. Puedes continuar editando tu perfil más tarde.
        </p>
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button
            onClick={handleCancelSectionChange}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
          >
            Quedarme aquí
          </button>
          <button
            onClick={handleConfirmSectionChange}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Cambiar de sección
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default GeniusDashboard;