import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Student Pages
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import ResetPasswordPage from './pages/ResetPassword';
import HomePage from './pages/Home';
import CanteenListPage from './pages/CanteenList';
import CanteenDetailPage from './pages/CanteenDetail';
import CheckoutPage from './pages/Checkout';
import OrderTrackingPage from './pages/OrderTracking';
import OrderHistoryPage from './pages/OrderHistory';
import NotificationsPage from './pages/Notifications';
import ProfilePage from './pages/Profile';
import ReportIssuePage from './pages/ReportIssue';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500">
        Loading...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500">
        Loading...
      </div>
    );
  }
  if (user) return <Navigate to="/home" replace />;
  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500">Loading...</div>;
  if (user) return <Navigate to="/home" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Root URL redirects to /login if not authenticated, or /home if authenticated */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public Auth pages (Sign In, Register, Reset Password) */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Protected Student Portal — Accessible only AFTER signing in or registering */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/canteens" element={<CanteenListPage />} />
          <Route path="/canteens/:id" element={<CanteenDetailPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrderHistoryPage />} />
          <Route path="/orders/:id" element={<OrderTrackingPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/report-issue/:orderId" element={<ReportIssuePage />} />
        </Route>

        {/* Catch-all redirects to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
