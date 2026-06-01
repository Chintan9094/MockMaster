const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    questionText: {
      type: String,
      required: true
    },
    options: {
      type: [
        {
          id: { type: String, required: true },
          text: { type: String, required: true }
        }
      ],
      default: []
    },
    correctAnswer: {
      type: String,
      required: true
    },
    explanation: {
      type: String,
      default: ''
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    }
  },
  { timestamps: true }
);

bookmarkSchema.index({ user: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
