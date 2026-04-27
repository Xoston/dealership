import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError('Ошибка регистрации');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto' }}>
      <h2>Регистрация</h2>
      <form onSubmit={handleSubmit}>
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required style={{ width: '100%', marginBottom: '1rem' }} />
        <input name="password" type="password" placeholder="Пароль" onChange={handleChange} required style={{ width: '100%', marginBottom: '1rem' }} />
        <input name="full_name" placeholder="ФИО" onChange={handleChange} required style={{ width: '100%', marginBottom: '1rem' }} />
        <input name="phone" placeholder="Телефон" onChange={handleChange} style={{ width: '100%', marginBottom: '1rem' }} />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '8px' }}>Зарегистрироваться</button>
      </form>
    </div>
  );
};

export default RegisterPage;