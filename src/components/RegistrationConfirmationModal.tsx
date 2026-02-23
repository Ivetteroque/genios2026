import React from 'react';
import { X } from 'lucide-react';

interface RegistrationConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountType: 'client' | 'genius';
}

const RegistrationConfirmationModal: React.FC<RegistrationConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  accountType 
}) => {
  const handleGoToPanel = () => {
    console.log(`Navigating to ${accountType} panel`);
    
    // Redirect based on account type
    if (accountType === 'client') {
      window.location.href = '/client-profile';
      alert('🎯 Redirigiendo al Panel de Cliente...\n\n¡Ya puedes empezar a buscar genios!');
    } else {
      // For genius, always redirect to genius profile to complete data
      window.location.href = '/genius-profile';
    }
    
    onClose();
  };

  const handleCompleteProfile = () => {
    console.log('Opening profile completion for genius');
    
    // Redirect genius to their profile to complete data
    window.location.href = '/genius-profile';
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background Overlay with subtle animation */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Confirmation Modal Card */}
      <div className="relative bg-[#FDFDFD] rounded-3xl shadow-2xl w-full max-w-[420px] mx-4 transform transition-all duration-500 scale-100 animate-in fade-in slide-in-from-bottom-4 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-[#2F2F2F]/40 hover:text-[#2F2F2F]/60 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="px-8 py-10">
          {accountType === 'client' ? (
            // CLIENT SUCCESS MODAL
            <>
              {/* Header with celebration */}
              <div className="text-center mb-8">
                <div className="text-6xl mb-4 animate-bounce">🎉</div>
                <h1 className="font-heading text-3xl font-bold text-[#2F2F2F] mb-4">
                  ¡Bienvenido!
                </h1>
              </div>

              {/* Success Message */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-100">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">🛍️</div>
                  <div>
                    <p className="text-[#2F2F2F] font-body leading-relaxed">
                      Tu cuenta como <span className="font-bold text-[#A0C4FF]">CLIENTE</span> ha sido creada con éxito.
                      Ya puedes empezar a encontrar a los mejores genios de tu ciudad para ayudarte.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mb-6">
                <button
                  onClick={handleGoToPanel}
                  className="w-full py-4 rounded-2xl font-body font-semibold transition-all duration-300 text-white text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] bg-[#A0C4FF] hover:bg-[#8AB4FF]"
                  style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
                >
                  🔵 Ir a mi Panel
                </button>
              </div>

              {/* Bottom Message */}
              <div className="text-center">
                <p className="text-[#2F2F2F]/70 font-body text-sm leading-relaxed">
                  ✨ ¡Estamos felices de tenerte en nuestra comunidad!
                </p>
              </div>
            </>
          ) : (
            // GENIUS SUCCESS MODAL
            <>
              {/* Header with celebration */}
              <div className="text-center mb-8">
                <div className="text-6xl mb-4 animate-bounce">🚀</div>
                <h1 className="font-heading text-3xl font-bold text-[#2F2F2F] mb-4">
                  ¡Perfil creado con éxito!
                </h1>
              </div>

              {/* Success Message */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 mb-8 border border-orange-100">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">🧠</div>
                  <div>
                    <p className="text-[#2F2F2F] font-body leading-relaxed">
                      Tu cuenta como <span className="font-bold text-[#FFADAD]">GENIO</span> ya está lista.
                      Ahora completa tu perfil para que el mundo vea lo que sabes hacer.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={handleCompleteProfile}
                  className="w-full py-4 rounded-2xl font-body font-semibold transition-all duration-300 text-white text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] bg-[#FFADAD] hover:bg-[#FF9D9D]"
                  style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
                >
                  🟡 Completar mi Perfil
                </button>
                
                <button
                  onClick={handleGoToPanel}
                  className="w-full py-4 rounded-2xl font-body font-semibold transition-all duration-300 text-white text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] bg-[#A0C4FF] hover:bg-[#8AB4FF]"
                  style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
                >
                  🔵 Ir a mi Panel
                </button>
              </div>

              {/* Bottom Message */}
              <div className="text-center">
                <p className="text-[#2F2F2F]/70 font-body text-sm leading-relaxed">
                  ✨ Tu talento está a punto de brillar. ¡Vamos!
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationConfirmationModal;