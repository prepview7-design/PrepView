const TestResult = require('../models/TestResult');
const InterviewResult = require('../models/InterviewResult');
const User = require('../models/User');

// @desc    Evaluate Aptitude Test & Save
// @route   POST /api/evaluations/aptitude
// @access  Private
exports.evaluateAptitude = async (req, res) => {
  try {
    const { difficulty, questions, answers, company } = req.body;

    // 1. Call Python Microservice
    const response = await fetch('http://localhost:8001/api/evaluate-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulty, questions, answers }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ message: errorData.detail || 'Python Evaluation Failed' });
    }

    const evaluationData = await response.json();

    // 2. Save Result to MongoDB
    const result = await TestResult.create({
      user: req.user._id, // Assuming req.user is populated by auth middleware
      company: company || 'Unknown',
      difficulty: difficulty || 'Medium',
      score: evaluationData.score,
      total: evaluationData.total,
      feedback_summary: evaluationData.feedback_summary,
      detailed_results: evaluationData.detailed_results,
    });

    // 3. Update User Placement Score (Simple logic: add score)
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { placementScore: evaluationData.score }
    });

    // 4. Return to Frontend
    res.status(200).json(evaluationData);
  } catch (error) {
    console.error('evaluateAptitude Error:', error);
    res.status(500).json({ message: 'Server Error during aptitude evaluation' });
  }
};

// @desc    Evaluate Avatar Interview & Save
// @route   POST /api/evaluations/interview
// @access  Private
exports.evaluateInterview = async (req, res) => {
  try {
    const { session_id, role } = req.body;

    if (!session_id) {
      return res.status(400).json({ message: 'session_id is required' });
    }

    // 1. Call Python Microservice using URLSearchParams for Form data
    const formData = new URLSearchParams();
    formData.append('session_id', session_id);

    const response = await fetch('http://localhost:8002/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ message: errorData.detail || 'Python Evaluation Failed' });
    }

    const evaluationData = await response.json();

    // 2. Save Result to MongoDB
    await InterviewResult.create({
      user: req.user._id,
      role: role || 'Unknown Role',
      probability_of_selection: evaluationData.probability_of_selection,
      feedback: evaluationData.feedback,
    });

    // 3. Update User Placement Score (Simple logic: extract percentage and add)
    const probMatch = evaluationData.probability_of_selection.match(/\d+/);
    if (probMatch) {
      const scoreToAdd = parseInt(probMatch[0], 10);
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { placementScore: scoreToAdd }
      });
    }

    // 4. Return to Frontend
    res.status(200).json(evaluationData);
  } catch (error) {
    console.error('evaluateInterview Error:', error);
    res.status(500).json({ message: 'Server Error during interview evaluation' });
  }
};
