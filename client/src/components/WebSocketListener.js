import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const WebSocketListener = () => {
  const { user } = useAuth();
  const { addNotification: triggerToast } = useNotification();

  useEffect(() => {
    // Если юзер не авторизован или нет токена — даже не пытаемся подключиться
    if (!user) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const wsUrl = `ws://localhost:8000/ws/notifications?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ WebSocket: Успешно подключено к серверу');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📩 WebSocket: Получено сообщение', data);
        if (data.message && triggerToast) {
          triggerToast(data.message, data.type || 'info');
        }
      } catch (error) {
        console.error('❌ WebSocket: Ошибка парсинга', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket: Ошибка соединения', error);
    };

    ws.onclose = (event) => {
      console.log(`⚠️ WebSocket: Соединение закрыто (Код: ${event.code})`);
    };

    // Функция очистки при размонтировании (защита от двойного рендера React 18)
    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [user, triggerToast]);

  return null;
};

export default WebSocketListener;