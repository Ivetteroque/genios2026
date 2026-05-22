import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, MoreVertical, MessageCircle, Eye, Download, X,
  Check, CheckCircle, XCircle, Clock, AlertCircle, Gift,
  Calendar, RefreshCw, Ban, ArrowUpRight, Copy, Zap,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentAdmin } from '../../utils/adminAuthUtils';
import { formatDateToSpanish } from '../../utils/commonUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentRequest {
  id: string;
  genius_profile_id: string | null;
  genius_name: string;
  genius_email: string;
  genius_phone: string;
  activation_type: 'annual_payment' | 'beta_code' | 'pending_payment';
  payment_method: 'yape' | 'plin' | 'transfer';
  amount: number;
  operation_reference: string;
  voucher_url: string;
  status: 'pending' | 'approved' | 'rejected' | 'observed';
  internal_notes: string;
  reviewed_by: string;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface BetaCode {
  id: string;
  code: string;
  description: string;
  duration_days: number;
  max_uses: number;
  used_count: number;
  scope_department: string;
  scope_province: string;
  scope_district: string;
  expires_at: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

interface Membership {
  id: string;
  genius_profile_id: string | null;
  genius_name: string;
  genius_email: string;
  genius_phone: string;
  type: 'beta' | 'annual';
  starts_at: string;
  ends_at: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'suspended';
  extended_by: string;
  extended_at: string | null;
  created_at: string;
}

interface PaymentHistory {
  id: string;
  genius_name: string;
  genius_email: string;
  amount: number;
  payment_method: string;
  operation_reference: string;
  voucher_url: string;
  status: string;
  approved_by: string;
  approved_at: string | null;
  rejected_by: string;
  rejected_at: string | null;
  rejection_reason: string;
  internal_notes: string;
  created_at: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

type Tab = 'pending' | 'beta' | 'memberships' | 'history';

const TABS: { id: Tab; label: string; badge?: number }[] = [
  { id: 'pending', label: 'Pagos pendientes' },
  { id: 'beta', label: 'Códigos beta' },
  { id: 'memberships', label: 'Membresías activas' },
  { id: 'history', label: 'Historial' },
];

const STATUS_CFG: Record<string, { label: string; cls: string; dot: string }> = {
  pending:  { label: 'Pendiente',  cls: 'bg-amber-50 text-amber-700',  dot: 'bg-amber-400' },
  approved: { label: 'Aprobado',   cls: 'bg-green-50 text-green-700',  dot: 'bg-green-400' },
  rejected: { label: 'Rechazado',  cls: 'bg-red-50 text-red-600',      dot: 'bg-red-400' },
  observed: { label: 'Observado',  cls: 'bg-blue-50 text-blue-700',    dot: 'bg-blue-400' },
  active:   { label: 'Activo',     cls: 'bg-green-50 text-green-700',  dot: 'bg-green-400' },
  expiring_soon: { label: 'Por vencer', cls: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400' },
  expired:  { label: 'Vencido',    cls: 'bg-gray-100 text-text/45',    dot: 'bg-gray-300' },
  suspended:{ label: 'Suspendido', cls: 'bg-red-50 text-red-600',      dot: 'bg-red-400' },
};

const METHOD_LABEL: Record<string, string> = {
  yape: 'Yape', plin: 'Plin', transfer: 'Transferencia',
};

const TYPE_LABEL: Record<string, string> = {
  annual_payment: 'Pago anual', beta_code: 'Código beta', pending_payment: 'Pendiente pago',
};

const daysRemaining = (endsAt: string): number => {
  const diff = new Date(endsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ─── Component ────────────────────────────────────────────────────────────────

const PaymentManagement: React.FC = () => {
  const admin = getCurrentAdmin();
  const [tab, setTab] = useState<Tab>('pending');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Data
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [betaCodes, setBetaCodes] = useState<BetaCode[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [detailRequest, setDetailRequest] = useState<PaymentRequest | null>(null);
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [showObsModal, setShowObsModal] = useState<{ id: string; current: string } | null>(null);
  const [showExtendModal, setShowExtendModal] = useState<Membership | null>(null);
  const [obsText, setObsText] = useState('');
  const [extendDays, setExtendDays] = useState('30');
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Beta code form
  const [betaForm, setBetaForm] = useState({
    code: '', description: '', duration_days: '30', max_uses: '10',
    scope_department: '', expires_at: '',
  });

  // ─── Loaders ───────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    const [r, b, m, h] = await Promise.all([
      supabase.from('payment_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('beta_codes').select('*').order('created_at', { ascending: false }),
      supabase.from('memberships').select('*').order('ends_at', { ascending: true }),
      supabase.from('payment_history').select('*').order('created_at', { ascending: false }),
    ]);
    setRequests(r.data ?? []);
    setBetaCodes(b.data ?? []);
    setMemberships((m.data ?? []).map(computeMembershipStatus));
    setHistory(h.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const computeMembershipStatus = (m: any): Membership => {
    const days = daysRemaining(m.ends_at);
    let status: Membership['status'] = 'active';
    if (m.status === 'suspended') status = 'suspended';
    else if (days === 0) status = 'expired';
    else if (days <= 14) status = 'expiring_soon';
    return { ...m, status };
  };

  // ─── Metrics ───────────────────────────────────────────────────────────────

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const activeMemCount = memberships.filter(m => m.status === 'active' || m.status === 'expiring_soon').length;
  const activeBetaCount = betaCodes.filter(b => b.is_active).length;
  const revenue = history.filter(h => h.status === 'approved').reduce((s, h) => s + (h.amount || 0), 0);

  const metrics = [
    { label: 'Pendientes', value: pendingCount, bg: 'bg-amber-50', border: 'border-amber-100', warn: pendingCount > 0 },
    { label: 'Membresías activas', value: activeMemCount, bg: 'bg-[#C0FDFB]/30', border: 'border-[#C0FDFB]' },
    { label: 'Códigos beta activos', value: activeBetaCount, bg: 'bg-[#A0C4FF]/15', border: 'border-[#A0C4FF]/50' },
    { label: 'Ingresos aprobados', value: `S/ ${revenue.toLocaleString()}`, bg: 'bg-white', border: 'border-gray-100' },
  ];

  // ─── Actions ───────────────────────────────────────────────────────────────

  const approveRequest = async (req: PaymentRequest) => {
    if (!window.confirm(`¿Aprobar pago de ${req.genius_name}?\nEsto activará su membresía por 365 días.`)) return;
    setProcessing(true);
    const now = new Date().toISOString();
    const endsAt = new Date(Date.now() + 365 * 86400000).toISOString();
    await supabase.from('payment_requests').update({
      status: 'approved', reviewed_by: admin?.email ?? '', reviewed_at: now, updated_at: now,
    }).eq('id', req.id);
    await supabase.from('memberships').upsert({
      genius_profile_id: req.genius_profile_id,
      genius_name: req.genius_name,
      genius_email: req.genius_email,
      genius_phone: req.genius_phone,
      type: 'annual',
      starts_at: now,
      ends_at: endsAt,
      status: 'active',
      payment_request_id: req.id,
    }, { onConflict: 'genius_profile_id' });
    await supabase.from('payment_history').insert({
      genius_profile_id: req.genius_profile_id,
      genius_name: req.genius_name,
      genius_email: req.genius_email,
      amount: req.amount,
      payment_method: req.payment_method,
      operation_reference: req.operation_reference,
      voucher_url: req.voucher_url,
      status: 'approved',
      approved_by: admin?.email ?? '',
      approved_at: now,
    });
    setProcessing(false);
    setDetailRequest(null);
    load();
  };

  const rejectRequest = async (req: PaymentRequest, reason: string) => {
    const now = new Date().toISOString();
    await supabase.from('payment_requests').update({
      status: 'rejected', reviewed_by: admin?.email ?? '', reviewed_at: now,
      internal_notes: reason, updated_at: now,
    }).eq('id', req.id);
    await supabase.from('payment_history').insert({
      genius_profile_id: req.genius_profile_id, genius_name: req.genius_name,
      genius_email: req.genius_email, amount: req.amount,
      payment_method: req.payment_method, operation_reference: req.operation_reference,
      status: 'rejected', rejected_by: admin?.email ?? '',
      rejected_at: now, rejection_reason: reason,
    });
    setDetailRequest(null);
    load();
  };

  const saveObs = async () => {
    if (!showObsModal) return;
    await supabase.from('payment_requests').update({ internal_notes: obsText, updated_at: new Date().toISOString() }).eq('id', showObsModal.id);
    setShowObsModal(null);
    setObsText('');
    load();
  };

  const createBetaCode = async () => {
    if (!betaForm.code.trim()) return;
    setProcessing(true);
    await supabase.from('beta_codes').insert({
      code: betaForm.code.trim().toUpperCase(),
      description: betaForm.description,
      duration_days: parseInt(betaForm.duration_days) || 30,
      max_uses: parseInt(betaForm.max_uses) || 10,
      used_count: 0,
      scope_department: betaForm.scope_department,
      expires_at: betaForm.expires_at || null,
      is_active: true,
      created_by: admin?.email ?? '',
    });
    setProcessing(false);
    setShowBetaModal(false);
    setBetaForm({ code: '', description: '', duration_days: '30', max_uses: '10', scope_department: '', expires_at: '' });
    load();
  };

  const toggleBetaCode = async (code: BetaCode) => {
    await supabase.from('beta_codes').update({ is_active: !code.is_active, updated_at: new Date().toISOString() }).eq('id', code.id);
    load();
  };

  const extendMembership = async (m: Membership, days: number) => {
    const base = new Date(Math.max(Date.now(), new Date(m.ends_at).getTime()));
    base.setDate(base.getDate() + days);
    await supabase.from('memberships').update({
      ends_at: base.toISOString(), status: 'active',
      extended_by: admin?.email ?? '', extended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', m.id);
    setShowExtendModal(null);
    load();
  };

  const suspendMembership = async (m: Membership) => {
    if (!window.confirm(`¿Suspender membresía de ${m.genius_name}?`)) return;
    await supabase.from('memberships').update({
      status: 'suspended', suspended_by: admin?.email ?? '',
      suspended_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', m.id);
    load();
  };

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };

  const whatsapp = (phone: string, name: string) => {
    const msg = encodeURIComponent(`Hola ${name}, te contactamos desde Genios a la Obra respecto a tu pago.`);
    window.open(`https://wa.me/51${phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
  };

  // ─── Filter helpers ────────────────────────────────────────────────────────

  const q = search.toLowerCase();
  const filtRequests = requests.filter(r =>
    (r.genius_name.toLowerCase().includes(q) || r.genius_email.toLowerCase().includes(q)) &&
    (statusFilter === 'all' || r.status === statusFilter)
  );
  const filtBeta = betaCodes.filter(c =>
    c.code.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
  );
  const filtMem = memberships.filter(m =>
    (m.genius_name.toLowerCase().includes(q) || m.genius_email.toLowerCase().includes(q)) &&
    (statusFilter === 'all' || m.status === statusFilter)
  );
  const filtHistory = history.filter(h =>
    h.genius_name.toLowerCase().includes(q) || h.genius_email.toLowerCase().includes(q)
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="space-y-5 max-w-5xl">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-lg font-semibold text-text">Pagos y Membresías</h1>
            <p className="text-sm text-text/40 mt-0.5">Revisa solicitudes, gestiona membresías y administra códigos beta</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                const data = JSON.stringify({ requests, betaCodes, memberships, history }, null, 2);
                const a = document.createElement('a');
                a.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(data);
                a.download = `pagos_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-text/55 bg-white border border-gray-200 hover:border-gray-300 hover:text-text transition-colors"
            >
              <Download style={{ width: 14, height: 14 }} />
              Exportar
            </button>
            {tab === 'beta' && (
              <button
                onClick={() => setShowBetaModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-white bg-text hover:bg-text/85 transition-colors"
              >
                <Plus style={{ width: 14, height: 14 }} />
                Nuevo código
              </button>
            )}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-2.5">
          {metrics.map(({ label, value, bg, border, warn }) => (
            <div key={label} className={`${bg} border ${border} rounded-xl px-3 py-3 text-center`}>
              <p className={`font-heading text-xl font-semibold ${warn ? 'text-amber-600' : 'text-text'}`}>{value}</p>
              <p className="text-[11px] text-text/40 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs + filters */}
        <div className="bg-white rounded-xl border border-gray-100">
          {/* Tab bar */}
          <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-gray-100 overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setStatusFilter('all'); setSearch(''); }}
                className={`relative px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  tab === t.id
                    ? 'border-text text-text'
                    : 'border-transparent text-text/40 hover:text-text/65'
                }`}
              >
                {t.label}
                {t.id === 'pending' && pendingCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-400 text-white text-[9px] font-bold">{pendingCount}</span>
                )}
              </button>
            ))}
          </div>

          {/* Filters row */}
          <div className="px-4 py-3 flex flex-wrap items-center gap-2.5 border-b border-gray-50">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text/25" />
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-text/15 focus:border-text/25 placeholder:text-text/25 transition-colors"
              />
            </div>
            {(tab === 'pending' || tab === 'memberships') && (
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-text/15 text-text/60 transition-colors"
              >
                <option value="all">Todos los estados</option>
                {tab === 'pending'
                  ? <>
                      <option value="pending">Pendiente</option>
                      <option value="approved">Aprobado</option>
                      <option value="rejected">Rechazado</option>
                      <option value="observed">Observado</option>
                    </>
                  : <>
                      <option value="active">Activo</option>
                      <option value="expiring_soon">Por vencer</option>
                      <option value="expired">Vencido</option>
                      <option value="suspended">Suspendido</option>
                    </>
                }
              </select>
            )}
            <span className="text-xs text-text/30 ml-auto whitespace-nowrap">
              {tab === 'pending' && `${filtRequests.length} solicitudes`}
              {tab === 'beta' && `${filtBeta.length} códigos`}
              {tab === 'memberships' && `${filtMem.length} membresías`}
              {tab === 'history' && `${filtHistory.length} registros`}
            </span>
          </div>

          {/* Content */}
          <div className="p-4">
            {loading ? (
              <div className="py-12 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-text/30" />
              </div>
            ) : (
              <>
                {/* ── Pagos pendientes ── */}
                {tab === 'pending' && (
                  <div className="space-y-2.5">
                    {filtRequests.length === 0 ? (
                      <EmptyState icon={<Clock className="w-7 h-7" />} title="Sin solicitudes de pago" sub="Las solicitudes aparecerán aquí cuando un genio envíe su comprobante." />
                    ) : filtRequests.map(req => {
                      const s = STATUS_CFG[req.status] ?? STATUS_CFG.pending;
                      const isOpen = activeDropdown === req.id;
                      return (
                        <div key={req.id} className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center gap-4 hover:border-gray-200 hover:shadow-sm transition-all duration-150">
                          {/* Avatar placeholder */}
                          <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm font-medium text-text/40">
                            {req.genius_name.charAt(0).toUpperCase()}
                          </div>

                          {/* Main info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-text">{req.genius_name}</p>
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-text/50">{TYPE_LABEL[req.activation_type] ?? req.activation_type}</span>
                            </div>
                            <p className="text-xs text-text/40 mt-0.5 truncate">{req.genius_email}</p>
                            <div className="flex items-center gap-3 mt-1">
                              {req.amount > 0 && <span className="text-[11px] font-semibold text-text">S/ {req.amount}</span>}
                              {req.payment_method && <span className="text-[11px] text-text/40">{METHOD_LABEL[req.payment_method]}</span>}
                              {req.operation_reference && <span className="text-[11px] font-mono text-text/35">{req.operation_reference}</span>}
                            </div>
                          </div>

                          {/* Date */}
                          <div className="hidden md:block text-center flex-shrink-0">
                            <p className="text-xs text-text/45">{fmtDate(req.created_at)}</p>
                            <p className="text-[10px] text-text/25 mt-0.5">Solicitud</p>
                          </div>

                          {/* Status */}
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full flex-shrink-0 ${s.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>

                          {/* Quick actions */}
                          {req.status === 'pending' && (
                            <>
                              <button
                                onClick={() => approveRequest(req)}
                                disabled={processing}
                                title="Aprobar pago"
                                className="p-1.5 text-text/25 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors flex-shrink-0"
                              >
                                <CheckCircle style={{ width: 15, height: 15 }} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => whatsapp(req.genius_phone, req.genius_name)}
                            title="WhatsApp"
                            className="p-1.5 text-text/25 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors flex-shrink-0"
                          >
                            <MessageCircle style={{ width: 15, height: 15 }} />
                          </button>
                          <button
                            onClick={() => setDetailRequest(req)}
                            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs text-text/55 border border-gray-200 rounded-lg hover:border-gray-300 hover:text-text transition-colors flex-shrink-0"
                          >
                            <Eye style={{ width: 12, height: 12 }} />
                            Ver
                          </button>

                          {/* Actions dropdown */}
                          <div className="relative flex-shrink-0">
                            <button onClick={() => setActiveDropdown(isOpen ? null : req.id)} className="p-1.5 text-text/25 hover:text-text/55 hover:bg-gray-50 rounded-lg transition-colors">
                              <MoreVertical style={{ width: 15, height: 15 }} />
                            </button>
                            {isOpen && (
                              <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl border border-gray-100 shadow-lg z-20 overflow-hidden">
                                <div className="py-1.5">
                                  <DDItem icon={Eye} label="Ver detalle" onClick={() => { setDetailRequest(req); setActiveDropdown(null); }} />
                                  {req.status === 'pending' && <DDItem icon={CheckCircle} label="Aprobar pago" onClick={() => { approveRequest(req); setActiveDropdown(null); }} />}
                                  {req.status === 'pending' && <DDItem icon={XCircle} label="Rechazar pago" onClick={() => { setDetailRequest(req); setActiveDropdown(null); }} />}
                                  <DDItem icon={AlertCircle} label="Agregar observación" onClick={() => { setShowObsModal({ id: req.id, current: req.internal_notes }); setObsText(req.internal_notes); setActiveDropdown(null); }} />
                                  <DDItem icon={MessageCircle} label="WhatsApp" onClick={() => { whatsapp(req.genius_phone, req.genius_name); setActiveDropdown(null); }} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Códigos beta ── */}
                {tab === 'beta' && (
                  <div className="space-y-2.5">
                    {filtBeta.length === 0 ? (
                      <EmptyState icon={<Gift className="w-7 h-7" />} title="Sin códigos beta" sub="Crea el primer código beta para activar cuentas de genios.">
                        <button onClick={() => setShowBetaModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-white bg-text hover:bg-text/85 transition-colors">
                          <Plus style={{ width: 14, height: 14 }} />
                          Nuevo código
                        </button>
                      </EmptyState>
                    ) : filtBeta.map(code => {
                      const usedPct = code.max_uses > 0 ? Math.round((code.used_count / code.max_uses) * 100) : 0;
                      const expired = code.expires_at && new Date(code.expires_at) < new Date();
                      return (
                        <div key={code.id} className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center gap-4 hover:border-gray-200 hover:shadow-sm transition-all duration-150">
                          {/* Code badge */}
                          <div className="flex-shrink-0">
                            <button
                              onClick={() => copyCode(code.code)}
                              title="Copiar código"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors group"
                            >
                              <span className="font-mono text-sm font-semibold text-text tracking-wide">{code.code}</span>
                              {copied === code.code
                                ? <Check style={{ width: 12, height: 12 }} className="text-green-500" />
                                : <Copy style={{ width: 12, height: 12 }} className="text-text/30 group-hover:text-text/55" />
                              }
                            </button>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-text/60 truncate">{code.description || 'Sin descripción'}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[11px] text-text/40">{code.duration_days} días</span>
                              {code.scope_department && <span className="text-[11px] text-text/35">{code.scope_department}</span>}
                              {code.expires_at && <span className={`text-[11px] ${expired ? 'text-red-400' : 'text-text/35'}`}>Exp: {fmtDate(code.expires_at)}</span>}
                            </div>
                          </div>

                          {/* Usage bar */}
                          <div className="hidden md:flex flex-col items-end gap-1 flex-shrink-0 w-28">
                            <p className="text-xs text-text/50">{code.used_count}/{code.max_uses} usos</p>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full bg-[#A0C4FF] transition-all" style={{ width: `${usedPct}%` }} />
                            </div>
                          </div>

                          {/* Status */}
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full flex-shrink-0 ${code.is_active && !expired ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-text/45'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${code.is_active && !expired ? 'bg-green-400' : 'bg-gray-300'}`} />
                            {code.is_active && !expired ? 'Activo' : 'Inactivo'}
                          </span>

                          {/* Toggle */}
                          <button
                            onClick={() => toggleBetaCode(code)}
                            title={code.is_active ? 'Desactivar' : 'Activar'}
                            className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${code.is_active ? 'text-text/25 hover:text-red-400 hover:bg-red-50' : 'text-text/25 hover:text-green-500 hover:bg-green-50'}`}
                          >
                            {code.is_active ? <Ban style={{ width: 15, height: 15 }} /> : <Zap style={{ width: 15, height: 15 }} />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Membresías activas ── */}
                {tab === 'memberships' && (
                  <div className="space-y-2.5">
                    {filtMem.length === 0 ? (
                      <EmptyState icon={<Calendar className="w-7 h-7" />} title="Sin membresías" sub="Las membresías activas aparecerán aquí." />
                    ) : filtMem.map(m => {
                      const s = STATUS_CFG[m.status] ?? STATUS_CFG.active;
                      const days = daysRemaining(m.ends_at);
                      const isOpen = activeDropdown === m.id;
                      return (
                        <div key={m.id} className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center gap-4 hover:border-gray-200 hover:shadow-sm transition-all duration-150">
                          <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm font-medium text-text/40">
                            {m.genius_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text">{m.genius_name}</p>
                            <p className="text-xs text-text/40 mt-0.5 truncate">{m.genius_email}</p>
                          </div>
                          {/* Type */}
                          <span className={`hidden md:inline-flex text-[10px] font-medium px-2 py-1 rounded-full flex-shrink-0 ${m.type === 'annual' ? 'bg-[#C0FDFB]/40 text-teal-700' : 'bg-[#A0C4FF]/20 text-blue-700'}`}>
                            {m.type === 'annual' ? 'Anual' : 'Beta'}
                          </span>
                          {/* Dates */}
                          <div className="hidden lg:flex flex-col text-right flex-shrink-0">
                            <p className="text-xs text-text/45">{fmtDate(m.starts_at)} → {fmtDate(m.ends_at)}</p>
                            <p className={`text-[11px] font-medium mt-0.5 ${days <= 14 ? 'text-amber-500' : 'text-text/35'}`}>{days > 0 ? `${days} días restantes` : 'Vencido'}</p>
                          </div>
                          {/* Status */}
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full flex-shrink-0 ${s.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                          <button onClick={() => whatsapp(m.genius_phone, m.genius_name)} title="WhatsApp" className="p-1.5 text-text/25 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors flex-shrink-0">
                            <MessageCircle style={{ width: 15, height: 15 }} />
                          </button>
                          {/* Actions dropdown */}
                          <div className="relative flex-shrink-0">
                            <button onClick={() => setActiveDropdown(isOpen ? null : m.id)} className="p-1.5 text-text/25 hover:text-text/55 hover:bg-gray-50 rounded-lg transition-colors">
                              <MoreVertical style={{ width: 15, height: 15 }} />
                            </button>
                            {isOpen && (
                              <div className="absolute right-0 mt-1.5 w-48 bg-white rounded-xl border border-gray-100 shadow-lg z-20 overflow-hidden">
                                <div className="py-1.5">
                                  <DDItem icon={ArrowUpRight} label="Extender membresía" onClick={() => { setShowExtendModal(m); setActiveDropdown(null); }} />
                                  <DDItem icon={RefreshCw} label="Renovar (365 días)" onClick={() => { extendMembership(m, 365); setActiveDropdown(null); }} />
                                  <DDItem icon={Ban} label="Suspender" onClick={() => { suspendMembership(m); setActiveDropdown(null); }} />
                                  <DDItem icon={MessageCircle} label="WhatsApp" onClick={() => { whatsapp(m.genius_phone, m.genius_name); setActiveDropdown(null); }} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Historial ── */}
                {tab === 'history' && (
                  <div className="space-y-2.5">
                    {filtHistory.length === 0 ? (
                      <EmptyState icon={<Clock className="w-7 h-7" />} title="Sin historial" sub="Aquí aparecerán todos los movimientos de pago." />
                    ) : filtHistory.map(h => {
                      const s = STATUS_CFG[h.status] ?? STATUS_CFG.approved;
                      return (
                        <div key={h.id} className="bg-white rounded-xl border border-gray-100 px-5 py-3.5 flex items-center gap-4 hover:border-gray-200 transition-all duration-150">
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-medium text-text/40">
                            {h.genius_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text">{h.genius_name}</p>
                            <p className="text-xs text-text/40 truncate">{h.genius_email}</p>
                          </div>
                          {h.amount > 0 && <span className="text-sm font-semibold text-text flex-shrink-0">S/ {h.amount}</span>}
                          {h.payment_method && <span className="text-xs text-text/40 flex-shrink-0">{METHOD_LABEL[h.payment_method] ?? h.payment_method}</span>}
                          <span className="text-xs text-text/30 flex-shrink-0 hidden md:block">{fmtDate(h.created_at)}</span>
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-full flex-shrink-0 ${s.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                          {h.approved_by && <span className="text-[10px] text-text/30 flex-shrink-0 hidden lg:block">por {h.approved_by.split('@')[0]}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Backdrop ── */}
      {activeDropdown && <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />}

      {/* ── Detail / approve / reject modal ── */}
      {detailRequest && (
        <MiniModal title={`Solicitud — ${detailRequest.genius_name}`} onClose={() => setDetailRequest(null)} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <DetailRow label="Genio" value={detailRequest.genius_name} />
              <DetailRow label="Correo" value={detailRequest.genius_email} />
              <DetailRow label="Teléfono" value={`+51 ${detailRequest.genius_phone}`} />
              <DetailRow label="Tipo" value={TYPE_LABEL[detailRequest.activation_type]} />
              <DetailRow label="Método" value={METHOD_LABEL[detailRequest.payment_method] ?? detailRequest.payment_method} />
              {detailRequest.amount > 0 && <DetailRow label="Monto" value={`S/ ${detailRequest.amount}`} bold />}
              {detailRequest.operation_reference && <DetailRow label="Referencia" value={detailRequest.operation_reference} mono />}
              <DetailRow label="Fecha" value={fmtDate(detailRequest.created_at)} />
            </div>
            {detailRequest.voucher_url && (
              <div>
                <p className="text-xs font-medium text-text/45 mb-1.5">Comprobante</p>
                <img src={detailRequest.voucher_url} alt="Comprobante" className="w-full max-h-60 object-contain rounded-lg border border-gray-100" />
              </div>
            )}
            {detailRequest.internal_notes && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                <p className="text-xs text-amber-700">{detailRequest.internal_notes}</p>
              </div>
            )}
            {detailRequest.status === 'pending' && (
              <div className="flex gap-2 pt-1">
                <button onClick={() => approveRequest(detailRequest)} disabled={processing} className="flex-1 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50">
                  {processing ? 'Procesando...' : 'Aprobar pago'}
                </button>
                <button
                  onClick={async () => {
                    const reason = window.prompt('Razón del rechazo:');
                    if (reason) rejectRequest(detailRequest, reason);
                  }}
                  disabled={processing}
                  className="flex-1 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  Rechazar
                </button>
              </div>
            )}
          </div>
        </MiniModal>
      )}

      {/* ── Observation modal ── */}
      {showObsModal && (
        <MiniModal title="Observación interna" onClose={() => { setShowObsModal(null); setObsText(''); }}>
          <textarea
            value={obsText}
            onChange={e => setObsText(e.target.value)}
            rows={3}
            placeholder="Escribe una observación interna sobre este pago..."
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-text/15 resize-none placeholder:text-text/25"
          />
          <div className="flex gap-2 mt-3">
            <button onClick={saveObs} className="flex-1 py-2 text-sm font-medium text-white bg-text hover:bg-text/85 rounded-lg transition-colors">Guardar</button>
            <button onClick={() => { setShowObsModal(null); setObsText(''); }} className="flex-1 py-2 text-sm text-text/50 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
          </div>
        </MiniModal>
      )}

      {/* ── Extend modal ── */}
      {showExtendModal && (
        <MiniModal title={`Extender membresía — ${showExtendModal.genius_name}`} onClose={() => setShowExtendModal(null)}>
          <div className="space-y-3">
            <div className="text-sm text-text/55 bg-gray-50 rounded-lg px-3 py-2.5">
              Vence: <span className="font-medium text-text">{fmtDate(showExtendModal.ends_at)}</span>
              {' '}· <span className={daysRemaining(showExtendModal.ends_at) <= 14 ? 'text-amber-500 font-medium' : ''}>{daysRemaining(showExtendModal.ends_at)} días restantes</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-text/45 mb-1.5">Días a extender</label>
              <select value={extendDays} onChange={e => setExtendDays(e.target.value)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-text/15">
                <option value="7">7 días</option>
                <option value="14">14 días</option>
                <option value="30">30 días</option>
                <option value="60">60 días</option>
                <option value="90">90 días</option>
                <option value="180">180 días</option>
                <option value="365">365 días (1 año)</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => extendMembership(showExtendModal, parseInt(extendDays))} className="flex-1 py-2 text-sm font-medium text-white bg-text hover:bg-text/85 rounded-lg transition-colors">
                Extender {extendDays} días
              </button>
              <button onClick={() => setShowExtendModal(null)} className="flex-1 py-2 text-sm text-text/50 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
            </div>
          </div>
        </MiniModal>
      )}

      {/* ── New beta code modal ── */}
      {showBetaModal && (
        <MiniModal title="Nuevo código beta" onClose={() => setShowBetaModal(false)}>
          <div className="space-y-3">
            <FormField label="Código *">
              <input type="text" value={betaForm.code} onChange={e => setBetaForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} className={miniInput} placeholder="Ej: TACNA30" maxLength={20} />
            </FormField>
            <FormField label="Descripción">
              <input type="text" value={betaForm.description} onChange={e => setBetaForm(p => ({ ...p, description: e.target.value }))} className={miniInput} placeholder="Para qué sirve este código..." />
            </FormField>
            <div className="grid grid-cols-2 gap-2.5">
              <FormField label="Duración (días)">
                <select value={betaForm.duration_days} onChange={e => setBetaForm(p => ({ ...p, duration_days: e.target.value }))} className={miniInput}>
                  {[7, 14, 30, 60, 90, 180, 365].map(d => <option key={d} value={d}>{d} días</option>)}
                </select>
              </FormField>
              <FormField label="Límite de usos">
                <input type="number" value={betaForm.max_uses} min={1} onChange={e => setBetaForm(p => ({ ...p, max_uses: e.target.value }))} className={miniInput} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <FormField label="Departamento (opcional)">
                <input type="text" value={betaForm.scope_department} onChange={e => setBetaForm(p => ({ ...p, scope_department: e.target.value }))} className={miniInput} placeholder="Tacna, Lima..." />
              </FormField>
              <FormField label="Fecha expiración (opcional)">
                <input type="date" value={betaForm.expires_at} onChange={e => setBetaForm(p => ({ ...p, expires_at: e.target.value }))} className={miniInput} />
              </FormField>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={createBetaCode} disabled={!betaForm.code.trim() || processing} className="flex-1 py-2 text-sm font-medium text-white bg-text hover:bg-text/85 rounded-lg transition-colors disabled:opacity-40">
                {processing ? 'Creando...' : 'Crear código'}
              </button>
              <button onClick={() => setShowBetaModal(false)} className="flex-1 py-2 text-sm text-text/50 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
            </div>
          </div>
        </MiniModal>
      )}
    </>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const miniInput = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-text/15 focus:border-text/25 placeholder:text-text/25 transition-colors';

const DDItem: React.FC<{ icon?: React.FC<any>; label: string; onClick: () => void }> = ({ icon: Icon, label, onClick }) => (
  <button onClick={onClick} className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-text/60 hover:bg-gray-50 hover:text-text w-full text-left transition-colors">
    {Icon && <Icon style={{ width: 13, height: 13, flexShrink: 0 }} />}
    {label}
  </button>
);

const MiniModal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }> = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 bg-black/25 z-50 flex items-center justify-center p-4">
    <div className={`bg-white rounded-2xl w-full shadow-xl ${wide ? 'max-w-lg' : 'max-w-sm'}`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-text">{title}</h3>
        <button onClick={onClose} className="p-1 text-text/30 hover:text-text/60 rounded-lg hover:bg-gray-50 transition-colors">
          <X style={{ width: 15, height: 15 }} />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

const EmptyState: React.FC<{ icon: React.ReactNode; title: string; sub: string; children?: React.ReactNode }> = ({ icon, title, sub, children }) => (
  <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-50 mb-3 text-text/25">{icon}</div>
    <p className="text-sm font-medium text-text mb-1">{title}</p>
    <p className="text-sm text-text/40 mb-5">{sub}</p>
    {children}
  </div>
);

const DetailRow: React.FC<{ label: string; value: string; bold?: boolean; mono?: boolean }> = ({ label, value, bold, mono }) => (
  <div>
    <p className="text-[10px] font-medium text-text/40 uppercase tracking-wide mb-0.5">{label}</p>
    <p className={`text-sm text-text ${bold ? 'font-semibold' : ''} ${mono ? 'font-mono' : ''}`}>{value}</p>
  </div>
);

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-xs font-medium text-text/45 mb-1.5">{label}</label>
    {children}
  </div>
);

export default PaymentManagement;
