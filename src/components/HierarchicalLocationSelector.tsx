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

    // Si el departamento tiene una sola provincia, se elige sola; el distrito
    // siempre lo elige la persona (antes se llenaba el primero en silencio y
    // muchos genios quedaban ubicados en un distrito que no era el suyo).
    const dept = departments.find(d => d.id === deptId);
    if (dept) {
      const onlyProvince = dept.provinces.length === 1 ? dept.provinces[0] : null;
      onChange({
        departmentId: dept.id,
        departmentName: dept.name,
        provinceId: onlyProvince?.id ?? '',
        provinceName: onlyProvince?.name ?? '',
        districtId: '',
        districtName: ''
      });
    }
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provId = e.target.value;
    if (!selectedDepartment || !provId) return;

    const prov = selectedDepartment.provinces.find(p => p.id === provId);
    if (prov) {
      onChange({
        departmentId: selectedDepartment.id,
        departmentName: selectedDepartment.name,
        provinceId: prov.id,
        provinceName: prov.name,
        districtId: '',
        districtName: ''
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
        <MapPin className="w-5 h-5 text-ink-blue" />
        <label className="block text-sm font-medium text-text/80">
          ¿En qué distrito vives? <span className="text-red-500">*</span>
        </label>
      </div>

      <p className="text-sm text-text/55">
        Ayuda a que los clientes cercanos te encuentren. No mostramos tu dirección.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-text/80 mb-2">
            Departamento
          </label>
          <select
            value={value?.departmentId || ''}
            onChange={handleDepartmentChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-transparent"
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
          <label className="block text-sm font-medium text-text/80 mb-2">
            Provincia
          </label>
          <select
            value={value?.provinceId || ''}
            onChange={handleProvinceChange}
            disabled={!selectedDepartment}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
          <label className="block text-sm font-medium text-text/80 mb-2">
            Distrito <span className="text-red-500">*</span>
          </label>
          <select
            value={value?.districtId || ''}
            onChange={handleDistrictChange}
            disabled={!selectedProvince}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
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
        <div className="p-3 bg-primary/25 border border-primary rounded-lg">
          <p className="text-sm text-ink-blue">
            <span className="font-medium">Ubicación seleccionada:</span> {value.districtName}, {value.provinceName}, {value.departmentName}
          </p>
        </div>
      )}
    </div>
  );
}
