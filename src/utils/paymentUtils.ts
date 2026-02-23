// Payment management utility functions

export interface PaymentVoucher {
  id: string;
  geniusId: string;
  geniusName: string;
  amount: number;
  paymentMethod: 'yape' | 'plin' | 'transfer';
  operationNumber: string;
  bank?: string; // For transfers
  app?: string; // For Yape/Plin
  paymentDate: string;
  paymentTime: string;
  voucherImage: string;
  hash: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  subscriptionType: 'annual' | 'trial';
  subscriptionDays: number; // 365 for annual, variable for trial
}

export interface TrialCode {
  id: string;
  code: string;
  days: number;
  departmentId?: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export interface GeniusSubscription {
  geniusId: string;
  geniusName: string;
  subscriptionType: 'annual' | 'trial';
  startDate: string;
  endDate: string;
  isActive: boolean;
  paymentId?: string;
  trialCodeId?: string;
  daysRemaining: number;
}

// Get all payment vouchers
export const getPaymentVouchers = (): PaymentVoucher[] => {
  try {
    const vouchers = localStorage.getItem('paymentVouchers');
    return vouchers ? JSON.parse(vouchers) : [];
  } catch (error) {
    console.error('Error loading payment vouchers:', error);
    return [];
  }
};

// Save payment vouchers
export const savePaymentVouchers = (vouchers: PaymentVoucher[]): void => {
  try {
    localStorage.setItem('paymentVouchers', JSON.stringify(vouchers));
    
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('paymentsChanged', { detail: vouchers }));
  } catch (error) {
    console.error('Error saving payment vouchers:', error);
  }
};

// Get trial codes
export const getTrialCodes = (): TrialCode[] => {
  try {
    const codes = localStorage.getItem('trialCodes');
    return codes ? JSON.parse(codes) : [];
  } catch (error) {
    console.error('Error loading trial codes:', error);
    return [];
  }
};

// Save trial codes
export const saveTrialCodes = (codes: TrialCode[]): void => {
  try {
    localStorage.setItem('trialCodes', JSON.stringify(codes));
    
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('trialCodesChanged', { detail: codes }));
  } catch (error) {
    console.error('Error saving trial codes:', error);
  }
};

// Get genius subscriptions
export const getGeniusSubscriptions = (): GeniusSubscription[] => {
  try {
    const subscriptions = localStorage.getItem('geniusSubscriptions');
    const subs = subscriptions ? JSON.parse(subscriptions) : [];
    
    // Update days remaining for each subscription
    return subs.map((sub: GeniusSubscription) => ({
      ...sub,
      daysRemaining: calculateDaysRemaining(sub.endDate),
      isActive: new Date(sub.endDate) > new Date()
    }));
  } catch (error) {
    console.error('Error loading genius subscriptions:', error);
    return [];
  }
};

// Save genius subscriptions
export const saveGeniusSubscriptions = (subscriptions: GeniusSubscription[]): void => {
  try {
    localStorage.setItem('geniusSubscriptions', JSON.stringify(subscriptions));
    
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('subscriptionsChanged', { detail: subscriptions }));
  } catch (error) {
    console.error('Error saving genius subscriptions:', error);
  }
};

// Calculate days remaining
export const calculateDaysRemaining = (endDate: string): number => {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

// Submit payment voucher (from genius side)
export const submitPaymentVoucher = (voucher: Omit<PaymentVoucher, 'id' | 'status' | 'submittedAt' | 'hash'>): PaymentVoucher => {
  const newVoucher: PaymentVoucher = {
    ...voucher,
    id: Date.now().toString(),
    status: 'pending',
    submittedAt: new Date().toISOString(),
    hash: generateVoucherHash(voucher)
  };

  const vouchers = getPaymentVouchers();
  vouchers.push(newVoucher);
  savePaymentVouchers(vouchers);

  console.log('Payment voucher submitted:', newVoucher);
  return newVoucher;
};

// Generate voucher hash for verification
export const generateVoucherHash = (voucher: any): string => {
  const data = `${voucher.geniusId}-${voucher.amount}-${voucher.operationNumber}-${voucher.paymentDate}`;
  return btoa(data).slice(0, 16);
};

// Approve payment voucher
export const approvePaymentVoucher = (voucherId: string, reviewedBy: string): boolean => {
  const vouchers = getPaymentVouchers();
  const voucherIndex = vouchers.findIndex(v => v.id === voucherId);
  
  if (voucherIndex === -1) return false;

  const voucher = vouchers[voucherIndex];
  
  // Update voucher status
  vouchers[voucherIndex] = {
    ...voucher,
    status: 'approved',
    reviewedAt: new Date().toISOString(),
    reviewedBy
  };

  // Create or update genius subscription
  const subscriptions = getGeniusSubscriptions();
  const existingSubIndex = subscriptions.findIndex(sub => sub.geniusId === voucher.geniusId);
  
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + voucher.subscriptionDays);

  const subscription: GeniusSubscription = {
    geniusId: voucher.geniusId,
    geniusName: voucher.geniusName,
    subscriptionType: voucher.subscriptionType,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    isActive: true,
    paymentId: voucherId,
    daysRemaining: voucher.subscriptionDays
  };

  if (existingSubIndex >= 0) {
    subscriptions[existingSubIndex] = subscription;
  } else {
    subscriptions.push(subscription);
  }

  savePaymentVouchers(vouchers);
  saveGeniusSubscriptions(subscriptions);

  console.log(`Payment approved for genius ${voucher.geniusName}, subscription activated for ${voucher.subscriptionDays} days`);
  return true;
};

// Reject payment voucher
export const rejectPaymentVoucher = (voucherId: string, rejectionReason: string, reviewedBy: string): boolean => {
  const vouchers = getPaymentVouchers();
  const voucherIndex = vouchers.findIndex(v => v.id === voucherId);
  
  if (voucherIndex === -1) return false;

  vouchers[voucherIndex] = {
    ...vouchers[voucherIndex],
    status: 'rejected',
    rejectionReason,
    reviewedAt: new Date().toISOString(),
    reviewedBy
  };

  savePaymentVouchers(vouchers);

  console.log(`Payment rejected for voucher ${voucherId}: ${rejectionReason}`);
  return true;
};

// Check if trial code is unique
export const isTrialCodeUnique = (code: string): boolean => {
  const codes = getTrialCodes();
  return !codes.some(existingCode => existingCode.code.toLowerCase() === code.toLowerCase());
};

// Get subscriptions by trial code
export const getSubscriptionsByTrialCode = (trialCodeId: string): GeniusSubscription[] => {
  const subscriptions = getGeniusSubscriptions();
  return subscriptions.filter(sub => sub.trialCodeId === trialCodeId);
};

// Check if genius already used a specific trial code
export const hasGeniusUsedTrialCode = (geniusId: string, trialCodeId: string): boolean => {
  const subscriptions = getGeniusSubscriptions();
  return subscriptions.some(sub => sub.geniusId === geniusId && sub.trialCodeId === trialCodeId);
};

