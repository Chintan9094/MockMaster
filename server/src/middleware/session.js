const User = require('../models/User');

const sessionAuth = async (req, res, next) => {
  const sessionId = req.headers['x-session-id'];

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: 'Session ID required'
    });
  }

  try {
    const email = `${sessionId}@psi.io`;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name: 'Student',
        email,
        password: 'session-auto-' + sessionId,
        role: 'student'
      });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error('Session auth error:', err.message);
    next(err);
  }
};

module.exports = { sessionAuth };
