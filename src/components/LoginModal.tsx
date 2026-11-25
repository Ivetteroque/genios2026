import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { signInWithGoogle } from '../utils/socialAuthUtils';
import { rememberPostLoginRedirect } from '../utils/onboardingUtils';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Texto según el contexto (p. ej. "Crea tu perfil de genio"). */
  title?: string;
  subtitle?: string;
  /** Ruta a la que volver después de entrar con Google. */
  redirectTo?: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, title, subtitle, redirectTo }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

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
    setLoginError('');
    // Google devuelve a la persona a la página de inicio; SocialAuthBridge la
    // lleva después a donde iba (por ejemplo, al formulario del genio).
    rememberPostLoginRedirect(redirectTo ?? window.location.pathname + window.location.search);
    try {
      // Real Supabase OAuth: this redirects away to Google. When the browser
      // returns to the app, SocialAuthBridge resumes the flow (logs the user in
      // or asks for a role if it's a brand-new account).
      await signInWithGoogle();
      // page is navigating to Google; nothing else to do here
    } catch (error) {
      console.error('Google login error:', error);
      setLoginError('No pudimos conectar con Google. Revisa tu conexión e inténtalo de nuevo.');
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
          aria-label="Cerrar"
          className="absolute top-5 right-5 text-[#2F2F2F]/30 hover:text-[#2F2F2F]/55 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-7 py-7 flex flex-col gap-5">
          {/* Header */}
          <div className="text-center">
            <h1 className="font-heading text-2xl font-semibold text-[#2F2F2F] leading-snug tracking-tight">
              {title ?? 'Bienvenido 👋'}
            </h1>
            <p className="text-[#2F2F2F]/45 text-sm font-body mt-1.5">
              {subtitle ?? 'Conecta con personas increíbles cerca de ti'}
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

          {loginError && <p role="alert" className="text-sm text-red-600 text-center -mt-2">{loginError}</p>}

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
