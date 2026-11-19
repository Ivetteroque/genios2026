import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, Plane } from 'lucide-react';
import {
  AvailabilityStatus,
  getAvailabilityForMonth,
  setDayStatus,
} from '../../services/supabaseAvailabilityService';
import DayStatusSheet from '../DayStatusSheet';
import { localDateISO } from '../../utils/dateUtils';
import { showToast } from '../../utils/toast';

/**
 * Agenda del genio: el mes actual directo en pantalla. Tocar un día abre el
 * panel para elegir Disponible / Ocupado / De vacaciones, y se guarda al
 * instante. Las flechas pasan de mes sin perder nada (no hay "Guardar").
 */

const STYLE: Record<AvailabilityStatus, { label: string; cell: string; icon: React.FC<{ className?: string }>; dot: string }> = {
  available: { label: 'Disponible', cell: 'bg-primary/25 border-primary text-ink-blue', icon: CheckCircle2, dot: 'bg-ink-blue' },
  full: { label: 'Ocupado', cell: 'bg-surface-rose border-secondary text-ink-rose', icon: Clock, dot: 'bg-secondary' },
  vacation: { label: 'De vacaciones', cell: 'bg-gray-100 border-gray-300 text-gray-700', icon: Plane, dot: 'bg-gray-400' },
};

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

interface GeniusAgendaProps {
  geniusId: string;
  /** Avisa al panel cuando cambia el día de hoy (para el inicio). */
  onTodayChange?: (status: AvailabilityStatus) => void;
}

const GeniusAgenda: React.FC<GeniusAgendaProps> = ({ geniusId, onTodayChange }) => {
  const today = localDateISO();
  const now = new Date();
  const [month, setMonth] = useState({ year: now.getFullYear(), month: now.getMonth() }); // month: 0-11
  const [statuses, setStatuses] = useState<Record<string, AvailabilityStatus>>({});
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState<string | null>(null);

  const isCurrentMonth = month.year === now.getFullYear() && month.month === now.getMonth();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getAvailabilityForMonth(geniusId, month.year, month.month + 1);
      setStatuses(Object.fromEntries(rows.map((r) => [r.date, r.status])));
    } catch (error) {
      console.error('Error cargando la agenda:', error);
      showToast('No se pudo cargar tu agenda. Revisa tu conexión.', 'error');
    } finally {
      setLoading(false);
    }
  }, [geniusId, month]);

  useEffect(() => { load(); }, [load]);

  // Celdas del mes, empezando la semana en lunes.
  const cells = useMemo(() => {
    const first = new Date(month.year, month.month, 1);
    const daysInMonth = new Date(month.year, month.month + 1, 0).getDate();
    const offset = (first.getDay() + 6) % 7;
    const list: ({ date: string; day: number } | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      list.push({ date: localDateISO(new Date(month.year, month.month, d)), day: d });
    }
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [month]);

  const summary = useMemo(() => {
    const counts = { available: 0, full: 0, vacation: 0 };
    cells.forEach((c) => {
      if (c && c.date >= today) counts[statuses[c.date] ?? 'available'] += 1;
    });
    return counts;
  }, [cells, statuses, today]);

  const changeMonth = (delta: number) => {
    setMonth((m) => {
      const d = new Date(m.year, m.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const pick = async (status: AvailabilityStatus) => {
    const date = picking;
    if (!date) return;
    setPicking(null);
    const previous = statuses[date];
    setStatuses((s) => ({ ...s, [date]: status }));
    try {
      await setDayStatus(geniusId, date, status);
      if (date === today) onTodayChange?.(status);
      showToast('Guardado');
    } catch (error) {
      console.error('Error guardando la agenda:', error);
      setStatuses((s) => {
        const copy = { ...s };
        if (previous) copy[date] = previous; else delete copy[date];
        return copy;
      });
      showToast('No se pudo guardar. Revisa tu conexión.', 'error');
    }
  };

  const monthLabel = new Date(month.year, month.month, 1).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-text">Agenda</h2>
        <p className="text-sm text-text/65 mt-1">
          Así los clientes saben cuándo puedes atenderlos. Si no marcas nada, apareces como disponible.
        </p>
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-5">
        {/* Mes */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => changeMonth(-1)}
            disabled={isCurrentMonth}
            aria-label="Mes anterior"
            className="p-2.5 rounded-xl hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="font-semibold text-text first-letter:uppercase">{monthLabel}</p>
            {!isCurrentMonth && (
              <button onClick={() => setMonth({ year: now.getFullYear(), month: now.getMonth() })} className="text-xs text-ink-blue underline">
                Volver a este mes
              </button>
            )}
          </div>
          <button onClick={() => changeMonth(1)} aria-label="Mes siguiente" className="p-2.5 rounded-xl hover:bg-gray-100">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-text/55 py-1">{d}</div>
          ))}
        </div>

        {/* Días */}
        <div className={`grid grid-cols-7 gap-1 sm:gap-2 ${loading ? 'opacity-50' : ''}`}>
          {cells.map((cell, i) => {
            if (!cell) return <div key={`empty-${i}`} />;
            const past = cell.date < today;
            const status = statuses[cell.date] ?? 'available';
            const style = STYLE[status];
            const Icon = style.icon;
            const isToday = cell.date === today;
            if (past) {
              return (
                <div key={cell.date} className="aspect-square sm:aspect-auto sm:h-16 flex items-center justify-center rounded-xl text-sm text-gray-300">
                  {cell.day}
                </div>
              );
            }
            return (
              <button
                key={cell.date}
                onClick={() => setPicking(cell.date)}
                disabled={loading}
                aria-label={`${cell.day}: ${style.label}${isToday ? ' (hoy)' : ''}. Cambiar`}
                className={`aspect-square sm:aspect-auto sm:h-16 flex flex-col items-center justify-center gap-0.5 rounded-xl border-2 transition-colors hover:brightness-95 ${style.cell} ${
                  isToday ? 'ring-2 ring-offset-1 ring-gray-900/40' : ''
                }`}
              >
                <span className={`text-sm sm:text-base leading-none ${isToday ? 'font-bold' : 'font-semibold'}`}>{cell.day}</span>
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            );
          })}
        </div>

        {/* Leyenda + resumen */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-sm text-text/80">
          {(Object.keys(STYLE) as AvailabilityStatus[]).map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${STYLE[s].dot}`} />
              {STYLE[s].label} <span className="text-gray-400">({summary[s]})</span>
            </span>
          ))}
        </div>
        <p className="text-xs text-text/55 mt-2">Toca un día para cambiarlo. Se guarda solo.</p>
      </section>

      <DayStatusSheet
        date={picking}
        current={(picking && statuses[picking]) || 'available'}
        onPick={pick}
        onClose={() => setPicking(null)}
      />
    </div>
  );
};

export default GeniusAgenda;
