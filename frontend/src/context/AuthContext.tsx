import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface AuthUser {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  register: (email: string, password: string, role: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Silent refresh on app load — browser sends httpOnly cookie automatically
  useEffect(() => {
    const silentRefresh = async () => {
      try {
        const res = await api.post('/auth/refresh-token');
        const newToken: string = res.data.data.accessToken;
        setAccessToken(newToken);
        // Decode user info from the token (payload is base64)
        const payload = JSON.parse(atob(newToken.split('.')[1]));
        setUser({ id: payload.userId, email: '', role: payload.role });
      } catch {
        // No valid session — user is logged out
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    };
    silentRefresh();
  }, []);

  // Inject access token into every request
  useEffect(() => {
    const interceptor = api.interceptors.request.use((config) => {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    });
    return () => api.interceptors.request.eject(interceptor);
  }, [accessToken]);

  const register = async (email: string, password: string, role: string) => {
    await api.post('/auth/register', { email, password, role });
  };

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken: token, user: userData } = res.data.data;
    setAccessToken(token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
