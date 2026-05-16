const mongoose = require('mongoose');

const InterviewResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  probability_of_selection: {
    type: String,
    required: true,
  },
  feedback: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('InterviewResult', InterviewResultSchema);
