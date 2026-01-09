import express from 'express';
import {
  searchMoviesHandler,
  getMovieById,
  cacheMovie,
  getTrending,
  getPopular,
  getByGenre,
  getByYear,
  getGenresList,
  getProvidersList,
  getByProvider,
  getByFilter
} from '../controllers/movieController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/search', searchMoviesHandler);
router.get('/trending', getTrending);
router.get('/popular', getPopular);
router.get('/genres', getGenresList);
router.get('/providers', getProvidersList);
router.get('/genre/:genreId', getByGenre);
router.get('/year/:year', getByYear);
router.get('/provider/:providerId', getByProvider);
router.get('/filter/:filterType', getByFilter);
router.get('/:id', getMovieById);
router.post('/cache', protect, cacheMovie);

export default router;
