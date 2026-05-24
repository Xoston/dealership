import React from 'react';
import { getImageUrl } from '../services/api';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import styles from './QuickView.module.css';

const QuickViewModel = ({ car, onClose }) => {
  if (!car) return null;

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={styles.modal}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        <img
          src={getImageUrl(car.image_url || '/images/default-car.jpg')}
          alt={car.model}
          className={styles.image}
        />
        <div className={styles.info}>
          <h3 className={styles.title}>{car.brand} {car.model}</h3>
          <p className={styles.year}>{car.year} год</p>
          <p className={styles.price}>{car.price.toLocaleString()} ₽</p>
          {car.description && (
            <p className={styles.description}>
              {car.description.substring(0, 150)}
              {car.description.length > 150 ? '...' : ''}
            </p>
          )}
          <Link to={`/cars/${car.id}`} className={styles.detailBtn}>
            Подробнее
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuickViewModel;