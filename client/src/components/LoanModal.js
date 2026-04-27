import React from 'react';
import { motion } from 'framer-motion';
import LoanCalculator from './LoanCalculator';
import styles from '../pages/CarDetailPage.module.css';

const LoanModal = ({ car, onClose }) => {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <motion.div
        className={styles.modal}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Кредитный калькулятор</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>
        <LoanCalculator carId={car.id} carPrice={car.price} />
      </motion.div>
    </div>
  );
};

export default LoanModal;