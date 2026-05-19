import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import styles from './HomePage.module.css';

const slides = [
  {
    id: 0,
    type: 'welcome',
    title: 'Искусство движения',
    subtitle: 'Эксклюзивные автомобили для тех, кто ценит совершенство',
    bg: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=1350&h=900&dpr=2',
    overlay: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.7) 100%)',
  },
  {
    id: 1,
    type: 'car',
    model: 'BMW M8 Gran Coupe',
    price: 17500000,
    bg: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRk1zcTIPWK5DG9cKv4uBtEFtC7kN0yYMoucg&s',
    overlay: 'radial-gradient(circle at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.85) 100%)',
  },
  {
    id: 2,
    type: 'car',
    model: 'Porsche 911 Turbo S',
    price: 22000000,
    bg: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQA2Dlziw1pONEu76yfKWitfOrUAX-tbQydNQ&s',
    overlay: 'radial-gradient(circle at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.85) 100%)',
  },
  {
    id: 3,
    type: 'car',
    model: 'Range Rover Sport SV',
    price: 18500000,
    bg: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRe_EfXhLNQJfKyBjtJpb3mGnBWxxGjOWrmyw&s',
    overlay: 'radial-gradient(circle at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.85) 100%)',
  },
  {
    id: 4,
    type: 'car',
    model: 'Mercedes-AMG GT 63',
    price: 19500000,
    bg: 'https://images.pexels.com/photos/120049/pexels-photo-120049.jpeg?auto=compress&cs=tinysrgb&w=1350&h=900&dpr=2',
    overlay: 'radial-gradient(circle at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.85) 100%)',
  },
];

const HomePage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToSlide = useCallback((index) => {
    if (index >= 0 && index < slides.length && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentSlide(index);
    }
  }, [isTransitioning]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (isTransitioning) return;
    if (e.deltaY > 0) {
      goToSlide(currentSlide + 1);
    } else if (e.deltaY < 0) {
      goToSlide(currentSlide - 1);
    }
  }, [currentSlide, goToSlide, isTransitioning]);

  useEffect(() => {
    const timeout = setTimeout(() => setIsTransitioning(false), 800);
    return () => clearTimeout(timeout);
  }, [currentSlide]);

  useEffect(() => {
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  return (
    <div className={styles.container}>
      <div className={styles.slidesWrapper}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className={styles.slide}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            style={{ backgroundImage: `url(${slides[currentSlide].bg})` }}
          >
            {/* Динамический оверлей для каждого слайда */}
            <div className={styles.overlay} style={{ background: slides[currentSlide].overlay }} />
            <div className={styles.content}>
              {slides[currentSlide].type === 'welcome' ? (
                <>
                  <h1>{slides[currentSlide].title}</h1>
                  <p>{slides[currentSlide].subtitle}</p>
                  <Link to="/catalog" className={styles.cta}>Смотреть каталог</Link>
                </>
              ) : (
                <>
                  <h2>{slides[currentSlide].model}</h2>
                  <p className={styles.price}>
                    от {slides[currentSlide].price.toLocaleString()} ₽
                  </p>
                  <Link to="/catalog" className={styles.cta}>
                    Подробнее
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={styles.dots}>
        {slides.map((_, idx) => (
          <button
            key={idx}
            className={`${styles.dot} ${idx === currentSlide ? styles.activeDot : ''}`}
            onClick={() => goToSlide(idx)}
            aria-label={`Слайд ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HomePage;