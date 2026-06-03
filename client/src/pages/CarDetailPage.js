import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCar } from '../services/carService';
import { calculateLoan } from '../services/loanService'; // Успешный эндпоинт из твоего калькулятора
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import api, { getImageUrl } from '../services/api';
import LoanModal from '../components/LoanModal';
import TestDriveModal from '../components/TestDriveModal';
import styles from './CarDetailPage.module.css';

const CarDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [car, setCar] = useState(null);
  const [showLoan, setShowLoan] = useState(false);
  const [showTestDrive, setShowTestDrive] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [activeImage, setActiveImage] = useState(null);

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

  useEffect(() => {
    if (paymentMethod === 'credit') {
      doLocalCalculateCredit();
    }
  }, [creditParams.amount, creditParams.term, creditParams.rate, creditParams.downPayment, paymentMethod]);

  // Локальный расчёт для отображения циферок в модалке без отправки на сервер
  const doLocalCalculateCredit = () => {
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
      addNotification('Пожалуйста, авторизуйтесь для совершения покупки', 'warning');
      return;
    }
    
    try {
      if (paymentMethod === 'credit') {
        // Формируем сумму так же, как в калькуляторе
        const price = car?.price || 0;
        const down = parseFloat(creditParams.downPayment) || 0;
        const principal = parseFloat(creditParams.amount) || (price - down);

        // Используем ТОЧНО ТОТ ЖЕ запрос, что и в LoanCalculator.js
        await calculateLoan({
          car_id: car.id,
          amount: principal,
          term_months: parseInt(creditParams.term),
          interest_rate: parseFloat(creditParams.rate),
        });
        
        addNotification('Заявка на кредит успешно отправлена на рассмотрение!', 'success');
      } else {
        // Обычная покупка (наличные или карта)
        await api.post('/purchases/', { 
          car_id: car.id,
          payment_method: paymentMethod 
        });
        
        addNotification(`Покупка ${car.brand} успешно оформлена!`, 'success');
      }
      
      setPurchaseSuccess(true);
      setShowPurchaseModal(false);
    } catch (err) {
      console.error("Ошибка при оформлении:", err);
      // Если бэкенд возвращает читаемую ошибку, покажем её
      const errMsg = err.response?.data?.detail || 'Произошла ошибка при отправке данных. Проверьте консоль.';
      addNotification(errMsg, 'error');
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

          <motion.button className={styles.buyButton} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={() => setShowPurchaseModal(true)}>
            Купить
          </motion.button>

          <div className={styles.actions}>
            <button className={styles.secondaryButton} onClick={() => setShowLoan(true)}>Рассчитать кредит</button>
            <button className={styles.secondaryButton} onClick={() => setShowTestDrive(true)}>Записаться на тест-драйв</button>
          </div>

          {/* Уведомление об успехе на странице */}
          {purchaseSuccess && (
            <motion.div className={styles.successMessage} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <div className={styles.successIconWrapper}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div className={styles.successText}>
                {paymentMethod === 'credit' ? (
                  <>
                    <strong>Заявка на кредит отправлена!</strong>
                    <span>Менеджер свяжется с вами после решения банка.</span>
                  </>
                ) : (
                  <>
                    <strong>Покупка успешно оформлена!</strong>
                    <span>Электронный чек уже доступен в вашем личном кабинете.</span>
                  </>
                )}
              </div>
            </motion.div>
          )}

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
        </div>
      </div>

      {/* Модальное окно покупки */}
      <AnimatePresence>
        {showPurchaseModal && (
          <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPurchaseModal(false)}>
            <motion.div className={`${styles.modal} ${styles.purchaseModal}`} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <h3 className={styles.modalHeaderTitle}>Оформление покупки</h3>
              
              <div className={styles.purchaseDetails}>
                <p className={styles.modalCarName}><strong>{car.brand} {car.model}</strong> <span className={styles.modalCarYear}>({car.year})</span></p>
                <p className={styles.purchasePrice}>{car.price.toLocaleString('ru-RU')} ₽</p>
              </div>

              <div className={styles.sectionLabel}>ВЫБЕРИТЕ СПОСОБ ОПЛАТЫ</div>
              
              <div className={styles.paymentMethods}>
                <label className={`${styles.paymentOption} ${paymentMethod === 'card' ? styles.activePayment : ''}`}>
                  <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                  <div className={styles.tileIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill={paymentMethod === 'card' ? "#ffb300" : "none"} stroke={paymentMethod === 'card' ? "#ffb300" : "currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                      <line x1="1" y1="10" x2="23" y2="10" stroke={paymentMethod === 'card' ? "#333" : "currentColor"}></line>
                    </svg>
                  </div>
                  <span className={styles.tileText}>Банковская карта</span>
                </label>
                
                <label className={`${styles.paymentOption} ${paymentMethod === 'cash' ? styles.activePayment : ''}`}>
                  <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} />
                  <div className={styles.tileIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill={paymentMethod === 'cash' ? "#a5d6a7" : "none"} stroke={paymentMethod === 'cash' ? "#2e7d32" : "currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                      <circle cx="12" cy="12" r="2"></circle>
                      <path d="M6 12h.01M18 12h.01"></path>
                    </svg>
                  </div>
                  <span className={styles.tileText}>Наличные</span>
                </label>
                
                <label className={`${styles.paymentOption} ${paymentMethod === 'credit' ? styles.activePayment : ''}`}>
                  <input type="radio" name="payment" value="credit" checked={paymentMethod === 'credit'} onChange={() => setPaymentMethod('credit')} />
                  <div className={styles.tileIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill={paymentMethod === 'credit' ? "#e0e0e0" : "none"} stroke={paymentMethod === 'credit' ? "#616161" : "currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="22" width="16" height="2"></rect>
                      <path d="M2 10h20"></path>
                      <path d="M12 2L2 10h20L12 2z"></path>
                      <path d="M6 10v8"></path>
                      <path d="M10 10v8"></path>
                      <path d="M14 10v8"></path>
                      <path d="M18 10v8"></path>
                    </svg>
                  </div>
                  <span className={styles.tileText}>В кредит</span>
                </label>
              </div>

              {/* Блок кредитных параметров */}
              {paymentMethod === 'credit' && (
                <div className={styles.creditSection}>
                  <h4>Параметры кредита</h4>
                  <div className={styles.creditField}>
                    <label>Сумма кредита (₽)</label>
                    <input type="number" value={creditParams.amount || (car.price - (parseFloat(creditParams.downPayment) || 0))} onChange={(e) => setCreditParams(prev => ({ ...prev, amount: e.target.value }))} placeholder="Сумма кредита" />
                  </div>
                  <div className={styles.creditField}>
                    <label>Срок (мес.)</label>
                    <input type="number" value={creditParams.term} onChange={(e) => setCreditParams(prev => ({ ...prev, term: e.target.value }))} />
                  </div>
                  <div className={styles.creditField}>
                    <label>Годовая ставка (%)</label>
                    <input type="number" step="0.1" value={creditParams.rate} onChange={(e) => setCreditParams(prev => ({ ...prev, rate: e.target.value }))} />
                  </div>
                  <div className={styles.creditField}>
                    <label>Первоначальный взнос (₽)</label>
                    <input type="number" value={creditParams.downPayment} onChange={(e) => setCreditParams(prev => ({ ...prev, downPayment: e.target.value }))} />
                  </div>
                  <div className={styles.creditField}>
                    <label>ФИО</label>
                    <input type="text" value={creditForm.fullName} onChange={(e) => setCreditForm(prev => ({ ...prev, fullName: e.target.value }))} placeholder="Иванов Иван Иванович" />
                  </div>
                  <div className={styles.creditField}>
                    <label>Телефон</label>
                    <input type="tel" value={creditForm.phone} onChange={(e) => setCreditForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="+7 (999) 123-45-67" />
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