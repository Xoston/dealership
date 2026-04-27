import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { motion } from 'framer-motion';
import styles from './AdminPanel.module.css';

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [cars, setCars] = useState([]);
  const [testDrives, setTestDrives] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, carsRes, tdRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/cars/'),
        api.get('/testdrives/all'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setCars(carsRes.data);
      setTestDrives(tdRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Удалить пользователя?')) {
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u.id !== userId));
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    await api.put(`/admin/users/${userId}/role`, { role: newRole });
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const handleDeleteCar = async (carId) => {
    if (window.confirm('Удалить автомобиль?')) {
      await api.delete(`/cars/${carId}`);
      setCars(cars.filter(c => c.id !== carId));
    }
  };

  if (loading) return <div className={styles.loading}>Загрузка...</div>;

  return (
    <motion.div className={styles.container} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className={styles.title}>Админ-панель</h2>
      <div className={styles.tabs}>
        {['dashboard', 'users', 'cars', 'testdrives'].map(tab => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'testdrives' ? 'Заявки' : tab === 'cars' ? 'Автомобили' : tab === 'users' ? 'Пользователи' : 'Дашборд'}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === 'dashboard' && stats && (
          <div className={styles.dashboard}>
            <div className={styles.statCard}>
              <h3>Пользователи</h3>
              <p>{stats.total_users}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Автомобили</h3>
              <p>{stats.total_cars}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Заявки на тест-драйв</h3>
              <p>{stats.total_testdrives}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Покупки</h3>
              <p>{stats.total_purchases}</p>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Имя</th>
                  <th>Роль</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.email}</td>
                    <td>{u.full_name}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={u.id === user.id}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        disabled={u.id === user.id || u.role === 'admin'}
                        className={styles.deleteBtn}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'cars' && (
          <div>
            <button className={styles.addBtn} onClick={() => {/* позже можно модалку добавления */}}>Добавить автомобиль</button>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Марка</th>
                  <th>Модель</th>
                  <th>Цена</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {cars.map(car => (
                  <tr key={car.id}>
                    <td>{car.id}</td>
                    <td>{car.brand}</td>
                    <td>{car.model}</td>
                    <td>{car.price.toLocaleString()} ₽</td>
                    <td>
                      <button className={styles.deleteBtn} onClick={() => handleDeleteCar(car.id)}>Удалить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'testdrives' && (
          <div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Пользователь</th>
                  <th>Авто ID</th>
                  <th>Дата</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {testDrives.map(td => (
                  <tr key={td.id}>
                    <td>{td.id}</td>
                    <td>{td.user_id}</td>
                    <td>{td.car_id}</td>
                    <td>{new Date(td.preferred_date).toLocaleString()}</td>
                    <td>{td.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminPanel;