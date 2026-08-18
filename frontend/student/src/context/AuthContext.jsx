import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUser(null);
      return;
    }

    // Silently revalidate profile in background without blocking initial UI render
    axiosClient
      .get('/profile')
      .then((res) => {
        if (isMounted && res.data?.data) {
          setUser(res.data.data);
          localStorage.setItem('user', JSON.stringify(res.data.data));
        }
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          if (isMounted) setUser(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (accessToken, userData) => {
    localStorage.setItem('accessToken', accessToken);
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await axiosClient.post('/auth/logout');
    } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
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
