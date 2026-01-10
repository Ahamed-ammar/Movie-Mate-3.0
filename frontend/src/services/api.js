import axios from 'axios';
import { API_URL } from '../utils/constants.js';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 second timeout
});

// Log API URL on initialization
console.log('API Base URL:', API_URL || 'Not configured - check VITE_API_URL in .env');

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
          withCredentials: true
        });

        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh')
};

// Movies API
export const moviesAPI = {
  search: (query, page = 1) => api.get('/movies/search', { params: { query, page } }),
  getById: (id) => api.get(`/movies/${id}`),
  getTrending: (timeWindow = 'day', page = 1) => api.get('/movies/trending', { params: { timeWindow, page } }),
  getPopular: (page = 1) => api.get('/movies/popular', { params: { page } }),
  getByGenre: (genreId, page = 1) => api.get(`/movies/genre/${genreId}`, { params: { page } }),
  getByYear: (year, page = 1) => api.get(`/movies/year/${year}`, { params: { page } }),
  getByProvider: (providerId, page = 1) => api.get(`/movies/provider/${providerId}`, { params: { page } }),
  getByFilter: (filterType, page = 1) => api.get(`/movies/filter/${filterType}`, { params: { page } }),
  getGenres: () => api.get('/movies/genres'),
  getProviders: () => api.get('/movies/providers')
};

// Reviews API
export const reviewsAPI = {
  getPopularReviews: (limit = 10) => 
    api.get('/reviews/popular', { params: { limit } }),
  getMovieReviews: (movieId, page = 1, limit = 10) => 
    api.get(`/reviews/movie/${movieId}`, { params: { page, limit } }),
  getUserReviews: (userId, page = 1, limit = 10) => 
    api.get(`/reviews/user/${userId}`, { params: { page, limit } }),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  like: (id) => api.post(`/reviews/${id}/like`),
  reply: (id, reviewText) => api.post(`/reviews/${id}/reply`, { reviewText })
};

// Lists API
export const listsAPI = {
  getAll: () => api.get('/lists'),
  getList: (type) => api.get(`/lists/${type}`),
  add: (data) => api.post('/lists', data),
  update: (id, data) => api.put(`/lists/${id}`, data),
  remove: (id) => api.delete(`/lists/${id}`)
};

// Users API
export const usersAPI = {
  getProfile: (username) => api.get(`/users/${username}`),
  updateProfile: (data) => api.put('/users/profile', data)
};

export default api;
