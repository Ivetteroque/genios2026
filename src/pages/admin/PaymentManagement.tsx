import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  MoreVertical,
  Calendar,
  User,
  MapPin,
  Gift,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  FileText,
  X,
  Save
} from 'lucide-react';
import {
  PaymentVoucher,
  TrialCode,
  GeniusSubscription,
  getPaymentVouchers,
  getTrialCodes,
  getGeniusSubscriptions,
  approvePaymentVoucher,
  rejectPaymentVoucher,
  generateTrialCode,
  activateTrialCode,
  deactivateTrialCode,
  getPaymentStatistics,
  exportPaymentData,
  getPaymentMethodDisplayName,
  getSubscriptionTypeDisplayName,
  isTrialCodeUnique,
  getSubscriptionsByTrialCode
} from '../../utils/paymentUtils';
import { getActiveDepartments } from '../../utils/locationUtils';
import { getCurrentAdmin } from '../../utils/adminAuthUtils';
import StatusBadge from '../../components/StatusBadge';

const PaymentManagement: React.FC = () => {
  const [currentAdmin, setCurrentAdmin] = useState(getCurrentAdmin());
  const [activeTab, setActiveTab] = useState<'vouchers' | 'subscriptions' | 'trial-codes'>('vouchers');
  const [vouchers, setVouchers] = useState<PaymentVoucher[]>([]);
  const [trialCodes, setTrialCodes] = useState<TrialCode[]>([]);
  const [subscriptions, setSubscriptions] = useState<GeniusSubscription[]>([]);
  const [activeDepartments, setActiveDepartments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [showTrialCodeModal, setShowTrialCodeModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<PaymentVoucher | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Trial code generation state
  const [newTrialCode, setNewTrialCode] = useState('');
  const [newTrialDays, setNewTrialDays] = useState<string>('7');
  const [customTrialDays, setCustomTrialDays] = useState<number | ''>('');
  const [newTrialDepartment, setNewTrialDepartment] = useState('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Listen for payment-related changes
  useEffect(() => {
    const handlePaymentsChange = () => loadAllData();
    const handleTrialCodesChange = () => loadAllData();
    const handleSubscriptionsChange = () => loadAllData();

    window.addEventListener('paymentsChanged', handlePaymentsChange);
    window.addEventListener('trialCodesChanged', handleTrialCodesChange);
    window.addEventListener('subscriptionsChanged', handleSubscriptionsChange);

    return () => {
      window.removeEventListener('paymentsChanged', handlePaymentsChange);
      window.removeEventListener('trialCodesChanged', handleTrialCodesChange);
      window.removeEventListener('subscriptionsChanged', handleSubscriptionsChange);
    };
  }, []);

  const loadAllData = () => {
    setVouchers(getPaymentVouchers());
    setTrialCodes(getTrialCodes());
    setSubscriptions(getGeniusSubscriptions());
    setActiveDepartments(getActiveDepartments());
  };

  const statistics = getPaymentStatistics();

  // Filter vouchers
  const filteredVouchers = vouchers.filter(voucher => {
    const matchesSearch = voucher.geniusName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         voucher.operationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || voucher.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter trial codes
  const filteredTrialCodes = trialCodes.filter(code => {
    return code.code.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleApproveVoucher = async (voucherId: string) => {
    if (!currentAdmin) return;

    const confirmApprove = window.confirm('¿Estás seguro de que quieres aprobar este pago?\n\nEsto activará la suscripción del genio.');
    if (!confirmApprove) return;

    setIsProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const success = approvePaymentVoucher(voucherId, currentAdmin.email);
      
      if (success) {
        loadAllData();
        alert('✅ Pago aprobado exitosamente\n\nLa suscripción del genio ha sido activada.');
      } else {
        alert('❌ Error al aprobar el pago');
      }
    } catch (error) {
      console.error('Error approving voucher:', error);
      alert('❌ Error al procesar la aprobación');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectVoucher = async (voucherId: string) => {
    if (!currentAdmin || !rejectionReason.trim()) {
      alert('Por favor, proporciona una razón para el rechazo');
      return;
    }

    setIsProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const success = rejectPaymentVoucher(voucherId, rejectionReason, currentAdmin.email);
      
      if (success) {
        loadAllData();
        setShowVoucherModal(false);
        setSelectedVoucher(null);
        setRejectionReason('');
        alert('❌ Pago rechazado\n\nEl genio será notificado sobre el rechazo.');
      } else {
        alert('❌ Error al rechazar el pago');
      }
    } catch (error) {
      console.error('Error rejecting voucher:', error);
      alert('❌ Error al procesar el rechazo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateTrialCode = async () => {
    if (!currentAdmin) return;

    // Determine the final days value
    let finalDays: number;
    if (newTrialDays === 'custom') {
      if (!customTrialDays || customTrialDays <= 0 || customTrialDays > 365) {
        alert('Por favor, ingresa un número válido de días (1-365)');
        return;
      }
      finalDays = Number(customTrialDays);
    } else {
      finalDays = Number(newTrialDays);
    }

    // Validate custom code if provided
    if (newTrialCode.trim()) {
      const cleanCode = newTrialCode.trim().toUpperCase();
      
      if (cleanCode.length < 3 || cleanCode.length > 20) {
        alert('El código personalizado debe tener entre 3 y 20 caracteres');
        return;
      }
      
      if (!/^[A-Z0-9]+$/.test(cleanCode)) {
        alert('El código solo puede contener letras y números');
        return;
      }
      
      if (!isTrialCodeUnique(cleanCode)) {
        alert('Este código ya existe. Por favor, elige otro.');
        return;
      }
    }

    setIsGeneratingCode(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const trialCode = generateTrialCode(
        finalDays,
        currentAdmin.email,
        newTrialDepartment || undefined,
        newTrialCode.trim() || undefined
      );

      if (trialCode) {
        loadAllData();
        
        // Reset form
        setNewTrialCode('');
        setNewTrialDays('7');
        setCustomTrialDays('');
        setNewTrialDepartment('');
        setShowTrialCodeModal(false);
        
        alert(`✅ Código de prueba generado exitosamente!\n\nCódigo: ${trialCode.code}\nDuración: ${finalDays} días\nAlcance: ${trialCode.departmentId ? activeDepartments.find(d => d.id === trialCode.departmentId)?.name : 'Global'}`);
      } else {
        alert('❌ Error al generar el código de prueba');
      }
    } catch (error) {
      console.error('Error generating trial code:', error);
      alert('❌ Error al generar el código');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleToggleTrialCode = async (codeId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'desactivar' : 'activar';
    const confirmToggle = window.confirm(`¿Estás seguro de que quieres ${action} este código de prueba?`);
    
    if (!confirmToggle) return;

    try {
      const success = currentStatus ? deactivateTrialCode(codeId) : activateTrialCode(codeId);
      
      if (success) {
        loadAllData();
        alert(`✅ Código ${action === 'activar' ? 'activado' : 'desactivado'} exitosamente`);
      } else {
        alert(`❌ Error al ${action} el código`);
      }
    } catch (error) {
      console.error(`Error toggling trial code:`, error);
      alert(`❌ Error al ${action} el código`);
    }
  };

  const getTrialCodeUsageCount = (codeId: string): number => {
    return getSubscriptionsByTrialCode(codeId).length;
  };

  const getDepartmentName = (departmentId?: string): string => {
    if (!departmentId) return 'Global';
    const department = activeDepartments.find(d => d.id === departmentId);
    return department?.name || 'Desconocido';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text">Gestión de Pagos</h1>
          <p className="text-text/60 mt-1">Administra vouchers, suscripciones y códigos de prueba</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={exportPaymentData}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-text rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
          
          <button
            onClick={() => setShowTrialCodeModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
          >
            <Gift className="w-4 h-4" />
            <span>Generar Código</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text/60 text-sm font-medium">Vouchers Pendientes</p>
              <p className="text-2xl font-bold text-text">{statistics.pendingVouchers}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text/60 text-sm font-medium">Ingresos Totales</p>
              <p className="text-2xl font-bold text-text">S/ {statistics.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text/60 text-sm font-medium">Suscripciones Activas</p>
              <p className="text-2xl font-bold text-text">{statistics.activeSubscriptions}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text/60 text-sm font-medium">Códigos Activos</p>
              <p className="text-2xl font-bold text-text">{statistics.activeTrialCodes}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Gift className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('vouchers')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'vouchers'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text/60 hover:text-text hover:border-gray-300'
              }`}
            >
              Vouchers de Pago ({statistics.totalVouchers})
            </button>
            
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'subscriptions'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text/60 hover:text-text hover:border-gray-300'
              }`}
            >
              Suscripciones ({statistics.activeSubscriptions})
            </button>
            
            <button
              onClick={() => setActiveTab('trial-codes')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'trial-codes'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text/60 hover:text-text hover:border-gray-300'
              }`}
            >
              Códigos de Prueba ({statistics.totalTrialCodes})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Vouchers Tab */}
          {activeTab === 'vouchers' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar vouchers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text/40 w-4 h-4" />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="pending">Pendientes</option>
                    <option value="approved">Aprobados</option>
                    <option value="rejected">Rechazados</option>
                  </select>
                </div>

                <div className="text-text/60 text-sm">
                  {filteredVouchers.length} de {vouchers.length} vouchers
                </div>
              </div>

              {/* Vouchers Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-text/80">Genio</th>
                      <th className="text-left py-3 px-4 font-medium text-text/80">Monto</th>
                      <th className="text-left py-3 px-4 font-medium text-text/80">Método</th>
                      <th className="text-left py-3 px-4 font-medium text-text/80">Operación</th>
                      <th className="text-left py-3 px-4 font-medium text-text/80">Fecha</th>
                      <th className="text-left py-3 px-4 font-medium text-text/80">Estado</th>
                      <th className="text-left py-3 px-4 font-medium text-text/80">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVouchers.map((voucher) => (
                      <tr key={voucher.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-text">{voucher.geniusName}</p>
                            <p className="text-text/60 text-sm">{voucher.geniusId}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-text">S/ {voucher.amount}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-text/80">{getPaymentMethodDisplayName(voucher.paymentMethod)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm text-text/80">{voucher.operationNumber}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-text/80">{voucher.paymentDate}</span>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={voucher.status} />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedVoucher(voucher);
                                setShowVoucherModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Ver detalles"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            {voucher.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveVoucher(voucher.id)}
                                  disabled={isProcessing}
                                  className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                                  title="Aprobar"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                
                                <button
                                  onClick={() => {
                                    setSelectedVoucher(voucher);
                                    setShowVoucherModal(true);
                                  }}
                                  disabled={isProcessing}
                                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                                  title="Rechazar"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredVouchers.length === 0 && (
                  <div className="text-center py-12 text-text/60">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 text-text/40" />
                    <p className="text-lg font-medium mb-2">No se encontraron vouchers</p>
                    <p>Los vouchers de pago aparecerán aquí cuando los genios los envíen</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Trial Codes Tab */}
          {activeTab === 'trial-codes' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar códigos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text/40 w-4 h-4" />
                </div>

                <div className="text-text/60 text-sm">
                  {filteredTrialCodes.length} de {trialCodes.length} códigos
                </div>
              </div>

              {/* Trial Codes Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-text/80">Código</th>
                      <th className="text-left py-3 px-4 font-medium text-text/80">Días</th>
                      <th className="text-left py-3 px-4 font-medium text-text/80">Departamento</th>
                      <th className="text-left py-3 px-4 font-medium text-text/80">Usos</th>
                      <th className="text-left py-3 px-4 font-medium text-text/80">Estado</th>
                      <th className="text-left py-3 px-4 font-medium text-text/80">Creado</th>
                      <th className="text-left py-3 px-4 font-medium text-text/80">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrialCodes.map((code) => (
                      <tr key={code.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                            {code.code}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-text/80">{code.days} días</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-text/60" />
                            <span className="text-text/80">{getDepartmentName(code.departmentId)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-text/80">{getTrialCodeUsageCount(code.id)} usos</span>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={code.isActive ? 'active' : 'inactive'} />
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-text/60 text-sm">
                            {new Date(code.createdAt).toLocaleDateString('es-ES')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleTrialCode(code.id, code.isActive)}
                            className={`p-2 rounded-lg transition-colors ${
                              code.isActive
                                ? 'text-red-600 hover:bg-red-100'
                                : 'text-green-600 hover:bg-green-100'
                            }`}
                            title={code.isActive ? 'Desactivar código' : 'Activar código'}
                          >
                            {code.isActive ? (
                              <ToggleRight className="w-5 h-5" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredTrialCodes.length === 0 && (
                  <div className="text-center py-12 text-text/60">
                    <Gift className="w-12 h-12 mx-auto mb-4 text-text/40" />
                    <p className="text-lg font-medium mb-2">No se encontraron códigos</p>
                    <p>Los códigos de prueba aparecerán aquí cuando los generes</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subscriptions Tab */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-6">
              {/* Subscriptions Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-text/80">Genio</th>
                      <th className="text-left py-3 px-4 font-medium text-text/80">Tipo</th>
                      <th className="text-left py-3 px-4 font-medium text-text/80">Inicio</th>
                      <th className="text-left py-3 px-4 font-medium text-text/80">Vencimiento</th>
                      <th className="text-left py-3 px-4 font-medium text-text/80">Días Restantes</th>
                      <th className="text-left py-3 px-4 font-medium text-text/80">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((subscription) => (
                      <tr key={`${subscription.geniusId}-${subscription.startDate}`} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-text">{subscription.geniusName}</p>
                            <p className="text-text/60 text-sm">{subscription.geniusId}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-text/80">{getSubscriptionTypeDisplayName(subscription.subscriptionType)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-text/80">
                            {new Date(subscription.startDate).toLocaleDateString('es-ES')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-text/80">
                            {new Date(subscription.endDate).toLocaleDateString('es-ES')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${
                            subscription.daysRemaining <= 7 
                              ? 'text-red-600' 
                              : subscription.daysRemaining <= 30 
                              ? 'text-orange-600' 
                              : 'text-green-600'
                          }`}>
                            {subscription.daysRemaining} días
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={subscription.isActive ? 'active' : 'inactive'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {subscriptions.length === 0 && (
                  <div className="text-center py-12 text-text/60">
                    <User className="w-12 h-12 mx-auto mb-4 text-text/40" />
                    <p className="text-lg font-medium mb-2">No hay suscripciones</p>
                    <p>Las suscripciones aparecerán aquí cuando se activen</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Voucher Details Modal */}
      {showVoucherModal && selectedVoucher && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
              <h3 className="font-heading text-xl font-bold text-text">Detalles del Voucher</h3>
              <button
                onClick={() => {
                  setShowVoucherModal(false);
                  setSelectedVoucher(null);
                  setRejectionReason('');
                }}
                className="text-text/60 hover:text-text transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Voucher Image */}
              <div>
                <label className="block text-sm font-medium text-text/80 mb-2">Imagen del Voucher:</label>
                <img
                  src={selectedVoucher.voucherImage}
                  alt="Voucher"
                  className="w-full max-h-96 object-contain rounded-lg border border-gray-200"
                />
              </div>

              {/* Voucher Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text/80 mb-1">Genio:</label>
                  <p className="text-text">{selectedVoucher.geniusName}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text/80 mb-1">Monto:</label>
                  <p className="text-text font-bold">S/ {selectedVoucher.amount}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text/80 mb-1">Método de Pago:</label>
                  <p className="text-text">{getPaymentMethodDisplayName(selectedVoucher.paymentMethod)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text/80 mb-1">Número de Operación:</label>
                  <p className="text-text font-mono">{selectedVoucher.operationNumber}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text/80 mb-1">Fecha y Hora:</label>
                  <p className="text-text">{selectedVoucher.paymentDate} a las {selectedVoucher.paymentTime}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text/80 mb-1">Estado:</label>
                  <StatusBadge status={selectedVoucher.status} />
                </div>

                {selectedVoucher.bank && (
                  <div>
                    <label className="block text-sm font-medium text-text/80 mb-1">Banco:</label>
                    <p className="text-text">{selectedVoucher.bank}</p>
                  </div>
                )}

                {selectedVoucher.app && (
                  <div>
                    <label className="block text-sm font-medium text-text/80 mb-1">App:</label>
                    <p className="text-text">{selectedVoucher.app}</p>
                  </div>
                )}
              </div>

              {/* Rejection Reason Input (for pending vouchers) */}
              {selectedVoucher.status === 'pending' && (
                <div>
                  <label className="block text-sm font-medium text-text/80 mb-2">
                    Razón de Rechazo (opcional):
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 resize-none"
                    placeholder="Explica por qué se rechaza este voucher..."
                  />
                </div>
              )}

              {/* Action Buttons */}
              {selectedVoucher.status === 'pending' && (
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleApproveVoucher(selectedVoucher.id)}
                    disabled={isProcessing}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? 'Procesando...' : 'Aprobar Pago'}
                  </button>
                  
                  <button
                    onClick={() => handleRejectVoucher(selectedVoucher.id)}
                    disabled={isProcessing}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? 'Procesando...' : 'Rechazar Pago'}
                  </button>
                </div>
              )}

              {/* Review Information */}
              {selectedVoucher.reviewedAt && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-text mb-2">Información de Revisión:</h4>
                  <div className="space-y-1 text-sm text-text/80">
                    <p>Revisado por: {selectedVoucher.reviewedBy}</p>
                    <p>Fecha: {new Date(selectedVoucher.reviewedAt).toLocaleString('es-ES')}</p>
                    {selectedVoucher.rejectionReason && (
                      <p>Razón: {selectedVoucher.rejectionReason}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generate Trial Code Modal */}
      {showTrialCodeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-heading text-xl font-bold text-text">Generar Código de Prueba</h3>
              <button
                onClick={() => {
                  setShowTrialCodeModal(false);
                  setNewTrialCode('');
                  setNewTrialDays('7');
                  setCustomTrialDays('');
                  setNewTrialDepartment('');
                }}
                className="text-text/60 hover:text-text transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Custom Code Input */}
              <div>
                <label className="block text-sm font-medium text-text/80 mb-2">
                  🏷️ Código Personalizado (opcional):
                </label>
                <input
                  type="text"
                  value={newTrialCode}
                  onChange={(e) => setNewTrialCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 font-mono text-center tracking-wider"
                  placeholder="TACNA30, LIMA15, etc."
                  maxLength={20}
                />
                <p className="text-xs text-text/60 mt-1">
                  Si no especificas, se generará automáticamente
                </p>
              </div>

              {/* Days Selection */}
              <div>
                <label className="block text-sm font-medium text-text/80 mb-2">
                  📅 Duración del código:
                </label>
                <select
                  value={newTrialDays}
                  onChange={(e) => {
                    setNewTrialDays(e.target.value);
                    if (e.target.value !== 'custom') {
                      setCustomTrialDays('');
                    }
                  }}
                  className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                >
                  <option value="3">3 días</option>
                  <option value="7">7 días</option>
                  <option value="15">15 días</option>
                  <option value="30">30 días</option>
                  <option value="60">60 días</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>

              {/* Custom Days Input */}
              {newTrialDays === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-text/80 mb-2">
                    🔢 Días personalizados:
                  </label>
                  <input
                    type="number"
                    value={customTrialDays}
                    onChange={(e) => setCustomTrialDays(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                    placeholder="Ingresa el número de días"
                    min="1"
                    max="365"
                  />
                  <p className="text-xs text-text/60 mt-1">
                    Entre 1 y 365 días
                  </p>
                </div>
              )}

              {/* Department Selection */}
              <div>
                <label className="block text-sm font-medium text-text/80 mb-2">
                  🗺️ Departamento (opcional):
                </label>
                <select
                  value={newTrialDepartment}
                  onChange={(e) => setNewTrialDepartment(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                >
                  <option value="">Global (todos los departamentos)</option>
                  {activeDepartments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
                <p className="text-xs text-text/60 mt-1">
                  Si seleccionas un departamento, solo los genios de esa región podrán usar el código
                </p>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateTrialCode}
                disabled={isGeneratingCode || (newTrialDays === 'custom' && (!customTrialDays || customTrialDays <= 0 || customTrialDays > 365))}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-md hover:shadow-lg ${
                  isGeneratingCode || (newTrialDays === 'custom' && (!customTrialDays || customTrialDays <= 0 || customTrialDays > 365))
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary-dark text-white transform hover:scale-[1.02]'
                }`}
              >
                {isGeneratingCode ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500 mr-2"></div>
                    Generando código...
                  </div>
                ) : (
                  '🎁 Generar Código'
                )}
              </button>

              {/* Preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-text mb-2">Vista previa del código:</h4>
                <div className="space-y-1 text-sm text-text/80">
                  <p>Código: <span className="font-mono font-bold text-primary">
                    {newTrialCode.trim() || 'TRIAL[GENERADO]'}
                  </span></p>
                  <p>Duración: <span className="font-medium">
                    {newTrialDays === 'custom' ? (customTrialDays || '?') : newTrialDays} días
                  </span></p>
                  <p>Alcance: <span className="font-medium">
                    {newTrialDepartment 
                      ? activeDepartments.find(d => d.id === newTrialDepartment)?.name 
                      : 'Global'
                    }
                  </span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement;