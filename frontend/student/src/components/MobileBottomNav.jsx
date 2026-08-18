import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function MobileBottomNav({ onOpenCart }) {
  const { user } = useAuth();
  const { totalItems } = useCart();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => {
    if (path === '/home') return location.pathname === '/home' || location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { label: 'Home', path: '/home', icon: '🏠' },
    { label: 'Canteens', path: '/canteens', icon: '🏪' },
    { label: 'Orders', path: '/orders', icon: '📜' },
    {
      label: 'Cart',
      onClick: onOpenCart,
      icon: '🛒',
      badge: totalItems > 0 ? totalItems : null,
    },
    { label: 'Profile', path: '/profile', icon: '👤' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-1 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] safe-area-pb">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = item.path ? isActive(item.path) : false;

          if (item.onClick) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all relative text-slate-600 hover:text-orange-600 active:scale-95"
              >
                <div className="relative text-xl leading-none mb-1">
                  {item.icon}
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-2.5 bg-orange-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold tracking-tight text-slate-600">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all relative ${
                active
                  ? 'text-orange-600 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 font-semibold'
              }`}
            >
              <div className="relative text-xl leading-none mb-1 transition-transform">
                {item.icon}
              </div>
              <span
                className={`text-[10px] tracking-tight ${
                  active ? 'text-orange-600 font-bold' : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>
              {active && (
                <span className="w-1 h-1 rounded-full bg-orange-600 absolute bottom-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
