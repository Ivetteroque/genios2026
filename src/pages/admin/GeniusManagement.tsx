import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  MoreVertical,
  MessageCircle,
  Eye,
  Star,
  Activity,
  StickyNote,
  Download,
  MapPin,
  X,
  Ban,
  RotateCcw,
} from 'lucide-react';
import { formatDateToSpanish } from '../../utils/commonUtils';
import GeniusProfilePreviewModal from '../../components/GeniusProfilePreviewModal';
import { convertGeniusProfileToGenius } from '../../services/supabaseGeniusService';
import {
  type AdminGenius,
  getFullGeniusProfile,
  listGeniusesForAdmin,
  reactivateGenius,
  suspendGenius,
  updateGeniusAsAdmin,
} from '../../services/adminGeniusService';
import { daysUntil, isMembershipActive, EXPIRING_SOON_DAYS } from '../../services/membershipService';
import type { Genius } from '../../utils/geniusUtils';

const DEFAULT_AVATAR = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop';
const NEW_DAYS = 30;

const STATUS_CONFIG: Record<AdminGenius['status'], { label: string; classes: string; dot: string }> = {
  active:    { label: 'Activo',     classes: 'bg-green-50 text-green-700',  dot: 'bg-green-400' },
  suspended: { label: 'Suspendido', classes: 'bg-red-50 text-red-600',      dot: 'bg-red-400' },
};

const isNew = (g: AdminGenius) => Date.now() - new Date(g.created_at).getTime() < NEW_DAYS * 86400000;

/** Etiqueta de membresía: lo que decide si aparece en el directorio. */
const membershipInfo = (g: AdminGenius) => {
  const m = g.membership;
  if (!m) return { label: 'Sin acceso', classes: 'bg-gray-100 text-text/40', visible: false };
  if (m.status === 'suspended') return { label: 'Membresía suspendida', classes: 'bg-red-50 text-red-600', visible: false };
  if (!isMembershipActive(m)) return { label: 'Vencida', classes: 'bg-gray-100 text-text/45', visible: false };
  const days = daysUntil(m.ends_at);
  const base = m.type === 'beta' ? 'Beta' : 'Anual';
  return {
    label: `${base} · ${days} d`,
    classes: days <= EXPIRING_SOON_DAYS ? 'bg-amber-50 text-amber-700' : m.type === 'beta' ? 'bg-[#A0C4FF]/30 text-blue-700' : 'bg-[#C0FDFB]/50 text-teal-700',
    visible: true,
  };
};

const locationLabel = (g: AdminGenius) =>
  [g.home_location?.districtName, g.home_location?.provinceName].filter(Boolean).join(', ');

/** WhatsApp del equipo al genio. No usa handleWhatsAppContact: esa cuenta el clic como contacto de un cliente. */
const contactGenius = (g: AdminGenius) => {
  const msg = encodeURIComponent(`Hola ${g.full_name}, te escribimos del equipo de Genios.`);
  window.open(`https://wa.me/51${g.phone.replace(/\D/g, '')}?text=${msg}`, '_blank', 'noopener');
};

