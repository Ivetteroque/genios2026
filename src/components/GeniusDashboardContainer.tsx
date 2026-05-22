import React, { useState } from 'react';
import GeniusDashboard from './GeniusDashboard';
import GeniusProfileWizard from './GeniusProfileWizard';
import GeniusAvailabilityCalendar from './GeniusAvailabilityCalendar';
import ForcePasswordChange from './ForcePasswordChange';
import { getCurrentUser } from '../utils/authUtils';

type ViewMode = 'dashboard' | 'wizard' | 'calendar' | 'subscription';

const getPendingAccessForUser = (email: string) => {
  try {
    const list: any[] = JSON.parse(localStorage.getItem('geniusPendingAccess') || '[]');
    return list.find(a => a.email === email && a.mustChangePassword);
  } catch {
    return null;
  }
};

const GeniusDashboardContainer: React.FC = () => {
  const currentUser = getCurrentUser();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');

  // Check if current user must change password (admin-created genius first login)
  const pendingAccess = currentUser?.email ? getPendingAccessForUser(currentUser.email) : null;
  const mustChange = pendingAccess !== null && pendingAccess !== undefined;

  if (mustChange) {
    return (
      <ForcePasswordChange
        geniusName={pendingAccess.geniusName || currentUser?.name || ''}
        email={pendingAccess.email}
        onComplete={() => window.location.reload()}
      />
    );
  }

  const handleEditProfile = () => {
    setViewMode('wizard');
  };

  const handleConfigureCalendar = () => {
    setViewMode('calendar');
  };

  const handleManageSubscription = () => {
    alert('Funcionalidad de suscripción en desarrollo');
  };

  const handleWizardComplete = () => {
    setViewMode('dashboard');
  };

  const handleWizardCancel = () => {
    setViewMode('dashboard');
  };

  const handleCalendarClose = () => {
    setViewMode('dashboard');
  };

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
      onManageSubscription={handleManageSubscription}
    />
  );
};

export default GeniusDashboardContainer;
