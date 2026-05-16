const User = require('../models/User');
const jwt  = require('jsonwebtoken');

// ── Helper: sign JWT and set HttpOnly cookie ───────────────
const sendToken = (res, user, statusCode = 200) => {
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )

  // Set HttpOnly cookie — JS cannot read this, protects against XSS
  res.cookie('token', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });

  res.status(statusCode).json({
    _id:            user._id,
    name:           user.name,
    email:          user.email,
    phone:          user.phone,
    avatar:         user.avatar,
    provider:       user.provider,
    placementScore: user.placementScore,
    streak:         user.streak,
    skills:         user.skills,
    targetRole:     user.targetRole,
  });
};

// ── REGISTER ───────────────────────────────────────────────
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const user = await User.create({
      name,
      email,
      password,
      provider: 'local',
    });

    sendToken(res, user, 201);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── LOGIN ──────────────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email }).select('+password');

    if (!user || !user.password) {
      return res.status(401).json({
        message: 'No account found. Try signing in with Google or Twitter.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    sendToken(res, user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PHONE LOGIN (Firebase verifies OTP client-side) ────────
// Frontend sends: { phone, firebaseUid, name }
exports.phoneLogin = async (req, res) => {
  const { phone, firebaseUid, name } = req.body;

  if (!phone || !firebaseUid) {
    return res.status(400).json({ message: 'Phone and Firebase UID are required' });
  }

  try {
    let user = await User.findOne({ phone });

    if (!user) {
      // First time — create account
      user = await User.create({
        name:     name || 'User',
        phone,
        googleId: firebaseUid, // reuse field to store Firebase UID
        provider: 'phone',
      });
    }

    sendToken(res, user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── LOGOUT ─────────────────────────────────────────────────
exports.logout = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.json({ message: 'Logged out successfully' });
};

// ── GET CURRENT USER ───────────────────────────────────────
exports.getMe = (req, res) => {
  res.json(req.user);
};
// ── UPDATE PROFILE ───────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.college = req.body.college || user.college;
    user.branch = req.body.branch || user.branch;
    user.year = req.body.year || user.year;
    user.targetRole = req.body.targetRole || user.targetRole;

    const updatedUser = await user.save();

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── OAUTH CALLBACK (Google & Twitter) ─────────────────────
// Called after Passport authenticates — sets cookie then redirects
exports.oauthCallback = (req, res) => {
  const token = jwt.sign(
    { id: req.user._id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   7 * 24 * 60 * 60 * 1000,
  });

  // Redirect to frontend home after OAuth
  res.redirect(`${process.env.CLIENT_URL}/home`);
};