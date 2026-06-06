import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../../context/NotificationContext';
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
        style={{
          background: 'var(--bg, #ffffff)',
          color: 'var(--text, #000000)',
          border: '1px solid rgba(128, 128, 128, 0.2)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}
      >
        <div className={styles.header}>
          <span style={{ fontWeight: 600, color: 'var(--primary, #4a148c)' }}>Уведомления</span>
          {notifications.length > 0 && (
            <button onClick={clearNotifications} className={styles.clearAll}>
              Очистить все
            </button>
          )}
        </div>
        <div className={styles.body}>
          {notifications.length === 0 ? (
            <p className={styles.empty} style={{ color: 'var(--text-muted, gray)' }}>Нет новых уведомлений</p>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id} 
                className={styles.item} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  gap: '12px',
                  padding: '12px',
                  borderBottom: '1px solid rgba(128, 128, 128, 0.1)'
                }}
              >
                <span style={{ flex: 1, fontSize: '13px', lineHeight: '1.4', color: 'var(--text, #000000)' }}>
                  {n.message}
                </span>
                <button 
                  onClick={() => removeNotification(n.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted, rgba(128, 128, 128, 0.5))',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--primary, #8a2be2)';
                    e.currentTarget.style.background = 'rgba(138, 43, 226, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-muted, rgba(128, 128, 128, 0.5))';
                    e.currentTarget.style.background = 'none';
                  }}
                  title="Удалить"
                >
                  <svg 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M18 6L6 18" />
                    <path d="M6 6L18 18" />
                  </svg>
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