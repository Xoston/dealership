import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext'; // Импорт тостера
import api, { getImageUrl } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import styles from './UserDashboard.module.css';

const UserDashboard = () => {
  const { user, setUser } = useAuth();   // больше нет notifications/clearNotifications
  const { addNotification } = useNotification(); // хук тостов

  const [activeTab, setActiveTab] = useState('profile');
  const [purchases, setPurchases] = useState([]);
  const [testDrives, setTestDrives] = useState([]);
  const [loans, setLoans] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [compareIds, setCompareIds] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [printingId, setPrintingId] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeReviewTd, setActiveReviewTd] = useState(null);
  const [hoverRating, setHoverRating] = useState(null);
  
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewComment, setViewComment] = useState(null);
  
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
  });
  const [updateStatus, setUpdateStatus] = useState(null);

  const [reviewForm, setReviewForm] = useState({
    test_drive_id: null,
    rating: 5,
    comment: ''
  });

  // ---------- ПАГИНАЦИЯ ----------
  const [page, setPage] = useState({
    purchases: 1,
    testdrives: 1,
    loans: 1,
  });
  const PER_PAGE = 5;

  const tabs = [
    { key: 'profile', label: 'Профиль' },
    { key: 'purchases', label: 'История покупок' },
    { key: 'testdrives', label: 'Тест-драйвы' },
    { key: 'loans', label: 'Кредитные заявки' },
    { key: 'favorites', label: 'Избранное' },
    { key: 'compare', label: 'Сравнение авто' },
    { key: 'notifications', label: 'Уведомления' }
  ];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [pRes, tRes, lRes] = await Promise.all([
        api.get('/purchases/my'),
        api.get('/testdrives/my'),
        api.get('/loans/my'),
      ]);
      setPurchases(pRes.data);
      setTestDrives(tRes.data);
      setLoans(lRes.data);

      const cachedFavs = JSON.parse(localStorage.getItem('favorites') || '[]');
      setFavorites(cachedFavs);

      const cachedCompareIds = JSON.parse(localStorage.getItem('compareIds') || '[]');
      setCompareIds(cachedCompareIds);
    } catch (err) {
      console.error('Ошибка при загрузке данных ЛК:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (printingId !== null) {
      window.print();
      setPrintingId(null);
    }
  }, [printingId]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setUpdateStatus(null);
    try {
      const res = await api.put('/auth/profile', profileForm);
      setUser(res.data);
      setUpdateStatus({ type: 'success', text: 'Профиль успешно обновлен' });
      addNotification('Профиль успешно обновлён', 'success');
    } catch (err) {
      setUpdateStatus({ type: 'error', text: 'Не удалось обновить профиль. Попробуйте позже.' });
      addNotification('Не удалось обновить профиль', 'error');
    }
  };

  const handlePrint = (id) => {
    setPrintingId(id);
  };

  const getCarId = (car) => {
    if (!car) return null;
    return car.id || car.car_id || null;
  };

  const removeFavorite = (carId) => {
    if (!carId) return;
    const updated = favorites.filter(car => getCarId(car) !== carId);
    setFavorites(updated);
    localStorage.setItem('favorites', JSON.stringify(updated));
    
    const updatedCompare = compareIds.filter(cId => cId !== carId);
    setCompareIds(updatedCompare);
    localStorage.setItem('compareIds', JSON.stringify(updatedCompare));
  };

  const toggleCompare = (carId) => {
    if (!carId) return;
    let updated;
    if (compareIds.includes(carId)) {
      updated = compareIds.filter(cId => cId !== carId);
    } else {
      updated = [...compareIds, carId];
    }
    setCompareIds(updated);
    localStorage.setItem('compareIds', JSON.stringify(updated));
  };

  const openReviewModal = (td) => {
    setReviewForm({ test_drive_id: td.id, rating: 5, comment: '' });
    setActiveReviewTd(td);
    setShowReviewModal(true);
  };

  const openViewCommentModal = (item, type = 'testdrive') => {
    if (type === 'loan') {
      setViewComment({
        title: 'Решение по кредиту',
        subtitle: `Заявка №${item.id}`,
        comment: item.admin_comment || item.comment || 'Решение отсутствует.'
      });
    } else {
      setViewComment({
        title: 'Ответ автосалона',
        subtitle: `${item.car_brand || item.brand || 'Luxury'} ${item.car_model || item.model || 'Car'}`,
        comment: item.admin_comment || item.comment || 'Комментарий отсутствует.'
      });
    }
    setShowViewModal(true);
  };

  const handleReviewSubmit = async (e, tdId) => {
    e.preventDefault();
    try {
      await api.post('/testdrives/review', {
        test_drive_id: tdId,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment
      });
      addNotification('Спасибо за ваш отзыв!', 'success');
      setReviewForm({ test_drive_id: null, rating: 5, comment: '' });
      setShowReviewModal(false);
      setActiveReviewTd(null);
      fetchData();
    } catch (err) {
      console.error('Ошибка отправки отзыва:', err);
      addNotification('Не удалось отправить отзыв', 'error');
    }
  };

  const resolveCarImage = (car) => {
    if (!car) return '';
    let url = car.image_url || car.image;
    if (!url && car.images && car.images.length > 0) {
      url = car.images[0].image_url || car.images[0];
    }
    if (typeof url === 'string') {
      if (!url.startsWith('http') && !url.startsWith('/')) {
        return '/' + url;
      }
      return url;
    }
    return '';
  };

  const compareCars = favorites.filter(car => {
    const cid = getCarId(car);
    return cid && compareIds.includes(cid);
  });

  const isFieldDifferent = (fieldKey) => {
    if (compareCars.length < 2) return false;
    const firstValue = compareCars[0][fieldKey];
    return compareCars.some(car => car[fieldKey] !== firstValue);
  };

  // Пагинация
  const renderPagination = (tabKey, totalItems) => {
    const totalPages = Math.ceil(totalItems / PER_PAGE);
    const current = page[tabKey] || 1;
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        if (current > 3) pages.push('...');
        const start = Math.max(2, current - 1);
        const end = Math.min(totalPages - 1, current + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        if (current < totalPages - 2) pages.push('...');
        pages.push(totalPages);
      }
      return pages;
    };

    return (
      <div className={styles.pagination}>
        <button
          className={styles.pageBtn}
          disabled={current === 1}
          onClick={() => setPage(prev => ({ ...prev, [tabKey]: current - 1 }))}
        >
          ‹
        </button>
        {getPageNumbers().map((p, idx) => (
          <button
            key={idx}
            className={`${styles.pageBtn} ${p === current ? styles.activePage : ''} ${p === '...' ? styles.dots : ''}`}
            onClick={() => typeof p === 'number' && setPage(prev => ({ ...prev, [tabKey]: p }))}
            disabled={p === '...'}
          >
            {p}
          </button>
        ))}
        <button
          className={styles.pageBtn}
          disabled={current === totalPages}
          onClick={() => setPage(prev => ({ ...prev, [tabKey]: current + 1 }))}
        >
          ›
        </button>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={styles.profileSection}>
            <form onSubmit={handleProfileSubmit} className={styles.profileForm}>
              <div className={styles.field}>
                <label>ФИО владельца</label>
                <input 
                  type="text" 
                  value={profileForm.full_name} 
                  onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })} 
                  required 
                />
              </div>
              <div className={styles.field}>
                <label>Номер телефона</label>
                <input 
                  type="text" 
                  value={profileForm.phone} 
                  onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} 
                  required 
                />
              </div>
              <button type="submit" className={styles.saveBtn}>
                Сохранить изменения
              </button>
              {updateStatus && (
                <p className={updateStatus.type === 'success' ? styles.successMsg : styles.errorMsg}>
                  {updateStatus.text}
                </p>
              )}
            </form>
          </motion.div>
        );

      case 'purchases': {
        const totalPages = Math.ceil(purchases.length / PER_PAGE);
        const currentPage = page.purchases || 1;
        const paginatedPurchases = purchases.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
        return purchases.length ? (
          <>
            <div className={styles.cardsGrid}>
              {paginatedPurchases.map((p, idx) => (
                <div key={`purchase-${p.id}`} className={`${styles.card} ${styles.receiptCard} ${printingId === p.id ? styles.isPrinting : ''}`}>
                  <div className={styles.receiptHeader}>
                    <h4>Чек №{p.id}</h4>
                    <span>{p.purchase_date ? new Date(p.purchase_date).toLocaleDateString('ru-RU') : ''}</span>
                  </div>
                  <div className={styles.receiptBody}>
                    <div className={styles.receiptRow}>
                      <span>Автомобиль:</span>
                      <strong>{p.car_brand || p.brand || 'Luxury Car'} {p.car_model || p.model || ''}</strong>
                    </div>
                    <div className={styles.receiptRow}>
                      <span>Стоимость сделки:</span>
                      <strong>{p.price?.toLocaleString('ru-RU')} ₽</strong>
                    </div>
                    <div className={styles.receiptRow}>
                      <span>Статус плательщика:</span>
                      <strong>Владелец подтвержден</strong>
                    </div>
                  </div>
                  <button className={styles.printBtn} onClick={() => handlePrint(p.id)}>
                    Распечатать чек (PDF)
                  </button>
                </div>
              ))}
            </div>
            {renderPagination('purchases', purchases.length)}
          </>
        ) : (
          <p className={styles.empty}>У вас пока нет оформленных покупок автомобилей.</p>
        );
      }

      case 'testdrives': {
        const totalPages = Math.ceil(testDrives.length / PER_PAGE);
        const currentPage = page.testdrives || 1;
        const paginatedTestDrives = testDrives.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
        return testDrives.length ? (
          <>
            <div className={styles.cardsGrid}>
              {paginatedTestDrives.map((td) => (
                <div key={`td-${td.id}`} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h4>Тест-драйв №{td.id}</h4>
                    <span className={`${styles.loanStatus} ${styles[td.status]}`}>
                      {td.status === 'pending' && 'На рассмотрении'}
                      {td.status === 'approved' && 'Одобрен'}
                      {td.status === 'rejected' && 'Отклонен'}
                    </span>
                  </div>
                  <div className={styles.cardBody}>
                    <p><strong>Автомобиль:</strong> {td.car_brand || td.brand || 'Luxury'} {td.car_model || td.model || 'Car'}</p>
                    <p><strong>Дата сессии:</strong> {td.preferred_date ? new Date(td.preferred_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : 'Не назначена'}</p>
                    <p><strong>Контактный телефон:</strong> {td.phone}</p>
                    
                    {(td.admin_comment || td.comment) && (
                      <button 
                        type="button" 
                        className={styles.actionBtn}
                        onClick={() => openViewCommentModal(td, 'testdrive')}
                        style={{ marginTop: '0.5rem' }}
                      >
                        Посмотреть комментарий
                      </button>
                    )}

                    {td.status === 'approved' && (
                      <button 
                        className={styles.actionBtn} 
                        onClick={() => openReviewModal(td)}
                        style={{ marginTop: '0.5rem' }}
                      >
                        Оставить отзыв
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {renderPagination('testdrives', testDrives.length)}
          </>
        ) : (
          <p className={styles.empty}>Заявки на тест-драйв отсутствуют.</p>
        );
      }

      case 'loans': {
        const totalPages = Math.ceil(loans.length / PER_PAGE);
        const currentPage = page.loans || 1;
        const paginatedLoans = loans.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
        return loans.length ? (
          <>
            <div className={styles.cardsGrid}>
              {paginatedLoans.map((loan) => (
                <div key={`loan-${loan.id}`} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h4>Заявка №{loan.id}</h4>
                    <span className={`${styles.loanStatus} ${styles[loan.status]}`}>
                      {loan.status === 'pending' && 'На рассмотрении'}
                      {loan.status === 'approved' && 'Одобрено'}
                      {loan.status === 'rejected' && 'Отклонено'}
                    </span>
                  </div>
                  <div className={styles.cardBody}>
                    <p><strong>Сумма финансирования:</strong> {loan.amount?.toLocaleString('ru-RU')} ₽</p>
                    <p><strong>Период кредитования:</strong> {loan.term_months || loan.term} мес.</p>
                    <p><strong>Процентная ставка:</strong> {loan.interest_rate || loan.rate}% годовых</p>
                    <p><strong>Ежемесячный платеж:</strong> {loan.monthly_payment?.toLocaleString('ru-RU')} ₽</p>
                    
                    {(loan.admin_comment || loan.comment) && (
                      <button 
                        type="button" 
                        className={styles.actionBtn}
                        onClick={() => openViewCommentModal(loan, 'loan')}
                        style={{ marginTop: '0.5rem' }}
                      >
                        Посмотреть решение
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {renderPagination('loans', loans.length)}
          </>
        ) : (
          <p className={styles.empty}>Расчетов или кредитных заявок пока нет.</p>
        );
      }

      case 'favorites':
        return favorites.length ? (
          <div className={styles.favoritesGrid}>
            {favorites.map((car, idx) => {
              const carId = getCarId(car);
              const brand = car.brand || car.car_brand || 'Premium';
              const model = car.model || car.car_model || 'Car';
              const imgPath = resolveCarImage(car);
              const fallbackKey = carId ? `fav-${carId}` : `fav-idx-${idx}`;

              return (
                <div key={fallbackKey} className={styles.favCard}>
                  <div className={styles.favImageWrapper}>
                    <img 
                      src={getImageUrl(imgPath)} 
                      alt={`${brand} ${model}`} 
                      className={styles.favImage}
                      onError={(e) => { e.target.src = '/images/default-car.jpg'; }}
                    />
                  </div>
                  <div className={styles.favInfo}>
                    {carId ? (
                      <Link to={`/cars/${carId}`} className={styles.favLink}>
                        {brand} {model}
                      </Link>
                    ) : (
                      <span className={styles.favLink}>{brand} {model}</span>
                    )}
                    <p className={styles.price}>
                      {car.price ? `${car.price.toLocaleString('ru-RU')} ₽` : 'Цена по запросу'}
                    </p>
                    {carId && (
                      <button
                        className={`${styles.compareToggle} ${compareIds.includes(carId) ? styles.compareActive : ''}`}
                        onClick={() => toggleCompare(carId)}
                      >
                        <span className={styles.compareIcon}></span>
                        {compareIds.includes(carId) ? 'В сравнении' : 'Добавить к сравнению'}
                      </button>
                    )}
                    <button onClick={() => removeFavorite(carId)} className={styles.removeFav}>
                      Удалить из избранного
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className={styles.empty}>Ваш список избранного пуст.</p>
        );

      case 'compare':
        return compareCars.length ? (
          <div className={styles.compareGrid}>
            {compareCars.map((car, idx) => {
              const carId = getCarId(car);
              const imgPath = resolveCarImage(car);
              const fallbackKey = carId ? `compare-${carId}` : `compare-idx-${idx}`;

              return (
                <div key={fallbackKey} className={styles.compareCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className={styles.price}>{car.price?.toLocaleString('ru-RU')} ₽</span>
                    <button onClick={() => toggleCompare(carId)} className={styles.removeCarBtn} style={{ background: 'none', border: 'none', color: '#ff4d4d', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                  </div>
                  <img 
                    src={getImageUrl(imgPath)} 
                    alt={`${car.brand} ${car.model}`} 
                    className={styles.compareImage} 
                    onError={(e) => { e.target.src = '/images/default-car.jpg'; }}
                  />
                  <h3 className={styles.compareName}>{car.brand} {car.model}</h3>
                  <div className={styles.compareGroup}>
                    <div className={styles.groupTitle}>Основные параметры</div>
                    <div className={`${styles.compareField} ${isFieldDifferent('year') ? styles.diffField : ''}`}>
                      <span className={styles.fieldLabel}>Год выпуска</span>
                      <span className={styles.fieldValue}>{car.year}</span>
                    </div>
                    <div className={`${styles.compareField} ${isFieldDifferent('body_type') ? styles.diffField : ''}`}>
                      <span className={styles.fieldLabel}>Тип кузова</span>
                      <span className={styles.fieldValue}>{car.body_type || 'Седан'}</span>
                    </div>
                  </div>
                  <div className={styles.compareGroup}>
                    <div className={styles.groupTitle}>Двигатель и КПП</div>
                    <div className={`${styles.compareField} ${isFieldDifferent('engine_volume') ? styles.diffField : ''}`}>
                      <span className={styles.fieldLabel}>Объем двигателя</span>
                      <span className={styles.fieldValue}>{car.engine_volume ? `${car.engine_volume} л` : '—'}</span>
                    </div>
                    <div className={`${styles.compareField} ${isFieldDifferent('power') ? styles.diffField : ''}`}>
                      <span className={styles.fieldLabel}>Мощность</span>
                      <span className={styles.fieldValue}>{car.power ? `${car.power} л.с.` : '—'}</span>
                    </div>
                    <div className={`${styles.compareField} ${isFieldDifferent('transmission') ? styles.diffField : ''}`}>
                      <span className={styles.fieldLabel}>Трансмиссия</span>
                      <span className={styles.fieldValue}>{car.transmission || '—'}</span>
                    </div>
                    <div className={`${styles.compareField} ${isFieldDifferent('drive_type') ? styles.diffField : ''}`}>
                      <span className={styles.fieldLabel}>Привод</span>
                      <span className={styles.fieldValue}>{car.drive_type || '—'}</span>
                    </div>
                  </div>
                  <div className={styles.compareGroup}>
                    <div className={styles.groupTitle}>Динамика</div>
                    <div className={`${styles.compareField} ${isFieldDifferent('acceleration') ? styles.diffField : ''}`}>
                      <span className={styles.fieldLabel}>0-100 км/ч</span>
                      <span className={styles.fieldValue}>{car.acceleration ? `${car.acceleration} с` : '—'}</span>
                    </div>
                    <div className={`${styles.compareField} ${isFieldDifferent('max_speed') ? styles.diffField : ''}`}>
                      <span className={styles.fieldLabel}>Макс. скорость</span>
                      <span className={styles.fieldValue}>{car.max_speed ? `${car.max_speed} км/ч` : '—'}</span>
                    </div>
                  </div>
                  {carId && (
                    <Link to={`/cars/${carId}`} className={styles.printBtn} style={{ textDecoration: 'none', textAlign: 'center', marginTop: '1rem', display: 'block' }}>
                      Открыть карточку
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className={styles.empty}>Нет выбранных авто для сравнения. Откройте вкладку «Избранное» и отметьте нужные модели галочками.</p>
        );

      case 'notifications':
        return (
          <div className={styles.notificationsTab}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--text)', margin: 0, fontFamily: "'Playfair Display', serif" }}>
                Центр уведомлений
              </h2>
            </div>
            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--glass-bg)', borderRadius: '20px', color: 'var(--text)', opacity: 0.6 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '500' }}>
                Все уведомления теперь приходят во всплывающих окнах (тостах).
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) return <div className={styles.loading}>Синхронизация данных профиля...</div>;

  return (
    <motion.div className={styles.container} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <h2 className={styles.title}>Личный кабинет – {user?.full_name || 'Клиент'}</h2>
      
      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={`tab-btn-${tab.key}`}
            className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label} {tab.key === 'compare' && compareIds.length > 0 && `(${compareIds.length})`}
          </button>
        ))}
      </div>

      <div className={styles.tabContentWindow}>
        <AnimatePresence mode="wait">
          {renderTabContent()}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showReviewModal && activeReviewTd && (
          <motion.div 
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowReviewModal(false); setActiveReviewTd(null); }}
          >
            <motion.div 
              className={styles.modalContent}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.modalClose} onClick={() => { setShowReviewModal(false); setActiveReviewTd(null); }}>✕</button>
              <h3 className={styles.modalTitle}>Поделитесь впечатлениями</h3>
              <p className={styles.modalSubtitle}>
                {activeReviewTd.car_brand || activeReviewTd.brand || 'Luxury'} {activeReviewTd.car_model || activeReviewTd.model || 'Car'}
              </p>
              
              <form onSubmit={(e) => handleReviewSubmit(e, activeReviewTd.id)} className={styles.modalForm}>
                <div className={styles.modalField}>
                  <label>Ваша оценка поездки</label>
                  <div className={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isActive = star <= (hoverRating || reviewForm.rating);
                      return (
                        <span
                          key={`star-${star}`}
                          className={`${styles.star} ${isActive ? styles.starActive : ''}`}
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                        >
                          ★
                        </span>
                      );
                    })}
                  </div>
                </div>
                
                <div className={styles.modalField}>
                  <label>Ваш отзыв</label>
                  <textarea 
                    placeholder="Расскажите, как прошёл тест-драйв, понравилась ли управляемость и динамика автомобиля..." 
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    className={styles.modalTextarea}
                    rows="4"
                    required
                  />
                </div>
                
                <div className={styles.modalActions}>
                  <button 
                    type="button" 
                    className={styles.cancelBtn} 
                    onClick={() => { setShowReviewModal(false); setActiveReviewTd(null); }}
                  >
                    Отмена
                  </button>
                  <button type="submit" className={styles.submitBtn}>
                    Отправить отзыв
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showViewModal && viewComment && (
          <motion.div 
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowViewModal(false); setViewComment(null); }}
          >
            <motion.div 
              className={styles.modalContent}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className={styles.modalClose} onClick={() => { setShowViewModal(false); setViewComment(null); }}>✕</button>
              <h3 className={styles.modalTitle}>{viewComment.title}</h3>
              <p className={styles.modalSubtitle}>{viewComment.subtitle}</p>
              
              <div className={styles.modalField}>
                <div style={{ background: 'rgba(128, 128, 128, 0.08)', padding: '1.2rem', borderRadius: '14px', fontStyle: 'italic', lineHeight: '1.6', borderLeft: '4px solid var(--primary)', color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {viewComment.comment}
                </div>
              </div>
              
              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={styles.submitBtn} 
                  onClick={() => { setShowViewModal(false); setViewComment(null); }}
                >
                  Закрыть
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UserDashboard;