const Room = require('../models/Room');

exports.createRoom = async (req, res) => {
    try {
        const { name, description } = req.body;
        const existingRoom = await Room.findOne({ name });
        if (existingRoom) {
            return res.status(400).json({ message: 'Room already exists' });
        }
        const room = await Room.create({ 
            name, 
            description, 
            type: 'group', 
            users: [req.user._id] 
        });
        res.status(201).json(room);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getRooms = async (req, res) => {
    try {
        const rooms = await Room.find({
            $or: [
                { users: req.user._id },
                { participants: req.user._id }
            ]
        }).populate('users', 'username email').populate('participants', 'username email avatarColor status');
        res.status(200).json(rooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getRoomById = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id).populate('users', 'username email').populate('participants', 'username email avatarColor status');
        if (!room) return res.status(404).json({ message: 'Room not found' });
        res.status(200).json(room);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getOrCreateDMRoom = async (req, res) => {
    const { userId } = req.body; // The other user's ID
    const currentUserId = req.user._id;

    try {
        // Find existing DM room
        let room = await Room.findOne({
            type: 'dm',
            participants: { $all: [currentUserId, userId], $size: 2 }
        }).populate('participants', 'username email avatarColor status');

        if (!room) {
            // Create new DM room
            room = await Room.create({
                type: 'dm',
                participants: [currentUserId, userId]
            });
            room = await room.populate('participants', 'username email avatarColor status');
        }

        res.status(200).json(room);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addMemberToRoom = async (req, res) => {
    try {
        const { roomId, userId } = req.body;
        const room = await Room.findById(roomId);
        if (!room) return res.status(404).json({ message: 'Room not found' });
        
        if (room.type === 'dm') return res.status(400).json({ message: 'Cannot add members to DM' });

        if (!room.users.includes(userId)) {
            room.users.push(userId);
            await room.save();
        }
        
        const updatedRoom = await Room.findById(roomId).populate('users', 'username email');
        res.status(200).json(updatedRoom);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
