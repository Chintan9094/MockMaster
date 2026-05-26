const express = require('express');
const router = express.Router();
const {
  startTest,
  saveAnswer,
  updateProgress,
  submitTest,
  getAttemptResult,
  getMyAttempts,
  getIncompleteAttempts,
  abandonAttempt,
  abandonAllIncomplete
} = require('../controllers/attempt.controller');
const { sessionAuth } = require('../middleware/session');

router.use(sessionAuth);

router.post('/start/:testId', startTest);
router.put('/:attemptId/answer', saveAnswer);
router.put('/:attemptId/progress', updateProgress);
router.post('/:attemptId/submit', submitTest);
router.get('/:attemptId/result', getAttemptResult);
router.get('/my-attempts', getMyAttempts);
router.get('/incomplete', getIncompleteAttempts);
router.post('/:attemptId/abandon', abandonAttempt);
router.post('/abandon-all', abandonAllIncomplete);

module.exports = router;
