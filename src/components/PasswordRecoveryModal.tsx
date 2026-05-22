import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    verificationCode: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({ email: '', verificationCode: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    if (isOpen) {
      const selectors: Record<number, string> = { 1: 'input[name="email"]', 2: 'input[name="verificationCode"]', 3: 'input[name="newPassword"]' };
      const t = setTimeout(() => {
        const el = document.querySelector(selectors[currentStep]) as HTMLInputElement;
        el?.focus();
      }, 100);
      return () => clearTimeout(t);
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const iv = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { setCanResend(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [resendTimer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const next = name === 'verificationCode' ? value.replace(/\D/g, '').slice(0, 6) : value;
    setFormData(prev => ({ ...prev, [name]: next }));
    if (errors[name as keyof typeof errors]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (successMessage) setSuccessMessage('');
  };

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || /^\d{9}$/.test(v);

  const validateStep1 = () => {
    if (!formData.email.trim()) { setErrors(p => ({ ...p, email: 'Este campo es requerido' })); return false; }
    if (!validateEmail(formData.email)) { setErrors(p => ({ ...p, email: 'Correo válido o número de 9 dígitos' })); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.verificationCode || formData.verificationCode.length !== 6) {
      setErrors(p => ({ ...p, verificationCode: 'Código de 6 dígitos requerido' })); return false;
    }
    return true;
  };

  const validateStep3 = () => {
    const errs = { ...errors };
    let ok = true;
    if (!formData.newPassword || formData.newPassword.length < 6) { errs.newPassword = 'Mínimo 6 caracteres'; ok = false; }
    if (formData.newPassword !== formData.confirmPassword) { errs.confirmPassword = 'Las contraseñas no coinciden'; ok = false; }
    setErrors(errs);
    return ok;
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) return;
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsLoading(false);
    setSuccessMessage('Código enviado');
    setCurrentStep(2);
    setCanResend(false);
    setResendTimer(60);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsLoading(false);
    setSuccessMessage('Código verificado');
    setCurrentStep(3);
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsLoading(false);
    setSuccessMessage('¡Contraseña actualizada!');
    setTimeout(() => { handleClose(); alert('Contraseña actualizada. Ya puedes iniciar sesión.'); }, 800);
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsLoading(false);
    setSuccessMessage('Código reenviado');
    setCanResend(false);
    setResendTimer(60);
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData({ email: '', verificationCode: '', newPassword: '', confirmPassword: '' });
    setErrors({ email: '', verificationCode: '', newPassword: '', confirmPassword: '' });
    setSuccessMessage('');
    setCanResend(false);
    setResendTimer(0);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  const handleBackStep = () => {
    if (currentStep > 1) { setCurrentStep(currentStep - 1); setSuccessMessage(''); }
  };

  if (!isOpen) return null;

  const inputCls = (err: string) =>
    `w-full px-3.5 py-2 rounded-lg border text-sm text-[#2F2F2F] placeholder-[#2F2F2F]/40 bg-white transition-colors focus:outline-none ${
      err ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-[#A0C4FF]'
    }`;

  const stepTitles = ['Recuperar contraseña', 'Ingresa el código', 'Nueva contraseña'];
  const stepSubs = [
    'Ingresa tu correo o número de celular.',
    `Código enviado a ${formData.email}`,
    'Elige una clave segura.',
  ];

  const progress = [33, 66, 100][currentStep - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative bg-[#FDFDFD] rounded-2xl shadow-xl w-full max-w-[340px] mx-4 animate-in fade-in slide-in-from-bottom-4 duration-300 max-h-[90vh] flex flex-col">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-[#2F2F2F]/30 hover:text-[#2F2F2F]/55 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto">
          {/* Header */}
          <div className="text-center pt-1">
            <h1 className="font-heading text-xl font-semibold text-[#2F2F2F] tracking-tight">
              {stepTitles[currentStep - 1]}
            </h1>
            <p className="text-[#2F2F2F]/40 text-xs mt-1">{stepSubs[currentStep - 1]}</p>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`h-1 rounded-full transition-all duration-300 ${
                  s <= currentStep ? 'bg-[#A0C4FF] w-6' : 'bg-gray-200 w-3'
                }`}
              />
            ))}
          </div>

          {/* Success banner */}
          {successMessage && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-lg">
              <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
              <span className="text-green-700 text-xs">{successMessage}</span>
            </div>
          )}

          {/* Step 1 */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} className="flex flex-col gap-3">
              <div>
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={inputCls(errors.email)}
                  placeholder="correo@ejemplo.com o 987654321"
                  required
                />
                {errors.email && <p className="text-red-400 text-xs mt-0.5 ml-1">{errors.email}</p>}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2.5 rounded-xl font-medium text-sm text-white transition-all duration-200 ${isLoading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#FFADAD] hover:bg-[#FF9D9D]'}`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white/70" />
                    Enviando...
                  </span>
                ) : 'Enviar código'}
              </button>
              <p className="text-center text-[#2F2F2F]/30 text-[11px]">
                Te enviaremos un código para validar tu cuenta.
              </p>
            </form>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit} className="flex flex-col gap-3">
              <div>
                <input
                  type="text"
                  name="verificationCode"
                  value={formData.verificationCode}
                  onChange={handleInputChange}
                  maxLength={6}
                  className={`${inputCls(errors.verificationCode)} text-center text-xl tracking-widest`}
                  placeholder="000000"
                  required
                />
                {errors.verificationCode && <p className="text-red-400 text-xs mt-0.5 ml-1">{errors.verificationCode}</p>}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2.5 rounded-xl font-medium text-sm text-white transition-all duration-200 ${isLoading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#FFADAD] hover:bg-[#FF9D9D]'}`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white/70" />
                    Verificando...
                  </span>
                ) : 'Verificar código'}
              </button>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleBackStep}
                  className="text-[11px] text-[#2F2F2F]/40 hover:text-[#2F2F2F]/65 transition-colors underline underline-offset-2 decoration-[#2F2F2F]/20"
                >
                  Cambiar correo
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={!canResend || isLoading}
                  className={`text-[11px] transition-colors underline underline-offset-2 ${canResend && !isLoading ? 'text-[#A0C4FF] hover:text-[#8AB4FF] decoration-[#A0C4FF]/40' : 'text-gray-300 cursor-not-allowed decoration-gray-200'}`}
                >
                  {canResend ? 'Reenviar código' : `Reenviar (${resendTimer}s)`}
                </button>
              </div>
            </form>
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <form onSubmit={handleStep3Submit} className="flex flex-col gap-3">
              <div>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className={`${inputCls(errors.newPassword)} pr-9`}
                    placeholder="Nueva contraseña"
                    required
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2F2F2F]/35 hover:text-[#2F2F2F]/60 transition-colors">
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {errors.newPassword && <p className="text-red-400 text-xs mt-0.5 ml-1">{errors.newPassword}</p>}
              </div>
              <div>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`${inputCls(errors.confirmPassword)} pr-9`}
                    placeholder="Confirmar contraseña"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2F2F2F]/35 hover:text-[#2F2F2F]/60 transition-colors">
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-0.5 ml-1">{errors.confirmPassword}</p>}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2.5 rounded-xl font-medium text-sm text-white transition-all duration-200 ${isLoading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#FFADAD] hover:bg-[#FF9D9D]'}`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white/70" />
                    Guardando...
                  </span>
                ) : 'Guardar contraseña'}
              </button>
              <div className="text-center">
                <button type="button" onClick={handleBackStep} className="text-[11px] text-[#2F2F2F]/40 hover:text-[#2F2F2F]/65 transition-colors underline underline-offset-2 decoration-[#2F2F2F]/20">
                  Volver al código
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordRecoveryModal;
