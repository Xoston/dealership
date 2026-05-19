import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import styles from './NotificationDropdown.module.css';

const NotificationDropdown = ({ onClose }) => {
  const { notifications, clearNotifications } = useAuth();

  return (
    <AnimatePresence>
      <motion.div
        className={styles.dropdown}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <span>Уведомления</span>
          {notifications.length > 0 && (
            <button onClick={clearNotifications} className={styles.clearAll}>
              Очистить все
            </button>
          )}
        </div>
        <div className={styles.body}>
          {notifications.length === 0 ? (
            <p className={styles.empty}>Нет новых уведомлений</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={styles.item}>
                {n.message}
              </div>
            ))
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationDropdown;