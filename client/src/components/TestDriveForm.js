import React, { useState } from 'react';
import { createTestDrive } from '../services/testDriveService';
import { useAuth } from '../context/AuthContext';
import styles from './TestDrive.module.css';

const TestDriveForm = ({ carId }) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Генерируем массив из 45 дней вперед для записи на любой день месяца
  const getNext45Days = () => {
    const days = [];
    const options = { weekday: 'short', month: 'long', day: 'numeric' };
    for (let i = 0; i < 45; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      let label = d.toLocaleDateString('ru-RU', options);
      label = label.charAt(0).toUpperCase() + label.slice(1);
      
      days.push({ dateStr, label });
    }
    return days;
  };

  const timeSlots = ['10:00', '11:30', '13:00', '14:30', '16:00', '17:30', '19:00', '20:30'];

  const validatePhone = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length !== 11) return false;
    if (cleaned[0] !== '7' && cleaned[0] !== '8') return false;
    return true;
  };

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits[0] === '8') return `8${digits.slice(1, 11)}`;
    return `+7${digits.slice(1, 11)}`;
  };

  const handlePhoneChange = (e) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate) {
      setError('Пожалуйста, выберите дату тест-драйва');
      return;
    }
    if (!selectedTime) {
      setError('Пожалуйста, выберите время тест-драйва');
      return;
    }
    if (!validatePhone(phone)) {
      setError('Неверный формат телефона');
      return;
    }

    // Формируем ISO строку даты и времени с секундами
    const fullDateTime = `${selectedDate}T${selectedTime}:00`;

    try {
      // Меняем ключ с "date" на "preferred_date", как требует Pydantic-схема бэкенда
      await createTestDrive({ car_id: carId, preferred_date: fullDateTime, phone, message });
      setSuccess(true);
      setError('');
    } catch (err) {
      const detail = err.response?.data?.detail;
      
      if (Array.isArray(detail)) {
        const messages = detail.map(d => `${d.loc?.[1] || 'поле'}: ${d.msg}`).join(', ');
        setError(messages);
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError('Ошибка при записи');
      }
    }
  };

  if (success) {
    return (
      <div className={styles.successContainer}>
        <h4 className={styles.successTitle}>Успешно!</h4>
        <p style={{ opacity: 0.9, margin: 0 }}>Вы записались на тест-драйв. Менеджер скоро свяжется с вами.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      
      {/* Селект Даты */}
      <div className={styles.fieldGroup}>
        <label className={styles.label}>ДАТА ТЕСТ-ДРАЙВА</label>
        <select 
          value={selectedDate} 
          onChange={(e) => { setSelectedDate(e.target.value); setError(''); }}
          required
          className={styles.select}
        >
          <option value="" disabled>Выберите удобный день...</option>
          {getNext45Days().map((item) => (
            <option key={item.dateStr} value={item.dateStr}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {/* Селект Времени */}
      <div className={styles.fieldGroup}>
        <label className={styles.label}>ВРЕМЯ</label>
        <select 
          value={selectedTime} 
          onChange={(e) => { setSelectedTime(e.target.value); setError(''); }}
          required
          className={styles.select}
        >
          <option value="" disabled>Выберите время...</option>
          {timeSlots.map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
      </div>

      {/* Телефон */}
      <div className={styles.fieldGroup}>
        <label className={styles.label}>КОНТАКТНЫЙ ТЕЛЕФОН</label>
        <input
          type="tel"
          placeholder="+7 (916) 123-45-67"
          value={phone}
          onChange={handlePhoneChange}
          required
          pattern="(\+7|8)\d{10}"
          className={`${styles.input} ${error && !selectedDate && !selectedTime ? styles.inputError : ''}`}
        />
      </div>
      
      {/* Комментарий */}
      <div className={styles.fieldGroup}>
        <label className={styles.label}>КОММЕНТАРИЙ</label>
        <textarea 
          placeholder="Пожелания к тест-драйву (необязательно)" 
          value={message} 
          onChange={(e) => setMessage(e.target.value)}
          rows="2"
          className={styles.textarea}
        />
      </div>
      
      {error && <p className={styles.errorText}>{error}</p>}
      
      <button type="submit" className={styles.submitButton}>
        Подтвердить запись
      </button>
    </form>
  );
};

export default TestDriveForm;