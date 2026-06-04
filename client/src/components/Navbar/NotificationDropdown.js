import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext'; // <-- Правильный контекст
import styles from './NotificationDropdown.module.css';

const NotificationDropdown = ({ onClose }) => {
  const { notifications = [], removeNotification, clearNotifications } = useNotification();

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
              <div 
                key={n.id} 
                className={styles.item} 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}
              >
                <span style={{ flex: 1, fontSize: '13px', lineHeight: '1.4' }}>{n.message}</span>
                <button 
                  onClick={() => removeNotification(n.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.4)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: '4px 6px',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#fff'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.4)'}
                  title="Удалить"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationDropdown;