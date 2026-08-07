import React, { useState } from 'react';
import { Camera, X, Upload, AlertCircle, CheckCircle } from 'lucide-react';

interface ImageUploadFieldProps {
  label: string;
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  onImageRemove: () => void;
  className?: string;
  required?: boolean;
  helpText?: string;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  currentImage,
  onImageChange,
  onImageRemove,
  className = '',
  required = false,
  helpText
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe ser menor a 5MB');
      return;
    }

    setIsLoading(true);
    setError('');

    const reader = new FileReader();
    reader.onloadend = () => {
      setIsLoading(false);
      onImageChange(reader.result as string);
    };
    reader.onerror = () => {
      setIsLoading(false);
      setError('Error al cargar la imagen');
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setError('');
    onImageRemove();
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-text/80 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {helpText && (
        <p className="text-xs text-text/60 mb-3">{helpText}</p>
      )}

      <div className="flex items-center space-x-4">
        {/* Image Preview */}
        <div className="relative">
          {currentImage ? (
            <div className="relative">
              <img
                src={currentImage}
                alt="Vista previa"
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-primary/20 shadow-md"
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-md"
                title="Eliminar imagen"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center bg-primary/5">
              <Camera className="w-8 h-8 text-primary/60" />
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1">
          <label className="cursor-pointer inline-flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors shadow-md">
            <Upload className="w-4 h-4" />
            <span>{currentImage ? 'Cambiar foto' : 'Seleccionar foto'}</span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileSelect}
            />
          </label>

          {isLoading && (
            <div className="flex items-center mt-2 text-primary">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
              <span className="text-sm">Cargando imagen...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center mt-2 text-red-500">
              <AlertCircle className="w-4 h-4 mr-1" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {currentImage && !isLoading && !error && (
            <div className="flex items-center mt-2 text-green-500">
              <CheckCircle className="w-4 h-4 mr-1" />
              <span className="text-sm">Imagen cargada correctamente</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUploadField;