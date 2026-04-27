import React, { useEffect, useState } from 'react';
import { getCars } from '../services/carService';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const CatalogPage = () => {
  const [cars, setCars] = useState([]);
  const [brand, setBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => { fetchCars(); }, []);

  const fetchCars = async (filters = {}) => {
    try {
      const res = await getCars(filters);
      setCars(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    const filters = {};
    if (brand) filters.brand = brand;
    if (minPrice) filters.min_price = minPrice;
    if (maxPrice) filters.max_price = maxPrice;
    fetchCars(filters);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '3rem 2rem' }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '3rem', marginBottom: '2rem', textAlign: 'center' }}>
        Наш каталог
      </h1>
      <form onSubmit={handleFilter} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <input placeholder="Марка" value={brand} onChange={(e) => setBrand(e.target.value)} style={{ padding: '0.8rem 1rem', borderRadius: '12px', border: '2px solid rgba(74,20,140,0.15)', width: '200px', fontFamily: 'inherit' }} />
        <input placeholder="Мин. цена" type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} style={{ padding: '0.8rem 1rem', borderRadius: '12px', border: '2px solid rgba(74,20,140,0.15)', width: '150px', fontFamily: 'inherit' }} />
        <input placeholder="Макс. цена" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} style={{ padding: '0.8rem 1rem', borderRadius: '12px', border: '2px solid rgba(74,20,140,0.15)', width: '150px', fontFamily: 'inherit' }} />
        <button type="submit" style={{
          background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
          color: 'white',
          border: 'none',
          padding: '0.8rem 2rem',
          borderRadius: '30px',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(74,20,140,0.3)',
          transition: 'all 0.3s'
        }}>Фильтровать</button>
      </form>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '2.5rem',
        marginTop: '2rem'
      }}>
        {cars.map((car) => (
          <motion.div
            key={car.id}
            whileHover={{ scale: 1.03, zIndex: 10 }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ perspective: 1000 }}
          >
            <Link to={`/cars/${car.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 10px 25px rgba(74,20,140,0.2)',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.3s',
              }}>
                <img
                  src={car.image_url || '/images/default-car.jpg'}
                  alt={car.model}
                  style={{ width: '100%', height: '220px', objectFit: 'cover', transition: 'transform 0.3s' }}
                  onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                />
                <div style={{ padding: '1.5rem' }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, marginBottom: '0.5rem' }}>
                    {car.brand} {car.model}
                  </h3>
                  <p style={{ color: '#666' }}>{car.year} год</p>
                  <p style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.3rem' }}>
                    {car.price.toLocaleString()} ₽
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default CatalogPage;