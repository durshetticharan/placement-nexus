import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export type UserRole = 'STUDENT' | 'RECRUITER' | 'PLACEMENT_OFFICER' | 'ALUMNI';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface RegisterPayload {
  email: string;
  password: string;
  role: string;
  // Recruiter fields
  fullName?: string;
  designation?: string;
  companyName?: string;
  // Alumni fields
  degree?: string;
  branch?: string;
  graduationYear?: number;
  collegeName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  register: (payload: RegisterPayload) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Returns the role-specific dashboard path after login. */
export function getDashboardPath(role: string): string {
  switch (role) {
    case 'STUDENT':           return '/dashboard/student';
    case 'RECRUITER':         return '/dashboard/recruiter';
    case 'PLACEMENT_OFFICER': return '/dashboard/officer';
    case 'ALUMNI':            return '/dashboard/alumni';
    default:                  return '/dashboard/student';
  }
}

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
        const payload = JSON.parse(atob(newToken.split('.')[1]));
        setUser({ id: payload.userId, email: '', role: payload.role as UserRole });
      } catch {
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

  const register = async (payload: RegisterPayload) => {
    await api.post('/auth/register', payload);
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
