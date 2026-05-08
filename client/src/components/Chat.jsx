import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { LogOut, Plus, Users, Send } from 'lucide-react';
import './Chat.css';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${BACKEND_URL}/api`;

const Chat = () => {
    const [rooms, setRooms] = useState([]);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomDesc, setNewRoomDesc] = useState('');
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [roomUsers, setRoomUsers] = useState([]);
    const [socket, setSocket] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [currentTheme, setCurrentTheme] = useState('theme-ocean');
    
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
            setUserInfo(JSON.parse(storedUser));
        }
        
        const storedTheme = localStorage.getItem('chatTheme');
        if (storedTheme) {
            setCurrentTheme(storedTheme);
        }
        
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get(`${API_URL}/rooms`, config);
            setRooms(data);
        } catch (error) {
            console.error('Error fetching rooms', error);
        }
    };

    useEffect(() => {
        if (currentRoom && userInfo) {
            const newSocket = io(BACKEND_URL);
            setSocket(newSocket);

            newSocket.emit('join_room', { 
                roomId: currentRoom._id, 
                userId: userInfo._id, 
                username: userInfo.username 
            });

            newSocket.on('previous_messages', (msgs) => {
                setMessages(msgs);
            });

            newSocket.on('receive_message', (msg) => {
                setMessages((prev) => [...prev, msg]);
            });

            newSocket.on('room_users_update', (users) => {
                setRoomUsers(users);
            });

            newSocket.on('user_joined', (data) => {
                // Could add a toast notification here
                console.log(`${data.username} joined the room`);
            });

            newSocket.on('user_left', (data) => {
                console.log(`${data.username} left the room`);
            });

            return () => {
                newSocket.emit('leave_room', { 
                    roomId: currentRoom._id, 
                    userId: userInfo._id, 
                    username: userInfo.username 
                });
                newSocket.disconnect();
            };
        }
    }, [currentRoom, userInfo]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        try {
            const token = userInfo?.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(`${API_URL}/rooms`, { name: newRoomName, description: newRoomDesc }, config);
            setNewRoomName('');
            setNewRoomDesc('');
            fetchRooms();
        } catch (error) {
            alert('Failed to create room: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() && socket) {
            socket.emit('send_message', {
                room: currentRoom._id,
                username: userInfo.username,
                content: newMessage
            });
            setNewMessage('');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        window.location.href = '/login';
    };

    const changeTheme = (theme) => {
        setCurrentTheme(theme);
        localStorage.setItem('chatTheme', theme);
    };

    return (
        <div className={`chat-dashboard ${currentTheme}`}>
            <div className="sidebar">
                <div className="sidebar-header">
                    <h2>Chat Rooms</h2>
                    <button onClick={handleLogout} className="logout-btn" title="Logout">
                        <LogOut size={20} />
                    </button>
                </div>
                
                <div className="theme-controls">
                    <button 
                        className={`theme-btn theme-ocean-btn ${currentTheme === 'theme-ocean' ? 'active' : ''}`} 
                        onClick={() => changeTheme('theme-ocean')}
                        title="Ocean Theme"
                    />
                    <button 
                        className={`theme-btn theme-sunset-btn ${currentTheme === 'theme-sunset' ? 'active' : ''}`} 
                        onClick={() => changeTheme('theme-sunset')}
                        title="Sunset Theme"
                    />
                    <button 
                        className={`theme-btn theme-neon-btn ${currentTheme === 'theme-neon' ? 'active' : ''}`} 
                        onClick={() => changeTheme('theme-neon')}
                        title="Neon Theme"
                    />
                    <button 
                        className={`theme-btn theme-aurora-btn ${currentTheme === 'theme-aurora' ? 'active' : ''}`} 
                        onClick={() => changeTheme('theme-aurora')}
                        title="Aurora Theme"
                    />
                </div>

                <div className="create-room-section">
                    <h3>Create Room</h3>
                    <form onSubmit={handleCreateRoom} className="create-room-form">
                        <input 
                            type="text" 
                            placeholder="Room Name" 
                            value={newRoomName} 
                            onChange={(e) => setNewRoomName(e.target.value)}
                            required 
                        />
                        <input 
                            type="text" 
                            placeholder="Description (Optional)" 
                            value={newRoomDesc} 
                            onChange={(e) => setNewRoomDesc(e.target.value)} 
                        />
                        <button type="submit" className="create-btn">
                            <Plus size={16} /> Create
                        </button>
                    </form>
                </div>

                <div className="rooms-list">
                    <h3>Available Rooms</h3>
                    <ul>
                        {rooms.map((room) => (
                            <li 
                                key={room._id} 
                                className={currentRoom?._id === room._id ? 'active' : ''}
                                onClick={() => setCurrentRoom(room)}
                            >
                                <div className="room-info">
                                    <span className="room-name">{room.name}</span>
                                    <span className="room-users-count">
                                        <Users size={12} /> {room.users?.length || 0}
                                    </span>
                                </div>
                                {room.description && <p className="room-desc">{room.description}</p>}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="main-chat">
                {currentRoom ? (
                    <>
                        <div className="chat-header">
                            <div className="room-title">
                                <h2>{currentRoom.name}</h2>
                                {currentRoom.description && <p>{currentRoom.description}</p>}
                            </div>
                            <div className="active-users">
                                <h3><Users size={16} /> Users in Room</h3>
                                <ul>
                                    {roomUsers.map((u) => (
                                        <li key={u._id}>{u.username}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="messages-container">
                            {messages.map((msg, idx) => (
                                <div 
                                    key={idx} 
                                    className={`message ${msg.username === userInfo?.username ? 'own-message' : 'other-message'}`}
                                >
                                    <div className="message-content">
                                        <span className="sender">{msg.username}</span>
                                        <p>{msg.content}</p>
                                        <span className="time">
                                            {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="message-form">
                            <input 
                                type="text" 
                                placeholder="Type a message..." 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                required
                            />
                            <button type="submit" className="send-btn">
                                <Send size={20} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="no-room-selected">
                        <div className="welcome-icon">💬</div>
                        <h2>Welcome to Real-Time Chat</h2>
                        <p>Select a room from the sidebar or create a new one to start chatting!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
