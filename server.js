const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const friendRoutes = require('./routes/friendRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const taskRoutes = require('./routes/taskRoutes');
const postRoutes = require('./routes/postRoutes');
const User = require('./models/User');
const Message = require('./models/Message');
const Room = require('./models/Room');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const parseAllowedOrigins = () => {
    const raw = (process.env.CLIENT_URL || '').trim();
    if (!raw) return [];
    return raw
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => s.replace(/\/+$/, '')); // strip trailing slashes
};

const allowedOrigins = parseAllowedOrigins();
const isOriginAllowed = (origin) => {
    if (!origin) return true; // allow same-origin / curl / server-to-server
    const normalized = origin.replace(/\/+$/, '');
    return allowedOrigins.length === 0 ? true : allowedOrigins.includes(normalized);
};

const corsOptions = {
    origin: (origin, cb) => {
        if (isOriginAllowed(origin)) return cb(null, true);
        return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
};

const io = new Server(server, {
    cors: {
        origin: (origin, cb) => {
            if (isOriginAllowed(origin)) return cb(null, true);
            return cb(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET', 'POST'],
    }
});

// Middleware
app.set('trust proxy', 1);
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/posts', postRoutes);

// Serve frontend in production
const distPath = path.join(__dirname, 'client', 'dist');
if (process.env.NODE_ENV === 'production' && fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
} else {
    app.use(express.static(path.join(__dirname, 'public')));
}

// ─── File Upload Setup ────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'public', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ 
        url: fileUrl, 
        fileName: req.file.originalname, 
        fileType: req.file.mimetype 
    });
});

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ─── Online Presence Tracking ─────────────────────────────────────────────────
// Map: userId -> Set of socketIds (user can have multiple tabs)
global.onlineUsers = new Map();
const onlineUsers = global.onlineUsers;

const setUserOnline = (userId, socketId) => {
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socketId);
};

const setUserOffline = (userId, socketId) => {
    if (!onlineUsers.has(userId)) return false;
    onlineUsers.get(userId).delete(socketId);
    if (onlineUsers.get(userId).size === 0) {
        onlineUsers.delete(userId);
        return true; // fully offline
    }
    return false;
};

const getOnlineUserIds = () => [...onlineUsers.keys()];

// ─── Socket.IO ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ── Register online presence ──────────────────────────────────────────────
    socket.on('user_connected', async ({ userId, username }) => {
        // Check if user is banned
        const user = await User.findById(userId);
        if (user && user.isBanned) {
            socket.emit('banned', { message: 'Your account has been banned.' });
            socket.disconnect();
            return;
        }

        socket.data.userId   = userId;
        socket.data.username = username;

        setUserOnline(userId, socket.id);

        // Tell everyone this user is now online
        io.emit('user_online', { userId, username });

        // Send the current online list back to the newly connected client
        socket.emit('online_users_list', getOnlineUserIds());
        console.log(`User online: ${username} (${userId})`);
    });

    // ── Join room ─────────────────────────────────────────────────────────────
    socket.on('join_room', async (data) => {
        const { roomId, userId, username } = data;
        socket.join(roomId);
        socket.data.roomId = roomId;
        console.log(`${username} joined room: ${roomId}`);

        try {
            if (userId) {
                await Room.findByIdAndUpdate(roomId, { $addToSet: { users: userId } });
            }

            // Send last 50 messages
            const messages = await Message.find({ room: roomId })
                .sort({ createdAt: 1 })
                .limit(50);
            socket.emit('previous_messages', messages);

            // Notify others
            socket.to(roomId).emit('user_joined', { username });

            // Updated user list
            const updatedRoom = await Room.findById(roomId).populate('users', 'username email');
            if (updatedRoom) io.to(roomId).emit('room_users_update', updatedRoom.users);

        } catch (error) {
            console.error('Error in join_room:', error);
        }
    });

    // ── Leave room ────────────────────────────────────────────────────────────
    socket.on('leave_room', async (data) => {
        const { roomId, userId, username } = data;
        socket.leave(roomId);
        console.log(`${username} left room: ${roomId}`);

        try {
            if (userId) {
                await Room.findByIdAndUpdate(roomId, { $pull: { users: userId } });
            }
            socket.to(roomId).emit('user_left', { username });

            const updatedRoom = await Room.findById(roomId).populate('users', 'username email');
            if (updatedRoom) io.to(roomId).emit('room_users_update', updatedRoom.users);
        } catch (error) {
            console.error('Error in leave_room:', error);
        }
    });

    // ── Send message (with delivery acknowledgement) ──────────────────────────
    socket.on('send_message', async (data, ack) => {
        try {
            const newMessage = new Message({
                username: data.username,
                content: data.content,
                room: data.room,
                fileUrl: data.fileUrl,
                fileType: data.fileType,
                fileName: data.fileName,
            });
            const savedMessage = await newMessage.save();

            io.to(data.room).emit('receive_message', savedMessage);

            // Acknowledge delivery to sender
            if (typeof ack === 'function') ack({ status: 'delivered', messageId: savedMessage._id });
        } catch (error) {
            console.error('Error saving message:', error);
            if (typeof ack === 'function') ack({ status: 'error' });
        }
    });

    // ── Social & Friends ─────────────────────────────────────────────────────
    socket.on('send_friend_request', ({ recipientId, request }) => {
        const recipientSocketId = onlineUsers.get(recipientId);
        if (recipientSocketId) {
            recipientSocketId.forEach(sid => {
                io.to(sid).emit('receive_friend_request', { request });
            });
        }
    });

    socket.on('accept_friend_request', ({ requesterId, recipient }) => {
        const requesterSocketId = onlineUsers.get(requesterId);
        if (requesterSocketId) {
            requesterSocketId.forEach(sid => {
                io.to(sid).emit('friend_request_accepted', { friend: recipient });
            });
        }
    });

    // ── Typing indicators ─────────────────────────────────────────────────────
    socket.on('typing_start', ({ roomId, username }) => {
        socket.to(roomId).emit('typing_start', { username });
    });

    socket.on('typing_stop', ({ roomId, username }) => {
        socket.to(roomId).emit('typing_stop', { username });
    });

    // ── Message Reactions ─────────────────────────────────────────────────────
    socket.on('message_reaction', async ({ messageId, emoji, userId, roomId }) => {
        try {
            const message = await Message.findById(messageId);
            if (!message) return;

            if (!message.reactions) message.reactions = new Map();

            const reactionsForEmoji = message.reactions.get(emoji) || [];
            const userIndex = reactionsForEmoji.indexOf(userId);

            if (userIndex > -1) {
                // Remove reaction if already exists
                reactionsForEmoji.splice(userIndex, 1);
                if (reactionsForEmoji.length === 0) {
                    message.reactions.delete(emoji);
                } else {
                    message.reactions.set(emoji, reactionsForEmoji);
                }
            } else {
                // Add reaction
                reactionsForEmoji.push(userId);
                message.reactions.set(emoji, reactionsForEmoji);
            }

            // Mongoose needs this to know Map has changed
            message.markModified('reactions');
            await message.save();

            io.to(roomId).emit('reaction_update', { 
                messageId, 
                reactions: Object.fromEntries(message.reactions) 
            });
        } catch (error) {
            console.error('Error handling reaction:', error);
        }
    });

    // ── Friend Requests ───────────────────────────────────────────────────────
    socket.on('send_friend_request', ({ recipientId, requesterName }) => {
        const recipientSockets = onlineUsers.get(recipientId);
        if (recipientSockets) {
            recipientSockets.forEach(socketId => {
                io.to(socketId).emit('friend_request_received', { requesterName });
            });
        }
    });

    // ── WebRTC Signaling (Calls) ──────────────────────────────────────────────
    socket.on('call_user', ({ to, offer, from, name, type }) => {
        const targetSockets = onlineUsers.get(to);
        if (targetSockets) {
            targetSockets.forEach(sid => {
                io.to(sid).emit('incoming_call', { from, offer, name, type });
            });
        }
    });

    socket.on('answer_call', ({ to, answer }) => {
        const targetSockets = onlineUsers.get(to);
        if (targetSockets) {
            targetSockets.forEach(sid => {
                io.to(sid).emit('call_answered', { answer });
            });
        }
    });

    socket.on('ice_candidate', ({ to, candidate }) => {
        const targetSockets = onlineUsers.get(to);
        if (targetSockets) {
            targetSockets.forEach(sid => {
                io.to(sid).emit('ice_candidate', { candidate });
            });
        }
    });

    socket.on('end_call', ({ to }) => {
        const targetSockets = onlineUsers.get(to);
        if (targetSockets) {
            targetSockets.forEach(sid => {
                io.to(sid).emit('call_ended');
            });
        }
    });

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
        console.log(`Socket disconnected: ${socket.id}`);
        const { userId, roomId, username } = socket.data;

        // Handle room cleanup
        if (userId && roomId) {
            try {
                await Room.findByIdAndUpdate(roomId, { $pull: { users: userId } });
                socket.to(roomId).emit('user_left', { username });

                const updatedRoom = await Room.findById(roomId).populate('users', 'username email');
                if (updatedRoom) io.to(roomId).emit('room_users_update', updatedRoom.users);
            } catch (error) {
                console.error('Error updating room on disconnect:', error);
            }
        }

        // Handle online presence cleanup
        if (userId) {
            const fullyOffline = setUserOffline(userId, socket.id);
            if (fullyOffline) {
                io.emit('user_offline', { userId, username });
                console.log(`User offline: ${username} (${userId})`);
            }
        }
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
