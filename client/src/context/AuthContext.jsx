import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('piip_token');
    const savedUser = localStorage.getItem('piip_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      API.get('/auth/me')
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('piip_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          localStorage.removeItem('piip_token');
          localStorage.removeItem('piip_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    localStorage.setItem('piip_token', res.data.token);
    localStorage.setItem('piip_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await API.post('/auth/register', { name, email, password });
    localStorage.setItem('piip_token', res.data.token);
    localStorage.setItem('piip_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('piip_token');
    localStorage.removeItem('piip_user');
    setUser(null);
  }, []);

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('piip_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
