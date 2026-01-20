import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getUserById,
  deleteUser,
  getAllReviews,
  deleteReview,
  getAllJournals,
  deleteJournal,
  updateUserRole
} from '../controllers/adminController.js';
import { protect } from '../middleware/auth.js';
import { adminOnly } from '../middleware/adminAuth.js';

const router = express.Router();

// All routes require authentication and admin privileges
router.use(protect);
router.use(adminOnly);

// Dashboard stats
router.get('/stats', getDashboardStats);

// User management
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.delete('/users/:userId', deleteUser);
router.patch('/users/:userId/role', updateUserRole);

// Review management
router.get('/reviews', getAllReviews);
router.delete('/reviews/:reviewId', deleteReview);

// Journal management
router.get('/journals', getAllJournals);
router.delete('/journals/:journalId', deleteJournal);

export default router;