// Generate trial code
export const generateTrialCode = (
  days: number, 
  createdBy: string, 
  departmentId?: string, 
  customCode?: string
): TrialCode | null => {
  let code: string;
  
  if (customCode) {
    // Validate custom code format and uniqueness
    const cleanCode = customCode.trim().toUpperCase();
    
    if (cleanCode.length < 3 || cleanCode.length > 20) {
      console.error('Custom code must be between 3 and 20 characters');
      return null;
    }
    
    if (!/^[A-Z0-9]+$/.test(cleanCode)) {
      console.error('Custom code can only contain letters and numbers');
      return null;
    }
    
    if (!isTrialCodeUnique(cleanCode)) {
      console.error('Custom code already exists');
      return null;
    }
    
    code = cleanCode;
  } else {
    // Generate random code
    let attempts = 0;
    do {
      code = `TRIAL${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      attempts++;
    } while (!isTrialCodeUnique(code) && attempts < 10);
    
    if (!isTrialCodeUnique(code)) {
      console.error('Could not generate unique trial code');
      return null;
    }
  }
  
  const trialCode: TrialCode = {
    id: Date.now().toString(),
    code,
    days,
    departmentId,
    isActive: true,
    createdAt: new Date().toISOString(),
    createdBy
  };

  const codes = getTrialCodes();
  codes.push(trialCode);
  saveTrialCodes(codes);

  console.log(`Trial code generated: ${code} for ${days} days`);
  return trialCode;
};

// Use trial code
export const useTrialCode = (code: string, geniusId: string, geniusName: string): boolean => {
  const codes = getTrialCodes();
  const codeIndex = codes.findIndex(c => c.code.toUpperCase() === code.toUpperCase() && c.isActive);
  
  if (codeIndex === -1) {
    console.log(`Trial code ${code} not found or inactive`);
    return false;
  }

  const trialCode = codes[codeIndex];
  
  // Check if code is active
  if (!trialCode.isActive) {
    console.log(`Trial code ${code} is inactive`);
    return false;
  }
  
  // Check if genius already used this trial code
  if (hasGeniusUsedTrialCode(geniusId, trialCode.id)) {
    console.log(`Genius ${geniusName} already used trial code ${code}`);
    return false;
  }
  
  // Check department restriction if applicable
  if (trialCode.departmentId) {
    // Get current user to check department
    const getCurrentUser = () => {
      const userStr = localStorage.getItem('currentUser');
      if (!userStr) return null;
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    };
    
    const currentUser = getCurrentUser();
    
    if (!currentUser?.location?.departmentId) {
      console.log(`User ${geniusName} has no location defined for department-restricted code`);
      return false;
    }
    
    if (currentUser.location.departmentId !== trialCode.departmentId) {
      console.log(`User ${geniusName} is not in the required department for code ${code}`);
      return false;
    }
  }

  // Create trial subscription
  const subscriptions = getGeniusSubscriptions();
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + trialCode.days);

  const subscription: GeniusSubscription = {
    geniusId,
    geniusName,
    subscriptionType: 'trial',
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    isActive: true,
    trialCodeId: trialCode.id,
    daysRemaining: trialCode.days
  };

  subscriptions.push(subscription);

  saveGeniusSubscriptions(subscriptions);

  console.log(`Trial code ${code} used by ${geniusName} for ${trialCode.days} days`);
  return true;
};

// Activate trial code
export const activateTrialCode = (codeId: string): boolean => {
  const codes = getTrialCodes();
  const codeIndex = codes.findIndex(c => c.id === codeId);
  
  if (codeIndex === -1) return false;

  codes[codeIndex] = {
    ...codes[codeIndex],
    isActive: true
  };

  saveTrialCodes(codes);
  console.log(`Trial code ${codes[codeIndex].code} activated`);
  return true;
};

// Deactivate trial code
export const deactivateTrialCode = (codeId: string): boolean => {
  const codes = getTrialCodes();
  const codeIndex = codes.findIndex(c => c.id === codeId);
  
  if (codeIndex === -1) return false;

  codes[codeIndex] = {
    ...codes[codeIndex],
    isActive: false
  };

  saveTrialCodes(codes);
  console.log(`Trial code ${codes[codeIndex].code} deactivated`);
  return true;
};

// Get expiring subscriptions
export const getExpiringSubscriptions = (days: number = 30): GeniusSubscription[] => {
  const subscriptions = getGeniusSubscriptions();
  return subscriptions.filter(sub => 
    sub.isActive && sub.daysRemaining <= days && sub.daysRemaining > 0
  );
};

// Get expired subscriptions
export const getExpiredSubscriptions = (): GeniusSubscription[] => {
  const subscriptions = getGeniusSubscriptions();
  return subscriptions.filter(sub => sub.daysRemaining <= 0);
};

// Get payment statistics
export const getPaymentStatistics = () => {
  const vouchers = getPaymentVouchers();
  const subscriptions = getGeniusSubscriptions();
  const codes = getTrialCodes();

  const stats = {
    totalVouchers: vouchers.length,
    pendingVouchers: vouchers.filter(v => v.status === 'pending').length,
    approvedVouchers: vouchers.filter(v => v.status === 'approved').length,
    rejectedVouchers: vouchers.filter(v => v.status === 'rejected').length,
    totalRevenue: vouchers.filter(v => v.status === 'approved').reduce((sum, v) => sum + v.amount, 0),
    activeSubscriptions: subscriptions.filter(s => s.isActive).length,
    expiredSubscriptions: subscriptions.filter(s => !s.isActive).length,
    trialSubscriptions: subscriptions.filter(s => s.subscriptionType === 'trial' && s.isActive).length,
    totalTrialCodes: codes.length,
    activeTrialCodes: codes.filter(c => c.isActive).length,
    inactiveTrialCodes: codes.filter(c => !c.isActive).length,
    totalTrialSubscriptions: subscriptions.filter(s => s.subscriptionType === 'trial').length,
    expiringIn7Days: getExpiringSubscriptions(7).length,
    expiringIn30Days: getExpiringSubscriptions(30).length
  };

  return stats;
};

// Validate voucher data
export const validateVoucherData = (voucher: Partial<PaymentVoucher>): string[] => {
  const errors: string[] = [];

  if (!voucher.geniusId) {
    errors.push('ID del genio es requerido');
  }

  if (!voucher.amount || voucher.amount <= 0) {
    errors.push('Monto debe ser mayor a 0');
  }

  if (!voucher.paymentMethod) {
    errors.push('Método de pago es requerido');
  }

  if (!voucher.operationNumber) {
    errors.push('Número de operación es requerido');
  }

  if (!voucher.paymentDate) {
    errors.push('Fecha de pago es requerida');
  }

  if (!voucher.paymentTime) {
    errors.push('Hora de pago es requerida');
  }

  if (!voucher.voucherImage) {
    errors.push('Imagen del voucher es requerida');
  }

  // Validate payment method specific fields
  if (voucher.paymentMethod === 'transfer' && !voucher.bank) {
    errors.push('Banco es requerido para transferencias');
  }

  if ((voucher.paymentMethod === 'yape' || voucher.paymentMethod === 'plin') && !voucher.app) {
    errors.push('App de pago es requerida');
  }

  return errors;
};

// Search vouchers
export const searchVouchers = (query: string): PaymentVoucher[] => {
  const vouchers = getPaymentVouchers();
  const lowercaseQuery = query.toLowerCase();

  return vouchers.filter(voucher =>
    voucher.geniusName.toLowerCase().includes(lowercaseQuery) ||
    voucher.operationNumber.toLowerCase().includes(lowercaseQuery) ||
    voucher.paymentMethod.toLowerCase().includes(lowercaseQuery) ||
    voucher.bank?.toLowerCase().includes(lowercaseQuery) ||
    voucher.app?.toLowerCase().includes(lowercaseQuery)
  );
};

// Filter vouchers by status
export const filterVouchersByStatus = (status: 'pending' | 'approved' | 'rejected' | 'all'): PaymentVoucher[] => {
  const vouchers = getPaymentVouchers();
  
  if (status === 'all') return vouchers;
  return vouchers.filter(voucher => voucher.status === status);
};

// Filter vouchers by payment method
export const filterVouchersByPaymentMethod = (method: 'yape' | 'plin' | 'transfer' | 'all'): PaymentVoucher[] => {
  const vouchers = getPaymentVouchers();
  
  if (method === 'all') return vouchers;
  return vouchers.filter(voucher => voucher.paymentMethod === method);
};

// Export payment data
export const exportPaymentData = (): void => {
  const vouchers = getPaymentVouchers();
  const subscriptions = getGeniusSubscriptions();
  const codes = getTrialCodes();
  const stats = getPaymentStatistics();

  const exportData = {
    vouchers,
    subscriptions,
    trialCodes: codes,
    statistics: stats,
    exportedAt: new Date().toISOString()
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `pagos_${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

// Extend subscription
export const extendSubscription = (geniusId: string, additionalDays: number): boolean => {
  const subscriptions = getGeniusSubscriptions();
  const subIndex = subscriptions.findIndex(sub => sub.geniusId === geniusId);
  
  if (subIndex === -1) return false;

  const subscription = subscriptions[subIndex];
  const newEndDate = new Date(subscription.endDate);
  newEndDate.setDate(newEndDate.getDate() + additionalDays);

  subscriptions[subIndex] = {
    ...subscription,
    endDate: newEndDate.toISOString(),
    daysRemaining: calculateDaysRemaining(newEndDate.toISOString()),
    isActive: true
  };

  saveGeniusSubscriptions(subscriptions);
  return true;
};

// Deactivate subscription
export const deactivateSubscription = (geniusId: string): boolean => {
  const subscriptions = getGeniusSubscriptions();
  const subIndex = subscriptions.findIndex(sub => sub.geniusId === geniusId);
  
  if (subIndex === -1) return false;

  subscriptions[subIndex] = {
    ...subscriptions[subIndex],
    isActive: false,
    endDate: new Date().toISOString(),
    daysRemaining: 0
  };

  saveGeniusSubscriptions(subscriptions);
  return true;
};

// Get vouchers by genius
export const getVouchersByGenius = (geniusId: string): PaymentVoucher[] => {
  const vouchers = getPaymentVouchers();
  return vouchers.filter(voucher => voucher.geniusId === geniusId);
};

// Get subscription by genius
export const getSubscriptionByGenius = (geniusId: string): GeniusSubscription | null => {
  const subscriptions = getGeniusSubscriptions();
  return subscriptions.find(sub => sub.geniusId === geniusId) || null;
};

// Check if genius has active subscription
export const hasActiveSubscription = (geniusId: string): boolean => {
  const subscription = getSubscriptionByGenius(geniusId);
  return subscription ? subscription.isActive && subscription.daysRemaining > 0 : false;
};

// Get payment method display name
export const getPaymentMethodDisplayName = (method: string): string => {
  const displayNames = {
    yape: 'Yape',
    plin: 'Plin',
    transfer: 'Transferencia Bancaria'
  };
  
  return displayNames[method as keyof typeof displayNames] || method;
};

// Get subscription type display name
export const getSubscriptionTypeDisplayName = (type: string): string => {
  const displayNames = {
    annual: 'Anual (12 meses)',
    trial: 'Código de Prueba'
  };
  
  return displayNames[type as keyof typeof displayNames] || type;
};

// Initialize with mock data for demo
export const initializeMockPaymentData = (): void => {
  const existingVouchers = getPaymentVouchers();
  const existingCodes = getTrialCodes();
  const existingSubscriptions = getGeniusSubscriptions();

  // Only initialize if no data exists
  if (existingVouchers.length === 0) {
    const mockVouchers: PaymentVoucher[] = [
      {
        id: '1',
        geniusId: '1',
        geniusName: 'Ana Estilista',
        amount: 100,
        paymentMethod: 'yape',
        operationNumber: 'YPE123456789',
        app: 'Yape',
        paymentDate: '2025-01-28',
        paymentTime: '14:30',
        voucherImage: 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=400',
        hash: 'ABC123DEF456',
        status: 'pending',
        submittedAt: '2025-01-28T14:35:00.000Z',
        subscriptionType: 'annual',
        subscriptionDays: 365
      },
      {
        id: '2',
        geniusId: '2',
        geniusName: 'Luis Técnico',
        amount: 100,
        paymentMethod: 'plin',
        operationNumber: 'PLN987654321',
        app: 'Plin',
        paymentDate: '2025-01-27',
        paymentTime: '16:45',
        voucherImage: 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=400',
        hash: 'XYZ789ABC123',
        status: 'approved',
        submittedAt: '2025-01-27T16:50:00.000Z',
        reviewedAt: '2025-01-28T09:15:00.000Z',
        reviewedBy: 'admin@genios.pe',
        subscriptionType: 'annual',
        subscriptionDays: 365
      },
      {
        id: '3',
        geniusId: '3',
        geniusName: 'Sofía Nutricionista',
        amount: 95,
        paymentMethod: 'transfer',
        operationNumber: 'TRF456789123',
        bank: 'BCP',
        paymentDate: '2025-01-26',
        paymentTime: '10:20',
        voucherImage: 'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=400',
        hash: 'DEF456GHI789',
        status: 'rejected',
        submittedAt: '2025-01-26T10:25:00.000Z',
        reviewedAt: '2025-01-27T11:30:00.000Z',
        reviewedBy: 'admin@genios.pe',
        rejectionReason: 'Monto incorrecto - debe ser S/100',
        subscriptionType: 'annual',
        subscriptionDays: 365
      }
    ];

    savePaymentVouchers(mockVouchers);
  }

  if (existingCodes.length === 0) {
    const mockCodes: TrialCode[] = [
      {
        id: '1',
        code: 'TACNA7',
        days: 7,
        departmentId: 'tacna',
        isActive: true,
        createdAt: '2025-01-25T10:00:00.000Z',
        createdBy: 'admin@genios.pe'
      },
      {
        id: '2',
        code: 'LIMA15',
        days: 15,
        departmentId: 'lima',
        isActive: true,
        createdAt: '2025-01-25T10:05:00.000Z',
        createdBy: 'admin@genios.pe'
      },
      {
        id: '3',
        code: 'GLOBAL30',
        days: 30,
        departmentId: undefined, // Global code
        isActive: true,
        createdAt: '2025-01-20T15:00:00.000Z',
        createdBy: 'admin@genios.pe'
      },
      {
        id: '4',
        code: 'AREQUIPA60',
        days: 60,
        departmentId: 'arequipa',
        isActive: false,
        createdAt: '2025-01-15T08:00:00.000Z',
        createdBy: 'admin@genios.pe'
      },
      {
        id: '5',
        code: 'CUSCO45',
        days: 45,
        departmentId: 'cusco',
        isActive: true,
        createdAt: '2025-01-20T16:00:00.000Z',
        createdBy: 'admin@genios.pe'
      }
    ];

    saveTrialCodes(mockCodes);
  }

  if (existingSubscriptions.length === 0) {
    const mockSubscriptions: GeniusSubscription[] = [
      {
        geniusId: '2',
        geniusName: 'Luis Técnico',
        subscriptionType: 'annual',
        startDate: '2024-02-01T00:00:00.000Z',
        endDate: '2025-02-01T00:00:00.000Z',
        isActive: true,
        paymentId: '2',
        daysRemaining: calculateDaysRemaining('2025-02-01T00:00:00.000Z')
      },
      {
        geniusId: '6',
        geniusName: 'Roberto DJ',
        subscriptionType: 'trial',
        startDate: '2025-01-22T12:30:00.000Z',
        endDate: '2025-02-21T12:30:00.000Z',
        isActive: true,
        trialCodeId: '1',
        daysRemaining: calculateDaysRemaining('2025-02-21T12:30:00.000Z')
      }
    ];

    saveGeniusSubscriptions(mockSubscriptions);
  }
};