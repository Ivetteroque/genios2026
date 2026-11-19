import React, { useEffect } from 'react';
import { CheckCircle2, Clock, Plane, X } from 'lucide-react';
import type { AvailabilityStatus } from '../services/supabaseAvailabilityService';
import { parseLocalDate } from '../utils/dateUtils';

/**
 * Panel para elegir el estado de un día. En el celular sube desde abajo (se
 * alcanza con el pulgar); en computadora aparece centrado.
 */

const STATUS_OPTIONS: {
  value: AvailabilityStatus;
  label: string;
  hint: string;
  icon: React.FC<{ className?: string }>;
  classes: string;
}[] = [
  { value: 'available', label: 'Disponible', hint: 'Puedo tomar trabajos', icon: CheckCircle2, classes: 'border-green-200 bg-green-50 text-green-800' },
  { value: 'full', label: 'Ocupado', hint: 'Tengo la agenda llena', icon: Clock, classes: 'border-amber-200 bg-amber-50 text-amber-800' },
  { value: 'vacation', label: 'De vacaciones', hint: 'No estoy trabajando', icon: Plane, classes: 'border-sky-200 bg-sky-50 text-sky-800' },
];

interface DayStatusSheetProps {
  date: string | null;
  current: AvailabilityStatus;
  onPick: (status: AvailabilityStatus) => void;
  onClose: () => void;
}

const DayStatusSheet: React.FC<DayStatusSheetProps> = ({ date, current, onPick, onClose }) => {
  useEffect(() => {
    if (!date) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [date, onClose]);

  if (!date) return null;

  const label = parseLocalDate(date).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={`Estado del ${label}`}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-5 pb-8 sm:pb-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-gray-900 first-letter:uppercase">{label}</p>
          <button onClick={onClose} aria-label="Cerrar" className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2">
          {STATUS_OPTIONS.map(({ value, label: optionLabel, hint, icon: Icon, classes }) => (
            <button
              key={value}
              onClick={() => onPick(value)}
              aria-pressed={current === value}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-colors ${
                current === value ? classes : 'border-gray-100 hover:border-gray-200 text-gray-800'
              }`}
            >
              <Icon className="w-6 h-6 shrink-0" />
              <span className="flex-1">
                <span className="block font-semibold">{optionLabel}</span>
                <span className="block text-sm opacity-75">{hint}</span>
              </span>
              {current === value && <span className="text-xs font-medium">Actual</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DayStatusSheet;
