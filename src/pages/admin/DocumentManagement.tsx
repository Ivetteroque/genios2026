import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Download, 
  Search, 
  Filter, 
  User,
  Calendar,
  AlertTriangle,
  X,
  Save
} from 'lucide-react';
import { 
  getGenios, 
  getGeniosWithPendingDocuments,
  updateGeniusDocumentStatus,
  Genius,
  Document 
} from '../../utils/geniusUtils';
import { getCurrentAdmin } from '../../utils/adminAuthUtils';
import StatusBadge from '../../components/StatusBadge';

const DocumentManagement: React.FC = () => {
  const [currentAdmin, setCurrentAdmin] = useState(getCurrentAdmin());
  const [genios, setGenios] = useState<Genius[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [documentTypeFilter, setDocumentTypeFilter] = useState<'all' | 'dni' | 'certificate' | 'other'>('all');
  const [selectedDocument, setSelectedDocument] = useState<{genius: Genius, document: Document} | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Load genios on component mount
  useEffect(() => {
    loadGenios();
  }, []);

  // Listen for genius changes
  useEffect(() => {
    const handleGeniosChange = () => {
      loadGenios();
    };

    window.addEventListener('geniosChanged', handleGeniosChange);
    return () => window.removeEventListener('geniosChanged', handleGeniosChange);
  }, []);

  const loadGenios = () => {
    const allGenios = getGenios();
    // Only show genios that have uploaded documents
    const geniosWithDocuments = allGenios.filter(genius => genius.documents.length > 0);
    setGenios(geniosWithDocuments);
  };

  // Get all documents from all genios for filtering
  const getAllDocuments = () => {
    const allDocuments: Array<{genius: Genius, document: Document}> = [];
    
    genios.forEach(genius => {
      genius.documents.forEach(document => {
        allDocuments.push({ genius, document });
      });
    });

    return allDocuments;
  };

  // Filter documents
  const filteredDocuments = getAllDocuments().filter(item => {
    const matchesSearch = item.genius.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.document.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.document.status === statusFilter;
    const matchesType = documentTypeFilter === 'all' || item.document.type === documentTypeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleApproveDocument = async (geniusId: string, documentId: string) => {
    if (!currentAdmin) return;

    const confirmApprove = window.confirm('¿Estás seguro de que quieres aprobar este documento?');
    if (!confirmApprove) return;

    setIsProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateGeniusDocumentStatus(geniusId, documentId, 'verified', undefined, currentAdmin.email);
      
      loadGenios();
      setShowDocumentModal(false);
      setSelectedDocument(null);
      
      alert('✅ Documento aprobado exitosamente\n\nSi era el último documento pendiente, el genio ahora aparecerá como VERIFICADO.');
    } catch (error) {
      console.error('Error approving document:', error);
      alert('❌ Error al aprobar el documento');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectDocument = async (geniusId: string, documentId: string) => {
    if (!currentAdmin || !rejectionReason.trim()) {
      alert('Por favor, proporciona una razón para el rechazo');
      return;
    }

    setIsProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateGeniusDocumentStatus(geniusId, documentId, 'rejected', rejectionReason, currentAdmin.email);
      
      loadGenios();
      setShowDocumentModal(false);
      setSelectedDocument(null);
      setRejectionReason('');
      
      alert('❌ Documento rechazado\n\nEl genio será notificado sobre el rechazo y podrá subir un nuevo documento.');
    } catch (error) {
      console.error('Error rejecting document:', error);
      alert('❌ Error al rechazar el documento');
    } finally {
      setIsProcessing(false);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'dni':
        return 'DNI';
      case 'certificate':
        return 'Certificado Único de Trabajo';
      case 'other':
        return 'Otro Documento';
      default:
        return type;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-500" />;
      default:
        return null;
    }
  };

  const pendingCount = filteredDocuments.filter(item => item.document.status === 'pending').length;
  const verifiedCount = filteredDocuments.filter(item => item.document.status === 'verified').length;
  const rejectedCount = filteredDocuments.filter(item => item.document.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text">Gestión de Documentos</h1>
          <p className="text-text/60 mt-1">Revisa y aprueba documentos de verificación de genios</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text/60 text-sm font-medium">Pendientes</p>
              <p className="text-2xl font-bold text-text">{pendingCount}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text/60 text-sm font-medium">Verificados</p>
              <p className="text-2xl font-bold text-text">{verifiedCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text/60 text-sm font-medium">Rechazados</p>
              <p className="text-2xl font-bold text-text">{rejectedCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text/60 text-sm font-medium">Total Documentos</p>
              <p className="text-2xl font-bold text-text">{filteredDocuments.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar genio o documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text/40 w-4 h-4" />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="verified">Verificados</option>
              <option value="rejected">Rechazados</option>
            </select>

            <select
              value={documentTypeFilter}
              onChange={(e) => setDocumentTypeFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
            >
              <option value="all">Todos los tipos</option>
              <option value="dni">DNI</option>
              <option value="certificate">Certificado</option>
              <option value="other">Otros</option>
            </select>
          </div>

          <div className="text-text/60 text-sm">
            {filteredDocuments.length} documentos encontrados
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-text/80">Genio</th>
                  <th className="text-left py-3 px-4 font-medium text-text/80">Documento</th>
                  <th className="text-left py-3 px-4 font-medium text-text/80">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium text-text/80">Estado</th>
                  <th className="text-left py-3 px-4 font-medium text-text/80">Subido</th>
                  <th className="text-left py-3 px-4 font-medium text-text/80">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((item, index) => (
                  <tr key={`${item.genius.id}-${item.document.id}`} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={item.genius.profilePhoto || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2'}
                          alt={item.genius.fullName}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                        />
                        <div>
                          <p className="font-medium text-text">{item.genius.fullName}</p>
                          <p className="text-text/60 text-sm">{item.genius.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-text/80 text-sm">{item.document.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-text/80">{getDocumentTypeLabel(item.document.type)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(item.document.status)}
                        <StatusBadge status={item.document.status} />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-text/60 text-sm">
                        {new Date(item.document.uploadedAt).toLocaleDateString('es-ES')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedDocument(item);
                            setShowDocumentModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Ver documento"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {item.document.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveDocument(item.genius.id, item.document.id)}
                              disabled={isProcessing}
                              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                              title="Aprobar documento"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => {
                                setSelectedDocument(item);
                                setShowDocumentModal(true);
                              }}
                              disabled={isProcessing}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                              title="Rechazar documento"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredDocuments.length === 0 && (
              <div className="text-center py-12 text-text/60">
                <FileText className="w-12 h-12 mx-auto mb-4 text-text/40" />
                <p className="text-lg font-medium mb-2">No se encontraron documentos</p>
                <p>Los documentos subidos por los genios aparecerán aquí</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document Details Modal */}
      {showDocumentModal && selectedDocument && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b flex justify-between items-center">
              <h3 className="font-heading text-xl font-bold text-text">
                Revisar Documento: {getDocumentTypeLabel(selectedDocument.document.type)}
              </h3>
              <button
                onClick={() => {
                  setShowDocumentModal(false);
                  setSelectedDocument(null);
                  setRejectionReason('');
                }}
                className="text-text/60 hover:text-text transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Genius Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={selectedDocument.genius.profilePhoto || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=2'}
                    alt={selectedDocument.genius.fullName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  />
                  <div>
                    <h4 className="font-heading text-lg font-bold text-text">{selectedDocument.genius.fullName}</h4>
                    <p className="text-text/60">{selectedDocument.genius.category}</p>
                    <p className="text-text/60 text-sm">ID: {selectedDocument.genius.id}</p>
                  </div>
                </div>
              </div>

              {/* Document Image */}
              <div>
                <label className="block text-sm font-medium text-text/80 mb-2">Documento:</label>
                <img
                  src={selectedDocument.document.url}
                  alt={selectedDocument.document.name}
                  className="w-full max-h-96 object-contain rounded-lg border border-gray-200"
                />
              </div>

              {/* Document Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text/80 mb-1">Nombre del archivo:</label>
                  <p className="text-text">{selectedDocument.document.name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text/80 mb-1">Tipo:</label>
                  <p className="text-text">{getDocumentTypeLabel(selectedDocument.document.type)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text/80 mb-1">Estado actual:</label>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedDocument.document.status)}
                    <StatusBadge status={selectedDocument.document.status} />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text/80 mb-1">Subido:</label>
                  <p className="text-text">{new Date(selectedDocument.document.uploadedAt).toLocaleString('es-ES')}</p>
                </div>

                {selectedDocument.document.reviewedAt && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-text/80 mb-1">Revisado por:</label>
                      <p className="text-text">{selectedDocument.document.reviewedBy}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-text/80 mb-1">Fecha de revisión:</label>
                      <p className="text-text">{new Date(selectedDocument.document.reviewedAt).toLocaleString('es-ES')}</p>
                    </div>
                  </>
                )}

                {selectedDocument.document.rejectionReason && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text/80 mb-1">Razón del rechazo:</label>
                    <p className="text-red-600 bg-red-50 p-3 rounded-lg">{selectedDocument.document.rejectionReason}</p>
                  </div>
                )}
              </div>

              {/* Rejection Reason Input (for pending documents) */}
              {selectedDocument.document.status === 'pending' && (
                <div>
                  <label className="block text-sm font-medium text-text/80 mb-2">
                    Razón de Rechazo (opcional):
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 resize-none"
                    placeholder="Explica por qué se rechaza este documento..."
                  />
                </div>
              )}

              {/* Action Buttons */}
              {selectedDocument.document.status === 'pending' && (
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleApproveDocument(selectedDocument.genius.id, selectedDocument.document.id)}
                    disabled={isProcessing}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? 'Procesando...' : 'Aprobar Documento'}
                  </button>
                  
                  <button
                    onClick={() => handleRejectDocument(selectedDocument.genius.id, selectedDocument.document.id)}
                    disabled={isProcessing}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? 'Procesando...' : 'Rechazar Documento'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManagement;