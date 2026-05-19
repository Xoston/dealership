import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCar } from '../services/carService';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import api, { getImageUrl } from '../services/api';
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
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    getCar(id).then(res => {
      setCar(res.data);
      const imgs = res.data.images || [];
      if (imgs.length > 0) {
        setActiveImage(imgs[0].image_url);
      } else {
        setActiveImage(res.data.image_url || '/images/default-car.jpg');
      }
    }).catch(console.error);
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

  const allImages = car.images && car.images.length > 0
    ? car.images.map(img => img.image_url)
    : [car.image_url || '/images/default-car.jpg'];

  return (
    <motion.div className={styles.container} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className={styles.content}>
        <div className={styles.galleryWrapper}>
          <motion.div className={styles.mainImage} whileHover={{ scale: 1.02 }}>
            <img
              src={getImageUrl(activeImage || allImages[0])}
              alt={car.model}
              className={styles.image}
            />
          </motion.div>
          {allImages.length > 1 && (
            <div className={styles.thumbnails}>
              {allImages.map((url, idx) => (
                <img
                  key={idx}
                  src={getImageUrl(url)}
                  alt={`view ${idx + 1}`}
                  className={`${styles.thumb} ${url === activeImage ? styles.activeThumb : ''}`}
                  onClick={() => setActiveImage(url)}
                />
              ))}
            </div>
          )}
        </div>

        <div className={styles.info}>
          <h1 className={styles.title}>{car.brand} {car.model}</h1>
          <p className={styles.year}>{car.year} год</p>
          <p className={styles.price}>{car.price.toLocaleString('ru-RU')} ₽</p>
          {car.description && <p className={styles.description}>{car.description}</p>}

          <motion.button className={styles.buyButton} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowPurchaseConfirm(true)}>
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

          {/* Технические характеристики */}
          {(car.engine_volume || car.power || car.fuel_type || car.consumption || car.drive_type || car.transmission || car.acceleration || car.max_speed || car.clearance || car.seats) && (
            <div className={styles.specs}>
              <h3>Характеристики</h3>
              <div className={styles.specsGrid}>
                {car.engine_volume && <div className={styles.specItem}><span>Объём двигателя</span><strong>{car.engine_volume} л</strong></div>}
                {car.power && <div className={styles.specItem}><span>Мощность</span><strong>{car.power} л.с.</strong></div>}
                {car.fuel_type && <div className={styles.specItem}><span>Топливо</span><strong>{ {petrol:'Бензин', diesel:'Дизель', hybrid:'Гибрид', electric:'Электро'}[car.fuel_type] || car.fuel_type }</strong></div>}
                {car.consumption && <div className={styles.specItem}><span>Расход</span><strong>{car.consumption} л/100км</strong></div>}
                {car.drive_type && <div className={styles.specItem}><span>Привод</span><strong>{ {FWD:'Передний', RWD:'Задний', AWD:'Полный'}[car.drive_type] || car.drive_type }</strong></div>}
                {car.transmission && <div className={styles.specItem}><span>КПП</span><strong>{ {manual:'Механика', automatic:'Автомат', robot:'Робот', variator:'Вариатор'}[car.transmission] || car.transmission }</strong></div>}
                {car.acceleration && <div className={styles.specItem}><span>0-100 км/ч</span><strong>{car.acceleration} с</strong></div>}
                {car.max_speed && <div className={styles.specItem}><span>Макс. скорость</span><strong>{car.max_speed} км/ч</strong></div>}
                {car.clearance && <div className={styles.specItem}><span>Клиренс</span><strong>{car.clearance} мм</strong></div>}
                {car.seats && <div className={styles.specItem}><span>Мест</span><strong>{car.seats}</strong></div>}
              </div>
            </div>
          )}

          {purchaseSuccess && (
            <motion.div className={styles.successMessage} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              ✅ Покупка оформлена! Детали в личном кабинете.
            </motion.div>
          )}
        </div>
      </div>

      {showPurchaseConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowPurchaseConfirm(false)}>
          <motion.div className={styles.modal} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            onClick={e => e.stopPropagation()}>
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