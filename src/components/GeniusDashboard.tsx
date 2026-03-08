import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../utils/authUtils';
import { getGeniusProfile } from '../services/supabaseGeniusService';
import { getAvailabilitySummary, getTodayAvailability } from '../services/supabaseAvailabilityService';
import { supabase } from '../lib/supabase';
import { calculateProfileCompletion } from '../utils/profileCompletionUtils';
import LoadingSpinner from './LoadingSpinner';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import ProfileSection from './ProfileSection';
import AvailabilitySection from './AvailabilitySection';
import SubscriptionSection from './SubscriptionSection';
import GeniusAvailabilityCalendar from './GeniusAvailabilityCalendar';

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
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        geniusProfile={geniusProfile}
      />

      <div className="flex-1 flex flex-col">
        <DashboardHeader
          userName={geniusProfile?.full_name || 'Usuario'}
          userPhoto={geniusProfile?.profile_photo}
        />

        <main className="flex-1 p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Bienvenido a tu panel de Genio
            </h2>
          </div>

          {activeSection === 'profile' && (
            <ProfileSection
              percentage={profileCompletion}
              onCompleteProfile={onEditProfile}
            />
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
    </div>
  );
};

export default GeniusDashboard;