import React, { useEffect, useState } from 'react';
import GeniusDashboard from './GeniusDashboard';
import GeniusProfileWizard from './GeniusProfileWizard';
import { getCurrentUser, updateUser } from '../utils/authUtils';
import { getGeniusProfile } from '../services/supabaseGeniusService';
import { LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { openLogin } from '../utils/onboardingUtils';

/** Sin sesión no hay panel que mostrar: se invita a entrar con Google. */
const SignInPrompt: React.FC = () => (
  <div className="min-h-[70vh] flex items-center justify-center px-4 pt-24 pb-12">
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 max-w-md w-full text-center">
      <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center mx-auto mb-4">
        <LogIn className="w-6 h-6 text-ink-blue" />
      </div>
      <h1 className="font-heading text-xl font-semibold text-text mb-2">Entra para crear tu perfil de genio</h1>
      <p className="text-sm text-text/60 mb-6">
        Usa tu cuenta de Google. Después te guiamos paso a paso para armar tu perfil.
      </p>
      <button
        onClick={() => openLogin({
          redirectTo: '/genius-profile',
          title: 'Crea tu perfil de genio',
          subtitle: 'Entra con tu cuenta de Google. Es gratis y toma unos minutos.',
        })}
        className="w-full bg-text hover:bg-text/85 text-white font-semibold py-3 rounded-xl transition-colors"
      >
        Entrar con Google
      </button>
      <Link to="/ser-genio" className="inline-block mt-4 text-sm text-ink-blue underline underline-offset-4">
        ¿Cómo funciona ser genio?
      </Link>
    </div>
  </div>
);

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
    // y pasa a verse en modo Genio (el header cambia al instante).
    if (currentUser?.id) updateUser(currentUser.id, { isGenius: true, role: 'genius' });
    setViewMode('dashboard');
  };

  const handleWizardCancel = () => {
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

  if (!currentUser) {
    return <SignInPrompt />;
  }

  // El header es fijo: el formulario y el calendario necesitan espacio arriba
  // para que no les tape el título ni el botón de cerrar.
  if (viewMode === 'wizard') {
    return (
      <div className="bg-gray-50 min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <GeniusProfileWizard
            onComplete={handleWizardComplete}
            onCancel={handleWizardCancel}
          />
        </div>
      </div>
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
