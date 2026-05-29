import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getImageUrl } from '../services/api';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import ComparePage from './ComparePage';
import styles from './UserDashboard.module.css';

const UserDashboard = () => {
  const { user, setUser, notifications, addNotification, clearNotifications } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [purchases, setPurchases] = useState([]);
  const [testDrives, setTestDrives] = useState([]);
  const [loans, setLoans] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
  });
  const [updateStatus, setUpdateStatus] = useState(null);

  // ================= ЗАГРУЗКА ДАННЫХ =================
  const fetchData = useCallback(async () => {
    try {
      const [pRes, tRes, lRes] = await Promise.all([
        api.get('/purchases/my'),
        api.get('/testdrives/my'),
        api.get('/loans/my'),
      ]);
      setPurchases(pRes.data);
      setTestDrives(tRes.data);
      setLoans(lRes.data);

      // Избранное
      const favIds = JSON.parse(localStorage.getItem('favorites') || '[]');
      if (favIds.length) {
        const favCars = [];
        for (const id of favIds) {
          try {
            const carRes = await api.get(`/cars/${id}`);
            favCars.push(carRes.data);
          } catch (err) { /* автомобиль удалён */ }
        }
        setFavorites(favCars);
      } else {
        setFavorites([]);
      }

      // Проверка статусов для уведомлений
      const savedLoanStatuses = JSON.parse(localStorage.getItem('loanStatuses') || '{}');
      const newNotifications = [];
      lRes.data.forEach(loan => {
        const prevStatus = savedLoanStatuses[loan.id];
        if (prevStatus && prevStatus !== loan.status) {
          const text = loan.status === 'approved' ? `Кредит #${loan.id} одобрен` : `Кредит #${loan.id} отклонён`;
          newNotifications.push(text);
        }
      });
      const savedTDStatuses = JSON.parse(localStorage.getItem('tdStatuses') || '{}');
      tRes.data.forEach(td => {
        const prevStatus = savedTDStatuses[td.id];
        if (prevStatus && prevStatus !== td.status) {
          const text = td.status === 'approved' ? `Тест-драйв #${td.id} одобрен` : `Тест-драйв #${td.id} отклонён`;
          newNotifications.push(text);
        }
      });
      newNotifications.forEach(msg => addNotification(msg));

      const newLoanStatuses = {};
      lRes.data.forEach(l => { newLoanStatuses[l.id] = l.status; });
      localStorage.setItem('loanStatuses', JSON.stringify(newLoanStatuses));
      const newTDStatuses = {};
      tRes.data.forEach(t => { newTDStatuses[t.id] = t.status; });
      localStorage.setItem('tdStatuses', JSON.stringify(newTDStatuses));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  useEffect(() => {
    if (['loans', 'testdrives', 'favorites', 'compare'].includes(activeTab)) fetchData();
  }, [activeTab, fetchData]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdateStatus(null);
    try {
      const res = await api.put('/auth/me', profileForm);
      setUser(res.data);
      setUpdateStatus('success');
    } catch (err) {
      setUpdateStatus('error');
      console.error(err);
    }
  };

  const removeFavorite = (carId) => {
    const newFav = favorites.filter(car => car.id !== carId);
    setFavorites(newFav);
    localStorage.setItem('favorites', JSON.stringify(newFav.map(car => car.id)));
  };

  // ================= ПЕЧАТЬ ОДНОГО ЧЕКА =================
  const printSingleReceipt = (receipt) => {
    const dateStr = new Date(receipt.purchase_date).toLocaleString('ru-RU');
    const paymentStr =
      receipt.paymentMethod === 'card'
        ? 'Банковская карта'
        : receipt.paymentMethod === 'cash'
        ? 'Наличные'
        : 'Кредит';

    const printContent = `
      <html>
        <head>
          <title>Чек #${receipt.id}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              padding: 2rem;
              color: #111;
              background: white;
            }
            .header {
              text-align: center;
              border-bottom: 2px dashed #ccc;
              padding-bottom: 1rem;
              margin-bottom: 1.5rem;
            }
            .header h1 {
              font-family: 'Playfair Display', serif;
              color: #4A148C;
              font-size: 2rem;
              margin: 0 0 0.3rem 0;
            }
            .row {
              display: flex;
              justify-content: space-between;
              padding: 0.4rem 0;
              border-bottom: 1px dotted #ddd;
            }
            .row span { color: #555; font-size: 0.95rem; }
            .row strong { color: #111; font-size: 0.95rem; }
            .footer {
              margin-top: 2rem;
              text-align: center;
              color: #888;
              font-size: 0.9rem;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Luxury Dealer</h1>
            <p>Чек #${receipt.id}</p>
          </div>
          <div class="row"><span>Автомобиль</span><strong>${receipt.brand} ${receipt.model}</strong></div>
          <div class="row"><span>Год выпуска</span><strong>${receipt.year}</strong></div>
          <div class="row"><span>Цена</span><strong>${receipt.price?.toLocaleString('ru-RU')} ₽</strong></div>
          <div class="row"><span>Дата покупки</span><strong>${dateStr}</strong></div>
          <div class="row"><span>Способ оплаты</span><strong>${paymentStr}</strong></div>
          <div class="footer">Спасибо за покупку!</div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=600,height=500');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const tabs = [
    { key: 'profile', label: 'Профиль' },
    { key: 'purchases', label: 'Мои покупки' },
    { key: 'favorites', label: 'Избранное' },
    { key: 'compare', label: 'Сравнение' },
    { key: 'testdrives', label: 'Тест-драйвы' },
    { key: 'loans', label: 'Кредиты' },
    { key: 'notifications', label: 'Уведомления' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className={styles.profileSection}>
            <h3>Редактировать профиль</h3>
            <form onSubmit={handleProfileUpdate} className={styles.profileForm}>
              <div className={styles.field}>
                <label>Email (нельзя изменить)</label>
                <input type="email" value={user.email} disabled />
              </div>
              <div className={styles.field}>
                <label>Полное имя</label>
                <input type="text" value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} required />
              </div>
              <div className={styles.field}>
                <label>Телефон</label>
                <input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
              </div>
              <button type="submit" className={styles.saveBtn}>Сохранить изменения</button>
              {updateStatus === 'success' && <p className={styles.successMsg}>Профиль обновлен</p>}
              {updateStatus === 'error' && <p className={styles.errorMsg}>Ошибка обновления</p>}
            </form>
          </div>
        );

      case 'purchases':
        // ТОЛЬКО ДАННЫЕ С СЕРВЕРА
        const sortedPurchases = [...purchases].sort(
          (a, b) => new Date(b.purchase_date) - new Date(a.purchase_date)
        );
        return sortedPurchases.length ? (
          <div className={styles.cardsGrid}>
            {sortedPurchases.map((p, idx) => (
              <motion.div key={idx} className={`${styles.card} ${styles.receiptCard}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className={styles.receiptHeader}>
                  <h4>Luxury Dealer</h4>
                  <span>Чек #{idx + 1}</span>
                </div>
                <div className={styles.receiptBody}>
                  <div className={styles.receiptRow}><span>Автомобиль</span><strong>{p.brand} {p.model}</strong></div>
                  <div className={styles.receiptRow}><span>Год</span><strong>{p.year}</strong></div>
                  <div className={styles.receiptRow}><span>Цена</span><strong>{p.price?.toLocaleString()} ₽</strong></div>
                  <div className={styles.receiptRow}><span>Дата</span><strong>{new Date(p.purchase_date).toLocaleString()}</strong></div>
                  {p.paymentMethod && <div className={styles.receiptRow}><span>Оплата</span><strong>{p.paymentMethod === 'card' ? 'Карта' : p.paymentMethod === 'cash' ? 'Наличные' : 'Кредит'}</strong></div>}
                </div>
                <button className={styles.printBtn} onClick={() => printSingleReceipt(p)}>🖨 Распечатать</button>
              </motion.div>
            ))}
          </div>
        ) : <p className={styles.empty}>У вас ещё нет покупок.</p>;

      case 'favorites':
        return favorites.length ? (
          <div className={styles.favoritesGrid}>
            {favorites.map(car => (
              <motion.div key={car.id} className={styles.favCard} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <img src={getImageUrl(car.image_url || '/images/default-car.jpg')} alt={car.model} className={styles.favImage} />
                <div className={styles.favInfo}>
                  <Link to={`/cars/${car.id}`} className={styles.favLink}>
                    <strong>{car.brand} {car.model}</strong> ({car.year})
                  </Link>
                  <span className={styles.price}>{car.price.toLocaleString()} ₽</span>
                  <button className={styles.removeFav} onClick={() => removeFavorite(car.id)}>Убрать из избранного</button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : <p className={styles.empty}>Нет избранных автомобилей.</p>;

      case 'compare':
        return <ComparePage />;

      case 'testdrives':
        return testDrives.length ? (
          <div className={styles.cardsGrid}>
            {testDrives.map((td) => (
              <div key={td.id} className={styles.card}>
                <div className={styles.cardHeader}>Заявка #{td.id}</div>
                <div className={styles.cardBody}>
                  <span>Авто ID: {td.car_id}</span>
                  <span>Дата: {new Date(td.preferred_date).toLocaleString()}</span>
                  <span className={styles.status}>Статус: {
                    td.status === 'pending' ? 'Ожидает' :
                    td.status === 'approved' ? 'Одобрена' :
                    td.status === 'rejected' ? 'Отклонена' :
                    td.status
                  }</span>
                </div>
              </div>
            ))}
          </div>
        ) : <p className={styles.empty}>Нет заявок на тест-драйв.</p>;

      case 'loans':
        return loans.length ? (
          <div className={styles.cardsGrid}>
            {loans.map((loan) => (
              <div key={loan.id} className={styles.card}>
                <div className={styles.cardHeader}>Кредитная заявка</div>
                <div className={styles.cardBody}>
                  <span>Сумма: {loan.amount?.toLocaleString()} ₽</span>
                  <span>Срок: {loan.term_months} мес.</span>
                  <span>Платёж: {loan.monthly_payment?.toLocaleString()} ₽/мес.</span>
                  <span className={`${styles.loanStatus} ${loan.status === 'approved' ? styles.approved : loan.status === 'rejected' ? styles.rejected : styles.pending}`}>
                    {loan.status === 'approved' ? 'Одобрена' : loan.status === 'rejected' ? 'Отклонена' : 'Рассчитана'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : <p className={styles.empty}>Кредитных заявок пока нет.</p>;

      case 'notifications':
        return notifications.length ? (
          <div className={styles.cardsGrid}>
            {notifications.map((n, idx) => (
              <div key={idx} className={`${styles.card} ${styles.notificationCard}`}>
                <div className={styles.cardBody}>{n.message}</div>
              </div>
            ))}
            <button className={styles.clearBtn} onClick={clearNotifications}>Очистить все</button>
          </div>
        ) : <p className={styles.empty}>Нет новых уведомлений.</p>;

      default:
        return null;
    }
  };

  if (loading) return <div className={styles.loading}>Загрузка...</div>;

  return (
    <motion.div className={styles.container} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className={styles.title}>Личный кабинет – {user.full_name}</h2>
      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className={styles.content}>
        {renderContent()}
      </div>
    </motion.div>
  );
};

export default UserDashboard;