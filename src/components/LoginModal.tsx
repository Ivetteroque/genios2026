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
        <div className="relative bg-[#FDFDFD] rounded-2xl shadow-xl w-full max-w-[360px] mx-4 transform transition-all duration-300 scale-100 animate-in fade-in slide-in-from-bottom-4 overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-[#2F2F2F]/30 hover:text-[#2F2F2F]/55 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="px-7 py-7 flex flex-col gap-5">
            {/* Header */}
            <div className="text-center">
              <h1 className="font-heading text-2xl font-semibold text-[#2F2F2F] leading-snug tracking-tight">
                Bienvenido 👋
              </h1>
              <p className="text-[#2F2F2F]/45 text-sm font-body mt-1.5">
                Conecta con personas increíbles cerca de ti
              </p>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-2.5">
              {/* Google Button */}
              <button
                type="button"
                onClick={() => handleSocialLoginClick('google')}
                disabled={isLoading}
                className="social-login-button w-full py-3 rounded-xl font-body transition-all duration-200 text-[#2F2F2F]/80 text-sm bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
              >
                {isLoading && loadingProvider === 'google' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2F2F2F]/40"></div>
                    <span>Conectando...</span>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold" style={{ fontSize: '9px' }}>G</span>
                    </div>
                    <span className="font-medium">Continuar con Google</span>
                  </>
                )}
              </button>

              {/* Facebook Button */}
              <button
                type="button"
                onClick={() => handleSocialLoginClick('facebook')}
                disabled={isLoading}
                className="social-login-button w-full py-3 rounded-xl font-body transition-all duration-200 text-[#2F2F2F]/80 text-sm bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
              >
                {isLoading && loadingProvider === 'facebook' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2F2F2F]/40"></div>
                    <span>Conectando...</span>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold" style={{ fontSize: '9px' }}>f</span>
                    </div>
                    <span className="font-medium">Continuar con Facebook</span>
                  </>
                )}
              </button>

              {/* Apple Button */}
              <button
                type="button"
                onClick={() => handleSocialLoginClick('apple')}
                disabled={isLoading}
                className="social-login-button w-full py-3 rounded-xl font-body transition-all duration-200 text-[#2F2F2F]/80 text-sm bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
              >
                {isLoading && loadingProvider === 'apple' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2F2F2F]/40"></div>
                    <span>Conectando...</span>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 bg-[#1a1a1a] rounded-full flex items-center justify-center flex-shrink-0">
                      <span style={{ fontSize: '9px' }}>🍎</span>
                    </div>
                    <span className="font-medium">Continuar con Apple</span>
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-[#FDFDFD] text-[#2F2F2F]/30 text-xs">o</span>
              </div>
            </div>

            {/* Email Registration + Legal */}
            <div className="text-center space-y-3 pb-1">
              <button
                type="button"
                onClick={handleCreateAccount}
                disabled={isLoading}
                className="text-[#2F2F2F]/55 hover:text-[#2F2F2F]/80 transition-colors text-sm underline underline-offset-2 decoration-[#2F2F2F]/25 hover:decoration-[#2F2F2F]/50 disabled:opacity-50"
              >
                Registrarse con email
              </button>

              <p className="text-[#2F2F2F]/30 text-[11px] font-body leading-relaxed">
                Al continuar aceptas los{' '}
                <a href="/terminos" className="underline underline-offset-1 text-[#2F2F2F]/45 hover:text-[#2F2F2F]/60 transition-colors">
                  Términos y Condiciones
                </a>{' '}
                y la{' '}
                <a href="/privacidad" className="underline underline-offset-1 text-[#2F2F2F]/45 hover:text-[#2F2F2F]/60 transition-colors">
                  Política de Privacidad
                </a>.
              </p>
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