import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import RegistrationModal from './RegistrationModal';
import SocialLoginRoleModal from './SocialLoginRoleModal';
import { handleSocialLogin, checkExistingUser, SocialUserInfo } from '../utils/socialAuthUtils';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showSocialRoleModal, setShowSocialRoleModal] = useState(false);
  const [socialLoginData, setSocialLoginData] = useState({
    provider: '',
    userInfo: {
      name: '',
      email: '',
      profileImage: ''
    }
  });

  // Auto-focus when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const firstButton = document.querySelector('.social-login-button') as HTMLButtonElement;
        if (firstButton) {
          firstButton.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const redirectUserBasedOnRole = (user: any) => {
    // Dispatch auth state change event
    window.dispatchEvent(new Event('authStateChanged'));
    
    // Close modal first
    onClose();
    
    // Redirect based on user role
    setTimeout(() => {
      if (user.role === 'genius') {
        window.location.href = '/genius-profile';
        alert(`¡Bienvenido de vuelta ${user.name}!\n\n🚀 Redirigiendo a tu panel de genio...`);
      } else {
        window.location.href = '/client-profile';
        alert(`¡Bienvenido de vuelta ${user.name}!\n\n🎯 Redirigiendo a tu panel de cliente...`);
      }
    }, 100);
  };

  const handleSocialLoginClick = async (provider: 'google' | 'facebook' | 'apple') => {
    console.log(`Initiating ${provider} login...`);
    
    setIsLoading(true);
    setLoadingProvider(provider);
    
    try {
      // Call the real social authentication
      const userInfo: SocialUserInfo = await handleSocialLogin(provider);
      
      console.log(`${provider} authentication successful:`, userInfo);
      
      // Check if user already exists in our system
      const existingUser = checkExistingUser(userInfo.email);
      
      if (existingUser) {
        // User already exists, log them in directly
        localStorage.setItem('currentUser', JSON.stringify(existingUser));
        localStorage.setItem('isAuthenticated', 'true');
        
        console.log(`Existing user logged in via ${provider}:`, existingUser);
        
        // Redirect user based on their role
        redirectUserBasedOnRole(existingUser);
      } else {
        // New user, show role selection
        const socialData = {
          provider: provider,
          userInfo: {
            name: userInfo.name,
            email: userInfo.email,
            profileImage: userInfo.profileImage || ''
          }
        };
        
        setSocialLoginData(socialData);
        setShowSocialRoleModal(true);
      }
      
    } catch (error) {
      console.error(`${provider} login error:`, error);
      
      // Handle specific error messages
      let errorMessage = `Error al iniciar sesión con ${provider}. Por favor, intenta nuevamente.`;
      
      if (error instanceof Error) {
        if (error.message.includes('cancelled')) {
          errorMessage = `Inicio de sesión con ${provider} cancelado.`;
        } else if (error.message.includes('popup')) {
          errorMessage = `Por favor, permite las ventanas emergentes para iniciar sesión con ${provider}.`;
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleCreateAccount = () => {
    setShowRegistrationModal(true);
  };

  const handleCloseRegistration = () => {
    setShowRegistrationModal(false);
  };

  const handleCloseSocialRoleModal = () => {
    setShowSocialRoleModal(false);
    onClose(); // Also close the main login modal
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Background Overlay */}
        <div 
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Login Modal Card */}
        <div className="relative bg-[#FDFDFD] rounded-3xl shadow-2xl w-full max-w-[400px] mx-4 transform transition-all duration-300 scale-100 animate-in fade-in slide-in-from-bottom-4 h-[480px] overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-[#2F2F2F]/40 hover:text-[#2F2F2F]/60 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="px-8 py-8 h-full flex flex-col">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="font-heading text-3xl font-bold text-[#2F2F2F] leading-tight">
                Estamos a<br />
                tus órdenes
              </h1>
              <p className="text-[#2F2F2F]/60 text-sm font-body mt-3">
                Inicia sesión para conectar con los mejores genios
              </p>
            </div>

            {/* Social Login Buttons */}
            <div className="flex-1 space-y-4">
              {/* Google Button */}
              <button
                type="button"
                onClick={() => handleSocialLoginClick('google')}
                disabled={isLoading}
                className="social-login-button w-full py-3.5 rounded-2xl font-body font-semibold transition-all duration-300 text-[#2F2F2F] text-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] bg-white border-2 border-gray-200 hover:border-[#A0C4FF] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
              >
                {isLoading && loadingProvider === 'google' ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#2F2F2F] mr-2"></div>
                    Conectando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 mr-3 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">G</span>
                    </div>
                    Continuar con Google
                  </div>
                )}
              </button>

              {/* Facebook Button */}
              <button
                type="button"
                onClick={() => handleSocialLoginClick('facebook')}
                disabled={isLoading}
                className="social-login-button w-full py-3.5 rounded-2xl font-body font-semibold transition-all duration-300 text-[#2F2F2F] text-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] bg-white border-2 border-gray-200 hover:border-[#A0C4FF] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
              >
                {isLoading && loadingProvider === 'facebook' ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#2F2F2F] mr-2"></div>
                    Conectando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 mr-3 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-xs">f</span>
                    </div>
                    Continuar con Facebook
                  </div>
                )}
              </button>

              {/* Apple Button */}
              <button
                type="button"
                onClick={() => handleSocialLoginClick('apple')}
                disabled={isLoading}
                className="social-login-button w-full py-3.5 rounded-2xl font-body font-semibold transition-all duration-300 text-[#2F2F2F] text-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] bg-white border-2 border-gray-200 hover:border-[#A0C4FF] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
              >
                {isLoading && loadingProvider === 'apple' ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#2F2F2F] mr-2"></div>
                    Conectando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 mr-3 bg-black rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">🍎</span>
                    </div>
                    Continuar con Apple
                  </div>
                )}
              </button>
            </div>

            {/* Bottom Section */}
            <div className="mt-6 space-y-4">
              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#FDFDFD] text-[#2F2F2F]/60">o</span>
                </div>
              </div>

              {/* Email Registration Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleCreateAccount}
                  disabled={isLoading}
                  className="text-[#A0C4FF] hover:text-[#8AB4FF] transition-colors font-semibold text-sm underline disabled:opacity-50"
                  style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: '600' }}
                >
                  Registrarse con email
                </button>
              </div>

              {/* Footer Text */}
              <div className="text-center">
                <p className="text-[#2F2F2F]/40 text-xs font-body">
                  Al continuar, aceptas nuestros términos y condiciones
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <RegistrationModal 
        isOpen={showRegistrationModal} 
        onClose={handleCloseRegistration} 
      />

      {/* Social Login Role Selection Modal */}
      <SocialLoginRoleModal 
        isOpen={showSocialRoleModal}
        onClose={handleCloseSocialRoleModal}
        providerName={socialLoginData.provider}
        userInfo={socialLoginData.userInfo}
      />
    </>
  );
};

export default LoginModal;