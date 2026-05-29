import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCar } from '../services/carService';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [activeImage, setActiveImage] = useState(null);

  // Состояния для кредита при покупке
  const [creditParams, setCreditParams] = useState({
    amount: '',
    term: 36,
    rate: 12,
    downPayment: '',
  });
  const [creditCalculated, setCreditCalculated] = useState(null);
  const [creditForm, setCreditForm] = useState({
    fullName: user?.full_name || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    getCar(id).then(res => {
      setCar(res.data);
      const imgs = res.data.images || [];
      if (imgs.length > 0) setActiveImage(imgs[0].image_url);
      else setActiveImage(res.data.image_url || '/images/default-car.jpg');
    }).catch(console.error);
  }, [id]);

  // Автоматический расчёт при изменении параметров кредита
  useEffect(() => {
    if (paymentMethod === 'credit') {
      calculateCredit();
    }
  }, [creditParams.amount, creditParams.term, creditParams.rate, creditParams.downPayment, paymentMethod]);

  const calculateCredit = () => {
    const price = car?.price || 0;
    const down = parseFloat(creditParams.downPayment) || 0;
    const principal = parseFloat(creditParams.amount) || (price - down);
    const months = parseInt(creditParams.term);
    const annualRate = parseFloat(creditParams.rate);

    if (isNaN(principal) || isNaN(months) || isNaN(annualRate) || principal <= 0) {
      setCreditCalculated(null);
      return;
    }

    const monthlyRate = annualRate / 12 / 100;
    let monthlyPayment;
    if (monthlyRate === 0) {
      monthlyPayment = principal / months;
    } else {
      monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    }
    const totalPayment = monthlyPayment * months;
    const overpayment = totalPayment - principal;

    setCreditCalculated({
      monthly_payment: Math.round(monthlyPayment),
      total_payment: Math.round(totalPayment),
      overpayment: Math.round(overpayment),
    });
  };

  const handlePurchase = async () => {
    if (!user) {
      alert('Войдите, чтобы совершить покупку');
      return;
    }
    try {
      const res = await api.post('/purchases/', { car_id: car.id });
      const receipt = {
        id: res.data.purchase?.id || Date.now(),
        brand: car.brand,
        model: car.model,
        year: car.year,
        price: car.price,
        purchase_date: new Date().toISOString(),
        paymentMethod,
        credit: paymentMethod === 'credit' ? {
          ...creditParams,
          ...creditCalculated,
          ...creditForm,
        } : null,
      };
      const savedReceipts = JSON.parse(localStorage.getItem('purchaseReceipts') || '[]');
      savedReceipts.push(receipt);
      localStorage.setItem('purchaseReceipts', JSON.stringify(savedReceipts));
      setPurchaseSuccess(true);
      setShowPurchaseModal(false);
    } catch (err) {
      alert('Ошибка оформления покупки');
    }
  };

  if (!car) return <div className={styles.loading}>Загрузка...</div>;

  const allImages = car.images?.length ? car.images.map(img => img.image_url) : [car.image_url || '/images/default-car.jpg'];

  return (
    <motion.div className={styles.container} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className={styles.content}>
        <div className={styles.galleryWrapper}>
          <motion.div className={styles.mainImage} whileHover={{ scale: 1.02 }}>
            <img src={getImageUrl(activeImage || allImages[0])} alt={car.model} className={styles.image} />
          </motion.div>
          {allImages.length > 1 && (
            <div className={styles.thumbnails}>
              {allImages.map((url, idx) => (
                <img key={idx} src={getImageUrl(url)} alt={`view ${idx + 1}`} className={`${styles.thumb} ${url === activeImage ? styles.activeThumb : ''}`} onClick={() => setActiveImage(url)} />
              ))}
            </div>
          )}
        </div>

        <div className={styles.info}>
          <h1 className={styles.title}>{car.brand} {car.model}</h1>
          <p className={styles.year}>{car.year} год</p>
          <p className={styles.price}>{car.price.toLocaleString('ru-RU')} ₽</p>
          {car.description && <p className={styles.description}>{car.description}</p>}

          <motion.button className={styles.buyButton} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowPurchaseModal(true)}>
            Купить
          </motion.button>

          <div className={styles.actions}>
            <button className={styles.secondaryButton} onClick={() => setShowLoan(true)}>Рассчитать кредит</button>
            <button className={styles.secondaryButton} onClick={() => setShowTestDrive(true)}>Записаться на тест-драйв</button>
          </div>

          {/* Характеристики */}
          {(car.engine_volume || car.power || car.fuel_type || car.consumption || car.drive_type || car.transmission || car.acceleration || car.max_speed || car.clearance || car.seats) && (
            <div className={styles.specs}>
              <h3>Характеристики</h3>
              <div className={styles.specsGrid}>
                {car.engine_volume && <div className={styles.specItem}><span>Объём двигателя</span><strong>{car.engine_volume} л</strong></div>}
                {car.power && <div className={styles.specItem}><span>Мощность</span><strong>{car.power} л.с.</strong></div>}
                {car.fuel_type && <div className={styles.specItem}><span>Топливо</span><strong>{{petrol:'Бензин', diesel:'Дизель', hybrid:'Гибрид', electric:'Электро'}[car.fuel_type] || car.fuel_type}</strong></div>}
                {car.consumption && <div className={styles.specItem}><span>Расход</span><strong>{car.consumption} л/100км</strong></div>}
                {car.drive_type && <div className={styles.specItem}><span>Привод</span><strong>{{FWD:'Передний', RWD:'Задний', AWD:'Полный'}[car.drive_type] || car.drive_type}</strong></div>}
                {car.transmission && <div className={styles.specItem}><span>КПП</span><strong>{{manual:'Механика', automatic:'Автомат', robot:'Робот', variator:'Вариатор'}[car.transmission] || car.transmission}</strong></div>}
                {car.acceleration && <div className={styles.specItem}><span>0-100 км/ч</span><strong>{car.acceleration} с</strong></div>}
                {car.max_speed && <div className={styles.specItem}><span>Макс. скорость</span><strong>{car.max_speed} км/ч</strong></div>}
                {car.clearance && <div className={styles.specItem}><span>Клиренс</span><strong>{car.clearance} мм</strong></div>}
                {car.seats && <div className={styles.specItem}><span>Мест</span><strong>{car.seats}</strong></div>}
              </div>
            </div>
          )}

          {purchaseSuccess && (
            <motion.div className={styles.successMessage} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {paymentMethod === 'credit'
                ? '✅ Заявка на кредит отправлена! Ожидайте решения банка.'
                : '✅ Покупка оформлена! Чек доступен в личном кабинете.'}
            </motion.div>
          )}
        </div>
      </div>

      {/* Модальное окно покупки */}
      <AnimatePresence>
        {showPurchaseModal && (
          <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPurchaseModal(false)}>
            <motion.div className={`${styles.modal} ${styles.purchaseModal}`} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <h3>Оформление покупки</h3>
              <div className={styles.purchaseDetails}>
                <p><strong>{car.brand} {car.model}</strong> ({car.year})</p>
                <p className={styles.purchasePrice}>{car.price.toLocaleString()} ₽</p>
              </div>
              <div className={styles.paymentMethods}>
                <label className={`${styles.paymentOption} ${paymentMethod === 'card' ? styles.activePayment : ''}`}>
                  <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                  <span>Банковская карта</span>
                </label>
                <label className={`${styles.paymentOption} ${paymentMethod === 'cash' ? styles.activePayment : ''}`}>
                  <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} />
                  <span>Наличные</span>
                </label>
                <label className={`${styles.paymentOption} ${paymentMethod === 'credit' ? styles.activePayment : ''}`}>
                  <input type="radio" name="payment" value="credit" checked={paymentMethod === 'credit'} onChange={() => setPaymentMethod('credit')} />
                  <span>В кредит</span>
                </label>
              </div>

              {/* Блок кредитных параметров */}
              {paymentMethod === 'credit' && (
                <div className={styles.creditSection}>
                  <h4>Параметры кредита</h4>
                  <div className={styles.creditField}>
                    <label>Сумма кредита (₽)</label>
                    <input
                      type="number"
                      value={creditParams.amount || (car.price - (parseFloat(creditParams.downPayment) || 0))}
                      onChange={(e) => setCreditParams(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="Сумма кредита"
                    />
                  </div>
                  <div className={styles.creditField}>
                    <label>Срок (мес.)</label>
                    <input
                      type="number"
                      value={creditParams.term}
                      onChange={(e) => setCreditParams(prev => ({ ...prev, term: e.target.value }))}
                    />
                  </div>
                  <div className={styles.creditField}>
                    <label>Годовая ставка (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={creditParams.rate}
                      onChange={(e) => setCreditParams(prev => ({ ...prev, rate: e.target.value }))}
                    />
                  </div>
                  <div className={styles.creditField}>
                    <label>Первоначальный взнос (₽)</label>
                    <input
                      type="number"
                      value={creditParams.downPayment}
                      onChange={(e) => setCreditParams(prev => ({ ...prev, downPayment: e.target.value }))}
                    />
                  </div>
                  {/* Анкета */}
                  <div className={styles.creditField}>
                    <label>ФИО</label>
                    <input
                      type="text"
                      value={creditForm.fullName}
                      onChange={(e) => setCreditForm(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Иванов Иван Иванович"
                    />
                  </div>
                  <div className={styles.creditField}>
                    <label>Телефон</label>
                    <input
                      type="tel"
                      value={creditForm.phone}
                      onChange={(e) => setCreditForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+7 (999) 123-45-67"
                    />
                  </div>

                  {creditCalculated && (
                    <div className={styles.creditResult}>
                      <p>Ежемесячный платёж: <strong>{creditCalculated.monthly_payment.toLocaleString()} ₽</strong></p>
                      <p>Общая сумма: {creditCalculated.total_payment.toLocaleString()} ₽</p>
                      <p>Переплата: {creditCalculated.overpayment.toLocaleString()} ₽</p>
                    </div>
                  )}
                </div>
              )}

              <div className={styles.modalButtons}>
                <button className={styles.confirmButton} onClick={handlePurchase}>
                  {paymentMethod === 'credit' ? 'Отправить заявку' : 'Оплатить'}
                </button>
                <button className={styles.cancelButton} onClick={() => setShowPurchaseModal(false)}>Отмена</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showLoan && <LoanModal car={car} onClose={() => setShowLoan(false)} />}
      {showTestDrive && <TestDriveModal carId={car.id} onClose={() => setShowTestDrive(false)} />}
    </motion.div>
  );
};

export default CarDetailPage;