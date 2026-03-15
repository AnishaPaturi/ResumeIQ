import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('resumeai_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('resumeai_user');
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('resumeai_user');
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    const { token: jwt, user: userData } = data;
    localStorage.setItem('resumeai_token', jwt);
    localStorage.setItem('resumeai_user', JSON.stringify(userData));
    setToken(jwt);
    setUser(userData);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authAPI.register(name, email, password);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('resumeai_token');
    localStorage.removeItem('resumeai_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
