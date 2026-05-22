import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import styles from './ChatWidget.module.css';

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'manager', text: 'Здравствуйте! Чем могу помочь?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const newUserMsg = { from: 'user', text };
    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chat/', { message: text });
      const reply = res.data.reply;
      setMessages(prev => [...prev, { from: 'manager', text: reply }]);
    } catch {
      setMessages(prev => [...prev, { from: 'manager', text: 'Ошибка связи. Попробуйте позже.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.widget}>
      <button className={styles.toggle} onClick={() => setOpen(!open)}>
        {open ? '✕' : '💬'}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.window}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            <div className={styles.header}>
              <div className={styles.avatar}>К</div>
              <div>
                <div className={styles.name}>Консультант</div>
                <div className={styles.status}>Онлайн</div>
              </div>
            </div>

            <div className={styles.body}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`${styles.msg} ${msg.from === 'user' ? styles.userMsg : styles.managerMsg}`}
                >
                  <div className={styles.bubble}>{msg.text}</div>
                </div>
              ))}
              {loading && <div className={`${styles.msg} ${styles.managerMsg}`}><div className={styles.bubble}>Печатает...</div></div>}
              <div ref={messagesEndRef} />
            </div>

            <div className={styles.footer}>
              <input
                type="text"
                placeholder="Напишите сообщение..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                disabled={loading}
              />
              <button onClick={sendMessage} disabled={loading}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatWidget;