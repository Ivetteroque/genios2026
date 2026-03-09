import { User, Calendar, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardSidebarProps {
  activeSection: 'profile' | 'availability' | 'subscription';
  onSectionChange: (section: 'profile' | 'availability' | 'subscription') => void;
  geniusProfile: {
    profile_photo: string;
    full_name: string;
    category: string;
  } | null;
}

export default function DashboardSidebar({ activeSection, onSectionChange, geniusProfile }: DashboardSidebarProps) {
  const menuItems = [
    { id: 'profile' as const, label: 'Mi perfil', icon: User },
    { id: 'availability' as const, label: 'Disponibilidad', icon: Calendar },
    { id: 'subscription' as const, label: 'Suscripción', icon: CreditCard },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
      <nav className="p-3 pt-5 pb-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1.5 transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex-1"></div>

      {geniusProfile && (
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="flex items-start gap-2.5">
            <div className="relative flex-shrink-0">
              {geniusProfile.profile_photo ? (
                <img
                  src={geniusProfile.profile_photo}
                  alt={geniusProfile.full_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate text-sm">
                {geniusProfile.full_name || 'Usuario'}
              </h3>
              <p className="text-xs text-gray-600 truncate">
                {geniusProfile.category || 'Profesional'}
              </p>
              <Link
                to="/genius-profile"
                className="text-xs text-blue-600 hover:text-blue-700 mt-0.5 inline-block"
              >
                Ver perfil público →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}