import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole, requiredRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem' }}>Загрузка...</div>;

  if (!user) {
    return <Navigate to="/login" />;
  }

  // если передан массив ролей — проверяем, есть ли роль пользователя в этом массиве
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  // если передана одиночная роль (строка) — старая логика
  if (requiredRole && user.role !== 'admin' && user.role !== requiredRole) {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;