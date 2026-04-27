import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Загрузка...</div>;

  if (!user) {
    // Не авторизован — отправляем на страницу входа
    return <Navigate to="/login" />;
  }

  // Если указана требуемая роль, проверяем:
  // - admin может всё
  // - user должен совпадать с requiredRole
  if (requiredRole && user.role !== 'admin' && user.role !== requiredRole) {
    // Нет прав — на главную или можно на страницу с сообщением, здесь отправим на /
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;