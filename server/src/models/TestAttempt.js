const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  selectedAnswer: {
    type: String,
    default: null
  },
  isCorrect: {
    type: Boolean,
    default: null
  },
  markedForReview: {
    type: Boolean,
    default: false
  },
  timeTaken: {
    type: Number,
    default: 0
  }
}, { _id: false });

const testAttemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  answers: [answerSchema],
  questionOrder: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'timed_out', 'abandoned'],
    default: 'in_progress'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  timeRemaining: {
    type: Number,
    default: null
  },
  tabSwitchCount: {
    type: Number,
    default: 0
  },
  score: {
    total: { type: Number, default: 0 },
    correct: { type: Number, default: 0 },
    incorrect: { type: Number, default: 0 },
    unanswered: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    marksObtained: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 }
  },
  topicAnalysis: {
    type: Map,
    of: {
      correct: Number,
      incorrect: Number,
      unanswered: Number,
      total: Number,
      percentage: Number
    },
    default: {}
  }
}, { timestamps: true });

testAttemptSchema.index({ user: 1, test: 1 });
testAttemptSchema.index({ user: 1, status: 1 });
testAttemptSchema.index({ completedAt: -1 });

module.exports = mongoose.model('TestAttempt', testAttemptSchema);
