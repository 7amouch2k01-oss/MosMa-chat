const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
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
const Log = require('./models/Log');
const Post = require('./models/Post');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

if (!process.env.JWT_SECRET) {
    // Hard fail in production to avoid weak default secret.
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Missing JWT_SECRET in production');
    }
    console.warn('WARNING: JWT_SECRET not set. Using fallback secret only for development.');
}

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
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline is often needed for dev/some libraries, but 'self' is primary
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "blob:", "http://localhost:5000"], // allow local uploads
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: ["'self'", "ws://localhost:5000", "http://localhost:5000", "*"], // allow any for tunnel debugging
        },
    },
    contentSecurityPolicy: false, // TEMPORARY: Disable CSP to fix potential block issues
}));
app.use(cors(corsOptions));
app.use(express.json());
app.use(hpp());


const rateLimitHandler = async (req, res, next, options) => {
    try {
        await Log.create({
            action: 'RATE_LIMIT_EXCEEDED',
            target: req.originalUrl,
            details: `Rate limit exceeded. Endpoint: ${req.originalUrl}, IP: ${req.ip}`,
            ip: req.ip,
            severity: 'high'
        });
    } catch (err) {
        console.error('Failed to log rate limit event', err);
    }
    res.status(options.statusCode).send(options.message);
};

// Basic rate limits (tune as needed)
app.use('/api/', rateLimit({
    windowMs: 60 * 1000,
    limit: 240,
    handler: rateLimitHandler,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
}));
app.use('/api/auth/', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10, // More restrictive for auth attempts
    message: 'Too many authentication attempts, please try again after 15 minutes',
    handler: rateLimitHandler,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
}));

// Routes
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/posts', postRoutes);

// Request Logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ─── File Upload Setup ────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'public', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const SAFE_UPLOAD_MIME = new Set([
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'application/pdf',
]);

const safeBaseName = (originalname) => {
    const base = path.basename(originalname || 'file');
    // keep only safe chars to avoid weird paths / headers
    return base.replace(/[^a-zA-Z0-9._-]/g, '_');
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || '');
        const name = safeBaseName(file.originalname);
        const token = crypto.randomBytes(12).toString('hex');
        cb(null, `${Date.now()}-${token}-${name}`.slice(0, 180) + ext);
    }
});
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        if (!SAFE_UPLOAD_MIME.has(file.mimetype)) {
            return cb(new Error('Unsupported file type'));
        }
        return cb(null, true);
    },
});

// Upload should be protected; client already uses Bearer token for most routes.
// To avoid importing protect here (and circular deps), we require Authorization header and validate JWT.
const requireAuthHeader = async (req, res, next) => {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return res.status(401).json({ message: 'Not authorized, no token' });
    const token = header.slice('Bearer '.length);
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const user = await User.findById(decoded.id);
        if (!user || user.isBanned) {
            return res.status(403).json({ message: 'Not authorized or banned' });
        }
        req.auth = { userId: decoded.id };
        return next();
    } catch {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

app.post('/api/upload', requireAuthHeader, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ 
        url: fileUrl, 
        fileName: req.file.originalname, 
        fileType: req.file.mimetype 
    });
});

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), {
    setHeaders: (res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; style-src 'self';");
    }
}));

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

global.whiteboardHistory = new Map();

// ─── Socket.IO ────────────────────────────────────────────────────────────────
// Require JWT for all socket connections:
// client must connect with: io(API_URL, { auth: { token } })
io.use(async (socket, next) => {
    try {
        const token = socket.handshake?.auth?.token;
        if (!token) return next(new Error('Not authorized'));
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        const user = await User.findById(decoded.id).select('_id username isBanned');
        if (!user) return next(new Error('Not authorized'));
        if (user.isBanned) return next(new Error('Banned'));
        socket.data.userId = String(user._id);
        socket.data.username = user.username;
        return next();
    } catch (e) {
        return next(new Error('Not authorized'));
    }
});

