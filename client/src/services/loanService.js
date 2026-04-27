import api from './api';

export const calculateLoan = (data) => api.post('/loans/calculate', data);
export const getMyLoans = () => api.get('/loans/my');