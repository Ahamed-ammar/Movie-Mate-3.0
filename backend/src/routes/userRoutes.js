import express from 'express';
import {
  getUserProfile,
  updateProfile,
  getAllUsers
} from '../controllers/userController.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, getAllUsers);
router.get('/:username', getUserProfile);
router.put('/profile', protect, updateProfile);

export default router;
