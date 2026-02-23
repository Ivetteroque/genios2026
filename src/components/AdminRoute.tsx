import React, { useEffect } from 'react';
import { isAdminAuthenticated } from '../utils/adminAuthUtils';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  useEffect(() => {
    // Check if admin is authenticated
    if (!isAdminAuthenticated()) {
      // Redirect to admin login if not authenticated
      window.location.href = '/admin/login';
      return;
    }
  }, []);

  // Don't render anything if not authenticated (will redirect)
  if (!isAdminAuthenticated()) {
    return null;
  }

  return <>{children}</>;
};

export default AdminRoute;