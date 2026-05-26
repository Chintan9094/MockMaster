const express = require('express');
const router = express.Router();
const {
  getOverallAnalytics,
  getTopicWiseAnalytics,
  getChapterWiseAnalytics
} = require('../controllers/analytics.controller');
const { sessionAuth } = require('../middleware/session');

router.use(sessionAuth);

router.get('/overall', getOverallAnalytics);
router.get('/topics', getTopicWiseAnalytics);
router.get('/chapters', getChapterWiseAnalytics);

module.exports = router;
