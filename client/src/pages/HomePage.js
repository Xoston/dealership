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
    bg: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
  },
  {
    id: 1,
    type: 'car',
    model: 'BMW M5 Competition',
    price: 14500000,
    bg: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
  },
  {
    id: 2,
    type: 'car',
    model: 'Porsche 911 Turbo S',
    price: 22000000,
    bg: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
  },
  {
    id: 3,
    type: 'car',
    model: 'Range Rover Sport',
    price: 18500000,
    bg: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
  },
  {
    id: 4,
    type: 'car',
    model: 'Mercedes-Benz S-Class',
    price: 20000000,
    bg: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80',
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
            <div className={styles.overlay} />
            {slides[currentSlide].type === 'welcome' ? (
              <div className={styles.content}>
                <h1>{slides[currentSlide].title}</h1>
                <p>{slides[currentSlide].subtitle}</p>
                <Link to="/catalog" className={styles.cta}>Смотреть каталог</Link>
              </div>
            ) : (
              <div className={styles.content}>
                <h2>{slides[currentSlide].model}</h2>
                <p className={styles.price}>
                  от {slides[currentSlide].price.toLocaleString()} ₽
                </p>
                <Link to="/catalog" className={styles.cta}>
                  Подробнее
                </Link>
              </div>
            )}
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