import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle 401 responses
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    verify: () => api.get('/auth/verify'),
};

// Category API
export const categoryAPI = {
    getAll: () => api.get('/categories'),
    getOne: (id) => api.get(`/categories/${id}`),
    create: (data) => api.post('/categories', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    delete: (id) => api.delete(`/categories/${id}`),
};

// SubCategory API
export const subCategoryAPI = {
    getAll: (categoryId) => api.get('/subcategories', { params: { categoryId } }),
    getOne: (id) => api.get(`/subcategories/${id}`),
    create: (data) => api.post('/subcategories', data),
    update: (id, data) => api.put(`/subcategories/${id}`, data),
    delete: (id) => api.delete(`/subcategories/${id}`),
};

// Product API
export const productAPI = {
    getAll: (params) => api.get('/products', { params }),
    getOne: (id) => api.get(`/products/${id}`),
    create: (data) => {
        // If data is FormData, let axios set multipart/form-data automatically
        if (data instanceof FormData) {
            return api.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        }
        return api.post('/products', data);
    },
    update: (id, data) => {
        if (data instanceof FormData) {
            return api.put(`/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        }
        return api.put(`/products/${id}`, data);
    },
    delete: (id) => api.delete(`/products/${id}`),
};

// Order API
export const orderAPI = {
    getAll: (params) => api.get('/orders', { params }),
    getOne: (id) => api.get(`/orders/${id}`),
    create: (data) => api.post('/orders', data),
    update: (id, data) => api.put(`/orders/${id}`, data),
    delete: (id) => api.delete(`/orders/${id}`),
};

// Coupon API
export const couponAPI = {
    getAll: () => api.get('/coupons'),
    getOne: (id) => api.get(`/coupons/${id}`),
    create: (data) => api.post('/coupons', data),
    update: (id, data) => api.put(`/coupons/${id}`, data),
    delete: (id) => api.delete(`/coupons/${id}`),
    validate: (data) => api.post('/coupons/validate', data),
    apply: (data) => api.post('/coupons/apply', data),
    getStats: (id) => api.get(`/coupons/${id}/stats`),
};

// Offer Image API
export const offerImageAPI = {
    getAll: () => api.get('/offer-images'),
    getOne: (id) => api.get(`/offer-images/${id}`),
    create: (data) => {
        if (data instanceof FormData) {
            return api.post('/offer-images', data, { headers: { 'Content-Type': 'multipart/form-data' } });
        }
        return api.post('/offer-images', data);
    },
    update: (id, data) => {
        if (data instanceof FormData) {
            return api.put(`/offer-images/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
        }
        return api.put(`/offer-images/${id}`, data);
    },
    delete: (id) => api.delete(`/offer-images/${id}`),
};

export default api;
