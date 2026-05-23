import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './Auth.module.css';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Фронтовая валидация (дублирует серверную для быстрой обратной связи)
  const validateForm = () => {
    const { password } = form;
    if (password.length < 8) {
      setError('Пароль должен содержать не менее 8 символов');
      return false;
    }
    if (!/[A-Za-z]/.test(password)) {
      setError('Пароль должен содержать хотя бы одну букву');
      return false;
    }
    if (!/\d/.test(password)) {
      setError('Пароль должен содержать хотя бы одну цифру');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        // Ошибки валидации Pydantic
        setError(detail.map(e => e.msg).join('. '));
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError('Ошибка регистрации. Возможно, email уже занят.');
      }
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
        <h2 className={styles.title}>Создать аккаунт</h2>
        <p className={styles.subtitle}>Присоединяйтесь к миру люксовых авто</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
            />
          </div>
          <div className={styles.field}>
            <label>Пароль (мин. 8 символов, буква + цифра)</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>
          <div className={styles.field}>
            <label>Полное имя</label>
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Иван Иванов"
              required
            />
          </div>
          <div className={styles.field}>
            <label>Телефон</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+79991234567"
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.btn}>Зарегистрироваться</button>
        </form>
        <p className={styles.footerText}>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterPage;