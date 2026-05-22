import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  TrendingUp,
  DollarSign,
  MessageSquare,
  Settings,
  LogOut,
  Bell,
  Search,
  CheckCircle,
  XCircle,
  Calendar,
  BarChart3,
  Flag,
  Activity,
  Tag,
  MapPin,
  FileText,
  MessageCircle,
} from 'lucide-react';
import { getCurrentAdmin, logoutAdmin, hasPermission } from '../../utils/adminAuthUtils';
import CategoryManagement from './CategoryManagement';
import LocationManagement from './LocationManagement';
import GeniusManagement from './GeniusManagement';
import DocumentManagement from './DocumentManagement';
import PaymentManagement from './PaymentManagement';
import PaymentSettings from './PaymentSettings';
import ReportsManagement from './ReportsManagement';
import CommentsManagement from './CommentsManagement';

interface DashboardStats {
  totalUsers: number;
  totalGenios: number;
  activeServices: number;
  monthlyRevenue: number;
  pendingApprovals: number;
  newMessages: number;
}

interface RecentActivity {
  id: string;
  type: 'user_registration' | 'genius_approval' | 'service_booking' | 'payment';
  description: string;
  timestamp: string;
  status: 'success' | 'pending' | 'error';
}

const stats: DashboardStats = {
  totalUsers: 1247,
  totalGenios: 89,
  activeServices: 156,
  monthlyRevenue: 12450,
  pendingApprovals: 7,
  newMessages: 23,
};

const recentActivity: RecentActivity[] = [
  { id: '1', type: 'user_registration', description: 'Nuevo cliente registrado: María González', timestamp: '2025-01-29 14:30', status: 'success' },
  { id: '2', type: 'genius_approval', description: 'Perfil de genio pendiente: Carlos Mendoza (Electricista)', timestamp: '2025-01-29 13:15', status: 'pending' },
  { id: '3', type: 'service_booking', description: 'Nuevo servicio contratado: Maquillaje para evento', timestamp: '2025-01-29 12:45', status: 'success' },
  { id: '4', type: 'payment', description: 'Pago de suscripción: Ana Rodríguez — S/29.00', timestamp: '2025-01-29 11:20', status: 'success' },
];

const statCards = [
  { label: 'Usuarios', value: stats.totalUsers.toLocaleString(), change: '+12%', icon: Users },
  { label: 'Genios', value: String(stats.totalGenios), change: '+8%', icon: UserCheck },
  { label: 'Servicios activos', value: String(stats.activeServices), change: '+15%', icon: Activity },
  { label: 'Ingresos del mes', value: `S/ ${stats.monthlyRevenue.toLocaleString()}`, change: '+23%', icon: DollarSign },
];

const AdminDashboard: React.FC = () => {
  const [currentAdmin, setCurrentAdmin] = useState(getCurrentAdmin());
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const admin = getCurrentAdmin();
    if (admin) setCurrentAdmin(admin);
  }, []);

  const handleLogout = () => {
    if (window.confirm('¿Cerrar sesión?')) logoutAdmin();
  };

  if (!currentAdmin) return null;

  const navItems = [
    { id: 'overview', label: 'Resumen', icon: BarChart3, show: true },
    { id: 'genios', label: 'Genios', icon: UserCheck, show: hasPermission('genios'), badge: stats.pendingApprovals || 0 },
    { id: 'documents', label: 'Documentos', icon: FileText, show: true },
    { id: 'categories', label: 'Categorías', icon: Tag, show: true },
    { id: 'locations', label: 'Ubicaciones', icon: MapPin, show: true },
    { id: 'reports', label: 'Reportes', icon: Flag, show: hasPermission('reports') },
    { id: 'comments', label: 'Comentarios', icon: MessageCircle, show: true },
    { id: 'payments', label: 'Pagos', icon: DollarSign, show: hasPermission('payments') },
    { id: 'messages', label: 'Mensajes', icon: MessageSquare, show: true, badge: stats.newMessages },
    { id: 'settings', label: 'Configuración', icon: Settings, show: hasPermission('settings') },
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
            <div className="space-y-5 max-w-3xl">
              {/* Stats */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                {statCards.map(({ label, value, change, icon: Icon }) => (
                  <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs text-text/35 whitespace-nowrap">{label}</p>
                      <Icon style={{ width: '14px', height: '14px' }} className="text-text/15 flex-shrink-0" />
                    </div>
                    <p className="font-heading text-2xl font-semibold text-text leading-none">{value}</p>
                    <div className="flex items-center gap-1 mt-2.5">
                      <TrendingUp style={{ width: '10px', height: '10px' }} className="text-green-500 flex-shrink-0" />
                      <span className="text-xs text-green-600 font-medium">{change}</span>
                      <span className="text-xs text-text/25 whitespace-nowrap">vs mes ant.</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent activity */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-sm font-medium text-text">Actividad reciente</h2>
                  <button className="text-xs text-text/35 hover:text-text/60 transition-colors">Ver todo</button>
                </div>
                <div className="divide-y divide-gray-50">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 px-5 py-3.5">
                      <ActivityDot status={activity.status} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text truncate">{activity.description}</p>
                        <p className="text-xs text-text/30 mt-0.5">{activity.timestamp}</p>
                      </div>
                      <StatusIcon status={activity.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'categories' && <CategoryManagement />}
          {activeTab === 'locations' && <LocationManagement />}
          {activeTab === 'genios' && <GeniusManagement />}
          {activeTab === 'documents' && <DocumentManagement />}
          {activeTab === 'payments' && <PaymentManagement />}
          {activeTab === 'settings' && <PaymentSettings />}
          {activeTab === 'reports' && <ReportsManagement />}
          {activeTab === 'comments' && <CommentsManagement />}

          {!['overview', 'categories', 'locations', 'genios', 'documents', 'payments', 'settings', 'reports', 'comments'].includes(activeTab) && (
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

const ActivityDot: React.FC<{ status: string }> = ({ status }) => {
  const color = status === 'success' ? 'bg-green-400' : status === 'pending' ? 'bg-amber-400' : 'bg-red-400';
  return <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${color}`} />;
};

const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'success') return <CheckCircle style={{ width: '14px', height: '14px' }} className="text-green-400 flex-shrink-0" />;
  if (status === 'error') return <XCircle style={{ width: '14px', height: '14px' }} className="text-red-400 flex-shrink-0" />;
  return <ClockIcon />;
};

const ClockIcon: React.FC = () => (
  <svg style={{ width: '14px', height: '14px', flexShrink: 0 }} className="text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </svg>
);

export default AdminDashboard;
