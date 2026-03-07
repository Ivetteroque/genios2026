import React from 'react';
import { Map, MapPin, Layers } from 'lucide-react';
import { HomeLocation, CoverageType, getAllDistrictsInDepartment, getAllDistrictsInProvince } from '../utils/locationUtils';
import FlexibleLocationSelector, { SelectedLocation } from './FlexibleLocationSelector';

interface WorkZoneSelectorProps {
  homeLocation: HomeLocation | null;
  coverageType: CoverageType;
  customDistricts: SelectedLocation[];
  onCoverageTypeChange: (type: CoverageType) => void;
  onCustomDistrictsChange: (districts: SelectedLocation[]) => void;
  error?: string;
}

export default function WorkZoneSelector({
  homeLocation,
  coverageType,
  customDistricts,
  onCoverageTypeChange,
  onCustomDistrictsChange,
  error
}: WorkZoneSelectorProps) {
  const getDistrictCount = (type: CoverageType): number => {
    if (!homeLocation) return 0;

    switch (type) {
      case 'all-department':
        return getAllDistrictsInDepartment(homeLocation.departmentId).length;
      case 'all-province':
        return getAllDistrictsInProvince(homeLocation.departmentId, homeLocation.provinceId).length;
      case 'my-district':
        return 1;
      case 'custom':
        return customDistricts.length;
      default:
        return 0;
    }
  };

  const handleCoverageTypeChange = (type: CoverageType) => {
    onCoverageTypeChange(type);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Layers className="w-5 h-5 text-blue-600" />
        <label className="block text-sm font-medium text-gray-700">
          Zona de Atención - ¿Dónde ofreces tus servicios?
        </label>
      </div>

      <p className="text-sm text-gray-500">
        Esto ayuda a que los clientes cercanos encuentren tus servicios más rápido
      </p>

      {!homeLocation ? (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Primero debes seleccionar tu ubicación de residencia
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div
            onClick={() => handleCoverageTypeChange('all-department')}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              coverageType === 'all-department'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                checked={coverageType === 'all-department'}
                onChange={() => handleCoverageTypeChange('all-department')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Map className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Todo el departamento</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Atiendes en todo {homeLocation.departmentName} ({getDistrictCount('all-department')} distritos)
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => handleCoverageTypeChange('all-province')}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              coverageType === 'all-province'
                ? 'border-green-600 bg-green-50'
                : 'border-gray-300 hover:border-green-400 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                checked={coverageType === 'all-province'}
                onChange={() => handleCoverageTypeChange('all-province')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">Toda la provincia</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Atiendes en toda la provincia de {homeLocation.provinceName} ({getDistrictCount('all-province')} distritos)
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => handleCoverageTypeChange('my-district')}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              coverageType === 'my-district'
                ? 'border-orange-600 bg-orange-50'
                : 'border-gray-300 hover:border-orange-400 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                checked={coverageType === 'my-district'}
                onChange={() => handleCoverageTypeChange('my-district')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-gray-900">Solo mi distrito</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Solo atiendes en {homeLocation.districtName}
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => handleCoverageTypeChange('custom')}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              coverageType === 'custom'
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-300 hover:border-purple-400 bg-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                checked={coverageType === 'custom'}
                onChange={() => handleCoverageTypeChange('custom')}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Map className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-gray-900">Seleccionar distritos manualmente</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Elige los distritos específicos donde atiendes (máximo 10)
                </p>
              </div>
            </div>
          </div>

          {coverageType === 'custom' && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <FlexibleLocationSelector
                selectedLocations={customDistricts}
                onLocationsChange={onCustomDistrictsChange}
                maxSelections={10}
              />
            </div>
          )}

          {coverageType === 'all-department' && getDistrictCount('all-department') > 20 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Esta selección agregará {getDistrictCount('all-department')} distritos a tu zona de atención
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
