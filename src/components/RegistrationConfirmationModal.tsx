import React from 'react';
import { X, CheckCircle } from 'lucide-react';

interface RegistrationConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountType: 'client' | 'genius';
}

const RegistrationConfirmationModal: React.FC<RegistrationConfirmationModalProps> = ({
  isOpen,
  onClose,
  accountType,
}) => {
  const handleGoToPanel = () => {
    onClose();
    window.location.href = accountType === 'client' ? '/client-profile' : '/genius-profile';
  };

  const handleCompleteProfile = () => {
    onClose();
    window.location.href = '/genius-profile';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in" onClick={onClose} />

      <div className="relative bg-[#FDFDFD] rounded-2xl shadow-xl w-full max-w-[340px] mx-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#2F2F2F]/30 hover:text-[#2F2F2F]/55 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Icon + title */}
          <div className="text-center pt-1">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-50 mb-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <h1 className="font-heading text-xl font-semibold text-[#2F2F2F] tracking-tight">
              {accountType === 'client' ? '¡Bienvenido!' : '¡Cuenta creada!'}
            </h1>
            <p className="text-[#2F2F2F]/40 text-xs mt-1">
              {accountType === 'client'
                ? 'Tu cuenta como cliente está lista.'
                : 'Tu cuenta como genio está lista.'}
            </p>
          </div>

          {/* Info card */}
          <div className={`px-3 py-2.5 rounded-xl border text-xs text-[#2F2F2F]/60 leading-relaxed ${
            accountType === 'client'
              ? 'bg-[#A0C4FF]/6 border-[#A0C4FF]/20'
              : 'bg-[#FFADAD]/6 border-[#FFADAD]/20'
          }`}>
            {accountType === 'client'
              ? 'Ya puedes buscar y contratar los mejores genios de tu ciudad.'
              : 'Completa tu perfil para que el mundo vea lo que sabes hacer.'}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pb-1">
            {accountType === 'genius' && (
              <button
                onClick={handleCompleteProfile}
                className="w-full py-2.5 rounded-xl font-medium text-sm text-white bg-[#FFADAD] hover:bg-[#FF9D9D] transition-all duration-200"
              >
                Completar mi perfil
              </button>
            )}
            <button
              onClick={handleGoToPanel}
              className={`w-full py-2.5 rounded-xl font-medium text-sm text-white transition-all duration-200 ${
                accountType === 'client'
                  ? 'bg-[#A0C4FF] hover:bg-[#8AB4FF]'
                  : 'bg-white border border-gray-200 hover:border-gray-300 !text-[#2F2F2F]/55 hover:bg-gray-50'
              }`}
            >
              Ir a mi panel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationConfirmationModal;
