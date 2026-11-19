import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Calendar as CalendarIcon, Plane } from 'lucide-react';
import { getCurrentUser } from '../utils/authUtils';
import { getGeniusProfile } from '../services/supabaseGeniusService';
import {
  getAvailabilityForMonth,
  setDayStatus,
  AvailabilityStatus
} from '../services/supabaseAvailabilityService';
import LoadingSpinner from './LoadingSpinner';
import DayStatusSheet from './DayStatusSheet';
import { parseLocalDate } from '../utils/dateUtils';
import { showToast } from '../utils/toast';

interface GeniusAvailabilityCalendarProps {
  onClose: () => void;
}

const GeniusAvailabilityCalendar: React.FC<GeniusAvailabilityCalendarProps> = ({ onClose }) => {
  const [currentUser] = useState(getCurrentUser());
  const [loading, setLoading] = useState(true);
  const [geniusId, setGeniusId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState<Record<string, AvailabilityStatus>>({});
  const [showMenu, setShowMenu] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const loadData = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const profile = await getGeniusProfile(currentUser.id);
      if (profile) {
        setGeniusId(profile.id);

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const availabilityData = await getAvailabilityForMonth(profile.id, year, month);

        const availabilityMap: Record<string, AvailabilityStatus> = {};
        availabilityData.forEach(item => {
          availabilityMap[item.date] = item.status;
        });

        setAvailability(availabilityMap);
      }
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    let firstDayOfWeek = firstDay.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const days: Array<{ date: number; dateString: string; isCurrentMonth: boolean }> = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ date: 0, dateString: '', isCurrentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({ date: day, dateString, isCurrentMonth: true });
    }

    return days;
  };

  const handleDayClick = (dateString: string) => {
    if (!dateString) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const clickedDate = parseLocalDate(dateString);

    if (clickedDate < today) {
      return;
    }

    setSelectedDate(dateString);
    setShowMenu(true);
  };

  // Cada cambio se guarda al instante: no hay botón "Guardar" que olvidar ni
  // cambios que se pierdan al pasar de mes.
  const handleStatusChange = async (status: AvailabilityStatus) => {
    if (!selectedDate || !geniusId) return;
    const date = selectedDate;
    const previous = availability[date];

    setAvailability(prev => ({ ...prev, [date]: status }));
    setShowMenu(false);
    setSelectedDate(null);

    try {
      await setDayStatus(geniusId, date, status);
      showToast('Guardado');
    } catch (error) {
      console.error('Error saving availability:', error);
      setAvailability(prev => ({ ...prev, [date]: previous }));
      showToast('No se pudo guardar. Revisa tu conexión.', 'error');
    }
  };

  const getStatusColor = (status?: AvailabilityStatus, isFutureDate?: boolean) => {
    if (!status && isFutureDate) return 'bg-green-100 border-green-500';
    if (!status) return 'bg-white';
    switch (status) {
      case 'available':
        return 'bg-green-100 border-green-500';
      case 'full':
        return 'bg-yellow-100 border-yellow-500';
      case 'vacation':
        return 'bg-red-100 border-red-500';
      default:
        return 'bg-white';
    }
  };

  const getStatusIcon = (status?: AvailabilityStatus, isFutureDate?: boolean) => {
    if (!status && isFutureDate) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (!status) return null;
    switch (status) {
      case 'available':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'full':
        return <CalendarIcon className="w-4 h-4 text-yellow-600" />;
      case 'vacation':
        return <Plane className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const isPastDate = (dateString: string) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = parseLocalDate(dateString);
    return date < today;
  };

  const isFutureDate = (dateString: string) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = parseLocalDate(dateString);
    return date >= today;
  };

  const monthSummary = useMemo(() => {
    const days = getDaysInMonth();
    const summary = {
      available: 0,
      full: 0,
      vacation: 0
    };

    days.forEach(day => {
      if (day.isCurrentMonth && isFutureDate(day.dateString)) {
        const status = availability[day.dateString];
        if (!status || status === 'available') {
          summary.available++;
        } else if (status === 'full') {
          summary.full++;
        } else if (status === 'vacation') {
          summary.vacation++;
        }
      }
    });

    return summary;
  }, [currentDate, availability]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8 px-0 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 px-4 sm:px-6 py-4">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Tu mes</h1>
            <p className="text-white/90 text-sm">
              Toca un día para cambiarlo. Se guarda solo.
            </p>
          </div>

          <div className="p-3 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handlePreviousMonth}
                aria-label="Mes anterior"
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>

              <h2 className="text-base sm:text-xl font-bold text-gray-900 text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>

              <button
                onClick={handleNextMonth}
                aria-label="Mes siguiente"
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-xs sm:text-sm font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {getDaysInMonth().map((day, index) => (
                <div
                  key={index}
                  onClick={() => day.isCurrentMonth && handleDayClick(day.dateString)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg border-2 transition-all ${
                    day.isCurrentMonth
                      ? isPastDate(day.dateString)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : `cursor-pointer hover:scale-105 ${getStatusColor(
                            availability[day.dateString],
                            isFutureDate(day.dateString)
                          )}`
                      : 'bg-gray-50 border-transparent'
                  }`}
                >
                  {day.isCurrentMonth && (
                    <>
                      <span className="text-xs sm:text-sm font-medium text-gray-900">{day.date}</span>
                      {getStatusIcon(availability[day.dateString], isFutureDate(day.dateString))}
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded"></div>
                  <span className="text-sm text-gray-700">Disponible</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-500 rounded"></div>
                  <span className="text-sm text-gray-700">Ocupado</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded"></div>
                  <span className="text-sm text-gray-700">Vacaciones</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">
                      <span className="font-semibold text-green-700">{monthSummary.available}</span> días disponibles
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="w-4 h-4 text-yellow-600" />
                    <span className="text-gray-700">
                      <span className="font-semibold text-yellow-700">{monthSummary.full}</span> ocupado
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Plane className="w-4 h-4 text-red-600" />
                    <span className="text-gray-700">
                      <span className="font-semibold text-red-700">{monthSummary.vacation}</span> de vacaciones
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold transition-colors"
            >
              Listo
            </button>
          </div>
        </div>
      </div>

      <DayStatusSheet
        date={showMenu ? selectedDate : null}
        current={(selectedDate && availability[selectedDate]) || 'available'}
        onPick={handleStatusChange}
        onClose={() => { setShowMenu(false); setSelectedDate(null); }}
      />
    </div>
  );
};

export default GeniusAvailabilityCalendar;