const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const GeniusManagement: React.FC = () => {
  const [genios, setGenios] = useState<AdminGenius[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [selectedGenius, setSelectedGenius] = useState<AdminGenius | null>(null);
  const [previewData, setPreviewData] = useState<Genius | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [notesText, setNotesText] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [saving, setSaving] = useState(false);

  const loadGenios = useCallback(async () => {
    setLoadError('');
    try {
      setGenios(await listGeniusesForAdmin());
    } catch (error) {
      console.error('Error cargando genios:', error);
      setLoadError('No se pudieron cargar los genios. Revisa tu sesión de admin.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGenios(); }, [loadGenios]);

  const filteredGenios = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return genios.filter((g) => {
      if (q && !`${g.full_name} ${g.category} ${locationLabel(g)} ${g.email}`.toLowerCase().includes(q)) return false;
      if (statusFilter === 'visible' && !(g.status === 'active' && membershipInfo(g).visible)) return false;
      if (statusFilter === 'no_access' && membershipInfo(g).visible) return false;
      if (statusFilter === 'suspended' && g.status !== 'suspended') return false;
      if (tagFilter === 'new' && !isNew(g)) return false;
      if (tagFilter === 'verified' && g.verification_status !== 'verified') return false;
      if (tagFilter === 'pending_dni' && g.verification_status !== 'pending') return false;
      if (tagFilter === 'featured' && !g.is_featured) return false;
      return true;
    });
  }, [genios, searchTerm, statusFilter, tagFilter]);

  /** Ejecuta una acción, avisa si falla y recarga la lista. */
  const run = async (action: () => Promise<void>) => {
    setSaving(true);
    try {
      await action();
      await loadGenios();
    } catch (error) {
      console.error('Error actualizando genio:', error);
      alert('No se pudo guardar el cambio. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
      setActiveDropdown(null);
    }
  };

  const closeModals = () => {
    setShowNotesModal(false);
    setShowActivityModal(false);
    setShowSuspendModal(false);
    setSelectedGenius(null);
    setNotesText('');
    setSuspendReason('');
  };

  const openPreview = async (g: AdminGenius) => {
    setActiveDropdown(null);
    try {
      const full = await getFullGeniusProfile(g.id);
      if (full) setPreviewData(convertGeniusProfileToGenius(full));
    } catch (error) {
      console.error('Error cargando el perfil:', error);
      alert('No se pudo abrir el perfil.');
    }
  };

  const handleExportData = () => {
    const header = ['Nombre', 'Correo', 'Teléfono', 'Categoría', 'Ubicación', 'Estado', 'Acceso', 'Vence', 'DNI', 'Visitas', 'WhatsApp', 'Registrado'];
    const rows = genios.map((g) => [
      g.full_name, g.email, g.phone, g.category, locationLabel(g), STATUS_CONFIG[g.status].label,
      membershipInfo(g).label, g.membership?.ends_at?.slice(0, 10) ?? '', g.verification_status,
      g.profile_views, g.whatsapp_clicks, g.created_at.slice(0, 10),
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([`${String.fromCharCode(0xfeff)}${csv}`], { type: 'text/csv;charset=utf-8' }));
    link.download = `genios_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Summary metrics
  const visibles = genios.filter((g) => g.status === 'active' && membershipInfo(g).visible).length;
  const beta = genios.filter((g) => g.membership?.type === 'beta' && isMembershipActive(g.membership)).length;
  const sinAcceso = genios.filter((g) => g.status === 'active' && !membershipInfo(g).visible).length;
  const suspendidos = genios.filter((g) => g.status === 'suspended').length;

  const metrics = [
    { label: 'Total', value: genios.length, bg: 'bg-white', border: 'border-gray-100' },
    { label: 'Visibles', value: visibles, bg: 'bg-[#C0FDFB]/30', border: 'border-[#C0FDFB]' },
    { label: 'En beta', value: beta, bg: 'bg-[#A0C4FF]/20', border: 'border-[#A0C4FF]/60' },
    { label: 'Sin acceso', value: sinAcceso, bg: 'bg-gray-50', border: 'border-gray-200' },
    { label: 'Suspendidos', value: suspendidos, bg: 'bg-[#FFADAD]/20', border: 'border-[#FFADAD]/60' },
  ];

  return (
    <>
      <div className="space-y-5 max-w-3xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-lg font-semibold text-text">Genios</h1>
            <p className="text-sm text-text/40 mt-0.5">
              Un genio aparece en el directorio si está activo y tiene un acceso vigente (beta o anual).
            </p>
          </div>
          <button
            onClick={handleExportData}
            disabled={genios.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-text/55 bg-white border border-gray-200 hover:border-gray-300 hover:text-text transition-colors disabled:opacity-40 flex-shrink-0"
          >
            <Download style={{ width: '14px', height: '14px' }} />
            Exportar CSV
          </button>
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
              placeholder="Buscar por nombre, oficio, distrito o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-text/15 focus:border-text/25 placeholder:text-text/25 transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrar por estado"
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-text/15 text-text/60 transition-colors"
          >
            <option value="all">Todos los estados</option>
            <option value="visible">Visibles</option>
            <option value="no_access">Sin acceso vigente</option>
            <option value="suspended">Suspendidos</option>
          </select>
          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            aria-label="Filtrar por etiqueta"
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-text/15 text-text/60 transition-colors"
          >
            <option value="all">Todas las etiquetas</option>
            <option value="new">Nuevo</option>
            <option value="verified">Verificado</option>
            <option value="pending_dni">DNI por revisar</option>
            <option value="featured">Destacado</option>
          </select>
          <span className="text-xs text-text/30 ml-auto whitespace-nowrap">
            {filteredGenios.length} de {genios.length}
          </span>
        </div>

        {/* Cards list */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <div key={i} className="h-20 bg-white rounded-xl border border-gray-100 animate-pulse" />)}
          </div>
        ) : loadError ? (
          <div className="bg-white rounded-xl border border-red-100 py-10 text-center">
            <p className="text-sm text-red-600 mb-3">{loadError}</p>
            <button onClick={loadGenios} className="text-sm text-text/60 underline">Reintentar</button>
          </div>
        ) : filteredGenios.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
            <div className="text-3xl mb-3">👋</div>
            <p className="text-sm font-medium text-text mb-1">
              {genios.length === 0 ? 'Aún no tienes genios registrados' : 'Ningún genio coincide con los filtros'}
            </p>
            <p className="text-sm text-text/40">
              {genios.length === 0
                ? 'Los genios aparecen aquí cuando se registran con Google y completan su perfil.'
                : 'Prueba con otra búsqueda o limpia los filtros.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGenios.map((genius) => {
              const access = membershipInfo(genius);
              const statusCfg = STATUS_CONFIG[genius.status] ?? STATUS_CONFIG.active;
              const isOpen = activeDropdown === genius.id;

              return (
                <div
                  key={genius.id}
                  className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center gap-4 hover:border-gray-200 hover:shadow-sm transition-all duration-150"
                >
                  {/* Avatar */}
                  <img
                    src={genius.profile_photo || DEFAULT_AVATAR}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                  />

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-text">{genius.full_name || 'Sin nombre'}</p>
                      {isNew(genius) && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#A0C4FF]/30 text-blue-700">Nuevo</span>
                      )}
                      {genius.verification_status === 'verified' && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#C0FDFB]/50 text-teal-700">Verificado</span>
                      )}
                      {genius.verification_status === 'pending' && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">DNI por revisar</span>
                      )}
                      {genius.is_featured && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600">Destacado</span>
                      )}
                    </div>
                    <p className="text-xs text-text/45 mt-0.5 truncate">{genius.category || 'Sin categoría'}</p>
                    {locationLabel(genius) && (
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin style={{ width: '10px', height: '10px' }} className="text-text/25 flex-shrink-0" />
                        <p className="text-[10px] text-text/30 truncate">{locationLabel(genius)}</p>
                      </div>
                    )}
                    {genius.status === 'suspended' && genius.suspension_reason && (
                      <p className="text-[10px] text-red-500 mt-1 truncate">Motivo: {genius.suspension_reason}</p>
                    )}
                  </div>

                  {/* Quick metrics */}
                  <div className="hidden sm:flex items-center gap-4 text-center flex-shrink-0">
                    <div>
                      <p className="text-xs font-medium text-text">{genius.profile_views ?? 0}</p>
                      <p className="text-[10px] text-text/30">Visitas</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-text">{genius.whatsapp_clicks ?? 0}</p>
                      <p className="text-[10px] text-text/30">WhatsApp</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-text">{genius.favorites_count}</p>
                      <p className="text-[10px] text-text/30">Favoritos</p>
                    </div>
                  </div>

                  {/* Access */}
                  <span className={`hidden md:inline-flex text-[10px] font-medium px-2 py-1 rounded-full flex-shrink-0 ${access.classes}`}>
                    {access.label}
                  </span>

                  {/* Status badge */}
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full flex-shrink-0 ${statusCfg.classes}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                    {statusCfg.label}
                  </span>

                  {/* WhatsApp */}
                  <button
                    onClick={() => contactGenius(genius)}
                    className="p-1.5 text-text/25 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors flex-shrink-0"
                    title="Contactar por WhatsApp"
                    aria-label={`Contactar a ${genius.full_name} por WhatsApp`}
                  >
                    <MessageCircle style={{ width: '15px', height: '15px' }} />
                  </button>

                  {/* View profile */}
                  <button
                    onClick={() => openPreview(genius)}
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
                      aria-label="Más acciones"
                      aria-expanded={isOpen}
                    >
                      <MoreVertical style={{ width: '15px', height: '15px' }} />
                    </button>

                    {isOpen && (
                      <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl border border-gray-100 shadow-lg z-20 overflow-hidden">
                        <div className="py-1.5">
                          <DropdownItem icon={Eye} label="Ver perfil completo" onClick={() => openPreview(genius)} />
                          <DropdownItem icon={Activity} label="Ver actividad" onClick={() => { setSelectedGenius(genius); setShowActivityModal(true); setActiveDropdown(null); }} />
                          <DropdownItem icon={StickyNote} label="Nota interna" onClick={() => { setSelectedGenius(genius); setNotesText(genius.internal_notes || ''); setShowNotesModal(true); setActiveDropdown(null); }} />

                          <DropdownDivider label="Directorio" />
                          <DropdownItem
                            icon={Star}
                            label={genius.is_featured ? 'Quitar "Destacado"' : 'Marcar como destacado'}
                            onClick={() => run(() => updateGeniusAsAdmin(genius.id, { is_featured: !genius.is_featured }))}
                          />

                          <DropdownDivider label="Estado" />
                          {genius.status === 'active' ? (
                            <DropdownItem
                              icon={Ban}
                              label="Suspender"
                              onClick={() => { setSelectedGenius(genius); setShowSuspendModal(true); setActiveDropdown(null); }}
                            />
                          ) : (
                            <DropdownItem
                              icon={RotateCcw}
                              label="Reactivar"
                              onClick={() => run(() => reactivateGenius(genius.id))}
                            />
                          )}
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
      {previewData && (
        <GeniusProfilePreviewModal
          isOpen
          geniusData={previewData}
          onClose={() => setPreviewData(null)}
        />
      )}

      {/* Notes Modal */}
      {showNotesModal && selectedGenius && (
        <MiniModal title={`Nota interna — ${selectedGenius.full_name}`} onClose={closeModals}>
          <textarea
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            placeholder="Añadir notas internas sobre este genio (solo las ve el equipo)..."
            className="w-full h-28 p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-text/15 resize-none placeholder:text-text/25"
          />
          <div className="flex gap-2 mt-3">
            <button
              disabled={saving}
              onClick={() => run(() => updateGeniusAsAdmin(selectedGenius.id, { internal_notes: notesText })).then(closeModals)}
              className="flex-1 py-2 text-sm font-medium text-white bg-text hover:bg-text/85 rounded-lg transition-colors disabled:opacity-50"
            >
              Guardar
            </button>
            <button onClick={closeModals} className="flex-1 py-2 text-sm text-text/50 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
          </div>
        </MiniModal>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && selectedGenius && (
        <MiniModal title={`Suspender a ${selectedGenius.full_name}`} onClose={closeModals}>
          <p className="text-sm text-text/50 mb-3">
            Su perfil deja de aparecer en el directorio de inmediato. El genio verá el motivo en su panel.
          </p>
          <textarea
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder="Motivo (obligatorio)"
            className="w-full h-24 p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-text/15 resize-none placeholder:text-text/25"
          />
          <div className="flex gap-2 mt-3">
            <button
              disabled={saving || !suspendReason.trim()}
              onClick={() => run(() => suspendGenius(selectedGenius.id, suspendReason.trim())).then(closeModals)}
              className="flex-1 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
            >
              Suspender
            </button>
            <button onClick={closeModals} className="flex-1 py-2 text-sm text-text/50 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
          </div>
        </MiniModal>
      )}

      {/* Activity Modal */}
      {showActivityModal && selectedGenius && (
        <MiniModal title={`Actividad — ${selectedGenius.full_name}`} onClose={closeModals}>
          <div className="space-y-2.5">
            {[
              { label: 'Visitas al perfil', value: selectedGenius.profile_views ?? 0 },
              { label: 'Clicks en WhatsApp', value: selectedGenius.whatsapp_clicks ?? 0 },
              { label: 'Veces en favoritos', value: selectedGenius.favorites_count },
              { label: 'Acceso', value: membershipInfo(selectedGenius).label },
              { label: 'Registrado', value: formatDateToSpanish(selectedGenius.created_at) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-text/45">{label}</span>
                <span className="text-sm font-medium text-text">{value}</span>
              </div>
            ))}
          </div>
          <button onClick={closeModals} className="w-full mt-4 py-2 text-sm text-text/50 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cerrar</button>
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
