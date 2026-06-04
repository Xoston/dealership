import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification должен использоваться внутри NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Функция ручного удаления конкретного уведомления
  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  // Функция полной очистки
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Теперь уведомления просто записываются в массив и хранятся там без таймеров
  const addNotification = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { id, message, type }]);
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification, notifications, removeNotification, clearNotifications }}>
      {children}
      {/* Раньше здесь стоял контейнер с версткой плашек тоастов. Мы его полностью убрали */}
    </NotificationContext.Provider>
  );
};