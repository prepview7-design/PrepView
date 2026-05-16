const express  = require('express');
const passport = require('passport');
const router   = express.Router();

const {
  register,
  login,
  phoneLogin,
  logout,
  getMe,
  oauthCallback,
  updateProfile,
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

// ── Local Auth ────────────────────────────────────────────
router.post('/register',    register);
router.post('/login',       login);
router.post('/phone-login', phoneLogin);
router.post('/logout',      logout);
router.get ('/me',          protect, getMe);
router.put('/profile', protect, updateProfile);

// ── Google OAuth ──────────────────────────────────────────
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  })
);
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
    session: true,
  }),
  oauthCallback
);

// ── Twitter OAuth ─────────────────────────────────────────
router.get('/twitter',
  passport.authenticate('twitter')
);
router.get('/twitter/callback',
  passport.authenticate('twitter', {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
    session: true,
  }),
  oauthCallback
);

module.exports = router;