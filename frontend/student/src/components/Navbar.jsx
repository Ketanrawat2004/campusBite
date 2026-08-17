import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import axiosClient from '../api/client';

const CANTEEN_URL = import.meta.env.VITE_CANTEEN_URL || 'https://campusbite-canteen.onrender.com';
const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'https://campusbite-admin-cxux.onrender.com';

export default function Navbar({ onOpenCart }) {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadCount, setUnreadCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const cartCount = totalItems || 0;

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    axiosClient
      .get('/notifications/unread-count')
      .then((res) => {
        if (isMounted) setUnreadCount(res.data.data?.unreadCount || 0);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [user]);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="page-container h-16 flex items-center justify-between">
        {/* Brand Logo & Name featuring official logo */}
        <div className="flex items-center gap-6">
          <Link to={user ? "/home" : "/"} className="flex items-center gap-3 group">
            <img
              src="/images/campusbite_logo.png"
              alt="CampusBite Logo"
              className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
            />
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 font-display">
                Campus<span className="text-orange-600">Bite</span>
              </span>
              <span className="block text-[10px] text-slate-500 font-semibold tracking-wide uppercase -mt-1">
                NIT Jamshedpur
              </span>
            </div>
          </Link>

          {/* Navigation Links for Authenticated Users */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 ml-4 border-l border-slate-200 pl-6">
              <Link
                to="/home"
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isActive('/home') ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Home
              </Link>
              <Link
                to="/canteens"
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  isActive('/canteens') ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>🏪 Canteens</span>
              </Link>
              <Link
                to="/orders"
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isActive('/orders') ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                My Orders
              </Link>
            </nav>
          )}
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Notifications */}
              <Link
                to="/notifications"
                className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                title="Notifications"
              >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Cart Trigger */}
              <button
                onClick={onOpenCart}
                className="relative flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95"
              >
                <span>🛒 Cart</span>
                {cartCount > 0 && (
                  <span className="bg-white text-orange-600 text-xs px-2 py-0.5 rounded-full font-extrabold">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-sm">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold text-slate-700">
                    {user.name?.split(' ')[0]}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 badge badge-orange text-[10px]">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      👤 My Profile
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      📜 Order History
                    </Link>

                    {/* Staff & Admin Direct Access */}
                    <div className="border-t border-slate-100 my-1 py-1">
                      <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Staff & Admin
                      </div>
                      <a
                        href={CANTEEN_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-4 py-1.5 text-xs text-orange-700 hover:bg-orange-50 font-medium"
                      >
                        <span className="flex items-center gap-1.5">
                          <span>👨‍🍳</span> Canteen Portal
                        </span>
                        <span className="text-[10px] text-orange-500">↗</span>
                      </a>
                      <a
                        href={ADMIN_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-4 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                      >
                        <span className="flex items-center gap-1.5">
                          <span>🛡️</span> Admin Console
                        </span>
                        <span className="text-[10px] text-slate-400">↗</span>
                      </a>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                          navigate('/login');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 font-semibold"
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="btn btn-secondary">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
