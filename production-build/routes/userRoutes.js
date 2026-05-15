const express = require('express');
const { searchUsers, updateAvatar, updateProfile, getUserStats } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/search', protect, searchUsers);
router.put('/avatar', protect, updateAvatar);
router.put('/profile', protect, updateProfile);
router.get('/stats', protect, getUserStats);

module.exports = router;
