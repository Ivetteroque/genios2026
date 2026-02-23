import React, { useState } from 'react';
import { X, User, Briefcase, CheckCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { createUserFromSocialLogin, saveUser } from '../utils/socialAuthUtils';

interface SocialLoginRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerName: string; // 'google', 'facebook', or 'apple'
  userInfo: {
    name: string;
    email: string;
    profileImage?: string;
  };
}

const SocialLoginRoleModal: React.FC<SocialLoginRoleModalProps> = ({ 
  isOpen, 
  onClose, 
  providerName,
  userInfo 
}) => {
  const [selectedRole, setSelectedRole] = useState<'client' | 'genius' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleRoleSelection = async (role: 'client' | 'genius') => {
    setSelectedRole(role);
    setIsLoading(true);

    try {
      // Simulate API call to save user role and complete registration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create user data from social login info
      const userData = createUserFromSocialLogin({
        id: Date.now().toString(), // In real app, this would come from the social provider
        name: userInfo.name,
        email: userInfo.email,
        profileImage: userInfo.profileImage,
        provider: providerName as 'google' | 'facebook' | 'apple'
      }, role);
      
      // Save user to our system
      saveUser(userData);
      
      // Dispatch auth state change event
      window.dispatchEvent(new Event('authStateChanged'));
      
      console.log(`User ${userInfo.name} registered as ${role} via ${providerName}`, userData);
      
      setIsCompleted(true);
      
      // Show completion state briefly before redirecting
      setTimeout(() => {
        setIsLoading(false);
        
        // Redirect based on role
        if (role === 'client') {
          console.log('Redirecting to Client Dashboard');
          window.location.href = '/client-profile';
          alert(`¡Bienvenido ${userInfo.name}!\n\n✅ Tu cuenta como CLIENTE ha sido configurada exitosamente.\n\n🎯 Ahora puedes buscar y contratar genios en tu ciudad.`);
        } else {
          console.log('Redirecting to Genius Dashboard');
          // For genius, always redirect to genius profile to complete data
          window.location.href = '/genius-profile';
          alert(`¡Bienvenido ${userInfo.name}!\n\n✅ Tu cuenta como GENIO ha sido configurada exitosamente.\n\n🚀 Ahora completa tu perfil para empezar a ofrecer tus servicios.`);
        }
        
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error during role selection:', error);
      setIsLoading(false);
      alert('Hubo un error al configurar tu cuenta. Por favor, intenta nuevamente.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background Overlay */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Role Selection Modal Card */}
      <div className="relative bg-[#FDFDFD] rounded-3xl shadow-2xl w-full max-w-[480px] mx-4 transform transition-all duration-500 scale-100 animate-in fade-in slide-in-from-bottom-4 overflow-hidden">
        {/* Close Button */}
        {!isLoading && (
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-[#2F2F2F]/40 hover:text-[#2F2F2F]/60 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        <div className="px-8 py-10">
          {/* Header with celebration */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4 animate-bounce">🎉</div>
            <h1 className="font-heading text-2xl font-bold text-[#2F2F2F] mb-2">
              ¡Ya casi estás dentro!
            </h1>
            <p className="text-[#2F2F2F]/70 font-body text-lg">
              ¿Cómo quieres usar Genios a la Obra?
            </p>
          </div>

          {/* User Info Display */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-50 to-orange-50 rounded-2xl p-4 border border-gray-100">
              {userInfo.profileImage && (
                <img 
                  src={userInfo.profileImage} 
                  alt={userInfo.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                />
              )}
              <div>
                <p className="text-[#2F2F2F] font-body font-semibold">
                  {userInfo.name}
                </p>
                <p className="text-[#2F2F2F]/60 font-body text-sm">
                  Conectado vía {providerName.charAt(0).toUpperCase() + providerName.slice(1)}
                </p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
          </div>

          {/* Role Selection Options */}
          <div className="space-y-4 mb-8">
            {/* Client Option */}
            <div 
              className={`border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-md ${
                selectedRole === 'client' 
                  ? 'border-[#A0C4FF] bg-blue-50/50 shadow-md' 
                  : isLoading 
                  ? 'border-gray-200 cursor-not-allowed opacity-50'
                  : 'border-gray-200 hover:border-[#A0C4FF]/50'
              }`}
              onClick={() => !isLoading && setSelectedRole('client')}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    selectedRole === 'client' ? 'bg-[#A0C4FF]' : 'bg-gray-100'
                  }`}>
                    <User className={`w-6 h-6 transition-colors ${
                      selectedRole === 'client' ? 'text-white' : 'text-gray-500'
                    }`} />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-heading text-xl font-bold text-[#2F2F2F] mb-2">
                    🛍️ Soy Cliente
                  </h3>
                  <p className="text-[#2F2F2F]/70 font-body text-sm leading-relaxed">
                    Quiero encontrar genios que me ayuden con sus servicios.
                  </p>
                  {selectedRole === 'client' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRoleSelection('client');
                      }}
                      disabled={isLoading}
                      className={`mt-4 w-full py-3 rounded-xl font-body font-semibold transition-all duration-300 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] ${
                        isLoading
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-[#A0C4FF] hover:bg-[#8AB4FF]'
                      }`}
                      style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          {isCompleted ? (
                            <>
                              <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                              ¡Cuenta configurada!
                            </>
                          ) : (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Configurando cuenta...
                            </>
                          )}
                        </div>
                      ) : (
                        '🔵 Elegir Cliente'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Genius Option */}
            <div 
              className={`border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-md ${
                selectedRole === 'genius' 
                  ? 'border-[#FFADAD] bg-red-50/50 shadow-md' 
                  : isLoading 
                  ? 'border-gray-200 cursor-not-allowed opacity-50'
                  : 'border-gray-200 hover:border-[#FFADAD]/50'
              }`}
              onClick={() => !isLoading && setSelectedRole('genius')}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    selectedRole === 'genius' ? 'bg-[#FFADAD]' : 'bg-gray-100'
                  }`}>
                    <Briefcase className={`w-6 h-6 transition-colors ${
                      selectedRole === 'genius' ? 'text-white' : 'text-gray-500'
                    }`} />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-heading text-xl font-bold text-[#2F2F2F] mb-2">
                    🧠 Soy Genio
                  </h3>
                  <p className="text-[#2F2F2F]/70 font-body text-sm leading-relaxed">
                    Quiero ofrecer mis talentos y llegar a más personas.
                  </p>
                  {selectedRole === 'genius' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRoleSelection('genius');
                      }}
                      disabled={isLoading}
                      className={`mt-4 w-full py-3 rounded-xl font-body font-semibold transition-all duration-300 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02] ${
                        isLoading
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-[#FFADAD] hover:bg-[#FF9D9D]'
                      }`}
                      style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          {isCompleted ? (
                            <>
                              <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                              ¡Cuenta configurada!
                            </>
                          ) : (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Configurando cuenta...
                            </>
                          )}
                        </div>
                      ) : (
                        '🟡 Elegir Genio'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-2xl p-4 border border-gray-100">
            <div className="text-center">
              <p className="text-[#2F2F2F]/70 font-body text-sm leading-relaxed">
                🎯 <span className="font-semibold">Consejo:</span> Esta opción solo se elige una vez.
              </p>
              <p className="text-[#2F2F2F]/60 font-body text-xs mt-1">
                Si te equivocas, puedes cambiarla luego desde tu perfil.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialLoginRoleModal;