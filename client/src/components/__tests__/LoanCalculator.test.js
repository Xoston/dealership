import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoanCalculator from '../LoanCalculator';
import api from '../../services/api';

jest.mock('../../services/api');

describe('LoanCalculator component', () => {
  beforeEach(() => {
    api.post.mockClear();
  });

  const renderComponent = () => render(<LoanCalculator />);

  test('renders form elements', () => {
    renderComponent();

    expect(screen.getByLabelText(/Сумма кредита/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Срок/i)).toBeInTheDocument();
    // В компоненте label: "Процентная ставка (%)"
    expect(screen.getByLabelText(/Процентная ставка/i)).toBeInTheDocument();
    expect(screen.getByText(/Рассчитать/i)).toBeInTheDocument();
  });

  test('calculates and displays loan result', async () => {
    const mockResponse = {
      data: {
        monthly_payment: 166071.93,
        total_payment: 5978589.48,
        overpayment: 978589.48,
        schedule: [],
      },
    };
    api.post.mockResolvedValueOnce(mockResponse);

    renderComponent();

    fireEvent.change(screen.getByLabelText(/Сумма кредита/i), { target: { value: '5000000' } });
    fireEvent.change(screen.getByLabelText(/Срок/i), { target: { value: '36' } });
    fireEvent.change(screen.getByLabelText(/Процентная ставка/i), { target: { value: '12' } });
    fireEvent.click(screen.getByText(/Рассчитать/i));

    expect(await screen.findByText(/Ежемесячный платёж:/i)).toBeInTheDocument();
    expect(screen.getByText(/166\s*071\.93/i)).toBeInTheDocument();
  });

  test('displays error message on API failure', async () => {
    api.post.mockRejectedValueOnce(new Error('Network error'));

    renderComponent();

    fireEvent.change(screen.getByLabelText(/Сумма кредита/i), { target: { value: '5000000' } });
    fireEvent.change(screen.getByLabelText(/Срок/i), { target: { value: '36' } });
    fireEvent.change(screen.getByLabelText(/Процентная ставка/i), { target: { value: '12' } });
    fireEvent.click(screen.getByText(/Рассчитать/i));

    await waitFor(() => {
      expect(screen.getByText(/Ошибка при расчёте/i)).toBeInTheDocument();
    });
  });
});