const TestResult = require('../models/TestResult');
const InterviewResult = require('../models/InterviewResult');
const User = require('../models/User');

// @desc    Evaluate Aptitude Test & Save
// @route   POST /api/evaluations/aptitude
// @access  Private
const updateUserActivity = async (userId, scoreToAdd = 0) => {
  const user = await User.findById(userId);

  if (!user) return;

  const today = new Date();

  const lastActive = user.lastActive
    ? new Date(user.lastActive)
    : null;

  let streak = user.streak || 0;

  // Normalize dates
  today.setHours(0,0,0,0);

  if (lastActive) {
    lastActive.setHours(0,0,0,0);

    const diffDays =
      Math.floor(
        (today - lastActive) /
        (1000 * 60 * 60 * 24)
      );

    if (diffDays === 0) {
  // Same-day activity
  streak = streak || 1;
}
else if (diffDays === 1) {
  // Consecutive-day activity
  streak += 1;
}
else if (diffDays > 1) {
  // Missed days → reset streak
  streak = 1;
}
  } else {
    streak = 1;
  }

  // Badge Logic
  const badges = [...user.badges];

  if (streak >= 7 && !badges.includes('7 Day Streak')) {
    badges.push('7 Day Streak');
  }

  if (streak >= 30 && !badges.includes('30 Day Streak')) {
    badges.push('30 Day Streak');
  }

  await User.findByIdAndUpdate(userId, {
    streak,
    lastActive: new Date(),
    badges,
    $inc: {
      placementScore: scoreToAdd,
    },
  });
};
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
      user: req.user._id,
      company: company || 'Unknown',
      difficulty: difficulty || 'Medium',

      score: evaluationData.total_score,
      total: evaluationData.max_score,

      feedback_summary: evaluationData.summary,

      detailed_results: evaluationData.results,
    });

    // 3. Update User Placement Score (Simple logic: add score)
      await updateUserActivity(
        req.user._id,
        evaluationData.total_score
      );

      await User.findByIdAndUpdate(
        req.user._id,
        {
          $inc: {
            totalPractices: 1,
            aptitudeTestsTaken: 1,
          },
        }
      );

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
      probability_of_selection:`${evaluationData.probability}%`,
      feedback: evaluationData.feedback,
    });

    // 3. Update User Placement Score (Simple logic: extract percentage and add)
      await updateUserActivity(
        req.user._id,
        evaluationData.probability
      );

      await User.findByIdAndUpdate(
        req.user._id,
        {
          $inc: {
            totalPractices: 1,
            interviewsTaken: 1,
          },
        }
      );

    // 4. Return to Frontend
    res.status(200).json(evaluationData);
  } catch (error) {
    console.error('evaluateInterview Error:', error);
    res.status(500).json({ message: 'Server Error during interview evaluation' });
  }
};
