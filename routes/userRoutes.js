const express = require('express');
const { searchUsers, updateAvatar, updateProfile, getUserStats, upgradeSubscription, getUserDrive } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/search', protect, searchUsers);
router.put('/avatar', protect, updateAvatar);
router.put('/profile', protect, updateProfile);
router.get('/stats', protect, getUserStats);
router.put('/upgrade', protect, upgradeSubscription);
router.get('/drive', protect, getUserDrive);

module.exports = router;
