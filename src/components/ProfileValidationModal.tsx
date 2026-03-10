import React from 'react';
import { AlertCircle, CheckCircle, ArrowRight, X } from 'lucide-react';
import Modal from './Modal';

interface MissingField {
  field: string;
  step: number;
  required: boolean;
}

interface ProfileValidationModalProps {
  isOpen: boolean;
  percentage: number;
  missingFields: MissingField[];
  onComplete: (step: number) => void;
  onSaveProgress: () => void;
  onClose: () => void;
}

const ProfileValidationModal: React.FC<ProfileValidationModalProps> = ({
  isOpen,
  percentage,
  missingFields,
  onComplete,
  onSaveProgress,
  onClose
}) => {
  const requiredMissing = missingFields.filter(f => f.required);
  const optionalMissing = missingFields.filter(f => !f.required);

  const handleCompleteNow = () => {
    if (requiredMissing.length > 0) {
      onComplete(requiredMissing[0].step);
    } else if (optionalMissing.length > 0) {
      onComplete(optionalMissing[0].step);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Revisión de perfil</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex-shrink-0">
              <div className="relative w-16 h-16">
                <svg className="transform -rotate-90 w-16 h-16">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - percentage / 100)}`}
                    className="text-blue-600 transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-900">{percentage}%</span>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-lg font-semibold text-gray-900">
                Tu perfil está al {percentage}%
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {percentage === 100
                  ? '¡Tu perfil está completo!'
                  : requiredMissing.length > 0
                  ? 'Faltan algunos campos obligatorios para publicar tu perfil'
                  : 'Tu perfil está listo, pero puedes mejorarlo completando más información'}
              </p>
            </div>
          </div>
        </div>

        {missingFields.length > 0 ? (
          <div className="space-y-4 mb-6">
            {requiredMissing.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-gray-900">Campos obligatorios</h3>
                </div>
                <div className="space-y-2">
                  {requiredMissing.map((field, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold">
                          {field.step}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{field.field}</span>
                      </div>
                      <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded">
                        Obligatorio
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {optionalMissing.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Campos opcionales</h3>
                </div>
                <div className="space-y-2">
                  {optionalMissing.map((field, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 text-xs font-bold">
                          {field.step}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{field.field}</span>
                      </div>
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        Opcional
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <p className="text-green-900 font-medium">
                ¡Perfecto! Tu perfil está 100% completo
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {missingFields.length > 0 && (
            <button
              onClick={handleCompleteNow}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <span>{requiredMissing.length > 0 ? 'Completar ahora' : 'Mejorar perfil'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onSaveProgress}
            className={`${
              missingFields.length > 0 ? 'flex-1' : 'w-full'
            } px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-colors`}
          >
            {percentage === 100 ? 'Guardar perfil' : 'Guardar progreso'}
          </button>
        </div>

        {percentage < 100 && (
          <p className="text-xs text-gray-500 text-center mt-4">
            Puedes guardar tu progreso y continuar más tarde
          </p>
        )}
      </div>
    </Modal>
  );
};

export default ProfileValidationModal;
