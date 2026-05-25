import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { calculateLoan } from '../services/loanService';
import styles from './LoanCalculator.module.css';

const LoanCalculator = ({ carId, carPrice }) => {
  const [amount, setAmount] = useState(carPrice || '');
  const [term, setTerm] = useState(36);
  const [rate, setRate] = useState(12);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleCalculate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await calculateLoan({
        car_id: carId,
        amount: parseFloat(amount),
        term_months: parseInt(term),
        interest_rate: parseFloat(rate),
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка расчёта');
    }
  };

  return (
    <motion.div className={styles.container} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <form onSubmit={handleCalculate}>
        <div className={styles.field}>
          <label htmlFor="amount">Сумма кредита</label>
          <input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="term">Срок (мес.)</label>
          <input id="term" type="number" value={term} onChange={(e) => setTerm(e.target.value)} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="rate">Годовая ставка (%)</label>
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
              <summary>График платежей</summary>
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