import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1); // 1, 2, or 3
  const [formData, setFormData] = useState({
    email: '',
    verificationCode: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({
    email: '',
    verificationCode: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Auto-focus on first field when modal opens or step changes
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        let inputSelector = '';
        switch (currentStep) {
          case 1:
            inputSelector = 'input[name="email"]';
            break;
          case 2:
            inputSelector = 'input[name="verificationCode"]';
            break;
          case 3:
            inputSelector = 'input[name="newPassword"]';
            break;
        }
        const input = document.querySelector(inputSelector) as HTMLInputElement;
        if (input) {
          input.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentStep]);

  // Resend timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Special handling for verification code - only allow numbers and limit to 6 digits
    if (name === 'verificationCode') {
      const numericValue = value.replace(/\D/g, '').slice(0, 6);
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Clear success message when user starts typing
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{9}$/;
    return emailRegex.test(email) || phoneRegex.test(email);
  };

  const validateStep1 = () => {
    const newErrors = { ...errors };
    let isValid = true;

    if (!formData.email.trim()) {
      newErrors.email = 'Este campo es requerido';
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Ingresa un correo válido o número de 9 dígitos';
      isValid = false;
    } else {
      newErrors.email = '';
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateStep2 = () => {
    const newErrors = { ...errors };
    let isValid = true;

    if (!formData.verificationCode) {
      newErrors.verificationCode = 'Ingresa el código de verificación';
      isValid = false;
    } else if (formData.verificationCode.length !== 6) {
      newErrors.verificationCode = 'El código debe tener 6 dígitos';
      isValid = false;
    } else if (!/^\d{6}$/.test(formData.verificationCode)) {
      newErrors.verificationCode = 'El código solo debe contener números';
      isValid = false;
    } else {
      newErrors.verificationCode = '';
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateStep3 = () => {
    const newErrors = { ...errors };
    let isValid = true;

    // Password validation
    if (!formData.newPassword) {
      newErrors.newPassword = 'La contraseña es requerida';
      isValid = false;
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'La contraseña debe tener al menos 6 caracteres';
      isValid = false;
    } else if (formData.newPassword.length > 50) {
      newErrors.newPassword = 'La contraseña no puede tener más de 50 caracteres';
      isValid = false;
    } else {
      newErrors.newPassword = '';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu nueva contraseña';
      isValid = false;
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
      isValid = false;
    } else {
      newErrors.confirmPassword = '';
    }

    setErrors(newErrors);
    return isValid;
  };

  const simulateApiCall = (duration: number) => {
    return new Promise(resolve => setTimeout(resolve, duration));
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) return;
    
    setIsLoading(true);
    setSuccessMessage('');
    
    try {
      // Simulate API call to send verification code
      await simulateApiCall(1500);
      
      console.log('Sending verification code to:', formData.email);
      
      setSuccessMessage('Código enviado exitosamente');
      setCurrentStep(2);
      setCanResend(false);
      setResendTimer(60); // 60 seconds countdown
      
    } catch (error) {
      setErrors(prev => ({ ...prev, email: 'Error al enviar el código. Intenta nuevamente.' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;
    
    setIsLoading(true);
    setSuccessMessage('');
    
    try {
      // Simulate API call to verify code
      await simulateApiCall(1000);
      
      console.log('Verifying code:', formData.verificationCode);
      
      // Simulate code verification (in real app, this would be validated by backend)
      if (formData.verificationCode === '123456') {
        setSuccessMessage('Código verificado correctamente');
        setCurrentStep(3);
      } else {
        // For demo purposes, accept any 6-digit code
        setSuccessMessage('Código verificado correctamente');
        setCurrentStep(3);
      }
      
    } catch (error) {
      setErrors(prev => ({ ...prev, verificationCode: 'Código incorrecto. Intenta nuevamente.' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;
    
    setIsLoading(true);
    setSuccessMessage('');
    
    try {
      // Simulate API call to update password
      await simulateApiCall(1500);
      
      console.log('Updating password for:', formData.email);
      
      setSuccessMessage('¡Contraseña actualizada exitosamente!');
      
      // Wait a moment to show success message
      setTimeout(() => {
        handleClose();
        
        // Show success alert
        alert('¡Contraseña actualizada exitosamente!\n\nYa puedes iniciar sesión con tu nueva contraseña.');
      }, 1000);
      
    } catch (error) {
      setErrors(prev => ({ ...prev, newPassword: 'Error al actualizar la contraseña. Intenta nuevamente.' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    setSuccessMessage('');
    
    try {
      // Simulate API call to resend code
      await simulateApiCall(1000);
      
      console.log('Resending verification code to:', formData.email);
      
      setSuccessMessage('Código reenviado exitosamente');
      setCanResend(false);
      setResendTimer(60); // Reset timer
      
    } catch (error) {
      setErrors(prev => ({ ...prev, verificationCode: 'Error al reenviar el código. Intenta nuevamente.' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset all state
    setCurrentStep(1);
    setFormData({
      email: '',
      verificationCode: '',
      newPassword: '',
      confirmPassword: ''
    });
    setErrors({
      email: '',
      verificationCode: '',
      newPassword: '',
      confirmPassword: ''
    });
    setSuccessMessage('');
    setCanResend(false);
    setResendTimer(0);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setSuccessMessage('');
      // Clear errors for the current step
      const newErrors = { ...errors };
      if (currentStep === 2) {
        newErrors.verificationCode = '';
      } else if (currentStep === 3) {
        newErrors.newPassword = '';
        newErrors.confirmPassword = '';
      }
      setErrors(newErrors);
    }
  };

  if (!isOpen) return null;

  const getProgressPercentage = () => {
    switch (currentStep) {
      case 1: return 25;
      case 2: return 50;
      case 3: return 100;
      default: return 25;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Recuperar\ncontraseña';
      case 2: return 'Código enviado\na tu contacto';
      case 3: return 'Crea tu nueva\ncontraseña';
      default: return 'Recuperar\ncontraseña';
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1: return '¡No te preocupes!\nTe ayudamos a volver 💪';
      case 2: return 'Revisa tu correo o celular.\nFalta poquito 😊';
      case 3: return 'Usa una clave segura que\nsolo tú recuerdes 😊';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background Overlay */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Recovery Modal Card */}
      <div className="relative bg-[#FDFDFD] rounded-3xl shadow-2xl w-full max-w-[400px] mx-4 transform transition-all duration-300 scale-100 animate-in fade-in slide-in-from-bottom-4 h-[520px] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 text-[#2F2F2F]/40 hover:text-[#2F2F2F]/60 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="px-8 py-8 h-full flex flex-col">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="font-heading text-2xl font-bold text-[#2F2F2F] leading-tight mb-2 whitespace-pre-line">
              {getStepTitle()}
            </h1>
            <p className="text-[#2F2F2F]/60 text-sm font-body whitespace-pre-line">
              {getStepSubtitle()}
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
              <span className="text-green-700 text-sm font-medium">{successMessage}</span>
            </div>
          )}

          {/* STEP 1: Email Input */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} className="flex-1 space-y-6">
              <div>
                <p className="text-[#2F2F2F] font-medium mb-3 text-sm">
                  Ingresa tu correo electrónico<br />
                  o número de celular
                </p>
                <input
                  type="text"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-6 py-3.5 rounded-2xl border-2 transition-colors font-body text-[#2F2F2F] placeholder-[#2F2F2F]/50 ${
                    errors.email 
                      ? 'border-red-300 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200' 
                      : 'border-gray-200 focus:outline-none focus:border-[#A0C4FF]'
                  }`}
                  placeholder="correo@ejemplo.com o 987654321"
                  style={{ fontFamily: 'Roboto, sans-serif', fontWeight: '300' }}
                  required
                />
                {errors.email && (
                  <div className="flex items-center mt-2 ml-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mr-1 flex-shrink-0" />
                    <p className="text-red-500 text-sm">{errors.email}</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3.5 rounded-2xl font-body font-semibold transition-all duration-300 text-white text-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] ${
                  isLoading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-[#FFADAD] hover:bg-[#FF9D9D]'
                }`}
                style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Enviando código...
                  </div>
                ) : (
                  'Enviar código de verificación'
                )}
              </button>

              <div className="text-center">
                <p className="text-[#2F2F2F]/60 text-xs font-body">
                  Te enviaremos un código<br />
                  para validar tu cuenta.
                </p>
              </div>
            </form>
          )}

          {/* STEP 2: Verification Code */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit} className="flex-1 space-y-6">
              <div>
                <input
                  type="text"
                  name="verificationCode"
                  value={formData.verificationCode}
                  onChange={handleInputChange}
                  maxLength={6}
                  className={`w-full px-6 py-3.5 rounded-2xl border-2 transition-colors font-body text-[#2F2F2F] placeholder-[#2F2F2F]/50 text-center text-2xl tracking-widest ${
                    errors.verificationCode 
                      ? 'border-red-300 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200' 
                      : 'border-gray-200 focus:outline-none focus:border-[#A0C4FF]'
                  }`}
                  placeholder="000000"
                  style={{ fontFamily: 'Roboto, sans-serif', fontWeight: '300' }}
                  required
                />
                {errors.verificationCode && (
                  <div className="flex items-center mt-2 ml-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mr-1 flex-shrink-0" />
                    <p className="text-red-500 text-sm">{errors.verificationCode}</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3.5 rounded-2xl font-body font-semibold transition-all duration-300 text-white text-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] ${
                  isLoading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-[#FFADAD] hover:bg-[#FF9D9D]'
                }`}
                style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Verificando...
                  </div>
                ) : (
                  'Verificar'
                )}
              </button>

              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={!canResend || isLoading}
                  className={`font-semibold text-sm transition-colors ${
                    canResend && !isLoading
                      ? 'text-[#A0C4FF] hover:text-[#8AB4FF] cursor-pointer'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                  style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: '600' }}
                >
                  {canResend ? 'Reenviar código' : `Reenviar código (${resendTimer}s)`}
                </button>
                
                <div>
                  <button
                    type="button"
                    onClick={handleBackStep}
                    className="text-[#2F2F2F]/60 hover:text-[#2F2F2F] transition-colors text-sm"
                  >
                    ← Cambiar correo/teléfono
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* STEP 3: New Password */}
          {currentStep === 3 && (
            <form onSubmit={handleStep3Submit} className="flex-1 space-y-4">
              {/* New Password Field */}
              <div>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className={`w-full px-6 py-3.5 pr-14 rounded-2xl border-2 transition-colors font-body text-[#2F2F2F] placeholder-[#2F2F2F]/50 ${
                      errors.newPassword 
                        ? 'border-red-300 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200' 
                        : 'border-gray-200 focus:outline-none focus:border-[#A0C4FF]'
                    }`}
                    placeholder="Nueva contraseña"
                    style={{ fontFamily: 'Roboto, sans-serif', fontWeight: '300' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#2F2F2F]/40 hover:text-[#2F2F2F]/60 transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <div className="flex items-center mt-2 ml-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mr-1 flex-shrink-0" />
                    <p className="text-red-500 text-sm">{errors.newPassword}</p>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-6 py-3.5 pr-14 rounded-2xl border-2 transition-colors font-body text-[#2F2F2F] placeholder-[#2F2F2F]/50 ${
                      errors.confirmPassword 
                        ? 'border-red-300 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200' 
                        : 'border-gray-200 focus:outline-none focus:border-[#A0C4FF]'
                    }`}
                    placeholder="Confirmar contraseña"
                    style={{ fontFamily: 'Roboto, sans-serif', fontWeight: '300' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#2F2F2F]/40 hover:text-[#2F2F2F]/60 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="flex items-center mt-2 ml-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mr-1 flex-shrink-0" />
                    <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3.5 rounded-2xl font-body font-semibold transition-all duration-300 text-white text-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] ${
                    isLoading
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-[#FFADAD] hover:bg-[#FF9D9D]'
                  }`}
                  style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </div>
                  ) : (
                    'Guardar nueva contraseña'
                  )}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleBackStep}
                  className="text-[#2F2F2F]/60 hover:text-[#2F2F2F] transition-colors text-sm"
                >
                  ← Volver al código
                </button>
              </div>
            </form>
          )}

          {/* Progress Bar - Always at bottom */}
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#A0C4FF] h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
            <div className="text-center mt-2">
              <span className="text-[#A0C4FF] font-bold text-lg">
                {getProgressPercentage()}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordRecoveryModal;