const User = require('../models/User');
const Message = require('../models/Message');
const Friendship = require('../models/Friendship');
const sendEmail = require('../utils/sendEmail');

const searchUsers = async (req, res) => {
    try {
        const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const keyword = req.query.q
            ? {
                  username: {
                      $regex: escapeRegex(req.query.q),
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

const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { username, email, status, bio, profilePic, avatarColor, profileBgType, profileCardBg, glowColor, profileMusicUrl } = req.body;
        
        let emailChanged = false;
        let code = null;

        if (email) {
            const formattedEmail = email.toLowerCase().trim();
            if (formattedEmail !== user.email) {
                // Validate email format
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formattedEmail)) {
                    return res.status(400).json({ message: 'Please enter a valid email address' });
                }
                // Check if email is already taken
                const emailExists = await User.findOne({ email: formattedEmail });
                if (emailExists) {
                    return res.status(400).json({ message: 'Email is already in use by another user' });
                }

                user.email = formattedEmail;
                user.isVerified = false;
                
                // Generate a new verification code
                code = Math.floor(100000 + Math.random() * 900000).toString();
                user.verificationCode = code;
                user.verificationCodeExpires = Date.now() + 60 * 60 * 1000; // 1 hour
                emailChanged = true;
            }
        }

        if (username) user.username = username;
        if (status !== undefined) user.status = status;
        if (bio !== undefined) user.bio = bio;
        if (profilePic !== undefined) user.profilePic = profilePic;
        if (avatarColor) user.avatarColor = avatarColor;
        if (profileBgType !== undefined) user.profileBgType = profileBgType;
        if (profileCardBg !== undefined) user.profileCardBg = profileCardBg;
        if (glowColor !== undefined) user.glowColor = glowColor;
        if (profileMusicUrl !== undefined) user.profileMusicUrl = profileMusicUrl;

        const updatedUser = await user.save();

        if (emailChanged && code) {
            sendEmail({
                to: updatedUser.email,
                subject: 'MosMA Chat - Email Verification Code (Email Updated)',
                text: `Your email was updated. Please verify it using this code: ${code}. It expires in 1 hour.`
            }).catch(err => console.error('Error sending updated email verification:', err));
        }

        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            status: updatedUser.status,
            bio: updatedUser.bio,
            profilePic: updatedUser.profilePic,
            avatarColor: updatedUser.avatarColor,
            isVerified: updatedUser.isVerified,
            subscriptionTier: updatedUser.subscriptionTier,
            isAdmin: updatedUser.isAdmin,
            isOwner: updatedUser.isOwner,
            profileBgType: updatedUser.profileBgType,
            profileCardBg: updatedUser.profileCardBg,
            glowColor: updatedUser.glowColor,
            profileMusicUrl: updatedUser.profileMusicUrl,
            devVerificationCode: code // Dev tool helper
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const upgradeSubscription = async (req, res) => {
    const { tier } = req.body;
    if (!['free', 'pro', 'elite'].includes(tier)) {
        return res.status(400).json({ message: 'Invalid subscription tier' });
    }
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.subscriptionTier = tier;
            const updatedUser = await user.save();
            
            // Log upgrade action
            const Log = require('../models/Log');
            try {
                await Log.create({
                    action: 'SUBSCRIBE_UPGRADE',
                    target: user.username,
                    details: `Upgraded subscription tier to: ${tier}`,
                    ip: req.ip,
                    severity: 'low',
                    type: 'admin_action'
                });
            } catch (logErr) {
                console.error("Log subscription upgrade error:", logErr);
            }

            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                isAdmin: updatedUser.isAdmin,
                isOwner: updatedUser.isOwner,
                subscriptionTier: updatedUser.subscriptionTier,
                isVerified: updatedUser.isVerified,
                token: req.headers.authorization.split(' ')[1]
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const getUserDrive = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Find all messages from the current user that have an upload attachment
        const messages = await Message.find({
            user: userId,
            fileUrl: { $exists: true, $ne: null }
        }).select('fileName fileUrl fileType createdAt room content');

        // Calculate storage limits by subscription tier:
        // Free: 50MB
        // Pro: 1GB
        // Elite: 5GB
        const tier = req.user.subscriptionTier || 'free';
        let limitBytes = 50 * 1024 * 1024; // Free: 50MB
        if (tier === 'pro') limitBytes = 1024 * 1024 * 1024; // Pro: 1GB
        else if (tier === 'elite') limitBytes = 5 * 1024 * 1024 * 1024; // Elite: 5GB

        const fs = require('fs');
        const path = require('path');
        
        let totalUsedBytes = 0;
        const files = messages.map(msg => {
            let size = 0;
            try {
                if (msg.fileUrl) {
                    const filename = msg.fileUrl.replace('/uploads/', '');
                    const filePath = path.join(__dirname, '..', 'public', 'uploads', filename);
                    if (fs.existsSync(filePath)) {
                        const stats = fs.statSync(filePath);
                        size = stats.size;
                        totalUsedBytes += size;
                    }
                }
            } catch (err) {
                console.error("Error reading file stats:", err);
            }

            return {
                messageId: msg._id,
                fileName: msg.fileName || 'file',
                fileUrl: msg.fileUrl,
                fileType: msg.fileType || 'application/octet-stream',
                createdAt: msg.createdAt,
                room: msg.room,
                sizeBytes: size
            };
        });

        res.json({
            files,
            totalUsedBytes,
            limitBytes,
            subscriptionTier: tier
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { searchUsers, updateAvatar, updateProfile, getUserStats, upgradeSubscription, getUserDrive };
