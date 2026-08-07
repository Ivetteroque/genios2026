import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserCheck,
  DollarSign,
  MessageSquare,
  Settings,
  LogOut,
  Bell,
  Search,
  CheckCircle,
  XCircle,
  BarChart3,
  Flag,
  Activity,
  Tag,
  MapPin,
  FileText,
  MessageCircle,
  Loader2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Star,
  Heart,
  CreditCard,
  ShieldAlert,
  TrendingUp,
  RefreshCw,
  UserPlus,
} from 'lucide-react';
import { getCurrentAdmin, logoutAdmin, hasPermission } from '../../utils/adminAuthUtils';
import { supabase } from '../../lib/supabase';
import CategoryManagement from './CategoryManagement';
import LocationManagement from './LocationManagement';
import GeniusManagement from './GeniusManagement';
import DocumentManagement from './DocumentManagement';
import PaymentManagement from './PaymentManagement';
import PaymentSettings from './PaymentSettings';
import ReportsManagement from './ReportsManagement';
import CommentsManagement from './CommentsManagement';
import ClientsManagement from './ClientsManagement';
import StatsManagement from './StatsManagement';
import ConfigSettings from './ConfigSettings';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LiveStats {
  totalGenios: number;
  activeGenios: number;
  pendingPayments: number;
  newReports: number;
  pendingComments: number;
  totalClients: number;
  expiringMemberships: number;
  monthlyRevenue: number;
}

interface PendingItem {
  id: string;
  type: 'payment' | 'genius' | 'report' | 'comment' | 'membership';
  label: string;
  sub: string;
  urgency: 'high' | 'medium' | 'low';
  created_at: string;
}

interface ActivityItem {
  id: string;
  type: 'client' | 'genius' | 'payment' | 'report' | 'comment' | 'membership';
  description: string;
  timestamp: string;
  status: 'success' | 'pending' | 'warning';
}

interface AlertItem {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  body: string;
  action?: string;
  tab?: string;
}

const EMPTY_STATS: LiveStats = {
  totalGenios: 0, activeGenios: 0, pendingPayments: 0,
  newReports: 0, pendingComments: 0, totalClients: 0,
  expiringMemberships: 0, monthlyRevenue: 0,
};

