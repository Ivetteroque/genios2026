import React, { useState, useEffect } from 'react';
import { LogOut, Home, ArrowLeft, X } from 'lucide-react';
import { getCurrentUser, logout } from '../utils/authUtils';
import { updateGenius, Genius } from '../utils/geniusUtils';
import GeniusProfileEditForm from '../components/GeniusProfileEditForm';
import GeniusProfilePreviewModal from '../components/GeniusProfilePreviewModal';
import { 
  submitPaymentVoucher, 
  useTrialCode, 
  getSubscriptionByGenius, 
  hasActiveSubscription,
  getPaymentMethodDisplayName 
} from '../utils/paymentUtils';

const GeniusProfile: React.FC = () => {
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<Genius | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTrialCodeModal, setShowTrialCodeModal] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [hasActiveSubscriptionStatus, setHasActiveSubscriptionStatus] = useState(false);

  // Payment form state
  const [paymentData, setPaymentData] = useState({
    amount: 100,
    paymentMethod: 'yape' as 'yape' | 'plin' | 'transfer',
    operationNumber: '',
    bank: '',
    app: '',
    paymentDate: '',
    paymentTime: '',
    voucherImage: ''
  });

  // Trial code state
  const [trialCode, setTrialCode] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isSubmittingTrialCode, setIsSubmittingTrialCode] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated
    if (!currentUser) {
      window.location.href = '/';
      return;
    }

    // Load subscription status
    loadSubscriptionStatus();
  }, [currentUser]);

  // Listen for subscription changes
  useEffect(() => {
    const handleSubscriptionsChange = () => {
      loadSubscriptionStatus();
    };

    window.addEventListener('subscriptionsChanged', handleSubscriptionsChange);
    return () => window.removeEventListener('subscriptionsChanged', handleSubscriptionsChange);
  }, [currentUser]);

  const loadSubscriptionStatus = () => {
    if (currentUser) {
      const sub = getSubscriptionByGenius(currentUser.id);
      const isActive = hasActiveSubscription(currentUser.id);
      setSubscription(sub);
      setHasActiveSubscriptionStatus(isActive);
      console.log('Subscription status:', { subscription: sub, isActive });
    }
  };

  // Convert User to Genius for editing
  const convertUserToGenius = (user: any): Genius => {
    return {
      id: user.id,
      profilePhoto: user.profileImage || '',
      fullName: user.name || '',
      dni: user.dni || '',
      email: user.email || '',
      phone: user.phone || '',
      description: '',
      instagram: '',
      facebook: '',
      tiktok: '',
      portfolio: [],
      category: '',
      subcategories: [],
      serviceName: '',
      workLocations: user.location ? [{
        departmentId: user.location.departmentId,
        departmentName: user.location.departmentName,
        provinceId: user.location.provinceId,
        provinceName: user.location.provinceName,
        districtId: user.location.districtId,
        districtName: user.location.districtName,
        fullName: user.location.fullName,
        type: 'district' as const
      }] : [],
      specialty: '',
      subscriptionDate: user.registeredAt || '',
      expirationDate: '',
      status: 'active' as const,
      tags: [],
      averageRating: 0,
      location: user.location?.fullName || '',
      isVerified: user.isVerified || false,
      documents: [],
      stats: {
        profileViews: 0,
        whatsappClicks: 0,
        averageRating: 0,
        totalReviews: 0,
        servicesCompleted: 0
      },
      internalNotes: '',
      lastActivity: new Date().toISOString()
    };
  };

  const handleSaveProfile = async (updatedData: Genius) => {
    try {
      // Update genius data
      updateGenius(updatedData.id, updatedData);
      
      // Update current user data
      const updatedUser = {
        ...currentUser,
        name: updatedData.fullName,
        email: updatedData.email,
        phone: updatedData.phone,
        dni: updatedData.dni,
        profileImage: updatedData.profilePhoto
      };
      
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      
      // Show success message
      alert('✅ ¡Perfil actualizado exitosamente!\n\nTus cambios ya están visibles en tu perfil público.');
      
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('❌ Error al guardar el perfil. Por favor, intenta nuevamente.');
    }
  };

  const handlePreviewProfile = (formData: Genius) => {
    setPreviewData(formData);
    setShowPreviewModal(true);
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm('¿Estás seguro de que quieres cerrar sesión?');
    if (confirmLogout) {
      logout();
      alert('¡Hasta pronto!\n\nHas cerrado sesión exitosamente.');
    }
  };

  const handlePaymentInputChange = (field: string, value: any) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVoucherImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentData(prev => ({
          ...prev,
          voucherImage: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;

    // Validate required fields
    if (!paymentData.operationNumber || !paymentData.paymentDate || !paymentData.paymentTime || !paymentData.voucherImage) {
      alert('Por favor, completa todos los campos requeridos');
      return;
    }

    setIsSubmittingPayment(true);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const voucher = submitPaymentVoucher({
        geniusId: currentUser.id,
        geniusName: currentUser.name,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        operationNumber: paymentData.operationNumber,
        bank: paymentData.bank,
        app: paymentData.app,
        paymentDate: paymentData.paymentDate,
        paymentTime: paymentData.paymentTime,
        voucherImage: paymentData.voucherImage,
        subscriptionType: 'annual',
        subscriptionDays: 365
      });

      console.log('Payment voucher submitted:', voucher);
      
      // Reset form
      setPaymentData({
        amount: 100,
        paymentMethod: 'yape',
        operationNumber: '',
        bank: '',
        app: '',
        paymentDate: '',
        paymentTime: '',
        voucherImage: ''
      });

      setShowPaymentModal(false);
      
      alert('✅ ¡Voucher enviado exitosamente!\n\nTu pago será revisado por nuestro equipo en las próximas 24 horas.\n\nRecibirás una confirmación por email una vez aprobado.');

    } catch (error) {
      console.error('Error submitting payment:', error);
      alert('❌ Error al enviar el voucher. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleTrialCodeSubmit = () => {
    if (!currentUser || !trialCode.trim()) {
      alert('Por favor, ingresa un código válido');
      return;
    }

    setIsSubmittingTrialCode(true);

    try {
      const success = useTrialCode(trialCode, currentUser.id, currentUser.name);
      
      if (success) {
        loadSubscriptionStatus(); // Reload subscription status
        setTrialCode('');
        setShowTrialCodeModal(false);
        
        alert('✅ ¡Código de prueba activado exitosamente!\n\nTu perfil ya está activo y visible para los clientes.\n\n¡Empieza a recibir contactos!');
      } else {
        alert('❌ Código inválido o ya utilizado\n\nVerifica que el código esté escrito correctamente y no haya sido usado anteriormente.');
      }
    } catch (error) {
      console.error('Error using trial code:', error);
      alert('❌ Error al procesar el código. Intenta nuevamente.');
    } finally {
      setIsSubmittingTrialCode(false);
    }
  };

  if (!currentUser) {
    return null; // Will redirect in useEffect
  }

  // Convert current user to genius format for editing
  const geniusData = convertUserToGenius(currentUser);

  return (
    <div className="min-h-screen bg-background pt-20 pb-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Profile Edit Form */}
        <GeniusProfileEditForm
          initialData={geniusData}
          onSave={handleSaveProfile}
          onPreview={handlePreviewProfile}
        />

        {/* Subscription Status Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="font-heading text-xl font-bold text-text mb-4 text-center">
            ════════ 💳 Estado de Suscripción ═══════
          </h2>
          
          {hasActiveSubscriptionStatus && subscription ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-8 h-8 text-green-500">✓</div>
                <h3 className="font-heading text-xl font-bold text-green-800">
                  ¡Tu perfil está activo!
                </h3>
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-green-700 font-medium">
                  Suscripción: {subscription.subscriptionType === 'annual' ? 'Anual' : 'Código de Prueba'}
                </p>
                <p className="text-green-600">
                  Días restantes: <span className="font-bold">{subscription.daysRemaining}</span>
                </p>
                <p className="text-green-600 text-sm">
                  Vence: {new Date(subscription.endDate).toLocaleDateString('es-ES')}
                </p>
              </div>

              {subscription.daysRemaining <= 30 && (
                <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 text-orange-600">⚠️</div>
                    <p className="text-orange-800 font-medium">
                      Tu suscripción vence pronto
                    </p>
                  </div>
                  <p className="text-orange-700 text-sm mt-1">
                    Renueva tu suscripción para mantener tu perfil visible
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-8 h-8 text-red-500">❌</div>
                <h3 className="font-heading text-xl font-bold text-red-800">
                  Perfil inactivo
                </h3>
              </div>
              
              <div className="text-center space-y-4">
                <p className="text-red-700">
                  Tu perfil no está visible para los clientes. Activa tu suscripción para empezar a recibir contactos.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="flex items-center justify-center space-x-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-full transition-colors shadow-md"
                  >
                    <div className="w-5 h-5">💳</div>
                    <span> Pagar Suscripción (S/100)</span>
                  </button>
                  
                  <button
                    onClick={() => setShowTrialCodeModal(true)}
                    className="flex items-center justify-center space-x-2 bg-secondary hover:bg-secondary-dark text-text px-6 py-3 rounded-full transition-colors shadow-md"
                  >
                    <div className="w-5 h-5">🎁</div>
                    <span> Usar Código de Prueba</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Navigation Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/categories"
              className="flex items-center justify-center space-x-3 bg-primary/10 hover:bg-primary/20 text-text p-4 rounded-xl transition-colors border border-primary/20"
              style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
            >
              <ArrowLeft className="w-5 h-5" />
              <span>🔁 Volver a Categorías</span>
            </a>
            
            <a
              href="/"
              className="flex items-center justify-center space-x-3 bg-success/10 hover:bg-success/20 text-text p-4 rounded-xl transition-colors border border-success/20"
              style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
            >
              <Home className="w-5 h-5" />
              <span>🏠 Inicio – Ir a la Portada</span>
            </a>
          </div>
        </div>

        {/* Logout Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="text-center">
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full transition-colors shadow-md flex items-center space-x-2 mx-auto"
              style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
            >
              <LogOut className="w-5 h-5" />
              <span>🔓 Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && previewData && (
        <GeniusProfilePreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          geniusData={previewData}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
              <h3 className="font-heading text-xl font-bold text-text">Pagar Suscripción Anual</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-text/60 hover:text-text transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-6">
              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-text/80 mb-2">
                  💰 Monto de la suscripción:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text/60">S/</span>
                  <input
                    type="number"
                    value={paymentData.amount}
                    onChange={(e) => handlePaymentInputChange('amount', Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                    min="100"
                    max="100"
                    readOnly
                  />
                </div>
                <p className="text-text/60 text-sm mt-1">Suscripción anual (12 meses)</p>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-text/80 mb-2">
                  💳 Método de pago:
                </label>
                <div className="space-y-2">
                  {(['yape', 'plin', 'transfer'] as const).map((method) => (
                    <label key={method} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method}
                        checked={paymentData.paymentMethod === method}
                        onChange={(e) => handlePaymentInputChange('paymentMethod', e.target.value)}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="font-medium text-text">
                        {getPaymentMethodDisplayName(method)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Operation Number */}
              <div>
                <label className="block text-sm font-medium text-text/80 mb-2">
                  🔢 Número de operación:
                </label>
                <input
                  type="text"
                  value={paymentData.operationNumber}
                  onChange={(e) => handlePaymentInputChange('operationNumber', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                  placeholder="Ej: YPE123456789"
                  required
                />
              </div>

              {/* Bank/App Field */}
              {paymentData.paymentMethod === 'transfer' ? (
                <div>
                  <label className="block text-sm font-medium text-text/80 mb-2">
                    🏦 Banco:
                  </label>
                  <select
                    value={paymentData.bank}
                    onChange={(e) => handlePaymentInputChange('bank', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                    required
                  >
                    <option value="">Selecciona un banco</option>
                    <option value="BCP">BCP</option>
                    <option value="BBVA">BBVA</option>
                    <option value="Interbank">Interbank</option>
                    <option value="Scotiabank">Scotiabank</option>
                    <option value="BanBif">BanBif</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-text/80 mb-2">
                    📱 App de pago:
                  </label>
                  <input
                    type="text"
                    value={paymentData.app}
                    onChange={(e) => handlePaymentInputChange('app', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                    placeholder={paymentData.paymentMethod === 'yape' ? 'Yape' : 'Plin'}
                    required
                  />
                </div>
              )}

              {/* Payment Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text/80 mb-2">
                    📅 Fecha:
                  </label>
                  <input
                    type="date"
                    value={paymentData.paymentDate}
                    onChange={(e) => handlePaymentInputChange('paymentDate', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text/80 mb-2">
                    🕐 Hora:
                  </label>
                  <input
                    type="time"
                    value={paymentData.paymentTime}
                    onChange={(e) => handlePaymentInputChange('paymentTime', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                    required
                  />
                </div>
              </div>

              {/* Voucher Image Upload */}
              <div>
                <label className="block text-sm font-medium text-text/80 mb-2">
                  📸 Foto del voucher:
                </label>
                
                {paymentData.voucherImage ? (
                  <div className="space-y-3">
                    <img
                      src={paymentData.voucherImage}
                      alt="Voucher"
                      className="w-full max-h-48 object-contain rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => handlePaymentInputChange('voucherImage', '')}
                      className="w-full py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Cambiar imagen
                    </button>
                  </div>
                ) : (
                  <label className="w-full flex items-center justify-center px-6 py-8 rounded-xl border-2 border-dashed border-primary/30 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                    <div className="text-center">
                      <div className="mx-auto h-8 w-8 text-primary/60 mb-2">📤</div>
                      <span className="text-text/60 font-medium">
                        Subir foto del voucher
                      </span>
                      <p className="text-xs text-text/40 mt-1">
                        JPG, PNG hasta 5MB
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleVoucherImageUpload}
                      required
                    />
                  </label>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmittingPayment}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-md hover:shadow-lg ${
                  isSubmittingPayment
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary-dark text-white transform hover:scale-[1.02]'
                }`}
              >
                {isSubmittingPayment ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500 mr-2"></div>
                    Enviando voucher...
                  </div>
                ) : (
                  '📤 Enviar Voucher'
                )}
              </button>

              {/* Payment Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Instrucciones de pago:</h4>
                <div className="text-blue-700 text-sm space-y-1">
                  <p>1. Realiza el pago de S/100 usando tu método preferido</p>
                  <p>2. Toma una foto clara del voucher o comprobante</p>
                  <p>3. Completa este formulario con los datos exactos</p>
                  <p>4. Espera la confirmación (máximo 24 horas)</p>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trial Code Modal */}
      {showTrialCodeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading text-xl font-bold text-text">Código de Prueba</h3>
              <button
                onClick={() => setShowTrialCodeModal(false)}
                className="text-text/60 hover:text-text transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text/80 mb-2">
                  🎁 Ingresa tu código de prueba:
                </label>
                <input
                  type="text"
                  value={trialCode}
                  onChange={(e) => setTrialCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 text-center font-mono text-lg tracking-wider"
                  placeholder="TRIAL123ABC"
                  maxLength={12}
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">¿Qué es un código de prueba?</h4>
                <div className="text-green-700 text-sm space-y-1">
                  <p>• Te permite activar tu perfil por tiempo limitado</p>
                  <p>• Es completamente gratuito</p>
                  <p>• Ideal para probar la plataforma</p>
                  <p>• Puedes renovar con suscripción después</p>
                </div>
              </div>

              <button
                onClick={handleTrialCodeSubmit}
                disabled={!trialCode.trim() || isSubmittingTrialCode}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-md hover:shadow-lg ${
                  trialCode.trim() && !isSubmittingTrialCode
                    ? 'bg-secondary hover:bg-secondary-dark text-text transform hover:scale-[1.02]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmittingTrialCode ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500 mr-2"></div>
                    Activando código...
                  </div>
                ) : (
                  '🎁 Activar Código'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeniusProfile;