import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Star,
  ChevronDown,
  MoreVertical,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
  MessageSquare,
  Flag,
  Check,
  Trash2,
  ExternalLink,
  X,
  User,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

type ModerationStatus = 'visible' | 'pending' | 'hidden';

interface AdminReview {
  id: string;
  reviewer_genius_id: string;
  reviewed_genius_id: string;
  rating: number;
  comment: string;
  moderation_status: ModerationStatus;
  moderation_note: string;
  moderated_at: string | null;
  created_at: string;
  updated_at: string;
  // enriched
  reviewer_name?: string;
  reviewer_photo?: string;
  reviewer_category?: string;
  reviewed_name?: string;
  reviewed_photo?: string;
  report_count?: number;
}

interface AssociatedReport {
  id: string;
  reason: string;
  details: string;
  status: string;
  created_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ModerationStatus, { label: string; dot: string; text: string; bg: string }> = {
  visible:  { label: 'Visible',   dot: 'bg-green-400',  text: 'text-green-700',  bg: 'bg-green-50' },
  pending:  { label: 'Pendiente', dot: 'bg-amber-400',  text: 'text-amber-700',  bg: 'bg-amber-50' },
  hidden:   { label: 'Oculto',    dot: 'bg-gray-300',   text: 'text-gray-500',   bg: 'bg-gray-50'  },
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

const StatusBadge: React.FC<{ status: ModerationStatus; small?: boolean }> = ({ status, small }) => {
  const c = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${small ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'} ${c.bg} ${c.text}`}>
      <span className={`rounded-full flex-shrink-0 ${small ? 'w-1 h-1' : 'w-1.5 h-1.5'} ${c.dot}`} />
      {c.label}
    </span>
  );
};

const StarRow: React.FC<{ rating: number; size?: 'sm' | 'xs' }> = ({ rating, size = 'sm' }) => {
  const dim = size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`${dim} ${s <= rating ? 'text-amber-400' : 'text-gray-200'}`}
          fill={s <= rating ? 'currentColor' : 'none'} />
      ))}
    </span>
  );
};

// ─── Detail side panel ────────────────────────────────────────────────────────

interface DetailPanelProps {
  review: AdminReview | null;
  reports: AssociatedReport[];
  onClose: () => void;
  onModerate: (id: string, status: ModerationStatus, note: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const DetailPanel: React.FC<DetailPanelProps> = ({ review, reports, onClose, onModerate, onDelete }) => {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (review) setNote(review.moderation_note || '');
    setConfirmDelete(false);
  }, [review?.id]);

  if (!review) return null;

  const act = async (status: ModerationStatus) => {
    setSaving(true);
    await onModerate(review.id, status, note);
    setSaving(false);
  };

