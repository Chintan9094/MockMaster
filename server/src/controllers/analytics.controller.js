const TestAttempt = require('../models/TestAttempt');
const Topic = require('../models/Topic');
const { asyncHandler } = require('../middleware/errorHandler');
const { getDbUserId, iterateTopicAnalysis } = require('../utils/authUser');

const EMPTY_OVERALL = {
  summary: {
    totalTests: 0,
    totalCorrect: 0,
    totalIncorrect: 0,
    totalQuestions: 0,
    avgPercentage: 0,
    accuracy: 0
  },
  recentAttempts: [],
  progressOverTime: []
};

const EMPTY_TOPICS = {
  topics: [],
  weakTopics: [],
  strongTopics: []
};

function getScore(attempt) {
  return attempt?.score || {};
}

exports.getOverallAnalytics = asyncHandler(async (req, res) => {
  const userId = getDbUserId(req.user);
  if (!userId) {
    return res.json({ success: true, data: EMPTY_OVERALL });
  }

  const attempts = await TestAttempt.find({
    user: userId,
    status: { $in: ['completed', 'timed_out'] }
  }).populate('test', 'title topic chapter');

  const totalTests = attempts.length;
  const totalCorrect = attempts.reduce((sum, a) => sum + (getScore(a).correct || 0), 0);
  const totalIncorrect = attempts.reduce((sum, a) => sum + (getScore(a).incorrect || 0), 0);
  const totalQuestions = attempts.reduce((sum, a) => sum + (getScore(a).total || 0), 0);
  const avgPercentage = totalTests > 0
    ? Math.round(attempts.reduce((sum, a) => sum + (getScore(a).percentage || 0), 0) / totalTests)
    : 0;

  const recentAttempts = attempts.slice(0, 10).map((a) => ({
    id: a._id,
    testTitle: a.test?.title,
    score: getScore(a),
    completedAt: a.completedAt,
    status: a.status,
    tabSwitchCount: a.tabSwitchCount || 0
  }));

  const progressOverTime = attempts
    .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
    .map((a) => ({
      date: a.completedAt,
      percentage: getScore(a).percentage || 0
    }));

  res.json({
    success: true,
    data: {
      summary: {
        totalTests,
        totalCorrect,
        totalIncorrect,
        totalQuestions,
        avgPercentage,
        accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
      },
      recentAttempts,
      progressOverTime
    }
  });
});

exports.getTopicWiseAnalytics = asyncHandler(async (req, res) => {
  const userId = getDbUserId(req.user);
  if (!userId) {
    return res.json({ success: true, data: EMPTY_TOPICS });
  }

  const attempts = await TestAttempt.find({
    user: userId,
    status: { $in: ['completed', 'timed_out'] }
  });

  const topicStats = {};

  attempts.forEach((attempt) => {
    iterateTopicAnalysis(attempt.topicAnalysis, (value, key) => {
      if (!topicStats[key]) {
        topicStats[key] = { correct: 0, incorrect: 0, unanswered: 0, total: 0 };
      }
      topicStats[key].correct += value.correct || 0;
      topicStats[key].incorrect += value.incorrect || 0;
      topicStats[key].unanswered += value.unanswered || 0;
      topicStats[key].total += value.total || 0;
    });
  });

  const topicIds = Object.keys(topicStats);
  if (!topicIds.length) {
    return res.json({ success: true, data: EMPTY_TOPICS });
  }

  const topics = await Topic.find({ _id: { $in: topicIds } }).populate('chapter', 'title number');

  const analysis = topics.map((topic) => {
    const stats = topicStats[topic._id.toString()];
    return {
      topicId: topic._id,
      topicTitle: topic.title,
      chapterTitle: topic.chapter?.title,
      chapterNumber: topic.chapter?.number,
      ...stats,
      percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
    };
  });

  analysis.sort((a, b) => a.percentage - b.percentage);

  res.json({
    success: true,
    data: {
      topics: analysis,
      weakTopics: analysis.filter((a) => a.percentage < 50),
      strongTopics: analysis.filter((a) => a.percentage >= 75)
    }
  });
});

exports.getChapterWiseAnalytics = asyncHandler(async (req, res) => {
  const userId = getDbUserId(req.user);
  if (!userId) {
    return res.json({ success: true, data: [] });
  }

  const attempts = await TestAttempt.find({
    user: userId,
    status: { $in: ['completed', 'timed_out'] }
  }).populate({
    path: 'test',
    select: 'chapter',
    populate: { path: 'chapter', select: 'title number' }
  });

  const chapterStats = {};

  attempts.forEach((attempt) => {
    if (!attempt.test?.chapter) return;
    const chId = attempt.test.chapter._id.toString();
    const score = getScore(attempt);
    if (!chapterStats[chId]) {
      chapterStats[chId] = {
        title: attempt.test.chapter.title,
        number: attempt.test.chapter.number,
        attempts: 0,
        totalCorrect: 0,
        totalQuestions: 0
      };
    }
    chapterStats[chId].attempts++;
    chapterStats[chId].totalCorrect += score.correct || 0;
    chapterStats[chId].totalQuestions += score.total || 0;
  });

  const chapterAnalysis = Object.values(chapterStats).map((ch) => ({
    ...ch,
    percentage: ch.totalQuestions > 0 ? Math.round((ch.totalCorrect / ch.totalQuestions) * 100) : 0
  }));

  chapterAnalysis.sort((a, b) => a.number - b.number);

  res.json({
    success: true,
    data: chapterAnalysis
  });
});
