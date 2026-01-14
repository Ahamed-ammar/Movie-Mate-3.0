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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/60e60c1d-154b-42f5-86fd-e42bebca266f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:19',message:'API request interceptor',data:{url:config.url,method:config.method,hasToken:!!localStorage.getItem('accessToken')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/60e60c1d-154b-42f5-86fd-e42bebca266f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:33',message:'API response error',data:{status:error.response?.status,url:error.config?.url,method:error.config?.method,error:error.message,is401:error.response?.status===401,hasRetry:error.config?._retry},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,E'})}).catch(()=>{});
    // #endregion
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/60e60c1d-154b-42f5-86fd-e42bebca266f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:40',message:'Attempting token refresh',data:{url:originalRequest.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        // Try to refresh token
        const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
          withCredentials: true
        });

        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/60e60c1d-154b-42f5-86fd-e42bebca266f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:49',message:'Token refresh successful, retrying request',data:{url:originalRequest.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        return api(originalRequest);
      } catch (refreshError) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/60e60c1d-154b-42f5-86fd-e42bebca266f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:52',message:'Token refresh failed',data:{error:refreshError.message,status:refreshError.response?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
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

// Connections API
export const connectionsAPI = {
  getConnectionStatus: (userId) => api.get(`/connections/status/${userId}`),
  getConnections: () => api.get('/connections'),
  getUserConnections: (userId) => api.get(`/connections/user/${userId}`),
  getPendingRequests: () => api.get('/connections/pending'),
  sendRequest: (userId) => api.post(`/connections/request/${userId}`),
  acceptRequest: (connectionId) => api.put(`/connections/accept/${connectionId}`),
  rejectRequest: (connectionId) => api.delete(`/connections/reject/${connectionId}`),
  removeConnection: (connectionId) => api.delete(`/connections/${connectionId}`)
};

// Playlists API
export const playlistsAPI = {
  getPlaylists: (username) => api.get('/playlists', { params: username ? { username } : {} }),
  getUserPlaylists: (userId) => api.get(`/playlists/user/${userId}`),
  getPlaylist: (id) => api.get(`/playlists/${id}`),
  create: (data) => api.post('/playlists', data),
  update: (id, data) => api.put(`/playlists/${id}`, data),
  delete: (id) => api.delete(`/playlists/${id}`),
  addMovies: (id, movieIds) => api.post(`/playlists/${id}/movies`, { movieIds }),
  removeMovie: (id, movieId) => api.delete(`/playlists/${id}/movies/${movieId}`)
};

export default api;
