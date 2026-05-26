const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const Test = require('../models/Test');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

exports.addChapter = asyncHandler(async (req, res) => {
  const { number, title } = req.body;
  if (!number || !title) throw new AppError('Number and title are required', 400);

  const chapter = await Chapter.create({ number, title, topics: [] });
  res.status(201).json({ success: true, data: chapter });
});

exports.addTopic = asyncHandler(async (req, res) => {
  const { title, chapterId, duration } = req.body;
  if (!title || !chapterId) throw new AppError('Title and chapterId are required', 400);

  const chapter = await Chapter.findById(chapterId);
  if (!chapter) throw new AppError('Chapter not found', 404);

  const topic = await Topic.create({ title, chapter: chapterId, duration: duration || 10 });
  chapter.topics.push(topic._id);
  await chapter.save();

  res.status(201).json({ success: true, data: topic });
});

exports.addQuestions = asyncHandler(async (req, res) => {
  const { topicId, chapterId, questions } = req.body;
  if (!topicId || !chapterId || !questions?.length) {
    throw new AppError('topicId, chapterId, and questions array are required', 400);
  }

  const questionsToInsert = questions.map((q) => ({
    questionText: q.questionText,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation || '',
    topic: topicId,
    chapter: chapterId,
    difficulty: q.difficulty || 'medium',
    marks: q.marks || 1,
    negativeMarks: q.negativeMarks || 0.25
  }));

  const inserted = await Question.insertMany(questionsToInsert);
  res.status(201).json({
    success: true,
    message: `${inserted.length} questions added`,
    data: inserted
  });
});

exports.createTest = asyncHandler(async (req, res) => {
  const { title, topicId, chapterId, duration, negativeMarking } = req.body;
  if (!title || !topicId || !chapterId) {
    throw new AppError('title, topicId, and chapterId are required', 400);
  }

  const questions = await Question.find({ topic: topicId, isActive: true });
  if (!questions.length) throw new AppError('No questions found for this topic', 400);

  let test = await Test.findOne({ topic: topicId });
  if (test) {
    test.title = title;
    test.questions = questions.map(q => q._id);
    test.totalMarks = questions.length;
    test.totalQuestions = questions.length;
    test.duration = duration || test.duration;
    await test.save();
  } else {
    test = await Test.create({
      title,
      topic: topicId,
      chapter: chapterId,
      questions: questions.map(q => q._id),
      duration: duration || 10,
      totalMarks: questions.length,
      totalQuestions: questions.length,
      negativeMarking: negativeMarking !== false,
      negativeMarkValue: 0.25,
      randomizeQuestions: true
    });
  }

  res.status(201).json({ success: true, data: test });
});

exports.deleteChapter = asyncHandler(async (req, res) => {
  const chapter = await Chapter.findById(req.params.id);
  if (!chapter) throw new AppError('Chapter not found', 404);

  await Topic.deleteMany({ chapter: chapter._id });
  await Question.deleteMany({ chapter: chapter._id });
  await Test.deleteMany({ chapter: chapter._id });
  await Chapter.findByIdAndDelete(chapter._id);

  res.json({ success: true, message: 'Chapter and all related data deleted' });
});

exports.deleteTopic = asyncHandler(async (req, res) => {
  const topic = await Topic.findById(req.params.id);
  if (!topic) throw new AppError('Topic not found', 404);

  await Question.deleteMany({ topic: topic._id });
  await Test.deleteMany({ topic: topic._id });
  await Chapter.findByIdAndUpdate(topic.chapter, { $pull: { topics: topic._id } });
  await Topic.findByIdAndDelete(topic._id);

  res.json({ success: true, message: 'Topic and all related data deleted' });
});