  const del = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setSaving(true);
    await onDelete(review.id);
    setSaving(false);
    onClose();
  };

  return (
    <aside className="w-80 flex-shrink-0 bg-white border-l border-gray-100 flex flex-col overflow-y-auto">
      {/* Panel header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <span className="text-sm font-medium text-text">Detalle</span>
        <button onClick={onClose} className="p-1 rounded-md text-text/30 hover:text-text/55 hover:bg-gray-50 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Status + rating */}
        <div className="flex items-center justify-between">
          <StatusBadge status={review.moderation_status} />
          <StarRow rating={review.rating} />
        </div>

        {/* Comment body */}
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-sm text-text/75 leading-relaxed">"{review.comment}"</p>
        </div>

        {/* Reviewer */}
        <Section label="Revisor (autor)">
          <PersonRow
            photo={review.reviewer_photo}
            name={review.reviewer_name || 'Genio verificado'}
            sub={review.reviewer_category}
            href={review.reviewer_genius_id ? `/profile/${review.reviewer_genius_id}` : undefined}
          />
        </Section>

        {/* Reviewed */}
        <Section label="Genio comentado">
          <PersonRow
            photo={review.reviewed_photo}
            name={review.reviewed_name || 'Genio'}
            href={review.reviewed_genius_id ? `/profile/${review.reviewed_genius_id}` : undefined}
          />
        </Section>

        {/* Dates */}
        <Section label="Fechas">
          <div className="space-y-1 text-xs text-text/50">
            <p>Publicado: {fmt(review.created_at)}</p>
            {review.moderated_at && <p>Moderado: {fmt(review.moderated_at)}</p>}
          </div>
        </Section>

        {/* Associated reports */}
        {reports.length > 0 && (
          <Section label={`Reportes asociados (${reports.length})`}>
            <div className="space-y-2">
              {reports.map(r => (
                <div key={r.id} className="flex items-start gap-2 text-xs">
                  <Flag className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-text/70 font-medium">{REASON_LABELS[r.reason] || r.reason}</p>
                    {r.details && <p className="text-text/40 mt-0.5">{r.details}</p>}
                    <p className="text-text/30 mt-0.5">{fmt(r.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Admin note */}
        <Section label="Nota de moderación">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            placeholder="Agrega una nota interna..."
            className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-text/20 resize-none bg-white text-text placeholder:text-text/25 transition-colors"
          />
        </Section>
      </div>

      {/* Action footer */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        {review.moderation_status !== 'visible' && (
          <ActionBtn icon={Eye} label="Aprobar y mostrar" onClick={() => act('visible')} saving={saving}
            className="border-green-200 text-green-700 hover:bg-green-50" />
        )}
        {review.moderation_status !== 'pending' && (
          <ActionBtn icon={RefreshCw} label="Mover a pendiente" onClick={() => act('pending')} saving={saving}
            className="border-amber-200 text-amber-700 hover:bg-amber-50" />
        )}
        {review.moderation_status !== 'hidden' && (
          <ActionBtn icon={EyeOff} label="Ocultar comentario" onClick={() => act('hidden')} saving={saving}
            className="border-gray-200 text-gray-600 hover:bg-gray-50" />
        )}

        {review.reviewed_genius_id && (
          <a
            href={`/profile/${review.reviewed_genius_id}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-gray-200 text-xs font-medium text-text/60 hover:bg-gray-50 transition-colors w-full"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ver perfil del genio
          </a>
        )}

        <button
          onClick={del}
          disabled={saving}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-xs font-medium transition-colors w-full disabled:opacity-40 ${
            confirmDelete
              ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
              : 'border-gray-200 text-red-400 hover:bg-red-50 hover:border-red-200'
          }`}
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          {confirmDelete ? 'Confirmar eliminación' : 'Eliminar comentario'}
        </button>
        {confirmDelete && (
          <button onClick={() => setConfirmDelete(false)} className="w-full text-center text-xs text-text/35 hover:text-text/55 transition-colors py-1">
            Cancelar
          </button>
        )}
      </div>
    </aside>
  );
};

const Section: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <p className="text-[10px] font-medium text-text/35 uppercase tracking-wide mb-2">{label}</p>
    {children}
  </div>
);

const PersonRow: React.FC<{ photo?: string; name: string; sub?: string; href?: string }> = ({ photo, name, sub, href }) => (
  <div className="flex items-center gap-2.5">
    {photo ? (
      <img src={photo} alt={name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
    ) : (
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
        <User className="w-3.5 h-3.5 text-text/30" />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-text truncate">{name}</p>
      {sub && <p className="text-[10px] text-text/40 truncate">{sub}</p>}
    </div>
    {href && (
      <a href={href} target="_blank" rel="noreferrer"
        className="text-text/25 hover:text-text/55 transition-colors flex-shrink-0">
        <ExternalLink className="w-3 h-3" />
      </a>
    )}
  </div>
);

const ActionBtn: React.FC<{
  icon: React.FC<{ className?: string }>;
  label: string;
  onClick: () => void;
  saving: boolean;
  className: string;
}> = ({ icon: Icon, label, onClick, saving, className }) => (
  <button
    onClick={onClick}
    disabled={saving}
    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-xs font-medium transition-colors w-full disabled:opacity-40 ${className}`}
  >
    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
    {label}
  </button>
);

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

// ─── Row menu ─────────────────────────────────────────────────────────────────

interface RowMenuProps {
  review: AdminReview;
  onSelect: () => void;
  onModerate: (id: string, status: ModerationStatus, note: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const RowMenu: React.FC<RowMenuProps> = ({ review, onSelect, onModerate, onDelete }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const quick = async (status: ModerationStatus) => {
    setOpen(false);
    await onModerate(review.id, status, review.moderation_note || '');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className="p-1.5 rounded-lg text-text/30 hover:text-text/55 hover:bg-gray-50 transition-colors"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-gray-100 shadow-lg z-20 py-1 animate-in fade-in slide-in-from-top-1 duration-100"
          onClick={e => e.stopPropagation()}>
          <button onClick={() => { setOpen(false); onSelect(); }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-text/65 hover:bg-gray-50 hover:text-text transition-colors">
            <Eye className="w-3 h-3" /> Ver detalle
          </button>

          {review.moderation_status !== 'visible' && (
            <button onClick={() => quick('visible')}
              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-green-600 hover:bg-green-50 transition-colors">
              <Check className="w-3 h-3" /> Aprobar comentario
            </button>
          )}
          {review.moderation_status !== 'pending' && (
            <button onClick={() => quick('pending')}
              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-amber-600 hover:bg-amber-50 transition-colors">
              <RotateCcw className="w-3 h-3" /> Mover a pendiente
            </button>
          )}
          {review.moderation_status !== 'hidden' && (
            <button onClick={() => quick('hidden')}
              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-text/65 hover:bg-gray-50 transition-colors">
              <EyeOff className="w-3 h-3" /> Ocultar comentario
            </button>
          )}

          {review.reviewed_genius_id && (
            <>
              <div className="my-1 border-t border-gray-100" />
              <a href={`/profile/${review.reviewed_genius_id}`} target="_blank" rel="noreferrer"
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-text/65 hover:bg-gray-50 hover:text-text transition-colors">
                <ExternalLink className="w-3 h-3" /> Ver perfil del genio
              </a>
            </>
          )}

          <div className="my-1 border-t border-gray-100" />
          <button onClick={async () => { setOpen(false); await onDelete(review.id); }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors">
            <Trash2 className="w-3 h-3" /> Eliminar
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const CommentsManagement: React.FC = () => {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ModerationStatus | 'all' | 'reported'>('all');
  const [filterRating, setFilterRating] = useState<number | 0>(0);
  const [selected, setSelected] = useState<AdminReview | null>(null);
  const [associatedReports, setAssociatedReports] = useState<AssociatedReport[]>([]);

  const load = useCallback(async () => {
    setLoading(true);

    const { data: rows } = await supabase
      .from('genius_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (!rows || rows.length === 0) { setReviews([]); setLoading(false); return; }

    // Collect all genius IDs needed
    const reviewerIds = [...new Set(rows.map(r => r.reviewer_genius_id))];
    const reviewedIds = [...new Set(rows.map(r => r.reviewed_genius_id))];
    const allIds = [...new Set([...reviewerIds, ...reviewedIds])];

    const { data: profiles } = await supabase
      .from('genius_profiles')
      .select('id, full_name, profile_photo, category')
      .in('id', allIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    // Count reports per review
    const reviewIds = rows.map(r => r.id);
    const { data: reportRows } = await supabase
      .from('reports')
      .select('target_id')
      .eq('target_type', 'comment')
      .in('target_id', reviewIds);

    const reportCounts = new Map<string, number>();
    (reportRows || []).forEach(rr => {
      reportCounts.set(rr.target_id, (reportCounts.get(rr.target_id) || 0) + 1);
    });

    const enriched: AdminReview[] = rows.map(row => {
      const reviewer = profileMap.get(row.reviewer_genius_id);
      const reviewed = profileMap.get(row.reviewed_genius_id);
      return {
        ...row,
        moderation_status: row.moderation_status ?? 'visible',
        moderation_note: row.moderation_note ?? '',
        reviewer_name: reviewer?.full_name ?? 'Genio verificado',
        reviewer_photo: reviewer?.profile_photo ?? '',
        reviewer_category: reviewer?.category ?? '',
        reviewed_name: reviewed?.full_name ?? 'Genio',
        reviewed_photo: reviewed?.profile_photo ?? '',
        report_count: reportCounts.get(row.id) || 0,
      };
    });

    setReviews(enriched);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadReports = useCallback(async (reviewId: string) => {
    const { data } = await supabase
      .from('reports')
      .select('id, reason, details, status, created_at')
      .eq('target_type', 'comment')
      .eq('target_id', reviewId)
      .order('created_at', { ascending: false });
    setAssociatedReports(data || []);
  }, []);

  const handleSelect = useCallback(async (review: AdminReview) => {
    setSelected(review);
    await loadReports(review.id);
  }, [loadReports]);

  const handleModerate = useCallback(async (id: string, status: ModerationStatus, note: string) => {
    await supabase
      .from('genius_reviews')
      .update({ moderation_status: status, moderation_note: note, moderated_at: new Date().toISOString() })
      .eq('id', id);
    setReviews(prev => prev.map(r => r.id === id
      ? { ...r, moderation_status: status, moderation_note: note, moderated_at: new Date().toISOString() }
      : r));
    setSelected(prev => prev?.id === id ? { ...prev, moderation_status: status, moderation_note: note } : prev);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await supabase.from('genius_reviews').delete().eq('id', id);
    setReviews(prev => prev.filter(r => r.id !== id));
    if (selected?.id === id) setSelected(null);
  }, [selected]);

  const counts = {
    total: reviews.length,
    visible: reviews.filter(r => r.moderation_status === 'visible').length,
    pending: reviews.filter(r => r.moderation_status === 'pending').length,
    hidden: reviews.filter(r => r.moderation_status === 'hidden').length,
    reported: reviews.filter(r => (r.report_count || 0) > 0).length,
  };

  const filtered = reviews.filter(r => {
    if (filterStatus === 'reported') return (r.report_count || 0) > 0;
    if (filterStatus !== 'all' && r.moderation_status !== filterStatus) return false;
    if (filterRating > 0 && r.rating !== filterRating) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.comment.toLowerCase().includes(q) ||
        (r.reviewer_name || '').toLowerCase().includes(q) ||
        (r.reviewed_name || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-1 min-h-0 gap-0">
      {/* Left: main content */}
      <div className="flex-1 min-w-0 space-y-5">

        {/* Metrics */}
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: counts.total, sub: 'comentarios' },
            { label: 'Visibles', value: counts.visible, sub: 'publicados', green: true },
            { label: 'Pendientes', value: counts.pending, sub: 'por revisar', amber: counts.pending > 0 },
            { label: 'Reportados', value: counts.reported, sub: 'con reporte', red: counts.reported > 0 },
            { label: 'Ocultos', value: counts.hidden, sub: 'moderados' },
          ].map(({ label, value, sub, green, amber, red }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-text/35 mb-3">{label}</p>
              <p className={`font-heading text-2xl font-semibold leading-none ${
                green ? 'text-green-600' : amber ? 'text-amber-600' : red ? 'text-red-500' : 'text-text'
              }`}>{value}</p>
              <p className="text-xs text-text/30 mt-2">{sub}</p>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-base font-semibold text-text">Comentarios</h1>
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
              placeholder="Buscar por comentario, genio..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-text/15 focus:border-text/30 bg-white placeholder:text-text/25 text-text transition-colors"
            />
          </div>

          <div className="relative">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as ModerationStatus | 'all' | 'reported')}
              className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-text/15 bg-white text-text/70 cursor-pointer transition-colors"
            >
              <option value="all">Todos los estados</option>
              <option value="visible">Visibles</option>
              <option value="pending">Pendientes</option>
              <option value="reported">Reportados</option>
              <option value="hidden">Ocultos</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text/35 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={filterRating}
              onChange={e => setFilterRating(Number(e.target.value))}
              className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-text/15 bg-white text-text/70 cursor-pointer transition-colors"
            >
              <option value={0}>Todas las calific.</option>
              {[5, 4, 3, 2, 1].map(n => (
                <option key={n} value={n}>{n} estrella{n !== 1 ? 's' : ''}</option>
              ))}
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
            <MessageSquare className="w-8 h-8 text-text/10 mx-auto mb-3" />
            <p className="text-sm font-medium text-text/40">
              {reviews.length === 0 ? 'No hay comentarios aún' : 'No hay resultados'}
            </p>
            <p className="text-xs text-text/25 mt-1">
              {reviews.length === 0
                ? 'Los comentarios entre genios aparecerán aquí.'
                : 'Prueba con otros filtros.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(review => (
              <ReviewRow
                key={review.id}
                review={review}
                selected={selected?.id === review.id}
                onClick={() => handleSelect(review)}
                onModerate={handleModerate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right: detail panel */}
      {selected && (
        <DetailPanel
          review={selected}
          reports={associatedReports}
          onClose={() => setSelected(null)}
          onModerate={handleModerate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

// ─── Review Row ───────────────────────────────────────────────────────────────

interface ReviewRowProps {
  review: AdminReview;
  selected: boolean;
  onClick: () => void;
  onModerate: (id: string, status: ModerationStatus, note: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const ReviewRow: React.FC<ReviewRowProps> = ({ review, selected, onClick, onModerate, onDelete }) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-xl border px-5 py-4 flex items-center gap-4 cursor-pointer transition-all duration-150 ${
      selected
        ? 'border-text/20 shadow-sm'
        : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
    }`}
  >
    {/* Avatar */}
    <div className="flex-shrink-0">
      {review.reviewer_photo ? (
        <img src={review.reviewer_photo} alt={review.reviewer_name}
          className="w-9 h-9 rounded-full object-cover" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
          <User className="w-4 h-4 text-text/30" />
        </div>
      )}
    </div>

    {/* Main */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap mb-0.5">
        <span className="text-sm font-medium text-text truncate">
          {review.reviewer_name || 'Genio verificado'}
        </span>
        <span className="text-text/25 text-xs">sobre</span>
        <span className="text-sm text-text/65 truncate">{review.reviewed_name || 'Genio'}</span>
        {(review.report_count || 0) > 0 && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-500">
            <Flag className="w-2.5 h-2.5" />
            {review.report_count}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <StarRow rating={review.rating} size="xs" />
        <p className="text-xs text-text/45 truncate max-w-[280px]">{review.comment}</p>
      </div>
      <p className="text-[10px] text-text/30 mt-0.5">
        {new Date(review.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
      </p>
    </div>

    {/* Right side */}
    <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
      <StatusBadge status={review.moderation_status} small />
      <RowMenu
        review={review}
        onSelect={onClick}
        onModerate={onModerate}
        onDelete={onDelete}
      />
    </div>
  </div>
);

export default CommentsManagement;
