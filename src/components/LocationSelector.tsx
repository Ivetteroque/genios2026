import React, { useState, useEffect } from 'react';
import { MapPin, X, ChevronDown, Search } from 'lucide-react';
import { getActiveDistricts } from '../utils/locationUtils';

interface LocationSelectorProps {
  selectedDistricts: string[];
  onDistrictsChange: (districts: string[]) => void;
  placeholder?: string;
  maxSelections?: number;
  className?: string;
}

interface DistrictOption {
  departmentId: string;
  departmentName: string;
  provinceId: string;
  provinceName: string;
  districtId: string;
  districtName: string;
  fullName: string;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedDistricts,
  onDistrictsChange,
  placeholder = "Selecciona zonas de atención...",
  maxSelections = 5,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableDistricts, setAvailableDistricts] = useState<DistrictOption[]>([]);

  // Load available districts on component mount
  useEffect(() => {
    loadAvailableDistricts();

    // Listen for location changes from admin panel
    const handleLocationsChanged = () => {
      loadAvailableDistricts();
    };

    window.addEventListener('locationsChanged', handleLocationsChanged);
    return () => window.removeEventListener('locationsChanged', handleLocationsChanged);
  }, []);

  const loadAvailableDistricts = () => {
    const districts = getActiveDistricts();
    setAvailableDistricts(districts);
  };

  // Filter districts based on search term
  const filteredDistricts = availableDistricts.filter(district =>
    district.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    district.districtName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    district.provinceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    district.departmentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected district objects
  const selectedDistrictObjects = availableDistricts.filter(district =>
    selectedDistricts.includes(district.districtId)
  );

  const handleDistrictToggle = (districtId: string) => {
    if (selectedDistricts.includes(districtId)) {
      // Remove district
      onDistrictsChange(selectedDistricts.filter(id => id !== districtId));
    } else {
      // Add district (if under limit)
      if (selectedDistricts.length < maxSelections) {
        onDistrictsChange([...selectedDistricts, districtId]);
      } else {
        alert(`Máximo ${maxSelections} zonas de atención permitidas`);
      }
    }
  };

  const handleRemoveDistrict = (districtId: string) => {
    onDistrictsChange(selectedDistricts.filter(id => id !== districtId));
  };

  const handleClearAll = () => {
    onDistrictsChange([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isOpen && !target.closest('.location-selector-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`location-selector-container relative ${className}`}>
      {/* Selected Districts Tags */}
      {selectedDistrictObjects.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {selectedDistrictObjects.map((district) => (
              <div
                key={district.districtId}
                className="inline-flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full text-sm border border-primary/20"
              >
                <MapPin className="w-3 h-3 mr-1" />
                <span className="font-medium">{district.districtName}</span>
                <span className="text-primary/60 ml-1">({district.provinceName})</span>
                <button
                  onClick={() => handleRemoveDistrict(district.districtId)}
                  className="ml-2 text-primary/60 hover:text-primary transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            {selectedDistrictObjects.length > 1 && (
              <button
                onClick={handleClearAll}
                className="inline-flex items-center text-red-500 hover:text-red-600 px-2 py-1 text-sm transition-colors"
              >
                <X className="w-3 h-3 mr-1" />
                Limpiar todo
              </button>
            )}
          </div>
        </div>
      )}

      {/* Selector Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 bg-white text-left flex items-center justify-between"
        >
          <div className="flex items-center">
            <MapPin className="w-5 h-5 text-primary/60 mr-2" />
            <span className={selectedDistricts.length > 0 ? 'text-text' : 'text-text/50'}>
              {selectedDistricts.length > 0 
                ? `${selectedDistricts.length} zona${selectedDistricts.length > 1 ? 's' : ''} seleccionada${selectedDistricts.length > 1 ? 's' : ''}`
                : placeholder
              }
            </span>
          </div>
          <ChevronDown className={`w-5 h-5 text-text/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar distrito, provincia o departamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 text-sm"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text/40 w-4 h-4" />
              </div>
            </div>

            {/* Options */}
            <div className="max-h-60 overflow-y-auto">
              {filteredDistricts.length > 0 ? (
                <div className="p-2">
                  {filteredDistricts.map((district) => (
                    <button
                      key={district.districtId}
                      type="button"
                      onClick={() => handleDistrictToggle(district.districtId)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between hover:bg-gray-50 ${
                        selectedDistricts.includes(district.districtId)
                          ? 'bg-primary/10 text-primary'
                          : 'text-text'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          selectedDistricts.includes(district.districtId)
                            ? 'border-primary bg-primary'
                            : 'border-gray-300'
                        }`}>
                          {selectedDistricts.includes(district.districtId) && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{district.districtName}</div>
                          <div className="text-xs text-text/60">
                            {district.provinceName}, {district.departmentName}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-text/60">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-text/40" />
                  <p className="text-sm">
                    {searchTerm 
                      ? 'No se encontraron ubicaciones que coincidan con tu búsqueda'
                      : 'No hay ubicaciones disponibles'
                    }
                  </p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-primary hover:text-primary-dark text-sm mt-1"
                    >
                      Limpiar búsqueda
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between text-xs text-text/60">
                <span>
                  {selectedDistricts.length}/{maxSelections} seleccionadas
                </span>
                <span>
                  {filteredDistricts.length} disponibles
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help Text */}
      <p className="text-xs text-text/60 mt-2">
        Selecciona hasta {maxSelections} zonas donde ofreces tus servicios
      </p>
    </div>
  );
};

export default LocationSelector;