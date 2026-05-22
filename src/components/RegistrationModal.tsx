import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Check } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import RegistrationConfirmationModal from './RegistrationConfirmationModal';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    dni: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    accountType: 'client' // 'client' or 'genius'
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dniVerified, setDniVerified] = useState(false);
  const [geniusConsent, setGeniusConsent] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [errors, setErrors] = useState({
    dni: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  // Auto-focus on first field when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const dniInput = document.querySelector('input[name="dni"]') as HTMLInputElement;
        if (dniInput) {
          dniInput.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // DNI verification simulation
    if (name === 'dni' && value.length === 8) {
      setTimeout(() => {
        setDniVerified(true);
      }, 1000);
    } else if (name === 'dni') {
      setDniVerified(false);
    }
  };

  const validateForm = () => {
    const newErrors = { dni: '', email: '', phone: '', password: '', confirmPassword: '' };
    let isValid = true;

    // DNI validation
    if (!formData.dni) {
      newErrors.dni = 'DNI es requerido';
      isValid = false;
    } else if (!/^\d{8}$/.test(formData.dni)) {
      newErrors.dni = 'DNI debe tener 8 dígitos';
      isValid = false;
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Correo es requerido';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Correo no válido';
      isValid = false;
    }

    // Phone validation
    if (!formData.phone) {
      newErrors.phone = 'Celular es requerido';
      isValid = false;
    } else if (!/^\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Celular debe tener 9 dígitos';
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Contraseña es requerida';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
      isValid = false;
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Simulate registration process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create user data
      const userData = {
        id: Date.now().toString(),
        dni: formData.dni,
        email: formData.email,
        phone: formData.phone,
        role: formData.accountType,
        loginMethod: 'email',
        isVerified: true,
        registeredAt: new Date().toISOString(),
        name: `Usuario ${formData.dni}` // Default name, can be updated later
      };
      
      // Store in localStorage (simulate database)
      const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      existingUsers.push(userData);
      localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));
      
      // Also set as current user
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('isAuthenticated', 'true');
      
      console.log('Registration successful:', userData);
      
      setIsLoading(false);
      
      // Close registration modal and show confirmation
      setShowConfirmationModal(true);
      
    } catch (error) {
      console.error('Registration error:', error);
      setIsLoading(false);
      alert('Hubo un error al crear tu cuenta. Por favor, intenta nuevamente.');
    }
  };

  const handleCloseConfirmation = () => {
    setShowConfirmationModal(false);
    onClose(); // Close the registration modal as well
    
    // Reset form data
    setFormData({
      dni: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      accountType: 'client'
    });
    setDniVerified(false);
    setGeniusConsent(false);
    setErrors({
      dni: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    });
  };

  if (!isOpen) return null;

  const inputCls = "w-full px-3.5 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#A0C4FF] transition-colors text-sm text-[#2F2F2F] placeholder-[#2F2F2F]/40 bg-white";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

        <div className="relative bg-[#FDFDFD] rounded-2xl shadow-xl w-full max-w-[340px] mx-4 animate-in fade-in slide-in-from-bottom-4 duration-300 max-h-[90vh] flex flex-col">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#2F2F2F]/30 hover:text-[#2F2F2F]/55 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Scrollable body */}
          <div className="px-6 py-5 overflow-y-auto flex flex-col gap-4">
            {/* Header */}
            <div className="text-center pt-1">
              <h1 className="font-heading text-xl font-semibold text-[#2F2F2F] tracking-tight">
                Crea tu cuenta
              </h1>
              <p className="text-[#2F2F2F]/40 text-xs mt-1">Empecemos algo increíble.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
              {/* DNI */}
              <div>
                <div className="relative">
                  <input
                    type="text"
                    name="dni"
                    value={formData.dni}
                    onChange={handleInputChange}
                    maxLength={8}
                    className={inputCls}
                    placeholder="DNI"
                    required
                  />
                  {dniVerified && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    </div>
                  )}
                </div>
                {errors.dni && <p className="text-red-400 text-xs mt-0.5 ml-1">{errors.dni}</p>}
              </div>

              {/* Email */}
              <div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={inputCls}
                  placeholder="Correo electrónico"
                  required
                />
                {errors.email && <p className="text-red-400 text-xs mt-0.5 ml-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  maxLength={9}
                  className={inputCls}
                  placeholder="Número de celular"
                  required
                />
                {errors.phone && <p className="text-red-400 text-xs mt-0.5 ml-1">{errors.phone}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`${inputCls} pr-9`}
                    placeholder="Contraseña"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2F2F2F]/35 hover:text-[#2F2F2F]/60 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs mt-0.5 ml-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`${inputCls} pr-9`}
                    placeholder="Confirmar contraseña"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2F2F2F]/35 hover:text-[#2F2F2F]/60 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-0.5 ml-1">{errors.confirmPassword}</p>}
              </div>

              {/* Role selector — compact cards */}
              <div className="pt-1">
                <p className="text-[#2F2F2F]/50 text-xs mb-2">¿Cómo usarás la plataforma?</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'client', label: 'Cliente', sub: 'Contratar servicios' },
                    { value: 'genius', label: 'Genio', sub: 'Ofrecer servicios' },
                  ].map(({ value, label, sub }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, accountType: value }))}
                      className={`text-left px-3 py-2.5 rounded-xl border transition-all duration-150 ${
                        formData.accountType === value
                          ? 'border-[#A0C4FF] bg-[#A0C4FF]/8 text-[#2F2F2F]'
                          : 'border-gray-200 bg-white text-[#2F2F2F]/60 hover:border-gray-300'
                      }`}
                    >
                      <p className={`text-xs font-medium ${formData.accountType === value ? 'text-[#2F2F2F]' : ''}`}>{label}</p>
                      <p className="text-[10px] text-[#2F2F2F]/40 mt-0.5 leading-tight">{sub}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Genius consent */}
              {formData.accountType === 'genius' && (
                <label className="flex items-start gap-2.5 cursor-pointer px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-gray-50 transition-colors">
                  <div className="relative flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={geniusConsent}
                      onChange={(e) => setGeniusConsent(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-colors ${geniusConsent ? 'bg-[#A0C4FF] border-[#A0C4FF]' : 'bg-white border-gray-300'}`}>
                      {geniusConsent && <Check className="w-2 h-2 text-white" strokeWidth={3} />}
                    </div>
                  </div>
                  <span className="text-[11px] text-[#2F2F2F]/50 leading-relaxed">
                    Acepto que mi perfil profesional y datos de contacto sean visibles públicamente dentro de la plataforma.
                  </span>
                </label>
              )}

              {/* Submit */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading || (formData.accountType === 'genius' && !geniusConsent)}
                  className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all duration-200 text-white ${
                    isLoading || (formData.accountType === 'genius' && !geniusConsent)
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-[#FFADAD] hover:bg-[#FF9D9D]'
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white/70"></span>
                      Creando cuenta...
                    </span>
                  ) : (
                    'Crear mi cuenta'
                  )}
                </button>
              </div>
            </form>

            {/* Secondary action + legal */}
            <div className="text-center space-y-2 pb-1">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-[#2F2F2F]/40 hover:text-[#2F2F2F]/65 transition-colors underline underline-offset-2 decoration-[#2F2F2F]/20"
              >
                Volver al inicio
              </button>
            </div>
          </div>
        </div>
      </div>

      <RegistrationConfirmationModal
        isOpen={showConfirmationModal}
        onClose={handleCloseConfirmation}
        accountType={formData.accountType as 'client' | 'genius'}
      />
    </>
  );
};

export default RegistrationModal;