io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ── Register online presence ──────────────────────────────────────────────
    socket.on('user_connected', async () => {
        const userId = socket.data.userId;
        const username = socket.data.username;
        setUserOnline(userId, socket.id);

        // Tell everyone this user is now online
        io.emit('user_online', { userId, username });

        // Send the current online list back to the newly connected client
        socket.emit('online_users_list', getOnlineUserIds());
        console.log(`User online: ${username} (${userId})`);
    });

    // ── Join room ─────────────────────────────────────────────────────────────
    socket.on('join_room', async (data) => {
        const { roomId } = data || {};
        const userId = socket.data.userId;
        const username = socket.data.username;
        try {
            const room = await Room.findById(roomId);
            if (!room) return;
            
            const isMember = 
                room.users?.some(uid => uid.toString() === userId) || 
                room.participants?.some(uid => uid.toString() === userId);
            if (!isMember) {
                // If it's a group, we might want to let them join if it's public.
                // For now, if they're not a member, reject.
                socket.emit('error', { message: 'Not authorized to join this room' });
                return;
            }

            socket.join(roomId);
            socket.data.roomId = roomId;
            console.log(`${username} joined room: ${roomId}`);

            // Send last 50 messages
            const messages = await Message.find({ room: roomId })
                .sort({ createdAt: 1 })
                .limit(50)
                .populate('user', 'subscriptionTier avatarColor isAdmin isOwner');
            socket.emit('previous_messages', messages);

            // Send pinned messages
            const pinnedMessages = await Message.find({ room: roomId, pinned: true })
                .populate('user', 'subscriptionTier avatarColor isAdmin isOwner');
            socket.emit('pinned_messages', pinnedMessages);

            // Notify others
            socket.to(roomId).emit('user_joined', { username });

            // Updated user list
            const updatedRoom = await Room.findById(roomId)
                .populate('users', 'username email avatarColor status subscriptionTier')
                .populate('participants', 'username email avatarColor status subscriptionTier');
            if (updatedRoom) {
                const members = updatedRoom.type === 'dm' ? updatedRoom.participants : updatedRoom.users;
                io.to(roomId).emit('room_users_update', members);
            }

        } catch (error) {
            console.error('Error in join_room:', error);
        }
    });

    // ── Leave room ────────────────────────────────────────────────────────────
    socket.on('leave_room', async (data) => {
        const { roomId } = data || {};
        const userId = socket.data.userId;
        const username = socket.data.username;
        socket.leave(roomId);
        console.log(`${username} left room: ${roomId}`);

        try {
            socket.to(roomId).emit('user_left', { username });
            // Don't remove user from room in DB here, as it's just a socket leave
        } catch (error) {
            console.error('Error in leave_room:', error);
        }
    });

    // ── Send message (with delivery acknowledgement) ──────────────────────────
    socket.on('send_message', async (data, ack) => {
        try {
            const username = socket.data.username;
            const roomId = data?.room;
            const content = String(data?.content || '');
            if (!roomId || !content.trim()) {
                if (typeof ack === 'function') ack({ status: 'error' });
                return;
            }

            const room = await Room.findById(roomId);
            if (!room) return;
            const isMember = 
                room.users?.some(uid => uid.toString() === socket.data.userId) || 
                room.participants?.some(uid => uid.toString() === socket.data.userId);
            if (!isMember) {
                if (typeof ack === 'function') ack({ status: 'error', message: 'Not authorized' });
                return;
            }
            const newMessage = new Message({
                username,
                user: socket.data.userId,
                content,
                room: roomId,
                fileUrl: data?.fileUrl,
                fileType: data?.fileType,
                fileName: data?.fileName,
            });
            const savedMessage = await newMessage.save();
            const populatedMessage = await Message.findById(savedMessage._id).populate('user', 'subscriptionTier avatarColor isAdmin isOwner');

            io.to(roomId).emit('receive_message', populatedMessage || savedMessage);

            // Acknowledge delivery to sender
            if (typeof ack === 'function') ack({ status: 'delivered', messageId: savedMessage._id });
        } catch (error) {
            console.error('Error saving message:', error);
            if (typeof ack === 'function') ack({ status: 'error' });
        }
    });

    // ── Social & Friends ─────────────────────────────────────────────────────
    socket.on('send_friend_request', ({ recipientId, requesterName, request }) => {
        const recipientSockets = onlineUsers.get(recipientId);
        if (recipientSockets) {
            recipientSockets.forEach(sid => {
                io.to(sid).emit('receive_friend_request', { request, requesterName });
                io.to(sid).emit('friend_request_received', { requesterName, request });
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
            const safeUserId = socket.data.userId;
            const userIndex = reactionsForEmoji.indexOf(safeUserId);

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
                reactionsForEmoji.push(safeUserId);
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

    // ── Social Feed ──────────────────────────────────────────────────────────
    socket.on('post_created', (post) => {
        io.emit('new_post', post);
    });

    socket.on('post_updated', ({ postId, likes, comments }) => {
        io.emit('post_update', { postId, likes, comments });
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

    // ── Social Feed Real-time Updates ─────────────────────────────────────────
    socket.on('post_created', async (postData) => {
        try {
            // postData comes from the client after a successful REST POST
            // To be safe, we could re-verify or just ensure the broadcast is limited
            // For now, we trust the client provided post object but we should ideally
            // check if it exists in DB.
            const post = await Post.findById(postData._id).populate('user', 'username profilePic');
            if (post) {
                io.emit('new_post', post);
            }
        } catch (error) {
            console.error('Post created socket error:', error);
        }
    });

    socket.on('post_updated', async ({ postId }) => {
        try {
            // Instead of trusting likes/comments from client, fetch fresh from DB
            const post = await Post.findById(postId);
            if (post) {
                io.emit('post_update', { 
                    postId, 
                    likes: post.likes, 
                    comments: post.comments 
                });
            }
        } catch (error) {
            console.error('Post updated socket error:', error);
        }
    });

    // ── Message Management ────────────────────────────────────────────────────
    socket.on('delete_message', async ({ messageId, roomId }) => {
        try {
            const userId = socket.data.userId;
            const message = await Message.findById(messageId);
            if (!message) return;

            // Check authorization: must be sender or admin
            const user = await User.findById(userId);
            const isOwner = message.username === user.username; // Message stores username, better to store userId but this works with current schema
            const isAdmin = user.isAdmin;

            if (!isOwner && !isAdmin) {
                console.warn(`Unauthorized delete attempt by ${user.username} on message ${messageId}`);
                return;
            }

            await Message.findByIdAndDelete(messageId);
            io.to(roomId).emit('message_deleted', { messageId });
        } catch (error) {
            console.error('Delete message error:', error);
        }
    });

    socket.on('edit_message', async ({ messageId, content, roomId }) => {
        try {
            const userId = socket.data.userId;
            const message = await Message.findById(messageId);
            if (!message) return;

            // Check authorization: only sender can edit
            const user = await User.findById(userId);
            if (message.username !== user.username) {
                console.warn(`Unauthorized edit attempt by ${user.username} on message ${messageId}`);
                return;
            }

            const updated = await Message.findByIdAndUpdate(messageId, { content, updatedAt: new Date() }, { new: true });
            io.to(roomId).emit('message_edited', updated);
        } catch (error) {
            console.error('Edit message error:', error);
        }
    });

    socket.on('pin_message', async ({ message, roomId }) => {
        try {
            if (!message?._id || !roomId) return;
            const updated = await Message.findByIdAndUpdate(message._id, { pinned: true }, { new: true }).populate('user', 'subscriptionTier avatarColor isAdmin isOwner');
            if (updated) {
                io.to(roomId).emit('message_pinned', { message: updated });
            }
        } catch (error) {
            console.error('Pin message error:', error);
        }
    });

    socket.on('unpin_message', async ({ messageId, roomId }) => {
        try {
            if (!messageId || !roomId) return;
            const updated = await Message.findByIdAndUpdate(messageId, { pinned: false }, { new: true });
            if (updated) {
                io.to(roomId).emit('message_unpinned', { messageId });
            }
        } catch (error) {
            console.error('Unpin message error:', error);
        }
    });

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
        console.log(`Socket disconnected: ${socket.id}`);
        const { userId, roomId, username } = socket.data;

        // Handle room cleanup
        if (userId && roomId) {
            try {
                socket.to(roomId).emit('user_left', { username });
                // Don't remove user from DB on disconnect
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

    // ── Whiteboard ────────────────────────────────────────────────────────────
    socket.on('whiteboard_join', ({ roomId }) => {
        if (!roomId) return;
        const wbRoom = `wb:${roomId}`;
        socket.join(wbRoom);

        // Send existing strokes to late-joining user
        const history = global.whiteboardHistory.get(roomId) || [];
        socket.emit('whiteboard_history', history);

        // Broadcast updated user count
        const count = io.sockets.adapter.rooms.get(wbRoom)?.size || 1;
        io.to(wbRoom).emit('whiteboard_users', count);
    });

    socket.on('whiteboard_leave', ({ roomId }) => {
        if (!roomId) return;
        const wbRoom = `wb:${roomId}`;
        socket.leave(wbRoom);
        const count = io.sockets.adapter.rooms.get(wbRoom)?.size || 0;
        io.to(wbRoom).emit('whiteboard_users', count);
    });

    socket.on('whiteboard_draw', ({ roomId, stroke }) => {
        if (!roomId || !stroke) return;
        // Store stroke in memory (cap at 500 per board)
        if (!global.whiteboardHistory.has(roomId)) global.whiteboardHistory.set(roomId, []);
        const hist = global.whiteboardHistory.get(roomId);
        hist.push(stroke);
        if (hist.length > 500) hist.splice(0, hist.length - 500);
        // Broadcast to everyone else in the whiteboard room
        socket.to(`wb:${roomId}`).emit('whiteboard_draw', stroke);
    });

    socket.on('whiteboard_clear', ({ roomId }) => {
        if (!roomId) return;
        global.whiteboardHistory.set(roomId, []);
        socket.to(`wb:${roomId}`).emit('whiteboard_clear');
    });
});

// ── Deployment ──────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, 'client', 'dist');
    // Serve static files from the dist directory
    app.use(express.static(distPath));
    
    // Catch-all route to serve index.html for SPA
    app.get('/*splat', (req, res) => {
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.status(404).send('Build files not found. Please run npm run build.');
        }
    });
} else {
    app.use(express.static(path.join(__dirname, 'public')));
    app.get('/', (req, res) => {
        res.send('API is running...');
    });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
