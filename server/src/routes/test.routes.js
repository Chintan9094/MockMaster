const express = require('express');
const router = express.Router();
const { getChapters, getChapterTopics, getTestById, getAllTests } = require('../controllers/test.controller');

router.get('/chapters', getChapters);
router.get('/chapters/:chapterId', getChapterTopics);
router.get('/all', getAllTests);
router.get('/:testId', getTestById);

module.exports = router;
