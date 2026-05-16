require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');
const helmet       = require('helmet');
const session      = require('express-session');
const passport     = require('passport');
const connectDB    = require('./config/db');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Load passport strategies
require('./config/passport');

const authRoutes = require('./routes/authRoutes');
const cvRoutes   = require('./routes/cvRoutes');

connectDB();

const app = express();

// ── Security ───────────────────────────────────────────────
app.use(helmet());

// ── Native Rate Limiter ─────────────────────────────────────
const rateLimitMap = new Map();
// Clear limits every 15 minutes
setInterval(() => rateLimitMap.clear(), 15 * 60 * 1000);

const rateLimiter = (maxRequests) => (req, res, next) => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const currentRequests = rateLimitMap.get(ip) || 0;
  
  if (currentRequests >= maxRequests) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }
  
  rateLimitMap.set(ip, currentRequests + 1);
  next();
};

// Apply a global limit of 200 requests per 15 minutes for all API routes
app.use('/api', rateLimiter(200));

// ── CORS — allow frontend and pass cookies ─────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ── Microservices Proxy Routes ─────────────────────────────
// Setup proxies BEFORE body parsers so the streams remain intact (crucial for file uploads in avatar_interview)
app.use('/api/appti_round', createProxyMiddleware({
  target: 'http://localhost:8001',
  changeOrigin: true,
  pathRewrite: { '^/api/appti_round': '' }, // Removes /api/appti_round prefix
}));

app.use('/api/avatar_interview', createProxyMiddleware({
  target: 'http://localhost:8002',
  changeOrigin: true,
  pathRewrite: { '^/api/avatar_interview': '' }, // Removes /api/avatar_interview prefix
}));

app.use(
  '/api/compiler',
  createProxyMiddleware({
    target: 'http://localhost:8000',
    changeOrigin: true,

    pathRewrite: {
      '^/api/compiler': '',
    },

    logLevel: 'debug',

    onProxyReq: (proxyReq, req, res) => {
      console.log('Proxying:', req.method, req.url);
    },
  }) 
);

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
const evaluationRoutes = require('./routes/evaluationRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/cv',   cvRoutes);
app.use('/api/evaluations', evaluationRoutes);

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// ── Global error handler ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));