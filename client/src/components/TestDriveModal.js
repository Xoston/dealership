import React from 'react';
import { motion } from 'framer-motion';
import TestDriveForm from './TestDriveForm';
import styles from '../pages/CarDetailPage.module.css';

const TestDriveModal = ({ carId, onClose }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <motion.div
        className={styles.modal}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Запись на тест-драйв</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>
        <TestDriveForm carId={carId} />
      </motion.div>
    </div>
  );
};

export default TestDriveModal;