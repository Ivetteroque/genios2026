import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Loader2 } from 'lucide-react';
import ImageUploadField from './ImageUploadField';
import FlexibleLocationSelector from './FlexibleLocationSelector';
import { User as UserType } from '../utils/authUtils';
import { SelectedLocation } from '../utils/geniusUtils';
import { isValidEmail, isValidPhone, isValidDNI } from '../utils/commonUtils';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType;
  onSave: (updatedData: Partial<UserType>) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: currentUser.name || '',
    dni: currentUser.dni || '',
    email: currentUser.email || '',
    phone: currentUser.phone || '',
    profileImage: currentUser.profileImage || '',
    location: currentUser.location || null
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({ name: '', dni: '', email: '', phone: '', location: '' });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: currentUser.name || '',
        dni: currentUser.dni || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        profileImage: currentUser.profileImage || '',
        location: currentUser.location || null
      });
      setErrors({ name: '', dni: '', email: '', phone: '', location: '' });
    }
  }, [isOpen, currentUser]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLocationChange = (locations: SelectedLocation[]) => {
    const location = locations[0];
    if (location && location.type === 'district') {
      handleInputChange('location', {
        departmentId: location.departmentId,
        departmentName: location.departmentName,
        provinceId: location.provinceId!,
        provinceName: location.provinceName!,
        districtId: location.districtId!,
        districtName: location.districtName!,
        fullName: location.fullName
      });
    } else {
      handleInputChange('location', null);
    }
  };

  const validateForm = () => {
    const newErrors = { name: '', dni: '', email: '', phone: '', location: '' };
    let isValid = true;

    if (!formData.name.trim()) { newErrors.name = 'El nombre es requerido'; isValid = false; }
    else if (formData.name.trim().length < 2) { newErrors.name = 'Mínimo 2 caracteres'; isValid = false; }

    if (!formData.dni.trim()) { newErrors.dni = 'El DNI es requerido'; isValid = false; }
    else if (!isValidDNI(formData.dni)) { newErrors.dni = 'Debe tener 8 dígitos'; isValid = false; }

    if (!formData.email.trim()) { newErrors.email = 'El correo es requerido'; isValid = false; }
    else if (!isValidEmail(formData.email)) { newErrors.email = 'Correo no válido'; isValid = false; }

    if (!formData.phone.trim()) { newErrors.phone = 'El teléfono es requerido'; isValid = false; }
    else if (!isValidPhone(formData.phone)) { newErrors.phone = 'Debe tener 9 dígitos'; isValid = false; }

    if (!formData.location) { newErrors.location = 'La ubicación es requerida'; isValid = false; }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSave({
        name: formData.name.trim(),
        dni: formData.dni.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        profileImage: formData.profileImage,
        location: formData.location
      });
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: currentUser.name || '',
      dni: currentUser.dni || '',
      email: currentUser.email || '',
      phone: currentUser.phone || '',
      profileImage: currentUser.profileImage || '',
      location: currentUser.location || null
    });
    setErrors({ name: '', dni: '', email: '', phone: '', location: '' });
    onClose();
  };

  const getSelectedLocations = (): SelectedLocation[] => {
    if (!formData.location) return [];
    return [{
      departmentId: formData.location.departmentId,
      departmentName: formData.location.departmentName,
      provinceId: formData.location.provinceId,
      provinceName: formData.location.provinceName,
      districtId: formData.location.districtId,
      districtName: formData.location.districtName,
      fullName: formData.location.fullName,
      type: 'district'
    }];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">

        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-heading text-base font-semibold text-text">Editar datos</h3>
          <button onClick={handleCancel} className="text-text/35 hover:text-text/70 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">

          {/* Photo */}
          <div>
            <p className="text-xs font-medium text-text/45 uppercase tracking-wide mb-3">Foto de perfil</p>
            <ImageUploadField
              label=""
              currentImage={formData.profileImage}
              onImageChange={(imageUrl) => handleInputChange('profileImage', imageUrl)}
              onImageRemove={() => handleInputChange('profileImage', '')}
              helpText="Una foto clara ayuda a los genios a reconocerte"
            />
          </div>

          {/* Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nombre completo" required error={errors.name}>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Tu nombre completo"
                className={inputClass(!!errors.name)}
              />
            </Field>

            <Field label="DNI" required error={errors.dni}>
              <input
                type="text"
                value={formData.dni}
                onChange={(e) => handleInputChange('dni', e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="12345678"
                maxLength={8}
                className={inputClass(!!errors.dni)}
              />
            </Field>

            <Field label="Correo electrónico" required error={errors.email}>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="tu@email.com"
                className={inputClass(!!errors.email)}
              />
            </Field>

            <Field label="Teléfono" required error={errors.phone}>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-text/40 text-sm">
                  +51
                </span>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 9))}
                  placeholder="987654321"
                  maxLength={9}
                  className={`${inputClass(!!errors.phone)} rounded-l-none`}
                />
              </div>
            </Field>
          </div>

          {/* Location */}
          <Field label="Mi ubicación" required error={errors.location} hint="Tu ubicación nos ayuda a mostrarte genios cercanos a ti">
            <FlexibleLocationSelector
              selectedLocations={getSelectedLocations()}
              onLocationsChange={handleLocationChange}
              placeholder="Selecciona tu distrito de residencia..."
              maxSelections={1}
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-5 py-2.5 text-sm text-text/50 hover:text-text/75 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-text text-white text-sm font-medium rounded-lg hover:bg-text/85 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

const inputClass = (hasError: boolean) =>
  `w-full px-3 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-1 transition-colors ${
    hasError
      ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
      : 'border-gray-200 focus:ring-text/15 focus:border-text/30'
  } text-text placeholder:text-text/25`;

const Field: React.FC<{
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, required, error, hint, children }) => (
  <div>
    {label && (
      <label className="block text-xs font-medium text-text/50 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
    )}
    {children}
    {error && (
      <div className="flex items-center gap-1 mt-1.5 text-red-500">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="text-xs">{error}</span>
      </div>
    )}
    {hint && !error && (
      <p className="text-xs text-text/35 mt-1.5">{hint}</p>
    )}
  </div>
);

export default EditProfileModal;
