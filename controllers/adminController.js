const User = require('../models/User');
const Room = require('../models/Room');
const Message = require('../models/Message');
const Post = require('../models/Post');

// @desc    Get all users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete user
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            if (user.isAdmin) return res.status(400).json({ message: 'Cannot delete admin user' });
            await User.deleteOne({ _id: user._id });
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user role
const updateUserRole = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.isAdmin = req.body.isAdmin;
            await user.save();
            res.json({ message: 'User role updated' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all rooms
const getAllRooms = async (req, res) => {
    try {
        const rooms = await Room.find({}).populate('users', 'username email');
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete room
const deleteRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (room) {
            await Room.deleteOne({ _id: room._id });
            res.json({ message: 'Room removed' });
        } else {
            res.status(404).json({ message: 'Room not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get system stats
const getSystemStats = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const roomCount = await Room.countDocuments();
        const messageCount = await Message.countDocuments();
        const postCount = await Post.countDocuments();
        const onlineCount = global.onlineUsers ? global.onlineUsers.size : 0;

        res.json({ userCount, roomCount, messageCount, onlineCount, postCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Toggle user ban
const toggleUserBan = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            if (user.isAdmin && !user.isBanned) {
                return res.status(400).json({ message: 'Cannot ban admin user' });
            }
            user.isBanned = !user.isBanned;
            await user.save();
            res.json({ message: `User ${user.isBanned ? 'banned' : 'unbanned'} successfully` });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all posts
const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find({}).populate('user', 'username email tag avatarColor').sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete post
const deletePost = async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Broadcast message
const broadcastMessage = async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ message: 'Message is required' });
        
        // Emit via socket if available
        if (global.io) {
            global.io.emit('broadcast', { 
                message, 
                sender: 'System Admin',
                timestamp: new Date()
            });
        }
        
        res.json({ message: 'Broadcast sent successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
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
};
