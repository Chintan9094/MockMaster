const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

function normalizeEmail(email = '') {
  return String(email).trim().toLowerCase();
}

function signAdminToken() {
  return jwt.sign(
    {
      isAdmin: true,
      adminEmail: normalizeEmail(process.env.ADMIN_EMAIL)
    },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
}

function authResponse(user, token) {
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
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
    role: 'student'
  });

  const token = user.generateToken();
  res.status(201).json({
    success: true,
    data: authResponse(user, token)
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required', 400);

  const normalizedEmail = normalizeEmail(email);
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL);
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword && normalizedEmail === adminEmail && password === adminPassword) {
    const token = signAdminToken();
    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: 'env-admin',
          name: 'Admin',
          email: adminEmail,
          role: 'admin'
        }
      }
    });
  }

  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user) throw new AppError('Invalid email or password', 401);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError('Invalid email or password', 401);

  const token = user.generateToken();
  res.json({
    success: true,
    data: authResponse(user, token)
  });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    }
  });
});
