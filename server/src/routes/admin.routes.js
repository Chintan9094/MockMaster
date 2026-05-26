const express = require('express');
const router = express.Router();
const {
  addChapter,
  addTopic,
  addQuestions,
  createTest,
  deleteChapter,
  deleteTopic
} = require('../controllers/admin.controller');

router.post('/chapters', addChapter);
router.post('/topics', addTopic);
router.post('/questions', addQuestions);
router.post('/tests', createTest);
router.delete('/chapters/:id', deleteChapter);
router.delete('/topics/:id', deleteTopic);

module.exports = router;
