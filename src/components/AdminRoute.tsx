import React, { useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import {
  clearAdminSession,
  getVerifiedAdmin,
  setCurrentAdmin,
} from '../utils/adminAuthUtils';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Deja pasar solo a quien tiene una sesión de Supabase con rol de admin,
 * verificada contra el servidor. La bandera de localStorage no cuenta: se
 * puede escribir a mano desde la consola del navegador.
 */
const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const [status, setStatus] = useState<'checking' | 'allowed'>('checking');

  useEffect(() => {
    let active = true;

    getVerifiedAdmin().then((admin) => {
      if (!active) return;

      if (!admin) {
        clearAdminSession();
        window.location.replace('/admin/login');
        return;
      }

      // Refresca la copia local (nombre, permisos) con lo que dice el token.
      setCurrentAdmin(admin);
      setStatus('allowed');
    });

    return () => {
      active = false;
    };
  }, []);

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Verificando acceso..." />
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
