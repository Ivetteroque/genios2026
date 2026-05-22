import React, { useState, useEffect, useCallback } from 'react';
import {
  Flag,
  User,
  MessageSquare,
  Search,
  ChevronDown,
  Check,
  EyeOff,
  ShieldOff,
  ExternalLink,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'ignored';
type TargetType = 'profile' | 'comment';

interface Report {
  id: string;
  reporter_id: string | null;
  target_type: TargetType;
  target_id: string;
  genius_profile_id: string | null;
  reason: string;
  details: string;
  status: ReportStatus;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

const REASON_LABELS: Record<string, string> = {
  false_info: 'Información falsa',
  spam: 'Spam',
  inappropriate: 'Contenido inapropiado',
  misconduct: 'Mala conducta',
  offensive: 'Lenguaje ofensivo',
  other: 'Otro',
};

const STATUS_CONFIG: Record<ReportStatus, { label: string; dotColor: string; textColor: string; bgColor: string }> = {
  pending: { label: 'Pendiente', dotColor: 'bg-amber-400', textColor: 'text-amber-700', bgColor: 'bg-amber-50' },
  reviewed: { label: 'Revisado', dotColor: 'bg-blue-400', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
  resolved: { label: 'Resuelto', dotColor: 'bg-green-400', textColor: 'text-green-700', bgColor: 'bg-green-50' },
  ignored: { label: 'Ignorado', dotColor: 'bg-gray-300', textColor: 'text-gray-500', bgColor: 'bg-gray-50' },
};

// ─── helpers ────────────────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: ReportStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bgColor} ${cfg.textColor}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dotColor}`} />
      {cfg.label}
    </span>
  );
};

const TypeBadge: React.FC<{ type: TargetType }> = ({ type }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
    type === 'profile' ? 'bg-[#A0C4FF]/15 text-blue-700' : 'bg-gray-100 text-gray-600'
  }`}>
    {type === 'profile' ? <User className="w-2.5 h-2.5" /> : <MessageSquare className="w-2.5 h-2.5" />}
    {type === 'profile' ? 'Perfil' : 'Comentario'}
  </span>
);

// ─── Detail / action modal ───────────────────────────────────────────────────

interface DetailModalProps {
  report: Report | null;
  onClose: () => void;
  onUpdate: (id: string, status: ReportStatus, notes: string) => Promise<void>;
}

const DetailModal: React.FC<DetailModalProps> = ({ report, onClose, onUpdate }) => {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (report) setNotes(report.admin_notes || '');
  }, [report]);

  if (!report) return null;

  const handleAction = async (status: ReportStatus) => {
    setSaving(true);
    await onUpdate(report.id, status, notes);
    setSaving(false);
    onClose();
  };

  const actions: Array<{ status: ReportStatus; label: string; icon: React.FC<{ className?: string }>; className: string }> = [
    { status: 'reviewed', label: 'Marcar revisado', icon: Check, className: 'border-blue-200 text-blue-700 hover:bg-blue-50' },
    { status: 'resolved', label: 'Marcar resuelto', icon: Check, className: 'border-green-200 text-green-700 hover:bg-green-50' },
    { status: 'ignored', label: 'Ignorar reporte', icon: EyeOff, className: 'border-gray-200 text-gray-500 hover:bg-gray-50' },
  ].filter(a => a.status !== report.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-text/30 hover:text-text/55 transition-colors">
          <X className="w-4 h-4" />
        </button>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex items-start gap-3 pr-6">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
              <Flag className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text">Detalle del reporte</h2>
              <p className="text-xs text-text/40 mt-0.5">{new Date(report.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <StatusBadge status={report.status} />
            <TypeBadge type={report.target_type} />
          </div>

          {/* Info rows */}
          <div className="space-y-2 text-sm">
            <InfoRow label="Motivo" value={REASON_LABELS[report.reason] || report.reason} />
            <InfoRow label="ID objetivo" value={report.target_id} mono />
            {report.genius_profile_id && <InfoRow label="Perfil genio" value={report.genius_profile_id} mono />}
            {report.details && <InfoRow label="Detalles" value={report.details} />}
          </div>

          {/* Admin notes */}
          <div>
            <label className="block text-xs text-text/40 mb-1.5">Notas internas</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Agrega notas de revisión..."
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-text/20 resize-none bg-white text-text placeholder:text-text/25 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 gap-1.5">
            {actions.map(({ status, label, icon: Icon, className: cls }) => (
              <button
                key={status}
                onClick={() => handleAction(status)}
                disabled={saving}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg border text-xs font-medium transition-colors disabled:opacity-40 ${cls}`}
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
                {label}
              </button>
            ))}

            {report.target_type === 'profile' && report.genius_profile_id && (
              <a
                href={`/profile/${report.genius_profile_id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-gray-200 text-xs font-medium text-text/60 hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Ver perfil reportado
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="flex items-start gap-3">
    <span className="text-text/35 w-24 flex-shrink-0 pt-px">{label}</span>
    <span className={`text-text/75 break-all ${mono ? 'font-mono text-xs bg-gray-50 px-1.5 py-0.5 rounded' : ''}`}>{value}</span>
  </div>
);

// ─── Main component ──────────────────────────────────────────────────────────

const ReportsManagement: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ReportStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<TargetType | 'all'>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    setReports(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = async (id: string, status: ReportStatus, notes: string) => {
    await supabase
      .from('reports')
      .update({ status, admin_notes: notes, updated_at: new Date().toISOString() })
      .eq('id', id);
    setReports(prev => prev.map(r => r.id === id ? { ...r, status, admin_notes: notes } : r));
  };

  const filtered = reports.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterType !== 'all' && r.target_type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.reason.toLowerCase().includes(q) ||
        r.details.toLowerCase().includes(q) ||
        r.target_id.toLowerCase().includes(q) ||
        (r.genius_profile_id || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = reports.filter(r => r.status === 'pending').length;
  const resolvedCount = reports.filter(r => r.status === 'resolved').length;
  const profileCount = reports.filter(r => r.target_type === 'profile').length;
  const commentCount = reports.filter(r => r.target_type === 'comment').length;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Metrics */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'Total reportes', value: reports.length, sub: 'registrados' },
          { label: 'Pendientes', value: pendingCount, sub: 'por revisar', amber: pendingCount > 0 },
          { label: 'Perfiles', value: profileCount, sub: 'reportados' },
          { label: 'Comentarios', value: commentCount, sub: 'reportados' },
        ].map(({ label, value, sub, amber }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-text/35 mb-3">{label}</p>
            <p className={`font-heading text-2xl font-semibold leading-none ${amber ? 'text-amber-600' : 'text-text'}`}>
              {value}
            </p>
            <p className="text-xs text-text/30 mt-2">{sub}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-base font-semibold text-text">Reportes</h1>
          <p className="text-xs text-text/35 mt-0.5">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-text/50 hover:text-text/75 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
        >
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
            placeholder="Buscar por motivo, ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-text/15 focus:border-text/30 bg-white placeholder:text-text/25 text-text transition-colors"
          />
        </div>

        <div className="relative">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as ReportStatus | 'all')}
            className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-text/15 bg-white text-text/70 cursor-pointer transition-colors"
          >
            <option value="all">Todos los estados</option>
            {(Object.keys(STATUS_CONFIG) as ReportStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text/35 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value as TargetType | 'all')}
            className="appearance-none pl-3 pr-8 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-text/15 bg-white text-text/70 cursor-pointer transition-colors"
          >
            <option value="all">Todos los tipos</option>
            <option value="profile">Perfiles</option>
            <option value="comment">Comentarios</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text/35 pointer-events-none" />
        </div>
      </div>

      {/* Report list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 text-text/25 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-14 text-center">
          <Flag className="w-8 h-8 text-text/10 mx-auto mb-3" />
          <p className="text-sm font-medium text-text/40">
            {reports.length === 0 ? 'No hay reportes aún' : 'No hay resultados'}
          </p>
          <p className="text-xs text-text/25 mt-1">
            {reports.length === 0 ? 'Los reportes de usuarios aparecerán aquí.' : 'Prueba con otros filtros.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(report => (
            <ReportRow
              key={report.id}
              report={report}
              onClick={() => setSelectedReport(report)}
              onQuickAction={handleUpdate}
            />
          ))}
        </div>
      )}

      <DetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onUpdate={handleUpdate}
      />
    </div>
  );
};

// ─── Report Row ──────────────────────────────────────────────────────────────

interface ReportRowProps {
  report: Report;
  onClick: () => void;
  onQuickAction: (id: string, status: ReportStatus, notes: string) => Promise<void>;
}

const ReportRow: React.FC<ReportRowProps> = ({ report, onClick, onQuickAction }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const quick = async (status: ReportStatus) => {
    setMenuOpen(false);
    await onQuickAction(report.id, status, report.admin_notes);
  };

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center gap-4 hover:border-gray-200 hover:shadow-sm transition-all duration-150 cursor-pointer"
      onClick={onClick}
    >
      {/* Icon */}
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
        report.target_type === 'profile' ? 'bg-[#A0C4FF]/15' : 'bg-gray-100'
      }`}>
        {report.target_type === 'profile'
          ? <User className="w-4 h-4 text-blue-500" />
          : <MessageSquare className="w-4 h-4 text-text/40" />}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-text truncate">
            {REASON_LABELS[report.reason] || report.reason}
          </span>
          <TypeBadge type={report.target_type} />
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-text/35">
            {new Date(report.created_at).toLocaleDateString('es-ES', {
              day: '2-digit', month: '2-digit', year: '2-digit',
            })}
          </span>
          {report.details && (
            <span className="text-xs text-text/30 truncate max-w-[180px]">{report.details}</span>
          )}
        </div>
      </div>

      {/* Status + menu */}
      <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
        <StatusBadge status={report.status} />

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="p-1.5 rounded-lg text-text/30 hover:text-text/55 hover:bg-gray-50 transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-gray-100 shadow-lg z-20 py-1 animate-in fade-in slide-in-from-top-1 duration-100">
              {(Object.keys(STATUS_CONFIG) as ReportStatus[])
                .filter(s => s !== report.status)
                .map(s => (
                  <button
                    key={s}
                    onClick={() => quick(s)}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-text/65 hover:bg-gray-50 hover:text-text transition-colors"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_CONFIG[s].dotColor}`} />
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              {report.target_type === 'profile' && report.genius_profile_id && (
                <>
                  <div className="my-1 border-t border-gray-100" />
                  <a
                    href={`/profile/${report.genius_profile_id}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-text/65 hover:bg-gray-50 hover:text-text transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    Ver perfil
                  </a>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsManagement;
