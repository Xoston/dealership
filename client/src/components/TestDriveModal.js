import React from 'react';
import { motion } from 'framer-motion';
import TestDriveForm from './TestDriveForm';
import styles from './TestDrive.module.css';
import pageStyles from '../pages/CarDetailPage.module.css';

const TestDriveModal = ({ carId, onClose }) => {
  return (
    <div className={pageStyles.modalOverlay} onClick={onClose}>
      <motion.div
        className={styles.modal}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            Запись на тест-драйв
          </h3>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>
        <TestDriveForm carId={carId} />
      </motion.div>
    </div>
  );
};

export default TestDriveModal;