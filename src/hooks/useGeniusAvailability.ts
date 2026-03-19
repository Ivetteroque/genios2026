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
    if (!availabilityStatus || !availabilityStatus.currentStatus) {
      return { text: 'Sin info', color: 'text-gray-600', bgColor: 'bg-gray-200/80' };
    }

    if (availabilityStatus.isAvailableToday) {
      return { text: 'Disponible', color: 'text-white', bgColor: 'bg-success/80' };
    }

    if (availabilityStatus.currentStatus === 'full') {
      return { text: 'Agenda llena', color: 'text-white', bgColor: 'bg-red-500/80' };
    }

    if (availabilityStatus.currentStatus === 'vacation') {
      return { text: 'De vacaciones', color: 'text-white', bgColor: 'bg-orange-500/80' };
    }

    return { text: 'Sin info', color: 'text-gray-600', bgColor: 'bg-gray-200/80' };
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
