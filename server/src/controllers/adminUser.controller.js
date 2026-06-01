const User = require('../models/User');
const TestAttempt = require('../models/TestAttempt');
const Bookmark = require('../models/Bookmark');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

function normalizeEmail(email = '') {
  return String(email).trim().toLowerCase();
}

function formatUser(user, attemptCount = 0) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    attemptCount
  };
}

exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort('-createdAt');
  const attemptCounts = await TestAttempt.aggregate([
    { $group: { _id: '$user', count: { $sum: 1 } } }
  ]);
  const countMap = Object.fromEntries(
    attemptCounts.map((item) => [String(item._id), item.count])
  );

  res.json({
    success: true,
    data: users.map((user) => formatUser(user, countMap[String(user._id)] || 0))
  });
});

exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const normalizedEmail = normalizeEmail(email);
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) throw new AppError('Email is already registered', 409);

  const user = await User.create({
    name: name?.trim() || normalizedEmail.split('@')[0] || 'User',
    email: normalizedEmail,
    password,
    role: role === 'admin' ? 'admin' : 'student'
  });

  res.status(201).json({
    success: true,
    data: formatUser(user, 0)
  });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('+password');
  if (!user) throw new AppError('User not found', 404);

  const { name, email, password, role } = req.body;

  if (email) {
    const normalizedEmail = normalizeEmail(email);
    const duplicate = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: user._id }
    });
    if (duplicate) throw new AppError('Email is already registered', 409);
    user.email = normalizedEmail;
  }

  if (name?.trim()) user.name = name.trim();
  if (role) user.role = role === 'admin' ? 'admin' : 'student';
  if (password?.trim()) user.password = password;

  await user.save();

  const attemptCount = await TestAttempt.countDocuments({ user: user._id });
  res.json({
    success: true,
    data: formatUser(user, attemptCount)
  });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  await Promise.all([
    TestAttempt.deleteMany({ user: user._id }),
    Bookmark.deleteMany({ user: user._id }),
    User.findByIdAndDelete(user._id)
  ]);

  res.json({ success: true, message: 'User deleted' });
});
