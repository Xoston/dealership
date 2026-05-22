import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import styles from './Navbar.module.css';
import NotificationDropdown from './NotificationDropdown';

const BellIcon = ({ hasNotifications }) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={styles.bellIcon}
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    {hasNotifications && <circle cx="18" cy="5" r="3" fill="#D32F2F" stroke="none" />}
  </svg>
);

const Navbar = () => {
  const { user, logout, theme, toggleTheme, notifications } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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
        {user ? (
          <>
            <Link to="/dashboard">Личный кабинет</Link>
            {user.role === 'admin' && <Link to="/admin">Админ-панель</Link>}
            <div className={styles.notificationWrapper} ref={notifRef}>
              <button
                className={`${styles.navBtn} ${styles.notificationBtn}`}
                title="Уведомления"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <BellIcon hasNotifications={notifications.length > 0} />
                {notifications.length > 0 && (
                  <span className={styles.badge}>{notifications.length}</span>
                )}
              </button>
              {showNotifications && <NotificationDropdown onClose={() => setShowNotifications(false)} />}
            </div>
            <button onClick={handleLogout} className={styles.navBtn}>Выйти</button>
          </>
        ) : (
          <>
            <Link to="/login">Войти</Link>
            <Link to="/register">Регистрация</Link>
          </>
        )}
        <button onClick={toggleTheme} className={styles.navBtn} title="Сменить тему">
          {theme === 'light' ? '☾' : '☼'}
        </button>
      </div>
    </motion.nav>
  );
};

export default Navbar;