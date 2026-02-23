import React from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'suspended' | 'pending' | 'approved' | 'rejected' | 'success' | 'error' | 'verified';
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  text, 
  size = 'md',
  showIcon = true 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
      case 'approved':
      case 'verified':
      case 'success':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          icon: <CheckCircle className="w-3 h-3" />,
          defaultText: status === 'active' ? 'Activo' : status === 'approved' ? 'Aprobado' : status === 'verified' ? 'Verificado' : 'Exitoso'
        };
      case 'inactive':
      case 'suspended':
      case 'rejected':
      case 'error':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          icon: <XCircle className="w-3 h-3" />,
          defaultText: status === 'inactive' ? 'Inactivo' : status === 'suspended' ? 'Suspendido' : status === 'rejected' ? 'Rechazado' : 'Error'
        };
      case 'pending':
        return {
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          icon: <Clock className="w-3 h-3" />,
          defaultText: 'Pendiente'
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          icon: null,
          defaultText: status
        };
    }
  };

  const config = getStatusConfig();
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1 text-sm'
  };

  return (
    <span className={`inline-flex items-center ${sizeClasses[size]} rounded-full font-medium ${config.bgColor} ${config.textColor}`}>
      {showIcon && config.icon && (
        <span className="mr-1">{config.icon}</span>
      )}
      {text || config.defaultText}
    </span>
  );
};

export default StatusBadge;