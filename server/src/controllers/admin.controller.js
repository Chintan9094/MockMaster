const Chapter = require('../models/Chapter');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const Test = require('../models/Test');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

async function syncTestForTopic(topicId, chapterId, title, duration) {
  const questions = await Question.find({ topic: topicId, isActive: true });
  const test = await Test.findOne({ topic: topicId });

  if (!questions.length) {
    if (test) await test.deleteOne();
    return null;
  }

  const payload = {
    title: title || test?.title || 'Untitled',
    questions: questions.map((q) => q._id),
    totalMarks: questions.length,
    totalQuestions: questions.length,
    duration: duration ?? test?.duration ?? 10
  };

  if (test) {
    Object.assign(test, payload);
    await test.save();
    return test;
  }

  return Test.create({
    ...payload,
    topic: topicId,
    chapter: chapterId,
    randomizeQuestions: true
  });
}

function formatQuestionPayload(q) {
  return {
    questionText: q.questionText,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation || '',
    difficulty: q.difficulty || 'medium',
    marks: q.marks || 1
  };
}

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
    marks: q.marks || 1
  }));

  const inserted = await Question.insertMany(questionsToInsert);
  res.status(201).json({
    success: true,
    message: `${inserted.length} questions added`,
    data: inserted
  });
});

exports.createTest = asyncHandler(async (req, res) => {
  const { title, topicId, chapterId, duration } = req.body;
  if (!title || !topicId || !chapterId) {
    throw new AppError('title, topicId, and chapterId are required', 400);
  }

  const questions = await Question.find({ topic: topicId, isActive: true });
  if (!questions.length) throw new AppError('No questions found for this topic', 400);

  const test = await syncTestForTopic(topicId, chapterId, title, duration);
  res.status(201).json({ success: true, data: test });
});

exports.getQuestionsByTopic = asyncHandler(async (req, res) => {
  const { topicId } = req.query;
  if (!topicId) throw new AppError('topicId query parameter is required', 400);

  const questions = await Question.find({ topic: topicId, isActive: true })
    .sort({ createdAt: 1 })
    .select('questionText options correctAnswer explanation difficulty marks createdAt');

  res.json({ success: true, data: questions });
});

exports.updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) throw new AppError('Question not found', 404);

  const { questionText, options, correctAnswer, explanation, difficulty, marks } = req.body;
  if (!questionText || !options?.length || !correctAnswer) {
    throw new AppError('questionText, options, and correctAnswer are required', 400);
  }

  Object.assign(question, formatQuestionPayload({
    questionText,
    options,
    correctAnswer,
    explanation,
    difficulty,
    marks
  }));
  await question.save();

  const topic = await Topic.findById(question.topic);
  await syncTestForTopic(
    question.topic,
    question.chapter,
    topic?.title,
    topic?.duration
  );

  res.json({ success: true, data: question });
});

exports.deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) throw new AppError('Question not found', 404);

  const { topic, chapter } = question;
  await question.deleteOne();

  const topicDoc = await Topic.findById(topic);
  await syncTestForTopic(topic, chapter, topicDoc?.title, topicDoc?.duration);

  res.json({ success: true, message: 'Question deleted' });
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
