import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/client';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hostels, setHostels] = useState([]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    rollNumber: '',
    hostelId: '',
    roomNumber: '',
    year: '1',
  });

  useEffect(() => {
    const fetchHostels = async () => {
      try {
        const { data } = await axiosClient.get('/hostels');
        const hList = data.data || [];
        setHostels(hList);
        if (hList.length > 0) {
          setForm((f) => ({ ...f, hostelId: hList[0]._id }));
        }
      } catch (err) {
        console.error('Fetch hostels error:', err);
      }
    };
    fetchHostels();
  }, []);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleNextStep = () => {
    setError('');
    if (!form.name.trim()) {
      setError('Full Name is required');
      return;
    }
    if (!form.email.trim()) {
      setError('College Email is required');
      return;
    }
    if (!form.password || form.password.length < 8) {
      setError('Password is required (minimum 8 characters)');
      return;
    }
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) {
      setError('Valid 10-digit WhatsApp Mobile Number is required for automatic bill receipts');
      return;
    }

    setStep(2);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.rollNumber.trim()) {
      setError('Roll Number is required');
      return;
    }
    if (!form.hostelId) {
      setError('Hostel selection is required');
      return;
    }
    if (!form.roomNumber.trim()) {
      setError('Room Number is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim(),
        studentProfile: {
          rollNumber: form.rollNumber.trim(),
          hostelId: form.hostelId,
          roomNumber: form.roomNumber.trim(),
          year: parseInt(form.year, 10),
        },
      };

      const { data } = await axiosClient.post('/auth/register', payload);

      if (data.data && data.data.accessToken) {
        await login(data.data.accessToken, data.data.user);
        toast.success('Account created successfully! Welcome to CampusBite 🎉');
        navigate('/home', { replace: true });
      } else {
        toast.success('Account created! Please sign in.');
        navigate('/login', { replace: true });
      }
    } catch (err) {
      console.error('Registration error:', err);
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Registration failed. Please check your details.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-slide-up px-3 sm:px-0">
      <div className="text-center mb-6 sm:mb-8">
        <img
          src="/images/campusbite_logo.png"
          alt="CampusBite"
          className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 object-contain rounded-2xl shadow-md"
        />
        <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900">Create your account</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">Join CampusBite • NIT Jamshedpur</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-xl">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-5 sm:mb-6">
          <div className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              step >= 1 ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-400'
            }`}>1</div>
            <div className={`h-0.5 flex-1 rounded transition-colors ${
              step > 1 ? 'bg-orange-600' : 'bg-slate-200'
            }`} />
          </div>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
            step === 2 ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-400'
          }`}>2</div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-xl p-3 mb-5 font-medium">
            ⚠️ {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
              <input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Rahul Kumar"
                className="input text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">College Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="rahul@nitjsr.ac.in"
                className="input text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password * (min 8 chars)</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="••••••••"
                className="input text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp Mobile Number * (For Auto Bills)</label>
              <input
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="9876543210"
                className="input text-xs sm:text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleNextStep}
              className="btn btn-primary w-full btn-lg mt-2 font-bold shadow-md text-xs sm:text-sm py-2.5"
            >
              Continue to Step 2 →
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Roll Number *</label>
              <input
                value={form.rollNumber}
                onChange={(e) => update('rollNumber', e.target.value)}
                placeholder="e.g. 2021ME001"
                className="input text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Hostel *</label>
              <select
                value={form.hostelId}
                onChange={(e) => update('hostelId', e.target.value)}
                className="input bg-white text-xs sm:text-sm"
              >
                {hostels.map((h) => (
                  <option key={h._id} value={h._id}>{h.name} ({h.shortCode})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Room Number *</label>
              <input
                value={form.roomNumber}
                onChange={(e) => update('roomNumber', e.target.value)}
                placeholder="e.g. A-214"
                className="input text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Year *</label>
              <select
                value={form.year}
                onChange={(e) => update('year', e.target.value)}
                className="input bg-white text-xs sm:text-sm"
              >
                {[1, 2, 3, 4, 5].map((y) => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 sm:gap-3 mt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-secondary flex-1 font-bold text-xs sm:text-sm py-2"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex-1 btn-lg font-bold shadow-md text-xs sm:text-sm py-2"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-xs sm:text-sm text-slate-500 mt-5 sm:mt-6 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-orange-600 hover:text-orange-700 font-bold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
