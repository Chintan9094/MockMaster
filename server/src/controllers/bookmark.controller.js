const Bookmark = require('../models/Bookmark');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { getDbUserId } = require('../utils/authUser');

exports.getBookmarks = asyncHandler(async (req, res) => {
  const userId = getDbUserId(req.user);
  if (!userId) {
    return res.json({ success: true, data: [] });
  }

  const bookmarks = await Bookmark.find({ user: userId }).sort('-createdAt');
  res.json({ success: true, data: bookmarks });
});

exports.toggleBookmark = asyncHandler(async (req, res) => {
  const userId = getDbUserId(req.user);
  if (!userId) {
    throw new AppError('Bookmarks are available for registered student accounts only', 400);
  }

  const { questionId, questionText, options, correctAnswer, explanation, difficulty } = req.body;
  if (!questionId) throw new AppError('questionId is required', 400);

  const existing = await Bookmark.findOne({
    user: userId,
    questionId
  });

  if (existing) {
    await existing.deleteOne();
    return res.json({ success: true, data: { bookmarked: false } });
  }

  if (!questionText || !Array.isArray(options) || !correctAnswer) {
    throw new AppError('questionText, options and correctAnswer are required', 400);
  }

  const created = await Bookmark.create({
    user: userId,
    questionId,
    questionText,
    options,
    correctAnswer,
    explanation: explanation || '',
    difficulty: difficulty || 'medium'
  });

  res.status(201).json({
    success: true,
    data: { bookmarked: true, bookmark: created }
  });
});

exports.removeBookmark = asyncHandler(async (req, res) => {
  const userId = getDbUserId(req.user);
  if (!userId) {
    return res.json({ success: true, message: 'Bookmark removed' });
  }

  const { questionId } = req.params;
  await Bookmark.deleteOne({ user: userId, questionId });
  res.json({ success: true, message: 'Bookmark removed' });
});

exports.clearBookmarks = asyncHandler(async (req, res) => {
  const userId = getDbUserId(req.user);
  if (!userId) {
    return res.json({ success: true, message: 'All bookmarks cleared' });
  }

  await Bookmark.deleteMany({ user: userId });
  res.json({ success: true, message: 'All bookmarks cleared' });
});
