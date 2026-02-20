import axios, { InternalAxiosRequestConfig } from 'axios';
import { getCookie } from 'cookies-next';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getCookie('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    return response.data.data;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'Error';
    return Promise.reject(String(message));
  }
);

export default api;