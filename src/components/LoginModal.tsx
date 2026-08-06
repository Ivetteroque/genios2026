import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { signInWithGoogle } from '../utils/socialAuthUtils';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Auto-focus the Google button when the modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const btn = document.querySelector('.social-login-button') as HTMLButtonElement;
        btn?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // Real Supabase OAuth: this redirects away to Google. When the browser
      // returns to the app, SocialAuthBridge resumes the flow (logs the user in
      // or asks for a role if it's a brand-new account).
      await signInWithGoogle();
      // page is navigating to Google; nothing else to do here
    } catch (error) {
      console.error('Google login error:', error);
      alert('Error al iniciar sesión con Google. Por favor, intenta nuevamente.');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
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

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="social-login-button w-full py-3 rounded-xl font-body transition-all duration-200 text-[#2F2F2F]/80 text-sm bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
          >
            {isLoading ? (
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

          {/* Legal */}
          <p className="text-center text-[#2F2F2F]/30 text-[11px] font-body leading-relaxed">
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
  );
};

export default LoginModal;
