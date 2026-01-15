import express from 'express';
import { protect } from '../middleware/auth.js';
import { createJournal, getJournalById, getJournals } from '../controllers/journalController.js';

const router = express.Router();

router.get('/', getJournals);
router.post('/', protect, createJournal);
router.get('/:id', getJournalById);

export default router;

