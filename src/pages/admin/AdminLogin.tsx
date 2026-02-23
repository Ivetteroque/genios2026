import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import { validateAdminCredentials, setCurrentAdmin, isAdminAuthenticated } from '../../utils/adminAuthUtils';

const AdminLogin: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAdminAuthenticated()) {
      window.location.href = '/admin/dashboard';
    }
  }, []);

  // Auto-focus on email field
  useEffect(() => {
    const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
    if (emailInput) {
      emailInput.focus();
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Por favor, completa todos los campos');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const admin = await validateAdminCredentials(formData.email, formData.password);
      
      if (admin) {
        setCurrentAdmin(admin);
        
        // Show success message
        alert(`¡Bienvenido ${admin.name}!\n\nAcceso autorizado al panel de administración.`);
        
        // Redirect to dashboard
        window.location.href = '/admin/dashboard';
      } else {
        setError('Credenciales incorrectas. Verifica tu email y contraseña.');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setError('Error del servidor. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert('Contacta al administrador principal para recuperar tu contraseña.\n\nEmail: admin@genios.pe');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl font-bold text-text mb-2">
            Genios.pe
          </h1>
          <p className="text-text/60 text-lg">
            Panel de Administración
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-text font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 text-text placeholder-text/40"
                placeholder="Enter your email"
                style={{ fontFamily: 'Open Sans, sans-serif' }}
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-text font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 text-text placeholder-text/40"
                  placeholder="Enter your password"
                  style={{ fontFamily: 'Open Sans, sans-serif' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text/40 hover:text-text/60 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 shadow-md hover:shadow-lg ${
                isLoading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-secondary hover:bg-secondary-dark transform hover:scale-[1.02]'
              }`}
              style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Verificando...
                </div>
              ) : (
                'Log in'
              )}
            </button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-primary hover:text-primary-dark transition-colors font-medium"
                style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
              >
                Forgot password?
              </button>
            </div>
          </form>

          {/* Demo Credentials Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <p className="text-text/60 text-sm text-center mb-2">
              <strong>Credenciales de prueba:</strong>
            </p>
            <div className="text-text/60 text-xs space-y-1">
              <p><strong>Super Admin:</strong> admin@genios.pe / admin123</p>
              <p><strong>Admin:</strong> soporte@genios.pe / admin123</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-text/40 text-sm">
            © {new Date().getFullYear()} Genios a la Obra. Panel de Administración.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;