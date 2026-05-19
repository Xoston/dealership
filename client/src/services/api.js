import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Базовый URL для статических файлов (изображений)
export const IMAGE_BASE = 'http://localhost:8000';

// Помощник: если URL относительный, делает его абсолютным
export const getImageUrl = (url) => {
  if (!url) return '/images/default-car.jpg';
  if (url.startsWith('http')) return url;
  return IMAGE_BASE + url;
};

export default api;