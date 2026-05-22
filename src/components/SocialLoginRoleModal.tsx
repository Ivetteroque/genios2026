import React, { useState } from 'react';
import { X, User, Briefcase, CheckCircle } from 'lucide-react';
import { createUserFromSocialLogin, saveUser } from '../utils/socialAuthUtils';

interface SocialLoginRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerName: string;
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
  userInfo,
}) => {
  const [selectedRole, setSelectedRole] = useState<'client' | 'genius' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleRoleSelection = async (role: 'client' | 'genius') => {
    setSelectedRole(role);
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1800));
      const userData = createUserFromSocialLogin(
        { id: Date.now().toString(), name: userInfo.name, email: userInfo.email, profileImage: userInfo.profileImage, provider: providerName as 'google' | 'facebook' | 'apple' },
        role
      );
      saveUser(userData);
      window.dispatchEvent(new Event('authStateChanged'));
      setIsCompleted(true);
      setTimeout(() => {
        setIsLoading(false);
        window.location.href = role === 'client' ? '/client-profile' : '/genius-profile';
        onClose();
      }, 1000);
    } catch {
      setIsLoading(false);
      alert('Hubo un error al configurar tu cuenta. Intenta nuevamente.');
    }
  };

  if (!isOpen) return null;

  const roles = [
    { value: 'client' as const, icon: User, label: 'Cliente', sub: 'Contratar servicios', accent: '#A0C4FF' },
    { value: 'genius' as const, icon: Briefcase, label: 'Genio', sub: 'Ofrecer servicios', accent: '#FFADAD' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in"
        onClick={!isLoading ? onClose : undefined}
      />

      <div className="relative bg-[#FDFDFD] rounded-2xl shadow-xl w-full max-w-[340px] mx-4 animate-in fade-in slide-in-from-bottom-4 duration-300 max-h-[90vh] flex flex-col">
        {!isLoading && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#2F2F2F]/30 hover:text-[#2F2F2F]/55 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto">
          {/* Header */}
          <div className="text-center pt-1">
            <h1 className="font-heading text-xl font-semibold text-[#2F2F2F] tracking-tight">
              Un último paso
            </h1>
            <p className="text-[#2F2F2F]/40 text-xs mt-1">¿Cómo usarás la plataforma?</p>
          </div>

          {/* User info pill */}
          <div className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl">
            {userInfo.profileImage ? (
              <img src={userInfo.profileImage} alt={userInfo.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#2F2F2F] truncate">{userInfo.name}</p>
              <p className="text-[10px] text-[#2F2F2F]/40 truncate">
                Vía {providerName.charAt(0).toUpperCase() + providerName.slice(1)}
              </p>
            </div>
            <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
          </div>

          {/* Role cards */}
          <div className="grid grid-cols-2 gap-2">
            {roles.map(({ value, icon: Icon, label, sub, accent }) => {
              const active = selectedRole === value;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={isLoading}
                  onClick={() => !isLoading && setSelectedRole(value)}
                  className={`text-left px-3 py-3 rounded-xl border transition-all duration-150 ${
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent)]/8 text-[#2F2F2F]'
                      : isLoading
                      ? 'border-gray-200 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 bg-white text-[#2F2F2F]/60 hover:border-gray-300'
                  }`}
                  style={{ '--accent': accent } as React.CSSProperties}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 transition-colors ${active ? 'bg-[var(--accent)]/20' : 'bg-gray-100'}`}
                    style={{ '--accent': accent } as React.CSSProperties}>
                    <Icon className="w-3.5 h-3.5" style={{ color: active ? accent : '#9ca3af' }} />
                  </div>
                  <p className={`text-xs font-medium ${active ? 'text-[#2F2F2F]' : ''}`}>{label}</p>
                  <p className="text-[10px] text-[#2F2F2F]/40 mt-0.5 leading-tight">{sub}</p>
                </button>
              );
            })}
          </div>

          {/* Confirm button */}
          <button
            type="button"
            disabled={!selectedRole || isLoading}
            onClick={() => selectedRole && handleRoleSelection(selectedRole)}
            className={`w-full py-2.5 rounded-xl font-medium text-sm text-white transition-all duration-200 ${
              !selectedRole || isLoading
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-[#FFADAD] hover:bg-[#FF9D9D]'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                {isCompleted ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    Cuenta lista
                  </>
                ) : (
                  <>
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white/70" />
                    Configurando...
                  </>
                )}
              </span>
            ) : (
              'Confirmar'
            )}
          </button>

          {/* Hint */}
          <p className="text-center text-[#2F2F2F]/30 text-[11px] pb-1">
            Puedes cambiar tu rol desde tu perfil después.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SocialLoginRoleModal;
