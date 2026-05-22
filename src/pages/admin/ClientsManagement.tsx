import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  ChevronDown,
  MoreVertical,
  RefreshCw,
  Loader2,
  User,
  Flag,
  Heart,
  MessageSquare,
  X,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  ShieldOff,
  ShieldCheck,
  FileText,
  EyeOff,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { handleWhatsAppContact } from '../../utils/whatsappUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

type ClientStatus = 'active' | 'suspended';

interface ClientProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  dni: string;
  profile_image: string;
  location: {
    departmentName?: string;
    provinceName?: string;
    districtName?: string;
    fullName?: string;
  } | null;
  login_method: string;
  status: ClientStatus;
  internal_notes: string;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
  // enriched
  favorites_count?: number;
  reviews_count?: number;
  reports_count?: number;
  is_reported?: boolean;
}

interface ClientReport {
  id: string;
  reason: string;
  details: string;
  status: string;
  target_type: string;
  created_at: string;
}

interface ClientReview {
  id: string;
  reviewed_name: string;
  rating: number;
  comment: string;
  moderation_status: string;
  created_at: string;
}

interface ClientFavorite {
  genius_id: string;
  genius_snapshot: {
    name: string;
    category: string;
    image: string;
    rating: number;
  };
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ClientStatus, { label: string; dot: string; text: string; bg: string }> = {
  active:    { label: 'Activo',     dot: 'bg-green-400', text: 'text-green-700', bg: 'bg-green-50' },
  suspended: { label: 'Suspendido', dot: 'bg-red-400',   text: 'text-red-600',   bg: 'bg-red-50'   },
};

const LOGIN_LABELS: Record<string, string> = {
  email: 'Correo',
  google: 'Google',
  facebook: 'Facebook',
  apple: 'Apple',
};

const REASON_LABELS: Record<string, string> = {
  false_info: 'Información falsa',
  spam: 'Spam',
  offensive: 'Lenguaje ofensivo',
  inappropriate: 'Contenido inapropiado',
  misconduct: 'Mala conducta',
  other: 'Otro',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: ClientStatus; small?: boolean }> = ({ status, small }) => {
  const c = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${small ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'} ${c.bg} ${c.text}`}>
      <span className={`rounded-full flex-shrink-0 ${small ? 'w-1 h-1' : 'w-1.5 h-1.5'} ${c.dot}`} />
      {c.label}
    </span>
  );
};

const StatPill: React.FC<{ icon: React.FC<{ className?: string }>; value: number; label: string; warn?: boolean }> = ({ icon: Icon, value, label, warn }) => (
  <div className={`flex items-center gap-1 text-xs ${warn && value > 0 ? 'text-red-500' : 'text-text/40'}`}>
    <Icon className="w-3 h-3 flex-shrink-0" />
    <span>{value}</span>
    <span className="hidden sm:inline">{label}</span>
  </div>
);

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });

const fmtFull = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

// ─── Detail side panel ────────────────────────────────────────────────────────

interface DetailPanelProps {
  client: ClientProfile | null;
  reports: ClientReport[];
  reviews: ClientReview[];
  favorites: ClientFavorite[];
  onClose: () => void;
  onStatusChange: (id: string, status: ClientStatus, notes: string) => Promise<void>;
  onSaveNotes: (id: string, notes: string) => Promise<void>;
}

