import React, { useEffect, useState } from 'react';
import { getCar } from '../services/carService';
import { getImageUrl } from '../services/api';
import { motion } from 'framer-motion';
import styles from './ComparePage.module.css';

const ComparePage = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removedIds, setRemovedIds] = useState([]);
  const [expandedDesc, setExpandedDesc] = useState(null);

  useEffect(() => {
    const compareIds = JSON.parse(localStorage.getItem('compareList') || '[]');
    if (compareIds.length === 0) { setLoading(false); return; }
    const fetchCars = async () => {
      const loaded = [], invalid = [];
      for (const id of compareIds) {
        try { const res = await getCar(id); loaded.push(res.data); }
        catch { invalid.push(id); }
      }
      if (invalid.length) {
        localStorage.setItem('compareList', JSON.stringify(compareIds.filter(id => !invalid.includes(id))));
        setRemovedIds(invalid);
      }
      setCars(loaded);
      setLoading(false);
    };
    fetchCars();
  }, []);

  const clearCompare = () => { localStorage.removeItem('compareList'); window.location.reload(); };
  const removeCar = (id) => {
    const newIds = JSON.parse(localStorage.getItem('compareList') || '[]').filter(i => i !== id);
    localStorage.setItem('compareList', JSON.stringify(newIds));
    setCars(prev => prev.filter(c => c.id !== id));
  };

  if (loading) return <div className={styles.loading}>Загрузка...</div>;
  if (!cars.length) return <div className={styles.empty}>Нет автомобилей для сравнения. Добавьте их из каталога.</div>;

  const fmt = {
    price: v => v ? `${v.toLocaleString()} ₽` : '—',
    bool: v => v === true ? 'Да' : v === false ? 'Нет' : '—',
    body: v => ({sedan:'Седан',suv:'Внедорожник',coupe:'Купе',cabriolet:'Кабриолет',wagon:'Универсал',pickup:'Пикап',limousine:'Лимузин',hatchback:'Хэтчбек'}[v] || v || '—'),
    fuel: v => ({petrol:'Бензин',diesel:'Дизель',hybrid:'Гибрид',electric:'Электро'}[v] || v || '—'),
    drive: v => ({FWD:'Передний',RWD:'Задний',AWD:'Полный'}[v] || v || '—'),
    trans: v => ({manual:'Механика',automatic:'Автомат',robot:'Робот',variator:'Вариатор'}[v] || v || '—'),
  };
  const getVal = (car, key, f) => f ? f(car[key]) : (car[key] !== null && car[key] !== undefined && car[key] !== '' ? String(car[key]) : '—');
  const isDiff = key => new Set(cars.map(c => getVal(c, key))).size > 1;

  const groups = [
    {
      title: 'Основные',
      fields: [
        { key: 'year', label: 'Год' },
        { key: 'price', label: 'Цена', f: fmt.price },
        { key: 'body_type', label: 'Кузов', f: fmt.body },
        { key: 'restyling', label: 'Рестайлинг', f: fmt.bool },
      ]
    },
    {
      title: 'Двигатель и топливо',
      fields: [
        { key: 'engine_volume', label: 'Объём двигателя, л' },
        { key: 'power', label: 'Мощность, л.с.' },
        { key: 'fuel_type', label: 'Топливо', f: fmt.fuel },
        { key: 'consumption', label: 'Расход, л/100км' },
      ]
    },
    {
      title: 'Трансмиссия и динамика',
      fields: [
        { key: 'drive_type', label: 'Привод', f: fmt.drive },
        { key: 'transmission', label: 'КПП', f: fmt.trans },
        { key: 'acceleration', label: '0-100 км/ч, с' },
        { key: 'max_speed', label: 'Макс. скорость, км/ч' },
      ]
    },
    {
      title: 'Размеры',
      fields: [
        { key: 'clearance', label: 'Клиренс, мм' },
        { key: 'seats', label: 'Мест' },
      ]
    }
  ];

  const groupHasData = (group) => cars.some(car => group.fields.some(f => {
    const v = car[f.key];
    return v !== null && v !== undefined && v !== '';
  }));

  return (
    <motion.div className={styles.page} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {removedIds.length > 0 && <div className={styles.warning}>Некоторые автомобили удалены из каталога.</div>}
      <div className={styles.header}>
        <h1 className={styles.title}>Сравнение автомобилей</h1>
        <button className={styles.clearBtn} onClick={clearCompare}>Очистить всё</button>
      </div>

      <div className={styles.cardsContainer}>
        {cars.map(car => (
          <div key={car.id} className={styles.carCard}>
            <div className={styles.cardHeader}>
              <button className={styles.removeCarBtn} onClick={() => removeCar(car.id)}>✕</button>
            </div>
            <img src={getImageUrl(car.image_url)} alt={car.model} className={styles.carImage} loading="lazy" />
            <h3 className={styles.carName}>{car.brand} {car.model}</h3>

            {groups.map(group => groupHasData(group) && (
              <div key={group.title} className={styles.group}>
                <h4 className={styles.groupTitle}>{group.title}</h4>
                {group.fields.map(({key, label, f}) => {
                  const value = getVal(car, key, f);
                  const diff = isDiff(key);
                  return (
                    <div key={key} className={`${styles.field} ${diff ? styles.diffField : ''}`}>
                      <span className={styles.fieldLabel}>{label}</span>
                      <span className={styles.fieldValue}>{value}</span>
                    </div>
                  );
                })}
              </div>
            ))}

            {car.description && (
              <div className={styles.group}>
                <h4 className={styles.groupTitle}>Описание</h4>
                <div className={styles.descriptionBox}>
                  <span className={`${styles.descText} ${expandedDesc === car.id ? styles.expanded : ''}`}>
                    {car.description}
                  </span>
                  {car.description.length > 80 && (
                    <button className={styles.moreBtn} onClick={() => setExpandedDesc(expandedDesc === car.id ? null : car.id)}>
                      {expandedDesc === car.id ? 'Свернуть' : 'Ещё'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default ComparePage;