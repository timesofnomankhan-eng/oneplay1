import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';
import socket from '../socket';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('oneplay1_token') || null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const res = await api.get('/auth/me');
      setUser(res.data);
      if (socket) {
        socket.auth = { token };
        socket.emit('auth:authenticate', { token });
      }
    } catch (err) {
      console.error('Fetch me error:', err);
      if (err.response?.status === 403) {
        setUser(err.response?.data?.user || { isBanned: true, banMessage: err.response?.data?.message });
      } else {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, [token]);

  // Real-time Socket Event Listeners for Ban / Unban / Balance
  useEffect(() => {
    const handleUserBanned = (data) => {
      setUser((prev) => (prev ? { ...prev, isBanned: true, banUntil: data.banUntil, banMessage: data.banMessage } : null));
      toast.error('⚠️ Your account has been restricted by the administrator!', { duration: 6000 });
    };

    const handleUserUnbanned = () => {
      setUser((prev) => (prev ? { ...prev, isBanned: false, banUntil: null, banMessage: '' } : null));
      toast.success('🎉 Your account restriction has been lifted!', { duration: 5000 });
    };

    const handleBalanceUpdated = (data) => {
      if (data?.balance !== undefined) {
        setUser((prev) => (prev ? { ...prev, balance: data.balance } : null));
      }
    };

    const handleNewNotification = (data) => {
      setUser((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          notifications: [data, ...(prev.notifications || [])]
        };
      });
      toast((t) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔔</span>
          <span>{data.message}</span>
        </div>
      ), { duration: 5000 });
    };

    socket.on('user:banned', handleUserBanned);
    socket.on('user:unbanned', handleUserUnbanned);
    socket.on('balance:updated', handleBalanceUpdated);
    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('user:banned', handleUserBanned);
      socket.off('user:unbanned', handleUserUnbanned);
      socket.off('balance:updated', handleBalanceUpdated);
      socket.off('notification:new', handleNewNotification);
    };
  }, []);

  const login = async (username, password) => {
    try {
      const res = await api.post('/auth/login', { username, password });
      const { token: newToken, user: userData } = res.data;
      localStorage.setItem('oneplay1_token', newToken);
      setToken(newToken);
      setUser(userData);
      
      if (socket) {
        socket.auth = { token: newToken };
        socket.emit('auth:authenticate', { token: newToken });
      }
      
      toast.success(`Welcome back, ${userData.username}!`);
      return { success: true, user: userData };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      return { success: false, error: msg };
    }
  };

  const register = async (formData) => {
    try {
      const res = await api.post('/auth/register', formData);
      const { token: newToken, user: userData } = res.data;
      localStorage.setItem('oneplay1_token', newToken);
      setToken(newToken);
      setUser(userData);
      
      if (socket) {
        socket.auth = { token: newToken };
        socket.emit('auth:authenticate', { token: newToken });
      }
      
      toast.success('Registration successful! Welcome to OnePlay1!');
      return { success: true, user: userData };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('oneplay1_token');
    setToken(null);
    setUser(null);
    if (socket) {
      socket.auth = { token: null };
    }
    toast.success('Logged out successfully');
  };

  const updateBalance = (newBalance) => {
    setUser((prev) => (prev ? { ...prev, balance: newBalance } : null));
  };

  const updateUserProfile = (updatedData) => {
    setUser((prev) => (prev ? { ...prev, ...updatedData } : null));
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        fetchMe,
        updateBalance,
        updateUserProfile,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
