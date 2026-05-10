const express = require('express');
const { 
    getAllUsers, 
    deleteUser, 
    updateUserRole, 
    getAllRooms, 
    deleteRoom,
    getSystemStats,
    toggleUserBan,
    getAllPosts,
    deletePost,
    broadcastMessage
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

const router = express.Router();

// Apply protect and admin middleware to all routes in this file
router.use(protect);
router.use(admin);

router.get('/stats', getSystemStats);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/ban', toggleUserBan);

router.get('/rooms', getAllRooms);
router.delete('/rooms/:id', deleteRoom);

router.get('/posts', getAllPosts);
router.delete('/posts/:id', deletePost);
router.post('/broadcast', broadcastMessage);

module.exports = router;
