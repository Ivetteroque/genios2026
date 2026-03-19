import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Save, CheckCircle, Calendar as CalendarIcon, Plane } from 'lucide-react';
import { getCurrentUser } from '../utils/authUtils';
import { getGeniusProfile } from '../services/supabaseGeniusService';
import {
  getAvailabilityForMonth,
  saveBulkAvailability,
  deleteAvailabilityRecord,
  AvailabilityStatus
} from '../services/supabaseAvailabilityService';
import LoadingSpinner from './LoadingSpinner';

interface GeniusAvailabilityCalendarProps {
  onClose: () => void;
}

const GeniusAvailabilityCalendar: React.FC<GeniusAvailabilityCalendarProps> = ({ onClose }) => {
  const [currentUser] = useState(getCurrentUser());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geniusId, setGeniusId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState<Record<string, AvailabilityStatus>>({});
  const [originalAvailability, setOriginalAvailability] = useState<Record<string, AvailabilityStatus>>({});
  const [changedDates, setChangedDates] = useState<Set<string>>(new Set());
  const [showMenu, setShowMenu] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

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
        setOriginalAvailability(availabilityMap);
        setChangedDates(new Set());
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

  const handleDayClick = (dateString: string, event: React.MouseEvent) => {
    if (!dateString) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const clickedDate = new Date(dateString);

    if (clickedDate < today) {
      return;
    }

    setSelectedDate(dateString);
    setMenuPosition({ x: event.clientX, y: event.clientY });
    setShowMenu(true);
  };

  const handleStatusChange = (status: AvailabilityStatus) => {
    if (!selectedDate) return;

    setAvailability(prev => ({
      ...prev,
      [selectedDate]: status
    }));

    setChangedDates(prev => new Set(prev).add(selectedDate));
    setShowMenu(false);
    setSelectedDate(null);
  };

  const handleSaveChanges = async () => {
    if (!geniusId || changedDates.size === 0) {
      alert('No hay cambios para guardar');
      return;
    }

    setSaving(true);
    try {
      const datesToSave: Array<{ date: string; status: AvailabilityStatus }> = [];
      const datesToDelete: string[] = [];

      Array.from(changedDates).forEach(date => {
        const currentStatus = availability[date];
        const originalStatus = originalAvailability[date];

        if (currentStatus === 'available') {
          if (originalStatus && originalStatus !== 'available') {
            datesToDelete.push(date);
          }
        } else {
          datesToSave.push({ date, status: currentStatus });
        }
      });

      if (datesToSave.length > 0) {
        await saveBulkAvailability(geniusId, datesToSave);
      }

      if (datesToDelete.length > 0) {
        for (const date of datesToDelete) {
          await deleteAvailabilityRecord(geniusId, date);
        }
      }

      alert('Disponibilidad actualizada correctamente');

      const newOriginalAvailability = { ...originalAvailability };
      datesToDelete.forEach(date => {
        delete newOriginalAvailability[date];
      });
      datesToSave.forEach(({ date, status }) => {
        newOriginalAvailability[date] = status;
      });
      setOriginalAvailability(newOriginalAvailability);

      setChangedDates(new Set());

      if (window.location.pathname.includes('profile')) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error saving availability:', error);
      alert('Error al guardar los cambios. Por favor, intenta nuevamente.');
    } finally {
      setSaving(false);
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
    const date = new Date(dateString);
    return date < today;
  };

  const isFutureDate = (dateString: string) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateString);
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 px-6 py-4">
            <h1 className="text-2xl font-bold text-white mb-1">Calendario de Disponibilidad</h1>
            <p className="text-white/90 text-sm">
              Configura tu disponibilidad para que los clientes sepan cuándo estás disponible
            </p>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handlePreviousMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>

              <h2 className="text-xl font-bold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>

              <button
                onClick={handleNextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth().map((day, index) => (
                <div
                  key={index}
                  onClick={(e) => day.isCurrentMonth && handleDayClick(day.dateString, e)}
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
                      <span className="text-sm font-medium text-gray-900">{day.date}</span>
                      {getStatusIcon(availability[day.dateString], isFutureDate(day.dateString))}
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded"></div>
                  <span className="text-sm text-gray-700">Disponible</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-500 rounded"></div>
                  <span className="text-sm text-gray-700">Agenda llena</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded"></div>
                  <span className="text-sm text-gray-700">Vacaciones</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">
                      <span className="font-semibold text-green-700">{monthSummary.available}</span> días disponibles
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="w-4 h-4 text-yellow-600" />
                    <span className="text-gray-700">
                      <span className="font-semibold text-yellow-700">{monthSummary.full}</span> agenda llena
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

            <div className="mt-6 flex items-center space-x-3">
              <button
                onClick={handleSaveChanges}
                disabled={saving || changedDates.size === 0}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg font-semibold transition-colors ${
                  saving || changedDates.size === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="px-6 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          ></div>
          <div
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px]"
            style={{
              left: `${menuPosition.x}px`,
              top: `${menuPosition.y}px`,
              transform: 'translate(-50%, -100%) translateY(-10px)'
            }}
          >
            <button
              onClick={() => handleStatusChange('available')}
              className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-green-50 transition-colors"
            >
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-gray-900 font-medium">Disponible</span>
            </button>
            <button
              onClick={() => handleStatusChange('full')}
              className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-yellow-50 transition-colors"
            >
              <CalendarIcon className="w-5 h-5 text-yellow-600" />
              <span className="text-gray-900 font-medium">Agenda llena</span>
            </button>
            <button
              onClick={() => handleStatusChange('vacation')}
              className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-colors"
            >
              <Plane className="w-5 h-5 text-red-600" />
              <span className="text-gray-900 font-medium">De vacaciones</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default GeniusAvailabilityCalendar;
