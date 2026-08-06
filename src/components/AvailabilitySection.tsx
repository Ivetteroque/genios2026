import { Calendar, CheckCircle2, CreditCard as Edit3 } from 'lucide-react';

interface AvailabilitySectionProps {
  status: 'available' | 'full' | 'vacation';
  daysRemaining: number;
  onChangeAvailability: () => void;
}

export default function AvailabilitySection({ status, daysRemaining, onChangeAvailability }: AvailabilitySectionProps) {
  const statusConfig = {
    available: {
      label: 'Disponible hoy',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    full: {
      label: 'Agenda completa',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
    vacation: {
      label: 'De vacaciones',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    }
  };

  const currentStatus = statusConfig[status];

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Disponibilidad</h2>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
          <div className={`p-3 sm:p-4 rounded-xl shrink-0 ${currentStatus.bgColor}`}>
            <Calendar className={`w-7 h-7 sm:w-8 sm:h-8 ${currentStatus.iconColor}`} />
          </div>

          <div className="flex-1 min-w-0 w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Estado actual:</h3>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className={`w-5 h-5 shrink-0 ${currentStatus.iconColor}`} />
              <span className={`text-lg sm:text-xl font-semibold ${currentStatus.color}`}>
                {currentStatus.label}
              </span>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-600 mb-1">Plan activo: Genio</p>
              <p className="text-sm font-semibold text-gray-900">
                Te quedan <span className="text-blue-600">{daysRemaining} días</span> de visibilidad
              </p>
            </div>

            <button
              onClick={onChangeAvailability}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Cambiar disponibilidad
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}