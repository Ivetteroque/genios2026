import { User } from 'lucide-react';
import CircularProgress from './CircularProgress';

interface ProfileSectionProps {
  percentage: number;
  onCompleteProfile: () => void;
}

export default function ProfileSection({ percentage, onCompleteProfile }: ProfileSectionProps) {
  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Mi perfil</h2>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-8">
          <div className="flex-shrink-0">
            <CircularProgress percentage={percentage} />
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Perfil <span className="text-amber-500">{percentage}%</span> completo
            </h3>
            <p className="text-gray-600 mb-4">
              {percentage === 100
                ? '¡Tu perfil está completo! Los perfiles completos reciben hasta 3 veces más clientes.'
                : 'Completa tu información para aparecer en más búsquedas y recibir más clientes.'}
            </p>
            <button
              onClick={onCompleteProfile}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {percentage === 100 ? 'Editar perfil' : 'Completar perfil'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}