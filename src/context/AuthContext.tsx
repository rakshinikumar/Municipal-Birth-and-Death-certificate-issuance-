import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client.js';
import { User, UserRole, Notification } from '../types/index.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  notifications: Notification[];
  unreadNotifsCount: number;
  login: (email: string, password: string, role?: UserRole) => Promise<{ success: boolean; message?: string }>;
  register: (data: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  quickDemoLogin: (role: UserRole) => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('municipal_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('municipal_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('municipal_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('municipal_user', JSON.stringify(res.data.user));
          }
        } catch {
          setUser(null);
          setToken(null);
          localStorage.removeItem('municipal_token');
          localStorage.removeItem('municipal_user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await api.get('/citizen/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch {
      // quiet catch
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 20000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markNotificationAsRead = async (id: string) => {
    try {
      await api.patch(`/citizen/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const login = async (email: string, password: string, role?: UserRole) => {
    try {
      const res = await api.post('/auth/login', { email, password, role });
      if (res.data.success) {
        const { token, user } = res.data;
        setToken(token);
        setUser(user);
        localStorage.setItem('municipal_token', token);
        localStorage.setItem('municipal_user', JSON.stringify(user));
        return { success: true };
      }
      return { success: false, message: res.data.message || 'Login failed' };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || 'Authentication failed. Please verify credentials.',
      };
    }
  };

  const register = async (data: any) => {
    try {
      const res = await api.post('/auth/register', data);
      if (res.data.success) {
        const { token, user } = res.data;
        setToken(token);
        setUser(user);
        localStorage.setItem('municipal_token', token);
        localStorage.setItem('municipal_user', JSON.stringify(user));
        return { success: true };
      }
      return { success: false, message: res.data.message || 'Registration failed' };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed.',
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setNotifications([]);
    localStorage.removeItem('municipal_token');
    localStorage.removeItem('municipal_user');
  };

  const quickDemoLogin = async (role: UserRole) => {
    const creds: Record<UserRole, { email: string; pass: string }> = {
      CITIZEN: { email: 'citizen@elmwood.gov', pass: 'Citizen123!' },
      HOSPITAL: { email: 'hospital@general.gov', pass: 'Hospital123!' },
      OFFICER: { email: 'officer@elmwood.gov', pass: 'Officer123!' },
      ADMIN: { email: 'admin@elmwood.gov', pass: 'Admin123!' },
    };

    const target = creds[role];
    await login(target.email, target.pass, role);
  };

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        notifications,
        unreadNotifsCount,
        login,
        register,
        logout,
        quickDemoLogin,
        fetchNotifications,
        markNotificationAsRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
