import React, { useState } from 'react';
import { motion } from 'framer-motion';
import styles from './LoanCalculator.module.css';

const LoanCalculator = ({ carId, carPrice }) => {
  const [amount, setAmount] = useState(carPrice || '');
  const [term, setTerm] = useState(36);
  const [rate, setRate] = useState(12);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleCalculate = (e) => {
    e.preventDefault();
    setError('');

    const principal = parseFloat(amount);
    const months = parseInt(term);
    const annualRate = parseFloat(rate);

    if (isNaN(principal) || isNaN(months) || isNaN(annualRate) || principal <= 0 || months <= 0 || annualRate < 0) {
      setError('Пожалуйста, введите корректные параметры расчета.');
      return;
    }

    // Локальный расчет аннуитетного платежа без обращений к API
    const monthlyRate = annualRate / 12 / 100;
    let monthlyPayment = 0;

    if (monthlyRate === 0) {
      monthlyPayment = principal / months;
    } else {
      monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    }

    const totalPayment = monthlyPayment * months;
    const overpayment = totalPayment - principal;

    let currentBalance = principal;
    const schedule = [];

    for (let month = 1; month <= months; month++) {
      const interestMonth = currentBalance * monthlyRate;
      const principalMonth = monthlyPayment - interestMonth;
      currentBalance -= principalMonth;

      schedule.push({
        month,
        payment: Math.round(monthlyPayment).toLocaleString('ru-RU'),
        principal: Math.round(principalMonth).toLocaleString('ru-RU'),
        interest: Math.round(interestMonth).toLocaleString('ru-RU'),
        balance: Math.max(0, Math.round(currentBalance)).toLocaleString('ru-RU'),
      });
    }

    setResult({
      monthly_payment: Math.round(monthlyPayment).toLocaleString('ru-RU'),
      total_payment: Math.round(totalPayment).toLocaleString('ru-RU'),
      overpayment: Math.round(overpayment).toLocaleString('ru-RU'),
      schedule,
    });
  };

  return (
    <motion.div className={styles.container} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <form onSubmit={handleCalculate}>
        <div className={styles.field}>
          <label htmlFor="amount">Сумма кредита (₽)</label>
          <input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="term">Срок кредита (месяцев)</label>
          <input id="term" type="number" value={term} onChange={(e) => setTerm(e.target.value)} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="rate">Процентная ставка (%)</label>
          <input id="rate" type="number" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} required />
        </div>
        <button type="submit" className={styles.calcBtn}>Рассчитать</button>
      </form>

      {error && <p className={styles.error}>{error}</p>}

      {result && (
        <motion.div className={styles.result} initial={{ y: 20 }} animate={{ y: 0 }}>
          <p>Ежемесячный платёж: <strong>{result.monthly_payment} ₽</strong></p>
          <p>Общая выплата: {result.total_payment} ₽</p>
          <p>Переплата: {result.overpayment} ₽</p>

          {result.schedule && result.schedule.length > 0 && (
            <details style={{ marginTop: '1rem' }}>
              <summary style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: 600 }}>График платежей</summary>
              <table className={styles.paymentTable}>
                <thead>
                  <tr>
                    <th>Месяц</th>
                    <th>Платёж</th>
                    <th>Осн. долг</th>
                    <th>Проценты</th>
                    <th>Остаток</th>
                  </tr>
                </thead>
                <tbody>
                  {result.schedule.map((item) => (
                    <tr key={item.month}>
                      <td>{item.month}</td>
                      <td>{item.payment} ₽</td>
                      <td>{item.principal} ₽</td>
                      <td>{item.interest} ₽</td>
                      <td>{item.balance} ₽</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default LoanCalculator;