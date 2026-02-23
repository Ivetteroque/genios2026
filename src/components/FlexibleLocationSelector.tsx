import React, { useState, useEffect } from 'react';
import { MapPin, X, ChevronDown, Search, Plus, Check } from 'lucide-react';
import { getActiveDepartments, Department, Province, District } from '../utils/locationUtils';

export interface SelectedLocation {
  departmentId: string;
  departmentName: string;
  provinceId?: string;
  provinceName?: string;
  districtId?: string;
  districtName?: string;
  fullName: string;
  type: 'department' | 'province' | 'district';
}

interface FlexibleLocationSelectorProps {
  selectedLocations: SelectedLocation[];
  onLocationsChange: (locations: SelectedLocation[]) => void;
  placeholder?: string;
  maxSelections?: number;
  className?: string;
}

const FlexibleLocationSelector: React.FC<FlexibleLocationSelectorProps> = ({
  selectedLocations,
  onLocationsChange,
  placeholder = "Selecciona tus zonas de atención...",
  maxSelections = 10,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDepartments, setActiveDepartments] = useState<Department[]>([]);
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  const [expandedProvinces, setExpandedProvinces] = useState<Set<string>>(new Set());

  // Load active departments on component mount
  useEffect(() => {
    loadActiveDepartments();

    // Listen for location changes from admin panel
    const handleLocationsChanged = () => {
      loadActiveDepartments();
    };

    window.addEventListener('locationsChanged', handleLocationsChanged);
    return () => window.removeEventListener('locationsChanged', handleLocationsChanged);
  }, []);

  const loadActiveDepartments = () => {
    const departments = getActiveDepartments();
    setActiveDepartments(departments);
  };

  // Filter departments, provinces, and districts based on search term
  const getFilteredLocations = () => {
    if (!searchTerm) return activeDepartments;

    const lowercaseQuery = searchTerm.toLowerCase();
    return activeDepartments.map(dept => ({
      ...dept,
      provinces: dept.provinces.map(prov => ({
        ...prov,
        districts: prov.districts.filter(dist =>
          dist.name.toLowerCase().includes(lowercaseQuery) ||
          prov.name.toLowerCase().includes(lowercaseQuery) ||
          dept.name.toLowerCase().includes(lowercaseQuery)
        )
      })).filter(prov => 
        prov.name.toLowerCase().includes(lowercaseQuery) ||
        dept.name.toLowerCase().includes(lowercaseQuery) ||
        prov.districts.length > 0
      )
    })).filter(dept => 
      dept.name.toLowerCase().includes(lowercaseQuery) ||
      dept.provinces.length > 0
    );
  };

  const filteredDepartments = getFilteredLocations();

  // Check if a location is already selected
  const isLocationSelected = (location: Partial<SelectedLocation>): boolean => {
    return selectedLocations.some(selected => {
      if (location.type === 'department') {
        return selected.departmentId === location.departmentId && selected.type === 'department';
      } else if (location.type === 'province') {
        return selected.departmentId === location.departmentId && 
               selected.provinceId === location.provinceId && 
               selected.type === 'province';
      } else if (location.type === 'district') {
        return selected.departmentId === location.departmentId && 
               selected.provinceId === location.provinceId && 
               selected.districtId === location.districtId && 
               selected.type === 'district';
      }
      return false;
    });
  };

  // Add or remove location
  const toggleLocation = (location: SelectedLocation) => {
    if (isLocationSelected(location)) {
      // Remove location
      onLocationsChange(selectedLocations.filter(selected => 
        !(selected.departmentId === location.departmentId &&
          selected.provinceId === location.provinceId &&
          selected.districtId === location.districtId &&
          selected.type === location.type)
      ));
    } else {
      // Add location (if under limit)
      if (selectedLocations.length < maxSelections) {
        onLocationsChange([...selectedLocations, location]);
      } else {
        alert(`Máximo ${maxSelections} ubicaciones permitidas`);
      }
    }
  };

  const handleRemoveLocation = (index: number) => {
    onLocationsChange(selectedLocations.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    onLocationsChange([]);
  };

  const toggleDepartmentExpansion = (departmentId: string) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(departmentId)) {
      newExpanded.delete(departmentId);
    } else {
      newExpanded.add(departmentId);
    }
    setExpandedDepartments(newExpanded);
  };

  const toggleProvinceExpansion = (provinceKey: string) => {
    const newExpanded = new Set(expandedProvinces);
    if (newExpanded.has(provinceKey)) {
      newExpanded.delete(provinceKey);
    } else {
      newExpanded.add(provinceKey);
    }
    setExpandedProvinces(newExpanded);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isOpen && !target.closest('.flexible-location-selector-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`flexible-location-selector-container relative ${className}`}>
      {/* Selected Locations Tags */}
      {selectedLocations.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {selectedLocations.map((location, index) => (
              <div
                key={`${location.departmentId}-${location.provinceId}-${location.districtId}-${location.type}`}
                className="inline-flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full text-sm border border-primary/20"
              >
                <MapPin className="w-3 h-3 mr-1" />
                <span className="font-medium">{location.fullName}</span>
                <span className="text-primary/60 ml-1">
                  ({location.type === 'department' ? 'Depto' : location.type === 'province' ? 'Prov' : 'Dist'})
                </span>
                <button
                  onClick={() => handleRemoveLocation(index)}
                  className="ml-2 text-primary/60 hover:text-primary transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            {selectedLocations.length > 1 && (
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
            <span className={selectedLocations.length > 0 ? 'text-text' : 'text-text/50'}>
              {selectedLocations.length > 0 
                ? `${selectedLocations.length} ubicación${selectedLocations.length > 1 ? 'es' : ''} seleccionada${selectedLocations.length > 1 ? 's' : ''}`
                : placeholder
              }
            </span>
          </div>
          <ChevronDown className={`w-5 h-5 text-text/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-[80vh] overflow-y-auto flex flex-col">
            {/* Search */}
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar departamento, provincia o distrito..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 text-sm"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text/40 w-4 h-4" />
              </div>
            </div>

            {/* Locations Tree */}
            <div className="flex-grow">
              {filteredDepartments.length > 0 ? (
                <div className="p-2">
                  {filteredDepartments.map((department) => (
                    <div key={department.id} className="mb-2">
                      {/* Department Level */}
                      <label className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        isLocationSelected({
                          departmentId: department.id,
                          type: 'department'
                        }) 
                          ? 'bg-blue-50 border-2 border-blue-200' 
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}>
                        <div className="flex items-center space-x-3 flex-1">
                          <input
                            type="checkbox"
                            checked={isLocationSelected({
                              departmentId: department.id,
                              type: 'department'
                            })}
                            onChange={() => toggleLocation({
                              departmentId: department.id,
                              departmentName: department.name,
                              fullName: department.name,
                              type: 'department'
                            })}
                            className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded"
                          />
                          
                          <button
                            type="button"
                            onClick={() => toggleDepartmentExpansion(department.id)}
                            className="text-text/60 hover:text-text transition-colors p-1"
                          >
                            <ChevronDown className={`w-4 h-4 transition-transform ${
                              expandedDepartments.has(department.id) ? 'rotate-180' : ''
                            }`} />
                          </button>
                          
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                          
                          <span className={`font-medium ${
                            isLocationSelected({
                              departmentId: department.id,
                              type: 'department'
                            }) ? 'text-blue-700' : 'text-text'
                          }`}>
                            {department.name}
                          </span>
                          
                          <span className="text-xs text-text/60 bg-gray-100 px-2 py-1 rounded-full">
                            Todo el departamento
                          </span>
                        </div>
                      </label>

                      {/* Provinces Level */}
                      {expandedDepartments.has(department.id) && (
                        <div className="ml-6 space-y-1">
                          {department.provinces.map((province) => (
                            <div key={province.id}>
                              <label className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                                isLocationSelected({
                                  departmentId: department.id,
                                  provinceId: province.id,
                                  type: 'province'
                                }) 
                                  ? 'bg-green-50 border-2 border-green-200' 
                                  : 'hover:bg-gray-50 border-2 border-transparent'
                              }`}>
                                <div className="flex items-center space-x-3 flex-1">
                                  <input
                                    type="checkbox"
                                    checked={isLocationSelected({
                                      departmentId: department.id,
                                      provinceId: province.id,
                                      type: 'province'
                                    })}
                                    onChange={() => toggleLocation({
                                      departmentId: department.id,
                                      departmentName: department.name,
                                      provinceId: province.id,
                                      provinceName: province.name,
                                      fullName: `${province.name}, ${department.name}`,
                                      type: 'province'
                                    })}
                                    className="w-4 h-4 text-green-600 focus:ring-green-500 rounded"
                                  />
                                  
                                  <button
                                    type="button"
                                    onClick={() => toggleProvinceExpansion(`${department.id}-${province.id}`)}
                                    className="text-text/60 hover:text-text transition-colors p-1"
                                  >
                                    <ChevronDown className={`w-3 h-3 transition-transform ${
                                      expandedProvinces.has(`${department.id}-${province.id}`) ? 'rotate-180' : ''
                                    }`} />
                                  </button>
                                  
                                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                                  
                                  <span className={`text-sm ${
                                    isLocationSelected({
                                      departmentId: department.id,
                                      provinceId: province.id,
                                      type: 'province'
                                    }) ? 'text-green-700 font-medium' : 'text-text'
                                  }`}>
                                    {province.name}
                                  </span>
                                  
                                  <span className="text-xs text-text/60 bg-gray-100 px-2 py-1 rounded-full">
                                    Toda la provincia
                                  </span>
                                </div>
                              </label>

                              {/* Districts Level */}
                              {expandedProvinces.has(`${department.id}-${province.id}`) && (
                                <div className="ml-6 space-y-1">
                                  {province.districts.map((district) => (
                                    <label 
                                      key={district.id} 
                                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                        isLocationSelected({
                                          departmentId: department.id,
                                          provinceId: province.id,
                                          districtId: district.id,
                                          type: 'district'
                                        }) 
                                          ? 'bg-purple-50 border-2 border-purple-200' 
                                          : 'hover:bg-gray-50 border-2 border-transparent'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isLocationSelected({
                                          departmentId: department.id,
                                          provinceId: province.id,
                                          districtId: district.id,
                                          type: 'district'
                                        })}
                                        onChange={() => toggleLocation({
                                          departmentId: department.id,
                                          departmentName: department.name,
                                          provinceId: province.id,
                                          provinceName: province.name,
                                          districtId: district.id,
                                          districtName: district.name,
                                          fullName: `${district.name}, ${province.name}, ${department.name}`,
                                          type: 'district'
                                        })}
                                        className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded"
                                      />
                                      
                                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                                      
                                      <span className={`text-sm flex-1 ${
                                        isLocationSelected({
                                          departmentId: department.id,
                                          provinceId: province.id,
                                          districtId: district.id,
                                          type: 'district'
                                        }) ? 'text-purple-700 font-medium' : 'text-text'
                                      }`}>
                                        {district.name}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
                  {selectedLocations.length}/{maxSelections} seleccionadas
                </span>
                <span>
                  Puedes elegir departamentos, provincias o distritos
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help Text */}
      <p className="text-xs text-text/60 mt-2">
        ✅ Marca las casillas de las zonas donde trabajas (máximo {maxSelections}). Es muy fácil: solo haz clic en las casillas.
      </p>
    </div>
  );
};

export default FlexibleLocationSelector;