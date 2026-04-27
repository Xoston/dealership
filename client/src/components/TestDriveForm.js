import React, { useState } from 'react';
import { createTestDrive } from '../services/testDriveService';
import { useAuth } from '../context/AuthContext';

const TestDriveForm = ({ carId }) => {
  const { user } = useAuth();
  const [date, setDate] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!user) {
      setError('Войдите, чтобы отправить заявку');
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
      // Извлекаем понятное сообщение из возможного сложного объекта ошибки
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        // Массив ошибок валидации Pydantic
        const messages = detail.map((e) => e.msg).join('. ');
        setError(messages || 'Ошибка валидации данных');
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError('Неизвестная ошибка сервера');
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
        <input type="tel" placeholder="Телефон" value={phone} onChange={(e) => setPhone(e.target.value)} required
          style={{ padding: '0.8rem', borderRadius: '12px', border: '2px solid rgba(74,20,140,0.15)', fontFamily: 'inherit' }} />
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