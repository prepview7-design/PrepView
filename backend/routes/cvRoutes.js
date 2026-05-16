const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();
const User    = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// ── Ensure uploads directory exists ───────────────────────
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ── Multer Storage Config ──────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = `${req.user._id}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// ── POST /api/cv/upload ────────────────────────────────────
router.post('/upload', protect, upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // TODO: Send req.file.path to your FastAPI NLP service
    // const nlpResponse = await axios.post('http://localhost:8000/extract-skills', {
    //   filePath: req.file.path
    // });
    // const skills = nlpResponse.data.skills;

    // Placeholder skills until NLP service is connected
    const extractedSkills = ['JavaScript', 'React', 'Node.js', 'MongoDB'];

    // Delete old CV file if exists
    if (req.user.cvPath && fs.existsSync(req.user.cvPath)) {
      fs.unlinkSync(req.user.cvPath);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        cvPath: req.file.path,
        skills: extractedSkills,
      },
      { new: true }
    ).select('-password');

    res.json({
      message: 'CV uploaded and scanned successfully',
      skills:  extractedSkills,
      user:    updatedUser,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/cv/download ───────────────────────────────────
router.get('/download', protect, (req, res) => {
  if (!req.user.cvPath || !fs.existsSync(req.user.cvPath)) {
    return res.status(404).json({ message: 'No CV found' });
  }
  res.download(req.user.cvPath);
});

module.exports = router;