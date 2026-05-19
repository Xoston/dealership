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
    if (compareIds.length === 0) {
      setLoading(false);
      return;
    }

    const fetchCars = async () => {
      const loaded = [];
      const invalid = [];
      for (const id of compareIds) {
        try {
          const res = await getCar(id);
          loaded.push(res.data);
        } catch { invalid.push(id); }
      }
      if (invalid.length) {
        const newList = compareIds.filter(id => !invalid.includes(id));
        localStorage.setItem('compareList', JSON.stringify(newList));
        setRemovedIds(invalid);
      }
      setCars(loaded);
      setLoading(false);
    };
    fetchCars();
  }, []);

  const clearCompare = () => {
    localStorage.removeItem('compareList');
    window.location.reload();
  };

  const removeCar = (id) => {
    const newIds = JSON.parse(localStorage.getItem('compareList') || '[]').filter(i => i !== id);
    localStorage.setItem('compareList', JSON.stringify(newIds));
    setCars(prev => prev.filter(c => c.id !== id));
  };

  if (loading) return <div className={styles.loading}>Загрузка...</div>;
  if (cars.length === 0) return <div className={styles.empty}>Нет автомобилей для сравнения. Добавьте их из каталога.</div>;

  const attributes = [
    { key: 'year', label: 'Год' },
    { key: 'price', label: 'Цена', isPrice: true },
    { key: 'body_type', label: 'Кузов', isBodyType: true },
    { key: 'restyling', label: 'Рестайлинг', isBool: true },
    { key: 'engine_volume', label: 'Объём двигателя' },
    { key: 'power', label: 'Мощность' },
    { key: 'fuel_type', label: 'Топливо', isFuel: true },
    { key: 'consumption', label: 'Расход' },
    { key: 'drive_type', label: 'Привод', isDrive: true },
    { key: 'transmission', label: 'КПП', isTransmission: true },
    { key: 'acceleration', label: '0-100 км/ч' },
    { key: 'max_speed', label: 'Макс. скорость' },
    { key: 'clearance', label: 'Клиренс' },
    { key: 'seats', label: 'Мест' },
    { key: 'description', label: 'Описание', isDesc: true },
  ];

  const getValue = (car, attr) => {
    if (attr.isPrice) return `${car.price?.toLocaleString()} ₽`;
    if (attr.isBool) return car.restyling ? 'Да' : 'Нет';
    if (attr.isBodyType) {
      const types = { sedan: 'Седан', suv: 'Внедорожник', coupe: 'Купе', cabriolet: 'Кабриолет', wagon: 'Универсал', pickup: 'Пикап', limousine: 'Лимузин', hatchback: 'Хэтчбек' };
      return types[car.body_type] || car.body_type;
    }
    if (attr.isFuel) return { petrol: 'Бензин', diesel: 'Дизель', hybrid: 'Гибрид', electric: 'Электро' }[car.fuel_type] || car.fuel_type || '—';
    if (attr.isDrive) return { FWD: 'Передний', RWD: 'Задний', AWD: 'Полный' }[car.drive_type] || car.drive_type || '—';
    if (attr.isTransmission) return { manual: 'Механика', automatic: 'Автомат', robot: 'Робот', variator: 'Вариатор' }[car.transmission] || car.transmission || '—';
    return car[attr.key] || '—';
  };

  const isDifferent = (key) => {
    const vals = cars.map(car => String(getValue(car, attributes.find(a => a.key === key))));
    return new Set(vals).size > 1;
  };

  return (
    <motion.div className={styles.page} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {removedIds.length > 0 && (
        <div className={styles.warning}>Некоторые автомобили были удалены из каталога и исключены из сравнения.</div>
      )}
      <div className={styles.header}>
        <h1 className={styles.title}>Сравнение автомобилей</h1>
        <button className={styles.clearBtn} onClick={clearCompare}>Очистить всё</button>
      </div>

      <div className={styles.cardsContainer}>
        {cars.map(car => (
          <motion.div key={car.id} className={styles.carCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className={styles.cardHeader}>
              <button className={styles.removeCarBtn} onClick={() => removeCar(car.id)}>✕</button>
            </div>
            <img src={getImageUrl(car.image_url)} alt={car.model} className={styles.carImage} />
            <h3 className={styles.carName}>{car.brand} {car.model}</h3>

            <div className={styles.attributes}>
              {attributes.map(attr => {
                const value = getValue(car, attr);
                const diff = isDifferent(attr.key);
                return (
                  <div key={attr.key} className={`${styles.attrRow} ${diff ? styles.different : ''}`}>
                    <span className={styles.attrLabel}>{attr.label}</span>
                    <span className={styles.attrValue}>
                      {attr.isDesc ? (
                        <>
                          <span className={`${styles.descText} ${expandedDesc === car.id ? styles.expanded : ''}`}>
                            {value}
                          </span>
                          {value.length > 60 && (
                            <button
                              className={styles.moreBtn}
                              onClick={() => setExpandedDesc(expandedDesc === car.id ? null : car.id)}
                            >
                              {expandedDesc === car.id ? 'Свернуть' : 'Ещё'}
                            </button>
                          )}
                        </>
                      ) : value}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ComparePage;