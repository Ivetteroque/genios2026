import React, { useState } from 'react';
import { Camera, X, Upload, AlertCircle, Plus } from 'lucide-react';

interface MultiImageUploadFieldProps {
  label: string;
  currentImages: string[];
  onImagesChange: (images: string[]) => void;
  maxImages: number;
  className?: string;
  helpText?: string;
}

const MultiImageUploadField: React.FC<MultiImageUploadFieldProps> = ({
  label,
  currentImages,
  onImagesChange,
  maxImages,
  className = '',
  helpText
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check if adding these files would exceed the limit
    const remainingSlots = maxImages - currentImages.length;
    if (files.length > remainingSlots) {
      setError(`Solo puedes agregar ${remainingSlots} imagen${remainingSlots !== 1 ? 'es' : ''} más`);
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Las imágenes deben ser menores a 5MB');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setIsLoading(true);
    setError('');

    // Convert files to data URLs
    const readers = validFiles.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Error al cargar imagen'));
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers)
      .then(results => {
        setIsLoading(false);
        onImagesChange([...currentImages, ...results]);
      })
      .catch(() => {
        setIsLoading(false);
        setError('Error al cargar algunas imágenes');
      });
  };

  const handleRemoveImage = (index: number) => {
    const newImages = currentImages.filter((_, i) => i !== index);
    onImagesChange(newImages);
    setError('');
  };

  const canAddMore = currentImages.length < maxImages;

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-text/80 mb-2">
        {label}
        <span className="text-text/60 ml-2">({currentImages.length}/{maxImages})</span>
      </label>
      
      {helpText && (
        <p className="text-xs text-text/60 mb-3">{helpText}</p>
      )}

      {/* Images Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        {currentImages.map((image, index) => (
          <div key={index} className="relative group">
            <img
              src={image}
              alt={`Imagen ${index + 1}`}
              className="w-full aspect-square object-cover rounded-lg border-2 border-gray-200 shadow-sm"
            />
            <button
              type="button"
              onClick={() => handleRemoveImage(index)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-md opacity-0 group-hover:opacity-100"
              title="Eliminar imagen"
            >
              <X size={14} />
            </button>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all duration-300"></div>
          </div>
        ))}

        {/* Add More Button */}
        {canAddMore && (
          <label className="aspect-square border-2 border-dashed border-primary/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
            <div className="text-center">
              <Plus className="w-8 h-8 text-primary/60 mx-auto mb-2" />
              <span className="text-sm text-text/60 font-medium">
                Agregar imagen
              </span>
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
            />
          </label>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center text-primary mb-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
          <span className="text-sm">Cargando imágenes...</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center text-red-500 mb-2">
          <AlertCircle className="w-4 h-4 mr-1" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-text/60">
        Formatos permitidos: JPG, PNG. Tamaño máximo: 5MB por imagen.
      </p>
    </div>
  );
};

export default MultiImageUploadField;