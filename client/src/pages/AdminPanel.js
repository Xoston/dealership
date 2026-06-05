import React, { useEffect, useState, useRef, useMemo } from 'react';
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

const bodyTypesRussian = {
  "sedan": "Седан", "coupe": "Купе", "cabriolet": "Кабриолет", "wagon": "Универсал",
  "suv": "Внедорожник", "pickup": "Пикап", "limousine": "Лимузин", "hatchback": "Хэтчбек",
};

const availableRoles = ["user", "admin", "manager"];

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

  // ---------- Фильтры для автомобилей ----------
  const [carSearch, setCarSearch] = useState('');
  const [carMinPrice, setCarMinPrice] = useState('');
  const [carMaxPrice, setCarMaxPrice] = useState('');
  const [carMinYear, setCarMinYear] = useState('');
  const [carMaxYear, setCarMaxYear] = useState('');
  const [carSortKey, setCarSortKey] = useState('');
  const [carSortDir, setCarSortDir] = useState('asc');

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
  const [submitting, setSubmitting] = useState(false);

  // ---------- Модальные окна выбора марки и модели ----------
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brandSearch, setBrandSearch] = useState('');
  const [showModelModal, setShowModelModal] = useState(false);
  const [modelSearch, setModelSearch] = useState('');

  // ---------- Модальное окно комментария кредита ----------
  const [loanCommentModal, setLoanCommentModal] = useState(false);
  const [currentLoanId, setCurrentLoanId] = useState(null);
  const [currentAction, setCurrentAction] = useState(null);
  const [loanComment, setLoanComment] = useState('');

  // ---------- Модальное окно комментария ТЕСТ-ДРАЙВА ----------
  const [testDriveCommentModal, setTestDriveCommentModal] = useState(false);
  const [currentTestDriveId, setCurrentTestDriveId] = useState(null);
  const [currentTestDriveAction, setCurrentTestDriveAction] = useState(null);
  const [testDriveComment, setTestDriveComment] = useState('');

  // ---------- Фотографии ----------
  const [newPhotos, setNewPhotos] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const fileInputRef = useRef(null);

  // ---------- Просмотр комментария ----------
  const [showCommentView, setShowCommentView] = useState(false);
  const [commentViewData, setCommentViewData] = useState({ title: '', text: '' });

  // ---------- НОВЫЙ СТЕЙТ ДЛЯ МОДАЛЬНОГО ОКНА ОТЗЫВА ----------
  const [reviewModal, setReviewModal] = useState({ show: false, rating: 0, comment: '', car: '', user: '' });

  // ================= ЗАГРУЗКА ДАННЫХ =================
  const fetchData = async () => {
    setLoading(true);
    try {
      const requests = [api.get('/cars/')];
      if (user.role === 'admin') {
        requests.push(api.get('/admin/stats'));
        requests.push(api.get('/admin/users'));
        requests.push(api.get('/testdrives/all'));
        requests.push(api.get('/admin/loans'));
      } else if (user.role === 'manager') {
        requests.push(api.get('/admin/stats'));
        requests.push(api.get('/testdrives/all'));
        requests.push(api.get('/admin/loans'));
      }
      const results = await Promise.all(requests);
      let idx = 0;
      setCars(results[idx++].data);
      if (user.role === 'admin') {
        setStats(results[idx++].data);
        setUsers(results[idx++].data);
        setTestDrives(results[idx++].data);
        setLoans(results[idx++].data);
      } else if (user.role === 'manager') {
        setStats(results[idx++].data);
        setTestDrives(results[idx++].data);
        setLoans(results[idx++].data);
      }
    } catch (err) {
      console.error('Ошибка загрузки данных админ-панели', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ================= МЕТРИКИ ДАШБОРДА =================
  const dashboardMetrics = useMemo(() => {
    const approvedLoans = loans.filter(l => l.status === 'approved');
    const totalRevenue = approvedLoans.reduce((sum, l) => sum + (l.amount || 0), 0);
    const avgAmount = approvedLoans.length > 0 ? totalRevenue / approvedLoans.length : 0;

    const salesMap = new Map();
    approvedLoans.forEach(l => {
      const key = `${l.brand} ${l.model}`;
      const existing = salesMap.get(key) || { count: 0, totalAmount: 0 };
      existing.count += 1;
      existing.totalAmount += l.amount || 0;
      salesMap.set(key, existing);
    });
    const topSelling = Array.from(salesMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const statusCounts = { calculated: 0, approved: 0, rejected: 0 };
    loans.forEach(l => { statusCounts[l.status] = (statusCounts[l.status] || 0) + 1; });

    const recentLoans = [...loans].sort((a, b) => b.id - a.id).slice(0, 4);

    const brandCounts = new Map();
    cars.forEach(c => { brandCounts.set(c.brand, (brandCounts.get(c.brand) || 0) + 1); });
    const carsByBrand = Array.from(brandCounts.entries())
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count);

    return { totalRevenue, avgAmount, topSelling, statusCounts, recentLoans, carsByBrand, approvedCount: approvedLoans.length };
  }, [loans, cars]);

  // ================= РАБОТА С ФОРМОЙ =================
  const openAddForm = () => {
    setEditingCar(null);
    setCarForm({
      brand: '', model: '', year: '', price: '', description: '', image_url: '', body_type: 'sedan', restyling: false,
      engine_volume: '', power: '', fuel_type: '', consumption: '', drive_type: '', transmission: '',
      acceleration: '', max_speed: '', clearance: '', seats: ''
    });
    setFieldErrors({}); setFormError('');
    setNewPhotos([]); setExistingPhotos([]);
    setShowFormModal(true);
  };

  const openEditForm = async (car) => {
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
    setFieldErrors({}); setFormError('');
    setNewPhotos([]);
    try {
      const res = await api.get(`/cars/${car.id}/images`);
      setExistingPhotos(res.data);
      if (!car.image_url && res.data.length > 0) {
        setCarForm(prev => ({ ...prev, image_url: res.data[0].image_url }));
      }
    } catch { setExistingPhotos([]); }
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false); setEditingCar(null);
    setNewPhotos([]); setExistingPhotos([]);
  };

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
      if (!carForm.image_url && existingPhotos.length === 0) {
        setCarForm(prev => ({ ...prev, image_url: newUrls[0] }));
      }
    }
    setUploading(false); e.target.value = '';
  };

  const setAsMainPhoto = (url) => setCarForm(prev => ({ ...prev, image_url: url }));

  const removeNewPhoto = (url) => {
    setNewPhotos(prev => prev.filter(u => u !== url));
    if (carForm.image_url === url) {
      const updatedNew = newPhotos.filter(u => u !== url);
      const newMain = updatedNew.length > 0 ? updatedNew[0] : (existingPhotos[0]?.image_url || '');
      setCarForm(prev => ({ ...prev, image_url: newMain }));
    }
  };

  const removeExistingPhoto = async (photoId) => {
    if (!window.confirm('Удалить это изображение?')) return;
    try {
      await api.delete(`/cars/images/${photoId}`);
      const removedPhoto = existingPhotos.find(p => p.id === photoId);
      const updatedExisting = existingPhotos.filter(p => p.id !== photoId);
      setExistingPhotos(updatedExisting);
      if (carForm.image_url === removedPhoto?.image_url) {
        const newMain = updatedExisting.length > 0 ? updatedExisting[0].image_url : (newPhotos[0] || '');
        setCarForm(prev => ({ ...prev, image_url: newMain }));
      }
    } catch (err) { alert('Не удалось удалить изображение'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || submitting) return;
    setFormError(''); setSubmitting(true);

    let mainImage = carForm.image_url;
    if (!mainImage) {
      if (existingPhotos.length > 0) mainImage = existingPhotos[0].image_url;
      else if (newPhotos.length > 0) mainImage = newPhotos[0];
    }

    const payload = {
      brand: carForm.brand, model: carForm.model, year: parseInt(carForm.year),
      price: parseFloat(carForm.price), description: carForm.description, image_url: mainImage,
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
        await api.put(`/cars/${editingCar.id}`, payload);
        for (const url of newPhotos) {
          if (url !== mainImage) await api.post(`/cars/${editingCar.id}/images`, { image_url: url });
        }
        const updatedCar = (await api.get(`/cars/${editingCar.id}`)).data;
        setCars(prev => prev.map(c => c.id === editingCar.id ? updatedCar : c));
      } else {
        const res = await api.post('/cars/', payload);
        const carId = res.data.id;
        for (const url of newPhotos) {
          if (url !== mainImage) await api.post(`/cars/${carId}/images`, { image_url: url });
        }
        setCars(prev => [...prev, res.data]);
      }
      closeFormModal();
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) setFormError(detail.map(e => e.msg).join('. '));
      else if (typeof detail === 'string') setFormError(detail);
      else setFormError('Ошибка сервера');
    } finally { setSubmitting(false); }
  };

  // ================= ПОЛЬЗОВАТЕЛИ / АВТО / КРЕДИТЫ =================
  const handleDeleteUser = async (userId) => { if (window.confirm('Удалить пользователя?')) { await api.delete(`/admin/users/${userId}`); setUsers(prev => prev.filter(u => u.id !== userId)); } };
  const handleRoleChange = async (userId, newRole) => { await api.put(`/admin/users/${userId}/role`, { role: newRole }); setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u)); };
  const handleDeleteCar = async (carId) => { if (window.confirm('Удалить автомобиль?')) { await api.delete(`/cars/${carId}`); setCars(prev => prev.filter(c => c.id !== carId)); } };

  const openLoanComment = (loanId, action) => {
    setCurrentLoanId(loanId); setCurrentAction(action);
    setLoanComment(''); setLoanCommentModal(true);
  };
  const submitLoanStatus = async () => {
    try {
      await api.put(`/admin/loans/${currentLoanId}/status`, { status: currentAction, comment: loanComment });
      setLoans(prev => prev.map(l => l.id === currentLoanId ? { ...l, status: currentAction, admin_comment: loanComment } : l));
      setLoanCommentModal(false);
    } catch (err) { alert('Ошибка обновления статуса'); }
  };

  // ================= ТЕСТ-ДРАЙВЫ =================
  const openTestDriveComment = (tdId, action) => {
    setCurrentTestDriveId(tdId);
    setCurrentTestDriveAction(action);
    setTestDriveComment('');
    setTestDriveCommentModal(true);
  };

  const submitTestDriveStatus = async () => {
    try {
      await api.put(`/admin/testdrives/${currentTestDriveId}/status`, {
        status: currentTestDriveAction,
        comment: testDriveComment,
      });
      setTestDrives(prev =>
        prev.map(td =>
          td.id === currentTestDriveId
            ? { ...td, status: currentTestDriveAction, admin_comment: testDriveComment }
            : td
        )
      );
      setTestDriveCommentModal(false);
    } catch (err) { alert('Ошибка обновления статуса'); }
  };

  // Функция открытия просмотра комментария
  const openCommentView = (text, title) => {
    setCommentViewData({ title, text });
    setShowCommentView(true);
  };

  if (loading) return <div className={styles.loading}>Загрузка...</div>;

  // ================= ФИЛЬТРАЦИЯ АВТОМОБИЛЕЙ =================
  const filteredCars = cars.filter(car => {
    const search = carSearch.toLowerCase();
    if (search && !`${car.brand} ${car.model}`.toLowerCase().includes(search)) return false;
    if (carMinPrice && car.price < parseFloat(carMinPrice)) return false;
    if (carMaxPrice && car.price > parseFloat(carMaxPrice)) return false;
    if (carMinYear && car.year < parseInt(carMinYear)) return false;
    if (carMaxYear && car.year > parseInt(carMaxYear)) return false;
    return true;
  }).sort((a, b) => {
    if (!carSortKey) return 0;
    const valA = a[carSortKey], valB = b[carSortKey];
    if (typeof valA === 'string' && typeof valB === 'string') return carSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    if (valA == null) return 1;
    if (valB == null) return -1;
    return carSortDir === 'asc' ? valA - valB : valB - valA;
  });

  const handleSort = (key) => {
    if (carSortKey === key) setCarSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setCarSortKey(key); setCarSortDir('asc'); }
  };
  const resetCarFilters = () => {
    setCarSearch(''); setCarMinPrice(''); setCarMaxPrice('');
    setCarMinYear(''); setCarMaxYear(''); setCarSortKey(''); setCarSortDir('asc');
  };

  const allBrands = Object.keys(brandModels);
  const filteredBrands = brandSearch ? allBrands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase())) : allBrands;
  const availableModels = carForm.brand ? (brandModels[carForm.brand] || []) : [];
  const filteredModels = modelSearch ? availableModels.filter(m => m.toLowerCase().includes(modelSearch.toLowerCase())) : availableModels;

  const tabs = [
    { key: 'dashboard', label: 'Дашборд' },
    { key: 'users', label: 'Пользователи', adminOnly: true },
    { key: 'cars', label: 'Автомобили' },
    { key: 'testdrives', label: 'Тест-драйвы' },
    { key: 'loans', label: 'Кредиты' },
  ].filter(tab => !tab.adminOnly || user.role === 'admin');

  return (
    <motion.div className={styles.container} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className={styles.title}>Админ-панель</h2>
      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button key={tab.key} className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`} onClick={() => setActiveTab(tab.key)}>{tab.label}</button>
        ))}
      </div>

      <div className={styles.content}>
        {/* ===== ДАШБОРД ===== */}
        {activeTab === 'dashboard' && stats && (
          <>
            <div className={styles.dashboard}>
              <div className={styles.statCard}>
                <h3>Выручка</h3>
                <p className={styles.revenueAmount}>
                  {dashboardMetrics.totalRevenue >= 1_000_000
                    ? `${(dashboardMetrics.totalRevenue / 1_000_000).toFixed(1)} млн ₽`
                    : dashboardMetrics.totalRevenue.toLocaleString() + ' ₽'}
                </p>
                <small>{dashboardMetrics.approvedCount} сделок</small>
              </div>
              <div className={styles.statCard}><h3>Пользователи</h3><p>{stats.total_users}</p></div>
              <div className={styles.statCard}><h3>Автомобили</h3><p>{stats.total_cars}</p></div>
              <div className={styles.statCard}><h3>Тест‑драйвы</h3><p>{stats.total_testdrives}</p></div>
              <div className={styles.statCard}><h3>Покупки</h3><p>{stats.total_purchases}</p></div>
            </div>

            <div className={styles.analyticsGrid}>
              {/* Топ‑5 */}
              <div className={styles.analyticsBlock}>
                <h3 className={styles.blockTitle}>Топ‑5 продаваемых автомобилей</h3>
                {dashboardMetrics.topSelling.length === 0 ? (
                  <p className={styles.emptyText}>Нет данных о продажах</p>
                ) : (
                  <div className={styles.topSalesList}>
                    {dashboardMetrics.topSelling.map((item, i) => {
                      const maxCount = dashboardMetrics.topSelling[0]?.count || 1;
                      const percent = (item.count / maxCount) * 100;
                      return (
                        <div key={i} className={styles.topSalesCard}>
                          <div className={styles.topSalesHeader}>
                            <span className={styles.topSalesName}>#{i + 1} {item.name}</span>
                            <span className={styles.topSalesStats}>{item.count} продаж · {item.totalAmount.toLocaleString()} ₽</span>
                          </div>
                          <div className={styles.topSalesBar}>
                            <div className={styles.topSalesFill} style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Статусы кредитов – объёмные столбцы */}
              <div className={styles.analyticsBlock}>
                <h3 className={styles.blockTitle}>Статусы кредитов</h3>
                <div className={styles.columnChart}>
                  {[
                    { label: 'Рассчитана', count: dashboardMetrics.statusCounts.calculated, color: '#FFA726' },
                    { label: 'Одобрена', count: dashboardMetrics.statusCounts.approved, color: '#66BB6A' },
                    { label: 'Отклонена', count: dashboardMetrics.statusCounts.rejected, color: '#EF5350' }
                  ].map((status) => {
                    const maxVal = Math.max(dashboardMetrics.statusCounts.calculated, dashboardMetrics.statusCounts.approved, dashboardMetrics.statusCounts.rejected);
                    const heightPercent = maxVal > 0 ? (status.count / maxVal) * 100 : 0;
                    return (
                      <div key={status.label} className={styles.columnItem}>
                        <span className={styles.columnValue}>{status.count}</span>
                        <div className={styles.columnBar}>
                          <div
                            className={styles.columnFill}
                            style={{
                              height: `${Math.max(heightPercent, 4)}%`,
                              '--bar-color': status.color,
                            }}
                          >
                            <div className={styles.columnTop} />
                          </div>
                        </div>
                        <span className={styles.columnLabel}>{status.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Последние заявки */}
              <div className={styles.analyticsBlock}>
                <h3 className={styles.blockTitle}>Последние заявки</h3>
                <ul className={styles.recentList}>
                  {dashboardMetrics.recentLoans.map(loan => (
                    <li key={loan.id} className={styles.recentItem}>
                      <div className={styles.recentRow}>
                        <span>{loan.brand} {loan.model}</span>
                        <span className={styles.recentAmount}>{loan.amount?.toLocaleString()} ₽</span>
                      </div>
                      <div className={styles.recentMeta}>
                        {loan.user_email} · {loan.status === 'calculated' ? 'Рассчитана' : loan.status === 'approved' ? 'Одобрена' : 'Отклонена'}
                        {loan.created_at && <span> · {new Date(loan.created_at).toLocaleDateString()}</span>}
                        {(loan.admin_comment || loan.comment) && (
                          <button
                            className={styles.commentIconBtn}
                            onClick={() => openCommentView(loan.admin_comment || loan.comment, `Кредит №${loan.id}`)}
                            title="Показать комментарий"
                          >
                            💬
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Круговая диаграмма: автомобили по маркам */}
              <div className={styles.analyticsBlock}>
                <h3 className={styles.blockTitle}>Автомобили по маркам</h3>
                <div className={styles.pieChartContainer}>
                  <div className={styles.pieLegend}>
                    {dashboardMetrics.carsByBrand.slice(0, 6).map(({ brand, count }, i) => {
                      const hue = (i * 60) % 360;
                      return (
                        <div key={brand} className={styles.legendItem}>
                          <span className={styles.legendColor} style={{ background: `hsl(${hue}, 70%, 55%)` }}></span>
                          <span className={styles.legendText}>{brand} ({count})</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className={styles.pieChart}>
                    <svg viewBox="0 0 160 160" className={styles.pieSvg}>
                      {dashboardMetrics.carsByBrand.slice(0, 6).reduce((acc, { brand, count }, i) => {
                        const total = dashboardMetrics.carsByBrand.slice(0, 6).reduce((sum, item) => sum + item.count, 0);
                        const percentage = (count / total) * 100;
                        const hue = (i * 60) % 360;
                        const startAngle = acc.offset;
                        const endAngle = acc.offset + (percentage / 100) * 360;
                        const polarToCartesian = (cx, cy, r, angle) => {
                          const rad = (angle - 90) * Math.PI / 180;
                          return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
                        };
                        const start = polarToCartesian(80, 80, 70, startAngle);
                        const end = polarToCartesian(80, 80, 70, endAngle);
                        const largeArc = percentage > 50 ? 1 : 0;
                        const pathData = `M 80 80 L ${start.x} ${start.y} A 70 70 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
                        acc.elements.push(
                          <path key={i} d={pathData} fill={`hsl(${hue}, 70%, 55%)`} stroke="white" strokeWidth="2" className={styles.pieSlice}>
                            <title>{brand}: {count} ({Math.round(percentage)}%)</title>
                          </path>
                        );
                        if (percentage > 8) {
                          const midAngle = startAngle + (endAngle - startAngle) / 2;
                          const labelPos = polarToCartesian(80, 80, 50, midAngle);
                          acc.elements.push(
                            <text key={`label-${i}`} x={labelPos.x} y={labelPos.y} textAnchor="middle" dy="0.35em" fill="white" fontSize="10" fontWeight="bold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                              {Math.round(percentage)}%
                            </text>
                          );
                        }
                        return { offset: endAngle, elements: acc.elements };
                      }, { offset: 0, elements: [] }).elements}
                      <circle cx="80" cy="80" r="35" fill="var(--bg)" />
                      <text x="80" y="75" textAnchor="middle" fill="var(--primary)" fontSize="12" fontWeight="bold">Всего</text>
                      <text x="80" y="92" textAnchor="middle" fill="var(--text)" fontSize="16" fontWeight="bold">
                        {dashboardMetrics.carsByBrand.slice(0, 6).reduce((sum, item) => sum + item.count, 0)}
                      </text>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Ожидающие тест-драйвы (кликабельные) */}
              <div className={styles.analyticsBlock}>
                <h3 className={styles.blockTitle}>Тест‑драйвы (ожидают)</h3>
                <motion.span
                  className={styles.pendingTdCount}
                  onClick={() => setActiveTab('testdrives')}
                  title="Перейти к тест‑драйвам"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setActiveTab('testdrives')}

                  animate={{
                    y: [0, -6, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  whileHover={{
                    scale: 1.15,
                    rotate: [0, -5, 5, -5, 0],
                    transition: { duration: 0.4 }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  {testDrives.filter(td => td.status === 'pending').length}
                </motion.span>
              </div>
            </div>
          </>
        )}

        {/* ===== ПОЛЬЗОВАТЕЛИ ===== */}
        {activeTab === 'users' && user.role === 'admin' && (
          <div>
            <table className={styles.table}>
              <thead><tr><th>ID</th><th>Email</th><th>Имя</th><th>Роль</th><th>Действия</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.id}</td><td>{u.email}</td><td>{u.full_name}</td>
                    <td>
                      <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)} disabled={u.id === user.id} className={styles.roleSelect}>
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

        {/* ===== АВТОМОБИЛИ ===== */}
        {activeTab === 'cars' && (
          <div>
            <button className={styles.addBtn} onClick={openAddForm}>Добавить автомобиль</button>
            <div className={styles.filterPanel}>
              <input type="text" placeholder="Поиск по марке/модели" value={carSearch} onChange={(e) => setCarSearch(e.target.value)} className={styles.filterInput} />
              <input type="number" placeholder="Цена от" value={carMinPrice} onChange={(e) => setCarMinPrice(e.target.value)} className={styles.filterInputSmall} />
              <input type="number" placeholder="Цена до" value={carMaxPrice} onChange={(e) => setCarMaxPrice(e.target.value)} className={styles.filterInputSmall} />
              <input type="number" placeholder="Год от" value={carMinYear} onChange={(e) => setCarMinYear(e.target.value)} className={styles.filterInputSmall} />
              <input type="number" placeholder="Год до" value={carMaxYear} onChange={(e) => setCarMaxYear(e.target.value)} className={styles.filterInputSmall} />
              <button onClick={resetCarFilters} className={styles.resetFiltersBtn}>Сбросить</button>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.sortable} onClick={() => handleSort('id')}>ID {carSortKey === 'id' ? (carSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th className={styles.sortable} onClick={() => handleSort('brand')}>Марка {carSortKey === 'brand' ? (carSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th className={styles.sortable} onClick={() => handleSort('model')}>Модель {carSortKey === 'model' ? (carSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th className={styles.sortable} onClick={() => handleSort('price')}>Цена {carSortKey === 'price' ? (carSortDir === 'asc' ? '▲' : '▼') : ''}</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredCars.map(car => (
                  <tr key={car.id}>
                    <td>{car.id}</td><td>{car.brand}</td><td>{car.model}</td>
                    <td>{car.price.toLocaleString()} ₽</td>
                    <td className={styles.actionsCell}>
                      <button onClick={() => openEditForm(car)} className={styles.editBtn}>✎ Изменить</button>
                      <button onClick={() => handleDeleteCar(car.id)} className={styles.deleteCarBtn}>✕ Удалить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ===== ТЕСТ-ДРАЙВЫ ===== */}
        {activeTab === 'testdrives' && (
          <div>
            <table className={styles.table}>
              <thead><tr><th>ID</th><th>Пользователь</th><th>Авто ID</th><th>Дата</th><th>Статус</th><th>Действия</th></tr></thead>
              <tbody>
                {testDrives.map(td => (
                  <tr key={td.id}>
                    <td>{td.id}</td><td>{td.user_id}</td><td>{td.car_id}</td>
                    <td>{new Date(td.preferred_date).toLocaleString()}</td>
                    <td>
                      <span className={`${styles.status} ${td.status === 'approved' ? styles.approved : td.status === 'rejected' ? styles.rejected : styles.pending}`}>
                        {td.status === 'approved' ? 'Одобрена' : td.status === 'rejected' ? 'Отклонена' : 'Ожидает'}
                      </span>
                      {/* Добавляем кнопку просмотра отзыва, если есть рейтинг */}
                      {td.rating ? (
                        <button
                          className={styles.commentIconBtn}
                          style={{ color: '#ffb400', opacity: 1, marginLeft: '10px' }}
                          onClick={() => setReviewModal({
                            show: true,
                            rating: td.rating,
                            comment: td.review_text || 'Пользователь оставил оценку без текстового комментария.',
                            car: `${td.car_brand} ${td.car_model}`,
                            user: td.user_email || td.user?.email || 'Клиент'
                          })}
                          title="Посмотреть отзыв"
                        >
                          ⭐ {td.rating}/5
                        </button>
                      ) : null}
                      {(td.admin_comment || td.comment) && (
                        <button
                          className={styles.commentIconBtn}
                          onClick={() => openCommentView(td.admin_comment || td.comment, `Тест-драйв №${td.id}`)}
                          title="Показать комментарий"
                        >
                          💬
                        </button>
                      )}
                    </td>
                    <td className={styles.actionsCell}>
                      {td.status === 'pending' && (
                        <>
                          <button className={styles.approveBtn} onClick={() => openTestDriveComment(td.id, 'approved')}>Одобрить</button>
                          <button className={styles.rejectBtn} onClick={() => openTestDriveComment(td.id, 'rejected')}>Отклонить</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ===== КРЕДИТЫ ===== */}
        {activeTab === 'loans' && (
          <div>
            <table className={styles.table}>
              <thead><tr><th>ID</th><th>Пользователь</th><th>Автомобиль</th><th>Сумма</th><th>Срок</th><th>Платёж</th><th>Статус</th><th>Действия</th></tr></thead>
              <tbody>
                {loans.map(loan => (
                  <tr key={loan.id}>
                    <td>{loan.id}</td><td>{loan.user_email}</td><td>{loan.brand} {loan.model}</td>
                    <td>{loan.amount?.toLocaleString()} ₽</td><td>{loan.term_months} мес.</td><td>{loan.monthly_payment?.toLocaleString()} ₽</td>
                    <td>
                      <span className={`${styles.status} ${loan.status === 'approved' ? styles.approved : loan.status === 'rejected' ? styles.rejected : styles.pending}`}>
                        {loan.status === 'approved' ? 'Одобрена' : loan.status === 'rejected' ? 'Отклонена' : 'Рассчитана'}
                      </span>
                      {(loan.admin_comment || loan.comment) && (
                        <button
                          className={styles.commentIconBtn}
                          onClick={() => openCommentView(loan.admin_comment || loan.comment, `Кредит №${loan.id}`)}
                          title="Показать комментарий"
                        >
                          💬
                        </button>
                      )}
                    </td>
                    <td className={styles.actionsCell}>
                      {loan.status === 'calculated' && (
                        <>
                          <button className={styles.approveBtn} onClick={() => openLoanComment(loan.id, 'approved')}>Одобрить</button>
                          <button className={styles.rejectBtn} onClick={() => openLoanComment(loan.id, 'rejected')}>Отклонить</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <AnimatePresence>
              {loanCommentModal && (
                <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLoanCommentModal(false)}>
                  <motion.div className={styles.loanCommentModal} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
                    <h3>{currentAction === 'approved' ? 'Одобрение' : 'Отклонение'} кредита</h3>
                    <textarea rows="3" placeholder="Введите комментарий (необязательно)..." value={loanComment} onChange={(e) => setLoanComment(e.target.value)} className={styles.loanCommentTextarea} />
                    <div className={styles.loanCommentButtons}>
                      <button className={styles.submitBtn} onClick={submitLoanStatus}>Подтвердить</button>
                      <button className={styles.cancelBtn} onClick={() => setLoanCommentModal(false)}>Отмена</button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ===== МОДАЛЬНОЕ ОКНО КОММЕНТАРИЯ ТЕСТ-ДРАЙВА ===== */}
        <AnimatePresence>
          {testDriveCommentModal && (
            <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setTestDriveCommentModal(false)}>
              <motion.div className={styles.loanCommentModal} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
                <h3>{currentTestDriveAction === 'approved' ? 'Одобрение' : 'Отклонение'} тест‑драйва</h3>
                <textarea rows="3" placeholder="Введите комментарий (необязательно)..." value={testDriveComment} onChange={(e) => setTestDriveComment(e.target.value)} className={styles.loanCommentTextarea} />
                <div className={styles.loanCommentButtons}>
                  <button className={styles.submitBtn} onClick={submitTestDriveStatus}>Подтвердить</button>
                  <button className={styles.cancelBtn} onClick={() => setTestDriveCommentModal(false)}>Отмена</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===== МОДАЛЬНОЕ ОКНО ПРОСМОТРА КОММЕНТАРИЯ ===== */}
        <AnimatePresence>
          {showCommentView && (
            <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCommentView(false)}>
              <motion.div className={styles.loanCommentModal} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
                <button className={styles.modalClose} onClick={() => setShowCommentView(false)}>✕</button>
                <h3>{commentViewData.title}</h3>
                <div className={styles.commentViewBody}>
                  {commentViewData.text}
                </div>
                <div className={styles.loanCommentButtons}>
                  <button className={styles.cancelBtn} onClick={() => setShowCommentView(false)}>Закрыть</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== МОДАЛЬНОЕ ОКНО ФОРМЫ АВТО (ПОЛНОСТЬЮ ВОССТАНОВЛЕНО) ===== */}
      <AnimatePresence>
        {showFormModal && (
          <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeFormModal}>
            <motion.div className={styles.modal} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h4>{editingCar ? 'Редактировать автомобиль' : 'Новый автомобиль'}</h4>
                <button type="button" onClick={closeFormModal} className={styles.closeBtn}>✕</button>
              </div>
              <div className={styles.modalBody}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Марка *</label>
                      <div className={`${styles.selectField} ${!carForm.brand ? styles.placeholder : ''}`} onClick={() => setShowBrandModal(true)} tabIndex={0} role="button">{carForm.brand || '-- Выберите марку --'}</div>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Модель *</label>
                      <div className={`${styles.selectField} ${!carForm.model ? styles.placeholder : ''} ${!carForm.brand ? styles.disabled : ''}`} onClick={() => carForm.brand && setShowModelModal(true)} tabIndex={0} role="button">{carForm.model || '-- Выберите модель --'}</div>
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Год выпуска *</label>
                      <input type="number" value={carForm.year} onChange={e => setCarForm({ ...carForm, year: e.target.value })} placeholder="Например, 2024" className={fieldErrors.year ? styles.inputError : ''} />
                      {fieldErrors.year && <span className={styles.errorMsg}>{fieldErrors.year}</span>}
                    </div>
                    <div className={styles.formGroup}>
                      <label>Цена (₽) *</label>
                      <input type="number" value={carForm.price} onChange={e => setCarForm({ ...carForm, price: e.target.value })} placeholder="Например, 15000000" className={fieldErrors.price ? styles.inputError : ''} />
                      {fieldErrors.price && <span className={styles.errorMsg}>{fieldErrors.price}</span>}
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Описание</label>
                    <textarea value={carForm.description} onChange={e => setCarForm({ ...carForm, description: e.target.value })} rows="2" placeholder="Краткое описание" />
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Тип кузова</label>
                      <select value={carForm.body_type} onChange={e => setCarForm({ ...carForm, body_type: e.target.value })}>
                        {Object.entries(bodyTypesRussian).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Рестайлинг</label>
                      <label className={styles.checkboxLabel}>
                        <div className={`${styles.toggleSwitch} ${carForm.restyling ? styles.toggleActive : ''}`} onClick={() => setCarForm({ ...carForm, restyling: !carForm.restyling })}>
                          <div className={styles.toggleKnob} />
                        </div>
                        <input type="checkbox" checked={carForm.restyling} onChange={e => setCarForm({ ...carForm, restyling: e.target.checked })} style={{ display: 'none' }} />
                        <span>{carForm.restyling ? 'Да' : 'Нет'}</span>
                      </label>
                    </div>
                  </div>
                  <details className={styles.techDetails}>
                    <summary>Технические характеристики</summary>
                    <div className={styles.specsGrid}>
                      <div className={styles.formGroup}><label>Объём двигателя, л</label><select value={carForm.engine_volume || ''} onChange={e => setCarForm({ ...carForm, engine_volume: e.target.value })}><option value="">—</option>{engineVolumes.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                      <div className={styles.formGroup}><label>Мощность, л.с.</label><select value={carForm.power || ''} onChange={e => setCarForm({ ...carForm, power: e.target.value })}><option value="">—</option>{powers.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                      <div className={styles.formGroup}><label>Топливо</label><select value={carForm.fuel_type || ''} onChange={e => setCarForm({ ...carForm, fuel_type: e.target.value })}><option value="">—</option>{fuelTypes.map(v => <option key={v} value={v}>{{ petrol: 'Бензин', diesel: 'Дизель', hybrid: 'Гибрид', electric: 'Электро' }[v] || v}</option>)}</select></div>
                      <div className={styles.formGroup}><label>Расход, л/100км</label><select value={carForm.consumption || ''} onChange={e => setCarForm({ ...carForm, consumption: e.target.value })}><option value="">—</option>{[5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 12.0, 15.0].map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                      <div className={styles.formGroup}><label>Привод</label><select value={carForm.drive_type || ''} onChange={e => setCarForm({ ...carForm, drive_type: e.target.value })}><option value="">—</option>{driveTypes.map(v => <option key={v} value={v}>{{ FWD: 'Передний', RWD: 'Задний', AWD: 'Полный' }[v] || v}</option>)}</select></div>
                      <div className={styles.formGroup}><label>Коробка передач</label><select value={carForm.transmission || ''} onChange={e => setCarForm({ ...carForm, transmission: e.target.value })}><option value="">—</option>{transmissions.map(v => <option key={v} value={v}>{{ manual: 'Механика', automatic: 'Автомат', robot: 'Робот', variator: 'Вариатор' }[v] || v}</option>)}</select></div>
                      <div className={styles.formGroup}><label>Разгон 0-100 км/ч, с</label><select value={carForm.acceleration || ''} onChange={e => setCarForm({ ...carForm, acceleration: e.target.value })}><option value="">—</option>{accelerations.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                      <div className={styles.formGroup}><label>Макс. скорость, км/ч</label><select value={carForm.max_speed || ''} onChange={e => setCarForm({ ...carForm, max_speed: e.target.value })}><option value="">—</option>{maxSpeeds.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                      <div className={styles.formGroup}><label>Клиренс, мм</label><select value={carForm.clearance || ''} onChange={e => setCarForm({ ...carForm, clearance: e.target.value })}><option value="">—</option>{clearances.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                      <div className={styles.formGroup}><label>Мест</label><select value={carForm.seats || ''} onChange={e => setCarForm({ ...carForm, seats: e.target.value })}><option value="">—</option>{seatOptions.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                    </div>
                  </details>
                  <div className={styles.imagePanel}>
                    <label>Фотографии автомобиля</label>
                    <div className={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
                      <input type="file" multiple accept="image/*" onChange={handleMultiplePhotos} disabled={uploading} ref={fileInputRef} style={{ display: 'none' }} />
                      {uploading ? <span className={styles.uploadingText}>Загрузка...</span> : (
                        <>
                          <div className={styles.uploadIcon}>+</div>
                          <div className={styles.uploadTitle}>Нажмите, чтобы выбрать фотографии</div>
                          <div className={styles.uploadSubtitle}>Можно выбрать несколько файлов</div>
                        </>
                      )}
                    </div>
                    {(existingPhotos.length > 0 || newPhotos.length > 0) && (
                      <div className={styles.imageGrid}>
                        {/* Существующие фото */}
                        {existingPhotos.map((photo) => (
                          <div key={photo.id} className={styles.thumbnailContainer} onClick={() => setAsMainPhoto(photo.image_url)} style={{ cursor: 'pointer' }}>
                            <img src={getImageUrl(photo.image_url)} alt="" />
                            <button type="button" onClick={(e) => { e.stopPropagation(); removeExistingPhoto(photo.id); }} className={styles.deleteThumb}>×</button>
                            {carForm.image_url === photo.image_url && <div className={styles.mainPhotoBadge}>Основное</div>}
                          </div>
                        ))}
                        {/* Новые фото */}
                        {newPhotos.map((url, idx) => (
                          <div key={idx} className={styles.thumbnailContainer} onClick={() => setAsMainPhoto(url)} style={{ cursor: 'pointer' }}>
                            <img src={getImageUrl(url)} alt="" />
                            <button type="button" onClick={(e) => { e.stopPropagation(); removeNewPhoto(url); }} className={styles.deleteThumb}>×</button>
                            {carForm.image_url === url && <div className={styles.mainPhotoBadge}>Основное</div>}
                          </div>
                        ))}
                      </div>
                    )}
                    {editingCar && existingPhotos.length === 0 && newPhotos.length === 0 && (
                      <p style={{ marginTop: '0.5rem', color: '#888' }}>Нет загруженных фотографий</p>
                    )}
                  </div>
                  {formError && <div className={styles.serverError}>{formError}</div>}
                  <div className={styles.modalFooter}>
                    <button type="submit" disabled={submitting} className={styles.submitBtn}>{editingCar ? 'Сохранить изменения' : 'Добавить автомобиль'}</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Модальные окна выбора марки/модели */}
      <AnimatePresence>
        {showBrandModal && (
          <motion.div className={styles.modelOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBrandModal(false)}>
            <motion.div className={styles.modelModal} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className={styles.modelModalHeader}><h4>Выберите марку</h4><button type="button" onClick={() => setShowBrandModal(false)} className={styles.closeBtn}>✕</button></div>
              <input type="text" placeholder="Поиск марки..." value={brandSearch} onChange={e => setBrandSearch(e.target.value)} className={styles.modelSearchInput} autoFocus />
              <div className={styles.modelList}>
                {filteredBrands.map(brand => <button key={brand} type="button" className={`${styles.modelItem} ${brand === carForm.brand ? styles.modelItemActive : ''}`} onClick={() => selectBrand(brand)}>{brand}</button>)}
                {filteredBrands.length === 0 && <p className={styles.noModels}>Нет подходящих марок</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showModelModal && (
          <motion.div className={styles.modelOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModelModal(false)}>
            <motion.div className={styles.modelModal} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div className={styles.modelModalHeader}><h4>Выберите модель</h4><button type="button" onClick={() => setShowModelModal(false)} className={styles.closeBtn}>✕</button></div>
              <input type="text" placeholder="Поиск модели..." value={modelSearch} onChange={e => setModelSearch(e.target.value)} className={styles.modelSearchInput} autoFocus />
              <div className={styles.modelList}>
                {filteredModels.map(model => <button key={model} type="button" className={`${styles.modelItem} ${model === carForm.model ? styles.modelItemActive : ''}`} onClick={() => selectModel(model)}>{model}</button>)}
                {filteredModels.length === 0 && <p className={styles.noModels}>Нет подходящих моделей</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== ФИНАЛЬНОЕ МОДАЛЬНОЕ ОКНО ДЛЯ ПРОСМОТРА ОТЗЫВОВ ===== */}
      <AnimatePresence>
        {reviewModal.show && (
          <motion.div
            className={styles.modelOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setReviewModal({ ...reviewModal, show: false })}
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 9999
            }}
          >
            <motion.div
              className={styles.modelModal}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--bg, #ffffff)',
                border: '2px solid #7c4dff',
                boxShadow: '0 15px 40px rgba(0, 0, 0, 0.3)',
                borderRadius: '20px',
                padding: '2rem',
                maxWidth: '550px',
                width: '90%',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                color: 'var(--text)',
                boxSizing: 'border-box'
              }}
            >
              {/* Шапка модального окна — всегда зафиксирована сверху */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexShrink: 0 }}>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--text)' }}>
                  Отзыв о тест-драйве
                </h3>
                <button 
                  type="button" 
                  onClick={() => setReviewModal({ ...reviewModal, show: false })} 
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text)',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    opacity: 0.6,
                    transition: 'opacity 0.2s ease',
                    padding: '0'
                  }}
                  onMouseOver={(e) => e.target.style.opacity = 1}
                  onMouseOut={(e) => e.target.style.opacity = 0.6}
                >
                  ✕
                </button>
              </div>
              
              <p style={{ opacity: 0.7, marginBottom: '1.2rem', fontSize: '0.95rem', fontWeight: '500', flexShrink: 0 }}>
                {reviewModal.user} • {reviewModal.car}
              </p>

              {/* Контентный блок со скроллом для защиты от огромного текста */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1.2rem', 
                overflowY: 'auto', 
                flexGrow: 1,
                paddingRight: '6px',
                marginBottom: '1rem'
              }}>
                <div style={{ fontSize: '1.8rem', color: '#7c4dff', letterSpacing: '4px', flexShrink: 0 }}>
                  {'★'.repeat(reviewModal.rating || 0)}{'☆'.repeat(5 - (reviewModal.rating || 0))}
                </div>
                
                <div style={{ 
                  background: 'var(--accent, #f4effa)',
                  padding: '1.2rem', 
                  borderRadius: '14px', 
                  fontStyle: 'italic', 
                  lineHeight: '1.6', 
                  borderLeft: '4px solid #7c4dff', 
                  borderTop: '1px solid rgba(124, 77, 255, 0.2)',
                  borderRight: '1px solid rgba(124, 77, 255, 0.2)',
                  borderBottom: '1px solid rgba(124, 77, 255, 0.2)',
                  whiteSpace: 'pre-wrap', 
                  wordBreak: 'break-word',
                  color: 'var(--text)'
                }}>
                  "{reviewModal.comment}"
                </div>
              </div>

              {/* Подвал с кнопкой — всегда прижат к низу */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', flexShrink: 0, marginTop: 'auto' }}>
                <button
                  type="button"
                  onClick={() => setReviewModal({ ...reviewModal, show: false })}
                  style={{ 
                    background: '#7c4dff', 
                    color: '#ffffff', 
                    padding: '0.7rem 2.2rem',
                    borderRadius: '30px',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(124, 77, 255, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 18px rgba(124, 77, 255, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(124, 77, 255, 0.3)';
                  }}
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

export default AdminPanel;