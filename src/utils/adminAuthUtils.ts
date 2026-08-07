// Admin authentication utility functions

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  lastLogin: string;
  permissions: string[];
}

// Check if admin is authenticated
export const isAdminAuthenticated = (): boolean => {
  return localStorage.getItem('isAdminAuthenticated') === 'true';
};

// Get current admin user data
export const getCurrentAdmin = (): AdminUser | null => {
  const adminStr = localStorage.getItem('currentAdmin');
  if (!adminStr) return null;
  
  try {
    return JSON.parse(adminStr) as AdminUser;
  } catch (error) {
    console.error('Error parsing admin data:', error);
    return null;
  }
};

// Set current admin
export const setCurrentAdmin = (admin: AdminUser): void => {
  localStorage.setItem('currentAdmin', JSON.stringify(admin));
  localStorage.setItem('isAdminAuthenticated', 'true');
  
  // Dispatch custom event to notify components of admin auth state change
  window.dispatchEvent(new Event('adminAuthStateChanged'));
};

// Logout admin
export const logoutAdmin = (): void => {
  localStorage.removeItem('currentAdmin');
  localStorage.removeItem('isAdminAuthenticated');
  
  // Dispatch custom event to notify components of admin auth state change
  window.dispatchEvent(new Event('adminAuthStateChanged'));
  
  // Redirect to admin login
  window.location.href = '/admin/login';
};

// Validate admin credentials (mock implementation)
export const validateAdminCredentials = async (email: string, password: string): Promise<AdminUser | null> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock admin credentials
  const mockAdmins = [
    {
      id: 'admin1',
      email: 'admin@genios.pe',
      name: 'Administrador Principal',
      role: 'super_admin' as const,
      lastLogin: new Date().toISOString(),
      permissions: ['users', 'genios', 'reports', 'settings', 'payments']
    },
    {
      id: 'admin2',
      email: 'soporte@genios.pe',
      name: 'Soporte Técnico',
      role: 'admin' as const,
      lastLogin: new Date().toISOString(),
      permissions: ['users', 'genios', 'reports']
    }
  ];
  
  // Check credentials
  const admin = mockAdmins.find(a => a.email === email && password === 'admin123');
  
  if (admin) {
    return {
      ...admin,
      lastLogin: new Date().toISOString()
    };
  }
  
  return null;
};

// Check if admin has specific permission
export const hasPermission = (permission: string): boolean => {
  const admin = getCurrentAdmin();
  return admin?.permissions.includes(permission) || false;
};

// Generate admin session token (mock)
export const generateAdminToken = (): string => {
  return `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};