const AdminDashboard: React.FC = () => {
  const [currentAdmin, setCurrentAdmin] = useState(getCurrentAdmin());
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [liveStats, setLiveStats] = useState<LiveStats>(EMPTY_STATS);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(false);

  useEffect(() => {
    const admin = getCurrentAdmin();
    if (admin) setCurrentAdmin(admin);
  }, []);

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    const now = new Date();
    const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [
      { count: totalGenios },
      { data: geniusRows },
      { count: pendingPayments },
      { data: oldPendingPayments },
      { count: newReports },
      { data: reportRows },
      { count: pendingComments },
      { data: commentRows },
      { count: totalClients },
      { data: clientRows },
      { data: memberships },
      { data: monthlyPayments },
    ] = await Promise.all([
      supabase.from('genius_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('genius_profiles').select('id, full_name, category, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('payment_requests').select('id, genius_name, created_at').eq('status', 'pending').lt('created_at', twentyFourHoursAgo),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('reports').select('id, reason, target_type, created_at').eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
      supabase.from('genius_reviews').select('*', { count: 'exact', head: true }).eq('moderation_status', 'pending'),
      supabase.from('genius_reviews').select('id, comment, created_at').eq('moderation_status', 'pending').order('created_at', { ascending: false }).limit(3),
      supabase.from('client_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('client_profiles').select('id, full_name, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('memberships').select('id, genius_name, ends_at, status').lte('ends_at', sevenDaysOut).eq('status', 'active').order('ends_at', { ascending: true }).limit(5),
      supabase.from('payment_history').select('amount').gte('created_at', monthStart).eq('status', 'approved'),
    ]);

    const monthlyRevenue = (monthlyPayments || []).reduce((s, r) => s + (r.amount || 0), 0);
    const expiringMemberships = (memberships || []).length;

    setLiveStats({
      totalGenios: totalGenios || 0,
      activeGenios: totalGenios || 0,
      pendingPayments: pendingPayments || 0,
      newReports: newReports || 0,
      pendingComments: pendingComments || 0,
      totalClients: totalClients || 0,
      expiringMemberships,
      monthlyRevenue,
    });

    // Build pending items
    const items: PendingItem[] = [];
    (oldPendingPayments || []).forEach(p => items.push({
      id: p.id, type: 'payment', label: `Pago pendiente: ${p.genius_name}`,
      sub: 'Esperando aprobación', urgency: 'high', created_at: p.created_at,
    }));
    (reportRows || []).slice(0, 3).forEach(r => items.push({
      id: r.id, type: 'report',
      label: `Reporte: ${r.target_type === 'profile' ? 'Perfil' : 'Comentario'}`,
      sub: r.reason, urgency: 'high', created_at: r.created_at,
    }));
    (commentRows || []).forEach(c => items.push({
      id: c.id, type: 'comment', label: `Comentario pendiente`,
      sub: (c.comment || '').slice(0, 60), urgency: 'medium', created_at: c.created_at,
    }));
    (memberships || []).slice(0, 2).forEach(m => items.push({
      id: m.id, type: 'membership', label: `Membresía vence: ${m.genius_name}`,
      sub: `Vence el ${new Date(m.ends_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`,
      urgency: 'low', created_at: m.ends_at,
    }));
    items.sort((a, b) => {
      const ord = { high: 0, medium: 1, low: 2 };
      return ord[a.urgency] - ord[b.urgency];
    });
    setPendingItems(items.slice(0, 8));

    // Build activity feed
    const feed: ActivityItem[] = [];
    (clientRows || []).forEach(c => feed.push({
      id: `client-${c.id}`, type: 'client',
      description: `Nuevo cliente: ${c.full_name || c.id}`,
      timestamp: c.created_at, status: 'success',
    }));
    (geniusRows || []).forEach(g => feed.push({
      id: `genius-${g.id}`, type: 'genius',
      description: `Genio registrado: ${g.full_name} (${g.category})`,
      timestamp: g.created_at, status: 'success',
    }));
    (reportRows || []).forEach(r => feed.push({
      id: `report-${r.id}`, type: 'report',
      description: `Reporte enviado (${r.target_type === 'profile' ? 'perfil' : 'comentario'})`,
      timestamp: r.created_at, status: 'warning',
    }));
    feed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setActivityFeed(feed.slice(0, 8));

    // Build alerts
    const al: AlertItem[] = [];
    if ((oldPendingPayments || []).length > 0)
      al.push({ id: 'old-payments', type: 'error', title: 'Pagos sin revisar', body: `${(oldPendingPayments || []).length} pago(s) pendiente(s) por más de 24 horas.`, action: 'Ver pagos', tab: 'payments' });
    if ((newReports || 0) > 0)
      al.push({ id: 'reports', type: 'error', title: 'Reportes sin resolver', body: `${newReports} reporte(s) pendiente(s) requieren atención.`, action: 'Ver reportes', tab: 'reports' });
    if (expiringMemberships > 0)
      al.push({ id: 'memberships', type: 'warning', title: 'Membresías por vencer', body: `${expiringMemberships} membresía(s) vencen en los próximos 7 días.`, action: 'Ver membresías', tab: 'payments' });
    if ((pendingComments || 0) > 0)
      al.push({ id: 'comments', type: 'warning', title: 'Comentarios sin moderar', body: `${pendingComments} comentario(s) en estado pendiente.`, action: 'Ver comentarios', tab: 'comments' });
    setAlerts(al);

    setLoadingOverview(false);
  }, []);

  useEffect(() => { loadOverview(); }, [loadOverview]);

  const handleLogout = () => {
    if (window.confirm('¿Cerrar sesión?')) logoutAdmin();
  };

  if (!currentAdmin) return null;

  const navItems = [
    { id: 'overview', label: 'Resumen', icon: BarChart3, show: true },
    { id: 'stats', label: 'Estadisticas', icon: TrendingUp, show: true },
    { id: 'genios', label: 'Genios', icon: UserCheck, show: hasPermission('genios'), badge: liveStats.pendingPayments || 0 },
    { id: 'clients', label: 'Clientes', icon: Users, show: true },
    { id: 'documents', label: 'Documentos', icon: FileText, show: true },
    { id: 'categories', label: 'Categorías', icon: Tag, show: true },
    { id: 'locations', label: 'Ubicaciones', icon: MapPin, show: true },
    { id: 'reports', label: 'Reportes', icon: Flag, show: hasPermission('reports'), badge: liveStats.newReports || 0 },
    { id: 'comments', label: 'Comentarios', icon: MessageCircle, show: true, badge: liveStats.pendingComments || 0 },
    { id: 'payments', label: 'Pagos', icon: DollarSign, show: hasPermission('payments'), badge: liveStats.pendingPayments || 0 },
    { id: 'messages', label: 'Mensajes', icon: MessageSquare, show: true },
    { id: 'config', label: 'Configuracion', icon: Settings, show: hasPermission('settings') },
  ].filter(i => i.show);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-heading text-base font-semibold text-text whitespace-nowrap">
              Genios a la Obra
            </span>
            <span className="text-text/20 select-none">/</span>
            <span className="text-sm text-text/45 truncate">Admin</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text/25" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48 pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-text/15 focus:border-text/30 bg-white placeholder:text-text/25 text-text transition-colors"
              />
            </div>

            <button className="relative p-2 text-text/35 hover:text-text/60 transition-colors rounded-lg hover:bg-gray-50">
              <Bell className="w-4.5 h-4.5" style={{ width: '18px', height: '18px' }} />
              {stats.newMessages > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-400 rounded-full" />
              )}
            </button>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-text/10 flex items-center justify-center text-xs font-semibold text-text/60">
                {currentAdmin.name.charAt(0)}
              </div>
              <span className="text-sm text-text/60 hidden sm:block">{currentAdmin.name}</span>
            </div>

            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-2 text-text/30 hover:text-text/60 transition-colors rounded-lg hover:bg-gray-50"
            >
              <LogOut style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-52 bg-white border-r border-gray-100 sticky top-[53px] h-[calc(100vh-53px)] overflow-y-auto flex-shrink-0">
          <nav className="p-3 pt-4">
            {navItems.map(({ id, label, icon: Icon, badge }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 text-sm transition-colors ${
                    active ? 'bg-gray-100 text-text font-medium' : 'text-text/50 hover:bg-gray-50 hover:text-text/75'
                  }`}
                >
                  <Icon style={{ width: '15px', height: '15px', flexShrink: 0 }} />
                  <span className="flex-1">{label}</span>
                  {badge && badge > 0 && (
                    <span className="text-[10px] font-medium bg-text/10 text-text/50 rounded-full px-1.5 py-0.5 leading-none">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-y-auto min-w-0">
          {activeTab === 'overview' && (
            <OverviewPanel
              stats={liveStats}
              pendingItems={pendingItems}
              activityFeed={activityFeed}
              alerts={alerts}
              loading={loadingOverview}
              onRefresh={loadOverview}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'categories' && <CategoryManagement />}
          {activeTab === 'locations' && <LocationManagement />}
          {activeTab === 'genios' && <GeniusManagement />}
          {activeTab === 'documents' && <DocumentManagement />}
          {activeTab === 'payments' && <PaymentManagement />}
          {activeTab === 'reports' && <ReportsManagement />}
          {activeTab === 'comments' && <CommentsManagement />}
          {activeTab === 'clients' && <ClientsManagement />}
          {activeTab === 'stats' && <StatsManagement />}
          {activeTab === 'config' && <ConfigSettings />}

          {!['overview', 'stats', 'categories', 'locations', 'genios', 'clients', 'documents', 'payments', 'config', 'reports', 'comments'].includes(activeTab) && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center max-w-md">
              <p className="text-sm font-medium text-text capitalize mb-1">{activeTab}</p>
              <p className="text-sm text-text/40">Esta sección estará disponible próximamente.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// ─── Overview Panel ───────────────────────────────────────────────────────────

interface OverviewPanelProps {
  stats: LiveStats;
  pendingItems: PendingItem[];
  activityFeed: ActivityItem[];
  alerts: AlertItem[];
  loading: boolean;
  onRefresh: () => void;
  onNavigate: (tab: string) => void;
}

const OverviewPanel: React.FC<OverviewPanelProps> = ({
  stats, pendingItems, activityFeed, alerts, loading, onRefresh, onNavigate,
}) => {
  const fmtCurrency = (n: number) => n > 0 ? `S/ ${n.toLocaleString('es-PE')}` : 'S/ 0';
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  const ACTIVITY_ICONS: Record<string, React.FC<{ className?: string }>> = {
    client: UserPlus, genius: UserCheck, payment: CreditCard,
    report: Flag, comment: MessageCircle, membership: Star,
  };

  const PENDING_ICONS: Record<string, React.FC<{ className?: string }>> = {
    payment: CreditCard, genius: UserCheck, report: Flag,
    comment: MessageCircle, membership: Star,
  };

  const URGENCY: Record<string, string> = {
    high: 'bg-red-50 text-red-500',
    medium: 'bg-amber-50 text-amber-600',
    low: 'bg-gray-50 text-text/40',
  };

  const URGENCY_DOT: Record<string, string> = {
    high: 'bg-red-400',
    medium: 'bg-amber-400',
    low: 'bg-gray-300',
  };

  const ALERT_STYLES: Record<string, { border: string; icon: string; bg: string }> = {
    error:   { border: 'border-red-100',    icon: 'text-red-400',    bg: 'bg-red-50/50' },
    warning: { border: 'border-amber-100',  icon: 'text-amber-500',  bg: 'bg-amber-50/50' },
    info:    { border: 'border-blue-100',   icon: 'text-blue-400',   bg: 'bg-blue-50/30' },
  };

  const statCards = [
    { label: 'Total genios',           value: stats.totalGenios,           icon: UserCheck,    tab: 'genios',   color: '' },
    { label: 'Pagos pendientes',       value: stats.pendingPayments,        icon: CreditCard,   tab: 'payments', color: stats.pendingPayments > 0 ? 'text-amber-600' : '' },
    { label: 'Reportes nuevos',        value: stats.newReports,             icon: Flag,         tab: 'reports',  color: stats.newReports > 0 ? 'text-red-500' : '' },
    { label: 'Comentarios pendientes', value: stats.pendingComments,        icon: MessageCircle,tab: 'comments', color: stats.pendingComments > 0 ? 'text-amber-600' : '' },
    { label: 'Clientes registrados',   value: stats.totalClients,           icon: Users,        tab: 'clients',  color: '' },
    { label: 'Membresías por vencer',  value: stats.expiringMemberships,    icon: Star,         tab: 'payments', color: stats.expiringMemberships > 0 ? 'text-amber-600' : '' },
    { label: 'Ingresos del mes',       value: fmtCurrency(stats.monthlyRevenue), icon: DollarSign, tab: 'payments', color: 'text-green-600', raw: true },
  ];

  const quickActions = [
    { label: 'Ver pagos pendientes', icon: CreditCard, tab: 'payments', color: 'text-amber-600 bg-amber-50 hover:bg-amber-100' },
    { label: 'Ver reportes',         icon: Flag,        tab: 'reports',  color: 'text-red-500  bg-red-50   hover:bg-red-100' },
    { label: 'Ver comentarios',      icon: MessageCircle,tab:'comments', color: 'text-blue-600 bg-blue-50  hover:bg-blue-100' },
    { label: 'Ver clientes',         icon: Users,       tab: 'clients',  color: 'text-green-700 bg-green-50 hover:bg-green-100' },
    { label: 'Ver membresías',       icon: Star,        tab: 'payments', color: 'text-text/60  bg-gray-50  hover:bg-gray-100' },
    { label: 'Ver genios',           icon: UserCheck,   tab: 'genios',   color: 'text-text/60  bg-gray-50  hover:bg-gray-100' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-text/25" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-base font-semibold text-text">Panel de control</h1>
          <p className="text-xs text-text/35 mt-0.5">Vista general de la plataforma</p>
        </div>
        <button onClick={onRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-text/50 hover:text-text/75 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors">
          <RefreshCw className="w-3 h-3" />
          Actualizar
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {statCards.map(({ label, value, icon: Icon, tab, color, raw }) => (
          <button key={label} onClick={() => onNavigate(tab)}
            className="bg-white rounded-xl border border-gray-100 p-4 text-left hover:border-gray-200 hover:shadow-sm transition-all duration-150 group">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-text/35 leading-tight">{label}</p>
              <Icon className="w-3.5 h-3.5 text-text/15 group-hover:text-text/25 transition-colors flex-shrink-0" />
            </div>
            <p className={`font-heading text-xl font-semibold leading-none ${color || 'text-text'}`}>
              {raw ? value : typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          </button>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {alerts.map(alert => {
            const s = ALERT_STYLES[alert.type];
            return (
              <div key={alert.id} className={`rounded-xl border p-4 flex items-start gap-3 ${s.border} ${s.bg}`}>
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${s.icon}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text">{alert.title}</p>
                  <p className="text-xs text-text/50 mt-0.5 leading-relaxed">{alert.body}</p>
                </div>
                {alert.tab && (
                  <button onClick={() => onNavigate(alert.tab!)}
                    className={`flex-shrink-0 flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-80 ${s.icon}`}>
                    Ver
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pending today */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-medium text-text">Pendientes</h2>
            <span className="text-xs text-text/25">{pendingItems.length} item{pendingItems.length !== 1 ? 's' : ''}</span>
          </div>
          {pendingItems.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <CheckCircle className="w-6 h-6 text-green-300 mx-auto mb-2" />
              <p className="text-xs text-text/35">Todo al dia</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pendingItems.map(item => {
                const Icon = PENDING_ICONS[item.type] || Activity;
                return (
                  <div key={item.id} className="flex items-center gap-3 px-5 py-3 group">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${URGENCY_DOT[item.urgency]}`} />
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${URGENCY[item.urgency]}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text truncate">{item.label}</p>
                      <p className="text-[10px] text-text/35 truncate mt-0.5">{item.sub}</p>
                    </div>
                    <span className="text-[10px] text-text/25 flex-shrink-0">
                      {fmtTime(item.created_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity feed */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-medium text-text">Actividad reciente</h2>
            <span className="text-xs text-text/25">{activityFeed.length} eventos</span>
          </div>
          {activityFeed.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Activity className="w-6 h-6 text-text/10 mx-auto mb-2" />
              <p className="text-xs text-text/35">Sin actividad reciente</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {activityFeed.map(ev => {
                const Icon = ACTIVITY_ICONS[ev.type] || Activity;
                const dot = ev.status === 'success' ? 'bg-green-400' : ev.status === 'warning' ? 'bg-amber-400' : 'bg-gray-300';
                return (
                  <div key={ev.id} className="flex items-center gap-3 px-5 py-3">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                    <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-text/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text truncate">{ev.description}</p>
                      <p className="text-[10px] text-text/30 mt-0.5">{fmtTime(ev.timestamp)}</p>
                    </div>
                    {ev.status === 'success' ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    ) : ev.status === 'warning' ? (
                      <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-xs font-medium text-text/35 mb-3">Accesos rapidos</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {quickActions.map(({ label, icon: Icon, tab, color }) => (
            <button key={tab + label} onClick={() => onNavigate(tab)}
              className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl border border-transparent text-xs font-medium transition-all duration-150 ${color}`}>
              <Icon className="w-4 h-4" />
              <span className="text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
