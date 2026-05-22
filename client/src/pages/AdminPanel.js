import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { getImageUrl } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './AdminPanel.module.css';

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

/* ================= ТИПЫ КУЗОВА ================= */
const bodyTypesRussian = {
  "sedan": "Седан", "coupe": "Купе", "cabriolet": "Кабриолет", "wagon": "Универсал",
  "suv": "Внедорожник", "pickup": "Пикап", "limousine": "Лимузин", "hatchback": "Хэтчбек",
};

/* ================= ДОСТУПНЫЕ РОЛИ ================= */
const availableRoles = ["user", "admin", "manager"];

/* ================= ФУНКЦИЯ АВТОЗАПОЛНЕНИЯ ХАРАКТЕРИСТИК ================= */
const getDefaultSpecs = (brand, model, bodyType, year) => {
  const specs = {
    engine_volume: 2.0, power: 200, fuel_type: "petrol", consumption: 8.0,
    drive_type: "RWD", transmission: "automatic", acceleration: 7.0,
    max_speed: 240, clearance: 140, seats: 5
  };

  if (bodyType) {
    if (bodyType === "suv" || bodyType === "pickup") {
      specs.engine_volume = 3.0; specs.power = 300; specs.consumption = 10.5;
      specs.drive_type = "AWD"; specs.clearance = 200; specs.seats = 5;
    } else if (bodyType === "coupe" || bodyType === "cabriolet") {
      specs.seats = 4; specs.acceleration = 5.0; specs.max_speed = 270; specs.clearance = 120;
    } else if (bodyType === "wagon") {
      specs.consumption = 7.5; specs.seats = 5;
    } else if (bodyType === "limousine") {
      specs.engine_volume = 4.0; specs.power = 400; specs.seats = 7; specs.clearance = 130;
    }
  }

  if (brand === "BMW" || brand === "Porsche") {
    specs.drive_type = "RWD"; specs.transmission = "automatic";
  } else if (brand === "Audi") {
    specs.drive_type = "AWD";
  } else if (brand === "Mercedes-Benz" && bodyType === "suv") {
    specs.drive_type = "AWD";
  } else if (["Lamborghini", "Ferrari", "McLaren"].includes(brand)) {
    specs.power = 600; specs.acceleration = 3.0; specs.max_speed = 330;
    specs.clearance = 110; specs.seats = 2; specs.engine_volume = 4.0; specs.fuel_type = "petrol";
  } else if (brand === "Rolls-Royce" || brand === "Bentley") {
    specs.power = 500; specs.engine_volume = 6.0; specs.clearance = 130; specs.seats = 5;
  } else if (brand === "Land Rover") {
    specs.drive_type = "AWD"; specs.clearance = 220; specs.power = 350; specs.engine_volume = 3.0;
  } else if (brand === "Bugatti") {
    specs.power = 1000; specs.engine_volume = 8.0; specs.acceleration = 2.5;
    specs.max_speed = 420; specs.clearance = 100; specs.seats = 2;
  }

  if (year) {
    const y = parseInt(year);
    if (!isNaN(y) && y >= 2020) {
      specs.power = Math.round(specs.power * 1.05);
      specs.consumption = Math.round((specs.consumption * 0.95) * 10) / 10;
      if (specs.transmission === "manual" && y >= 2022) specs.transmission = "automatic";
    }
  }

  return specs;
};

