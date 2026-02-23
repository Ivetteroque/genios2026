import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, MessageCircle, Eye, FileText, UserCheck, Star, Activity, StickyNote, Download } from 'lucide-react';
import { 
  getGenios, 
  updateGeniusStatus, 
  markGeniusAsNew, 
  markGeniusAsFeatured, 
  updateGeniusInternalNotes,
  exportGeniosData,
  type Genius 
} from '../../utils/geniusUtils';
import { getSubscriptionByGenius } from '../../utils/paymentUtils';
import { handleWhatsAppContact } from '../../utils/whatsappUtils';
import { formatDateToSpanish } from '../../utils/commonUtils';
import StatusBadge from '../../components/StatusBadge';
import GeniusProfilePreviewModal from '../../components/GeniusProfilePreviewModal';

const GeniusManagement: React.FC = () => {
  const [genios, setGenios] = useState<Genius[]>([]);
  const [filteredGenios, setFilteredGenios] = useState<Genius[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [selectedGenius, setSelectedGenius] = useState<Genius | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [notesText, setNotesText] = useState('');

  useEffect(() => {
    loadGenios();
  }, []);

  useEffect(() => {
    filterGenios();
  }, [genios, searchTerm, statusFilter, tagFilter]);

  const loadGenios = () => {
    const geniusData = getGenios();
    setGenios(geniusData);
  };

  const filterGenios = () => {
    let filtered = genios;

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(genius =>
        genius.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        genius.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        genius.location.district.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(genius => genius.status === statusFilter);
    }

    // Filtro de etiquetas
    if (tagFilter !== 'all') {
      filtered = filtered.filter(genius => {
        switch (tagFilter) {
          case 'new':
            return genius.isNew;
          case 'verified':
            return genius.isVerified;
          case 'featured':
            return genius.isFeatured;
          default:
            return true;
        }
      });
    }

    setFilteredGenios(filtered);
  };

  const handleStatusChange = async (geniusId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    try {
      await updateGeniusStatus(geniusId, newStatus);
      loadGenios();
      setActiveDropdown(null);
    } catch (error) {
      console.error('Error updating genius status:', error);
    }
  };

  const handleToggleNew = async (geniusId: string, isNew: boolean) => {
    try {
      await markGeniusAsNew(geniusId, !isNew);
      loadGenios();
      setActiveDropdown(null);
    } catch (error) {
      console.error('Error toggling new status:', error);
    }
  };

  const handleToggleFeatured = async (geniusId: string, isFeatured: boolean) => {
    try {
      await markGeniusAsFeatured(geniusId, !isFeatured);
      loadGenios();
      setActiveDropdown(null);
    } catch (error) {
      console.error('Error toggling featured status:', error);
    }
  };

  const handleNotesSubmit = async () => {
    if (!selectedGenius) return;
    
    try {
      await updateGeniusInternalNotes(selectedGenius.id, notesText);
      loadGenios();
      setShowNotesModal(false);
      setSelectedGenius(null);
      setNotesText('');
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  const getSubscriptionInfo = (geniusId: string) => {
    const subscription = getSubscriptionByGenius(geniusId);
    if (!subscription) return 'Sin suscripción';
    
    if (subscription.type === 'trial') {
      return 'En prueba';
    }
    
    return `Vence el ${formatDateToSpanish(subscription.endDate)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'suspended': return 'Suspendido';
      default: return status;
    }
  };

  const handleExportData = () => {
    try {
      exportGeniosData('csv');
      alert('✅ Datos exportados exitosamente\n\nEl archivo CSV se ha descargado y está listo para usar en tus campañas de mailing.');
    } catch (error) {
      console.error('Error exporting genius data:', error);
      alert('❌ Error al exportar los datos. Por favor, intenta nuevamente.');
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportData}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-text rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Genio</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar genios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro de Estado */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="suspended">Suspendido</option>
          </select>

          {/* Filtro de Etiquetas */}
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas las etiquetas</option>
            <option value="new">Nuevo</option>
            <option value="verified">Verificado</option>
            <option value="featured">Destacado</option>
          </select>

          {/* Estadísticas */}
          <div className="text-sm text-gray-600">
            Total: {filteredGenios.length} genios
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Nombre</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Categoría</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Suscripción</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">WhatsApp</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredGenios.map((genius) => (
                <tr key={genius.id} className="hover:bg-gray-50">
                  {/* Nombre + Foto + Etiquetas */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={genius.profileImage || `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop`}
                        alt={genius.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{genius.name}</div>
                        <div className="flex gap-1 mt-1">
                          {genius.isNew && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              NUEVO
                            </span>
                          )}
                          {genius.isVerified && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              VERIFICADO
                            </span>
                          )}
                          {genius.isFeatured && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              DESTACADO
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Categoría */}
                  <td className="py-4 px-4 text-gray-900">{genius.category}</td>

                  {/* Estado */}
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(genius.status)}`}>
                      {getStatusText(genius.status)}
                    </span>
                  </td>

                  {/* Suscripción */}
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {getSubscriptionInfo(genius.id)}
                  </td>

                  {/* WhatsApp */}
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleWhatsAppContact(genius.phone, genius.name)}
                      className="text-green-600 hover:text-green-700 p-1 rounded"
                      title="Contactar por WhatsApp"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  </td>

                  {/* Acciones */}
                  <td className="py-4 px-4">
                    <div className="relative">
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === genius.id ? null : genius.id)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {activeDropdown === genius.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setSelectedGenius(genius);
                                setShowProfileModal(true);
                                setActiveDropdown(null);
                              }}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              <Eye className="w-4 h-4" />
                              Ver perfil completo
                            </button>
                            
                            <button
                              onClick={() => {
                                // Navegar a documentos del genio
                                setActiveDropdown(null);
                              }}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              <FileText className="w-4 h-4" />
                              Documentos
                            </button>

                            <div className="border-t border-gray-100 my-1"></div>

                            {/* Cambiar Estado */}
                            <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Cambiar Estado
                            </div>
                            <button
                              onClick={() => handleStatusChange(genius.id, 'active')}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              Activo
                            </button>
                            <button
                              onClick={() => handleStatusChange(genius.id, 'inactive')}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              Inactivo
                            </button>
                            <button
                              onClick={() => handleStatusChange(genius.id, 'suspended')}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              Suspendido
                            </button>

                            <div className="border-t border-gray-100 my-1"></div>

                            {/* Marcar como */}
                            <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Marcar como
                            </div>
                            <button
                              onClick={() => handleToggleNew(genius.id, genius.isNew)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              <UserCheck className="w-4 h-4" />
                              {genius.isNew ? 'Quitar "Nuevo"' : 'Marcar "Nuevo"'}
                            </button>
                            <button
                              onClick={() => handleToggleFeatured(genius.id, genius.isFeatured)}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              <Star className="w-4 h-4" />
                              {genius.isFeatured ? 'Quitar "Destacado"' : 'Marcar "Destacado"'}
                            </button>

                            <div className="border-t border-gray-100 my-1"></div>

                            <button
                              onClick={() => {
                                setSelectedGenius(genius);
                                setShowActivityModal(true);
                                setActiveDropdown(null);
                              }}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              <Activity className="w-4 h-4" />
                              Ver actividad
                            </button>
                            
                            <button
                              onClick={() => {
                                setSelectedGenius(genius);
                                setNotesText(genius.internalNotes || '');
                                setShowNotesModal(true);
                                setActiveDropdown(null);
                              }}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                            >
                              <StickyNote className="w-4 h-4" />
                              Añadir nota interna
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredGenios.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron genios con los filtros aplicados.</p>
          </div>
        )}
      </div>

      {/* Modal de Perfil */}
      {showProfileModal && selectedGenius && (
        <GeniusProfilePreviewModal
          genius={selectedGenius}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedGenius(null);
          }}
        />
      )}

      {/* Modal de Notas */}
      {showNotesModal && selectedGenius && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Notas Internas - {selectedGenius.name}</h3>
            <textarea
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Añadir notas internas sobre este genio..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  setSelectedGenius(null);
                  setNotesText('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleNotesSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Actividad */}
      {showActivityModal && selectedGenius && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Actividad - {selectedGenius.name}</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Visitas al perfil:</span>
                <span className="font-semibold">{selectedGenius.stats?.profileViews || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Clicks en WhatsApp:</span>
                <span className="font-semibold">{selectedGenius.stats?.whatsappClicks || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Veces marcado como favorito:</span>
                <span className="font-semibold">{selectedGenius.stats?.favoritesCount || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Fecha de registro:</span>
                <span className="font-semibold">{formatDateToSpanish(selectedGenius.registeredAt)}</span>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowActivityModal(false);
                  setSelectedGenius(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {activeDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActiveDropdown(null)}
        />
      )}
    </>
  );
};

export default GeniusManagement;