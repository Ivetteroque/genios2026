import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle, Clock, ExternalLink, FileText, Search, ShieldCheck, X, XCircle } from 'lucide-react';
import { getCurrentAdmin } from '../../utils/adminAuthUtils';
import {
  type GeniusDocument,
  type GeniusWithDocuments,
  approveVerification,
  listGeniusesWithDocuments,
  rejectVerification,
} from '../../services/adminGeniusService';
import { IDENTITY_DOCUMENTS_BUCKET, getPrivateFileUrl } from '../../services/membershipService';

/**
 * Verificación de identidad. El genio sube su DNI a un bucket privado; aquí el
 * admin lo revisa y lo aprueba (insignia "Verificado" en el directorio) o lo
 * rechaza con un motivo que el genio verá. Si el genio cambia su DNI, la base
 * lo devuelve solo a "pendiente".
 */

type Filter = 'pending' | 'verified' | 'rejected' | 'all';

const STATUS: Record<GeniusWithDocuments['verification_status'], { label: string; cls: string; icon: React.FC<{ className?: string }> }> = {
  none:     { label: 'Sin DNI',     cls: 'bg-gray-100 text-text/45',   icon: FileText },
  pending:  { label: 'Por revisar', cls: 'bg-amber-50 text-amber-700', icon: Clock },
  verified: { label: 'Verificado',  cls: 'bg-green-50 text-green-700', icon: CheckCircle },
  rejected: { label: 'Rechazado',   cls: 'bg-red-50 text-red-600',     icon: XCircle },
};

