import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  MoreVertical,
  MessageCircle,
  Eye,
  FileText,
  UserCheck,
  Star,
  Activity,
  StickyNote,
  Download,
  MapPin,
  X,
  ChevronDown,
} from 'lucide-react';
import {
  getGenios,
  updateGeniusStatus,
  markGeniusAsNew,
  markGeniusAsFeatured,
  updateGeniusInternalNotes,
  exportGeniosData,
  type Genius,
} from '../../utils/geniusUtils';
import { getSubscriptionByGenius } from '../../utils/paymentUtils';
import { handleWhatsAppContact } from '../../utils/whatsappUtils';
import { formatDateToSpanish } from '../../utils/commonUtils';
import GeniusProfilePreviewModal from '../../components/GeniusProfilePreviewModal';

const DEFAULT_AVATAR = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop';

const STATUS_CONFIG: Record<string, { label: string; classes: string; dot: string }> = {
  active:    { label: 'Activo',     classes: 'bg-green-50 text-green-700',  dot: 'bg-green-400' },
  inactive:  { label: 'Inactivo',   classes: 'bg-gray-100 text-text/50',    dot: 'bg-gray-300' },
  suspended: { label: 'Suspendido', classes: 'bg-red-50 text-red-600',      dot: 'bg-red-400' },
};

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

  useEffect(() => { loadGenios(); }, []);
  useEffect(() => { filterGenios(); }, [genios, searchTerm, statusFilter, tagFilter]);

  const loadGenios = () => setGenios(getGenios());

  const filterGenios = () => {
    let filtered = genios;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (g) => g.name.toLowerCase().includes(q) || g.category.toLowerCase().includes(q) || g.location.district.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') filtered = filtered.filter((g) => g.status === statusFilter);
    if (tagFilter !== 'all') {
      filtered = filtered.filter((g) => {
        if (tagFilter === 'new') return g.isNew;
        if (tagFilter === 'verified') return g.isVerified;
        if (tagFilter === 'featured') return g.isFeatured;
        return true;
      });
    }
    setFilteredGenios(filtered);
  };

  const handleStatusChange = async (id: string, status: 'active' | 'inactive' | 'suspended') => {
    await updateGeniusStatus(id, status).catch(console.error);
    loadGenios();
    setActiveDropdown(null);
  };

  const handleToggleNew = async (id: string, isNew: boolean) => {
    await markGeniusAsNew(id, !isNew).catch(console.error);
    loadGenios();
    setActiveDropdown(null);
  };

  const handleToggleFeatured = async (id: string, isFeatured: boolean) => {
    await markGeniusAsFeatured(id, !isFeatured).catch(console.error);
    loadGenios();
    setActiveDropdown(null);
  };

  const handleNotesSubmit = async () => {
    if (!selectedGenius) return;
    await updateGeniusInternalNotes(selectedGenius.id, notesText).catch(console.error);
    loadGenios();
    setShowNotesModal(false);
    setSelectedGenius(null);
    setNotesText('');
  };

  const getSubscriptionInfo = (id: string) => {
    const sub = getSubscriptionByGenius(id);
    if (!sub) return { label: 'Sin plan', classes: 'bg-gray-100 text-text/40' };
    if (sub.type === 'trial') return { label: 'Beta', classes: 'bg-[#A0C4FF]/30 text-blue-700' };
    return { label: `Vence ${formatDateToSpanish(sub.endDate)}`, classes: 'bg-[#C0FDFB]/50 text-teal-700' };
  };

  const handleExportData = () => {
    try {
      exportGeniosData('csv');
    } catch {
      alert('Error al exportar los datos.');
    }
  };

  // Summary metrics
  const total = genios.length;
  const activos = genios.filter((g) => g.status === 'active').length;
  const beta = genios.filter((g) => {
    const sub = getSubscriptionByGenius(g.id);
    return sub?.type === 'trial';
  }).length;
  const pendientes = genios.filter((g) => g.status === 'inactive').length;
  const suspendidos = genios.filter((g) => g.status === 'suspended').length;

  const metrics = [
    { label: 'Total', value: total, bg: 'bg-white', border: 'border-gray-100' },
    { label: 'Activos', value: activos, bg: 'bg-[#C0FDFB]/30', border: 'border-[#C0FDFB]' },
    { label: 'Beta', value: beta, bg: 'bg-[#A0C4FF]/20', border: 'border-[#A0C4FF]/60' },
    { label: 'Inactivos', value: pendientes, bg: 'bg-gray-50', border: 'border-gray-200' },
    { label: 'Suspendidos', value: suspendidos, bg: 'bg-[#FFADAD]/20', border: 'border-[#FFADAD]/60' },
  ];

  return (
    <>
      <div className="space-y-5 max-w-3xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-lg font-semibold text-text">Genios</h1>
            <p className="text-sm text-text/40 mt-0.5">Gestiona los profesionales registrados en la plataforma</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleExportData}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-text/55 bg-white border border-gray-200 hover:border-gray-300 hover:text-text transition-colors"
            >
              <Download style={{ width: '14px', height: '14px' }} />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-5 gap-2.5">
          {metrics.map(({ label, value, bg, border }) => (
            <div key={label} className={`${bg} border ${border} rounded-xl px-3 py-3 text-center`}>
              <p className="font-heading text-xl font-semibold text-text">{value}</p>
              <p className="text-[11px] text-text/40 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Search + filters */}
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text/25" />
            <input
              type="text"
              placeholder="Buscar genios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-text/15 focus:border-text/25 placeholder:text-text/25 transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-text/15 text-text/60 transition-colors"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="suspended">Suspendido</option>
          </select>
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-text/15 text-text/60 transition-colors"
          >
            <option value="all">Todas las etiquetas</option>
            <option value="new">Nuevo</option>
            <option value="verified">Verificado</option>
            <option value="featured">Destacado</option>
          </select>
          <span className="text-xs text-text/30 ml-auto whitespace-nowrap">
            {filteredGenios.length} de {genios.length}
          </span>
        </div>

        {/* Cards list */}
        {filteredGenios.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
            <div className="text-3xl mb-3">👋</div>
            <p className="text-sm font-medium text-text mb-1">Aún no tienes genios registrados</p>
            <p className="text-sm text-text/40 mb-5">Comienza agregando tu primer genio a la plataforma.</p>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-white bg-text hover:bg-text/85 transition-colors">
              <Plus style={{ width: '14px', height: '14px' }} />
              Añadir Genio
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGenios.map((genius) => {
              const sub = getSubscriptionInfo(genius.id);
              const statusCfg = STATUS_CONFIG[genius.status] || STATUS_CONFIG.inactive;
              const isOpen = activeDropdown === genius.id;

              return (
                <div
                  key={genius.id}
                  className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center gap-4 hover:border-gray-200 hover:shadow-sm transition-all duration-150"
                >
                  {/* Avatar */}
                  <img
                    src={genius.profileImage || DEFAULT_AVATAR}
                    alt={genius.name}
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                  />

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-text">{genius.name}</p>
                      {genius.isNew && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#A0C4FF]/30 text-blue-700">Nuevo</span>
                      )}
                      {genius.isVerified && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#C0FDFB]/50 text-teal-700">Verificado</span>
                      )}
                      {genius.isFeatured && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600">Destacado</span>
                      )}
                    </div>
                    <p className="text-xs text-text/45 mt-0.5 truncate">{genius.category}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin style={{ width: '10px', height: '10px' }} className="text-text/25 flex-shrink-0" />
                      <p className="text-[10px] text-text/30 truncate">{genius.location?.district}</p>
                    </div>
                  </div>

                  {/* Quick metrics */}
                  <div className="hidden sm:flex items-center gap-4 text-center flex-shrink-0">
                    <div>
                      <p className="text-xs font-medium text-text">{genius.stats?.profileViews ?? 0}</p>
                      <p className="text-[10px] text-text/30">Visitas</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-text">{genius.stats?.whatsappClicks ?? 0}</p>
                      <p className="text-[10px] text-text/30">WhatsApp</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-text">{genius.stats?.favoritesCount ?? 0}</p>
                      <p className="text-[10px] text-text/30">Favoritos</p>
                    </div>
                  </div>

                  {/* Subscription */}
                  <span className={`hidden md:inline-flex text-[10px] font-medium px-2 py-1 rounded-full flex-shrink-0 ${sub.classes}`}>
                    {sub.label}
                  </span>

                  {/* Status badge */}
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full flex-shrink-0 ${statusCfg.classes}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                    {statusCfg.label}
                  </span>

                  {/* WhatsApp */}
                  <button
                    onClick={() => handleWhatsAppContact(genius.phone, genius.name)}
                    className="p-1.5 text-text/25 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors flex-shrink-0"
                    title="Contactar por WhatsApp"
                  >
                    <MessageCircle style={{ width: '15px', height: '15px' }} />
                  </button>

                  {/* View profile */}
                  <button
                    onClick={() => { setSelectedGenius(genius); setShowProfileModal(true); }}
                    className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs text-text/55 border border-gray-200 rounded-lg hover:border-gray-300 hover:text-text transition-colors flex-shrink-0"
                  >
                    <Eye style={{ width: '12px', height: '12px' }} />
                    Ver perfil
                  </button>

                  {/* Actions menu */}
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() => setActiveDropdown(isOpen ? null : genius.id)}
                      className="p-1.5 text-text/25 hover:text-text/55 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <MoreVertical style={{ width: '15px', height: '15px' }} />
                    </button>

                    {isOpen && (
                      <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl border border-gray-100 shadow-lg z-20 overflow-hidden">
                        <div className="py-1.5">
                          <DropdownItem icon={Eye} label="Ver perfil completo" onClick={() => { setSelectedGenius(genius); setShowProfileModal(true); setActiveDropdown(null); }} />
                          <DropdownItem icon={FileText} label="Documentos" onClick={() => setActiveDropdown(null)} />

                          <DropdownDivider label="Cambiar estado" />
                          <DropdownItem label="Activo" onClick={() => handleStatusChange(genius.id, 'active')} dot="bg-green-400" />
                          <DropdownItem label="Inactivo" onClick={() => handleStatusChange(genius.id, 'inactive')} dot="bg-gray-300" />
                          <DropdownItem label="Suspendido" onClick={() => handleStatusChange(genius.id, 'suspended')} dot="bg-red-400" />

                          <DropdownDivider label="Etiquetas" />
                          <DropdownItem icon={UserCheck} label={genius.isNew ? 'Quitar "Nuevo"' : 'Marcar "Nuevo"'} onClick={() => handleToggleNew(genius.id, genius.isNew)} />
                          <DropdownItem icon={Star} label={genius.isFeatured ? 'Quitar "Destacado"' : 'Marcar "Destacado"'} onClick={() => handleToggleFeatured(genius.id, genius.isFeatured)} />

                          <DropdownDivider />
                          <DropdownItem icon={Activity} label="Ver actividad" onClick={() => { setSelectedGenius(genius); setShowActivityModal(true); setActiveDropdown(null); }} />
                          <DropdownItem icon={StickyNote} label="Nota interna" onClick={() => { setSelectedGenius(genius); setNotesText(genius.internalNotes || ''); setShowNotesModal(true); setActiveDropdown(null); }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {showProfileModal && selectedGenius && (
        <GeniusProfilePreviewModal
          isOpen={showProfileModal}
          geniusData={selectedGenius}
          onClose={() => { setShowProfileModal(false); setSelectedGenius(null); }}
        />
      )}

      {/* Notes Modal */}
      {showNotesModal && selectedGenius && (
        <MiniModal title={`Nota interna — ${selectedGenius.name}`} onClose={() => { setShowNotesModal(false); setSelectedGenius(null); setNotesText(''); }}>
          <textarea
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            placeholder="Añadir notas internas sobre este genio..."
            className="w-full h-28 p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-text/15 resize-none placeholder:text-text/25"
          />
          <div className="flex gap-2 mt-3">
            <button onClick={handleNotesSubmit} className="flex-1 py-2 text-sm font-medium text-white bg-text hover:bg-text/85 rounded-lg transition-colors">Guardar</button>
            <button onClick={() => { setShowNotesModal(false); setSelectedGenius(null); setNotesText(''); }} className="flex-1 py-2 text-sm text-text/50 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
          </div>
        </MiniModal>
      )}

      {/* Activity Modal */}
      {showActivityModal && selectedGenius && (
        <MiniModal title={`Actividad — ${selectedGenius.name}`} onClose={() => { setShowActivityModal(false); setSelectedGenius(null); }}>
          <div className="space-y-2.5">
            {[
              { label: 'Visitas al perfil', value: selectedGenius.stats?.profileViews ?? 0 },
              { label: 'Clicks en WhatsApp', value: selectedGenius.stats?.whatsappClicks ?? 0 },
              { label: 'Veces en favoritos', value: selectedGenius.stats?.favoritesCount ?? 0 },
              { label: 'Registrado', value: formatDateToSpanish(selectedGenius.registeredAt) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-text/45">{label}</span>
                <span className="text-sm font-medium text-text">{value}</span>
              </div>
            ))}
          </div>
          <button onClick={() => { setShowActivityModal(false); setSelectedGenius(null); }} className="w-full mt-4 py-2 text-sm text-text/50 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cerrar</button>
        </MiniModal>
      )}

      {/* Backdrop for dropdown */}
      {activeDropdown && <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />}
    </>
  );
};

/* ── Helpers ── */

const DropdownItem: React.FC<{
  icon?: React.FC<any>;
  label: string;
  onClick: () => void;
  dot?: string;
}> = ({ icon: Icon, label, onClick, dot }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-text/60 hover:bg-gray-50 hover:text-text w-full text-left transition-colors"
  >
    {dot && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />}
    {Icon && !dot && <Icon style={{ width: '13px', height: '13px', flexShrink: 0 }} />}
    {label}
  </button>
);

const DropdownDivider: React.FC<{ label?: string }> = ({ label }) => (
  <div className="border-t border-gray-50 my-1">
    {label && <p className="px-3.5 pt-2 pb-0.5 text-[10px] font-medium text-text/30 uppercase tracking-wide">{label}</p>}
  </div>
);

const MiniModal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        <button onClick={onClose} className="p-1 text-text/30 hover:text-text/60 rounded-lg hover:bg-gray-50 transition-colors">
          <X style={{ width: '15px', height: '15px' }} />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

export default GeniusManagement;
