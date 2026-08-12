import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    axiosClient
      .get('/profile')
      .then((res) => {
        if (isMounted) setUser(res.data.data);
      })
      .catch((err) => {
        console.error('Profile fetch error:', err);
        localStorage.removeItem('accessToken');
        if (isMounted) setUser(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (accessToken, userData) => {
    localStorage.setItem('accessToken', accessToken);
    if (userData) {
      setUser(userData);
    }
    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    setUser(null);
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
