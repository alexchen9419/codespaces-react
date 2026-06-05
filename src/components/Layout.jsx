import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import NotifBadge from './NotifBadge';
import IncomingCall from './IncomingCall';

const navItems = [
  { to: '/', label: 'Feed', icon: '🏠' },
  { to: '/friends', label: 'Friends', icon: '👥' },
  { to: '/inbox', label: 'Messages', icon: '💬' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <IncomingCall />
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-800 border-r border-gray-700 p-4 fixed top-0 left-0 h-full z-40">
        <div className="mb-8 px-2">
          <h1 className="text-2xl font-bold text-indigo-400">SocialApp</h1>
          {user && (
            <p className="text-sm text-gray-400 mt-1">@{user.username}</p>
          )}
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`
              }
            >
              <span className="text-lg">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
          <NotifBadge />
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-red-400 transition-colors px-2 py-1 rounded"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-64 pb-16 md:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-6">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 flex z-40">
        {navItems.map(({ to, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 text-xs transition-colors ${
                isActive ? 'text-indigo-400' : 'text-gray-400 hover:text-white'
              }`
            }
          >
            <span className="text-xl">{icon}</span>
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center py-3 text-xs text-gray-400 hover:text-red-400"
        >
          <span className="text-xl">🚪</span>
        </button>
      </nav>
    </div>
  );
}
