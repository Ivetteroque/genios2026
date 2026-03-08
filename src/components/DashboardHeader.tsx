import { Bell, User } from 'lucide-react';

interface DashboardHeaderProps {
  userName: string;
  userPhoto?: string;
}

export default function DashboardHeader({ userName, userPhoto }: DashboardHeaderProps) {
  const firstName = userName.split(' ')[0] || 'Usuario';

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Hola {firstName} 👋
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></span>
          </button>

          <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Mi Panel →
          </button>

          <div className="relative">
            {userPhoto ? (
              <img
                src={userPhoto}
                alt={userName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-400" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
        </div>
      </div>
    </header>
  );
}