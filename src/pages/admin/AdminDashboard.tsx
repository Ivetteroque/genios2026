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
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Tag,
  MapPin,
  FileText
} from 'lucide-react';
import { getCurrentAdmin, logoutAdmin, hasPermission } from '../../utils/adminAuthUtils';
import CategoryManagement from './CategoryManagement';
import LocationManagement from './LocationManagement';
import GeniusManagement from './GeniusManagement';
import DocumentManagement from './DocumentManagement';
import PaymentManagement from './PaymentManagement';

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

const AdminDashboard: React.FC = () => {
  const [currentAdmin, setCurrentAdmin] = useState(getCurrentAdmin());
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock dashboard data
  const stats: DashboardStats = {
    totalUsers: 1247,
    totalGenios: 89,
    activeServices: 156,
    monthlyRevenue: 12450,
    pendingApprovals: 7,
    newMessages: 23
  };

  const recentActivity: RecentActivity[] = [
    {
      id: '1',
      type: 'user_registration',
      description: 'Nuevo cliente registrado: María González',
      timestamp: '2025-01-29 14:30',
      status: 'success'
    },
    {
      id: '2',
      type: 'genius_approval',
      description: 'Perfil de genio pendiente: Carlos Mendoza (Electricista)',
      timestamp: '2025-01-29 13:15',
      status: 'pending'
    },
    {
      id: '3',
      type: 'service_booking',
      description: 'Nuevo servicio contratado: Maquillaje para evento',
      timestamp: '2025-01-29 12:45',
      status: 'success'
    },
    {
      id: '4',
      type: 'payment',
      description: 'Pago de suscripción: Ana Rodríguez - S/29.00',
      timestamp: '2025-01-29 11:20',
      status: 'success'
    }
  ];

  useEffect(() => {
    // Update admin state if needed
    const admin = getCurrentAdmin();
    if (admin) {
      setCurrentAdmin(admin);
    }
  }, []);

  const handleLogout = () => {
    const confirmLogout = window.confirm('¿Estás seguro de que quieres cerrar sesión?');
    if (confirmLogout) {
      logoutAdmin();
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'genius_approval':
        return <UserCheck className="w-4 h-4 text-orange-500" />;
      case 'service_booking':
        return <Calendar className="w-4 h-4 text-green-500" />;
      case 'payment':
        return <DollarSign className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (!currentAdmin) {
    return null; // Will redirect in AdminRoute
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="font-heading text-2xl font-bold text-text">
                Panel de Administración
              </h1>
              <span className="text-text/60">|</span>
              <span className="text-text/60">Genios a la Obra</span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                  style={{ fontFamily: 'Open Sans, sans-serif' }}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text/40 w-4 h-4" />
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-text/60 hover:text-text transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {stats.newMessages}
                </span>
              </button>

              {/* Admin Profile */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-text">{currentAdmin.name}</p>
                  <p className="text-xs text-text/60">{currentAdmin.role === 'super_admin' ? 'Super Admin' : 'Admin'}</p>
                </div>
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {currentAdmin.name.charAt(0)}
                  </span>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 text-text/60 hover:text-red-500 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm h-screen sticky top-0">
          <nav className="p-6">
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                  activeTab === 'overview' 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'text-text/70 hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span>Resumen General</span>
              </button>

              {hasPermission('users') && (
                <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                    activeTab === 'users' 
                      ? 'bg-primary/10 text-primary border border-primary/20' 
                      : 'text-text/70 hover:bg-gray-50'
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span>Usuarios</span>
                </button>
              )}

              {hasPermission('genios') && (
                <button
                  onClick={() => setActiveTab('genios')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                    activeTab === 'genios' 
                      ? 'bg-primary/10 text-primary border border-primary/20' 
                      : 'text-text/70 hover:bg-gray-50'
                  }`}
                >
                  <UserCheck className="w-5 h-5" />
                  <span>Genios</span>
                  {stats.pendingApprovals > 0 && (
                    <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-1">
                      {stats.pendingApprovals}
                    </span>
                  )}
                </button>
              )}

              {/* Documents Management */}
              <button
                onClick={() => setActiveTab('documents')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                  activeTab === 'documents' 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'text-text/70 hover:bg-gray-50'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>Documentos</span>
              </button>

              {/* Categories Management */}
              <button
                onClick={() => setActiveTab('categories')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                  activeTab === 'categories' 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'text-text/70 hover:bg-gray-50'
                }`}
              >
                <Tag className="w-5 h-5" />
                <span>Categorías</span>
              </button>

              {/* Locations Management */}
              <button
                onClick={() => setActiveTab('locations')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                  activeTab === 'locations' 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'text-text/70 hover:bg-gray-50'
                }`}
              >
                <MapPin className="w-5 h-5" />
                <span>Ubicaciones</span>
              </button>

              {hasPermission('reports') && (
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                    activeTab === 'reports' 
                      ? 'bg-primary/10 text-primary border border-primary/20' 
                      : 'text-text/70 hover:bg-gray-50'
                  }`}
                >
                  <PieChart className="w-5 h-5" />
                  <span>Reportes</span>
                </button>
              )}

              {hasPermission('payments') && (
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                    activeTab === 'payments' 
                      ? 'bg-primary/10 text-primary border border-primary/20' 
                      : 'text-text/70 hover:bg-gray-50'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                  <span>Pagos</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('messages')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                  activeTab === 'messages' 
                    ? 'bg-primary/10 text-primary border border-primary/20' 
                    : 'text-text/70 hover:bg-gray-50'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span>Mensajes</span>
                {stats.newMessages > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {stats.newMessages}
                  </span>
                )}
              </button>

              {hasPermission('settings') && (
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 ${
                    activeTab === 'settings' 
                      ? 'bg-primary/10 text-primary border border-primary/20' 
                      : 'text-text/70 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span>Configuración</span>
                </button>
              )}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text/60 text-sm font-medium">Total Usuarios</p>
                      <p className="text-2xl font-bold text-text">{stats.totalUsers.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-500 text-sm font-medium">+12%</span>
                    <span className="text-text/60 text-sm ml-1">vs mes anterior</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text/60 text-sm font-medium">Total Genios</p>
                      <p className="text-2xl font-bold text-text">{stats.totalGenios}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-500 text-sm font-medium">+8%</span>
                    <span className="text-text/60 text-sm ml-1">vs mes anterior</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text/60 text-sm font-medium">Servicios Activos</p>
                      <p className="text-2xl font-bold text-text">{stats.activeServices}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Activity className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-500 text-sm font-medium">+15%</span>
                    <span className="text-text/60 text-sm ml-1">vs mes anterior</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-text/60 text-sm font-medium">Ingresos Mensuales</p>
                      <p className="text-2xl font-bold text-text">S/ {stats.monthlyRevenue.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-500 text-sm font-medium">+23%</span>
                    <span className="text-text/60 text-sm ml-1">vs mes anterior</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading text-xl font-bold text-text">Actividad Reciente</h2>
                  <button className="text-primary hover:text-primary-dark transition-colors text-sm font-medium">
                    Ver todo
                  </button>
                </div>

                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getActivityIcon(activity.type)}
                        <div>
                          <p className="text-text font-medium">{activity.description}</p>
                          <p className="text-text/60 text-sm">{activity.timestamp}</p>
                        </div>
                      </div>
                      {getStatusBadge(activity.status)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Categories Management Tab */}
          {activeTab === 'categories' && <CategoryManagement />}

          {/* Location Management Tab */}
          {activeTab === 'locations' && <LocationManagement />}

          {/* Genios Management Tab */}
          {activeTab === 'genios' && <GeniusManagement />}

          {/* Documents Management Tab */}
          {activeTab === 'documents' && <DocumentManagement />}

          {/* Payment Management Tab */}
          {activeTab === 'payments' && <PaymentManagement />}

          {/* Other tabs content would go here */}
          {activeTab !== 'overview' && activeTab !== 'categories' && activeTab !== 'locations' && activeTab !== 'genios' && activeTab !== 'documents' && activeTab !== 'payments' && (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <h2 className="font-heading text-2xl font-bold text-text mb-4">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h2>
              <p className="text-text/60">
                Esta sección estará disponible próximamente.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// Clock component for pending status
const Clock: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12,6 12,12 16,14"></polyline>
  </svg>
);

export default AdminDashboard;