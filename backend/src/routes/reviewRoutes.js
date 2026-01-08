import express from 'express';
import {
  getMovieReviews,
  getUserReviews,
  createReview,
  updateReview,
  deleteReview
} from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/movie/:movieId', getMovieReviews);
router.get('/user/:userId', getUserReviews);
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

export default router;
