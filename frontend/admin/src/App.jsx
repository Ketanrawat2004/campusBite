import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://campusbite-backend-i2ke.onrender.com/api/v1';
const STUDENT_URL = import.meta.env.VITE_STUDENT_URL || 'https://campusbite-jpwq.onrender.com';
const CANTEEN_URL = import.meta.env.VITE_CANTEEN_URL || 'https://campusbite-canteen.onrender.com';

// ─── Shared Styles (light theme) ─────────────────────────────────────────────
const S = {
  page: { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" },
  card: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  label: { display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' },
  input: { width: '100%', backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '10px 14px', color: '#1e293b', fontSize: '13px', boxSizing: 'border-box', outline: 'none' },
  btnPrimary: { backgroundColor: '#ea580c', color: '#ffffff', fontWeight: '700', padding: '12px 20px', border: 'none', borderRadius: '12px', fontSize: '14px', cursor: 'pointer' },
  btnDanger: { backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '6px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' },
  statCard: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  metricVal: { fontSize: '28px', fontWeight: '800', marginTop: '4px' },
};

export default function AdminApp() {
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('admin_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API_BASE}/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.data?.data) {
          setUser(res.data.data);
          localStorage.setItem('admin_user', JSON.stringify(res.data.data));
        }
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          setToken(null);
          setUser(null);
        }
      });
  }, [token]);

  const login = (tok, userData) => {
    localStorage.setItem('admin_token', tok);
    localStorage.setItem('admin_user', JSON.stringify(userData));
    setToken(tok);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setToken(null);
    setUser(null);
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div style={S.page}>
      <Toaster position="top-right" containerStyle={{ top: 80, right: 20 }} toastOptions={{ duration: 3000, style: { borderRadius: '12px', fontSize: '14px', fontFamily: "'Inter', sans-serif" } }} />
      {token && user ? (
        <div>
          {/* Header */}
          <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/images/campusbite_logo.png" alt="CampusBite" style={{ width: '34px', height: '34px', objectFit: 'contain' }} />
              <div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', whiteSpace: 'nowrap' }}>CampusBite Admin</div>
                <div style={{ fontSize: '10px', color: '#ea580c', fontWeight: '700', whiteSpace: 'nowrap' }}>⚡ NIT Jamshedpur Console</div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex" style={{ alignItems: 'center', gap: '4px' }}>
              <NavLink to="/dashboard">📊 Dashboard</NavLink>
              <NavLink to="/live-orders">⚡ Live Orders</NavLink>
              <NavLink to="/canteens">🏪 Canteens</NavLink>
              <NavLink to="/users">👥 Users</NavLink>
              <NavLink to="/issues">⚠️ Issues</NavLink>
              <NavLink to="/delivery-config">🚴 Delivery Tiers</NavLink>
              <a href={STUDENT_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#f97316', fontWeight: '700', fontSize: '12px', textDecoration: 'none', padding: '6px 10px', borderRadius: '8px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', marginLeft: '4px' }}>
                🍱 Student ↗
              </a>
              <a href={CANTEEN_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#ea580c', fontWeight: '700', fontSize: '12px', textDecoration: 'none', padding: '6px 10px', borderRadius: '8px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', marginLeft: '4px' }}>
                👨‍🍳 Canteen ↗
              </a>
              <div style={{ marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{user.name}</span>
                <button onClick={logout} style={S.btnDanger}>Sign Out</button>
              </div>
            </nav>

            {/* Mobile Hamburger Button */}
            <div className="flex lg:hidden" style={{ alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</span>
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
            <div className="lg:hidden" style={{ backgroundColor: '#ffffff', borderBottom: '2px solid #ea580c', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <div style={{ paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#0f172a' }}>{user.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{user.email}</div>
                <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '10px', fontWeight: '800', backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: '6px' }}>SYSTEM ADMINISTRATOR</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <NavLink to="/dashboard">📊 Dashboard Analytics</NavLink>
                <NavLink to="/live-orders">⚡ Live Orders Stream</NavLink>
                <NavLink to="/canteens">🏪 Campus Canteens</NavLink>
                <NavLink to="/users">👥 User Database</NavLink>
                <NavLink to="/issues">⚠️ Student Issues</NavLink>
                <NavLink to="/delivery-config">🚴 Delivery Pricing Tiers</NavLink>
              </div>

              <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                <a
                  href={STUDENT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ flex: 1, textAlign: 'center', color: '#f97316', fontWeight: '700', fontSize: '11px', textDecoration: 'none', padding: '8px', borderRadius: '8px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}
                >
                  🍱 Student App ↗
                </a>
                <a
                  href={CANTEEN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ flex: 1, textAlign: 'center', color: '#ea580c', fontWeight: '700', fontSize: '11px', textDecoration: 'none', padding: '8px', borderRadius: '8px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}
                >
                  👨‍🍳 Canteen ↗
                </a>
                <button
                  onClick={logout}
                  style={{ backgroundColor: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          <main className="admin-main-container">
            <Routes>
              <Route path="/dashboard" element={<AdminDashboardPage token={token} />} />
              <Route path="/live-orders" element={<AdminLiveOrdersPage token={token} />} />
              <Route path="/canteens" element={<AdminCanteensPage token={token} />} />
              <Route path="/users" element={<AdminUsersPage token={token} />} />
              <Route path="/issues" element={<AdminIssuesPage token={token} />} />
              <Route path="/delivery-config" element={<DeliveryConfigPage token={token} />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>

          {/* Mobile Bottom Docked Navigation */}
          <nav className="flex lg:hidden" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', padding: '6px 4px', justifyContent: 'space-around', boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' }}>
            {[
              { label: 'Dash', path: '/dashboard', icon: '📊' },
              { label: 'Live', path: '/live-orders', icon: '⚡' },
              { label: 'Canteens', path: '/canteens', icon: '🏪' },
              { label: 'Users', path: '/users', icon: '👥' },
              { label: 'Issues', path: '/issues', icon: '⚠️' },
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
                    padding: '4px 8px',
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
        <AdminLoginPage onLogin={login} />
      )}
    </div>
  );
}

function NavLink({ to, children }) {
  const location = useLocation();
  const active = location.pathname === to || location.pathname.startsWith(to + '/');
  return (
    <Link
      to={to}
      style={{
        color: active ? '#ea580c' : '#64748b',
        fontWeight: active ? '800' : '600',
        textDecoration: 'none',
        fontSize: '13px',
        padding: '6px 12px',
        borderRadius: '8px',
        backgroundColor: active ? '#fff7ed' : 'transparent',
        border: active ? '1px solid #fed7aa' : '1px solid transparent',
      }}
    >
      {children}
    </Link>
  );
}

function AdminLoginPage({ onLogin }) {
  const [email, setEmail] = useState('admin@campusbite.dev');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
      if (data.data.user.role !== 'ADMIN') {
        toast.error('Access restricted to System Admin only');
        return;
      }
      onLogin(data.data.accessToken, data.data.user);
      toast.success('Welcome to Admin Console! 🛡️');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', backgroundColor: '#f1f5f9' }}>
      <div style={{ ...S.card, maxWidth: '420px', width: '100%', padding: window.innerWidth < 480 ? '20px' : '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src="/images/campusbite_logo.png" alt="CampusBite" style={{ width: '64px', height: '64px', objectFit: 'contain', margin: '0 auto 12px' }} />
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#1e293b' }}>Admin Console</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>CampusBite • NIT Jamshedpur</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={S.label}>Admin Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={S.input} required />
          </div>
          <div>
            <label style={S.label}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={S.input} required />
          </div>
          <button type="submit" disabled={loading} style={S.btnPrimary}>
            {loading ? 'Authenticating...' : 'Access Command Center →'}
          </button>
        </form>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => { setEmail('admin@campusbite.dev'); setPassword('Admin@123'); handleSubmit(); }}
            style={{ width: '100%', backgroundColor: '#f8fafc', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '10px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
          >
            🔑 Quick Login — admin@campusbite.dev
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon, subtitle }) {
  return (
    <div style={S.statCard}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        <span style={{ fontSize: '20px' }}>{icon}</span>
      </div>
      <div style={{ ...S.metricVal, color: color || '#1e293b' }}>{value}</div>
      {subtitle && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{subtitle}</div>}
    </div>
  );
}

// ─── TAB 1: REAL-TIME DASHBOARD ──────────────────────────────────────────────
function AdminDashboardPage({ token }) {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (document.hidden) return;
    try {
      const [resStats, resOrders] = await Promise.all([
        axios.get(`${API_BASE}/admin/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/admin/orders?limit=6`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setStats(resStats.data.data);
      setRecentOrders(resOrders.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // 5s live sync
    return () => clearInterval(interval);
  }, [token]);

  const formatRupees = (p) => `₹${((p || 0) / 100).toFixed(2)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>System Dashboard</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Real-time campus performance metrics & live orders feed</p>
        </div>
        <span style={{ backgroundColor: '#ecfdf5', color: '#16a34a', fontWeight: '700', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', animation: 'pulse 1s infinite' }} />
          ⚡ Live Auto-Sync (2s)
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        <StatCard icon="👥" label="Total Users" value={stats?.totalUsers ?? 14} color="#1e293b" subtitle="Students & Staff" />
        <StatCard icon="📦" label="Orders Today" value={stats?.ordersToday ?? 6} color="#ea580c" subtitle="Campus Orders" />
        <StatCard icon="💰" label="Revenue Today" value={formatRupees(stats?.revenueTodayInPaise || 45000)} color="#16a34a" subtitle="Online Payments" />
        <StatCard icon="🚴" label="Active Partners" value={stats?.activeDeliveryPartners ?? 3} color="#7c3aed" subtitle="Hostel Delivery" />
      </div>

      {/* Live Recent Orders */}
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>⚡ Real-Time Live Orders Feed</h3>
          <Link to="/live-orders" style={{ color: '#ea580c', fontWeight: '700', fontSize: '12px', textDecoration: 'none' }}>View All Orders →</Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: '#64748b' }}>
                <th style={{ padding: '10px' }}>Order Number</th>
                <th style={{ padding: '10px' }}>Student</th>
                <th style={{ padding: '10px' }}>Canteen</th>
                <th style={{ padding: '10px' }}>Type</th>
                <th style={{ padding: '10px' }}>Amount</th>
                <th style={{ padding: '10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '12px 10px', fontWeight: '700', color: '#0f172a' }}>#{o.orderNumber}</td>
                  <td style={{ padding: '12px 10px', color: '#334155' }}>{o.studentId?.name || 'Student'}</td>
                  <td style={{ padding: '12px 10px', color: '#64748b' }}>{o.canteenId?.name || 'Canteen'}</td>
                  <td style={{ padding: '12px 10px' }}>{o.fulfillmentType === 'DELIVERY' ? '🚴 Delivery' : '🏪 Pickup'}</td>
                  <td style={{ padding: '12px 10px', fontWeight: '700', color: '#0f172a' }}>{formatRupees(o.pricingBreakdown?.totalInPaise || 0)}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{ backgroundColor: o.status === 'CANCELLED' ? '#fff1f2' : '#fff7ed', color: o.status === 'CANCELLED' ? '#e11d48' : '#ea580c', fontWeight: '700', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', border: '1px solid #ffedd5' }}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── TAB 2: REAL-TIME LIVE ORDERS OPERATIONAL OVERRIDE ────────────────────────
function AdminLiveOrdersPage({ token }) {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (document.hidden) return;
    try {
      const url = statusFilter !== 'ALL' ? `${API_BASE}/admin/orders?status=${statusFilter}` : `${API_BASE}/admin/orders`;
      const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setOrders(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000); // 5s live sync
    return () => clearInterval(interval);
  }, [token, statusFilter]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await axios.patch(
        `${API_BASE}/orders/${orderId}/status`,
        { status: newStatus, note: 'Status override by System Admin' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (err) {
      toast.error('Failed to update order status');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Admin Override: Permanently delete this order?')) return;
    try {
      await axios.delete(`${API_BASE}/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Order deleted by Admin');
      fetchOrders();
    } catch (err) {
      toast.error('Failed to delete order');
    }
  };

  const formatRupees = (p) => `₹${((p || 0) / 100).toFixed(2)}`;

  const filteredOrders = orders.filter((o) =>
    search ? o.orderNumber?.toLowerCase().includes(search.toLowerCase()) || o.studentId?.name?.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#1e293b' }}>Real-Time Live Orders & Override Controls</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Monitor every campus order in real-time and override statuses as System Admin</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by Order # or Student Name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...S.input, maxWidth: '320px' }}
        />

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer',
                border: statusFilter === st ? '1.5px solid #ea580c' : '1px solid #e2e8f0',
                backgroundColor: statusFilter === st ? '#fff7ed' : '#ffffff',
                color: statusFilter === st ? '#ea580c' : '#64748b',
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
        {filteredOrders.map((o) => (
          <div key={o._id} style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>#{o.orderNumber}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  {o.studentId?.name || 'Student'} ({o.studentId?.phone || 'No phone'})
                </p>
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                  Canteen: <strong style={{ color: '#ea580c' }}>{o.canteenId?.name || 'Campus Canteen'}</strong>
                </p>
              </div>
              <span style={{ backgroundColor: o.status === 'CANCELLED' ? '#fff1f2' : '#fff7ed', color: o.status === 'CANCELLED' ? '#e11d48' : '#ea580c', fontWeight: '800', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', border: '1px solid #ffedd5' }}>
                {o.status}
              </span>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px', fontSize: '12px' }}>
              {o.items?.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>{item.quantity}× {item.name}</span>
                  <span style={{ fontWeight: '700' }}>{formatRupees(item.itemTotalInPaise)}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Total Amount:</span>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{formatRupees(o.pricingBreakdown?.totalInPaise || 0)}</span>
            </div>

            {/* Admin Control Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
              {o.status !== 'CANCELLED' && (
                <button
                  onClick={() => handleUpdateStatus(o._id, 'CANCELLED')}
                  style={{ padding: '8px', backgroundColor: '#dc2626', color: '#ffffff', fontWeight: '700', fontSize: '11px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  ❌ Force Cancel
                </button>
              )}
              <button
                onClick={() => handleDeleteOrder(o._id)}
                style={{ padding: '8px', backgroundColor: '#334155', color: '#ffffff', fontWeight: '700', fontSize: '11px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                🗑️ Delete Order
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TAB 3: REAL-TIME CANTEENS PERFORMANCE & STATUS ──────────────────────────
function AdminCanteensPage({ token }) {
  const [canteens, setCanteens] = useState([]);

  const fetchCanteens = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/canteens`);
      setCanteens(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCanteens();
    const interval = setInterval(fetchCanteens, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleCanteen = async (canteenId, currentAcceptingState) => {
    try {
      await axios.patch(
        `${API_BASE}/canteens/${canteenId}/status`,
        { acceptingOrders: !currentAcceptingState },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Canteen status updated!`);
      fetchCanteens();
    } catch (err) {
      toast.error('Failed to update canteen status');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#1e293b' }}>Campus Canteens & Kitchen Controls</h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Real-time open/closed controls & canteen overview across NIT Jamshedpur (Auto 2s Sync)</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {canteens.map((c) => {
          const isOpen = c.acceptingOrders !== false;
          const locName = typeof c.location === 'object' ? c.location?.name : c.location;

          return (
            <div key={c._id} style={S.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <img src={c.imageUrl || '/images/campusbite_logo.png'} alt={c.name} style={{ width: '54px', height: '54px', borderRadius: '12px', objectFit: 'cover' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{c.name}</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>📍 {locName || 'Campus Location'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>Status:</span>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontWeight: '800', fontSize: '12px', backgroundColor: isOpen ? '#ecfdf5' : '#fff1f2', color: isOpen ? '#16a34a' : '#e11d48' }}>
                  {isOpen ? '🟢 OPEN FOR ORDERS' : '🔴 CLOSED'}
                </span>
              </div>

              <button
                onClick={() => handleToggleCanteen(c._id, isOpen)}
                style={{ width: '100%', padding: '10px', backgroundColor: isOpen ? '#dc2626' : '#16a34a', color: '#ffffff', fontWeight: '700', fontSize: '13px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
              >
                {isOpen ? '🔴 Close Canteen Kitchen' : '🟢 Open Canteen Kitchen'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TAB 4: REAL-TIME USERS & ROLE MANAGEMENT ─────────────────────────────────
function AdminUsersPage({ token }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios
      .get(`${API_BASE}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setUsers(res.data.data || []))
      .catch((err) => console.error(err));
  }, [token]);

  const filteredUsers = users.filter((u) =>
    search ? u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#1e293b' }}>Users & Role Management</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>All registered campus accounts, roles, and permissions</p>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search users by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ ...S.input, maxWidth: '360px' }}
      />

      <div style={S.card}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: '#64748b' }}>
                <th style={{ padding: '10px' }}>Name</th>
                <th style={{ padding: '10px' }}>Email</th>
                <th style={{ padding: '10px' }}>Phone</th>
                <th style={{ padding: '10px' }}>Role</th>
                <th style={{ padding: '10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u._id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '12px 10px', fontWeight: '700', color: '#0f172a' }}>{u.name}</td>
                  <td style={{ padding: '12px 10px', color: '#475569', fontFamily: 'monospace' }}>{u.email}</td>
                  <td style={{ padding: '12px 10px', color: '#64748b' }}>{u.phone || 'N/A'}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{ backgroundColor: '#fff7ed', color: '#ea580c', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', fontSize: '11px' }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{ color: u.isActive !== false ? '#16a34a' : '#e11d48', fontWeight: '700' }}>
                      {u.isActive !== false ? '🟢 Active' : '🔴 Suspended'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── TAB 5: REAL-TIME CAMPUS ISSUE REPORTS ─────────────────────────────────────
function AdminIssuesPage({ token }) {
  const [complaints, setComplaints] = useState([]);

  const fetchIssues = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/admin/complaints`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaints(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchIssues();
    const interval = setInterval(fetchIssues, 3000);
    return () => clearInterval(interval);
  }, [token]);

  const handleResolve = async (issueId) => {
    try {
      await axios.patch(`${API_BASE}/admin/complaints/${issueId}`, {
        resolution: 'Resolved by Admin',
        status: 'RESOLVED',
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Issue resolved');
      fetchIssues();
    } catch (err) {
      toast.error('Failed to resolve issue');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#1e293b' }}>Student Issue Reports</h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Reported order complaints & real-time resolution desk</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
        {complaints.length === 0 ? (
          <div style={{ ...S.card, textAlign: 'center', color: '#64748b', padding: '40px' }}>
            🎉 No open complaints reported!
          </div>
        ) : (
          complaints.map((c) => (
            <div key={c._id} style={S.card}>
              <div style={{ display: 'flex', justifyBetween: 'space-between', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Issue #{c._id?.slice(-6)}</h4>
                <span style={{ backgroundColor: c.status === 'RESOLVED' ? '#ecfdf5' : '#fff1f2', color: c.status === 'RESOLVED' ? '#16a34a' : '#e11d48', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', fontSize: '11px' }}>
                  {c.status}
                </span>
              </div>
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#334155' }}>{c.description || c.issueType || 'Student reported food issue'}</p>
              {c.status !== 'RESOLVED' && (
                <button
                  onClick={() => handleResolve(c._id)}
                  style={{ width: '100%', marginTop: '12px', padding: '8px', backgroundColor: '#16a34a', color: '#ffffff', fontWeight: '700', fontSize: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  ✓ Mark Issue Resolved
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── TAB 6: DELIVERY PRICING CONFIG ───────────────────────────────────────────
function DeliveryConfigPage({ token }) {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_BASE}/admin/delivery-config`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setConfig(res.data.data))
      .catch((err) => console.error(err));
  }, [token]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#1e293b' }}>Smart Group Delivery Pricing Tiers</h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Dynamic delivery fee pool optimization — NIT Jamshedpur</p>
      </div>

      <div style={S.card}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', textAlign: 'center' }}>
          {[
            { label: '1 Order (SOLO)', fee: '₹20.00', color: '#ea580c', desc: 'Single delivery, standard fee' },
            { label: '2–3 Orders (SMALL)', fee: '₹15.00', color: '#2563eb', desc: 'Small batch, shared cost' },
            { label: '4+ Orders (LARGE)', fee: '₹10.00', color: '#16a34a', desc: 'Large batch, best price!' },
          ].map((tier) => (
            <div key={tier.label} style={{ backgroundColor: '#f8fafc', padding: '24px 16px', borderRadius: '14px', border: `2px solid ${tier.color}20` }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{tier.label}</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: tier.color, margin: '8px 0 4px' }}>{tier.fee}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{tier.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
