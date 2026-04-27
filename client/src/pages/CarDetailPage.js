import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCar } from '../services/carService';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import api from '../services/api';
import LoanModal from '../components/LoanModal';
import TestDriveModal from '../components/TestDriveModal';
import styles from './CarDetailPage.module.css';

const CarDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [car, setCar] = useState(null);
  const [showLoan, setShowLoan] = useState(false);
  const [showTestDrive, setShowTestDrive] = useState(false);
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  useEffect(() => {
    getCar(id).then(res => setCar(res.data)).catch(console.error);
  }, [id]);

  const handlePurchase = async () => {
    if (!user) {
      alert('Войдите, чтобы совершить покупку');
      return;
    }
    try {
      await api.post('/purchases/', { car_id: car.id });
      setPurchaseSuccess(true);
      setShowPurchaseConfirm(false);
    } catch (err) {
      alert('Ошибка оформления покупки');
    }
  };

  if (!car) return <div className={styles.loading}>Загрузка...</div>;

  return (
    <motion.div className={styles.container} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className={styles.content}>
        <motion.div className={styles.imageWrapper} whileHover={{ scale: 1.02 }}>
          <img src={car.image_url || '/images/default-car.jpg'} alt={car.model} className={styles.image} />
        </motion.div>

        <div className={styles.info}>
          <h1 className={styles.title}>{car.brand} {car.model}</h1>
          <p className={styles.year}>{car.year} год</p>
          <p className={styles.price}>{car.price.toLocaleString('ru-RU')} ₽</p>
          {car.description && <p className={styles.description}>{car.description}</p>}

          <motion.button
            className={styles.buyButton}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowPurchaseConfirm(true)}
          >
            Купить
          </motion.button>

          <div className={styles.actions}>
            <button className={styles.secondaryButton} onClick={() => setShowLoan(true)}>
              Рассчитать кредит
            </button>
            <button className={styles.secondaryButton} onClick={() => setShowTestDrive(true)}>
              Записаться на тест-драйв
            </button>
          </div>

          {purchaseSuccess && (
            <motion.div className={styles.successMessage} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              ✅ Покупка оформлена! Детали в личном кабинете.
            </motion.div>
          )}
        </div>
      </div>

      {showPurchaseConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowPurchaseConfirm(false)}>
          <motion.div className={styles.modal} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={e => e.stopPropagation()}>
            <h3>Подтверждение покупки</h3>
            <p>Вы собираетесь приобрести {car.brand} {car.model} за {car.price.toLocaleString('ru-RU')} ₽.</p>
            <div className={styles.modalButtons}>
              <button className={styles.confirmButton} onClick={handlePurchase}>Оплатить</button>
              <button className={styles.cancelButton} onClick={() => setShowPurchaseConfirm(false)}>Отмена</button>
            </div>
          </motion.div>
        </div>
      )}

      {showLoan && <LoanModal car={car} onClose={() => setShowLoan(false)} />}
      {showTestDrive && <TestDriveModal carId={car.id} onClose={() => setShowTestDrive(false)} />}
    </motion.div>
  );
};

export default CarDetailPage;