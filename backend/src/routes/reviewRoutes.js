import express from 'express';
import {
  getMovieReviews,
  getUserReviews,
  createReview,
  updateReview,
  deleteReview,
  getPopularReviews,
  likeReview,
  replyToReview
} from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/popular', getPopularReviews);
router.get('/movie/:movieId', getMovieReviews);
router.get('/user/:userId', getUserReviews);
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.post('/:id/like', protect, likeReview);
router.post('/:id/reply', protect, replyToReview);

export default router;
