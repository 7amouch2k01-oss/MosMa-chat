const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const Message = require('./models/Message');
const Room = require('./models/Room');
const path = require('path');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust this in production
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Serve frontend
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/dist')));

    app.get('*', (req, res) =>
        res.sendFile(
            path.resolve(__dirname, 'client', 'dist', 'index.html')
        )
    );
} else {
    app.use(express.static(path.join(__dirname, 'public')));
}

// Socket.io connection
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join room
    socket.on('join_room', async (data) => {
        const { roomId, userId, username } = data;
        socket.join(roomId);
        console.log(`User with ID: ${socket.id} joined room: ${roomId}`);
        
        // Save socket user data for disconnect event
        socket.data.userId = userId;
        socket.data.roomId = roomId;
        socket.data.username = username;

        try {
            // Add user to room's active user list if userId is provided
            if (userId) {
                await Room.findByIdAndUpdate(roomId, {
                    $addToSet: { users: userId }
                });
            }

            // Fetch previous messages for the room
            const messages = await Message.find({ room: roomId }).sort({ createdAt: 1 }).limit(50);
            socket.emit('previous_messages', messages);
            
            // Notify others in room
            socket.to(roomId).emit('user_joined', { username });
            
            // Update the room user list for all clients
            const updatedRoom = await Room.findById(roomId).populate('users', 'username email');
            io.to(roomId).emit('room_users_update', updatedRoom.users);

        } catch (error) {
            console.error('Error in join_room:', error);
        }
    });

    // Leave room
    socket.on('leave_room', async (data) => {
        const { roomId, userId, username } = data;
        socket.leave(roomId);
        console.log(`User left room: ${roomId}`);

        try {
            if (userId) {
                await Room.findByIdAndUpdate(roomId, {
                    $pull: { users: userId }
                });
            }
            
            socket.to(roomId).emit('user_left', { username });
            
            const updatedRoom = await Room.findById(roomId).populate('users', 'username email');
            if(updatedRoom) {
                io.to(roomId).emit('room_users_update', updatedRoom.users);
            }
        } catch (error) {
            console.error('Error in leave_room:', error);
        }
    });

    // Send message
    socket.on('send_message', async (data) => {
        try {
            // Save message to database
            const newMessage = new Message({
                username: data.username,
                content: data.content,
                room: data.room // This should be roomId
            });
            const savedMessage = await newMessage.save();

            // Broadcast message to everyone in the room
            io.to(data.room).emit('receive_message', savedMessage);
        } catch (error) {
            console.error('Error saving message:', error);
        }
    });

    socket.on('disconnect', async () => {
        console.log('User Disconnected', socket.id);
        const { userId, roomId, username } = socket.data;
        
        if (userId && roomId) {
            try {
                await Room.findByIdAndUpdate(roomId, {
                    $pull: { users: userId }
                });
                
                socket.to(roomId).emit('user_left', { username });
                
                const updatedRoom = await Room.findById(roomId).populate('users', 'username email');
                if(updatedRoom) {
                    io.to(roomId).emit('room_users_update', updatedRoom.users);
                }
            } catch (error) {
                console.error('Error updating room on disconnect:', error);
            }
        }
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
