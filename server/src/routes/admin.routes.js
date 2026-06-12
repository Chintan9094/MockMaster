const express = require('express');
const router = express.Router();
const {
  addChapter,
  updateChapter,
  addTopic,
  updateTopic,
  addQuestions,
  getQuestionsByTopic,
  updateQuestion,
  deleteQuestion,
  deleteQuestionsBulk,
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
router.put('/chapters/:id', updateChapter);
router.post('/topics', addTopic);
router.put('/topics/:id', updateTopic);
router.post('/questions', addQuestions);
router.post('/questions/bulk-delete', deleteQuestionsBulk);
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
