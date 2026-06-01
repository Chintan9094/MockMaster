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
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/adminUser.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.post('/chapters', addChapter);
router.post('/topics', addTopic);
router.post('/questions', addQuestions);
router.get('/questions', getQuestionsByTopic);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);
router.post('/tests', createTest);
router.delete('/chapters/:id', deleteChapter);
router.delete('/topics/:id', deleteTopic);

router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;
