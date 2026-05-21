import React, { useState } from 'react';
import { createTestDrive } from '../services/testDriveService';
import { useAuth } from '../context/AuthContext';
import styles from './TestDriveForm.module.css';

const TestDriveForm = ({ carId }) => {
  const { user } = useAuth();
  const [date, setDate] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const validatePhone = (value) => {
    // Разрешённые форматы: +79161234567 или 89161234567
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length !== 11) return false;
    if (cleaned[0] !== '7' && cleaned[0] !== '8') return false;
    return true;
  };

  const formatPhone = (value) => {
    // Автоматически добавляем +7 или 8 при вводе
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits[0] === '8') return `8${digits.slice(1, 11)}`;
    return `+7${digits.slice(1, 11)}`;
  };

  const handlePhoneChange = (e) => {
    const raw = e.target.value;
    setPhone(formatPhone(raw));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!user) {
      setError('Войдите, чтобы отправить заявку');
      return;
    }
    if (!validatePhone(phone)) {
      setError('Некорректный номер телефона. Введите 11 цифр, начиная с +7 или 8.');
      return;
    }
    try {
      await createTestDrive({
        car_id: carId,
        preferred_date: date,
        phone,
        message,
      });
      setSuccess(true);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map(e => e.msg).join('. '));
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError('Ошибка при отправке заявки');
      }
    }
  };

  if (!user) return <p style={{ marginTop: '1.5rem', color: '#888' }}>Войдите, чтобы записаться на тест-драйв</p>;

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3 style={{ fontFamily: "'Playfair Display', serif", marginBottom: '1rem' }}>Запись на тест-драйв</h3>
      {success && <p style={{ color: 'green' }}>✅ Заявка отправлена!</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required
          style={{ padding: '0.8rem', borderRadius: '12px', border: '2px solid rgba(74,20,140,0.15)', fontFamily: 'inherit' }} />
        <input
          type="tel"
          placeholder="Телефон (+79161234567)"
          value={phone}
          onChange={handlePhoneChange}
          required
          pattern="(\+7|8)\d{10}"
          title="Введите номер в формате +79161234567 или 89161234567"
          style={{ padding: '0.8rem', borderRadius: '12px', border: error ? '2px solid #D32F2F' : '2px solid rgba(74,20,140,0.15)', fontFamily: 'inherit' }}
        />
        <textarea placeholder="Сообщение (необязательно)" value={message} onChange={(e) => setMessage(e.target.value)}
          style={{ padding: '0.8rem', borderRadius: '12px', border: '2px solid rgba(74,20,140,0.15)', fontFamily: 'inherit', resize: 'vertical' }} />
        <button type="submit" style={{
          background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
          color: 'white', border: 'none', padding: '0.8rem', borderRadius: '30px', fontWeight: 600, cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(74,20,140,0.3)', transition: 'all 0.3s'
        }}>Отправить</button>
      </form>
      {error && <p style={{ color: 'red', marginTop: '0.5rem' }}>{error}</p>}
    </div>
  );
};

export default TestDriveForm;