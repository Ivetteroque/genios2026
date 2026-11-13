import React, { useEffect, useState } from 'react';
import GeniusDashboard from './GeniusDashboard';
import GeniusProfileWizard from './GeniusProfileWizard';
import GeniusAvailabilityCalendar from './GeniusAvailabilityCalendar';
import { getCurrentUser, updateUser } from '../utils/authUtils';
import { getGeniusProfile } from '../services/supabaseGeniusService';

type ViewMode = 'dashboard' | 'wizard' | 'calendar' | 'subscription';

const GeniusDashboardContainer: React.FC = () => {
  const currentUser = getCurrentUser();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [checkedProfile, setCheckedProfile] = useState(false);

  // A user who is not yet a Genio (no genius_profile in the DB) lands here via
  // "Conviértete en Genio" — open the wizard straight away so they can create it.
  useEffect(() => {
    let active = true;
    (async () => {
      if (!currentUser?.id) {
        if (active) setCheckedProfile(true);
        return;
      }
      try {
        const profile = await getGeniusProfile(currentUser.id);
        if (active && !profile) setViewMode('wizard');
      } catch (err) {
        console.error('No se pudo cargar el perfil de Genio:', err);
      } finally {
        if (active) setCheckedProfile(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [currentUser?.id]);

  const handleEditProfile = () => {
    setViewMode('wizard');
  };

  const handleConfigureCalendar = () => {
    setViewMode('calendar');
  };

  const handleWizardComplete = () => {
    // Completing the wizard is what turns a client into a Genio: they now have a
    // genius_profile in the DB, so grant the capability locally too.
    if (currentUser?.id) updateUser(currentUser.id, { isGenius: true });
    setViewMode('dashboard');
  };

  const handleWizardCancel = () => {
    setViewMode('dashboard');
  };

  const handleCalendarClose = () => {
    setViewMode('dashboard');
  };

  // Wait until we know whether a genius_profile exists, so a brand-new Genio
  // opens the wizard instead of briefly flashing an empty dashboard.
  if (!checkedProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (viewMode === 'wizard') {
    return (
      <GeniusProfileWizard
        onComplete={handleWizardComplete}
        onCancel={handleWizardCancel}
      />
    );
  }

  if (viewMode === 'calendar') {
    return (
      <GeniusAvailabilityCalendar
        onClose={handleCalendarClose}
      />
    );
  }

  return (
    <GeniusDashboard
      onEditProfile={handleEditProfile}
      onConfigureCalendar={handleConfigureCalendar}
    />
  );
};

export default GeniusDashboardContainer;
