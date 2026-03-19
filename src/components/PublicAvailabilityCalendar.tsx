import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { getAvailabilityForMonth, GeniusAvailability } from '../services/supabaseAvailabilityService';

interface PublicAvailabilityCalendarProps {
  geniusId: string;
  compact?: boolean;
}

const PublicAvailabilityCalendar: React.FC<PublicAvailabilityCalendarProps> = ({
  geniusId,
  compact = false
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState<GeniusAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  useEffect(() => {
    loadAvailability();
  }, [geniusId, year, month]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const data = await getAvailabilityForMonth(geniusId, year, month);
      setAvailability(data);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const getStatusForDate = (day: number): 'available' | 'full' | 'vacation' | null => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayAvailability = availability.find(a => a.date === dateStr);
    return dayAvailability?.status || null;
  };

  const getStatusColor = (status: 'available' | 'full' | 'vacation' | null): string => {
    if (!status) return 'bg-white border-gray-200';

    switch (status) {
      case 'available':
        return 'bg-success/20 border-success text-success';
      case 'full':
        return 'bg-red-100 border-red-300 text-red-700';
      case 'vacation':
        return 'bg-orange-100 border-orange-300 text-orange-700';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const isPastDate = (day: number): boolean => {
    const today = new Date();
    const dateToCheck = new Date(year, month - 1, day);
    today.setHours(0, 0, 0, 0);
    dateToCheck.setHours(0, 0, 0, 0);
    return dateToCheck < today;
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  if (compact) {
    const today = new Date();
    const upcomingDays = daysArray
      .filter(day => !isPastDate(day))
      .slice(0, 14)
      .map(day => ({
        day,
        status: getStatusForDate(day)
      }));

    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h3 className="font-semibold text-text mb-3 flex items-center">
          <CalendarIcon className="w-4 h-4 mr-2 text-primary" />
          Próximos días disponibles
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {upcomingDays.map(({ day, status }) => (
            <div
              key={day}
              className={`text-center p-2 rounded border text-sm ${getStatusColor(status)}`}
            >
              <div className="font-medium">{day}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-success/20 border border-success rounded"></div>
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
            <span>No disponible</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <h3 className="font-heading text-xl font-bold text-text">
          {monthNames[month - 1]} {year}
        </h3>

        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">
          Cargando disponibilidad...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {emptyDays.map(i => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}

            {daysArray.map(day => {
              const status = getStatusForDate(day);
              const isPast = isPastDate(day);

              return (
                <div
                  key={day}
                  className={`
                    aspect-square flex items-center justify-center rounded border text-sm font-medium
                    ${isPast ? 'opacity-40 cursor-not-allowed' : ''}
                    ${getStatusColor(status)}
                  `}
                >
                  {day}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-success/20 border border-success rounded"></div>
              <span>Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span>Agenda llena</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
              <span>De vacaciones</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PublicAvailabilityCalendar;
