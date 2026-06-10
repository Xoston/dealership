import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCars } from '../services/carService';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getImageUrl } from '../services/api';
import styles from './CatalogPage.module.css';

/* ================= ПОЛНЫЙ СПИСОК МАРОК И МОДЕЛЕЙ ================= */
const brandModels = {
  "BMW": ["1 Series", "2 Series Gran Coupe", "2 Series Coupe", "3 Series Sedan", "3 Series Touring",
    "4 Series Gran Coupe", "4 Series Coupe", "5 Series Sedan", "5 Series Touring",
    "6 Series Gran Coupe", "7 Series", "8 Series Gran Coupe", "8 Series Coupe",
    "X1", "X2", "X3", "X4", "X5", "X6", "X7", "XM",
    "M2 Coupe", "M3 Sedan", "M3 Touring", "M4 Coupe", "M5 Sedan", "M8 Gran Coupe",
    "Z4 Roadster", "i4 Gran Coupe", "i5 Sedan", "i7 Sedan", "iX SUV"
  ],
  "Mercedes-Benz": ["A-Class Hatchback", "A-Class Sedan", "B-Class", "C-Class Sedan", "C-Class Estate",
    "E-Class Sedan", "E-Class Estate", "S-Class Sedan", "S-Class Maybach",
    "CLA Coupe", "CLA Shooting Brake", "CLS Coupe", "GLA SUV", "GLB SUV",
    "GLC SUV", "GLC Coupe", "GLE SUV", "GLE Coupe", "GLS SUV",
    "G-Class SUV", "EQS Sedan", "EQS SUV", "EQE Sedan", "EQE SUV",
    "SL Roadster", "AMG GT Coupe", "AMG GT 4-Door Coupe"
  ],
  "Audi": ["A1 Sportback", "A3 Sportback", "A3 Sedan", "A4 Sedan", "A4 Avant",
    "A5 Sportback", "A5 Coupe", "A6 Sedan", "A6 Avant", "A7 Sportback",
    "A8 Sedan", "Q2", "Q3", "Q3 Sportback", "Q5", "Q5 Sportback",
    "Q7", "Q8", "e-tron", "e-tron Sportback", "e-tron GT", "R8 Coupe", "TT Coupe"
  ],
  "Porsche": ["718 Cayman", "718 Boxster", "911 Carrera", "911 Carrera S", "911 Turbo",
    "911 Turbo S", "911 GT3", "911 GT3 RS", "Taycan", "Taycan Cross Turismo",
    "Panamera", "Panamera Sport Turismo", "Cayenne", "Cayenne Coupe", "Macan", "Macan GTS", "Macan S", "Macan Turbo"
  ],
  "Lexus": ["IS 300", "ES 250", "ES 350", "LS 500", "LC 500", "RC F", "UX 200", "NX 350", "RX 350", "RX 500h", "GX 460", "LX 600"],
  "Bentley": ["Bentayga", "Bentayga EWB", "Continental GT", "Continental GTC", "Flying Spur"],
  "Rolls-Royce": ["Ghost", "Ghost Extended", "Phantom", "Phantom Extended", "Cullinan", "Wraith", "Dawn"],
  "Lamborghini": ["Huracán EVO", "Huracán STO", "Aventador SVJ", "Urus", "Revuelto"],
  "Ferrari": ["Roma", "Portofino M", "SF90 Stradale", "296 GTB", "812 Superfast", "F8 Tributo"],
  "McLaren": ["GT", "720S", "765LT", "Artura"],
  "Land Rover": ["Range Rover", "Range Rover Sport", "Range Rover Velar", "Range Rover Evoque", "Discovery", "Discovery Sport", "Defender 90", "Defender 110"],
  "Jaguar": ["XE", "XF", "F-Type Coupe", "F-Type Convertible", "E-Pace", "F-Pace", "I-Pace"],
  "Maserati": ["Ghibli", "Quattroporte", "Levante", "MC20", "Grecale"],
  "Aston Martin": ["Vantage", "Vantage Roadster", "DB11", "DBX", "DBS Superleggera"],
  "Cadillac": ["CT4", "CT5", "Escalade", "XT5", "XT6"],
  "Infiniti": ["Q50", "Q60", "QX50", "QX55", "QX60", "QX80"],
  "Genesis": ["G70", "G80", "G90", "GV70", "GV80"],
  "Bugatti": ["Chiron", "Chiron Super Sport", "Divo", "Centodieci", "Mistral"],
  "Koenigsegg": ["Jesko", "Gemera", "Regera", "CC850"],
  "Pagani": ["Huayra", "Huayra BC", "Utopia", "Zonda R"],
  "Alfa Romeo": ["Giulia", "Giulia Quadrifoglio", "Stelvio", "Tonale"],
  "Lotus": ["Emira", "Evija", "Eletre"],
  "Rimac": ["Nevera"],
  "Polestar": ["Polestar 1", "Polestar 2", "Polestar 3", "Polestar 4"],
  "Lucid": ["Air", "Air Grand Touring", "Gravity"]
};