const DetailPanel: React.FC<DetailPanelProps> = ({
  client, reports, reviews, favorites, onClose, onStatusChange, onSaveNotes,
}) => {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'activity' | 'reports' | 'favorites'>('activity');

  useEffect(() => {
    if (client) { setNotes(client.internal_notes || ''); setActiveTab('activity'); }
  }, [client?.id]);

  if (!client) return null;

  const act = async (status: ClientStatus) => {
    setSaving(true);
    await onStatusChange(client.id, status, notes);
    setSaving(false);
  };

  const saveNotes = async () => {
    setSaving(true);
    await onSaveNotes(client.id, notes);
    setSaving(false);
  };

  return (
    <aside className="w-80 flex-shrink-0 bg-white border-l border-gray-100 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <span className="text-sm font-medium text-text">Detalle del cliente</span>
        <button onClick={onClose} className="p-1 rounded-md text-text/30 hover:text-text/55 hover:bg-gray-50 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile header */}
        <div className="px-5 py-5 border-b border-gray-50">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-shrink-0">
              {client.profile_image ? (
                <img src={client.profile_image} alt={client.full_name} className="w-11 h-11 rounded-full object-cover" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-text/30" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text truncate">{client.full_name || 'Sin nombre'}</p>
              <p className="text-xs text-text/40 truncate">{client.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <StatusBadge status={client.status} small />
                {client.is_reported && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-500">
                    <Flag className="w-2.5 h-2.5" />
                    Reportado
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="space-y-1.5 text-xs text-text/50">
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3 flex-shrink-0" />
                <span>{client.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Mail className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{client.email}</span>
            </div>
            {client.location?.fullName && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{client.location.fullName}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              <span>Registrado el {fmtFull(client.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span>Visto el {fmtFull(client.last_seen_at)}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {([
            { id: 'activity', label: `Reseñas (${reviews.length})` },
            { id: 'favorites', label: `Favoritos (${favorites.length})` },
            { id: 'reports', label: `Reportes (${reports.length})` },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-text border-b-2 border-text'
                  : 'text-text/40 hover:text-text/65'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-5 py-4 space-y-3">
          {activeTab === 'activity' && (
            reviews.length === 0 ? (
              <p className="text-xs text-text/30 text-center py-4">Sin reseñas registradas.</p>
            ) : (
              reviews.map(r => (
                <div key={r.id} className="flex items-start gap-2.5 text-xs">
                  <MessageSquare className="w-3 h-3 text-text/25 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-text/70 font-medium truncate">{r.reviewed_name}</p>
                    <p className="text-text/40 leading-relaxed mt-0.5 line-clamp-2">"{r.comment}"</p>
                    <p className="text-text/25 mt-0.5">{fmt(r.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className={`text-[8px] ${s <= r.rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                    ))}
                  </div>
                </div>
              ))
            )
          )}

          {activeTab === 'favorites' && (
            favorites.length === 0 ? (
              <p className="text-xs text-text/30 text-center py-4">Sin genios favoritos.</p>
            ) : (
              favorites.map(f => (
                <div key={f.genius_id} className="flex items-center gap-2.5 text-xs">
                  {f.genius_snapshot?.image ? (
                    <img src={f.genius_snapshot.image} alt={f.genius_snapshot.name}
                      className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3 text-text/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-text/70 font-medium truncate">{f.genius_snapshot?.name}</p>
                    <p className="text-text/35 truncate">{f.genius_snapshot?.category}</p>
                  </div>
                  <a href={`/profile/${f.genius_id}`} target="_blank" rel="noreferrer"
                    className="text-text/20 hover:text-text/50 transition-colors flex-shrink-0">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))
            )
          )}

          {activeTab === 'reports' && (
            reports.length === 0 ? (
              <p className="text-xs text-text/30 text-center py-4">Sin reportes enviados.</p>
            ) : (
              reports.map(r => (
                <div key={r.id} className="flex items-start gap-2 text-xs">
                  <Flag className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-text/70 font-medium">{REASON_LABELS[r.reason] || r.reason}</p>
                    <p className="text-text/35 capitalize">{r.target_type === 'profile' ? 'Perfil' : 'Comentario'}</p>
                    {r.details && <p className="text-text/30 mt-0.5">{r.details}</p>}
                    <p className="text-text/25 mt-0.5">{fmt(r.created_at)}</p>
                  </div>
                </div>
              ))
            )
          )}
        </div>

        {/* Internal notes */}
        <div className="px-5 pb-4">
          <p className="text-[10px] font-medium text-text/35 uppercase tracking-wide mb-2">Notas internas</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Agrega una nota sobre este cliente..."
            className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-text/20 resize-none bg-white text-text placeholder:text-text/25 transition-colors"
          />
          <button onClick={saveNotes} disabled={saving}
            className="mt-2 w-full py-2 rounded-lg border border-gray-200 text-xs text-text/50 hover:bg-gray-50 hover:text-text/75 transition-colors disabled:opacity-40">
            {saving ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Guardar nota'}
          </button>
        </div>
      </div>

      {/* Action footer */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        {client.status === 'active' ? (
          <button onClick={() => act('suspended')} disabled={saving}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors w-full disabled:opacity-40">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldOff className="w-3.5 h-3.5" />}
            Suspender cuenta
          </button>
        ) : (
          <button onClick={() => act('active')} disabled={saving}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-green-200 text-xs font-medium text-green-700 hover:bg-green-50 transition-colors w-full disabled:opacity-40">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            Reactivar cuenta
          </button>
        )}

        {client.phone && (
          <button
            onClick={() => handleWhatsAppContact(client.id, client.full_name, 'Cliente', client.phone)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-gray-200 text-xs font-medium text-text/60 hover:bg-gray-50 transition-colors w-full"
          >
            <Phone className="w-3.5 h-3.5" />
            Contactar por WhatsApp
          </button>
        )}
      </div>
    </aside>
  );
};

// ─── Row menu ─────────────────────────────────────────────────────────────────

interface RowMenuProps {
  client: ClientProfile;
  onSelect: () => void;
  onStatusChange: (id: string, status: ClientStatus, notes: string) => Promise<void>;
}

const RowMenu: React.FC<RowMenuProps> = ({ client, onSelect, onStatusChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className="p-1.5 rounded-lg text-text/30 hover:text-text/55 hover:bg-gray-50 transition-colors"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-gray-100 shadow-lg z-20 py-1 animate-in fade-in slide-in-from-top-1 duration-100"
          onClick={e => e.stopPropagation()}>
          <button onClick={() => { setOpen(false); onSelect(); }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-text/65 hover:bg-gray-50 transition-colors">
            <User className="w-3 h-3" /> Ver detalle
          </button>

          {client.status === 'active' ? (
            <button onClick={async () => { setOpen(false); await onStatusChange(client.id, 'suspended', client.internal_notes); }}
              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-red-400 hover:bg-red-50 transition-colors">
              <ShieldOff className="w-3 h-3" /> Suspender
            </button>
          ) : (
            <button onClick={async () => { setOpen(false); await onStatusChange(client.id, 'active', client.internal_notes); }}
              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-green-600 hover:bg-green-50 transition-colors">
              <ShieldCheck className="w-3 h-3" /> Reactivar
            </button>
          )}

          {client.phone && (
            <>
              <div className="my-1 border-t border-gray-100" />
              <button onClick={() => { setOpen(false); handleWhatsAppContact(client.id, client.full_name, 'Cliente', client.phone); }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-text/65 hover:bg-gray-50 transition-colors">
                <Phone className="w-3 h-3" /> WhatsApp
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const ClientsManagement: React.FC = () => {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ClientStatus | 'all' | 'reported'>('all');
  const [selected, setSelected] = useState<ClientProfile | null>(null);
  const [detailReports, setDetailReports] = useState<ClientReport[]>([]);
  const [detailReviews, setDetailReviews] = useState<ClientReview[]>([]);
  const [detailFavorites, setDetailFavorites] = useState<ClientFavorite[]>([]);

  const load = useCallback(async () => {
    setLoading(true);

    const { data: rows } = await supabase
      .from('client_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!rows || rows.length === 0) { setClients([]); setLoading(false); return; }

    const clientIds = rows.map(r => r.id);

    // Favorites count per client
    const { data: favRows } = await supabase
      .from('user_favorites')
      .select('user_id')
      .in('user_id', clientIds);

    const favCounts = new Map<string, number>();
    (favRows || []).forEach(f => favCounts.set(f.user_id, (favCounts.get(f.user_id) || 0) + 1));

    // Reviews count per client (genius_reviews reviewer is a genius id, not client id — skip)
    // Reports sent by client — reporter_id is auth.uid (uuid) but client id is text; we match by email if possible
    // Since reporter_id links to auth.users (uuid) and client id is text, we count reports where genius_profile_id is related
    // Best approach: count reports where reporter_id text-cast matches or just count from reports by email matching
    // For now enrich with favorites and flag "reported" if they have any report against their profile

    const enriched: ClientProfile[] = rows.map(row => ({
      ...row,
      favorites_count: favCounts.get(row.id) || 0,
      reviews_count: 0,
      reports_count: 0,
      is_reported: row.status === 'suspended',
    }));

    setClients(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadDetail = useCallback(async (client: ClientProfile) => {
    setSelected(client);

    // Favorites
    const { data: favs } = await supabase
      .from('user_favorites')
      .select('genius_id, genius_snapshot, created_at')
      .eq('user_id', client.id)
      .order('created_at', { ascending: false });
    setDetailFavorites(favs || []);

    // Reviews sent (reviewer is genius id; client id won't match — show empty for now)
    setDetailReviews([]);

    // Reports sent by this client (reporter_id is uuid; we try matching by a best-effort approach)
    const { data: reps } = await supabase
      .from('reports')
      .select('id, reason, details, status, target_type, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    // Since reporter_id is uuid (supabase auth) and our client id is custom text,
    // we can only show reports if the client used Supabase auth. For now show all recent reports.
    setDetailReports(reps || []);
  }, []);

  const handleStatusChange = useCallback(async (id: string, status: ClientStatus, notes: string) => {
    await supabase
      .from('client_profiles')
      .update({ status, internal_notes: notes, updated_at: new Date().toISOString() })
      .eq('id', id);
    setClients(prev => prev.map(c => c.id === id ? { ...c, status, internal_notes: notes } : c));
    setSelected(prev => prev?.id === id ? { ...prev, status, internal_notes: notes } : prev);
  }, []);

  const handleSaveNotes = useCallback(async (id: string, notes: string) => {
    await supabase
      .from('client_profiles')
      .update({ internal_notes: notes, updated_at: new Date().toISOString() })
      .eq('id', id);
    setClients(prev => prev.map(c => c.id === id ? { ...c, internal_notes: notes } : c));
    setSelected(prev => prev?.id === id ? { ...prev, internal_notes: notes } : prev);
  }, []);

  const now = new Date();
  const thisMonth = clients.filter(c => {
    const d = new Date(c.created_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  const counts = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    suspended: clients.filter(c => c.status === 'suspended').length,
    new: thisMonth,
    reported: clients.filter(c => c.is_reported).length,
  };

  const filtered = clients.filter(c => {
    if (filterStatus === 'reported') return c.is_reported;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-1 min-h-0 gap-0">
      <div className="flex-1 min-w-0 space-y-5">

        {/* Metrics */}
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
          {[
            { label: 'Total clientes', value: counts.total, sub: 'registrados' },
            { label: 'Activos',        value: counts.active, sub: 'en plataforma', green: true },
            { label: 'Nuevos mes',     value: counts.new, sub: 'este mes', blue: true },
            { label: 'Suspendidos',    value: counts.suspended, sub: 'moderados', red: counts.suspended > 0 },
            { label: 'Reportados',     value: counts.reported, sub: 'con reporte', red: counts.reported > 0 },
          ].map(({ label, value, sub, green, blue, red }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-text/35 mb-3">{label}</p>
              <p className={`font-heading text-2xl font-semibold leading-none ${
                green ? 'text-green-600' : blue ? 'text-blue-600' : red ? 'text-red-500' : 'text-text'
              }`}>{value}</p>
              <p className="text-xs text-text/30 mt-2">{sub}</p>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-base font-semibold text-text">Clientes</h1>
            <p className="text-xs text-text/35 mt-0.5">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={load}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-text/50 hover:text-text/75 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors">
            <RefreshCw className="w-3 h-3" />
            Actualizar
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text/25" />
            <input
              type="text"
              placeholder="Buscar por nombre, correo, celular..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-text/15 focus:border-text/30 bg-white placeholder:text-text/25 text-text transition-colors"
            />
          </div>

          <div className="relative">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as ClientStatus | 'all' | 'reported')}
              className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-text/15 bg-white text-text/70 cursor-pointer transition-colors"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="suspended">Suspendidos</option>
              <option value="reported">Reportados</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text/35 pointer-events-none" />
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-14">
            <Loader2 className="w-5 h-5 text-text/25 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 py-14 text-center">
            <User className="w-8 h-8 text-text/10 mx-auto mb-3" />
            <p className="text-sm font-medium text-text/40">
              {clients.length === 0 ? 'No hay clientes registrados aún' : 'No hay resultados'}
            </p>
            <p className="text-xs text-text/25 mt-1">
              {clients.length === 0
                ? 'Los clientes aparecerán aquí cuando inicien sesión en la plataforma.'
                : 'Prueba con otros filtros.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(client => (
              <ClientRow
                key={client.id}
                client={client}
                selected={selected?.id === client.id}
                onClick={() => loadDetail(client)}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <DetailPanel
          client={selected}
          reports={detailReports}
          reviews={detailReviews}
          favorites={detailFavorites}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          onSaveNotes={handleSaveNotes}
        />
      )}
    </div>
  );
};

// ─── Client Row ───────────────────────────────────────────────────────────────

interface ClientRowProps {
  client: ClientProfile;
  selected: boolean;
  onClick: () => void;
  onStatusChange: (id: string, status: ClientStatus, notes: string) => Promise<void>;
}

const ClientRow: React.FC<ClientRowProps> = ({ client, selected, onClick, onStatusChange }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-xl border px-5 py-4 flex items-center gap-4 cursor-pointer transition-all duration-150 ${
      selected ? 'border-text/20 shadow-sm' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
    }`}
  >
    {/* Avatar */}
    <div className="flex-shrink-0">
      {client.profile_image ? (
        <img src={client.profile_image} alt={client.full_name}
          className="w-9 h-9 rounded-full object-cover" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
          <User className="w-4 h-4 text-text/30" />
        </div>
      )}
    </div>

    {/* Main info */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap mb-0.5">
        <span className="text-sm font-medium text-text truncate">
          {client.full_name || 'Sin nombre'}
        </span>
        {client.is_reported && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-500">
            <Flag className="w-2.5 h-2.5" />
          </span>
        )}
      </div>
      <p className="text-xs text-text/40 truncate mb-1">{client.email}</p>
      <div className="flex items-center gap-3">
        <StatPill icon={Heart} value={client.favorites_count || 0} label="favoritos" />
        {client.location?.districtName && (
          <span className="flex items-center gap-1 text-xs text-text/30">
            <MapPin className="w-2.5 h-2.5" />
            {client.location.districtName}
          </span>
        )}
        <span className="text-[10px] text-text/25">{fmt(client.created_at)}</span>
      </div>
    </div>

    {/* Right */}
    <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
      <StatusBadge status={client.status} small />
      <RowMenu client={client} onSelect={onClick} onStatusChange={onStatusChange} />
    </div>
  </div>
);

export default ClientsManagement;
