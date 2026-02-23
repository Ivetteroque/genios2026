import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Phone, MapPin, Camera, AlertCircle, CheckCircle } from 'lucide-react';
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
  const [errors, setErrors] = useState({
    name: '',
    dni: '',
    email: '',
    phone: '',
    location: ''
  });

  // Reset form data when modal opens or user changes
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
      setErrors({
        name: '',
        dni: '',
        email: '',
        phone: '',
        location: ''
      });
    }
  }, [isOpen, currentUser]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLocationChange = (locations: SelectedLocation[]) => {
    // For client profile, we only allow one location (their residence)
    const location = locations[0];
    
    if (location && location.type === 'district') {
      const locationData = {
        departmentId: location.departmentId,
        departmentName: location.departmentName,
        provinceId: location.provinceId!,
        provinceName: location.provinceName!,
        districtId: location.districtId!,
        districtName: location.districtName!,
        fullName: location.fullName
      };
      
      handleInputChange('location', locationData);
    } else {
      handleInputChange('location', null);
    }
  };

  const validateForm = () => {
    const newErrors = {
      name: '',
      dni: '',
      email: '',
      phone: '',
      location: ''
    };
    let isValid = true;

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
      isValid = false;
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
      isValid = false;
    }

    // DNI validation
    if (!formData.dni.trim()) {
      newErrors.dni = 'El DNI es requerido';
      isValid = false;
    } else if (!isValidDNI(formData.dni)) {
      newErrors.dni = 'El DNI debe tener 8 dígitos';
      isValid = false;
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'El correo es requerido';
      isValid = false;
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Correo electrónico no válido';
      isValid = false;
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
      isValid = false;
    } else if (!isValidPhone(formData.phone)) {
      newErrors.phone = 'El teléfono debe tener 9 dígitos';
      isValid = false;
    }

    // Location validation
    if (!formData.location) {
      newErrors.location = 'La ubicación es requerida';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Prepare updated data
      const updatedData: Partial<UserType> = {
        name: formData.name.trim(),
        dni: formData.dni.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        profileImage: formData.profileImage,
        location: formData.location
      };

      // Call parent save function
      onSave(updatedData);
      
      // Close modal
      onClose();
      
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('❌ Error al guardar los cambios. Por favor, intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    setFormData({
      name: currentUser.name || '',
      dni: currentUser.dni || '',
      email: currentUser.email || '',
      phone: currentUser.phone || '',
      profileImage: currentUser.profileImage || '',
      location: currentUser.location || null
    });
    setErrors({
      name: '',
      dni: '',
      email: '',
      phone: '',
      location: ''
    });
    onClose();
  };

  // Convert location to SelectedLocation format for the selector
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
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
          <h3 className="font-heading text-xl font-bold text-text">
            ✏️ Editar mis datos
          </h3>
          <button
            onClick={handleCancel}
            className="text-text/60 hover:text-text transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Profile Photo */}
          <ImageUploadField
            label="📸 Foto de Perfil"
            currentImage={formData.profileImage}
            onImageChange={(imageUrl) => handleInputChange('profileImage', imageUrl)}
            onImageRemove={() => handleInputChange('profileImage', '')}
            helpText="Una foto clara ayuda a los genios a reconocerte"
          />

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text/80 mb-2">
                👤 Nombre Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  errors.name 
                    ? 'border-red-300 focus:border-red-400' 
                    : 'border-primary/20 focus:border-primary/40'
                }`}
                placeholder="Tu nombre completo"
              />
              {errors.name && (
                <div className="flex items-center mt-1 text-red-500">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  <span className="text-sm">{errors.name}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text/80 mb-2">
                🆔 DNI <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.dni}
                onChange={(e) => handleInputChange('dni', e.target.value.replace(/\D/g, '').slice(0, 8))}
                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  errors.dni 
                    ? 'border-red-300 focus:border-red-400' 
                    : 'border-primary/20 focus:border-primary/40'
                }`}
                placeholder="12345678"
                maxLength={8}
              />
              {errors.dni && (
                <div className="flex items-center mt-1 text-red-500">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  <span className="text-sm">{errors.dni}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text/80 mb-2">
                📧 Correo Electrónico <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                  errors.email 
                    ? 'border-red-300 focus:border-red-400' 
                    : 'border-primary/20 focus:border-primary/40'
                }`}
                placeholder="tu@email.com"
              />
              {errors.email && (
                <div className="flex items-center mt-1 text-red-500">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  <span className="text-sm">{errors.email}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text/80 mb-2">
                📱 Número de Teléfono <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-primary/20 bg-gray-50 text-text/60">
                  +51
                </span>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 9))}
                  className={`w-full px-4 py-3 rounded-r-lg border focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                    errors.phone 
                      ? 'border-red-300 focus:border-red-400' 
                      : 'border-primary/20 focus:border-primary/40'
                  }`}
                  placeholder="987654321"
                  maxLength={9}
                />
              </div>
              {errors.phone && (
                <div className="flex items-center mt-1 text-red-500">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  <span className="text-sm">{errors.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-text/80 mb-2">
              📍 Mi Ubicación <span className="text-red-500">*</span>
            </label>
            <FlexibleLocationSelector
              selectedLocations={getSelectedLocations()}
              onLocationsChange={handleLocationChange}
              placeholder="Selecciona tu distrito de residencia..."
              maxSelections={1}
            />
            {errors.location && (
              <div className="flex items-center mt-1 text-red-500">
                <AlertCircle className="w-4 h-4 mr-1" />
                <span className="text-sm">{errors.location}</span>
              </div>
            )}
            <p className="text-xs text-text/60 mt-1">
              Tu ubicación nos ayuda a mostrarte genios cercanos a ti
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white p-6 border-t">
          <div className="flex space-x-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg ${
                isSaving
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-dark text-white transform hover:scale-[1.02]'
              }`}
              style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>💾 Guardar Cambios</span>
                </>
              )}
            </button>

            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl font-semibold text-text/60 hover:bg-gray-100 transition-colors border-2 border-gray-200 hover:border-gray-300 disabled:opacity-50"
              style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
            >
              ❌ Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;