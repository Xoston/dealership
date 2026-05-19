import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoanCalculator from '../LoanCalculator';
import { calculateLoan } from '../../services/loanService';

jest.mock('../../services/loanService');

describe('LoanCalculator component', () => {
  test('renders form elements', () => {
    render(<LoanCalculator carId={1} carPrice={5000000} />);
    expect(screen.getByLabelText(/Сумма кредита/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Срок/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Годовая ставка/i)).toBeInTheDocument();
    expect(screen.getByText(/Рассчитать/i)).toBeInTheDocument();
  });

  test('calculates and displays loan result', async () => {
    calculateLoan.mockResolvedValue({
      data: {
        monthly_payment: 150000,
        total_payment: 5400000,
        overpayment: 400000,
        schedule: [
          { month: 1, payment: 150000, principal: 130000, interest: 20000, balance: 4870000 },
          { month: 2, payment: 150000, principal: 130500, interest: 19500, balance: 4739500 },
        ],
      },
    });

    render(<LoanCalculator carId={1} carPrice={5000000} />);

    fireEvent.change(screen.getByLabelText(/Сумма кредита/i), { target: { value: '5000000' } });
    fireEvent.change(screen.getByLabelText(/Срок/i), { target: { value: '36' } });
    fireEvent.change(screen.getByLabelText(/Годовая ставка/i), { target: { value: '12' } });
    fireEvent.click(screen.getByText(/Рассчитать/i));

    // Ждём появления заголовка "Ежемесячный платёж:"
    await waitFor(() => {
      expect(screen.getByText(/Ежемесячный платёж:/i)).toBeInTheDocument();
    });

    // Ищем strong с суммой (из-за таблицы не можем искать просто "150000")
    expect(screen.getByText('150000 ₽', { selector: 'strong' })).toBeInTheDocument();

    // Проверяем общую выплату – она тоже разорвана, но сам текст "5400000 ₽" есть в параграфе
    expect(screen.getByText(/Общая выплата:/i)).toBeInTheDocument();
    expect(screen.getByText(/5400000 ₽/)).toBeInTheDocument();
  });

  test('displays error message on API failure', async () => {
    calculateLoan.mockRejectedValue({
      response: { data: { detail: 'Ошибка сервера' } },
    });

    render(<LoanCalculator carId={1} carPrice={5000000} />);
    fireEvent.change(screen.getByLabelText(/Сумма кредита/i), { target: { value: '5000000' } });
    fireEvent.change(screen.getByLabelText(/Срок/i), { target: { value: '36' } });
    fireEvent.change(screen.getByLabelText(/Годовая ставка/i), { target: { value: '12' } });
    fireEvent.click(screen.getByText(/Рассчитать/i));

    await waitFor(() => {
      expect(screen.getByText(/Ошибка сервера/i)).toBeInTheDocument();
    });
  });
});