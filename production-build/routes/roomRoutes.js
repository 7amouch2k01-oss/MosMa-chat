const express = require('express');
const { createRoom, getRooms, getRoomById, getOrCreateDMRoom, addMemberToRoom, searchRoomMessages } = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .get(protect, getRooms)
    .post(protect, createRoom);

router.route('/dm')
    .post(protect, getOrCreateDMRoom);

router.route('/:id')
    .get(protect, getRoomById);

router.get('/:id/search', protect, searchRoomMessages);

router.route('/add-member')
    .post(protect, addMemberToRoom);

module.exports = router;
