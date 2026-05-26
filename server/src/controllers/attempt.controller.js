const TestAttempt = require('../models/TestAttempt');
const Test = require('../models/Test');
const Question = require('../models/Question');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

exports.startTest = asyncHandler(async (req, res) => {
  const { testId } = req.params;
  const test = await Test.findById(testId).populate('questions');

  if (!test) throw new AppError('Test not found', 404);

  // Find ALL in_progress attempts for this user+test
  const existingAttempts = await TestAttempt.find({
    user: req.user._id,
    test: testId,
    status: 'in_progress'
  }).sort('-createdAt');

  const now = new Date();
  const durationMs = test.duration * 60 * 1000;
  let validAttempt = null;

  for (const attempt of existingAttempts) {
    const expiryTime = new Date(attempt.createdAt.getTime() + durationMs);
    const actualRemaining = Math.max(0, Math.floor((expiryTime - now) / 1000));

    if (actualRemaining <= 0) {
      // Expired — mark as timed_out
      attempt.status = 'timed_out';
      attempt.completedAt = now;
      attempt.timeRemaining = 0;
      await attempt.save();
    } else if (!validAttempt) {
      // Keep the most recent valid one
      attempt.timeRemaining = actualRemaining;
      await attempt.save();
      validAttempt = attempt;
    } else {
      // Duplicate — abandon extras
      attempt.status = 'abandoned';
      attempt.completedAt = now;
      await attempt.save();
    }
  }

  if (validAttempt) {
    const populatedAttempt = await TestAttempt.findById(validAttempt._id)
      .populate({
        path: 'questionOrder',
        select: 'questionText options difficulty marks'
      });

    return res.json({
      success: true,
      data: populatedAttempt,
      resumed: true
    });
  }

  let questionOrder = test.questions.map(q => q._id);
  if (test.randomizeQuestions) {
    questionOrder = shuffleArray(questionOrder);
  }

  const answers = questionOrder.map(qId => ({
    question: qId,
    selectedAnswer: null,
    isCorrect: null,
    markedForReview: false,
    timeTaken: 0
  }));

  const attempt = await TestAttempt.create({
    user: req.user._id,
    test: testId,
    answers,
    questionOrder,
    timeRemaining: test.duration * 60,
    currentQuestionIndex: 0
  });

  const populatedAttempt = await TestAttempt.findById(attempt._id)
    .populate({
      path: 'questionOrder',
      select: 'questionText options difficulty marks'
    });

  res.status(201).json({
    success: true,
    data: populatedAttempt,
    resumed: false
  });
});

exports.saveAnswer = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { questionIndex, selectedAnswer, markedForReview, timeTaken } = req.body;

  const attempt = await TestAttempt.findOne({
    _id: attemptId,
    user: req.user._id,
    status: 'in_progress'
  });

  if (!attempt) throw new AppError('Active attempt not found', 404);

  if (questionIndex >= 0 && questionIndex < attempt.answers.length) {
    if (selectedAnswer !== undefined) {
      attempt.answers[questionIndex].selectedAnswer = selectedAnswer;
    }
    if (markedForReview !== undefined) {
      attempt.answers[questionIndex].markedForReview = markedForReview;
    }
    if (timeTaken !== undefined) {
      attempt.answers[questionIndex].timeTaken = timeTaken;
    }
  }

  await attempt.save();

  res.json({ success: true, message: 'Answer saved' });
});

exports.updateProgress = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { currentQuestionIndex, timeRemaining, tabSwitchCount } = req.body;

  const attempt = await TestAttempt.findOne({
    _id: attemptId,
    user: req.user._id,
    status: 'in_progress'
  });

  if (!attempt) throw new AppError('Active attempt not found', 404);

  if (currentQuestionIndex !== undefined) attempt.currentQuestionIndex = currentQuestionIndex;
  if (timeRemaining !== undefined) attempt.timeRemaining = timeRemaining;
  if (tabSwitchCount !== undefined) attempt.tabSwitchCount = tabSwitchCount;

  await attempt.save();

  res.json({ success: true, message: 'Progress updated' });
});

exports.submitTest = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const { timedOut } = req.body;

  const attempt = await TestAttempt.findOne({
    _id: attemptId,
    user: req.user._id,
    status: 'in_progress'
  }).populate({
    path: 'questionOrder',
    select: 'correctAnswer marks topic'
  });

  if (!attempt) throw new AppError('Active attempt not found', 404);

  const test = await Test.findById(attempt.test);
  let correct = 0, incorrect = 0, unanswered = 0;
  let marksObtained = 0;
  const topicAnalysis = {};

  attempt.answers.forEach((answer, idx) => {
    const question = attempt.questionOrder[idx];
    if (!question) return;

    const topicId = question.topic.toString();
    if (!topicAnalysis[topicId]) {
      topicAnalysis[topicId] = { correct: 0, incorrect: 0, unanswered: 0, total: 0, percentage: 0 };
    }
    topicAnalysis[topicId].total++;

    if (!answer.selectedAnswer) {
      unanswered++;
      topicAnalysis[topicId].unanswered++;
      answer.isCorrect = null;
    } else if (answer.selectedAnswer === question.correctAnswer) {
      correct++;
      marksObtained += question.marks;
      topicAnalysis[topicId].correct++;
      answer.isCorrect = true;
    } else {
      incorrect++;
      topicAnalysis[topicId].incorrect++;
      answer.isCorrect = false;
    }
  });

  Object.keys(topicAnalysis).forEach(topicId => {
    const t = topicAnalysis[topicId];
    t.percentage = t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0;
  });

  attempt.score = {
    total: attempt.answers.length,
    correct,
    incorrect,
    unanswered,
    percentage: Math.round((correct / attempt.answers.length) * 100),
    marksObtained,
    totalMarks: test.totalMarks
  };

  attempt.topicAnalysis = topicAnalysis;
  attempt.status = timedOut ? 'timed_out' : 'completed';
  attempt.completedAt = new Date();
  attempt.timeRemaining = 0;

  await attempt.save();

  res.json({
    success: true,
    data: attempt
  });
});

exports.getAttemptResult = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;

  const attempt = await TestAttempt.findOne({
    _id: attemptId,
    user: req.user._id
  })
    .populate({
      path: 'questionOrder',
      select: 'questionText options correctAnswer explanation difficulty marks topic'
    })
    .populate({
      path: 'test',
      select: 'title duration totalMarks totalQuestions'
    });

  if (!attempt) throw new AppError('Attempt not found', 404);

  res.json({
    success: true,
    data: attempt
  });
});

exports.getMyAttempts = asyncHandler(async (req, res) => {
  const { testId } = req.query;
  const filter = { user: req.user._id };
  if (testId) filter.test = testId;

  const attempts = await TestAttempt.find(filter)
    .populate('test', 'title duration totalMarks totalQuestions')
    .sort('-createdAt');

  res.json({
    success: true,
    data: attempts
  });
});

exports.getIncompleteAttempts = asyncHandler(async (req, res) => {
  const allInProgress = await TestAttempt.find({
    user: req.user._id,
    status: 'in_progress'
  })
    .populate('test', 'title duration totalMarks')
    .sort('-updatedAt');

  const now = new Date();
  const validAttempts = [];
  const invalidIds = [];

  // Check which tests user has already completed
  const completedTests = await TestAttempt.find({
    user: req.user._id,
    status: { $in: ['completed', 'timed_out'] }
  }).select('test completedAt').sort('-completedAt');

  const completedTestMap = {};
  for (const ct of completedTests) {
    if (!completedTestMap[ct.test.toString()]) {
      completedTestMap[ct.test.toString()] = ct.completedAt;
    }
  }

  for (const attempt of allInProgress) {
    const durationMs = (attempt.test?.duration || 10) * 60 * 1000;
    const expiryTime = new Date(attempt.createdAt.getTime() + durationMs);
    const actualRemaining = Math.max(0, Math.floor((expiryTime - now) / 1000));

    // If time expired OR if user already completed/submitted this test AFTER this attempt started
    const testId = attempt.test?._id?.toString();
    const completedAfter = completedTestMap[testId];
    const isAlreadyCompleted = completedAfter && completedAfter > attempt.createdAt;

    if (actualRemaining <= 0 || isAlreadyCompleted) {
      invalidIds.push(attempt._id);
    } else {
      attempt.timeRemaining = actualRemaining;
      validAttempts.push(attempt);
    }
  }

  // Clean up invalid ones
  if (invalidIds.length) {
    await TestAttempt.updateMany(
      { _id: { $in: invalidIds } },
      { status: 'timed_out', completedAt: now, timeRemaining: 0 }
    );
  }

  res.json({
    success: true,
    data: validAttempts
  });
});

exports.abandonAttempt = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const attempt = await TestAttempt.findOne({
    _id: attemptId,
    user: req.user._id,
    status: 'in_progress'
  });

  if (!attempt) throw new AppError('Attempt not found', 404);

  attempt.status = 'abandoned';
  attempt.completedAt = new Date();
  await attempt.save();

  res.json({ success: true, message: 'Attempt abandoned' });
});

exports.abandonAllIncomplete = asyncHandler(async (req, res) => {
  await TestAttempt.updateMany(
    { user: req.user._id, status: 'in_progress' },
    { status: 'abandoned', completedAt: new Date() }
  );

  res.json({ success: true, message: 'All incomplete attempts cleared' });
});
