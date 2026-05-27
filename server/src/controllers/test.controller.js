const Test = require('../models/Test');
const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

exports.getChapters = asyncHandler(async (req, res) => {
  const chapters = await Chapter.find({ isActive: true })
    .populate('topics')
    .sort('number');

  const topicIds = chapters.flatMap((ch) => (ch.topics || []).map((t) => t._id));
  const countRows = topicIds.length
    ? await Question.aggregate([
        { $match: { topic: { $in: topicIds }, isActive: true } },
        { $group: { _id: '$topic', count: { $sum: 1 } } }
      ])
    : [];
  const countByTopic = Object.fromEntries(
    countRows.map((row) => [row._id.toString(), row.count])
  );

  const data = chapters.map((ch) => {
    const doc = ch.toObject();
    doc.topics = (doc.topics || []).map((t) => ({
      ...t,
      questionCount: countByTopic[t._id.toString()] || 0
    }));
    return doc;
  });

  res.json({
    success: true,
    data
  });
});

exports.getChapterTopics = asyncHandler(async (req, res) => {
  const chapter = await Chapter.findById(req.params.chapterId)
    .populate('topics');

  if (!chapter) {
    throw new AppError('Chapter not found', 404);
  }

  const topics = await Topic.find({ chapter: chapter._id, isActive: true });
  const testsPerTopic = await Promise.all(
    topics.map(async (topic) => {
      const tests = await Test.find({ topic: topic._id, isActive: true })
        .select('title duration totalMarks totalQuestions');
      return { topic, tests };
    })
  );

  res.json({
    success: true,
    data: { chapter, topics: testsPerTopic }
  });
});

exports.getTestById = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.testId)
    .populate('topic', 'title')
    .populate('chapter', 'title number');

  if (!test) {
    throw new AppError('Test not found', 404);
  }

  res.json({
    success: true,
    data: test
  });
});

exports.getAllTests = asyncHandler(async (req, res) => {
  const { chapter, topic } = req.query;
  const filter = { isActive: true };
  
  if (chapter) filter.chapter = chapter;
  if (topic) filter.topic = topic;

  const tests = await Test.find(filter)
    .populate('topic', 'title')
    .populate('chapter', 'title number')
    .select('-questions');

  res.json({
    success: true,
    data: tests
  });
});
