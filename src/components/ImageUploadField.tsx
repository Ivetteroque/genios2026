import React, { useState } from 'react';
import { Camera, Upload, AlertCircle } from 'lucide-react';
import { uploadImage, PROFILE_PHOTOS_BUCKET } from '../services/supabaseStorageService';

interface ImageUploadFieldProps {
  label: string;
  currentImage?: string;
  /** Recibe la URL pública de la imagen ya subida a Storage. */
  onImageChange: (imageUrl: string) => void;
  onImageRemove: () => void;
  className?: string;
  required?: boolean;
  helpText?: string;
  /** Bucket de destino. Por defecto, fotos de perfil. */
  bucket?: string;
  /** Carpeta dentro del bucket; normalmente el id del genio o del usuario. */
  pathPrefix?: string;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  currentImage,
  onImageChange,
  onImageRemove,
  className = '',
  required = false,
  helpText,
  bucket = PROFILE_PHOTOS_BUCKET,
  pathPrefix = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    try {
      const publicUrl = await uploadImage(bucket, file, pathPrefix);
      onImageChange(publicUrl);
    } catch {
      setError('No se pudo subir la imagen. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
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
            </div>
          ) : (
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center bg-primary/5">
              <Camera className="w-8 h-8 text-primary/60" />
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1">
          <label className="cursor-pointer inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-gray-200 bg-white hover:bg-surface-blue text-text font-medium transition-colors">
            <Upload className="w-4 h-4 text-ink-blue" />
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

          {currentImage && !isLoading && (
            <button type="button" onClick={handleRemove} className="block mt-2 text-sm text-text/55 hover:text-red-600 underline underline-offset-2">
              Quitar foto
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUploadField;