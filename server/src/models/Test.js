const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  topic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    required: true
  },
  chapter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter',
    required: true
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  duration: {
    type: Number,
    required: true,
    default: 20
  },
  totalMarks: {
    type: Number,
    required: true,
    default: 20
  },
  totalQuestions: {
    type: Number,
    required: true,
    default: 20
  },
  randomizeQuestions: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

testSchema.index({ topic: 1 });
testSchema.index({ chapter: 1 });

module.exports = mongoose.model('Test', testSchema);
