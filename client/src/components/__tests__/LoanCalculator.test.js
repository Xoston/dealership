import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoanCalculator from '../LoanCalculator';

describe('LoanCalculator component', () => {
  const renderComponent = () => render(<LoanCalculator />);

  test('renders form elements', () => {
    renderComponent();

    expect(screen.getByLabelText(/Сумма кредита/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Срок/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Процентная ставка/i)).toBeInTheDocument();
    expect(screen.getByText(/Рассчитать/i)).toBeInTheDocument();
  });

  test('calculates and displays loan result', async () => {
    renderComponent();

    fireEvent.change(screen.getByLabelText(/Сумма кредита/i), { target: { value: '5000000' } });
    fireEvent.change(screen.getByLabelText(/Срок/i), { target: { value: '36' } });
    fireEvent.change(screen.getByLabelText(/Процентная ставка/i), { target: { value: '12' } });
    fireEvent.click(screen.getByText(/Рассчитать/i));

    // Ждём появления результата
    expect(await screen.findByText(/Ежемесячный платёж:/i)).toBeInTheDocument();
    // Проверяем наличие "166 072" (форматированное значение)
    const payments = screen.getAllByText(/166\s*072/);
    expect(payments.length).toBeGreaterThan(0);
  });

  test('displays error message on invalid input', async () => {
    renderComponent();

    // Оставляем пустую сумму — должна появиться ошибка
    fireEvent.change(screen.getByLabelText(/Сумма кредита/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/Срок/i), { target: { value: '36' } });
    fireEvent.change(screen.getByLabelText(/Процентная ставка/i), { target: { value: '12' } });
    fireEvent.click(screen.getByText(/Рассчитать/i));

    // Ждём появления сообщения об ошибке
    expect(await screen.findByText(/Пожалуйста, введите корректные параметры расчета/i)).toBeInTheDocument();
  });
}); 