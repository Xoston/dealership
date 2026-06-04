import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const WebSocketListener = () => {
  // Вытаскиваем функцию для добавления в КОЛОКОЛЬЧИК
  const { user, addNotification: addBellNotification } = useAuth();
  
  // Вытаскиваем функцию для боковых ТОСТОВ
  const { addNotification: triggerToast } = useNotification();

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const wsUrl = `ws://localhost:8000/ws/notifications?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.message) {
          // 1. Сохраняем уведомление в выпадающий список шапки
          if (addBellNotification) addBellNotification(data.message);
          
          // 2. Показываем красивое всплывающее окно
          if (triggerToast) triggerToast(data.message, data.type || 'info');
        }
      } catch (error) {
        console.error('Ошибка при обработке сообщения WebSocket:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Ошибка соединения WebSocket:', error);
    };

    return () => {
      ws.close();
    };
  }, [user, addBellNotification, triggerToast]);

  return null;
};

export default WebSocketListener;