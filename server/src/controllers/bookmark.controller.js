const Bookmark = require('../models/Bookmark');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

exports.getBookmarks = asyncHandler(async (req, res) => {
  const bookmarks = await Bookmark.find({ user: req.user._id }).sort('-createdAt');
  res.json({ success: true, data: bookmarks });
});

exports.toggleBookmark = asyncHandler(async (req, res) => {
  const { questionId, questionText, options, correctAnswer, explanation, difficulty } = req.body;
  if (!questionId) throw new AppError('questionId is required', 400);

  const existing = await Bookmark.findOne({
    user: req.user._id,
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
    user: req.user._id,
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
  const { questionId } = req.params;
  await Bookmark.deleteOne({ user: req.user._id, questionId });
  res.json({ success: true, message: 'Bookmark removed' });
});

exports.clearBookmarks = asyncHandler(async (req, res) => {
  await Bookmark.deleteMany({ user: req.user._id });
  res.json({ success: true, message: 'All bookmarks cleared' });
});
