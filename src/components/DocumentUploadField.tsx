import React, { useState } from 'react';
import { FileText, Upload, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface DocumentUploadFieldProps {
  label: string;
  documentType: 'dni' | 'certificate' | 'other';
  currentDocument?: {
    id: string;
    name: string;
    type: string;
    url: string;
    uploadedAt: string;
    verified: boolean;
  };
  onDocumentChange: (document: {
    name: string;
    type: string;
    url: string;
    uploadedAt: string;
    verified: boolean;
  }) => void;
  onDocumentRemove: () => void;
  className?: string;
  required?: boolean;
  helpText?: string;
}

const DocumentUploadField: React.FC<DocumentUploadFieldProps> = ({
  label,
  documentType,
  currentDocument,
  onDocumentChange,
  onDocumentRemove,
  className = '',
  required = false,
  helpText
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'dni':
        return 'DNI';
      case 'certificate':
        return 'Certificado Único de Trabajo';
      default:
        return 'Documento';
    }
  };

  const getAcceptedFormats = (type: string) => {
    switch (type) {
      case 'dni':
      case 'certificate':
        return 'image/*,.pdf';
      default:
        return 'image/*,.pdf';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    
    if (!isImage && !isPdf) {
      setError('Solo se permiten imágenes (JPG, PNG) o archivos PDF');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo debe ser menor a 10MB');
      return;
    }

    setIsLoading(true);
    setError('');

    const reader = new FileReader();
    reader.onloadend = () => {
      setIsLoading(false);
      
      const document = {
        name: file.name,
        type: documentType,
        url: reader.result as string,
        uploadedAt: new Date().toISOString(),
        verified: false // Will be verified by admin
      };
      
      onDocumentChange(document);
    };
    reader.onerror = () => {
      setIsLoading(false);
      setError('Error al cargar el archivo');
    };
    reader.readAsDataURL(file);
  };

  const getStatusIcon = () => {
    if (!currentDocument) return null;
    
    if (currentDocument.verified) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else {
      return <Clock className="w-4 h-4 text-orange-500" />;
    }
  };

  const getStatusText = () => {
    if (!currentDocument) return '';
    
    if (currentDocument.verified) {
      return 'Verificado';
    } else {
      return 'Pendiente de verificación';
    }
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

      {currentDocument ? (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-text">{currentDocument.name}</p>
                <div className="flex items-center space-x-2 mt-1">
                  {getStatusIcon()}
                  <span className={`text-xs ${
                    currentDocument.verified ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {getStatusText()}
                  </span>
                </div>
                <p className="text-xs text-text/60">
                  Subido: {new Date(currentDocument.uploadedAt).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="cursor-pointer text-primary hover:text-primary-dark transition-colors">
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  className="hidden"
                  accept={getAcceptedFormats(documentType)}
                  onChange={handleFileSelect}
                />
              </label>
              <button
                type="button"
                onClick={onDocumentRemove}
                className="text-red-500 hover:text-red-600 transition-colors"
                title="Eliminar documento"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <label className="w-full flex items-center justify-center px-6 py-8 rounded-xl border-2 border-dashed border-primary/30 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
          <div className="text-center">
            <Upload className="mx-auto h-8 w-8 text-primary/60 mb-2" />
            <span className="text-text/60 font-medium">
              Subir {getDocumentTypeLabel(documentType)}
            </span>
            <p className="text-xs text-text/40 mt-1">
              JPG, PNG o PDF hasta 10MB
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            accept={getAcceptedFormats(documentType)}
            onChange={handleFileSelect}
          />
        </label>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center mt-2 text-primary">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
          <span className="text-sm">Subiendo documento...</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center mt-2 text-red-500">
          <AlertCircle className="w-4 h-4 mr-1" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
};

export default DocumentUploadField;