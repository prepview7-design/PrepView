const mongoose = require('mongoose');

const TestResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  feedback_summary: {
    type: String,
  },
  detailed_results: [
    {
      question_id: String,
      question_text: String,
      user_answer: String,
      correct_answer: String,
      is_correct: Boolean,
      explanation: String,
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model('TestResult', TestResultSchema);
