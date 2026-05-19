import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ChatWidget.module.css';

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'manager', text: 'Здравствуйте! Чем могу помочь?' }
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { from: 'user', text: input }];
    setMessages(newMessages);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { from: 'manager', text: 'Спасибо за обращение! Мы скоро ответим.' }]);
    }, 1000);
  };

  return (
    <div className={styles.widget}>
      <button className={styles.toggle} onClick={() => setOpen(!open)}>
        💬 Чат
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className={styles.window} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
            <div className={styles.header}>Менеджер</div>
            <div className={styles.body}>
              {messages.map((msg, idx) => (
                <div key={idx} className={msg.from === 'user' ? styles.userMsg : styles.managerMsg}>
                  {msg.text}
                </div>
              ))}
            </div>
            <div className={styles.footer}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
              <button onClick={sendMessage}>→</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatWidget;