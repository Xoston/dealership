import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Navbar.module.css';
import NotificationDropdown from './NotificationDropdown';

const Navbar = () => {
  const { user, logout, theme, toggleTheme, notifications } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Закрытие дропдауна при клике вне
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  return (
    <motion.nav className={styles.navbar} initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: 'easeOut' }}>
      <div className={styles.logo}>
        <Link to="/">LUXURY DEALER</Link>
      </div>
      <div className={styles.links}>
        <Link to="/catalog">Каталог</Link>
        <Link to="/compare">Сравнение</Link>
        {user ? (
          <>
            <Link to="/dashboard">Личный кабинет</Link>
            {user.role === 'admin' && <Link to="/admin">Админ-панель</Link>}
            <div className={styles.notificationWrapper} ref={notifRef}>
              <button
                className={styles.notificationBtn}
                title="Уведомления"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                ⚲ {notifications.length > 0 && <span className={styles.badge}>{notifications.length}</span>}
              </button>
              {showNotifications && <NotificationDropdown onClose={() => setShowNotifications(false)} />}
            </div>
            <button onClick={handleLogout} className={styles.logoutBtn}>Выйти</button>
          </>
        ) : (
          <>
            <Link to="/login">Войти</Link>
            <Link to="/register">Регистрация</Link>
          </>
        )}
        <button onClick={toggleTheme} className={styles.themeBtn} title="Сменить тему">
          {theme === 'light' ? '☾' : '☼'}
        </button>
      </div>
    </motion.nav>
  );
};

export default Navbar;  