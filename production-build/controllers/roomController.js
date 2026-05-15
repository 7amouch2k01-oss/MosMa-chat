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
        let rooms = await Room.find({
            $or: [
                { users: req.user._id },
                { participants: req.user._id }
            ]
        }).populate('users', 'username email avatarColor').populate('participants', 'username email avatarColor status');
        
        // Add name for DM rooms based on the other participant
        rooms = rooms.map(room => {
            const roomObj = room.toObject();
            if (roomObj.type === 'dm') {
                const other = roomObj.participants.find(p => p._id.toString() !== req.user._id.toString());
                roomObj.name = other ? other.username : 'Private Chat';
            }
            return roomObj;
        });

        res.status(200).json(rooms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getRoomById = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id).populate('users', 'username email avatarColor').populate('participants', 'username email avatarColor status');
        if (!room) return res.status(404).json({ message: 'Room not found' });
        
        // Authorization check
        const isMember = room.users?.some(u => u._id.toString() === req.user._id.toString()) || 
                         room.participants?.some(p => p._id.toString() === req.user._id.toString());
        
        if (!isMember && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized to view this room' });
        }
        
        const roomObj = room.toObject();
        if (roomObj.type === 'dm') {
            const other = roomObj.participants.find(p => p._id.toString() !== req.user._id.toString());
            roomObj.name = other ? other.username : 'Private Chat';
        }
        
        res.status(200).json(roomObj);
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

        const roomObj = room.toObject();
        const other = roomObj.participants.find(p => p._id.toString() !== currentUserId.toString());
        roomObj.name = other ? other.username : 'Private Chat';

        res.status(200).json(roomObj);
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

        // Authorization check: Only current members or admins can add others
        const isMember = room.users?.some(u => u.toString() === req.user._id.toString());
        if (!isMember && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized to add members to this room' });
        }

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

exports.searchRoomMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const { q } = req.query;
        if (!q) return res.status(400).json({ message: 'Search query required' });

        const room = await Room.findById(id);
        if (!room) return res.status(404).json({ message: 'Room not found' });

        const isMember = room.users?.some(u => u.toString() === req.user._id.toString()) || room.participants?.some(p => p.toString() === req.user._id.toString());
        
        if (!isMember && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized to search in this room' });
        }

        const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const messages = await Message.find({
            room: id,
            content: { $regex: escapeRegex(q), $options: 'i' }
        }).sort({ createdAt: -1 }).limit(100);

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
