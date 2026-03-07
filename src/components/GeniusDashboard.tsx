import React, { useState, useEffect } from 'react';
import { User, Calendar, CreditCard, LogOut, Home, Edit, Settings } from 'lucide-react';
import { getCurrentUser } from '../utils/authUtils';
import { getGeniusProfile, calculateProfileCompleteness } from '../services/supabaseGeniusService';
import { getAvailabilitySummary } from '../services/supabaseAvailabilityService';
import LoadingSpinner from './LoadingSpinner';

interface GeniusDashboardProps {
  onEditProfile: () => void;
  onConfigureCalendar: () => void;
  onManageSubscription: () => void;
}

const GeniusDashboard: React.FC<GeniusDashboardProps> = ({
  onEditProfile,
  onConfigureCalendar,
  onManageSubscription
}) => {
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [loading, setLoading] = useState(true);
  const [profileCompleteness, setProfileCompleteness] = useState(0);
  const [geniusName, setGeniusName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [geniusId, setGeniusId] = useState<string | null>(null);
  const [availabilitySummary, setAvailabilitySummary] = useState({
    available: 0,
    full: 0,
    vacation: 0
  });
  const [subscriptionDaysLeft, setSubscriptionDaysLeft] = useState(0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

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
        setGeniusId(profile.id);
        setGeniusName(profile.full_name || 'Genio');
        setProfilePhoto(profile.profile_photo || '');

        const completeness = calculateProfileCompleteness({
          profilePhoto: profile.profile_photo,
          fullName: profile.full_name,
          dni: profile.dni,
          email: profile.email,
          phone: profile.phone,
          description: profile.description,
          category: profile.category,
          subcategories: profile.subcategories,
          serviceName: profile.service_name,
          homeLocation: profile.home_location,
          portfolio: profile.portfolio,
          documents: profile.documents
        });
        setProfileCompleteness(completeness);

        const currentDate = new Date();
        const summary = await getAvailabilitySummary(
          profile.id,
          currentDate.getFullYear(),
          currentDate.getMonth() + 1
        );
        setAvailabilitySummary(summary);
      }

      setSubscriptionDaysLeft(30);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/';
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getSubscriptionColor = () => {
    if (subscriptionDaysLeft > 30) return 'text-green-600';
    if (subscriptionDaysLeft >= 7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSubscriptionBgColor = () => {
    if (subscriptionDaysLeft > 30) return 'bg-green-50 border-green-200';
    if (subscriptionDaysLeft >= 7) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {getGreeting()}, {geniusName}
          </h1>
          <p className="text-gray-600">
            Gestiona tu perfil, disponibilidad y suscripción desde un solo lugar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">Mi Perfil</h2>
                <p className="text-sm text-gray-500">Información personal</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Completitud</span>
                <span className="text-sm font-bold text-blue-600">{profileCompleteness}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${profileCompleteness}%` }}
                ></div>
              </div>
            </div>

            {profilePhoto && (
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={profilePhoto}
                  alt={geniusName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{geniusName}</p>
                  <p className="text-xs text-gray-500">Perfil de Genio</p>
                </div>
              </div>
            )}

            <button
              onClick={onEditProfile}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Editar Perfil</span>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">Disponibilidad</h2>
                <p className="text-sm text-gray-500">Calendario mensual</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Disponible</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {availabilitySummary.available} días
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Agenda llena</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {availabilitySummary.full} días
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Vacaciones</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {availabilitySummary.vacation} días
                </span>
              </div>
            </div>

            <button
              onClick={onConfigureCalendar}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Configurar Calendario</span>
            </button>
          </div>

          <div className={`rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow ${getSubscriptionBgColor()}`}>
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                <CreditCard className={`w-6 h-6 ${getSubscriptionColor()}`} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">Suscripción</h2>
                <p className="text-sm text-gray-600">Plan activo</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-2">Suscripción Anual</p>
              <div className="flex items-baseline space-x-2">
                <span className={`text-3xl font-bold ${getSubscriptionColor()}`}>
                  {subscriptionDaysLeft}
                </span>
                <span className="text-sm text-gray-600">días restantes</span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    subscriptionDaysLeft > 30
                      ? 'bg-green-500'
                      : subscriptionDaysLeft >= 7
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min((subscriptionDaysLeft / 365) * 100, 100)}%` }}
                ></div>
              </div>
            </div>

            <button
              onClick={onManageSubscription}
              className={`w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg font-medium transition-colors ${
                subscriptionDaysLeft < 30
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>{subscriptionDaysLeft < 30 ? 'Renovar Suscripción' : 'Gestionar Plan'}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center space-x-2 px-6 py-3 rounded-lg bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300 font-medium transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Volver al Inicio</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center space-x-2 px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeniusDashboard;
