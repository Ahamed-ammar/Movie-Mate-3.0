import Journal from '../models/Journal.js';
import Like from '../models/Like.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Get all public journals
// @route   GET /api/journals
// @access  Public
export const getJournals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const skip = (pageNum - 1) * limitNum;

  const query = { isPublic: true };
  const [journals, total] = await Promise.all([
    Journal.find(query)
      .populate('userId', 'username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Journal.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: {
      journals,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      total
    }
  });
});

// @desc    Create a journal
// @route   POST /api/journals
// @access  Private
export const createJournal = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { title, contentHtml, imageUrls, isPublic } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, error: 'Title is required' });
  }

  if (!contentHtml || !contentHtml.trim()) {
    return res.status(400).json({ success: false, error: 'Description is required' });
  }

  const journal = await Journal.create({
    userId,
    title: title.trim(),
    contentHtml,
    imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
    isPublic: isPublic !== undefined ? !!isPublic : true
  });

  await journal.populate('userId', 'username profilePicture');

  res.status(201).json({
    success: true,
    data: { journal }
  });
});

// @desc    Get journal by id
// @route   GET /api/journals/:id
// @access  Public
export const getJournalById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const journal = await Journal.findById(id).populate('userId', 'username profilePicture');
  if (!journal) {
    return res.status(404).json({ success: false, error: 'Journal not found' });
  }
  if (!journal.isPublic) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }
  res.json({ success: true, data: { journal } });
});

// @desc    Get current user's journals with like counts
// @route   GET /api/journals/my
// @access  Private
export const getMyJournals = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { page = 1, limit = 20 } = req.query;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const skip = (pageNum - 1) * limitNum;

  const query = { userId };
  const [journals, total] = await Promise.all([
    Journal.find(query)
      .populate('userId', 'username profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Journal.countDocuments(query)
  ]);

  // Get like counts for all journals
  const journalIds = journals.map(j => j._id);
  const likeCounts = await Like.aggregate([
    { $match: { targetType: 'journal', targetId: { $in: journalIds } } },
    { $group: { _id: '$targetId', count: { $sum: 1 } } }
  ]);

  const likeMap = {};
  likeCounts.forEach(lc => {
    likeMap[lc._id.toString()] = lc.count;
  });

  const journalsWithLikes = journals.map(j => ({
    ...j.toObject(),
    likesCount: likeMap[j._id.toString()] || 0
  }));

  res.json({
    success: true,
    data: {
      journals: journalsWithLikes,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      total
    }
  });
});

// @desc    Delete a journal
// @route   DELETE /api/journals/:id
// @access  Private
export const deleteJournal = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  const journal = await Journal.findById(id);
  if (!journal) {
    return res.status(404).json({ success: false, error: 'Journal not found' });
  }

  // Check ownership
  if (journal.userId.toString() !== userId) {
    return res.status(403).json({ success: false, error: 'You can only delete your own journals' });
  }

  // Delete associated likes
  await Like.deleteMany({ targetType: 'journal', targetId: id });

  // Delete the journal
  await journal.deleteOne();

  res.json({
    success: true,
    message: 'Journal deleted successfully'
  });
});

