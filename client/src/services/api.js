import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Интерсептор запроса: добавляем токен из localStorage (дублирующая мера)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Базовый URL для статических файлов (изображений)
export const IMAGE_BASE = 'http://localhost:8000';

// Помощник: если URL относительный, делает его абсолютным
export const getImageUrl = (url) => {
  if (!url) return '/images/default-car.jpg';
  if (url.startsWith('http')) return url;
  return IMAGE_BASE + url;
};

export default api;