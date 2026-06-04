import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import api from '../services/api';
import { useNotification } from './NotificationContext'; // Подключаем всплывающие тосты

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
  const [notifications, setNotifications] = useState([]);

  // Получаем триггер для отображения всплывающих тостов на экране
  const { addNotification: triggerToast } = useNotification();

  // Рефы для предотвращения спама уведомлениями при первом входе
  const isFirstAdminFetch = useRef(true);
  const isFirstClientFetch = useRef(true);
  const seenAppsRef = useRef(new Set());
  const prevLoansRef = useRef({});

  useEffect(() => {
    api.get('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data.user);
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    setUser(res.data.user);
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
    setNotifications([]);
    localStorage.removeItem('purchaseReceipts');
    localStorage.removeItem('loanStatuses');
    localStorage.removeItem('tdStatuses');
    localStorage.removeItem('favorites');
    localStorage.removeItem('compareList');
  };

  // Локальные уведомления для колокольчика в шапке
  const addNotification = (msg) => {
    setNotifications(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), message: msg }]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Фоновый цикл проверки заявок и статусов кредитов
  useEffect(() => {
    if (!user) {
      isFirstAdminFetch.current = true;
      isFirstClientFetch.current = true;
      seenAppsRef.current.clear();
      prevLoansRef.current = {};
      return;
    }

    // 1. Для Админов и Менеджеров: проверка новых заявок
    const fetchNewApplications = async () => {
      if (user.role !== 'admin' && user.role !== 'manager') return;
      try {
        const res = await api.get('/admin/applications/new').catch(() => api.get('/applications'));
        const apps = res.data || [];
        
        apps.forEach(app => {
          if (!isFirstAdminFetch.current && !seenAppsRef.current.has(app.id)) {
            const appName = String(app.type).toLowerCase() === 'loan' ? 'кредит' : 'тест-драйв';
            const msg = `Новая заявка №${app.id}! Получен запрос на ${appName}.`;
            addNotification(msg);
            if (triggerToast) triggerToast(msg, 'warning');
          }
          seenAppsRef.current.add(app.id);
        });
        
        isFirstAdminFetch.current = false;
      } catch (err) {
        console.log('Служба менеджмента ожидает новые заявки...');
      }
    };

    // 2. Для Клиентов: проверка изменения статуса кредита
    const checkClientLoanStatuses = async () => {
      if (user.role === 'admin' || user.role === 'manager') return;
      try {
        let data = [];
        try {
          const res = await api.get('/applications');
          data = res.data || [];
        } catch {
          try {
            const res = await api.get('/loans/my');
            data = res.data || [];
          } catch {
            const res = await api.get('/loans');
            data = res.data || [];
          }
        }

        const items = Array.isArray(data) ? data : [];

        items.forEach(item => {
          if (item.type && String(item.type).toLowerCase() !== 'loan') return;

          const itemId = item.id;
          const currentStatus = item.status ? String(item.status).toLowerCase() : '';
          const prevStatus = prevLoansRef.current[itemId];

          if (!isFirstClientFetch.current && prevStatus !== currentStatus) {
            const carInfo = item.car ? `${item.car.brand} ${item.car.model}` : (item.car_name || '');
            const carText = carInfo ? ` на автомобиль ${carInfo}` : '';

            if (currentStatus === 'approved' || currentStatus === 'одобрено') {
              const msg = `🎉 Ваш кредит${carText} успешно ОДОБРЕН!`;
              addNotification(msg);
              if (triggerToast) triggerToast(msg, 'success');
            } else if (currentStatus === 'rejected' || currentStatus === 'отклонено' || currentStatus === 'failed') {
              const msg = `❌ К сожалению, заявка на кредит${carText} была отклонена.`;
              addNotification(msg);
              if (triggerToast) triggerToast(msg, 'error');
            }
          }

          prevLoansRef.current[itemId] = currentStatus;
        });
        
        isFirstClientFetch.current = false;
      } catch (err) {
        console.error('Ошибка проверки статуса кредитов:', err);
      }
    };

    // Межвкладочный обмен через Storage
    const handleStorageNotification = (e) => {
      if (e.key === 'luxury_dealer_new_app' && (user.role === 'admin' || user.role === 'manager')) {
        try {
          const appData = JSON.parse(e.newValue);
          if (appData) {
            const appName = String(appData.type).toLowerCase() === 'loan' ? 'кредит' : 'тест-драйв';
            const msg = `🔥 Мгновенно: Получена заявка на ${appName}!`;
            addNotification(msg);
            if (triggerToast) triggerToast(msg, 'warning');
          }
        } catch (err) {
          console.error(err);
        }
      }
    };

    const interval = setInterval(() => {
      fetchNewApplications();
      checkClientLoanStatuses();
    }, 5000);

    fetchNewApplications();
    checkClientLoanStatuses();

    window.addEventListener('storage', handleStorageNotification);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageNotification);
    };
  }, [user, triggerToast]);

  return (
    <AuthContext.Provider value={{
      user, setUser, loading, login, register, logout, theme, toggleTheme,
      notifications, addNotification, clearNotifications
    }}>
      {children}
    </AuthContext.Provider>
  );
};