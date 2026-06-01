const express = require('express');
const router = express.Router();
const {
  getOverallAnalytics,
  getTopicWiseAnalytics,
  getChapterWiseAnalytics
} = require('../controllers/analytics.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/overall', getOverallAnalytics);
router.get('/topics', getTopicWiseAnalytics);
router.get('/chapters', getChapterWiseAnalytics);

module.exports = router;
