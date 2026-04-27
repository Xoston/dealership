import api from './api';

export const createTestDrive = (data) => api.post('/testdrives/', data);
export const getMyTestDrives = () => api.get('/testdrives/my');
export const getAllTestDrives = () => api.get('/testdrives/all');