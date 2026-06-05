import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
// Исправлено: используем верное имя файла стилей
import styles from './Auth.module.css'; 

const LoginPage = () => {
  const { login } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Уведомление "Вы успешно вошли в систему" удалено
      navigate('/dashboard');
    } catch (err) {
      addNotification('Неверный Email или пароль. Попробуйте снова.', 'error');
    }
  };

  return (
    <div className={styles.wrapper}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className={styles.title}>Добро пожаловать</h2>
        <p className={styles.subtitle}>Войдите, чтобы продолжить</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>
          <div className={styles.field}>
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className={styles.btn}>Войти</button>
        </form>
        <p className={styles.footerText}>
          Ещё нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;