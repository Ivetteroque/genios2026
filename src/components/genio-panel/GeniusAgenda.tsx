import React, { useCallback, useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock, Plane } from 'lucide-react';
import {
  AvailabilityStatus,
  getGeniusAvailabilityRange,
  setDayStatus,
} from '../../services/supabaseAvailabilityService';
import DayStatusSheet from '../DayStatusSheet';
import { addDays, localDateISO } from '../../utils/dateUtils';
import { showToast } from '../../utils/toast';

/**
 * Agenda simple: los próximos 7 días en una fila. Tocar un día abre el panel
 * para elegir Disponible / Ocupado / De vacaciones, y se guarda al instante.
 * Para planificar más lejos, "Ver mes completo".
 */

const STYLE: Record<AvailabilityStatus, { label: string; classes: string; icon: React.FC<{ className?: string }> }> = {
  available: { label: 'Libre', classes: 'bg-green-50 border-green-200 text-green-800', icon: CheckCircle2 },
  full: { label: 'Ocupado', classes: 'bg-amber-50 border-amber-200 text-amber-800', icon: Clock },
  vacation: { label: 'Vacaciones', classes: 'bg-sky-50 border-sky-200 text-sky-800', icon: Plane },
};

interface GeniusAgendaProps {
  geniusId: string;
  onOpenMonth: () => void;
  /** Avisa al panel cuando cambia el día de hoy (para el inicio). */
  onTodayChange?: (status: AvailabilityStatus) => void;
}

const GeniusAgenda: React.FC<GeniusAgendaProps> = ({ geniusId, onOpenMonth, onTodayChange }) => {
  const [days, setDays] = useState<{ date: string; status: AvailabilityStatus }[]>([]);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState<string | null>(null);

  const load = useCallback(async () => {
    const today = new Date();
    const dates = Array.from({ length: 7 }, (_, i) => localDateISO(addDays(today, i)));
    const rows = await getGeniusAvailabilityRange(geniusId, dates[0], dates[6]);
    const byDate = new Map(rows.map((r) => [r.date, r.status]));
    setDays(dates.map((date) => ({ date, status: byDate.get(date) ?? 'available' })));
    setLoading(false);
  }, [geniusId]);

  useEffect(() => { load(); }, [load]);

  const pick = async (status: AvailabilityStatus) => {
    const date = picking;
    if (!date) return;
    setPicking(null);
    const before = days;
    setDays((prev) => prev.map((d) => (d.date === date ? { ...d, status } : d)));
    try {
      await setDayStatus(geniusId, date, status);
      if (date === localDateISO()) onTodayChange?.(status);
      showToast('Guardado');
    } catch (error) {
      console.error('Error guardando la agenda:', error);
      setDays(before);
      showToast('No se pudo guardar. Revisa tu conexión.', 'error');
    }
  };

  const current = days.find((d) => d.date === picking)?.status ?? 'available';

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Agenda</h2>
        <p className="text-sm text-gray-600 mt-1">
          Así los clientes saben cuándo puedes atenderlos. Si no marcas nada, apareces como disponible.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
        <p className="text-sm font-semibold text-gray-900 mb-3">Próximos 7 días</p>
        {loading ? (
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1.5">
            {days.map(({ date, status }, i) => {
              const d = new Date(addDays(new Date(), i));
              const style = STYLE[status];
              const Icon = style.icon;
              return (
                <button
                  key={date}
                  onClick={() => setPicking(date)}
                  aria-label={`${d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric' })}: ${style.label}. Cambiar`}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-2.5 min-h-[80px] transition-colors ${style.classes} ${i === 0 ? 'ring-2 ring-offset-1 ring-gray-900/10' : ''}`}
                >
                  <span className="text-[11px] font-medium uppercase">
                    {i === 0 ? 'Hoy' : d.toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', '')}
                  </span>
                  <span className="text-lg font-bold leading-none">{d.getDate()}</span>
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        )}
        <p className="text-xs text-gray-500 mt-3">Toca un día para cambiarlo. Se guarda solo.</p>
      </div>

      <button
        onClick={onOpenMonth}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-medium transition-colors"
      >
        <CalendarDays className="w-5 h-5" />
        Ver mes completo
      </button>

      <DayStatusSheet date={picking} current={current} onPick={pick} onClose={() => setPicking(null)} />
    </div>
  );
};

export default GeniusAgenda;
