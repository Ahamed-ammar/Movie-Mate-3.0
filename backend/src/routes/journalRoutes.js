import express from 'express';
import { protect } from '../middleware/auth.js';
import { createJournal, deleteJournal, getJournalById, getJournals, getMyJournals } from '../controllers/journalController.js';

const router = express.Router();

router.get('/', getJournals);
router.post('/', protect, createJournal);
router.get('/my', protect, getMyJournals);
router.get('/:id', getJournalById);
router.delete('/:id', protect, deleteJournal);

export default router;

