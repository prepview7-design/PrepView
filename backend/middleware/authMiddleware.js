const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/**
 * protect — verifies JWT stored in HttpOnly cookie.
 * Attaches req.user for downstream controllers.
 */
const protect = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Not authorised — no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

module.exports = { protect };