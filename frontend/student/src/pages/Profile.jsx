import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/client';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [hostels, setHostels] = useState([]);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  const [hostelForm, setHostelForm] = useState({
    hostelId: user?.studentProfile?.hostelId?._id || user?.studentProfile?.hostelId || '',
    roomNumber: user?.studentProfile?.roomNumber || '',
    rollNumber: user?.studentProfile?.rollNumber || '',
    year: user?.studentProfile?.year || 3,
  });

  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingHostel, setLoadingHostel] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    const fetchHostels = async () => {
      try {
        const { data } = await axiosClient.get('/hostels');
        setHostels(data.data || []);
      } catch (err) {
        console.error('Fetch hostels error:', err);
      }
    };
    fetchHostels();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      await axiosClient.patch('/profile', profileForm);
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdateHostel = async (e) => {
    e.preventDefault();
    setLoadingHostel(true);
    try {
      await axiosClient.patch('/profile/hostel', hostelForm);
      toast.success('Hostel details updated successfully');
    } catch {
      toast.error('Failed to update hostel details');
    } finally {
      setLoadingHostel(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoadingPass(true);
    try {
      await axiosClient.patch('/profile/password', passForm);
      toast.success('Password changed successfully');
      setPassForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to change password');
    } finally {
      setLoadingPass(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '⚠️ CRITICAL WARNING: Are you sure you want to permanently delete your account?\n\nThis will completely erase your profile, email, password, and order data from CampusBite database. This action cannot be undone.'
    );
    if (!confirmed) return;

    setDeletingAccount(true);
    try {
      await axiosClient.delete('/profile');
      toast.success('Account & profile data permanently removed from database');
      await logout();
      navigate('/register', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to delete account');
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="page-container max-w-3xl py-4 sm:py-8 space-y-6 sm:space-y-8 animate-fade-in px-3 sm:px-6 lg:px-8">
      <div className="border-b border-slate-200 pb-3 sm:pb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900">My Student Profile</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Manage personal account details, WhatsApp mobile number & security settings</p>
      </div>

      {/* Account Info */}
      <div className="card p-4 sm:p-6 space-y-3 sm:space-y-4 rounded-2xl sm:rounded-3xl">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 font-display">Personal Information</h2>
        <form onSubmit={handleUpdateProfile} className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="input text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">College Email</label>
              <input type="email" value={user?.email || ''} disabled className="input bg-slate-100 cursor-not-allowed text-slate-500 font-mono text-xs" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp Mobile Number (Used for Auto Bills)</label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="10-digit mobile number..."
                className="input text-xs sm:text-sm"
              />
            </div>
          </div>
          <button type="submit" disabled={loadingProfile} className="btn btn-primary font-bold shadow-sm text-xs sm:text-sm py-2 px-4">
            {loadingProfile ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* Hostel & Room Details */}
      <div className="card p-4 sm:p-6 space-y-3 sm:space-y-4 rounded-2xl sm:rounded-3xl">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 font-display">Default Hostel & Room</h2>
        <form onSubmit={handleUpdateHostel} className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Hostel</label>
              <select
                value={hostelForm.hostelId}
                onChange={(e) => setHostelForm({ ...hostelForm, hostelId: e.target.value })}
                className="input text-xs sm:text-sm"
              >
                <option value="">Select Hostel</option>
                {hostels.map((h) => (
                  <option key={h._id} value={h._id}>{h.name} ({h.shortCode})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Room Number</label>
              <input
                type="text"
                value={hostelForm.roomNumber}
                onChange={(e) => setHostelForm({ ...hostelForm, roomNumber: e.target.value })}
                placeholder="e.g. A-214"
                className="input text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Roll Number</label>
              <input
                type="text"
                value={hostelForm.rollNumber}
                onChange={(e) => setHostelForm({ ...hostelForm, rollNumber: e.target.value })}
                className="input text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Year</label>
              <select
                value={hostelForm.year}
                onChange={(e) => setHostelForm({ ...hostelForm, year: e.target.value })}
                className="input text-xs sm:text-sm"
              >
                {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={loadingHostel} className="btn btn-primary font-bold shadow-sm text-xs sm:text-sm py-2 px-4">
            {loadingHostel ? 'Saving...' : 'Update Hostel Details'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card p-4 sm:p-6 space-y-3 sm:space-y-4 rounded-2xl sm:rounded-3xl">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 font-display">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-3 sm:space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current Password</label>
            <input
              type="password"
              value={passForm.currentPassword}
              onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
              className="input text-xs sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">New Password</label>
            <input
              type="password"
              value={passForm.newPassword}
              onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
              placeholder="At least 8 characters"
              className="input text-xs sm:text-sm"
            />
          </div>
          <button type="submit" disabled={loadingPass} className="btn btn-secondary font-bold text-xs sm:text-sm py-2 px-4">
            {loadingPass ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Danger Zone: Delete Account & Remove Data */}
      <div className="card p-4 sm:p-6 space-y-3 sm:space-y-4 border-2 border-rose-200 bg-rose-50/50 rounded-2xl sm:rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center text-lg sm:text-xl font-bold shadow-sm flex-shrink-0">
            🗑️
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-rose-950 font-display">Delete Account & Permanent Data Removal</h2>
            <p className="text-[11px] sm:text-xs text-rose-700">Permanently erase your email, password, profile details, and account from database</p>
          </div>
        </div>

        <p className="text-[11px] sm:text-xs text-rose-800 leading-relaxed">
          Clicking this button will immediately wipe your account record from the database. All stored credentials (email, hashed password, mobile number) will be permanently deleted.
        </p>

        <button
          onClick={handleDeleteAccount}
          disabled={deletingAccount}
          className="btn bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl shadow-sm"
        >
          {deletingAccount ? 'Deleting Account...' : '🗑️ Delete My Account & Remove All Data'}
        </button>
      </div>
    </div>
  );
}