const DOC_LABEL: Record<string, string> = { dni: 'DNI', certificate: 'Certificado Único Laboral', other: 'Documento' };

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const DocumentManagement: React.FC = () => {
  const [genios, setGenios] = useState<GeniusWithDocuments[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState<Filter>('pending');
  const [search, setSearch] = useState('');
  const [rejecting, setRejecting] = useState<GeniusWithDocuments | null>(null);
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      setGenios(await listGeniusesWithDocuments());
    } catch (error) {
      console.error('Error cargando documentos:', error);
      setLoadError('No se pudieron cargar los documentos. Revisa tu sesión de admin.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => ({
    pending: genios.filter((g) => g.verification_status === 'pending').length,
    verified: genios.filter((g) => g.verification_status === 'verified').length,
    rejected: genios.filter((g) => g.verification_status === 'rejected').length,
    all: genios.length,
  }), [genios]);

  const visible = useMemo(() => {
    const q = search.toLowerCase();
    return genios.filter((g) =>
      (filter === 'all' || g.verification_status === filter) &&
      (!q || `${g.full_name} ${g.email}`.toLowerCase().includes(q))
    );
  }, [genios, filter, search]);

  const adminEmail = getCurrentAdmin()?.email ?? 'admin';

  const approve = async (g: GeniusWithDocuments) => {
    if (!window.confirm(`¿Aprobar el DNI de ${g.full_name}?\nAparecerá como "Verificado" en el directorio.`)) return;
    setProcessing(g.id);
    try {
      await approveVerification(g.id, adminEmail);
      await load();
    } catch (error) {
      console.error('Error aprobando el DNI:', error);
      alert('No se pudo aprobar. Inténtalo de nuevo.');
    } finally {
      setProcessing(null);
    }
  };

  const reject = async () => {
    if (!rejecting || !reason.trim()) return;
    setProcessing(rejecting.id);
    try {
      await rejectVerification(rejecting.id, adminEmail, reason.trim());
      setRejecting(null);
      setReason('');
      await load();
    } catch (error) {
      console.error('Error rechazando el DNI:', error);
      alert('No se pudo rechazar. Inténtalo de nuevo.');
    } finally {
      setProcessing(null);
    }
  };

  const tabs: { id: Filter; label: string }[] = [
    { id: 'pending', label: 'Por revisar' },
    { id: 'verified', label: 'Verificados' },
    { id: 'rejected', label: 'Rechazados' },
    { id: 'all', label: 'Todos' },
  ];

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="font-heading text-lg font-semibold text-text">Documentos</h1>
        <p className="text-sm text-text/40 mt-0.5">
          Revisa el DNI de cada genio. Al aprobarlo, su perfil muestra la insignia "Verificado".
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Estado de verificación">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={filter === t.id}
              onClick={() => setFilter(t.id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === t.id ? 'bg-text text-white' : 'text-text/55 hover:bg-gray-50'
              }`}
            >
              {t.label} <span className="opacity-60">{counts[t.id]}</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text/25" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar genio..."
            aria-label="Buscar genio"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-text/15 placeholder:text-text/25"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => <div key={i} className="h-28 bg-white rounded-xl border border-gray-100 animate-pulse" />)}
        </div>
      ) : loadError ? (
        <div className="bg-white rounded-xl border border-red-100 py-10 text-center">
          <p className="text-sm text-red-600 mb-3">{loadError}</p>
          <button onClick={load} className="text-sm text-text/60 underline">Reintentar</button>
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-14 text-center">
          <ShieldCheck className="w-8 h-8 text-text/20 mx-auto mb-3" />
          <p className="text-sm font-medium text-text mb-1">
            {filter === 'pending' ? 'No hay DNI pendientes de revisión' : 'No hay genios en esta lista'}
          </p>
          <p className="text-sm text-text/40">Cuando un genio sube su DNI, aparece aquí para revisarlo.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((g) => {
            const status = STATUS[g.verification_status] ?? STATUS.none;
            const StatusIcon = status.icon;
            const hasDni = g.documents.some((d) => d.type === 'dni');
            return (
              <div key={g.id} className="bg-white rounded-xl border border-gray-100 px-5 py-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-text">{g.full_name || 'Sin nombre'}</p>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${status.cls}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-text/40 mt-0.5 truncate">{g.email}</p>
                    {g.verification_status === 'rejected' && g.verification_note && (
                      <p className="text-xs text-red-500 mt-1">Motivo: {g.verification_note}</p>
                    )}
                    {g.verification_status === 'verified' && (
                      <p className="text-[11px] text-text/35 mt-1">Verificado el {fmtDate(g.verified_at)} por {g.verified_by || 'admin'}</p>
                    )}
                  </div>
                  {g.verification_status === 'pending' && hasDni && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => approve(g)}
                        disabled={processing === g.id}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => { setRejecting(g); setReason(''); }}
                        disabled={processing === g.id}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {g.documents.map((doc, i) => <DocumentLink key={doc.id ?? `${doc.type}-${i}`} doc={doc} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rejecting && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text">Rechazar DNI de {rejecting.full_name}</h3>
              <button onClick={() => setRejecting(null)} aria-label="Cerrar" className="p-1 text-text/30 hover:text-text/60">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-text/45 mb-2">El genio verá este motivo y podrá subir otro documento.</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej. La foto está borrosa o no se ve el número."
              className="w-full h-24 p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-text/15 resize-none placeholder:text-text/25"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={reject}
                disabled={!reason.trim() || processing === rejecting.id}
                className="flex-1 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
              >
                Rechazar
              </button>
              <button onClick={() => setRejecting(null)} className="flex-1 py-2 text-sm text-text/50 border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/** Abre el documento con un enlace temporal (bucket privado) o el base64 antiguo. */
const DocumentLink: React.FC<{ doc: GeniusDocument }> = ({ doc }) => {
  const [opening, setOpening] = useState(false);

  const open = async () => {
    setOpening(true);
    // La pestaña se abre antes del await para que el navegador no la bloquee.
    const tab = window.open('', '_blank');
    const url = await getPrivateFileUrl(IDENTITY_DOCUMENTS_BUCKET, doc.url);
    setOpening(false);
    if (!url) {
      tab?.close();
      alert('No se pudo abrir el documento.');
      return;
    }
    if (!tab) return;

    if (!url.startsWith('data:')) {
      tab.location.href = url;
      return;
    }

    // Documento antiguo en base64: se abre como blob, y solo si es imagen o
    // PDF. Un data-URL de otro tipo (p. ej. HTML) correría en el origen del
    // panel con la sesión del admin.
    const blob = await (await fetch(url)).blob();
    if (!blob.type.startsWith('image/') && blob.type !== 'application/pdf') {
      tab.close();
      alert('Formato de documento no admitido.');
      return;
    }
    tab.location.href = URL.createObjectURL(blob);
  };

  return (
    <button
      onClick={open}
      disabled={opening}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-text/60 border border-gray-200 rounded-lg hover:border-gray-300 hover:text-text transition-colors disabled:opacity-50"
    >
      <FileText className="w-3.5 h-3.5" />
      {DOC_LABEL[doc.type] ?? 'Documento'}
      <ExternalLink className="w-3 h-3 opacity-50" />
    </button>
  );
};

export default DocumentManagement;
