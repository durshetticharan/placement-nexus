import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
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
  // Student fields
  fullName?: string;
  rollNumber?: string;
  // Recruiter fields
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
  login: (email: string, password: string) => Promise<{ role: string }>;
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

let refreshPromise: Promise<any> | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Silent refresh on app load — browser sends httpOnly cookie automatically
  useEffect(() => {
    const silentRefresh = async () => {
      try {
        if (!refreshPromise) {
          refreshPromise = api.post('/auth/refresh-token');
        }
        const res = await refreshPromise;
        const newToken: string = res.data.data.accessToken;

        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        setAccessToken(newToken);

        const payload = JSON.parse(atob(newToken.split('.')[1]));
        setUser({ id: payload.userId, email: '', role: payload.role as UserRole });
      } catch (err) {
        setUser(null);
        setAccessToken(null);
        delete api.defaults.headers.common['Authorization'];
      } finally {
        refreshPromise = null;
        setLoading(false);
      }
    };
    silentRefresh();

    const handleUnauthorized = () => {
      setUser(null);
      setAccessToken(null);
      delete api.defaults.headers.common['Authorization'];
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const register = async (payload: RegisterPayload) => {
    await api.post('/auth/register', payload);
  };

  const login = async (email: string, password: string): Promise<{ role: string }> => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken: token, user: userData } = res.data.data;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setAccessToken(token);
    setUser(userData);
    return { role: userData.role };
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
      setAccessToken(null);
      delete api.defaults.headers.common['Authorization'];
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
