import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,  // браузер сам отправит куку
});

// Больше не нужен интерсептор, достававший токен из localStorage – кука уходит автоматически

// Базовый URL для статических файлов (изображений)
export const IMAGE_BASE = 'http://localhost:8000';

// Помощник: если URL относительный, делает его абсолютным
export const getImageUrl = (url) => {
  if (!url) return '/images/default-car.jpg';
  if (url.startsWith('http')) return url;
  return IMAGE_BASE + url;
};

export default api;