/* ================= ВАРИАНТЫ ДЛЯ ВЫПАДАЮЩИХ СПИСКОВ ================= */
const engineVolumes = [1.6, 2.0, 2.5, 3.0, 4.0, 4.4, 5.0, 6.0, 6.6];
const powers = [150, 184, 190, 204, 249, 300, 340, 367, 450, 500, 600];
const fuelTypes = ["petrol", "diesel", "hybrid", "electric"];
const driveTypes = ["FWD", "RWD", "AWD"];
const transmissions = ["manual", "automatic", "robot", "variator"];
const accelerations = [3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0];
const maxSpeeds = [200, 220, 235, 250, 270, 300, 320, 350];
const clearances = [120, 130, 140, 150, 170, 200, 214];
const seatOptions = [2, 4, 5, 7];

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [cars, setCars] = useState([]);
  const [testDrives, setTestDrives] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const [showModelModal, setShowModelModal] = useState(false);
  const [modelSearch, setModelSearch] = useState('');

  const [newPhotos, setNewPhotos] = useState([]);
  const fileInputRef = useRef(null);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, carsRes, tdRes, loansRes] = await Promise.all([
        api.get('/admin/stats'), api.get('/admin/users'), api.get('/cars/'),
        api.get('/testdrives/all'), api.get('/admin/loans')
      ]);
      setStats(statsRes.data); setUsers(usersRes.data); setCars(carsRes.data);
      setTestDrives(tdRes.data); setLoans(loansRes.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openAddForm = () => {
    setEditingCar(null);
    setCarForm({
      brand: '', model: '', year: '', price: '', description: '', image_url: '', body_type: 'sedan', restyling: false,
      engine_volume: '', power: '', fuel_type: '', consumption: '', drive_type: '', transmission: '',
      acceleration: '', max_speed: '', clearance: '', seats: ''
    });
    setFieldErrors({}); setFormError(''); setNewPhotos([]); setShowFormModal(true);
  };

  const openEditForm = (car) => {
    setEditingCar(car);
    setCarForm({
      brand: car.brand || '', model: car.model || '', year: car.year?.toString() || '',
      price: car.price?.toString() || '', description: car.description || '', image_url: car.image_url || '',
      body_type: car.body_type || 'sedan', restyling: car.restyling || false,
      engine_volume: car.engine_volume?.toString() || '', power: car.power?.toString() || '',
      fuel_type: car.fuel_type || '', consumption: car.consumption?.toString() || '',
      drive_type: car.drive_type || '', transmission: car.transmission || '',
      acceleration: car.acceleration?.toString() || '', max_speed: car.max_speed?.toString() || '',
      clearance: car.clearance?.toString() || '', seats: car.seats?.toString() || ''
    });
    setFieldErrors({}); setFormError(''); setNewPhotos([]); setShowFormModal(true);
  };

  const closeFormModal = () => { setShowFormModal(false); setEditingCar(null); setNewPhotos([]); };

  const selectBrand = (brand) => {
    setCarForm(prev => ({ ...prev, brand, model: '' }));
    setShowBrandModal(false); setBrandSearch('');
    setFieldErrors(prev => ({ ...prev, brand: '', model: '' }));
  };

  const selectModel = (model) => {
    setCarForm(prev => ({ ...prev, model }));
    setShowModelModal(false); setModelSearch('');
    setFieldErrors(prev => ({ ...prev, model: '' }));
    const brand = carForm.brand;
    if (brand) {
      const specs = getDefaultSpecs(brand, model, carForm.body_type, carForm.year);
      setCarForm(prev => ({
        ...prev,
        engine_volume: specs.engine_volume ?? '', power: specs.power ?? '',
        fuel_type: specs.fuel_type ?? '', consumption: specs.consumption ?? '',
        drive_type: specs.drive_type ?? '', transmission: specs.transmission ?? '',
        acceleration: specs.acceleration ?? '', max_speed: specs.max_speed ?? '',
        clearance: specs.clearance ?? '', seats: specs.seats ?? '',
      }));
    }
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

  const handleMultiplePhotos = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const newUrls = [];
    for (const file of files) {
      const formData = new FormData(); formData.append('file', file);
      try {
        const res = await api.post('/cars/upload_image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        newUrls.push(res.data.image_url);
      } catch (err) { console.error('Ошибка загрузки файла', file.name, err); }
    }
    if (newUrls.length > 0) {
      setNewPhotos(prev => [...prev, ...newUrls]);
      if (!carForm.image_url) setCarForm(prev => ({ ...prev, image_url: newUrls[0] }));
    }
    setUploading(false); e.target.value = '';
  };

  const removeNewPhoto = (url) => {
    const updated = newPhotos.filter(u => u !== url);
    setNewPhotos(updated);
    if (carForm.image_url === url) setCarForm(prev => ({ ...prev, image_url: updated.length > 0 ? updated[0] : '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setFormError('');
    const payload = {
      brand: carForm.brand, model: carForm.model, year: parseInt(carForm.year),
      price: parseFloat(carForm.price), description: carForm.description, image_url: carForm.image_url,
      body_type: carForm.body_type, restyling: carForm.restyling,
      engine_volume: carForm.engine_volume ? parseFloat(carForm.engine_volume) : null,
      power: carForm.power ? parseInt(carForm.power) : null,
      fuel_type: carForm.fuel_type || null, consumption: carForm.consumption ? parseFloat(carForm.consumption) : null,
      drive_type: carForm.drive_type || null, transmission: carForm.transmission || null,
      acceleration: carForm.acceleration ? parseFloat(carForm.acceleration) : null,
      max_speed: carForm.max_speed ? parseInt(carForm.max_speed) : null,
      clearance: carForm.clearance ? parseInt(carForm.clearance) : null,
      seats: carForm.seats ? parseInt(carForm.seats) : null,
    };
    try {
      if (editingCar) {
        const res = await api.put(`/cars/${editingCar.id}`, payload);
        if (newPhotos.length > 1) for (const url of newPhotos.slice(1)) await api.post(`/cars/${editingCar.id}/images`, { image_url: url });
        setCars(prev => prev.map(c => c.id === editingCar.id ? res.data : c));
      } else {
        const res = await api.post('/cars/', payload);
        const carId = res.data.id;
        if (newPhotos.length > 1) for (const url of newPhotos.slice(1)) await api.post(`/cars/${carId}/images`, { image_url: url });
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

  const handleDeleteUser = async (userId) => { if (window.confirm('Удалить пользователя?')) { await api.delete(`/admin/users/${userId}`); setUsers(prev => prev.filter(u => u.id !== userId)); } };
  const handleRoleChange = async (userId, newRole) => { await api.put(`/admin/users/${userId}/role`, { role: newRole }); setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u)); };
  const handleDeleteCar = async (carId) => { if (window.confirm('Удалить автомобиль?')) { await api.delete(`/cars/${carId}`); setCars(prev => prev.filter(c => c.id !== carId)); } };
  const handleLoanStatus = async (loanId, status) => { try { await api.put(`/admin/loans/${loanId}/status`, { status }); setLoans(prev => prev.map(l => l.id === loanId ? { ...l, status } : l)); } catch (err) { alert('Ошибка обновления статуса'); } };
  const handleTestDriveStatus = async (tdId, status) => { try { await api.put(`/admin/testdrives/${tdId}/status`, { status }); setTestDrives(prev => prev.map(td => td.id === tdId ? { ...td, status } : td)); } catch (err) { alert('Ошибка обновления статуса'); } };

  if (loading) return <div className={styles.loading}>Загрузка...</div>;

  const allBrands = Object.keys(brandModels);
  const filteredBrands = brandSearch ? allBrands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase())) : allBrands;
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
        {activeTab === 'dashboard' && stats && (
          <div className={styles.dashboard}>
            <div className={styles.statCard}><h3>Пользователи</h3><p>{stats.total_users}</p></div>
            <div className={styles.statCard}><h3>Автомобили</h3><p>{stats.total_cars}</p></div>
            <div className={styles.statCard}><h3>Заявки на тест-драйв</h3><p>{stats.total_testdrives}</p></div>
            <div className={styles.statCard}><h3>Покупки</h3><p>{stats.total_purchases}</p></div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <table className={styles.table}>
              <thead><tr><th>ID</th><th>Email</th><th>Имя</th><th>Роль</th><th>Действия</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td><td>{u.email}</td><td>{u.full_name}</td>
                    <td>
                      <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)} disabled={u.id === user.id}
                        style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1.5px solid var(--primary)', background: 'var(--bg)', color: 'var(--text)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                        {availableRoles.map(role => <option key={role} value={role}>{role}</option>)}
                      </select>
                    </td>
                    <td><button onClick={() => handleDeleteUser(u.id)} disabled={u.id === user.id || u.role === 'admin'} className={styles.deleteBtn}>Удалить</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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
                    <td style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button onClick={() => openEditForm(car)} style={{ background: 'transparent', border: '1.5px solid var(--primary)', color: 'var(--primary)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = 'white'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--primary)'; }}>✎ Изменить</button>
                      <button onClick={() => handleDeleteCar(car.id)} style={{ background: 'transparent', border: '1.5px solid #D32F2F', color: '#D32F2F', padding: '0.3rem 0.8rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#D32F2F'; e.currentTarget.style.color = 'white'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#D32F2F'; }}>✕ Удалить</button>
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
              <thead><tr><th>ID</th><th>Пользователь</th><th>Авто ID</th><th>Дата</th><th>Статус</th><th>Действия</th></tr></thead>
              <tbody>
                {testDrives.map(td => (
                  <tr key={td.id}>
                    <td>{td.id}</td><td>{td.user_id}</td><td>{td.car_id}</td>
                    <td>{new Date(td.preferred_date).toLocaleString()}</td>
                    <td><span className={`${styles.status} ${td.status === 'approved' ? styles.approved : td.status === 'rejected' ? styles.rejected : styles.pending}`}>{td.status === 'approved' ? 'Одобрена' : td.status === 'rejected' ? 'Отклонена' : 'Ожидает'}</span></td>
                    <td style={{ display: 'flex', gap: '0.3rem' }}>{td.status === 'pending' && (<><button className={styles.approveBtn} onClick={() => handleTestDriveStatus(td.id, 'approved')}>Одобрить</button><button className={styles.rejectBtn} onClick={() => handleTestDriveStatus(td.id, 'rejected')}>Отклонить</button></>)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'loans' && (
          <div>
            <table className={styles.table}>
              <thead><tr><th>ID</th><th>Пользователь</th><th>Автомобиль</th><th>Сумма</th><th>Срок</th><th>Платёж</th><th>Статус</th><th>Действия</th></tr></thead>
              <tbody>
                {loans.map(loan => (
                  <tr key={loan.id}>
                    <td>{loan.id}</td><td>{loan.user_email}</td><td>{loan.brand} {loan.model}</td>
                    <td>{loan.amount?.toLocaleString()} ₽</td><td>{loan.term_months} мес.</td><td>{loan.monthly_payment?.toLocaleString()} ₽</td>
                    <td><span className={`${styles.status} ${loan.status === 'approved' ? styles.approved : loan.status === 'rejected' ? styles.rejected : styles.pending}`}>{loan.status === 'approved' ? 'Одобрена' : loan.status === 'rejected' ? 'Отклонена' : 'Рассчитана'}</span></td>
                    <td style={{ display: 'flex', gap: '0.3rem' }}>{loan.status === 'calculated' && (<><button className={styles.approveBtn} onClick={() => handleLoanStatus(loan.id, 'approved')}>Одобрить</button><button className={styles.rejectBtn} onClick={() => handleLoanStatus(loan.id, 'rejected')}>Отклонить</button></>)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Модальное окно формы */}
      <AnimatePresence>
        {showFormModal && (
          <motion.div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeFormModal}>
            <motion.div style={{ background: 'var(--bg)', borderRadius: '24px', width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 1.5rem 0.5rem' }}>
                  <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: 'var(--primary)' }}>{editingCar ? 'Редактировать автомобиль' : 'Новый автомобиль'}</h4>
                  <button type="button" onClick={closeFormModal} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888' }}>✕</button>
                </div>
                <div style={{ padding: '0 1.5rem 1rem', flex: 1, overflowY: 'auto' }}>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label>Марка *</label>
                      <div onClick={() => setShowBrandModal(true)} style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '12px', border: '1.5px solid rgba(128,128,128,0.3)', background: 'var(--bg)', color: carForm.brand ? 'var(--text)' : '#888', fontFamily: 'inherit', fontSize: '0.95rem', cursor: 'pointer', position: 'relative', userSelect: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        {carForm.brand || '-- Выберите марку --'}<span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#888' }}>▼</span>
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>Модель *</label>
                      <div onClick={() => { if (carForm.brand) setShowModelModal(true); }} style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '12px', border: '1.5px solid rgba(128,128,128,0.3)', background: 'var(--bg)', color: carForm.model ? 'var(--text)' : '#888', fontFamily: 'inherit', fontSize: '0.95rem', cursor: carForm.brand ? 'pointer' : 'not-allowed', position: 'relative', userSelect: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        {carForm.model || '-- Выберите модель --'}<span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#888' }}>▼</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}><label>Год выпуска *</label><input type="number" value={carForm.year} onChange={e => setCarForm({...carForm, year: e.target.value})} placeholder="Например, 2024" style={{ width: '100%', padding: '0.7rem', borderRadius: '12px', border: '1.5px solid rgba(128,128,128,0.3)', background: 'var(--bg)', color: 'var(--text)' }} /></div>
                    <div style={{ flex: 1 }}><label>Цена (₽) *</label><input type="number" value={carForm.price} onChange={e => setCarForm({...carForm, price: e.target.value})} placeholder="Например, 15000000" style={{ width: '100%', padding: '0.7rem', borderRadius: '12px', border: '1.5px solid rgba(128,128,128,0.3)', background: 'var(--bg)', color: 'var(--text)' }} /></div>
                  </div>
                  <div style={{ marginBottom: '1rem' }}><label>Описание</label><textarea value={carForm.description} onChange={e => setCarForm({...carForm, description: e.target.value})} rows="2" placeholder="Краткое описание" style={{ width: '100%', padding: '0.7rem', borderRadius: '12px', border: '1.5px solid rgba(128,128,128,0.3)', background: 'var(--bg)', color: 'var(--text)' }} /></div>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}><label>Тип кузова</label><select value={carForm.body_type} onChange={e => setCarForm({...carForm, body_type: e.target.value})} style={{ width: '100%', padding: '0.7rem', borderRadius: '12px', border: '1.5px solid rgba(128,128,128,0.3)', background: 'var(--bg)', color: 'var(--text)' }}>{Object.entries(bodyTypesRussian).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}</select></div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <label>Рестайлинг</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ position: 'relative', width: '44px', height: '24px', background: carForm.restyling ? 'var(--primary)' : 'rgba(128,128,128,0.3)', borderRadius: '12px', transition: 'background 0.3s' }}>
                          <div style={{ position: 'absolute', top: '2px', left: carForm.restyling ? '22px' : '2px', width: '20px', height: '20px', background: 'white', borderRadius: '50%', transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                        </div>
                        <input type="checkbox" checked={carForm.restyling} onChange={e => setCarForm({...carForm, restyling: e.target.checked})} style={{ display: 'none' }} />
                        <span style={{ fontWeight: 500 }}>{carForm.restyling ? 'Да' : 'Нет'}</span>
                      </label>
                    </div>
                  </div>

                  {/* Технические характеристики */}
                  <details style={{ marginBottom: '1rem' }}>
                    <summary style={{ fontWeight: 600, color: 'var(--primary)', cursor: 'pointer', marginBottom: '0.5rem' }}>Технические характеристики</summary>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                      <div><label>Объём двигателя, л</label><select value={carForm.engine_volume || ''} onChange={e => setCarForm({...carForm, engine_volume: e.target.value})} style={{ width: '100%', padding: '0.7rem', borderRadius: '12px', border: '1.5px solid rgba(128,128,128,0.3)', background: 'var(--bg)', color: 'var(--text)' }}><option value="">—</option>{engineVolumes.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                      <div><label>Мощность, л.с.</label><select value={carForm.power || ''} onChange={e => setCarForm({...carForm, power: e.target.value})} style={{ width: '100%', padding: '0.7rem', borderRadius: '12px', border: '1.5px solid rgba(128,128,128,0.3)', background: 'var(--bg)', color: 'var(--text)' }}><option value="">—</option>{powers.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                      <div><label>Топливо</label><select value={carForm.fuel_type || ''} onChange={e => setCarForm({...carForm, fuel_type: e.target.value})} style={{ width: '100%', padding: '0.7rem', borderRadius: '12px', border: '1.5px solid rgba(128,128,128,0.3)', background: 'var(--bg)', color: 'var(--text)' }}><option value="">—</option>{fuelTypes.map(v => <option key={v} value={v}>{{ petrol:'Бензин', diesel:'Дизель', hybrid:'Гибрид', electric:'Электро' }[v] || v}</option>)}</select></div>
                      <div><label>Расход, л/100км</label><select value={carForm.consumption || ''} onChange={e => setCarForm({...carForm, consumption: e.target.value})} style={{ width: '100%', padding: '0.7rem', borderRadius: '12px', border: '1.5px solid rgba(128,128,128,0.3)', background: 'var(--bg)', color: 'var(--text)' }}><option value="">—</option>{[5.0,6.0,7.0,8.0,9.0,10.0,12.0,15.0].map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                      <div><label>Привод</label><select value={carForm.drive_type || ''} onChange={e => setCarForm({...carForm, drive_type: e.target.value})} style={{ width: '100%', padding: '0.7rem', borderRadius: '12px', border: '1.5px solid rgba(128,128,128,0.3)', background: 'var(--bg)', color: 'var(--text)' }}><option value="">—</option>{driveTypes.map(v => <option key={v} value={v}>{{ FWD:'Передний', RWD:'Задний', AWD:'Полный' }[v] || v}</option>)}</select></div>
                      <div><label>Коробка передач</label><select value={carForm.transmission || ''} onChange={e => setCarForm({...carForm, transmission: e.target.value})} style={{ width: '100%', padding: '0.7rem', borderRadius: '12px', border: '1.5px solid rgba(128,128,128,0.3)', background: 'var(--bg)', color: 'var(--text)' }}><option value="">—</option>{transmissions.map(v => <option key={v} value={v}>{{ manual:'Механика', automatic:'Автомат', robot:'Робот', variator:'Вариатор' }[v] || v}</option>)}</select></div>
                      <div><label>Разгон 0-100 км/ч, с</label><select value={carForm.acceleration || ''} onChange={e => setCarForm({...carForm, acceleration: e.target.value})} style={{ width: '100%', padding: '0.7rem', borderRadius: '12px', border: '1.5px solid rgba(128,128,128,0.3)', background: 'var(--bg)', color: 'var(--text)' }}><option value="">—</option>{accelerations.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                      <div><label>Макс. скорость, км/ч</label><select value={carForm.max_speed || ''} onChange={e => setCarForm({...carForm, max_speed: e.target.value})} style={{ width: '100%', padding: '0.7rem', borderRadius: '12px', border: '1.5px solid rgba(128,128,128,0.3)', background: 'var(--bg)', color: 'var(--text)' }}><option value="">—</option>{maxSpeeds.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                      <div><label>Клиренс, мм</label><select value={carForm.clearance || ''} onChange={e => setCarForm({...carForm, clearance: e.target.value})} style={{ width: '100%', padding: '0.7rem', borderRadius: '12px', border: '1.5px solid rgba(128,128,128,0.3)', background: 'var(--bg)', color: 'var(--text)' }}><option value="">—</option>{clearances.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                      <div><label>Мест</label><select value={carForm.seats || ''} onChange={e => setCarForm({...carForm, seats: e.target.value})} style={{ width: '100%', padding: '0.7rem', borderRadius: '12px', border: '1.5px solid rgba(128,128,128,0.3)', background: 'var(--bg)', color: 'var(--text)' }}><option value="">—</option>{seatOptions.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                    </div>
                  </details>

                  {/* Фотографии */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label>Фотографии автомобиля</label>
                    <div onClick={() => fileInputRef.current?.click()} onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'} onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(128,128,128,0.4)'}
                      style={{ border: '2px dashed rgba(128,128,128,0.4)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', cursor: 'pointer', transition: 'border-color 0.3s' }}>
                      <input type="file" multiple accept="image/*" onChange={handleMultiplePhotos} disabled={uploading} ref={fileInputRef} style={{ display: 'none' }} />
                      {uploading ? <span style={{ color: 'var(--primary)' }}>Загрузка...</span> : (<><div style={{ fontSize: '2rem', color: 'var(--primary-light)', marginBottom: '0.5rem' }}>+</div><div style={{ color: 'var(--text)', fontWeight: 500 }}>Нажмите, чтобы выбрать фотографии</div><div style={{ color: 'var(--text)', opacity: 0.6, fontSize: '0.85rem' }}>Можно выбрать несколько файлов</div></>)}
                    </div>
                    {newPhotos.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                        {newPhotos.map((url, idx) => (
                          <div key={idx} style={{ position: 'relative', width: '100px', height: '80px' }}>
                            <img src={getImageUrl(url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                            <button type="button" onClick={() => removeNewPhoto(url)} style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#D32F2F', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                            {url === carForm.image_url && <div style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'var(--primary)', color: 'white', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '10px' }}>Основное</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {formError && <div style={{ background: '#fdecea', color: '#D32F2F', padding: '0.8rem 1rem', borderRadius: '10px', marginTop: '0.5rem', fontSize: '0.9rem' }}>{formError}</div>}
                </div>
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(128,128,128,0.2)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-light))', color: 'white', border: 'none', padding: '0.8rem 2.5rem', borderRadius: '30px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(74,20,140,0.3)' }}>{editingCar ? 'Сохранить изменения' : 'Добавить автомобиль'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модальные окна выбора марки/модели (без изменений, как в последнем рабочем варианте) */}
      <AnimatePresence>
        {showBrandModal && (
          <motion.div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '1rem' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBrandModal(false)}>
            <motion.div style={{ background: 'var(--bg)', borderRadius: '20px', width: '100%', maxWidth: '400px', maxHeight: '70vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 1.2rem 0.5rem' }}><h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', color: 'var(--primary)' }}>Выберите марку</h4><button type="button" onClick={() => setShowBrandModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888' }}>✕</button></div>
              <input type="text" placeholder="Поиск марки..." value={brandSearch} onChange={(e) => setBrandSearch(e.target.value)} style={{ margin: '0 1.2rem 0.5rem', padding: '0.7rem 1rem', border: '1.5px solid rgba(128,128,128,0.3)', borderRadius: '12px', fontFamily: 'inherit', fontSize: '0.95rem', background: 'var(--bg)', color: 'var(--text)' }} autoFocus />
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.2rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {filteredBrands.map(brand => <button key={brand} type="button" style={{ background: brand === carForm.brand ? 'var(--primary)' : 'var(--glass-bg)', color: brand === carForm.brand ? 'white' : 'var(--text)', border: 'none', padding: '0.7rem 1rem', borderRadius: '10px', textAlign: 'left', fontSize: '0.95rem', cursor: 'pointer' }} onClick={() => selectBrand(brand)}>{brand}</button>)}
                {filteredBrands.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text)' }}>Нет подходящих марок</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModelModal && (
          <motion.div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '1rem' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModelModal(false)}>
            <motion.div style={{ background: 'var(--bg)', borderRadius: '20px', width: '100%', maxWidth: '400px', maxHeight: '70vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 1.2rem 0.5rem' }}><h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', color: 'var(--primary)' }}>Выберите модель</h4><button type="button" onClick={() => setShowModelModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888' }}>✕</button></div>
              <input type="text" placeholder="Поиск модели..." value={modelSearch} onChange={(e) => setModelSearch(e.target.value)} style={{ margin: '0 1.2rem 0.5rem', padding: '0.7rem 1rem', border: '1.5px solid rgba(128,128,128,0.3)', borderRadius: '12px', fontFamily: 'inherit', fontSize: '0.95rem', background: 'var(--bg)', color: 'var(--text)' }} autoFocus />
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.2rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {filteredModels.map(model => <button key={model} type="button" style={{ background: model === carForm.model ? 'var(--primary)' : 'var(--glass-bg)', color: model === carForm.model ? 'white' : 'var(--text)', border: 'none', padding: '0.7rem 1rem', borderRadius: '10px', textAlign: 'left', fontSize: '0.95rem', cursor: 'pointer' }} onClick={() => selectModel(model)}>{model}</button>)}
                {filteredModels.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text)' }}>Нет подходящих моделей</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminPanel;