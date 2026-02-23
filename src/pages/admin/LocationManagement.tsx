import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  ChevronDown, 
  ChevronRight, 
  Eye,
  EyeOff,
  Search, 
  Filter, 
  Download, 
  Save, 
  RefreshCw,
  BarChart3,
  Globe,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  Department,
  Province,
  District,
  getLocations,
  saveLocations,
  toggleDepartmentStatus,
  toggleProvinceStatus,
  toggleDistrictStatus,
  exportLocations,
  getLocationStatistics
} from '../../utils/locationUtils';
import LocationToggle from '../../components/LocationToggle';

const LocationManagement: React.FC = () => {
  const [locations, setLocations] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statistics, setStatistics] = useState({
    departments: { total: 0, active: 0 },
    provinces: { total: 0, active: 0 },
    districts: { total: 0, active: 0 }
  });

  // Load locations on component mount
  useEffect(() => {
    loadLocations();
  }, []);

  // Update statistics when locations change
  useEffect(() => {
    const stats = getLocationStatistics();
    setStatistics(stats);
  }, [locations]);

  const loadLocations = () => {
    const loadedLocations = getLocations();
    setLocations(loadedLocations);
    setHasUnsavedChanges(false);
  };

  // Filter locations based on search and active filter
  const filteredLocations = locations.filter(department => {
    const matchesSearch = department.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && department.isActive) ||
                         (filterActive === 'inactive' && !department.isActive);
    
    return matchesSearch && matchesFilter;
  }).sort((a, b) => a.order - b.order);

  // Mark changes as unsaved when locations are modified
  const markAsChanged = () => {
    setHasUnsavedChanges(true);
  };

  // Handle updating all changes
  const handleUpdateChanges = async () => {
    setIsUpdating(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Save locations and dispatch event
      saveLocations(locations);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('locationsChanged', { detail: locations }));
      
      setHasUnsavedChanges(false);
      
      // Show success message
      alert('✅ ¡Cambios actualizados exitosamente!\n\nTodas las modificaciones se han aplicado y están disponibles para los genios.');
      
    } catch (error) {
      console.error('Error updating locations:', error);
      alert('❌ Error al actualizar los cambios. Intenta nuevamente.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleDepartment = (departmentId: string) => {
    setLocations(locations.map(dept => 
      dept.id === departmentId ? { ...dept, isActive: !dept.isActive } : dept
    ));
    markAsChanged();
  };

  const handleToggleProvince = (departmentId: string, provinceId: string) => {
    setLocations(locations.map(dept => 
      dept.id === departmentId 
        ? { 
            ...dept, 
            provinces: dept.provinces.map(prov =>
              prov.id === provinceId 
                ? { ...prov, isActive: !prov.isActive }
                : prov
            )
          }
        : dept
    ));
    markAsChanged();
  };

  const handleToggleDistrict = (departmentId: string, provinceId: string, districtId: string) => {
    setLocations(locations.map(dept => 
      dept.id === departmentId 
        ? { 
            ...dept, 
            provinces: dept.provinces.map(prov =>
              prov.id === provinceId 
                ? { 
                    ...prov, 
                    districts: prov.districts.map(dist =>
                      dist.id === districtId 
                        ? { ...dist, isActive: !dist.isActive }
                        : dist
                    )
                  }
                : prov
            )
          }
        : dept
    ));
    markAsChanged();
  };

  const handleToggleDepartmentExpansion = (departmentId: string) => {
    setLocations(locations.map(dept => 
      dept.id === departmentId 
        ? { ...dept, isExpanded: !dept.isExpanded }
        : dept
    ));
  };

  const handleToggleProvinceExpansion = (departmentId: string, provinceId: string) => {
    setLocations(locations.map(dept => 
      dept.id === departmentId 
        ? { 
            ...dept, 
            provinces: dept.provinces.map(prov =>
              prov.id === provinceId 
                ? { ...prov, isExpanded: !prov.isExpanded }
                : prov
            )
          }
        : dept
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text">Gestión de Ubicaciones</h1>
          <p className="text-text/60 mt-1">Administra departamentos, provincias y distritos del Perú</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={exportLocations}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-text rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text/60 text-sm font-medium">Departamentos</p>
              <p className="text-2xl font-bold text-text">
                {statistics.departments.active}/{statistics.departments.total}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-blue-500 text-sm font-medium">
              {Math.round((statistics.departments.active / statistics.departments.total) * 100)}% activos
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text/60 text-sm font-medium">Provincias</p>
              <p className="text-2xl font-bold text-text">
                {statistics.provinces.active}/{statistics.provinces.total}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-green-500 text-sm font-medium">
              {Math.round((statistics.provinces.active / statistics.provinces.total) * 100)}% activas
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text/60 text-sm font-medium">Distritos</p>
              <p className="text-2xl font-bold text-text">
                {statistics.districts.active}/{statistics.districts.total}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-purple-500 text-sm font-medium">
              {Math.round((statistics.districts.active / statistics.districts.total) * 100)}% activos
            </span>
          </div>
        </div>
      </div>

      {/* Update Changes Button */}
      {hasUnsavedChanges && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-orange-800">Cambios Pendientes</h3>
                <p className="text-orange-700 text-sm">
                  Tienes modificaciones sin aplicar. Actualiza para que estén disponibles para los genios.
                </p>
              </div>
            </div>
            
            <button
              onClick={handleUpdateChanges}
              disabled={isUpdating}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg ${
                isUpdating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-success hover:bg-success-dark text-white transform hover:scale-105'
              }`}
              style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
            >
              {isUpdating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
                  <span>Actualizando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>🔄 Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar ubicaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text/40 w-4 h-4" />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-text/60" />
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
          </div>

          <div className="text-text/60 text-sm">
            {filteredLocations.length} de {locations.length} departamentos
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          <p className="text-blue-800 font-medium">Gestión de Ubicaciones del Perú</p>
        </div>
        <p className="text-blue-600 text-sm mt-1">
          Activa/desactiva departamentos, provincias y distritos. Solo las ubicaciones activas aparecerán en los formularios de los genios.
        </p>
      </div>

      {/* Locations List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="space-y-4">
            {filteredLocations.map((department) => (
              <div key={department.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Department Header */}
                <div className="p-4 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleToggleDepartmentExpansion(department.id)}
                      className="text-text/60 hover:text-text transition-colors"
                    >
                      {department.isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>

                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-medium">
                      <Globe className="w-4 h-4" />
                    </div>

                    <div>
                      <h3 className="font-heading font-bold text-text">{department.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-text/40">
                          {department.provinces.length} provincias
                        </span>
                        <span className="text-xs text-text/40">•</span>
                        <span className="text-xs text-text/40">
                          {department.provinces.reduce((total, prov) => total + prov.districts.length, 0)} distritos
                        </span>
                        <span className="text-xs text-text/40">•</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          department.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {department.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <LocationToggle
                      isActive={department.isActive}
                      onToggle={() => handleToggleDepartment(department.id)}
                    />
                  </div>
                </div>

                {/* Provinces */}
                {department.isExpanded && (
                  <div className="p-4 space-y-3">
                    {department.provinces.map((province) => (
                      <div key={province.id} className="border border-gray-100 rounded-lg overflow-hidden">
                        {/* Province Header */}
                        <div className="p-3 bg-gray-25 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleToggleProvinceExpansion(department.id, province.id)}
                              className="text-text/60 hover:text-text transition-colors"
                            >
                              {province.isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>

                            <div className="w-6 h-6 bg-green-500 rounded-md flex items-center justify-center text-white">
                              <MapPin className="w-3 h-3" />
                            </div>

                            <div>
                              <h4 className="font-medium text-text">{province.name}</h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-text/40">
                                  {province.districts.length} distritos
                                </span>
                                <span className="text-xs text-text/40">•</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  province.isActive 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}>
                                  {province.isActive ? 'Activa' : 'Inactiva'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <LocationToggle
                            isActive={province.isActive}
                            onToggle={() => handleToggleProvince(department.id, province.id)}
                            size="sm"
                          />
                        </div>

                        {/* Districts */}
                        {province.isExpanded && (
                          <div className="p-3 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {province.districts.map((district) => (
                                <div key={district.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-100">
                                  <div className="flex items-center space-x-2">
                                    <div className={`w-3 h-3 rounded-full ${
                                      district.isActive ? 'bg-green-500' : 'bg-red-500'
                                    }`} />
                                    <span className="text-sm text-text">{district.name}</span>
                                  </div>

                                  <LocationToggle
                                    isActive={district.isActive}
                                    onToggle={() => handleToggleDistrict(department.id, province.id, district.id)}
                                    size="sm"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {department.provinces.length === 0 && (
                      <div className="text-center py-4 text-text/60">
                        <p className="text-sm">No hay provincias en este departamento</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {filteredLocations.length === 0 && (
              <div className="text-center py-12 text-text/60">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-text/40" />
                <p className="text-lg font-medium mb-2">No se encontraron ubicaciones</p>
                <p>Intenta ajustar los filtros de búsqueda</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationManagement;