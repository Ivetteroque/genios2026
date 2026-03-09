import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../utils/authUtils';
import { getGeniusProfile } from '../services/supabaseGeniusService';
import { getAvailabilitySummary, getTodayAvailability } from '../services/supabaseAvailabilityService';
import { supabase } from '../lib/supabase';
import { calculateProfileCompletion } from '../utils/profileCompletionUtils';
import LoadingSpinner from './LoadingSpinner';
import DashboardSidebar from './DashboardSidebar';
import ProfileSection from './ProfileSection';
import AvailabilitySection from './AvailabilitySection';
import SubscriptionSection from './SubscriptionSection';
import GeniusAvailabilityCalendar from './GeniusAvailabilityCalendar';
import GeniusProfileWizard from './GeniusProfileWizard';
import Modal from './Modal';

interface GeniusDashboardProps {
  onEditProfile: () => void;
  onConfigureCalendar: () => void;
  onManageSubscription: () => void;
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
}

interface Subscription {
  is_active: boolean;
  subscription_start: string;
  subscription_end: string;
  price: number;
  currency: string;
}

const GeniusDashboard: React.FC<GeniusDashboardProps> = ({
  onEditProfile,
  onConfigureCalendar,
  onManageSubscription
}) => {
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [loading, setLoading] = useState(true);
  const [geniusProfile, setGeniusProfile] = useState<GeniusProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [todayStatus, setTodayStatus] = useState<'available' | 'full' | 'vacation'>('available');
  const [activeSection, setActiveSection] = useState<'profile' | 'availability' | 'subscription'>('profile');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [pendingSection, setPendingSection] = useState<'profile' | 'availability' | 'subscription' | null>(null);
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

        const { data: subData } = await supabase
          .from('genius_subscriptions')
          .select('*')
          .eq('genius_id', profile.id)
          .maybeSingle();

        if (subData) {
          setSubscription(subData);
        }

        const today = await getTodayAvailability(profile.id);
        if (today) {
          setTodayStatus(today.status as 'available' | 'full' | 'vacation');
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysRemaining = (): number => {
    if (!subscription || !subscription.subscription_end) return 0;

    const endDate = new Date(subscription.subscription_end);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  };

  const handleSectionChange = (section: 'profile' | 'availability' | 'subscription') => {
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

  return (
    <div className="flex min-h-screen bg-gray-50 pt-20">
      <DashboardSidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        geniusProfile={geniusProfile}
      />

      <div className="flex-1">
        <main className="p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Bienvenido a tu panel de Genio
            </h2>
          </div>

          {activeSection === 'profile' && (
            <>
              {!showWizard ? (
                <ProfileSection
                  percentage={profileCompletion}
                  onCompleteProfile={() => setShowWizard(true)}
                />
              ) : (
                <div className="max-w-5xl">
                  {geniusProfile && (
                    <GeniusProfileWizard
                      initialData={geniusProfile}
                      onComplete={handleWizardComplete}
                      onCancel={handleWizardCancel}
                    />
                  )}
                </div>
              )}
            </>
          )}

          {activeSection === 'availability' && (
            <>
              {showCalendar ? (
                <div className="max-w-4xl">
                  <button
                    onClick={() => setShowCalendar(false)}
                    className="mb-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    ← Volver
                  </button>
                  {geniusProfile && (
                    <GeniusAvailabilityCalendar geniusId={geniusProfile.id} />
                  )}
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

          {activeSection === 'subscription' && subscription && (
            <SubscriptionSection
              price={subscription.price}
              currency={subscription.currency}
              daysRemaining={daysRemaining}
              isActive={subscription.is_active}
              onManageSubscription={onManageSubscription}
            />
          )}
        </main>
      </div>

      {showSectionChangeModal && (
        <Modal onClose={handleCancelSectionChange}>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              ¿Quieres cambiar de sección?
            </h3>
            <p className="text-gray-600 mb-6">
              Tu progreso se guardará automáticamente. Puedes continuar editando tu perfil más tarde.
            </p>
            <div className="flex gap-3 justify-end">
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
          </div>
        </Modal>
      )}
    </div>
  );
};

export default GeniusDashboard;