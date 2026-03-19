import React from 'react';
import { Calendar } from 'lucide-react';
import { useGeniusAvailability } from '../hooks/useGeniusAvailability';

interface GeniusAvailabilityBadgeProps {
  geniusId: string;
  showIcon?: boolean;
  showNextDate?: boolean;
  className?: string;
}

const GeniusAvailabilityBadge: React.FC<GeniusAvailabilityBadgeProps> = ({
  geniusId,
  showIcon = false,
  showNextDate = false,
  className = ''
}) => {
  const { availabilityStatus, loading, getDisplayStatus } = useGeniusAvailability(geniusId);

  if (loading) {
    return (
      <div className={`px-2 py-1 rounded-full text-sm backdrop-blur-sm bg-gray-200/80 text-gray-600 animate-pulse ${className}`}>
        Cargando...
      </div>
    );
  }

  const displayStatus = getDisplayStatus();

  const formatNextDate = (date: string) => {
    const dateObj = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateObj.toISOString().split('T')[0] === today.toISOString().split('T')[0]) {
      return 'hoy';
    }

    if (dateObj.toISOString().split('T')[0] === tomorrow.toISOString().split('T')[0]) {
      return 'mañana';
    }

    return dateObj.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <div className={`flex items-center px-2 py-1 rounded-full text-sm backdrop-blur-sm ${displayStatus.bgColor} ${displayStatus.color} ${className}`}>
        {showIcon && <Calendar className="w-3 h-3 mr-1" />}
        {displayStatus.text}
      </div>

      {showNextDate && availabilityStatus?.nextAvailableDate && !availabilityStatus.isAvailableToday && (
        <div className="text-xs text-gray-600 px-2">
          Próximo disponible: {formatNextDate(availabilityStatus.nextAvailableDate)}
        </div>
      )}
    </div>
  );
};

export default GeniusAvailabilityBadge;
