import { User, Calendar, CreditCard, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardSidebarProps {
  activeSection: 'profile' | 'availability' | 'subscription' | 'favorites';
  onSectionChange: (section: 'profile' | 'availability' | 'subscription' | 'favorites') => void;
  geniusProfile: {
    profile_photo: string;
    full_name: string;
    category: string;
  } | null;
}

const menuItems = [
  { id: 'profile' as const, label: 'Mi perfil', icon: User },
  { id: 'availability' as const, label: 'Disponibilidad', icon: Calendar },
  { id: 'subscription' as const, label: 'Suscripción', icon: CreditCard },
  { id: 'favorites' as const, label: 'Favoritos', icon: Heart },
];

export default function DashboardSidebar({ activeSection, onSectionChange, geniusProfile }: DashboardSidebarProps) {
  return (
    <div className="w-full lg:w-52 shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col lg:overflow-y-auto">
      <nav className="flex lg:block gap-1 overflow-x-auto p-3 lg:pt-4">
        {menuItems.map(({ id, label, icon: Icon }) => {
          const active = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => onSectionChange(id)}
              className={`shrink-0 lg:w-full flex items-center gap-2.5 px-3 py-2 rounded-lg lg:mb-0.5 text-sm whitespace-nowrap transition-colors ${
                active
                  ? 'bg-gray-100 text-text font-medium'
                  : 'text-text/50 hover:bg-gray-50 hover:text-text/75'
              }`}
            >
              <Icon style={{ width: '15px', height: '15px', flexShrink: 0 }} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="hidden lg:block flex-1" />

      {geniusProfile && (
        <div className="order-first lg:order-none px-4 py-3 lg:p-4 border-b lg:border-b-0 lg:border-t border-gray-100">
          <div className="flex items-center gap-2.5">
            {geniusProfile.profile_photo ? (
              <img
                src={geniusProfile.profile_photo}
                alt={geniusProfile.full_name}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center">
                <User style={{ width: '14px', height: '14px' }} className="text-text/30" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text truncate">{geniusProfile.full_name || 'Usuario'}</p>
              <p className="text-[10px] text-text/40 truncate">{geniusProfile.category || 'Profesional'}</p>
              <Link
                to="/genius-profile"
                className="text-[10px] text-text/40 hover:text-text/65 transition-colors mt-0.5 inline-block underline underline-offset-1"
              >
                Ver perfil
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
