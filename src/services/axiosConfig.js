import axios from 'axios';

const API_BASE_URL =
    process.env.REACT_APP_API_URL ||
    (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
        ? '/api'
        : 'https://notion-l9ti.onrender.com/api');

console.log('API_BASE_URL:', API_BASE_URL);

// Create axios instance
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        
        const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
        console.error('API Error:', errorMessage);
        
        return Promise.reject(new Error(errorMessage));
    }
);

export default axiosInstance;