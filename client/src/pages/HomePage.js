import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    bg: 'https://avatars.mds.yandex.net/get-vertis-journal/4220003/P90448624_highRes_bmw-m8-competition-c.jpg_1735024318563/orig',
    overlay: 'radial-gradient(circle at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.85) 100%)',
  },
  {
    id: 2,
    type: 'car',
    model: 'Porsche 911 Turbo S',
    price: 22000000,
    bg: 'https://avadge.com/media/catalog/car_photos/porsche/911-turbo-s/2026-3.7-petrol/911_Turbo_S-1.webp',
    overlay: 'radial-gradient(circle at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.85) 100%)',
  },
  {
    id: 3,
    type: 'car',
    model: 'Audi R8',
    price: 24500000,
    bg: 'https://motor.ru/imgs/2023/12/14/14/6272735/7a8d676d0f4922866c6ff02e5bfe96bf77d52da4.jpg',
    overlay: 'radial-gradient(circle at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.85) 100%)',
  },
  {
    id: 4,
    type: 'car',
    model: 'Mercedes-AMG GT 63',
    price: 19500000,
    bg: 'https://motor.ru/imgs/2024/09/18/08/6596803/8192462334e9076934a811543f901523adc1d6cc.jpg',
    overlay: 'radial-gradient(circle at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.85) 100%)',
  },
];

const HomePage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef(null);
  
  // Для touch-событий
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchMoved = useRef(false);

  const goToSlide = useCallback((index) => {
    if (index >= 0 && index < slides.length && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentSlide(index);
    }
  }, [isTransitioning]);

  // Обработчик колеса мыши (десктоп)
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (isTransitioning) return;
    if (e.deltaY > 0) {
      goToSlide(currentSlide + 1);
    } else if (e.deltaY < 0) {
      goToSlide(currentSlide - 1);
    }
  }, [currentSlide, goToSlide, isTransitioning]);

  // Touch-обработчики для мобильных устройств
  const handleTouchStart = useCallback((e) => {
    // Сохраняем координаты начала касания
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchMoved.current = false;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!touchStartX.current) return;
    
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    
    // Если горизонтальное движение больше вертикального, предотвращаем стандартное поведение (скролл страницы)
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
      touchMoved.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (!touchMoved.current || isTransitioning) {
      touchStartX.current = 0;
      touchStartY.current = 0;
      return;
    }
    
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    
    // Свайп влево (следующий слайд) или вправо (предыдущий) при достаточном смещении (> 50px)
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        goToSlide(currentSlide + 1);
      } else {
        goToSlide(currentSlide - 1);
      }
    }
    
    // Сброс координат
    touchStartX.current = 0;
    touchStartY.current = 0;
    touchMoved.current = false;
  }, [currentSlide, goToSlide, isTransitioning]);

  // Сброс флага перехода после анимации
  useEffect(() => {
    const timeout = setTimeout(() => setIsTransitioning(false), 800);
    return () => clearTimeout(timeout);
  }, [currentSlide]);

  // Регистрируем колесо мыши и touch-события
  useEffect(() => {
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div className={styles.container} ref={containerRef}>
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