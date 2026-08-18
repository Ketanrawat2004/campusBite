import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/client';
import toast from 'react-hot-toast';

function getPasswordStrength(pwd) {
  let score = 0;
  const checks = {
    length:  pwd.length >= 8,
    upper:   /[A-Z]/.test(pwd),
    lower:   /[a-z]/.test(pwd),
    number:  /\d/.test(pwd),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
  };
  score = Object.values(checks).filter(Boolean).length;
  if (score <= 2) return { label: 'Weak',   color: '#ef4444', width: '25%',  checks };
  if (score === 3) return { label: 'Fair',   color: '#f97316', width: '50%',  checks };
  if (score === 4) return { label: 'Good',   color: '#eab308', width: '75%',  checks };
  return            { label: 'Strong', color: '#22c55e', width: '100%', checks };
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!strength.checks.length || !strength.checks.upper || !strength.checks.lower ||
        !strength.checks.number || !strength.checks.special) {
      toast.error('Password must be strong (8+ chars, upper, lower, number, special char)');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await axiosClient.post('/auth/forgot-password', { email: email.trim(), newPassword });
      setSuccess(true);
      toast.success('Password updated successfully!');
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-6 sm:mb-8">
          <img
            src="/images/campusbite_logo.png"
            alt="CampusBite"
            className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 object-contain rounded-2xl shadow-md"
          />
          <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900">Reset Password</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Enter your registered email and new unique password</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-xl">
          {success ? (
            <div className="text-center space-y-4">
              <div className="text-4xl sm:text-5xl">✅</div>
              <p className="text-slate-700 font-semibold text-base sm:text-lg">Password Updated!</p>
              <p className="text-slate-500 text-xs sm:text-sm">Redirecting you to sign in...</p>
              <Link to="/login" className="btn btn-primary w-full font-bold block text-center text-xs sm:text-sm py-2.5">
                Sign In Now →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1" htmlFor="email">
                  Registered Email *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@nitjsr.ac.in"
                  className="input bg-white text-slate-900 placeholder-slate-400 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1" htmlFor="new-password">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 chars, upper, lower, number, symbol"
                    className="input bg-white text-slate-900 placeholder-slate-400 pr-12 text-xs sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                {newPassword && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Strength</span>
                      <span className="font-bold" style={{ color: strength.color }}>{strength.label}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: strength.width, backgroundColor: strength.color }} />
                    </div>
                    <div className="grid grid-cols-2 gap-1 pt-1">
                      {[
                        ['8+ characters', strength.checks.length],
                        ['Uppercase (A-Z)', strength.checks.upper],
                        ['Lowercase (a-z)', strength.checks.lower],
                        ['Number (0-9)', strength.checks.number],
                        ['Special char (!@#…)', strength.checks.special],
                      ].map(([label, ok]) => (
                        <div key={label} className="flex items-center gap-1.5 text-[11px]" style={{ color: ok ? '#22c55e' : '#94a3b8' }}>
                          <span>{ok ? '✓' : '○'}</span><span>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1" htmlFor="confirm-password">
                  Confirm New Password *
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input bg-white text-slate-900 placeholder-slate-400 text-xs sm:text-sm"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full btn-lg font-bold shadow-md mt-2 text-xs sm:text-sm py-2.5"
              >
                {loading ? 'Updating...' : 'Update Password →'}
              </button>

              <Link to="/login" className="block text-center text-xs sm:text-sm text-slate-400 hover:text-slate-600 mt-3 font-medium">
                ← Back to Sign In
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
