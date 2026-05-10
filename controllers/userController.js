const User = require('../models/User');
const Message = require('../models/Message');
const Friendship = require('../models/Friendship');

const searchUsers = async (req, res) => {
    try {
        const keyword = req.query.q
            ? {
                  username: {
                      $regex: req.query.q,
                      $options: 'i',
                  },
              }
            : {};

        // Find users matching keyword, but exclude the current user
        const users = await User.find({ ...keyword, _id: { $ne: req.user._id } }).select('-password');
        res.json(users);
    } catch (error) {
        console.error("User search error:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const updateAvatar = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.avatarColor = req.body.avatarColor || user.avatarColor;
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                avatarColor: updatedUser.avatarColor,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getUserStats = async (req, res) => {
    try {
        const userId = req.query.userId || req.user._id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const messageCount = await Message.countDocuments({ username: user.username });
        const friendCount = await Friendship.countDocuments({
            $or: [{ requester: userId }, { recipient: userId }],
            status: 'accepted'
        });
        res.json({ messageCount, friendCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { searchUsers, updateAvatar, getUserStats };
