const express = require('express');
const router = express.Router();
const {
  addChapter,
  addTopic,
  addQuestions,
  getQuestionsByTopic,
  updateQuestion,
  deleteQuestion,
  createTest,
  deleteChapter,
  deleteTopic
} = require('../controllers/admin.controller');

router.post('/chapters', addChapter);
router.post('/topics', addTopic);
router.post('/questions', addQuestions);
router.get('/questions', getQuestionsByTopic);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);
router.post('/tests', createTest);
router.delete('/chapters/:id', deleteChapter);
router.delete('/topics/:id', deleteTopic);

module.exports = router;
