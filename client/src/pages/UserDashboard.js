import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getImageUrl } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import styles from './UserDashboard.module.css';

const UserDashboard = () => {
  const { user, setUser, notifications, clearNotifications } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [purchases, setPurchases] = useState([]);
  const [testDrives, setTestDrives] = useState([]);
  const [loans, setLoans] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [compareIds, setCompareIds] = useState([]); // Храним только ID выбранных для сравнения авто
  const [loading, setLoading] = useState(true);
  
  // Состояния для редактирования профиля
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
  });
  const [updateStatus, setUpdateStatus] = useState(null);

  // Состояния для отправки отзывов по тест-драйвам
  const [reviewForm, setReviewForm] = useState({
    test_drive_id: null,
    rating: 5,
    comment: ''
  });

  const tabs = [
    { key: 'profile', label: 'Профиль' },
    { key: 'purchases', label: 'История покупок' },
    { key: 'testdrives', label: 'Тест-драйвы' },
    { key: 'loans', label: 'Кредитные заявки' },
    { key: 'favorites', label: 'Избранное' },
    { key: 'compare', label: 'Сравнение авто' },
    { key: 'notifications', label: 'Уведомления' }
  ];

  // ================= ЗАГРУЗКА ДАННЫХ =================
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

      // Читаем Избранное
      const cachedFavs = JSON.parse(localStorage.getItem('favorites') || '[]');
      setFavorites(cachedFavs);

      // Читаем ID машин для сравнения
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

  // Обновление данных профиля
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setUpdateStatus(null);
    try {
      const res = await api.put('/auth/profile', profileForm);
      setUser(res.data);
      setUpdateStatus({ type: 'success', text: 'Профиль успешно обновлен' });
    } catch (err) {
      setUpdateStatus({ type: 'error', text: 'Не удалось обновить профиль. Попробуйте позже.' });
    }
  };

  // Извлечение безопасного ID машины (фикс ошибки с undefined)
  const getCarId = (car) => {
    if (!car) return null;
    return car.id || car.car_id || null;
  };

  // Удаление из избранного
  const removeFavorite = (carId) => {
    if (!carId) return;
    const updated = favorites.filter(car => getCarId(car) !== carId);
    setFavorites(updated);
    localStorage.setItem('favorites', JSON.stringify(updated));
    
    const updatedCompare = compareIds.filter(cId => cId !== carId);
    setCompareIds(updatedCompare);
    localStorage.setItem('compareIds', JSON.stringify(updatedCompare));
  };

  // Переключение машины в списке сравнения
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

  // Отправка отзыва
  const handleReviewSubmit = async (e, tdId) => {
    e.preventDefault();
    try {
      await api.post('/testdrives/review', {
        test_drive_id: tdId,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment
      });
      alert('Спасибо за ваш отзыв!');
      setReviewForm({ test_drive_id: null, rating: 5, comment: '' });
      fetchData();
    } catch (err) {
      console.error('Ошибка отправки отзыва:', err);
      alert('Не удалось отправить отзыв.');
    }
  };

  // Бронебойный хелпер для вытаскивания URL картинки
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

  // Фильтруем массив избранного для вкладки сравнения
  const compareCars = favorites.filter(car => {
    const cid = getCarId(car);
    return cid && compareIds.includes(cid);
  });

  // Проверка отличий в характеристиках
  const isFieldDifferent = (fieldKey) => {
    if (compareCars.length < 2) return false;
    const firstValue = compareCars[0][fieldKey];
    return compareCars.some(car => car[fieldKey] !== firstValue);
  };

  // ================= ОТРИСОВКА ВКЛАДОК =================
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

      case 'purchases':
        return purchases.length ? (
          <div className={styles.cardsGrid}>
            {purchases.map((p) => (
              <div key={`purchase-${p.id}`} className={`${styles.card} ${styles.receiptCard}`}>
                <div className={styles.receiptHeader}>
                  <h4>Договор купли-продажи №{p.id}</h4>
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
                <button className={styles.printBtn} onClick={() => window.print()}>
                  Распечатать чек (PDF)
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>У вас пока нет оформленных покупок автомобилей.</p>
        );

      case 'testdrives':
        return testDrives.length ? (
          <div className={styles.cardsGrid}>
            {testDrives.map((td) => (
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
                  
                  {td.comment && (
                    <div className={styles.comment}>
                      <strong>Ответ автосалона:</strong> {td.comment}
                    </div>
                  )}

                  {td.status === 'approved' && (
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <h5 style={{ margin: '0 0 0.2rem 0', fontSize: '0.95rem' }}>Оставить отзыв о поездке</h5>
                      <form onSubmit={(e) => handleReviewSubmit(e, td.id)} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <select 
                          value={reviewForm.test_drive_id === td.id ? reviewForm.rating : 5}
                          onChange={(e) => setReviewForm({ ...reviewForm, test_drive_id: td.id, rating: e.target.value })}
                          style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid rgba(128,128,128,0.2)', padding: '0.3rem', borderRadius: '6px' }}
                        >
                          <option value="5">5 ★★★★★</option>
                          <option value="4">4 ★★★★</option>
                          <option value="3">3 ★★★</option>
                          <option value="2">2 ★★</option>
                          <option value="1">1 ★</option>
                        </select>
                        <motion.textarea 
                          placeholder="Поделитесь впечатлениями..." 
                          value={reviewForm.test_drive_id === td.id ? reviewForm.comment : ''}
                          onChange={(e) => setReviewForm({ ...reviewForm, test_drive_id: td.id, comment: e.target.value })}
                          style={{ width: '100%', background: 'var(--bg)', color: 'var(--text)', border: '1px solid rgba(128,128,128,0.2)', borderRadius: '8px', padding: '0.5rem', fontSize: '0.85rem' }}
                          rows="2"
                          required
                        />
                        <button type="submit" className={styles.printBtn}>Отправить</button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>Заявки на тест-драйв отсутствуют.</p>
        );

      case 'loans':
        return loans.length ? (
          <div className={styles.cardsGrid}>
            {loans.map((loan) => (
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
                  {loan.comment && <div className={styles.comment}><strong>Решение:</strong> {loan.comment}</div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>Расчетов или кредитных заявок пока нет.</p>
        );

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
                  <div className={styles.favImageWrapper} style={{ width: '100%', height: '160px', overflow: 'hidden', borderRadius: '8px', background: '#111' }}>
                    <img 
                      src={getImageUrl(imgPath)} 
                      alt={`${brand} ${model}`} 
                      className={styles.favImage}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = '/images/default-car.jpg'; }}
                    />
                  </div>
                  <div className={styles.favInfo} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {carId ? (
                      <Link to={`/cars/${carId}`} className={styles.favLink} style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                        {brand} {model}
                      </Link>
                    ) : (
                      <span className={styles.favLink} style={{ fontWeight: '600', fontSize: '1.1rem' }}>{brand} {model}</span>
                    )}
                    <p className={styles.price} style={{ margin: 0, color: 'var(--primary)', fontWeight: 'bold' }}>
                      {car.price ? `${car.price.toLocaleString('ru-RU')} ₽` : 'Цена по запросу'}
                    </p>
                    
                    {carId && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', margin: '0.2rem 0' }}>
                        <input 
                          type="checkbox" 
                          checked={compareIds.includes(carId)} 
                          onChange={() => toggleCompare(carId)}
                        />
                        <span>Добавить к сравнению</span>
                      </label>
                    )}

                    <button onClick={() => removeFavorite(carId)} className={styles.removeFav} style={{ width: '100%', marginTop: 'auto' }}>
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
        return notifications.length ? (
          <div className={styles.cardsGrid}>
            {notifications.map((n, idx) => {
              const msgText = n?.message || (typeof n === 'string' ? n : 'Новое уведомление');
              return (
                <div key={`notification-${idx}`} className={`${styles.card} ${styles.notificationCard}`}>
                  <div className={styles.cardBody}>{msgText}</div>
                </div>
              );
            })}
            <button className={styles.clearBtn} onClick={clearNotifications}>
              Очистить логи уведомлений
            </button>
          </div>
        ) : (
          <p className={styles.empty}>Новых уведомлений нет.</p>
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
    </motion.div>
  );
};

export default UserDashboard;