const express = require('express');
const { sendRequest, acceptRequest, declineRequest, getFriends, getSuggestions, removeFriend } = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getFriends);
router.route('/suggestions').get(protect, getSuggestions);
router.route('/request').post(protect, sendRequest);
router.route('/accept/:id').put(protect, acceptRequest);
router.route('/decline/:id').put(protect, declineRequest);
router.route('/:id').delete(protect, removeFriend);

module.exports = router;
