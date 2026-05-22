import React, { useState } from 'react';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';

interface ForcePasswordChangeProps {
  geniusName: string;
  email: string;
  onComplete: () => void;
}

const ForcePasswordChange: React.FC<ForcePasswordChangeProps> = ({ geniusName, email, onComplete }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ newPassword: '', confirmPassword: '' });
  const [done, setDone] = useState(false);

  const validate = () => {
    const errs = { newPassword: '', confirmPassword: '' };
    let ok = true;
    if (!newPassword || newPassword.length < 6) {
      errs.newPassword = 'Mínimo 6 caracteres';
      ok = false;
    }
    if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'Las contraseñas no coinciden';
      ok = false;
    }
    setErrors(errs);
    return ok;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    try {
      // Update mustChangePassword flag in localStorage for the pending access record
      const pendingAccess: any[] = JSON.parse(localStorage.getItem('geniusPendingAccess') || '[]');
      const updated = pendingAccess.map(a =>
        a.email === email ? { ...a, mustChangePassword: false, newPassword } : a
      );
      localStorage.setItem('geniusPendingAccess', JSON.stringify(updated));

      // Mark current session as password changed
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (currentUser) {
        const updatedUser = { ...currentUser, mustChangePassword: false };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }

      await new Promise(r => setTimeout(r, 800));
      setDone(true);
      setTimeout(() => onComplete(), 1200);
    } catch {
      alert('Error al cambiar la contraseña. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls = (err: string) =>
    `w-full px-3.5 py-2.5 rounded-lg border text-sm text-gray-800 placeholder-gray-400 bg-white transition-colors focus:outline-none ${
      err ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-[#A0C4FF]'
    }`;

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-[360px] p-8 text-center">
          <div className="inline-flex w-12 h-12 rounded-full bg-green-50 items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-gray-900">Contraseña actualizada</h2>
          <p className="text-sm text-gray-400 mt-2">Accediendo a tu dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[360px]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 text-center">
          <div className="inline-flex w-10 h-10 rounded-full bg-amber-50 items-center justify-center mb-3">
            <Lock className="w-5 h-5 text-amber-500" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-gray-900 tracking-tight">
            Cambia tu contraseña
          </h2>
          <p className="text-sm text-gray-400 mt-1 leading-relaxed">
            Hola {geniusName}, por seguridad debes crear una nueva contraseña antes de continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {/* Email read-only */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Correo</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-100 bg-gray-50 text-sm text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* New password */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Nueva contraseña *</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); if (errors.newPassword) setErrors(p => ({ ...p, newPassword: '' })); }}
                className={`${inputCls(errors.newPassword)} pr-9`}
                placeholder="Mínimo 6 caracteres"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
              >
                {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {errors.newPassword && <p className="text-red-400 text-xs mt-0.5 ml-1">{errors.newPassword}</p>}
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirmar contraseña *</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors(p => ({ ...p, confirmPassword: '' })); }}
                className={`${inputCls(errors.confirmPassword)} pr-9`}
                placeholder="Repite tu nueva contraseña"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
              >
                {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-400 text-xs mt-0.5 ml-1">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2.5 rounded-xl font-medium text-sm text-white transition-all duration-200 ${
              isLoading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#FFADAD] hover:bg-[#FF9D9D]'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white/70" />
                Guardando...
              </span>
            ) : (
              'Cambiar contraseña y acceder'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForcePasswordChange;
