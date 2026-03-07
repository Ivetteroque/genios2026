import React from 'react';
import { MapPin } from 'lucide-react';
import { getActiveDepartments, HomeLocation } from '../utils/locationUtils';

interface HierarchicalLocationSelectorProps {
  value: HomeLocation | null;
  onChange: (location: HomeLocation | null) => void;
  error?: string;
}

export default function HierarchicalLocationSelector({ value, onChange, error }: HierarchicalLocationSelectorProps) {
  const departments = getActiveDepartments();

  const selectedDepartment = value ? departments.find(d => d.id === value.departmentId) : null;
  const selectedProvince = selectedDepartment && value ? selectedDepartment.provinces.find(p => p.id === value.provinceId) : null;

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deptId = e.target.value;
    if (!deptId) {
      onChange(null);
      return;
    }

    const dept = departments.find(d => d.id === deptId);
    if (dept && dept.provinces.length > 0) {
      const firstProvince = dept.provinces[0];
      if (firstProvince.districts.length > 0) {
        const firstDistrict = firstProvince.districts[0];
        onChange({
          departmentId: dept.id,
          departmentName: dept.name,
          provinceId: firstProvince.id,
          provinceName: firstProvince.name,
          districtId: firstDistrict.id,
          districtName: firstDistrict.name
        });
      }
    }
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provId = e.target.value;
    if (!selectedDepartment || !provId) return;

    const prov = selectedDepartment.provinces.find(p => p.id === provId);
    if (prov && prov.districts.length > 0) {
      const firstDistrict = prov.districts[0];
      onChange({
        departmentId: selectedDepartment.id,
        departmentName: selectedDepartment.name,
        provinceId: prov.id,
        provinceName: prov.name,
        districtId: firstDistrict.id,
        districtName: firstDistrict.name
      });
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const distId = e.target.value;
    if (!selectedDepartment || !selectedProvince || !distId) return;

    const dist = selectedProvince.districts.find(d => d.id === distId);
    if (dist) {
      onChange({
        departmentId: selectedDepartment.id,
        departmentName: selectedDepartment.name,
        provinceId: selectedProvince.id,
        provinceName: selectedProvince.name,
        districtId: dist.id,
        districtName: dist.name
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-blue-600" />
        <label className="block text-sm font-medium text-gray-700">
          Ubicación del Genio - ¿Dónde vives?
        </label>
      </div>

      <p className="text-sm text-gray-500">
        Tu domicilio ayuda a los clientes cercanos a encontrarte
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Departamento
          </label>
          <select
            value={value?.departmentId || ''}
            onChange={handleDepartmentChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Seleccionar...</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Provincia
          </label>
          <select
            value={value?.provinceId || ''}
            onChange={handleProvinceChange}
            disabled={!selectedDepartment}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Seleccionar...</option>
            {selectedDepartment?.provinces.map(prov => (
              <option key={prov.id} value={prov.id}>
                {prov.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Distrito
          </label>
          <select
            value={value?.districtId || ''}
            onChange={handleDistrictChange}
            disabled={!selectedProvince}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Seleccionar...</option>
            {selectedProvince?.districts.map(dist => (
              <option key={dist.id} value={dist.id}>
                {dist.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {value && value.districtId && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <span className="font-medium">Ubicación seleccionada:</span> {value.districtName}, {value.provinceName}, {value.departmentName}
          </p>
        </div>
      )}
    </div>
  );
}
