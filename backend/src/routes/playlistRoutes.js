import express from 'express';
import {
  getPlaylists,
  getUserPlaylists,
  getPlaylist,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addMoviesToPlaylist,
  removeMovieFromPlaylist
} from '../controllers/playlistController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get user playlists (public route for viewing other users' playlists)
router.get('/user/:userId', getUserPlaylists);

// All other routes require authentication
router.use(protect);

router.get('/', getPlaylists);
router.get('/:id', getPlaylist);
router.post('/', createPlaylist);
router.put('/:id', updatePlaylist);
router.delete('/:id', deletePlaylist);
router.post('/:id/movies', addMoviesToPlaylist);
router.delete('/:id/movies/:movieId', removeMovieFromPlaylist);

export default router;
