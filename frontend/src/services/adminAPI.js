import api from './api';

export const adminAPI = {
  // Dashboard stats
  getStats: () => api.get('/admin/stats'),

  // User management
  getAllUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (userId) => api.get(`/admin/users/${userId}`),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  updateUserRole: (userId, role) => api.patch(`/admin/users/${userId}/role`, { role }),

  // Review management
  getAllReviews: (params) => api.get('/admin/reviews', { params }),
  deleteReview: (reviewId) => api.delete(`/admin/reviews/${reviewId}`),

  // Journal management
  getAllJournals: (params) => api.get('/admin/journals', { params }),
  deleteJournal: (journalId) => api.delete(`/admin/journals/${journalId}`)
};
