import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface LocationToggleProps {
  isActive: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LocationToggle: React.FC<LocationToggleProps> = ({ 
  isActive, 
  onToggle, 
  size = 'md',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <button
      onClick={onToggle}
      className={`${sizeClasses[size]} rounded-lg transition-colors ${
        isActive 
          ? 'text-green-600 hover:bg-green-100' 
          : 'text-red-600 hover:bg-red-100'
      } ${className}`}
      title={isActive ? 'Desactivar' : 'Activar'}
    >
      {isActive ? (
        <Eye className={iconSizes[size]} />
      ) : (
        <EyeOff className={iconSizes[size]} />
      )}
    </button>
  );
};

export default LocationToggle;