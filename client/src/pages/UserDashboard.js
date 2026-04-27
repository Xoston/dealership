import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { motion } from 'framer-motion';
import styles from './UserDashboard.module.css';

const UserDashboard = () => {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [purchases, setPurchases] = useState([]);
  const [testDrives, setTestDrives] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
  });
  const [updateStatus, setUpdateStatus] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, tRes, lRes] = await Promise.all([
          api.get('/purchases/my'),
          api.get('/testdrives/my'),
          api.get('/loans/my'),
        ]);
        setPurchases(pRes.data);
        setTestDrives(tRes.data);
        setLoans(lRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

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

  const tabs = [
    { key: 'profile', label: 'Профиль' },
    { key: 'purchases', label: 'Мои покупки' },
    { key: 'testdrives', label: 'Тест-драйвы' },
    { key: 'loans', label: 'Кредиты' },
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
                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.field}>
                <label>Телефон</label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>
              <button type="submit" className={styles.saveBtn}>Сохранить изменения</button>
              {updateStatus === 'success' && <p className={styles.successMsg}>Профиль обновлен</p>}
              {updateStatus === 'error' && <p className={styles.errorMsg}>Ошибка обновления</p>}
            </form>
          </div>
        );
      case 'purchases':
        return purchases.length ? (
          <div className={styles.cardsGrid}>
            {purchases.map((p, idx) => (
              <div key={idx} className={styles.card}>
                <div className={styles.cardHeader}>
                  <strong>{p.brand} {p.model}</strong> ({p.year})
                </div>
                <div className={styles.cardBody}>
                  <span>Дата: {new Date(p.purchase_date).toLocaleDateString()}</span>
                  <span className={styles.price}>{p.price.toLocaleString()} ₽</span>
                </div>
              </div>
            ))}
          </div>
        ) : <p className={styles.empty}>У вас ещё нет покупок.</p>;
      case 'testdrives':
        return testDrives.length ? (
          <div className={styles.cardsGrid}>
            {testDrives.map((td) => (
              <div key={td.id} className={styles.card}>
                <div className={styles.cardHeader}>Заявка #{td.id}</div>
                <div className={styles.cardBody}>
                  <span>Авто ID: {td.car_id}</span>
                  <span>Дата: {new Date(td.preferred_date).toLocaleString()}</span>
                  <span className={styles.status}>Статус: {td.status}</span>
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
                  <span>Сумма: {loan.amount.toLocaleString()} ₽</span>
                  <span>Срок: {loan.term_months} мес.</span>
                  <span>Платёж: {loan.monthly_payment} ₽/мес.</span>
                  <span>{loan.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : <p className={styles.empty}>Кредитных заявок пока нет.</p>;
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