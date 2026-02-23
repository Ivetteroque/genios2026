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
    setErrors({
      dni: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    });
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

        {/* Registration Modal Card - Increased height for all fields */}
        <div className="relative bg-[#FDFDFD] rounded-3xl shadow-2xl w-full max-w-[400px] mx-4 transform transition-all duration-300 scale-100 animate-in fade-in slide-in-from-bottom-4 h-[680px] overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-[#2F2F2F]/40 hover:text-[#2F2F2F]/60 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="px-8 py-8 h-full flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="font-heading text-2xl font-bold text-[#2F2F2F] leading-tight mb-2">
                🌟 ¡Bienvenido a Genios a la Obra!
              </h1>
              <p className="text-[#2F2F2F]/60 text-sm font-body">
                Crea tu cuenta y empieza a conectar talentos
              </p>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="flex-1 space-y-4">
              {/* DNI Field */}
              <div>
                <div className="relative">
                  <input
                    type="text"
                    name="dni"
                    value={formData.dni}
                    onChange={handleInputChange}
                    maxLength={8}
                    className="w-full px-6 py-3 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-[#A0C4FF] transition-colors font-body text-[#2F2F2F] placeholder-[#2F2F2F]/50"
                    placeholder="📛 DNI (verificación automática)"
                    style={{ fontFamily: 'Roboto, sans-serif', fontWeight: '300' }}
                    required
                  />
                  {dniVerified && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                </div>
                {errors.dni && (
                  <p className="text-red-500 text-sm mt-1 ml-2">{errors.dni}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-6 py-3 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-[#A0C4FF] transition-colors font-body text-[#2F2F2F] placeholder-[#2F2F2F]/50"
                  placeholder="📧 Correo electrónico"
                  style={{ fontFamily: 'Roboto, sans-serif', fontWeight: '300' }}
                  required
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1 ml-2">{errors.email}</p>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  maxLength={9}
                  className="w-full px-6 py-3 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-[#A0C4FF] transition-colors font-body text-[#2F2F2F] placeholder-[#2F2F2F]/50"
                  placeholder="📱 Número de celular"
                  style={{ fontFamily: 'Roboto, sans-serif', fontWeight: '300' }}
                  required
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1 ml-2">{errors.phone}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-6 py-3 pr-14 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-[#A0C4FF] transition-colors font-body text-[#2F2F2F] placeholder-[#2F2F2F]/50"
                    placeholder="🔑 Crear contraseña"
                    style={{ fontFamily: 'Roboto, sans-serif', fontWeight: '300' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#2F2F2F]/40 hover:text-[#2F2F2F]/60 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1 ml-2">{errors.password}</p>
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
                    className="w-full px-6 py-3 pr-14 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-[#A0C4FF] transition-colors font-body text-[#2F2F2F] placeholder-[#2F2F2F]/50"
                    placeholder="🔁 Confirmar contraseña"
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
                  <p className="text-red-500 text-sm mt-1 ml-2">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Account Type Selection */}
              <div className="pt-2">
                <p className="text-[#2F2F2F] font-medium mb-3 text-sm">
                  🧩 ¿Cómo usarás Genios a la Obra?
                </p>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="accountType"
                      value="client"
                      checked={formData.accountType === 'client'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#A0C4FF] focus:ring-[#A0C4FF] focus:ring-2"
                    />
                    <span className="text-[#2F2F2F] font-body text-sm">
                      Quiero contratar servicios (Cliente)
                    </span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="accountType"
                      value="genius"
                      checked={formData.accountType === 'genius'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#A0C4FF] focus:ring-[#A0C4FF] focus:ring-2"
                    />
                    <span className="text-[#2F2F2F] font-body text-sm">
                      Quiero ofrecer mis servicios (Genio)
                    </span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 space-y-3">
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
                      Creando cuenta...
                    </div>
                  ) : (
                    '🔴 Crear mi cuenta'
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3.5 rounded-2xl font-body font-semibold transition-all duration-300 text-[#2F2F2F] text-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
                >
                  🔙 Volver al inicio
                </button>
              </div>
            </form>

            {/* Bottom Message */}
            <div className="mt-4 text-center">
              <p className="text-[#2F2F2F]/60 text-xs font-body italic">
                "Genios o clientes, todos son bienvenidos."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Confirmation Modal */}
      <RegistrationConfirmationModal 
        isOpen={showConfirmationModal}
        onClose={handleCloseConfirmation}
        accountType={formData.accountType as 'client' | 'genius'}
      />
    </>
  );
};

export default RegistrationModal;