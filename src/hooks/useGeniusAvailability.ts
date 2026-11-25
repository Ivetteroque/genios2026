import { useState, useEffect } from 'react';
import {
  getGeniusAvailabilityStatus,
  GeniusAvailabilityStatus,
  AvailabilityStatus
} from '../services/supabaseAvailabilityService';

export const useGeniusAvailability = (geniusId: string | undefined) => {
  const [availabilityStatus, setAvailabilityStatus] = useState<GeniusAvailabilityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!geniusId) {
      setLoading(false);
      return;
    }

    const loadAvailability = async () => {
      try {
        setLoading(true);
        setError(null);
        const status = await getGeniusAvailabilityStatus(geniusId);
        setAvailabilityStatus(status);
      } catch (err) {
        console.error('Error loading genius availability:', err);
        setError('No se pudo cargar la disponibilidad');
        setAvailabilityStatus(null);
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();

    const handleAvailabilityChange = (event: CustomEvent) => {
      if (event.detail?.geniusId === geniusId) {
        loadAvailability();
      }
    };

    window.addEventListener('availabilityChanged', handleAvailabilityChange as EventListener);

    return () => {
      window.removeEventListener('availabilityChanged', handleAvailabilityChange as EventListener);
    };
  }, [geniusId]);

  const getDisplayStatus = (): { text: string; color: string; bgColor: string } => {
    // Igual que en el panel del genio: si no marcó nada para hoy, está disponible.
    const AVAILABLE = { text: 'Disponible hoy', color: 'text-ink-blue font-medium', bgColor: 'bg-white/95' };

    if (!availabilityStatus || !availabilityStatus.currentStatus || availabilityStatus.isAvailableToday) {
      return AVAILABLE;
    }

    if (availabilityStatus.currentStatus === 'full') {
      return { text: 'Agenda llena hoy', color: 'text-text font-medium', bgColor: 'bg-secondary' };
    }

    if (availabilityStatus.currentStatus === 'vacation') {
      return { text: 'De vacaciones', color: 'text-white font-medium', bgColor: 'bg-gray-700/85' };
    }

    return AVAILABLE;
  };

  return {
    availabilityStatus,
    loading,
    error,
    isAvailableToday: availabilityStatus?.isAvailableToday || false,
    currentStatus: availabilityStatus?.currentStatus || null,
    nextAvailableDate: availabilityStatus?.nextAvailableDate || null,
    upcomingAvailableDays: availabilityStatus?.upcomingAvailableDays || [],
    getDisplayStatus
  };
};
