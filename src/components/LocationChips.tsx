import React, { useState } from 'react';
import { X, Map, Layers, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { CoverageType, HomeLocation, formatCoverageDisplay, expandCoverageToDistricts } from '../utils/locationUtils';
import { SelectedLocation } from './FlexibleLocationSelector';

interface LocationChipsProps {
  coverageType: CoverageType;
  homeLocation: HomeLocation | null;
  customDistricts: SelectedLocation[];
  onRemove?: () => void;
  onRemoveCustomDistrict?: (districtId: string) => void;
  showRemoveButton?: boolean;
}

export default function LocationChips({
  coverageType,
  homeLocation,
  customDistricts,
  onRemove,
  onRemoveCustomDistrict,
  showRemoveButton = true
}: LocationChipsProps) {
  const [showDistrictList, setShowDistrictList] = useState(false);

  if (!homeLocation) return null;

  const expandedDistricts = expandCoverageToDistricts(homeLocation, coverageType, customDistricts);
  const districtCount = expandedDistricts.length;

  if (districtCount === 0) return null;

  const getChipColor = () => {
    switch (coverageType) {
      case 'all-department':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'all-province':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'my-district':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'custom':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getIcon = () => {
    switch (coverageType) {
      case 'all-department':
        return <Map className="w-4 h-4" />;
      case 'all-province':
        return <Layers className="w-4 h-4" />;
      case 'my-district':
        return <MapPin className="w-4 h-4" />;
      case 'custom':
        return <Map className="w-4 h-4" />;
      default:
        return <Map className="w-4 h-4" />;
    }
  };

  const getLocationName = () => {
    switch (coverageType) {
      case 'all-department':
        return homeLocation.departmentName;
      case 'all-province':
        return homeLocation.provinceName;
      case 'my-district':
        return homeLocation.districtName;
      case 'custom':
        return '';
      default:
        return '';
    }
  };

  if (coverageType === 'custom') {
    return (
      <div className="flex flex-wrap gap-2">
        {customDistricts.map(district => (
          <div
            key={district.districtId}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${getChipColor()}`}
          >
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">
              {district.districtName}
            </span>
            {showRemoveButton && onRemoveCustomDistrict && (
              <button
                onClick={() => onRemoveCustomDistrict(district.districtId)}
                className="hover:bg-gray-200 rounded-full p-0.5 transition-colors"
                type="button"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        {customDistricts.length > 0 && (
          <div className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600">
            {customDistricts.length}/10 distritos
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getChipColor()}`}
      >
        {getIcon()}
        <span className="text-sm font-medium">
          {formatCoverageDisplay(coverageType, districtCount, getLocationName())}
        </span>
        {(coverageType === 'all-department' || coverageType === 'all-province') && (
          <button
            onClick={() => setShowDistrictList(!showDistrictList)}
            className="hover:bg-white hover:bg-opacity-50 rounded-full p-1 transition-colors"
            type="button"
          >
            {showDistrictList ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        )}
        {showRemoveButton && onRemove && (
          <button
            onClick={onRemove}
            className="hover:bg-white hover:bg-opacity-50 rounded-full p-1 transition-colors"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showDistrictList && (coverageType === 'all-department' || coverageType === 'all-province') && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm max-h-60 overflow-y-auto">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Distritos incluidos:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {expandedDistricts.map(district => (
              <div key={district.districtId} className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {district.districtName}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
