const express = require('express');
const { getTasks, createTask, updateTask, deleteTask, updateTaskOrder } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .get(protect, getTasks)
    .post(protect, createTask);

router.put('/reorder', protect, updateTaskOrder);

router.route('/:id')
    .put(protect, updateTask)
    .delete(protect, deleteTask);

module.exports = router;
