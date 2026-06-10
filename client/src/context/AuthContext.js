import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // При запуске проверяем токен и восстанавливаем сессию
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch((err) => {
          console.error('Ошибка при проверке сессии:', err.response || err);
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Переключение темы
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Вход в систему
  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const token = res.data.access_token;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const userRes = await api.get('/auth/me');
      setUser(userRes.data);
      return res.data;
    } catch (err) {
      console.error('Детальная ошибка логина (смотри статус ответа):', err.response || err);
      throw err;
    }
  };

  // Регистрация
  const register = async (formData) => {
    try {
      const res = await api.post('/auth/register', formData);
      const token = res.data.access_token;

      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const userRes = await api.get('/auth/me');
      setUser(userRes.data);
      return res.data;
    } catch (err) {
      console.error('Ошибка регистрации:', err.response || err);
      throw err;
    }
  };

  // Выход из системы
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Ошибка при деавторизации:', err.response || err);
    } finally {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, theme, toggleTheme }}>
      {children}
    </AuthContext.Provider>
  );
};