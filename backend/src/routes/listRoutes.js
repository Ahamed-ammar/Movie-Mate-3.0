import express from 'express';
import {
  getAllLists,
  getList,
  addToList,
  updateListEntry,
  removeFromList
} from '../controllers/listController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All list routes require authentication
router.use(protect);

router.get('/', getAllLists);
router.get('/:type', getList);
router.post('/', addToList);
router.put('/:id', updateListEntry);
router.delete('/:id', removeFromList);

export default router;
