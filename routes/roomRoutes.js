const express = require('express');
const { createRoom, getRooms, getRoomById } = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .get(protect, getRooms)
    .post(protect, createRoom);

router.route('/:id')
    .get(protect, getRoomById);

module.exports = router;
