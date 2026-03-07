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
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-blue-600" />
        <label className="block text-sm font-medium text-gray-700">
          Zona de Atención - ¿Dónde ofreces tus servicios?
        </label>
      </div>

      {!homeLocation ? (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            Primero debes seleccionar tu ubicación de residencia
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <label
            className={`p-2.5 border rounded-lg cursor-pointer transition-all flex items-center gap-2 ${
              coverageType === 'all-department'
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 bg-white'
            }`}
          >
            <input
              type="radio"
              checked={coverageType === 'all-department'}
              onChange={() => handleCoverageTypeChange('all-department')}
              className="flex-shrink-0"
            />
            <Map className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-900">Todo el departamento</span>
              <span className="text-xs text-gray-600 ml-1">
                ({getDistrictCount('all-department')} distritos)
              </span>
            </div>
          </label>

          <label
            className={`p-2.5 border rounded-lg cursor-pointer transition-all flex items-center gap-2 ${
              coverageType === 'all-province'
                ? 'border-green-600 bg-green-50'
                : 'border-gray-300 hover:border-green-400 bg-white'
            }`}
          >
            <input
              type="radio"
              checked={coverageType === 'all-province'}
              onChange={() => handleCoverageTypeChange('all-province')}
              className="flex-shrink-0"
            />
            <Layers className="w-4 h-4 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-900">Toda la provincia</span>
              <span className="text-xs text-gray-600 ml-1">
                ({getDistrictCount('all-province')} distritos)
              </span>
            </div>
          </label>

          <label
            className={`p-2.5 border rounded-lg cursor-pointer transition-all flex items-center gap-2 ${
              coverageType === 'my-district'
                ? 'border-orange-600 bg-orange-50'
                : 'border-gray-300 hover:border-orange-400 bg-white'
            }`}
          >
            <input
              type="radio"
              checked={coverageType === 'my-district'}
              onChange={() => handleCoverageTypeChange('my-district')}
              className="flex-shrink-0"
            />
            <MapPin className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-900">Solo mi distrito</span>
            </div>
          </label>

          <label
            className={`p-2.5 border rounded-lg cursor-pointer transition-all flex items-center gap-2 ${
              coverageType === 'custom'
                ? 'border-gray-600 bg-gray-50'
                : 'border-gray-300 hover:border-gray-400 bg-white'
            }`}
          >
            <input
              type="radio"
              checked={coverageType === 'custom'}
              onChange={() => handleCoverageTypeChange('custom')}
              className="flex-shrink-0"
            />
            <Map className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-900">Seleccionar manualmente</span>
              <span className="text-xs text-gray-600 ml-1">(máx. 10)</span>
            </div>
          </label>

          {coverageType === 'custom' && (
            <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <FlexibleLocationSelector
                selectedLocations={customDistricts}
                onLocationsChange={onCustomDistrictsChange}
                maxSelections={10}
              />
            </div>
          )}

          {coverageType === 'all-department' && getDistrictCount('all-department') > 20 && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                {getDistrictCount('all-department')} distritos incluidos
              </p>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
