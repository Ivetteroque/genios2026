import { User, AlertTriangle } from 'lucide-react';
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
              Completa tu información para aparecer en más búsquedas.
            </p>
            <button
              onClick={onCompleteProfile}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Completar perfil
            </button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Los perfiles completos reciben hasta <strong>3 veces más clientes</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}