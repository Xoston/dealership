import api from './api';

export const getCars = (params) => api.get('/cars/', { params });
export const getCar = (id) => api.get(`/cars/${id}`);
export const createCar = (data) => api.post('/cars/', data);
export const updateCar = (id, data) => api.put(`/cars/${id}`, data);
export const deleteCar = (id) => api.delete(`/cars/${id}`);