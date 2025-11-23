import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const productsAPI = {
  getAll: (filters = {}, pagination = {}, sorting = {}) => {
    const params = new URLSearchParams();
    if (filters.name) params.append('name', filters.name);
    if (filters.category) params.append('category', filters.category);
    if (filters.brand) params.append('brand', filters.brand);
    if (filters.status) params.append('status', filters.status);
    if (pagination.page) params.append('page', pagination.page);
    if (pagination.limit) params.append('limit', pagination.limit);
    if (sorting.sortBy) params.append('sortBy', sorting.sortBy);
    if (sorting.sortOrder) params.append('sortOrder', sorting.sortOrder);
    return api.get(`/api/products?${params.toString()}`);
  },

  search: (name) => {
    return api.get(`/api/products/search?name=${encodeURIComponent(name)}`);
  },

  update: (id, data) => {
    return api.put(`/api/products/${id}`, data);
  },

  delete: (id) => {
    return api.delete(`/api/products/${id}`);
  },

  import: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/products/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  export: () => {
    return api.get('/api/products/export', {
      responseType: 'blob',
    });
  },

  getHistory: (id) => {
    return api.get(`/api/products/${id}/history`);
  },

  create: (data) => {
    return api.post('/api/products', data);
  },
};

export const authAPI = {
  login: (credentials) => {
    return api.post('/api/auth/login', credentials);
  },
  register: (userData) => {
    return api.post('/api/auth/register', userData);
  },
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;


