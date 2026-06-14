const User = require('../models/User');
const Room = require('../models/Room');
const Message = require('../models/Message');
const Log = require('../models/Log');
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
            
            await Log.create({
                admin: req.user._id,
                action: 'DELETE_USER',
                target: user.username,
                details: `Deleted user with email: ${user.email}`,
                ip: req.ip,
                type: 'admin_action'
            });

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
            if (user._id.toString() === req.user._id.toString() && !req.body.isAdmin) {
                return res.status(400).json({ message: 'Cannot revoke your own admin status' });
            }
            const oldRole = user.isAdmin ? 'Admin' : 'User';
            user.isAdmin = req.body.isAdmin;
            const newRole = user.isAdmin ? 'Admin' : 'User';
            
            await Log.create({
                admin: req.user._id,
                action: 'UPDATE_ROLE',
                target: user.username,
                details: `Changed role from ${oldRole} to ${newRole}`,
                ip: req.ip,
                type: 'admin_action'
            });

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
            await Log.create({
                admin: req.user._id,
                action: 'DELETE_ROOM',
                target: room.name,
                details: `Deleted room: ${room.name}`,
                ip: req.ip,
                type: 'admin_action'
            });

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

        const recentUsers = await User.find({}).select('username email avatarColor createdAt').sort({ createdAt: -1 }).limit(5);
        const recentPosts = await Post.find({}).populate('user', 'username').sort({ createdAt: -1 }).limit(5);

        res.json({ 
            userCount, 
            roomCount, 
            messageCount, 
            onlineCount, 
            postCount,
            recentUsers,
            recentPosts
        });
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
            
            await Log.create({
                admin: req.user._id,
                action: user.isBanned ? 'BAN_USER' : 'UNBAN_USER',
                target: user.username,
                details: `${user.isBanned ? 'Banned' : 'Unbanned'} user`,
                ip: req.ip,
                type: 'admin_action'
            });

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
        const post = await Post.findById(req.params.id).populate('user', 'username');
        if (post) {
            await Log.create({
                admin: req.user._id,
                action: 'DELETE_POST',
                target: post.user ? post.user.username : 'Unknown User',
                details: `Deleted post: "${post.content ? post.content.substring(0, 60) : ''}"`,
                ip: req.ip,
                type: 'admin_action'
            });
            await Post.deleteOne({ _id: post._id });
            res.json({ message: 'Post removed' });
        } else {
            res.status(404).json({ message: 'Post not found' });
        }
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
        
        await Log.create({
            admin: req.user._id,
            action: 'BROADCAST_MESSAGE',
            target: 'All Users',
            details: `Broadcasted: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`,
            ip: req.ip,
            type: 'admin_action'
        });

        res.json({ message: 'Broadcast sent successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all system security logs
const getLogs = async (req, res) => {
    try {
        const { type } = req.query;
        const query = type ? { type } : {};
        const logs = await Log.find(query)
            .populate('admin', 'username email')
            .sort({ createdAt: -1 })
            .limit(100);
        res.json(logs);
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
    broadcastMessage,
    getLogs
};
