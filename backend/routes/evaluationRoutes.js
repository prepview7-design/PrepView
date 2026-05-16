const express = require('express');
const router = express.Router();
const { evaluateAptitude, evaluateInterview } = require('../controllers/evaluationController');
const { protect } = require('../middleware/authMiddleware');

// Route: /api/evaluations/aptitude
router.post('/aptitude', protect, evaluateAptitude);

// Route: /api/evaluations/interview
router.post('/interview', protect, evaluateInterview);

module.exports = router;
