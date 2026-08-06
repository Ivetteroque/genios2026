import { supabase } from '../lib/supabase';

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
  // Sin esto la sesión de Supabase sobreviviría al logout y el navegador
  // seguiría teniendo permisos de admin contra la base.
  supabase.auth.signOut().catch(() => {});

  localStorage.removeItem('currentAdmin');
  localStorage.removeItem('isAdminAuthenticated');
  
  // Dispatch custom event to notify components of admin auth state change
  window.dispatchEvent(new Event('adminAuthStateChanged'));
  
  // Redirect to admin login
  window.location.href = '/admin/login';
};

/**
 * Valida las credenciales contra Supabase Auth.
 *
 * Antes comparaba contra dos usuarios escritos acá mismo con la contraseña
 * `admin123`: la sesión existía solo en el navegador, así que para Supabase el
 * panel era un visitante anónimo y RLS le devolvía cero filas en todas las
 * tablas. Ahora la sesión es real y el rol viaja en el JWT, que es lo que leen
 * las políticas mediante `is_admin()`.
 *
 * Los administradores se crean con `node scripts/create-admin.mjs`.
 */
export const validateAdminCredentials = async (
  email: string,
  password: string
): Promise<AdminUser | null> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) return null;

  const metadata = (data.user.app_metadata ?? {}) as {
    role?: string;
    name?: string;
    permissions?: string[];
  };

  // Una cuenta común (un cliente que entró con Google, por ejemplo) puede
  // autenticarse, pero no es admin: se cierra la sesión para no dejarla abierta.
  if (metadata.role !== 'admin' && metadata.role !== 'super_admin') {
    await supabase.auth.signOut();
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email ?? email,
    name: metadata.name || 'Administrador',
    role: metadata.role,
    lastLogin: new Date().toISOString(),
    permissions: metadata.permissions ?? [],
  };
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