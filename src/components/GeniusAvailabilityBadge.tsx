import { addDays, localDateISO, parseLocalDate } from '../utils/dateUtils';
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

  // Mientras carga no se muestra nada (antes aparecía "Cargando..." en cada tarjeta).
  if (loading) return null;

  const displayStatus = getDisplayStatus();

  const formatNextDate = (date: string) => {
    // Fechas en hora local (en UTC, después de las 7 p. m. "hoy" sería mañana).
    const dateObj = parseLocalDate(date);
    if (date === localDateISO()) return 'hoy';
    if (date === localDateISO(addDays(new Date(), 1))) return 'mañana';

    return dateObj.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <div className={`flex items-center px-2 py-1 rounded-full text-xs backdrop-blur-sm ${displayStatus.bgColor} ${displayStatus.color} ${className}`}>
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
