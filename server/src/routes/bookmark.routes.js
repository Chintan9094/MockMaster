const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getBookmarks,
  toggleBookmark,
  removeBookmark,
  clearBookmarks
} = require('../controllers/bookmark.controller');

router.use(protect);

router.get('/', getBookmarks);
router.post('/toggle', toggleBookmark);
router.delete('/:questionId', removeBookmark);
router.delete('/', clearBookmarks);

module.exports = router;
