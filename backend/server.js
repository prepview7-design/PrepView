require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const helmet       = require('helmet');
const session      = require('express-session');
const passport     = require('passport');
const connectDB    = require('./config/db');

// Load passport strategies
require('./config/passport');

const authRoutes = require('./routes/authRoutes');
const cvRoutes   = require('./routes/cvRoutes');

connectDB();

const app = express();

// ── Security ───────────────────────────────────────────────
app.use(helmet());

// ── CORS — allow frontend and pass cookies ─────────────────
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

// ── Body & Cookie Parsers ──────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Session (required for Passport OAuth) ─────────────────
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

// ── Passport ───────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/cv',   cvRoutes);

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// ── Global error handler ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));