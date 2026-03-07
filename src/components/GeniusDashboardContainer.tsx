import React, { useState } from 'react';
import GeniusDashboard from './GeniusDashboard';
import GeniusProfileWizard from './GeniusProfileWizard';
import GeniusAvailabilityCalendar from './GeniusAvailabilityCalendar';

type ViewMode = 'dashboard' | 'wizard' | 'calendar' | 'subscription';

const GeniusDashboardContainer: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');

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
