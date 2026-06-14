const Friendship = require('../models/Friendship');
const User = require('../models/User');

// Send Friend Request
const sendRequest = async (req, res) => {
    const { recipientId } = req.body;
    try {
        const existing = await Friendship.findOne({
            $or: [
                { requester: req.user._id, recipient: recipientId },
                { requester: recipientId, recipient: req.user._id }
            ]
        });

        if (existing) {
            return res.status(400).json({ message: 'Friend request already exists or you are already friends.' });
        }

        const request = await Friendship.create({ requester: req.user._id, recipient: recipientId });
        
        await request.populate('requester', 'username email');
        
        res.status(201).json(request);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Accept Request
const acceptRequest = async (req, res) => {
    try {
        const request = await Friendship.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user._id, status: 'pending' },
            { status: 'accepted' },
            { returnDocument: 'after' }
        ).populate('requester recipient', 'username email avatarColor subscriptionTier');
        if (!request) return res.status(404).json({ message: 'Request not found' });
        res.json(request);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Decline Request
const declineRequest = async (req, res) => {
    try {
        const request = await Friendship.findOneAndDelete({ _id: req.params.id, recipient: req.user._id, status: 'pending' });
        if (!request) return res.status(404).json({ message: 'Request not found' });
        res.json({ message: 'Request declined', id: req.params.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get all friends and pending requests
const getFriends = async (req, res) => {
    try {
        const friendships = await Friendship.find({
            $or: [{ requester: req.user._id }, { recipient: req.user._id }]
        }).populate('requester recipient', 'username email avatarColor subscriptionTier profilePic status bio');
        
        res.json(friendships);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get suggested friends
const getSuggestions = async (req, res) => {
    try {
        // Find all friendships for the current user
        const friendships = await Friendship.find({
            $or: [{ requester: req.user._id }, { recipient: req.user._id }]
        });

        // Get IDs of users who are already friends or have pending requests
        const excludedUserIds = friendships.map(f =>
            f.requester.toString() === req.user._id.toString() ? f.recipient : f.requester
        );
        excludedUserIds.push(req.user._id); // Exclude current user as well

        // Get users who are not in the excluded list
        const suggestions = await User.find({
            _id: { $nin: excludedUserIds }
        }).select('username profilePic avatarColor subscriptionTier isVerified status bio')
        .limit(15);

        res.json(suggestions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Remove Friend
const removeFriend = async (req, res) => {
    try {
        const friendship = await Friendship.findOneAndDelete({
            _id: req.params.id,
            status: 'accepted',
            $or: [
                { requester: req.user._id },
                { recipient: req.user._id }
            ]
        });
        if (!friendship) return res.status(404).json({ message: 'Friendship not found' });
        res.json({ message: 'Unfriended successfully', id: req.params.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { sendRequest, acceptRequest, declineRequest, getFriends, getSuggestions, removeFriend };
