import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://campusbite-backend-i2ke.onrender.com/api/v1';
const STUDENT_URL = import.meta.env.VITE_STUDENT_URL || 'https://campusbite-jpwq.onrender.com';
const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'https://campusbite-admin-cxux.onrender.com';

// Web Audio API Synthesized Chime for New Order Notifications
function playNewOrderChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (e) {
    console.debug('Audio chime prevented:', e);
  }
}

export default function CanteenApp() {
  const [token, setToken] = useState(localStorage.getItem('canteen_token'));
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('canteen_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('canteen_sound_enabled') !== 'false';
  });
  const location = useLocation();

  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API_BASE}/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.data?.data) {
          setUser(res.data.data);
          localStorage.setItem('canteen_user', JSON.stringify(res.data.data));
        }
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem('canteen_token');
          localStorage.removeItem('canteen_user');
          setToken(null);
          setUser(null);
        }
      });
  }, [token]);

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    localStorage.setItem('canteen_sound_enabled', String(newVal));
    if (newVal) playNewOrderChime();
    toast.success(newVal ? '🔊 Order Sound Alerts Enabled' : '🔇 Order Sound Alerts Muted');
  };

  const login = (tok, userData) => {
    localStorage.setItem('canteen_token', tok);
    localStorage.setItem('canteen_user', JSON.stringify(userData));
    setToken(tok);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('canteen_token');
    localStorage.removeItem('canteen_user');
    setToken(null);
    setUser(null);
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <Toaster position="top-right" containerStyle={{ top: 80, right: 20 }} toastOptions={{ duration: 3000 }} />
      {token && user ? (
        <div>
          {/* Header Light Theme */}
          <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40, boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/images/campusbite_logo.png" alt="CampusBite Logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#0f172a', whiteSpace: 'nowrap' }}>CampusBite Canteen</h1>
                  <span style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '10px', fontWeight: '800', padding: '1px 6px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{ width: '5px', height: '5px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block' }} />
                    LIVE 2S
                  </span>
                </div>
                <p style={{ margin: '1px 0 0 0', fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }}>{user.name}</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="desktop-nav-only" style={{ alignItems: 'center', gap: '12px' }}>
              <button
                onClick={toggleSound}
                title="Toggle audio notification chime for incoming orders"
                style={{ backgroundColor: soundEnabled ? '#fff7ed' : '#f1f5f9', color: soundEnabled ? '#ea580c' : '#64748b', border: soundEnabled ? '1px solid #ffedd5' : '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {soundEnabled ? '🔊 Sound ON' : '🔇 Muted'}
              </button>

              <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f8fafc', padding: '4px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <Link
                  to="/queue"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    fontSize: '12px',
                    backgroundColor: location.pathname.includes('/queue') ? '#ea580c' : 'transparent',
                    color: location.pathname.includes('/queue') ? '#ffffff' : '#475569',
                    transition: 'all 0.15s ease',
                  }}
                >
                  📋 Queue
                </Link>
                <Link
                  to="/menu"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    fontSize: '12px',
                    backgroundColor: location.pathname.includes('/menu') ? '#ea580c' : 'transparent',
                    color: location.pathname.includes('/menu') ? '#ffffff' : '#475569',
                    transition: 'all 0.15s ease',
                  }}
                >
                  🍔 Menu & Stock
                </Link>
                <Link
                  to="/issues"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    fontSize: '12px',
                    backgroundColor: location.pathname.includes('/issues') ? '#ea580c' : 'transparent',
                    color: location.pathname.includes('/issues') ? '#ffffff' : '#475569',
                    transition: 'all 0.15s ease',
                  }}
                >
                  ⚠️ Issues
                </Link>
                <Link
                  to="/analytics"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    fontSize: '12px',
                    backgroundColor: location.pathname.includes('/analytics') ? '#ea580c' : 'transparent',
                    color: location.pathname.includes('/analytics') ? '#ffffff' : '#475569',
                    transition: 'all 0.15s ease',
                  }}
                >
                  📊 Analytics
                </Link>
              </nav>

              <a
                href={STUDENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#ea580c', fontWeight: '700', fontSize: '12px', textDecoration: 'none', padding: '6px 12px', borderRadius: '8px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}
              >
                🍱 Student App ↗
              </a>

              <button
                onClick={logout}
                style={{ backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '6px 12px', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
              >
                Sign Out
              </button>
            </div>

            {/* Mobile Controls Right */}
            <div className="mobile-nav-only" style={{ alignItems: 'center', gap: '8px' }}>
              <button
                onClick={toggleSound}
                title="Toggle Sound"
                style={{ backgroundColor: soundEnabled ? '#fff7ed' : '#f1f5f9', color: soundEnabled ? '#ea580c' : '#64748b', border: soundEnabled ? '1px solid #ffedd5' : '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                {soundEnabled ? '🔊' : '🔇'}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 10px', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold' }}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </header>

          {/* Mobile Drawer Menu */}
          {mobileMenuOpen && (
            <div className="mobile-nav-only" style={{ backgroundColor: '#ffffff', borderBottom: '2px solid #ea580c', padding: '16px', flexDirection: 'column', gap: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <div style={{ paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#0f172a' }}>{user.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{user.email}</div>
                <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '10px', fontWeight: '800', backgroundColor: '#fff7ed', color: '#ea580c', border: '1px solid #ffedd5', padding: '2px 8px', borderRadius: '6px' }}>CANTEEN OPERATOR</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Link
                  to="/queue"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ padding: '10px 14px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none', fontSize: '13px', backgroundColor: location.pathname.includes('/queue') ? '#ea580c' : '#f8fafc', color: location.pathname.includes('/queue') ? '#ffffff' : '#334155' }}
                >
                  📋 Kitchen Queue
                </Link>
                <Link
                  to="/menu"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ padding: '10px 14px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none', fontSize: '13px', backgroundColor: location.pathname.includes('/menu') ? '#ea580c' : '#f8fafc', color: location.pathname.includes('/menu') ? '#ffffff' : '#334155' }}
                >
                  🍔 Menu & Stock Availability
                </Link>
                <Link
                  to="/issues"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ padding: '10px 14px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none', fontSize: '13px', backgroundColor: location.pathname.includes('/issues') ? '#ea580c' : '#f8fafc', color: location.pathname.includes('/issues') ? '#ffffff' : '#334155' }}
                >
                  ⚠️ Student Issue Reports
                </Link>
                <Link
                  to="/analytics"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ padding: '10px 14px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none', fontSize: '13px', backgroundColor: location.pathname.includes('/analytics') ? '#ea580c' : '#f8fafc', color: location.pathname.includes('/analytics') ? '#ffffff' : '#334155' }}
                >
                  📊 Daily Revenue & Analytics
                </Link>
              </div>

              <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                <a
                  href={STUDENT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ flex: 1, textAlign: 'center', color: '#ea580c', fontWeight: '700', fontSize: '12px', textDecoration: 'none', padding: '8px', borderRadius: '8px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}
                >
                  🍱 Student App ↗
                </a>
                <button
                  onClick={logout}
                  style={{ flex: 1, backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '8px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                >
                  Sign Out 🚪
                </button>
              </div>
            </div>
          )}

          <main className="canteen-main-content">
            <Routes>
              <Route path="/queue" element={<OrderQueuePage token={token} user={user} soundEnabled={soundEnabled} />} />
              <Route path="/menu" element={<MenuMgmtPage token={token} user={user} />} />
              <Route path="/issues" element={<IssuesPage token={token} />} />
              <Route path="/analytics" element={<AnalyticsPage token={token} />} />
              <Route path="*" element={<Navigate to="/queue" replace />} />
            </Routes>
          </main>

          {/* Mobile Bottom Docked Navigation */}
          <nav className="mobile-nav-only" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '6px 8px', justifyContent: 'space-around', boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' }}>
            {[
              { label: 'Queue', path: '/queue', icon: '📋' },
              { label: 'Menu', path: '/menu', icon: '🍔' },
              { label: 'Issues', path: '/issues', icon: '⚠️' },
              { label: 'Stats', path: '/analytics', icon: '📊' },
            ].map((tab) => {
              const active = location.pathname.includes(tab.path);
              return (
                <Link
                  key={tab.label}
                  to={tab.path}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: active ? '#ea580c' : '#64748b',
                    fontWeight: active ? '800' : '600',
                    fontSize: '11px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '18px', lineHeight: '1.1' }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      ) : (
        <CanteenLoginPage onLogin={login} />
      )}
    </div>
  );
}

function CanteenLoginPage({ onLogin }) {
  const [email, setEmail] = useState('main.canteen@nitjsr.ac.in');
  const [password, setPassword] = useState('Staff@123');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Authenticating...');

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '362637227231-utbl0j3a1kh2aprj335g9ru1god9ospj.apps.googleusercontent.com';

  const isAnyLoading = loading || googleLoading;

  useEffect(() => {
    if (!isAnyLoading) {
      setLoadingMsg('Authenticating...');
      return;
    }
    const t1 = setTimeout(() => setLoadingMsg('Connecting to campus servers... Please wait'), 2500);
    const t2 = setTimeout(() => setLoadingMsg('Loading Canteen Kitchen Operations... Almost ready! 🍳'), 6000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isAnyLoading]);

  const handleGoogleResponse = async (response) => {
    if (!response || !response.credential) {
      toast.error('Google credential not received. Please try again.');
      return;
    }
    setGoogleLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/auth/google`, {
        idToken: response.credential,
        role: 'CANTEEN_STAFF',
      });
      if (data.data?.user?.role !== 'CANTEEN_STAFF' && data.data?.user?.role !== 'ADMIN') {
        toast.error('Access restricted to Canteen Staff & Admin');
        return;
      }
      onLogin(data.data.accessToken, data.data.user);
      toast.success(`Welcome, ${data.data.user.name.split(' ')[0]}! Logged into Canteen Staff Portal 🎉`);
    } catch (err) {
      console.error('Canteen Google Auth Error:', err);
      toast.error(err.response?.data?.error?.message || 'Google sign-in failed. Please use staff email & password.');
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (!window.google?.accounts) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    } else {
      initGoogle();
    }

    function initGoogle() {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
            auto_select: false,
          });
          const container = document.getElementById('canteen-google-btn');
          if (container) {
            container.innerHTML = '';
            const btnWidth = Math.min(356, Math.max(240, window.innerWidth - 64));
            window.google.accounts.id.renderButton(container, {
              theme: 'outline',
              size: 'large',
              width: btnWidth,
              text: 'signin_with',
              shape: 'rectangular',
            });
          }
        } catch (e) {
          console.error('Google accounts.id error:', e);
        }
      }
    }
  }, [GOOGLE_CLIENT_ID]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
      if (data.data.user.role !== 'CANTEEN_STAFF' && data.data.user.role !== 'ADMIN') {
        toast.error('Access restricted to Canteen Staff & Admin');
        return;
      }
      onLogin(data.data.accessToken, data.data.user);
      toast.success('Logged into Canteen Dashboard! 🎉');
    } catch (err) {
      console.error('Login error:', err);
      toast.error(err.response?.data?.error?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', backgroundColor: '#f8fafc' }}>
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: window.innerWidth < 480 ? '20px' : '36px', maxWidth: '440px', width: '100%', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src="/images/campusbite_logo.png" alt="CampusBite Logo" style={{ width: '64px', height: '64px', objectFit: 'contain', margin: '0 auto 12px auto' }} />
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#0f172a' }}>Canteen Staff Portal</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>NIT Jamshedpur • Kitchen Operations & Menu Control</p>
        </div>

        {/* Progressive Loading Banner */}
        {isAnyLoading && (
          <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '16px', padding: '14px', marginBottom: '20px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: '14px', height: '14px', border: '2px solid #ea580c', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#9a3412' }}>{loadingMsg}</span>
            </div>
            <p style={{ fontSize: '11px', color: '#c2410c', margin: 0 }}>Please wait without closing this page...</p>
          </div>
        )}

        {/* Google OAuth Button */}
        <div style={{ marginBottom: '20px', opacity: isAnyLoading ? 0.6 : 1, pointerEvents: isAnyLoading ? 'none' : 'auto' }}>
          <div id="canteen-google-btn" style={{ display: 'flex', justifyContent: 'center', minHeight: '44px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
            <div style={{ height: '1px', flex: 1, backgroundColor: '#e2e8f0' }} />
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>or sign in with password</span>
            <div style={{ height: '1px', flex: 1, backgroundColor: '#e2e8f0' }} />
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Staff Email</label>
            <input
              type="email"
              disabled={isAnyLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '12px', color: '#0f172a', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Password</label>
            <input
              type="password"
              disabled={isAnyLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '12px', color: '#0f172a', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>
          <button
            type="submit"
            disabled={isAnyLoading}
            style={{ width: '100%', backgroundColor: '#ea580c', color: '#ffffff', fontWeight: 'bold', padding: '14px', border: 'none', borderRadius: '12px', fontSize: '14px', cursor: 'pointer', marginTop: '8px', boxShadow: '0 4px 12px rgba(234,88,12,0.2)' }}
          >
            {isAnyLoading ? 'Authenticating... Please wait' : 'Access Canteen Dashboard →'}
          </button>
        </form>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
          <button
            type="button"
            disabled={isAnyLoading}
            onClick={() => {
              setEmail('main.canteen@nitjsr.ac.in');
              setPassword('Staff@123');
              handleSubmit();
            }}
            style={{ width: '100%', backgroundColor: '#fff7ed', color: '#ea580c', border: '1px solid #ffedd5', borderRadius: '12px', padding: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            🔑 Quick Demo Login (main.canteen@nitjsr.ac.in)
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderQueuePage({ token, user, soundEnabled }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('ALL');
  const [canteenStatus, setCanteenStatus] = useState('ONLINE'); // ONLINE / BUSY / OFFLINE
  const [canteensList, setCanteensList] = useState([]);
  const [selectedCanteenId, setSelectedCanteenId] = useState('');
  const previousOrderIdsRef = useRef(new Set());

  // Fetch list of canteens for dropdown selector
  useEffect(() => {
    axios
      .get(`${API_BASE}/canteens`)
      .then((res) => {
        const list = res.data?.data || [];
        setCanteensList(list);
        if (list.length > 0) {
          const userCanteenId = user?.canteenProfile?.canteenId;
          const match = list.find((c) => c._id === userCanteenId);
          const defaultId = match ? match._id : list[0]._id;
          setSelectedCanteenId(defaultId);
          if (match?.statusMode) {
            setCanteenStatus(match.statusMode);
          }
        }
      })
      .catch((err) => console.error('Failed to load canteens list:', err));
  }, [user]);

  // When selected canteen changes, fetch its current statusMode
  const handleCanteenChange = (canteenId) => {
    setSelectedCanteenId(canteenId);
    const found = canteensList.find((c) => c._id === canteenId);
    if (found?.statusMode) {
      setCanteenStatus(found.statusMode);
    } else {
      axios
        .get(`${API_BASE}/canteens/${canteenId}`)
        .then((res) => {
          if (res.data?.data?.statusMode) {
            setCanteenStatus(res.data.data.statusMode);
          }
        })
        .catch((err) => console.error(err));
    }
  };

  const handleSetCanteenStatus = async (newStatus) => {
    setCanteenStatus(newStatus);
    const targetCanteenId = selectedCanteenId || user?.canteenProfile?.canteenId;
    if (!targetCanteenId) {
      toast.error('Please select a canteen first');
      return;
    }

    let payload = {};
    if (newStatus === 'ONLINE') {
      payload = { statusMode: 'ONLINE', isCurrentlyOpen: true, acceptingOrders: true, avgPrepTimeMinutes: 15 };
    } else if (newStatus === 'BUSY') {
      payload = { statusMode: 'BUSY', isCurrentlyOpen: true, acceptingOrders: true, avgPrepTimeMinutes: 30 };
    } else if (newStatus === 'OFFLINE') {
      payload = { statusMode: 'OFFLINE', isCurrentlyOpen: false, acceptingOrders: false };
    }

    try {
      const { data } = await axios.patch(`${API_BASE}/canteens/${targetCanteenId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const canteenName = data?.data?.name || 'Selected canteen';
      toast.success(`${canteenName} mode updated to ${newStatus}! 🎉`);
      
      // Refresh local canteens list status
      setCanteensList((prev) =>
        prev.map((c) => (c._id === targetCanteenId ? { ...c, ...payload } : c))
      );
    } catch (err) {
      console.error('Failed to update canteen status:', err);
      toast.error('Failed to update status on server');
    }
  };

  const fetchQueue = async () => {
    if (document.hidden) return;
    try {
      const targetQuery = selectedCanteenId && selectedCanteenId !== 'ALL'
        ? `canteenId=${selectedCanteenId}`
        : 'allCanteens=true';
      const { data } = await axios.get(`${API_BASE}/orders/canteen/queue?allStatus=true&${targetQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedOrders = data.data || [];

      // Check if new orders arrived to trigger sound chime
      if (soundEnabled && previousOrderIdsRef.current.size > 0) {
        const hasNewOrder = fetchedOrders.some(
          (o) => !previousOrderIdsRef.current.has(o._id) && o.status === 'CONFIRMED'
        );
        if (hasNewOrder) {
          playNewOrderChime();
          toast('🔔 New Order Arrived in Kitchen Queue!', { icon: '🍱' });
        }
      }

      const newIdSet = new Set(fetchedOrders.map((o) => o._id));
      previousOrderIdsRef.current = newIdSet;

      setOrders(fetchedOrders);
    } catch (err) {
      console.error('Queue fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 4000); // 4s real-time queue refresh
    return () => clearInterval(interval);
  }, [token, soundEnabled, selectedCanteenId]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await axios.patch(
        `${API_BASE}/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Order status updated to ${newStatus}`);
      fetchQueue();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Status update failed');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order from the queue?')) return;
    try {
      await axios.delete(`${API_BASE}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Order deleted from queue');
      fetchQueue();
    } catch (err) {
      toast.error('Failed to delete order');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? Student will be notified in real time.')) return;
    handleUpdateStatus(orderId, 'CANCELLED');
  };

  const handleDownloadInvoice = async (orderId, orderNumber) => {
    try {
      toast.loading(`Downloading Invoice PDF #${orderNumber}...`, { id: 'invoice-dl' });
      const response = await axios.get(`${API_BASE}/orders/${orderId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CampusBite-Invoice-${orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Official Tax Invoice PDF Downloaded! 📄', { id: 'invoice-dl' });
    } catch (err) {
      console.error('Invoice download error:', err);
      toast.error('Failed to download invoice PDF', { id: 'invoice-dl' });
    }
  };

  const formatRupees = (p) => `₹${((p || 0) / 100).toFixed(2)}`;

  // Calculated Stats
  const activeOrdersCount = orders.filter((o) => !['COMPLETED', 'DELIVERED', 'CANCELLED'].includes(o.status)).length;
  const preparingCount = orders.filter((o) => o.status === 'PREPARING').length;
  const readyCount = orders.filter((o) => o.status === 'READY').length;
  const totalRevenuePaise = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.pricingBreakdown?.totalInPaise || 0), 0);

  // Filtered Orders Logic
  const filteredOrders = orders.filter((order) => {
    // Search query matching
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      order.orderNumber?.toLowerCase().includes(q) ||
      (order.studentId?.name || '').toLowerCase().includes(q) ||
      (order.deliveryDetails?.hostelName || '').toLowerCase().includes(q) ||
      (order.deliveryDetails?.roomNumber || '').toLowerCase().includes(q);

    // Status filter
    let matchStatus = true;
    if (statusFilter === 'CONFIRMED') matchStatus = order.status === 'CONFIRMED';
    else if (statusFilter === 'PREPARING') matchStatus = order.status === 'PREPARING';
    else if (statusFilter === 'READY') matchStatus = order.status === 'READY';
    else if (statusFilter === 'COMPLETED') matchStatus = ['COMPLETED', 'DELIVERED'].includes(order.status);
    else if (statusFilter === 'CANCELLED') matchStatus = order.status === 'CANCELLED';

    // Fulfillment filter
    let matchFulfillment = true;
    if (fulfillmentFilter === 'DELIVERY') matchFulfillment = order.fulfillmentType === 'DELIVERY';
    else if (fulfillmentFilter === 'PICKUP') matchFulfillment = order.fulfillmentType === 'PICKUP';

    return matchSearch && matchStatus && matchFulfillment;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Canteen Operating Status Banner */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🏪</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>Select Canteen:</h3>
              {canteensList.length > 0 && (
                <select
                  value={selectedCanteenId}
                  onChange={(e) => handleCanteenChange(e.target.value)}
                  style={{
                    backgroundColor: '#f8fafc',
                    color: '#0f172a',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="ALL">🏪 ALL Canteens (Unified Campus Queue)</option>
                  {canteensList.map((c) => (
                    <option key={c._id} value={c._id}>
                      🏪 {c.name}
                    </option>
                  ))}
                </select>
              )}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor: canteenStatus === 'ONLINE' ? '#ecfdf5' : canteenStatus === 'BUSY' ? '#fff7ed' : '#fff1f2',
                  color: canteenStatus === 'ONLINE' ? '#047857' : canteenStatus === 'BUSY' ? '#c2410c' : '#e11d48',
                  border: `1px solid ${canteenStatus === 'ONLINE' ? '#a7f3d0' : canteenStatus === 'BUSY' ? '#ffedd5' : '#fecdd3'}`,
                }}
              >
                {canteenStatus === 'ONLINE' ? '● ONLINE & ACCEPTING' : canteenStatus === 'BUSY' ? '⚡ PEAK RUSH HOUR' : '🚫 PAUSED / OFFLINE'}
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>Select canteen above to toggle Online, Rush Mode or Pause Queue in real time</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleSetCanteenStatus('ONLINE')}
            style={{ backgroundColor: canteenStatus === 'ONLINE' ? '#10b981' : '#f1f5f9', color: canteenStatus === 'ONLINE' ? '#fff' : '#475569', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Online
          </button>
          <button
            onClick={() => handleSetCanteenStatus('BUSY')}
            style={{ backgroundColor: canteenStatus === 'BUSY' ? '#f59e0b' : '#f1f5f9', color: canteenStatus === 'BUSY' ? '#fff' : '#475569', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Rush Mode
          </button>
          <button
            onClick={() => handleSetCanteenStatus('OFFLINE')}
            style={{ backgroundColor: canteenStatus === 'OFFLINE' ? '#ef4444' : '#f1f5f9', color: canteenStatus === 'OFFLINE' ? '#fff' : '#475569', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Pause Queue
          </button>
        </div>
      </div>

      {/* KPI Live Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#ea580c', flexShrink: 0 }}>📋</div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{activeOrdersCount}</div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Active Pending</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#d97706', flexShrink: 0 }}>🍳</div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{preparingCount}</div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Preparing</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#059669', flexShrink: 0 }}>🍱</div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{readyCount}</div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Ready / Dispatch</div>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#2563eb', flexShrink: 0 }}>💰</div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#ea580c' }}>{formatRupees(totalRevenuePaise)}</div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Today's Revenue</div>
          </div>
        </div>
      </div>

      {/* Multi-Filter & Search Bar */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#94a3b8' }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Order #, Student Name, Hostel, or Room..."
              style={{ width: '100%', padding: '10px 14px 10px 36px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>Fulfillment:</span>
            <select
              value={fulfillmentFilter}
              onChange={(e) => setFulfillmentFilter(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#f8fafc', color: '#0f172a', fontWeight: '600' }}
            >
              <option value="ALL">All Types</option>
              <option value="DELIVERY">🚴 Hostel Delivery</option>
              <option value="PICKUP">🏪 Counter Pickup</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'ALL', label: `All Orders (${orders.length})` },
            { id: 'CONFIRMED', label: `Confirmed (${orders.filter((o) => o.status === 'CONFIRMED').length})` },
            { id: 'PREPARING', label: `Preparing (${preparingCount})` },
            { id: 'READY', label: `Ready (${readyCount})` },
            { id: 'COMPLETED', label: `Fulfilled (${orders.filter((o) => ['COMPLETED', 'DELIVERED'].includes(o.status)).length})` },
            { id: 'CANCELLED', label: `Cancelled (${orders.filter((o) => o.status === 'CANCELLED').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                border: '1px solid',
                backgroundColor: statusFilter === tab.id ? '#ea580c' : '#f8fafc',
                color: statusFilter === tab.id ? '#ffffff' : '#475569',
                borderColor: statusFilter === tab.id ? '#ea580c' : '#e2e8f0',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Queue List / Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading active kitchen queue...</div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '48px', textAlign: 'center', color: '#64748b' }}>
          🎉 No orders match your filter criteria! New student orders will automatically appear here.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filteredOrders.map((order) => {
            const isDelivery = order.fulfillmentType === 'DELIVERY';
            const studentName = order.studentId?.name || order.studentName || 'Student';
            const studentPhone = order.studentId?.phone || order.studentPhone || null;
            const studentEmail = order.studentId?.email || order.studentEmail || null;

            // Visual Status Stepper calculation
            const statusSteps = ['CONFIRMED', 'PREPARING', 'READY', isDelivery ? 'OUT_FOR_DELIVERY' : 'COMPLETED', isDelivery ? 'DELIVERED' : 'COMPLETED'];
            const currentStepIdx = statusSteps.indexOf(order.status);

            return (
              <div key={order._id} style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 2px 4px 0 rgba(0,0,0,0.06)', position: 'relative' }}>
                
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: '#0f172a' }}>#{order.orderNumber}</h3>
                      <button
                        onClick={() => handleDownloadInvoice(order._id, order.orderNumber)}
                        title="Download Official Tax Invoice PDF"
                        style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                      >
                        📄 Invoice PDF
                      </button>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                      {isDelivery ? '🚴 Hostel Room Delivery' : '🏪 Counter Pickup'} • <strong>{studentName}</strong>
                    </p>
                    {studentPhone && (
                      <a href={`tel:${studentPhone}`} style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'none', fontWeight: 'bold', display: 'inline-block', marginTop: '2px' }}>
                        📞 {studentPhone}
                      </a>
                    )}
                    {isDelivery && order.deliveryDetails && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#ea580c', fontWeight: 'bold' }}>
                        📍 {order.deliveryDetails.hostelName}, Room {order.deliveryDetails.roomNumber}
                      </p>
                    )}
                  </div>
                  <span style={{ backgroundColor: order.status === 'CANCELLED' ? '#fff1f2' : order.status === 'READY' ? '#ecfdf5' : '#fff7ed', color: order.status === 'CANCELLED' ? '#e11d48' : order.status === 'READY' ? '#047857' : '#c2410c', fontWeight: 'bold', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', border: order.status === 'CANCELLED' ? '1px solid #fecdd3' : order.status === 'READY' ? '1px solid #a7f3d0' : '1px solid #ffedd5' }}>
                    {order.status}
                  </span>
                </div>

                {/* Progress Stepper Bar */}
                {order.status !== 'CANCELLED' && (
                  <div style={{ backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                    {['Confirmed', 'Preparing', 'Ready', isDelivery ? 'Delivered' : 'Picked Up'].map((stLabel, idx) => {
                      const isActive = currentStepIdx >= idx || (order.status === 'DELIVERED' && idx === 3) || (order.status === 'COMPLETED' && idx === 3);
                      return (
                        <div key={stLabel} style={{ flex: 1, textAlign: 'center' }}>
                          <div style={{ height: '4px', backgroundColor: isActive ? '#ea580c' : '#e2e8f0', borderRadius: '2px', marginBottom: '4px' }} />
                          <span style={{ fontSize: '9.5px', fontWeight: isActive ? '800' : '600', color: isActive ? '#ea580c' : '#94a3b8' }}>{stLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Food Items Breakdown */}
                <div style={{ paddingTop: '8px', borderTop: '1px solid #f1f5f9', fontSize: '13px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>Items Ordered</div>
                  {order.items?.map((item, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
                        <span><strong>{item.quantity}×</strong> {item.name}</span>
                        <span style={{ fontWeight: 'bold' }}>{formatRupees(item.itemTotalInPaise)}</span>
                      </div>
                      {item.customizations && item.customizations.length > 0 && (
                        <div style={{ fontSize: '11px', color: '#64748b', marginLeft: '16px' }}>
                          + {item.customizations.map((c) => `${c.groupName || 'Option'}: ${c.selectedOption || c.optionName || ''}`).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', marginTop: '6px', borderTop: '1px dashed #e2e8f0', fontWeight: '800', color: '#0f172a', fontSize: '14px' }}>
                    <span>Total Amount Paid</span>
                    <span style={{ color: '#ea580c' }}>{formatRupees(order.pricingBreakdown?.totalInPaise || 0)}</span>
                  </div>
                </div>

                {/* Fast One-Touch Action Buttons */}
                <div style={{ paddingTop: '8px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {order.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'PREPARING')}
                      style={{ width: '100%', padding: '10px', backgroundColor: '#ea580c', color: '#ffffff', fontWeight: 'bold', fontSize: '13px', border: 'none', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(234,88,12,0.2)' }}
                    >
                      Start Preparing 🍳
                    </button>
                  )}

                  {order.status === 'PREPARING' && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'READY')}
                      style={{ width: '100%', padding: '10px', backgroundColor: '#059669', color: '#ffffff', fontWeight: 'bold', fontSize: '13px', border: 'none', borderRadius: '10px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(5,150,105,0.2)' }}
                    >
                      {isDelivery ? 'Food Packed & Ready for Dispatch 🍱' : 'Mark Ready for Counter Pickup 🍱'}
                    </button>
                  )}

                  {!isDelivery && order.status === 'READY' && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'COMPLETED')}
                      style={{ width: '100%', padding: '10px', backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 'bold', fontSize: '13px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
                    >
                      Confirm Counter Pickup Completed ✓
                    </button>
                  )}

                  {isDelivery && order.status === 'READY' && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'OUT_FOR_DELIVERY')}
                      style={{ width: '100%', padding: '10px', backgroundColor: '#d97706', color: '#ffffff', fontWeight: 'bold', fontSize: '13px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
                    >
                      Dispatch Canteen Delivery Staff 🚴
                    </button>
                  )}

                  {isDelivery && order.status === 'OUT_FOR_DELIVERY' && (
                    <button
                      onClick={() => handleUpdateStatus(order._id, 'DELIVERED')}
                      style={{ width: '100%', padding: '10px', backgroundColor: '#059669', color: '#ffffff', fontWeight: 'bold', fontSize: '13px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
                    >
                      Mark Delivered to Room 🎉
                    </button>
                  )}

                  {['COMPLETED', 'DELIVERED'].includes(order.status) && (
                    <div style={{ textAlign: 'center', fontSize: '12px', color: '#059669', fontWeight: 'bold', padding: '8px', backgroundColor: '#ecfdf5', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
                      ✓ Order Fulfilled & Completed
                    </div>
                  )}

                  {order.status === 'CANCELLED' && (
                    <div style={{ textAlign: 'center', fontSize: '12px', color: '#e11d48', fontWeight: 'bold', padding: '8px', backgroundColor: '#fff1f2', borderRadius: '10px', border: '1px solid #fecdd3' }}>
                      ❌ Order Cancelled
                    </div>
                  )}

                  {/* PROMINENT CONTROL BUTTONS */}
                  <div style={{ display: 'grid', gridTemplateColumns: order.status === 'CANCELLED' ? '1fr' : '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                    {order.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        style={{ padding: '8px 12px', backgroundColor: '#dc2626', color: '#ffffff', fontWeight: 'bold', fontSize: '12px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
                      >
                        ❌ Cancel
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteOrder(order._id)}
                      style={{ padding: '8px 12px', backgroundColor: '#475569', color: '#ffffff', fontWeight: 'bold', fontSize: '12px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MenuMgmtPage({ token, user }) {
  const initialCanteenId = user?.canteenProfile?.canteenId;
  const [activeCanteenId, setActiveCanteenId] = useState(initialCanteenId || '');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchMenuQuery, setSearchMenuQuery] = useState('');

  // Add Item Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemIsVeg, setNewItemIsVeg] = useState(true);
  const [newItemImgUrl, setNewItemImgUrl] = useState('');

  // Add Category Modal State
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const fetchMenu = async () => {
    setLoading(true);
    let targetId = activeCanteenId || initialCanteenId;
    try {
      if (!targetId) {
        const cRes = await axios.get(`${API_BASE}/canteens`);
        const cList = cRes.data?.data || cRes.data || [];
        if (Array.isArray(cList) && cList.length > 0) {
          targetId = cList[0]._id;
          setActiveCanteenId(targetId);
        }
      }
      if (!targetId) {
        setCategories([]);
        return;
      }
      const res = await axios.get(`${API_BASE}/canteens/${targetId}/menu`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const cats = res.data?.data?.categories || res.data?.data || [];
      setCategories(Array.isArray(cats) ? cats : []);
      if (Array.isArray(cats) && cats.length > 0 && !newItemCategory) {
        setNewItemCategory(cats[0]._id);
      }
    } catch (err) {
      console.error('Fetch menu error:', err);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [token]);

  const handleToggleAvailability = async (itemId, currentVal) => {
    try {
      await axios.patch(
        `${API_BASE}/menu-items/${itemId}/availability`,
        { isAvailable: !currentVal },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Stock availability updated');
      fetchMenu();
    } catch {
      toast.error('Failed to update availability');
    }
  };

  const handleDeleteItem = async (itemId, itemName) => {
    if (!window.confirm(`Delete ${itemName} from menu?`)) return;
    try {
      await axios.delete(`${API_BASE}/menu-items/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`${itemName} removed from menu`);
      fetchMenu();
    } catch {
      toast.error('Failed to delete menu item');
    }
  };

  const handleAddItemSubmit = async (e) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemPrice || !newItemCategory) {
      toast.error('Please enter name, category, and price');
      return;
    }

    const targetId = activeCanteenId || initialCanteenId;
    if (!targetId) {
      toast.error('Canteen ID not found');
      return;
    }

    try {
      await axios.post(
        `${API_BASE}/canteens/${targetId}/menu-items`,
        {
          categoryId: newItemCategory,
          name: newItemName,
          description: newItemDesc,
          priceInPaise: Math.round(parseFloat(newItemPrice) * 100),
          isVeg: newItemIsVeg,
          imageUrl: newItemImgUrl || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Added ${newItemName} to menu! 🎉`);
      setShowAddModal(false);
      setNewItemName('');
      setNewItemPrice('');
      setNewItemDesc('');
      setNewItemImgUrl('');
      fetchMenu();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to add item');
    }
  };

  const handleAddCategorySubmit = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toast.error('Please enter category name');
      return;
    }
    const targetId = activeCanteenId || initialCanteenId;
    try {
      await axios.post(
        `${API_BASE}/canteens/${targetId}/categories`,
        { name: newCatName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Category "${newCatName}" created!`);
      setNewCatName('');
      setShowAddCategoryModal(false);
      fetchMenu();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to create category');
    }
  };

  const formatRupees = (p) => `₹${((p || 0) / 100).toFixed(2)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#0f172a' }}>Menu & Stock Inventory</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Manage food prices, instantly toggle stock status, and add new items</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowAddCategoryModal(true)}
            style={{ backgroundColor: '#ffffff', color: '#ea580c', fontWeight: 'bold', border: '1px solid #ea580c', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', cursor: 'pointer' }}
          >
            + Add Category
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            style={{ backgroundColor: '#ea580c', color: '#ffffff', fontWeight: 'bold', border: 'none', padding: '10px 18px', borderRadius: '12px', fontSize: '13px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(234,88,12,0.2)' }}
          >
            + Add Menu Item
          </button>
        </div>
      </div>

      {/* Menu Item Search */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '14px', color: '#94a3b8' }}>🔍</span>
        <input
          type="text"
          value={searchMenuQuery}
          onChange={(e) => setSearchMenuQuery(e.target.value)}
          placeholder="Filter food items by name..."
          style={{ width: '100%', border: 'none', outline: 'none', fontSize: '14px', color: '#0f172a' }}
        />
        {searchMenuQuery && (
          <button onClick={() => setSearchMenuQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        )}
      </div>

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', maxWidth: '400px', width: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>Add Menu Category</h3>
              <button onClick={() => setShowAddCategoryModal(false)} style={{ backgroundColor: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>
            <form onSubmit={handleAddCategorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>Category Name</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. South Indian, Beverages, Rolls..."
                  style={{ width: '100%', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px', fontSize: '14px', color: '#0f172a', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowAddCategoryModal(false)} style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 'bold', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, backgroundColor: '#ea580c', color: '#ffffff', fontWeight: 'bold', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}>Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', maxWidth: '480px', width: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0f172a' }}>Add New Menu Item</h3>
              <button onClick={() => setShowAddModal(false)} style={{ backgroundColor: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            <form onSubmit={handleAddItemSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>Item Name</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Samosa Chaat, Paneer Roll..."
                  style={{ width: '100%', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px', fontSize: '14px', color: '#0f172a', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    style={{ width: '100%', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px', fontSize: '14px', color: '#0f172a', boxSizing: 'border-box' }}
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>Price (₹)</label>
                  <input
                    type="number"
                    step="1"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="e.g. 40"
                    style={{ width: '100%', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px', fontSize: '14px', color: '#0f172a', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>Description</label>
                <textarea
                  rows="2"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  placeholder="e.g. Served hot with sweet & mint chutney..."
                  style={{ width: '100%', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px', fontSize: '13px', color: '#0f172a', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>Food Image URL (Optional)</label>
                <input
                  type="text"
                  value={newItemImgUrl}
                  onChange={(e) => setNewItemImgUrl(e.target.value)}
                  placeholder="https://..."
                  style={{ width: '100%', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px', fontSize: '13px', color: '#0f172a', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="vegCheck"
                  checked={newItemIsVeg}
                  onChange={(e) => setNewItemIsVeg(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="vegCheck" style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', cursor: 'pointer' }}>Vegetarian (Green Dot)</label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 'bold', border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, backgroundColor: '#ea580c', color: '#ffffff', fontWeight: 'bold', border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer' }}
                >
                  Save Item →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ color: '#64748b' }}>Loading menu items...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {categories.map((cat) => {
            const filteredItems = (cat.items || []).filter((item) =>
              !searchMenuQuery || item.name.toLowerCase().includes(searchMenuQuery.toLowerCase())
            );

            if (searchMenuQuery && filteredItems.length === 0) return null;

            return (
              <div key={cat._id} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: '#ea580c' }}>{cat.name}</h3>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>{filteredItems.length} Items</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                  {filteredItems.map((item) => (
                    <div key={item._id} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.isVeg ? '#10b981' : '#f43f5e' }} />
                          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>{item.name}</h4>
                        </div>
                        <span style={{ fontSize: '13px', color: '#ea580c', fontWeight: 'bold' }}>{formatRupees(item.priceInPaise)}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => handleToggleAvailability(item._id, item.isAvailable)}
                          style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid transparent', backgroundColor: item.isAvailable ? '#ecfdf5' : '#fff1f2', color: item.isAvailable ? '#059669' : '#e11d48', borderColor: item.isAvailable ? '#a7f3d0' : '#fecdd3' }}
                        >
                          {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item._id, item.name)}
                          title="Delete Item"
                          style={{ padding: '6px 8px', borderRadius: '8px', fontSize: '12px', backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IssuesPage({ token }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('RESOLVED');
  const [submitting, setSubmitting] = useState(false);
  const [issueFilter, setIssueFilter] = useState('ALL');

  const fetchIssues = async () => {
    if (document.hidden) return;
    try {
      const { data } = await axios.get(`${API_BASE}/issues/canteen`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIssues(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
    const interval = setInterval(fetchIssues, 5000); // 5s real-time issue refresh
    return () => clearInterval(interval);
  }, [token]);

  const handleReply = async (issueId) => {
    if (!replyText.trim()) { toast.error('Reply message is required'); return; }
    setSubmitting(true);
    try {
      await axios.patch(
        `${API_BASE}/issues/${issueId}/reply`,
        { staffReply: replyText.trim(), status: replyStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Reply sent to student!');
      setReplyingTo(null);
      setReplyText('');
      fetchIssues();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const applyPresetReply = (text) => {
    setReplyText(text);
  };

  const ISSUE_LABELS = {
    WRONG_ITEMS: '❌ Wrong items',
    MISSING_ITEMS: '📦 Missing items',
    QUALITY_ISSUE: '😟 Quality issue',
    LATE_DELIVERY: '⏰ Late delivery',
    OVERCHARGED: '💸 Overcharged',
    NOT_DELIVERED: '🚫 Not delivered',
    OTHER: '📝 Other',
  };

  const STATUS_COLORS = {
    OPEN: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    IN_PROGRESS: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
    RESOLVED: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  };

  const filteredIssues = issues.filter((iss) => {
    if (issueFilter === 'OPEN') return iss.status === 'OPEN';
    if (issueFilter === 'RESOLVED') return iss.status === 'RESOLVED';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>⚠️ Student Issues Resolution Center</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
            Respond to student reports & quality complaints in real time.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'OPEN', 'RESOLVED'].map((st) => (
            <button
              key={st}
              onClick={() => setIssueFilter(st)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                border: '1px solid',
                backgroundColor: issueFilter === st ? '#7c3aed' : '#ffffff',
                color: issueFilter === st ? '#ffffff' : '#475569',
                borderColor: issueFilter === st ? '#7c3aed' : '#e2e8f0',
              }}
            >
              {st} ({st === 'ALL' ? issues.length : issues.filter((i) => i.status === st).length})
            </button>
          ))}
          <button
            onClick={fetchIssues}
            style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#94a3b8' }}>Loading issues...</p>
      ) : filteredIssues.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
          <p style={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}>No student issues found!</p>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>All reported problems have been addressed.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredIssues.map((issue) => {
            const sc = STATUS_COLORS[issue.status] || STATUS_COLORS.OPEN;
            const isReplying = replyingTo === issue._id;

            return (
              <div key={issue._id} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                {/* Issue Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>
                        Order #{issue.orderNumber}
                      </span>
                      <span style={{ fontSize: '12px', backgroundColor: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, borderRadius: '20px', padding: '2px 10px', fontWeight: '700' }}>
                        {issue.status}
                      </span>
                      <span style={{ fontSize: '12px', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '8px', padding: '2px 8px', fontWeight: '600' }}>
                        {ISSUE_LABELS[issue.issueType] || issue.issueType}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                      Student: <strong style={{ color: '#475569' }}>{issue.studentId?.name || 'Student'}</strong>
                      {issue.studentId?.phone && (
                        <a href={`tel:${issue.studentId.phone}`} style={{ marginLeft: '6px', color: '#2563eb', textDecoration: 'none', fontWeight: 'bold' }}>
                          📞 {issue.studentId.phone}
                        </a>
                      )}
                      {' • '}
                      {new Date(issue.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* Student Message */}
                <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '14px', marginBottom: '12px', borderLeft: '3px solid #7c3aed' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase', marginBottom: '4px' }}>Student Report</div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>{issue.studentMessage}</p>
                </div>

                {/* Staff Reply (if exists) */}
                {issue.staffReply && (
                  <div style={{ backgroundColor: '#f0fdf4', borderRadius: '12px', padding: '14px', marginBottom: '12px', borderLeft: '3px solid #16a34a' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase', marginBottom: '4px' }}>Canteen Staff Response</div>
                    <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>{issue.staffReply}</p>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                      Replied {new Date(issue.repliedAt || issue.updatedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )}

                {/* Reply Form */}
                {!issue.staffReply && !isReplying && (
                  <button
                    onClick={() => { setReplyingTo(issue._id); setReplyText(''); }}
                    style={{ backgroundColor: '#7c3aed', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    💬 Reply to Student
                  </button>
                )}

                {isReplying && (
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Quick Presets */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', alignSelf: 'center' }}>Quick Templates:</span>
                      <button onClick={() => applyPresetReply('Apologies! We are preparing your fresh item right now.')} style={{ fontSize: '11px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>Fresh Item Preparing</button>
                      <button onClick={() => applyPresetReply('Sorry for the delay. Our delivery partner is at your hostel now.')} style={{ fontSize: '11px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>Delivery Partner En Route</button>
                      <button onClick={() => applyPresetReply('Refund has been processed to your payment method.')} style={{ fontSize: '11px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>Refund Processed</button>
                    </div>

                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write your official reply to the student..."
                      rows={3}
                      style={{ width: '100%', border: '1.5px solid #c4b5fd', borderRadius: '12px', padding: '12px', fontSize: '14px', color: '#1e293b', resize: 'vertical', fontFamily: 'system-ui', boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <select
                        value={replyStatus}
                        onChange={(e) => setReplyStatus(e.target.value)}
                        style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', fontWeight: '600', color: '#475569', backgroundColor: '#f8fafc' }}
                      >
                        <option value="RESOLVED">✅ Mark as Resolved</option>
                        <option value="IN_PROGRESS">🔄 Mark as In Progress</option>
                      </select>
                      <button
                        onClick={() => handleReply(issue._id)}
                        disabled={submitting}
                        style={{ backgroundColor: '#7c3aed', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        {submitting ? 'Sending...' : '📨 Send Reply'}
                      </button>
                      <button
                        onClick={() => { setReplyingTo(null); setReplyText(''); }}
                        style={{ backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SVGDonutChart({ data }) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  if (total === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#94a3b8', padding: '30px', fontSize: '13px' }}>
        No order status data available yet
      </div>
    );
  }

  let accumulatedAngle = 0;
  const radius = 65;
  const strokeWidth = 22;
  const center = 85;
  const circumference = 2 * Math.PI * radius;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '20px' }}>
      <div style={{ position: 'relative', width: '170px', height: '170px' }}>
        <svg width="170" height="170" viewBox="0 0 170 170" style={{ transform: 'rotate(-90deg)' }}>
          {data.map((item, index) => {
            if (item.value === 0) return null;
            const strokeDasharray = `${(item.value / total) * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedAngle;
            accumulatedAngle += (item.value / total) * circumference;

            return (
              <circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease' }}
              />
            );
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{total}</span>
          <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Orders</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '170px' }}>
        {data.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} />
              <span style={{ fontWeight: '600', color: '#334155' }}>{item.label}</span>
            </div>
            <div style={{ fontWeight: '800', color: '#0f172a' }}>
              {item.value} <span style={{ fontSize: '11px', color: '#94a3b8' }}>({Math.round((item.value / total) * 100)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SVGBarChart({ orders }) {
  const timeSlots = [
    { label: '8AM-10AM', start: 8, end: 10 },
    { label: '10AM-12PM', start: 10, end: 12 },
    { label: '12PM-2PM', start: 12, end: 14 },
    { label: '2PM-4PM', start: 14, end: 16 },
    { label: '4PM-6PM', start: 16, end: 18 },
    { label: '6PM-8PM', start: 18, end: 20 },
    { label: '8PM-10PM', start: 20, end: 22 },
  ];

  const chartData = timeSlots.map((slot) => {
    const slotOrders = orders.filter((o) => {
      if (o.status === 'CANCELLED') return false;
      const hour = new Date(o.createdAt).getHours();
      return hour >= slot.start && hour < slot.end;
    });
    const totalPaise = slotOrders.reduce((sum, o) => sum + (o.pricingBreakdown?.totalInPaise || 0), 0);
    return { label: slot.label, rupees: Math.round(totalPaise / 100), count: slotOrders.length };
  });

  const maxRupees = Math.max(...chartData.map((d) => d.rupees), 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '170px', paddingTop: '16px', borderBottom: '1px solid #e2e8f0' }}>
        {chartData.map((bar, idx) => {
          const heightPercent = maxRupees > 0 ? (bar.rupees / maxRupees) * 100 : 0;
          return (
            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '10px', fontWeight: '800', color: bar.rupees > 0 ? '#ea580c' : '#cbd5e1' }}>
                ₹{bar.rupees}
              </span>
              <div
                style={{
                  width: '55%',
                  maxWidth: '34px',
                  height: `${Math.max(heightPercent, 4)}%`,
                  borderRadius: '6px 6px 0 0',
                  transition: 'height 0.5s ease',
                  background: bar.rupees > 0 ? 'linear-gradient(to top, #ea580c, #fb923c)' : '#f1f5f9',
                }}
              />
              <span style={{ fontSize: '10px', fontWeight: '600', color: '#64748b' }}>{bar.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnalyticsPage({ token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    if (document.hidden) return;
    try {
      const res = await axios.get(`${API_BASE}/orders/canteen/queue?allStatus=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 6000); // 6-second real-time sync
    return () => clearInterval(interval);
  }, [token]);

  const totalOrders = orders.length;
  const confirmedCount = orders.filter((o) => o.status === 'CONFIRMED').length;
  const preparingCount = orders.filter((o) => o.status === 'PREPARING').length;
  const readyCount = orders.filter((o) => o.status === 'READY').length;
  const deliveredCount = orders.filter((o) => ['COMPLETED', 'DELIVERED'].includes(o.status)).length;
  const cancelledCount = orders.filter((o) => o.status === 'CANCELLED').length;

  const totalRevenuePaise = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.pricingBreakdown?.totalInPaise || 0), 0);

  const deliveryOrdersCount = orders.filter((o) => o.fulfillmentType === 'DELIVERY').length;
  const pickupOrdersCount = orders.filter((o) => o.fulfillmentType === 'PICKUP').length;

  // Pie chart data
  const statusPieData = [
    { label: 'Confirmed', value: confirmedCount, color: '#3b82f6' },
    { label: 'Preparing', value: preparingCount, color: '#f59e0b' },
    { label: 'Ready', value: readyCount, color: '#8b5cf6' },
    { label: 'Delivered', value: deliveredCount, color: '#10b981' },
    { label: 'Cancelled', value: cancelledCount, color: '#ef4444' },
  ];

  // Bestselling items
  const itemMap = {};
  orders.forEach((o) => {
    if (o.status === 'CANCELLED') return;
    (o.items || []).forEach((it) => {
      const name = it.name || it.menuItemId?.name || 'Canteen Special Item';
      if (!itemMap[name]) itemMap[name] = 0;
      itemMap[name] += it.quantity || 1;
    });
  });

  const topItems = Object.entries(itemMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const formatRupees = (p) => `₹${((p || 0) / 100).toFixed(2)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#0f172a' }}>📊 Daily Sales & Kitchen Performance Analytics</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Real-time sales graphs, pie charts & order fulfillment metrics</p>
        </div>
        <span style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '12px', fontWeight: '800', padding: '4px 12px', borderRadius: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block' }} />
          LIVE 2S SYNC ACTIVE
        </span>
      </div>

      {loading ? (
        <p style={{ color: '#64748b' }}>Loading real-time analytics...</p>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Gross Revenue</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#ea580c', marginTop: '4px' }}>{formatRupees(totalRevenuePaise)}</div>
              <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold', marginTop: '2px' }}>✓ Online Payments</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Total Orders</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{totalOrders}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Processed Today</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Success Rate</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>
                {totalOrders > 0 ? `${Math.round((deliveredCount / totalOrders) * 100)}%` : '100%'}
              </div>
              <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>{deliveredCount} Delivered</div>
            </div>

            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Cancellation</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#e11d48', marginTop: '4px' }}>
                {totalOrders > 0 ? `${Math.round((cancelledCount / totalOrders) * 100)}%` : '0%'}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{cancelledCount} Cancelled</div>
            </div>
          </div>

          {/* Charts Row: Pie Chart + Hourly Bar Graph */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Pie / Donut Chart */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>🥧 Status Distribution</h3>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Pie Chart</span>
              </div>
              <SVGDonutChart data={statusPieData} />
            </div>

            {/* Hourly Sales Bar Graph */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>📈 Peak Hourly Revenue</h3>
                <span style={{ fontSize: '11px', color: '#ea580c', fontWeight: 'bold' }}>Bar Graph</span>
              </div>
              <SVGBarChart orders={orders} />
            </div>
          </div>

          {/* Fulfillment Distribution + Bestsellers Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Fulfillment Type Breakdown */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>🚴 Fulfillment Channel Ratio</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ backgroundColor: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', marginBottom: '4px' }}>🚴</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#ea580c' }}>{deliveryOrdersCount}</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#c2410c' }}>Room Delivery</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    {totalOrders > 0 ? `${Math.round((deliveryOrdersCount / totalOrders) * 100)}%` : '0%'}
                  </div>
                </div>

                <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '28px', marginBottom: '4px' }}>🏪</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#2563eb' }}>{pickupOrdersCount}</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#1d4ed8' }}>Counter Pickup</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                    {totalOrders > 0 ? `${Math.round((pickupOrdersCount / totalOrders) * 100)}%` : '0%'}
                  </div>
                </div>
              </div>
            </div>

            {/* Bestseller Food Ranking */}
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>🔥 Top Bestselling Food Items</h3>
              {topItems.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>No item sales recorded yet today.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {topItems.map(([name, qty], idx) => {
                    const maxQty = topItems[0][1] || 1;
                    const fillPercent = (qty / maxQty) * 100;
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifySelf: 'space-between', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span style={{ fontWeight: '700', color: '#1e293b' }}>
                            #{idx + 1} {name}
                          </span>
                          <span style={{ fontWeight: '800', color: '#ea580c' }}>{qty} sold</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${fillPercent}%`, height: '100%', backgroundColor: '#f97316', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