const bodyTypesRussian = {
  "sedan": "Седан", "coupe": "Купе", "cabriolet": "Кабриолет", "wagon": "Универсал",
  "suv": "Внедорожник", "pickup": "Пикап", "limousine": "Лимузин", "hatchback": "Хэтчбек",
};

const ITEMS_PER_PAGE = 12;

const fuelTypes = [
  { value: '', label: 'Любое' },
  { value: 'petrol', label: 'Бензин' },
  { value: 'diesel', label: 'Дизель' },
  { value: 'hybrid', label: 'Гибрид' },
  { value: 'electric', label: 'Электро' },
];

const driveTypes = [
  { value: '', label: 'Любой' },
  { value: 'FWD', label: 'Передний' },
  { value: 'RWD', label: 'Задний' },
  { value: 'AWD', label: 'Полный' },
];

const transmissions = [
  { value: '', label: 'Любая' },
  { value: 'manual', label: 'Механика' },
  { value: 'automatic', label: 'Автомат' },
  { value: 'robot', label: 'Робот' },
  { value: 'variator', label: 'Вариатор' },
];

const CatalogPage = () => {
  const { user } = useAuth(); // получаем текущего пользователя

  // Формируем персональный ключ для избранного
  const favKey = user?.id ? `favorites_${user.id}` : 'favorites';

  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    brand: '', model: '', min_price: '', max_price: '',
    year_from: '', year_to: '', body_type: '', restyling: '',
  });
  const [techFilters, setTechFilters] = useState({
    engine_volume_min: '', engine_volume_max: '',
    power_min: '', power_max: '',
    fuel_type: '',
    drive_type: '',
    transmission: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [compareList, setCompareList] = useState(JSON.parse(localStorage.getItem('compareList') || '[]'));
  const [favorites, setFavorites] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('');
  const [sortDir, setSortDir] = useState('asc');

  // При монтировании или смене пользователя загружаем его избранное
  useEffect(() => {
    setFavorites(JSON.parse(localStorage.getItem(favKey) || '[]'));
  }, [user, favKey]);

  const resetAll = () => {
    setFilters({
      brand: '', model: '', min_price: '', max_price: '',
      year_from: '', year_to: '', body_type: '', restyling: '',
    });
    setTechFilters({
      engine_volume_min: '', engine_volume_max: '',
      power_min: '', power_max: '',
      fuel_type: '',
      drive_type: '',
      transmission: '',
    });
    setSearchQuery('');
    setSortBy('');
    setSortDir('asc');
  };

  const fetchCars = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params[key] = value;
        }
      });
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const res = await getCars(params);
      setCars(res.data);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery]);

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  const filteredByTech = useMemo(() => {
    return cars.filter(car => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches = (
          (car.brand?.toLowerCase().includes(q)) ||
          (car.model?.toLowerCase().includes(q)) ||
          (String(car.year).includes(q))
        );
        if (!matches) return false;
      }
      if (techFilters.engine_volume_min && (car.engine_volume || 0) < parseFloat(techFilters.engine_volume_min)) return false;
      if (techFilters.engine_volume_max && (car.engine_volume || 0) > parseFloat(techFilters.engine_volume_max)) return false;
      if (techFilters.power_min && (car.power || 0) < parseInt(techFilters.power_min)) return false;
      if (techFilters.power_max && (car.power || 0) > parseInt(techFilters.power_max)) return false;
      if (techFilters.fuel_type && car.fuel_type !== techFilters.fuel_type) return false;
      if (techFilters.drive_type && car.drive_type !== techFilters.drive_type) return false;
      if (techFilters.transmission && car.transmission !== techFilters.transmission) return false;
      return true;
    });
  }, [cars, techFilters, searchQuery]);

  const sortedCars = useMemo(() => {
    if (!sortBy) return filteredByTech;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filteredByTech].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return -1 * dir;
      if (valA > valB) return 1 * dir;
      return 0;
    });
  }, [filteredByTech, sortBy, sortDir]);

  const totalPages = Math.ceil(sortedCars.length / ITEMS_PER_PAGE);
  const paginatedCars = sortedCars.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [sortedCars, currentPage, totalPages]);

  const toggleCompare = (car) => {
    let newList;
    const isAlreadyCompared = compareList.some(item => item.id === car.id);
    if (isAlreadyCompared) {
      newList = compareList.filter(item => item.id !== car.id);
    } else {
      if (compareList.length >= 3) {
        alert('Максимум 3 автомобиля для сравнения');
        return;
      }
      newList = [...compareList, car];
    }
    setCompareList(newList);
    localStorage.setItem('compareList', JSON.stringify(newList));
  };

  // Избранное теперь сохраняется в персональный ключ
  const toggleFavorite = (car) => {
    let newFav;
    const isAlreadyFavorite = favorites.some(item => item.id === car.id);
    if (isAlreadyFavorite) {
      newFav = favorites.filter(item => item.id !== car.id);
    } else {
      newFav = [...favorites, car];
    }
    setFavorites(newFav);
    localStorage.setItem(favKey, JSON.stringify(newFav));
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleTechFilterChange = (field, value) => {
    setTechFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    fetchCars();
    setShowFilters(false);
  };

  const resetFilters = () => {
    setFilters({
      brand: '', model: '', min_price: '', max_price: '',
      year_from: '', year_to: '', body_type: '', restyling: '',
    });
    setTechFilters({
      engine_volume_min: '', engine_volume_max: '',
      power_min: '', power_max: '',
      fuel_type: '',
      drive_type: '',
      transmission: '',
    });
    setSearchQuery('');
    setSortBy('');
    setSortDir('asc');
  };

  const removeFilter = (key) => {
    handleFilterChange(key, '');
    if (key === 'brand') handleFilterChange('model', '');
  };

  const availableModels = filters.brand ? (brandModels[filters.brand] || []) : [];

  const activeFilters = [];
  if (filters.brand) activeFilters.push({ key: 'brand', label: `Марка: ${filters.brand}` });
  if (filters.model) activeFilters.push({ key: 'model', label: `Модель: ${filters.model}` });
  if (filters.min_price) activeFilters.push({ key: 'min_price', label: `Цена от: ${parseInt(filters.min_price).toLocaleString()} ₽` });
  if (filters.max_price) activeFilters.push({ key: 'max_price', label: `Цена до: ${parseInt(filters.max_price).toLocaleString()} ₽` });
  if (filters.year_from) activeFilters.push({ key: 'year_from', label: `Год от: ${filters.year_from}` });
  if (filters.year_to) activeFilters.push({ key: 'year_to', label: `Год до: ${filters.year_to}` });
  if (filters.body_type) activeFilters.push({ key: 'body_type', label: `Кузов: ${bodyTypesRussian[filters.body_type] || filters.body_type}` });
  if (filters.restyling) activeFilters.push({ key: 'restyling', label: `Рестайлинг: ${filters.restyling === 'true' ? 'Да' : 'Нет'}` });

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.page}>
      <h1 className={styles.title}>Каталог</h1>

      <div className={styles.searchPanel}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Поиск по марке, модели или году..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchCars()}
            className={styles.searchInput}
          />
          <button className={styles.filterBtn} onClick={() => setShowFilters(true)}>
            Фильтры
          </button>
        </div>

        {activeFilters.length > 0 && (
          <div className={styles.chips}>
            {activeFilters.map(({ key, label }) => (
              <span key={key} className={styles.chip}>
                {label}
                <button onClick={() => removeFilter(key)} className={styles.chipClose}>×</button>
              </span>
            ))}
            <button onClick={resetFilters} className={styles.clearAll}>Сбросить всё</button>
          </div>
        )}
      </div>

      <div className={styles.sortPanel}>
        <span className={styles.sortLabel}>Сортировать:</span>
        <button
          className={`${styles.sortBtn} ${sortBy === 'price' ? styles.activeSort : ''}`}
          onClick={() => handleSort('price')}
        >
          По цене {sortBy === 'price' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
        </button>
        <button
          className={`${styles.sortBtn} ${sortBy === 'year' ? styles.activeSort : ''}`}
          onClick={() => handleSort('year')}
        >
          По году {sortBy === 'year' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
        </button>
        <button
          className={`${styles.sortBtn} ${sortBy === 'power' ? styles.activeSort : ''}`}
          onClick={() => handleSort('power')}
        >
          По мощности {sortBy === 'power' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
        </button>
        <button
          className={`${styles.sortBtn} ${sortBy === 'brand' ? styles.activeSort : ''}`}
          onClick={() => handleSort('brand')}
        >
          По марке {sortBy === 'brand' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
        </button>
        <button
          className={`${styles.sortBtn} ${sortBy === 'model' ? styles.activeSort : ''}`}
          onClick={() => handleSort('model')}
        >
          По модели {sortBy === 'model' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
        </button>
        {(sortBy || techFilters.engine_volume_min || techFilters.engine_volume_max) && (
          <button className={styles.resetSortBtn} onClick={() => { setSortBy(''); setSortDir('asc'); }}>
            Сбросить сортировку
          </button>
        )}
      </div>

      {loading ? (
        <p className={styles.loading}>Загрузка...</p>
      ) : sortedCars.length === 0 ? (
        <p className={styles.noResults}>По вашему запросу ничего не найдено</p>
      ) : (
        <>
          <div className={styles.grid}>
            {paginatedCars.map((car) => (
              <motion.div
                key={car.id}
                whileHover={{ scale: 1.03 }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={styles.cardWrapper}
              >
                <Link to={`/cars/${car.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className={styles.card}>
                    <img
                      src={getImageUrl(car.image_url || '/images/default-car.jpg')}
                      alt={car.model}
                      className={styles.cardImage}
                      loading="lazy"
                    />
                    <div className={styles.cardBody}>
                      <h3>{car.brand} {car.model}</h3>
                      <p className={styles.carYear}>{car.year} год</p>
                      <p className={styles.carPrice}>{car.price.toLocaleString()} ₽</p>
                    </div>
                  </div>
                </Link>

                <button
                  className={`${styles.iconBtn} ${styles.favBtn} ${favorites.some(item => item.id === car.id) ? styles.activeFav : ''}`}
                  onClick={(e) => { e.preventDefault(); toggleFavorite(car); }}
                  title={favorites.some(item => item.id === car.id) ? 'Убрать из избранного' : 'Добавить в избранное'}
                >
                  🤍
                </button>
              </motion.div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                ‹
              </button>
              {getPageNumbers().map((page, idx) => (
                <button
                  key={idx}
                  className={`${styles.pageBtn} ${page === currentPage ? styles.activePage : ''} ${page === '...' ? styles.dots : ''}`}
                  onClick={() => typeof page === 'number' && setCurrentPage(page)}
                  disabled={page === '...'}
                >
                  {page}
                </button>
              ))}
              <button
                className={styles.pageBtn}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                ›
              </button>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {showFilters && (
          <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFilters(false)}
          >
            <motion.div
              className={styles.modal}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3>Расширенные фильтры</h3>
                <button className={styles.closeBtn} onClick={() => setShowFilters(false)}>✕</button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.filterRow}>
                  <div className={styles.filterGroup}>
                    <label>Марка</label>
                    <select value={filters.brand} onChange={(e) => {
                      handleFilterChange('brand', e.target.value);
                      handleFilterChange('model', '');
                    }}>
                      <option value="">Все марки</option>
                      {Object.keys(brandModels).map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.filterGroup}>
                    <label>Модель</label>
                    <select value={filters.model} onChange={(e) => handleFilterChange('model', e.target.value)} disabled={!filters.brand}>
                      <option value="">Все модели</option>
                      {availableModels.map(model => (
                        <option key={model} value={model}>{model}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.filterRow}>
                  <div className={styles.filterGroup}>
                    <label>Цена</label>
                    <div className={styles.twoInputs}>
                      <input type="number" placeholder="от" value={filters.min_price} onChange={(e) => handleFilterChange('min_price', e.target.value)} />
                      <input type="number" placeholder="до" value={filters.max_price} onChange={(e) => handleFilterChange('max_price', e.target.value)} />
                    </div>
                  </div>
                  <div className={styles.filterGroup}>
                    <label>Год выпуска</label>
                    <div className={styles.twoInputs}>
                      <input type="number" placeholder="от" value={filters.year_from} onChange={(e) => handleFilterChange('year_from', e.target.value)} />
                      <input type="number" placeholder="до" value={filters.year_to} onChange={(e) => handleFilterChange('year_to', e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className={styles.filterRow}>
                  <div className={styles.filterGroup}>
                    <label>Тип кузова</label>
                    <select value={filters.body_type} onChange={(e) => handleFilterChange('body_type', e.target.value)}>
                      <option value="">Все типы</option>
                      {Object.entries(bodyTypesRussian).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.filterGroup}>
                    <label>Рестайлинг</label>
                    <select value={filters.restyling} onChange={(e) => handleFilterChange('restyling', e.target.value)}>
                      <option value="">Не важно</option>
                      <option value="true">Да</option>
                      <option value="false">Нет</option>
                    </select>
                  </div>
                </div>

                <details className={styles.techDetails}>
                  <summary>Технические характеристики</summary>
                  <div className={styles.filterRow}>
                    <div className={styles.filterGroup}>
                      <label>Объём двигателя, л</label>
                      <div className={styles.twoInputs}>
                        <input type="number" placeholder="от" value={techFilters.engine_volume_min} onChange={(e) => handleTechFilterChange('engine_volume_min', e.target.value)} />
                        <input type="number" placeholder="до" value={techFilters.engine_volume_max} onChange={(e) => handleTechFilterChange('engine_volume_max', e.target.value)} />
                      </div>
                    </div>
                    <div className={styles.filterGroup}>
                      <label>Мощность, л.с.</label>
                      <div className={styles.twoInputs}>
                        <input type="number" placeholder="от" value={techFilters.power_min} onChange={(e) => handleTechFilterChange('power_min', e.target.value)} />
                        <input type="number" placeholder="до" value={techFilters.power_max} onChange={(e) => handleTechFilterChange('power_max', e.target.value)} />
                      </div>
                    </div>
                  </div>
                  <div className={styles.filterRow}>
                    <div className={styles.filterGroup}>
                      <label>Топливо</label>
                      <select value={techFilters.fuel_type} onChange={(e) => handleTechFilterChange('fuel_type', e.target.value)}>
                        {fuelTypes.map(ft => (
                          <option key={ft.value} value={ft.value}>{ft.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.filterGroup}>
                      <label>Привод</label>
                      <select value={techFilters.drive_type} onChange={(e) => handleTechFilterChange('drive_type', e.target.value)}>
                        {driveTypes.map(dt => (
                          <option key={dt.value} value={dt.value}>{dt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className={styles.filterRow}>
                    <div className={styles.filterGroup}>
                      <label>Коробка передач</label>
                      <select value={techFilters.transmission} onChange={(e) => handleTechFilterChange('transmission', e.target.value)}>
                        {transmissions.map(tr => (
                          <option key={tr.value} value={tr.value}>{tr.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.filterGroup} />
                  </div>
                </details>
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.applyBtn} onClick={applyFilters}>Применить</button>
                <button className={styles.resetBtn} onClick={resetFilters}>Сбросить</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CatalogPage;