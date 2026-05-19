import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getImageUrl } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './AdminPanel.module.css';

// Полный список марок и моделей (расширенный)
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

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [cars, setCars] = useState([]);
  const [testDrives, setTestDrives] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---------- Модальное окно (добавление / редактирование) ----------
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [carForm, setCarForm] = useState({
    brand: '', model: '', year: '', price: '', description: '', image_url: '', body_type: 'sedan', restyling: false,
    engine_volume: '', power: '', fuel_type: '', consumption: '', drive_type: '', transmission: '',
    acceleration: '', max_speed: '', clearance: '', seats: ''
  });
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // ---------- Модальное окно выбора модели ----------
  const [showModelModal, setShowModelModal] = useState(false);
  const [modelSearch, setModelSearch] = useState('');

  // ---------- Управление изображениями (галерея) ----------
  const [selectedCarId, setSelectedCarId] = useState(null);
  const [carImages, setCarImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // ================= ЗАГРУЗКА ДАННЫХ =================
  const fetchData = async () => {
    try {
      const [statsRes, usersRes, carsRes, tdRes, loansRes] = await Promise.all([
        api.get('/admin/stats'), api.get('/admin/users'), api.get('/cars/'),
        api.get('/testdrives/all'), api.get('/admin/loans')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setCars(carsRes.data);
      setTestDrives(tdRes.data);
      setLoans(loansRes.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // ================= ОТКРЫТИЕ ФОРМЫ =================
  const openAddForm = () => {
    setEditingCar(null);
    setCarForm({
      brand: '', model: '', year: '', price: '', description: '', image_url: '', body_type: 'sedan', restyling: false,
      engine_volume: '', power: '', fuel_type: '', consumption: '', drive_type: '', transmission: '',
      acceleration: '', max_speed: '', clearance: '', seats: ''
    });
    setFieldErrors({});
    setFormError('');
    setShowFormModal(true);
  };

  const openEditForm = (car) => {
    setEditingCar(car);
    setCarForm({
      brand: car.brand || '',
      model: car.model || '',
      year: car.year?.toString() || '',
      price: car.price?.toString() || '',
      description: car.description || '',
      image_url: car.image_url || '',
      body_type: car.body_type || 'sedan',
      restyling: car.restyling || false,
      engine_volume: car.engine_volume?.toString() || '',
      power: car.power?.toString() || '',
      fuel_type: car.fuel_type || '',
      consumption: car.consumption?.toString() || '',
      drive_type: car.drive_type || '',
      transmission: car.transmission || '',
      acceleration: car.acceleration?.toString() || '',
      max_speed: car.max_speed?.toString() || '',
      clearance: car.clearance?.toString() || '',
      seats: car.seats?.toString() || ''
    });
    setFieldErrors({});
    setFormError('');
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingCar(null);
  };

  // ================= ОБРАБОТЧИКИ ФОРМЫ =================
  const handleBrandChange = (e) => {
    setCarForm(prev => ({ ...prev, brand: e.target.value, model: '' }));
    setFieldErrors(prev => ({ ...prev, brand: '', model: '' }));
  };

  const selectModel = (model) => {
    setCarForm(prev => ({ ...prev, model }));
    setShowModelModal(false);
    setModelSearch('');
    setFieldErrors(prev => ({ ...prev, model: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!carForm.brand) errors.brand = 'Выберите марку';
    if (!carForm.model) errors.model = 'Выберите модель';
    const year = parseInt(carForm.year);
    if (!carForm.year || isNaN(year) || year < 1900 || year > 2030) errors.year = 'Год должен быть 1900–2030';
    const price = parseFloat(carForm.price);
    if (!carForm.price || isNaN(price) || price <= 0) errors.price = 'Цена должна быть положительной';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleMainPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/cars/upload_image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCarForm(prev => ({ ...prev, image_url: res.data.image_url }));
    } catch (err) { alert('Ошибка загрузки файла'); } finally { setUploading(false); }
  };

  // ================= ОТПРАВКА ФОРМЫ =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setFormError('');

    const payload = {
      brand: carForm.brand,
      model: carForm.model,
      year: parseInt(carForm.year),
      price: parseFloat(carForm.price),
      description: carForm.description,
      image_url: carForm.image_url,
      body_type: carForm.body_type,
      restyling: carForm.restyling,
      engine_volume: carForm.engine_volume ? parseFloat(carForm.engine_volume) : null,
      power: carForm.power ? parseInt(carForm.power) : null,
      fuel_type: carForm.fuel_type || null,
      consumption: carForm.consumption ? parseFloat(carForm.consumption) : null,
      drive_type: carForm.drive_type || null,
      transmission: carForm.transmission || null,
      acceleration: carForm.acceleration ? parseFloat(carForm.acceleration) : null,
      max_speed: carForm.max_speed ? parseInt(carForm.max_speed) : null,
      clearance: carForm.clearance ? parseInt(carForm.clearance) : null,
      seats: carForm.seats ? parseInt(carForm.seats) : null,
    };

    try {
      if (editingCar) {
        const res = await api.put(`/cars/${editingCar.id}`, payload);
        setCars(prev => prev.map(c => c.id === editingCar.id ? res.data : c));
      } else {
        const res = await api.post('/cars/', payload);
        setCars(prev => [...prev, res.data]);
      }
      closeFormModal();
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) setFormError(detail.map(e => e.msg).join('. '));
      else if (typeof detail === 'string') setFormError(detail);
      else setFormError('Ошибка сервера');
    }
  };

  // ================= ПОЛЬЗОВАТЕЛИ =================
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Удалить пользователя?')) {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };
  const handleRoleChange = async (userId, newRole) => {
    await api.put(`/admin/users/${userId}/role`, { role: newRole });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  // ================= АВТОМОБИЛИ =================
  const handleDeleteCar = async (carId) => {
    if (window.confirm('Удалить автомобиль?')) {
      await api.delete(`/cars/${carId}`);
      setCars(prev => prev.filter(c => c.id !== carId));
    }
  };

  // ---------- Галерея изображений ----------
  const openImagePanel = (carId) => {
    setSelectedCarId(carId);
    const car = cars.find(c => c.id === carId);
    setCarImages(car?.images || []);
  };

  const handleMultipleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingImages(true);
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const uploadRes = await api.post('/cars/upload_image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const imageUrl = uploadRes.data.image_url;
        const addRes = await api.post(`/cars/${selectedCarId}/images`, { image_url: imageUrl });
        setCarImages(prev => [...prev, addRes.data]);
      } catch (err) { console.error('Ошибка загрузки файла', file.name, err); }
    }
    setUploadingImages(false);
    e.target.value = '';
  };

  const handleDeleteImage = async (imageId) => {
    try {
      await api.delete(`/cars/images/${imageId}`);
      setCarImages(prev => prev.filter(img => img.id !== imageId));
    } catch (err) { alert('Ошибка удаления изображения'); }
  };

  // ================= КРЕДИТНЫЕ ЗАЯВКИ =================
  const handleLoanStatus = async (loanId, status) => {
    try {
      await api.put(`/admin/loans/${loanId}/status`, { status });
      setLoans(prev => prev.map(l => l.id === loanId ? { ...l, status } : l));
    } catch (err) { alert('Ошибка обновления статуса'); }
  };

  if (loading) return <div className={styles.loading}>Загрузка...</div>;

  const availableModels = carForm.brand ? (brandModels[carForm.brand] || []) : [];
  const filteredModels = modelSearch ? availableModels.filter(m => m.toLowerCase().includes(modelSearch.toLowerCase())) : availableModels;

  return (
    <motion.div className={styles.container} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className={styles.title}>Админ-панель</h2>
      <div className={styles.tabs}>
        {['dashboard', 'users', 'cars', 'testdrives', 'loans'].map(tab => (
          <button key={tab} className={`${styles.tab} ${activeTab === tab ? styles.active : ''}`} onClick={() => setActiveTab(tab)}>
            {tab === 'testdrives' ? 'Тест-драйвы' : tab === 'cars' ? 'Автомобили' : tab === 'users' ? 'Пользователи' : tab === 'loans' ? 'Кредиты' : 'Дашборд'}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {/* Дашборд */}
        {activeTab === 'dashboard' && stats && (
          <div className={styles.dashboard}>
            <div className={styles.statCard}><h3>Пользователи</h3><p>{stats.total_users}</p></div>
            <div className={styles.statCard}><h3>Автомобили</h3><p>{stats.total_cars}</p></div>
            <div className={styles.statCard}><h3>Заявки на тест-драйв</h3><p>{stats.total_testdrives}</p></div>
            <div className={styles.statCard}><h3>Покупки</h3><p>{stats.total_purchases}</p></div>
          </div>
        )}

        {/* Пользователи */}
        {activeTab === 'users' && (
          <div>
            <table className={styles.table}>
              <thead><tr><th>ID</th><th>Email</th><th>Имя</th><th>Роль</th><th>Действия</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td><td>{u.email}</td><td>{u.full_name}</td>
                    <td>
                      <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)} disabled={u.id === user.id}>
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td>
                      <button onClick={() => handleDeleteUser(u.id)} disabled={u.id === user.id || u.role === 'admin'} className={styles.deleteBtn}>Удалить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Автомобили */}
        {activeTab === 'cars' && (
          <div>
            <button className={styles.addBtn} onClick={openAddForm}>Добавить автомобиль</button>
            <table className={styles.table}>
              <thead><tr><th>ID</th><th>Марка</th><th>Модель</th><th>Цена</th><th>Действия</th></tr></thead>
              <tbody>
                {cars.map(car => (
                  <tr key={car.id}>
                    <td>{car.id}</td><td>{car.brand}</td><td>{car.model}</td>
                    <td>{car.price.toLocaleString()} ₽</td>
                    <td style={{ display: 'flex', gap: '0.3rem' }}>
                      <button className={styles.addBtn} style={{ padding: '0.4rem 0.8rem' }} onClick={() => openEditForm(car)}>Изменить</button>
                      <button className={styles.addBtn} style={{ padding: '0.4rem 0.8rem' }} onClick={() => openImagePanel(car.id)}>Фото</button>
                      <button className={styles.deleteBtn} onClick={() => handleDeleteCar(car.id)}>Удалить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {selectedCarId && (
              <div className={styles.imagePanel}>
                <h3>Управление изображениями (авто ID: {selectedCarId})</h3>
                <div className={styles.imageControls}>
                  <label className={styles.uploadLabel}>
                    <input type="file" multiple accept="image/*" onChange={handleMultipleFiles} disabled={uploadingImages} />
                    {uploadingImages ? 'Загрузка...' : 'Выбрать файлы'}
                  </label>
                </div>
                <div className={styles.imageGrid}>
                  {carImages.map(img => (
                    <div key={img.id} className={styles.thumbnailContainer}>
                      <img src={getImageUrl(img.image_url)} alt="" />
                      <button className={styles.deleteThumb} onClick={() => handleDeleteImage(img.id)}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Тест-драйвы */}
        {activeTab === 'testdrives' && (
          <div>
            <table className={styles.table}>
              <thead><tr><th>ID</th><th>Пользователь</th><th>Авто ID</th><th>Дата</th><th>Статус</th></tr></thead>
              <tbody>
                {testDrives.map(td => (
                  <tr key={td.id}>
                    <td>{td.id}</td><td>{td.user_id}</td><td>{td.car_id}</td>
                    <td>{new Date(td.preferred_date).toLocaleString()}</td><td>{td.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Кредитные заявки */}
        {activeTab === 'loans' && (
          <div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th><th>Пользователь</th><th>Автомобиль</th><th>Сумма</th><th>Срок</th><th>Платёж</th><th>Статус</th><th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {loans.map(loan => (
                  <tr key={loan.id}>
                    <td>{loan.id}</td><td>{loan.user_email}</td><td>{loan.brand} {loan.model}</td>
                    <td>{loan.amount?.toLocaleString()} ₽</td><td>{loan.term_months} мес.</td><td>{loan.monthly_payment?.toLocaleString()} ₽</td>
                    <td>
                      <span className={`${styles.status} ${loan.status === 'approved' ? styles.approved : loan.status === 'rejected' ? styles.rejected : styles.pending}`}>
                        {loan.status === 'approved' ? 'Одобрена' : loan.status === 'rejected' ? 'Отклонена' : 'Рассчитана'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '0.3rem' }}>
                      {loan.status === 'calculated' && (
                        <>
                          <button className={styles.approveBtn} onClick={() => handleLoanStatus(loan.id, 'approved')}>Одобрить</button>
                          <button className={styles.rejectBtn} onClick={() => handleLoanStatus(loan.id, 'rejected')}>Отклонить</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Модальное окно формы (добавление / редактирование) */}
      <AnimatePresence>
        {showFormModal && (
          <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeFormModal}>
            <motion.div className={styles.modal} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleSubmit} className={styles.addForm}>
                <div className={styles.modalHeader}>
                  <h4>{editingCar ? 'Редактировать автомобиль' : 'Новый автомобиль'}</h4>
                  <button type="button" className={styles.closeBtn} onClick={closeFormModal}>✕</button>
                </div>

                <div className={styles.modalBody}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Марка *</label>
                      <select value={carForm.brand} onChange={handleBrandChange} className={fieldErrors.brand ? styles.inputError : ''}>
                        <option value="">-- Выберите марку --</option>
                        {Object.keys(brandModels).map(brand => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                      </select>
                      {fieldErrors.brand && <span className={styles.errorMsg}>{fieldErrors.brand}</span>}
                    </div>

                    <div className={styles.formGroup}>
                      <label>Модель *</label>
                      <div className={styles.modelSelector}>
                        <input type="text" value={carForm.model} placeholder="Нажмите «Выбрать модель»" readOnly className={fieldErrors.model ? styles.inputError : ''} />
                        <button type="button" className={styles.selectModelBtn} disabled={!carForm.brand} onClick={() => setShowModelModal(true)}>Выбрать модель</button>
                      </div>
                      {fieldErrors.model && <span className={styles.errorMsg}>{fieldErrors.model}</span>}
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Год выпуска *</label>
                      <input type="number" value={carForm.year} onChange={e => setCarForm({...carForm, year: e.target.value})} placeholder="Например, 2024" className={fieldErrors.year ? styles.inputError : ''} />
                      {fieldErrors.year && <span className={styles.errorMsg}>{fieldErrors.year}</span>}
                    </div>
                    <div className={styles.formGroup}>
                      <label>Цена (₽) *</label>
                      <input type="number" value={carForm.price} onChange={e => setCarForm({...carForm, price: e.target.value})} placeholder="Например, 15000000" className={fieldErrors.price ? styles.inputError : ''} />
                      {fieldErrors.price && <span className={styles.errorMsg}>{fieldErrors.price}</span>}
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Описание</label>
                    <textarea value={carForm.description} onChange={e => setCarForm({...carForm, description: e.target.value})} rows="2" placeholder="Краткое описание" />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Тип кузова</label>
                      <select value={carForm.body_type} onChange={e => setCarForm({...carForm, body_type: e.target.value})}>
                        {Object.entries(bodyTypesRussian).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Рестайлинг</label>
                      <label className={styles.checkboxLabel}>
                        <input type="checkbox" checked={carForm.restyling} onChange={e => setCarForm({...carForm, restyling: e.target.checked})} />
                        Есть рестайлинг
                      </label>
                    </div>
                  </div>

                  {/* Технические характеристики */}
                  <details className={styles.techDetails}>
                    <summary>Технические характеристики</summary>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Объём двигателя, л</label>
                        <input type="number" step="0.1" value={carForm.engine_volume || ''} onChange={e => setCarForm({...carForm, engine_volume: e.target.value})} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Мощность, л.с.</label>
                        <input type="number" value={carForm.power || ''} onChange={e => setCarForm({...carForm, power: e.target.value})} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Топливо</label>
                        <select value={carForm.fuel_type || ''} onChange={e => setCarForm({...carForm, fuel_type: e.target.value})}>
                          <option value="">—</option>
                          <option value="petrol">Бензин</option>
                          <option value="diesel">Дизель</option>
                          <option value="hybrid">Гибрид</option>
                          <option value="electric">Электро</option>
                        </select>
                      </div>
                    </div>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Расход, л/100км</label>
                        <input type="number" step="0.1" value={carForm.consumption || ''} onChange={e => setCarForm({...carForm, consumption: e.target.value})} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Привод</label>
                        <select value={carForm.drive_type || ''} onChange={e => setCarForm({...carForm, drive_type: e.target.value})}>
                          <option value="">—</option>
                          <option value="FWD">Передний</option>
                          <option value="RWD">Задний</option>
                          <option value="AWD">Полный</option>
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label>Коробка передач</label>
                        <select value={carForm.transmission || ''} onChange={e => setCarForm({...carForm, transmission: e.target.value})}>
                          <option value="">—</option>
                          <option value="manual">Механика</option>
                          <option value="automatic">Автомат</option>
                          <option value="robot">Робот</option>
                          <option value="variator">Вариатор</option>
                        </select>
                      </div>
                    </div>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>Разгон 0-100 км/ч, с</label>
                        <input type="number" step="0.1" value={carForm.acceleration || ''} onChange={e => setCarForm({...carForm, acceleration: e.target.value})} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Макс. скорость, км/ч</label>
                        <input type="number" value={carForm.max_speed || ''} onChange={e => setCarForm({...carForm, max_speed: e.target.value})} />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Клиренс, мм</label>
                        <input type="number" value={carForm.clearance || ''} onChange={e => setCarForm({...carForm, clearance: e.target.value})} />
                      </div>
                    </div>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup} style={{ maxWidth: '150px' }}>
                        <label>Мест</label>
                        <input type="number" value={carForm.seats || ''} onChange={e => setCarForm({...carForm, seats: e.target.value})} />
                      </div>
                    </div>
                  </details>

                  {/* Основное фото */}
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Основное фото</label>
                      <input type="file" onChange={handleMainPhotoUpload} accept="image/*" />
                      {uploading && <span> Загрузка...</span>}
                    </div>
                  </div>

                  {formError && <div className={styles.serverError}>{formError}</div>}
                </div>

                <div className={styles.modalFooter}>
                  <button type="submit" className={styles.submitBtn}>{editingCar ? 'Сохранить изменения' : 'Добавить автомобиль'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модальное окно выбора модели */}
      <AnimatePresence>
        {showModelModal && (
          <motion.div className={styles.modelOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModelModal(false)}>
            <motion.div className={styles.modelModal} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modelModalHeader}>
                <h4>Выберите модель</h4>
                <button type="button" className={styles.closeBtn} onClick={() => setShowModelModal(false)}>✕</button>
              </div>
              <input type="text" placeholder="Поиск модели..." value={modelSearch} onChange={(e) => setModelSearch(e.target.value)} className={styles.modelSearchInput} autoFocus />
              <div className={styles.modelList}>
                {filteredModels.map(model => (
                  <button key={model} type="button" className={`${styles.modelItem} ${model === carForm.model ? styles.modelItemActive : ''}`} onClick={() => selectModel(model)}>{model}</button>
                ))}
                {filteredModels.length === 0 && <p className={styles.noModels}>Нет подходящих моделей</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminPanel;  