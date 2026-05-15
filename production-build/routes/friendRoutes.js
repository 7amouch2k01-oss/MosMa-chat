const express = require('express');
const { sendRequest, acceptRequest, declineRequest, getFriends } = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getFriends);
router.route('/request').post(protect, sendRequest);
router.route('/accept/:id').put(protect, acceptRequest);
router.route('/decline/:id').put(protect, declineRequest);

module.exports = router;
