const TestAttempt = require('../models/TestAttempt');
const Topic = require('../models/Topic');
const Chapter = require('../models/Chapter');
const { asyncHandler } = require('../middleware/errorHandler');

exports.getOverallAnalytics = asyncHandler(async (req, res) => {
  const attempts = await TestAttempt.find({
    user: req.user._id,
    status: { $in: ['completed', 'timed_out'] }
  }).populate('test', 'title topic chapter');

  const totalTests = attempts.length;
  const totalCorrect = attempts.reduce((sum, a) => sum + a.score.correct, 0);
  const totalIncorrect = attempts.reduce((sum, a) => sum + a.score.incorrect, 0);
  const totalQuestions = attempts.reduce((sum, a) => sum + a.score.total, 0);
  const avgPercentage = totalTests > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.score.percentage, 0) / totalTests)
    : 0;

  const recentAttempts = attempts.slice(0, 10).map(a => ({
    id: a._id,
    testTitle: a.test?.title,
    score: a.score,
    completedAt: a.completedAt,
    status: a.status,
    tabSwitchCount: a.tabSwitchCount || 0
  }));

  const progressOverTime = attempts
    .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt))
    .map(a => ({
      date: a.completedAt,
      percentage: a.score.percentage
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
  const attempts = await TestAttempt.find({
    user: req.user._id,
    status: { $in: ['completed', 'timed_out'] }
  });

  const topicStats = {};

  attempts.forEach(attempt => {
    if (attempt.topicAnalysis) {
      attempt.topicAnalysis.forEach((value, key) => {
        if (!topicStats[key]) {
          topicStats[key] = { correct: 0, incorrect: 0, unanswered: 0, total: 0 };
        }
        topicStats[key].correct += value.correct;
        topicStats[key].incorrect += value.incorrect;
        topicStats[key].unanswered += value.unanswered;
        topicStats[key].total += value.total;
      });
    }
  });

  const topicIds = Object.keys(topicStats);
  const topics = await Topic.find({ _id: { $in: topicIds } }).populate('chapter', 'title number');

  const analysis = topics.map(topic => {
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

  const weakTopics = analysis.filter(a => a.percentage < 50);
  const strongTopics = analysis.filter(a => a.percentage >= 75);

  res.json({
    success: true,
    data: {
      topics: analysis,
      weakTopics,
      strongTopics
    }
  });
});

exports.getChapterWiseAnalytics = asyncHandler(async (req, res) => {
  const attempts = await TestAttempt.find({
    user: req.user._id,
    status: { $in: ['completed', 'timed_out'] }
  }).populate({
    path: 'test',
    select: 'chapter',
    populate: { path: 'chapter', select: 'title number' }
  });

  const chapterStats = {};

  attempts.forEach(attempt => {
    if (!attempt.test?.chapter) return;
    const chId = attempt.test.chapter._id.toString();
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
    chapterStats[chId].totalCorrect += attempt.score.correct;
    chapterStats[chId].totalQuestions += attempt.score.total;
  });

  const chapterAnalysis = Object.values(chapterStats).map(ch => ({
    ...ch,
    percentage: ch.totalQuestions > 0 ? Math.round((ch.totalCorrect / ch.totalQuestions) * 100) : 0
  }));

  chapterAnalysis.sort((a, b) => a.number - b.number);

  res.json({
    success: true,
    data: chapterAnalysis
  });
});
