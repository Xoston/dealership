import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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
            <button onClick={handleLogout} className={styles.logoutBtn}>Выйти</button>
          </>
        ) : (
          <>
            <Link to="/login">Войти</Link>
            <Link to="/register">Регистрация</Link>
          </>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;