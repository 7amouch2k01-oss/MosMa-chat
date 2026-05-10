import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { LogOut, Plus, Users, Send, Search, X, Hash, User, UserSearch as UserSearchIcon, Shield, Smile, MoreVertical, MessageSquare, Bell, Settings, Phone, Video, Paperclip, FileText, Image as ImageIcon, Home, CheckCircle } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { ToastContainer, useToast } from './Toast';
import FriendsList from './FriendsList';
import UserSearch from './UserSearch';
import MembersPanel from './MembersPanel';
import ProfilePanel from './ProfilePanel';
import SettingsPanel from './SettingsPanel';
import NotificationPanel from './NotificationPanel';
import CallPanel from './CallPanel';
import AdminDashboard from './AdminDashboard';
import TaskManager from './TaskManager';
import './Chat.css';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${BACKEND_URL}/api`;

// Highlight text that matches the search query
const HighlightText = ({ text, query }) => {
    if (!query.trim()) return <>{text}</>;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
        <>
            {parts.map((part, i) =>
                regex.test(part)
                    ? <mark key={i} className="highlight">{part}</mark>
                    : part
            )}
        </>
    );
};

// Status checkmark component
const MsgStatus = ({ status }) => {
    if (status === 'sending') return <span className="msg-status">✓</span>;
    if (status === 'delivered') return <span className="msg-status delivered">✓✓</span>;
    return null;
};

const THEMES = {
    dark: [
        { key: 'theme-cosmic',   label: 'Cosmic',   color: '#4F46E5' },
        { key: 'theme-ember',    label: 'Ember',    color: '#F97316' },
        { key: 'theme-cyber',    label: 'Cyber',    color: '#06B6D4' },
        { key: 'theme-midnight', label: 'Midnight', color: '#1E293B' },
        { key: 'theme-aurora',   label: 'Aurora',   color: '#10B981' },
        { key: 'theme-noir',     label: 'Noir',     color: '#000000' },
    ],
    light: [
        { key: 'theme-snow',     label: 'Snow',     color: '#F8FAFC' },
        { key: 'theme-blush',    label: 'Blush',    color: '#FDF2F8' },
        { key: 'theme-mint',     label: 'Mint',     color: '#F0FDF4' },
        { key: 'theme-sky',      label: 'Sky',      color: '#F0F9FF' },
        { key: 'theme-lavender', label: 'Lavender', color: '#F5F3FF' },
        { key: 'theme-classic',  label: 'Classic',  color: '#FFFFFF' },
    ]
};

const Chat = () => {
    const [rooms, setRooms]               = useState([]);
    const [currentRoom, setCurrentRoom]   = useState(null);
    const [newRoomName, setNewRoomName]   = useState('');
    const [newRoomDesc, setNewRoomDesc]   = useState('');
    const [messages, setMessages]         = useState([]);
    const [newMessage, setNewMessage]     = useState('');
    const [roomUsers, setRoomUsers]       = useState([]);
    const [socket, setSocket]             = useState(null);
    const [userInfo, setUserInfo]         = useState(null);
    const [currentTheme, setCurrentTheme] = useState('theme-cosmic');

    // Typing
    const [typingUsers, setTypingUsers] = useState([]);
    const typingTimerRef = useRef(null);
    const isTypingRef    = useRef(false);

    // Online presence
    const [onlineUserIds, setOnlineUserIds] = useState(new Set());

    // UI Panels
    const [searchOpen, setSearchOpen]     = useState(false);
    const [searchQuery, setSearchQuery]   = useState('');
    const [showUserSearch, setShowUserSearch] = useState(false);
    const [showMembers, setShowMembers]   = useState(false);
    const [showProfile, setShowProfile]   = useState(false);
    const [profileUser, setProfileUser]   = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('chatSettings');
        return saved ? JSON.parse(saved) : {
            notifications: true,
            sounds: true,
            showOnline: true,
        };
    });
    const [showAdmin, setShowAdmin] = useState(false);
    const [showTasks, setShowTasks] = useState(false);

    // Call state
    const [activeCall, setActiveCall]     = useState(null); // { targetUser, type }
    const [incomingCall, setIncomingCall] = useState(null); // { from, name, offer, type }

    // Message status
    const [msgStatuses, setMsgStatuses] = useState({});
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();

    const messagesEndRef = useRef(null);
    const { toasts, addToast, removeToast } = useToast();
    const searchInputRef = useRef(null);
    const emojiPickerRef = useRef(null);

    const pushNotification = useCallback((message, type, duration = 3500, action = null) => {
        if (settings.notifications) {
            addToast(message, type, duration, action);
        }
        setNotifications(prev => [{
            id: Date.now() + Math.random(),
            message,
            type,
            timestamp: new Date(),
        }, ...prev].slice(0, 50)); // Keep last 50
    }, [addToast, settings.notifications]);

    // Update global online users for sub-components
    useEffect(() => {
        window.__onlineUsers = onlineUserIds;
    }, [onlineUserIds]);

    // ── Init ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        const stored = localStorage.getItem('userInfo');
        if (stored) setUserInfo(JSON.parse(stored));
        const storedTheme = localStorage.getItem('chatTheme');
        if (storedTheme) setCurrentTheme(storedTheme);
        fetchRooms();

        // Close emoji picker on outside click
        const handleClickOutside = (e) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchRooms = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
            const { data } = await axios.get(`${API_URL}/rooms`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRooms(data);
        } catch (err) {
            console.error('Error fetching rooms', err);
        }
    };

    // ── Socket Setup ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!userInfo) return;

        const newSocket = io(BACKEND_URL);
        setSocket(newSocket);

        newSocket.emit('user_connected', {
            userId:   userInfo._id,
            username: userInfo.username,
        });

        newSocket.on('online_users_list', (ids) => {
            setOnlineUserIds(new Set(ids));
        });

        newSocket.on('user_online', ({ userId, username }) => {
            setOnlineUserIds(prev => new Set([...prev, userId]));
            if (userId !== userInfo._id) {
                pushNotification(`${username} is now online`, 'online', 2500);
            }
        });

        newSocket.on('user_offline', ({ userId, username }) => {
            setOnlineUserIds(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
            pushNotification(`${username} went offline`, 'leave', 2500);
        });

        // Friend request handler
        newSocket.on('friend_request_received', ({ requesterName, request }) => {
            const handleAccept = async (id) => {
                try {
                    await axios.put(`${API_URL}/friends/accept/${request._id}`, {}, {
                        headers: { Authorization: `Bearer ${userInfo.token}` }
                    });
                    newSocket.emit('friend_request_accepted', { recipientId: request.requester._id });
                    pushNotification(`You are now friends with ${requesterName}!`, 'success');
                    removeToast(id);
                } catch (err) {
                    pushNotification('Failed to accept request', 'error');
                }
            };

            const handleDecline = async (id) => {
                try {
                    await axios.put(`${API_URL}/friends/decline/${request._id}`, {}, {
                        headers: { Authorization: `Bearer ${userInfo.token}` }
                    });
                    pushNotification(`Declined request from ${requesterName}`, 'info');
                    removeToast(id);
                } catch (err) {
                    pushNotification('Failed to decline request', 'error');
                }
            };

            pushNotification(`Friend request from ${requesterName}`, 'request', 0, (id) => (
                <>
                    <button className="toast-btn toast-btn-accept" onClick={() => handleAccept(id)}>Accept</button>
                    <button className="toast-btn toast-btn-decline" onClick={() => handleDecline(id)}>Decline</button>
                </>
            ));
        });

        // Incoming call listener
        newSocket.on('incoming_call', ({ from, name, offer, type }) => {
            const caller = { _id: from, username: name };
            setIncomingCall({ from, name, offer, type });
            setActiveCall({ targetUser: caller, type });
        });

        newSocket.on('banned', ({ message }) => {
            alert(message);
            localStorage.removeItem('userInfo');
            window.location.href = '/';
        });

        newSocket.on('broadcast', ({ message, sender }) => {
            addToast(`[GLOBAL] ${sender}: ${message}`, 'info', 10000);
        });

        return () => {
            newSocket.disconnect();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userInfo]);

    // ── Room Socket ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (!socket || !currentRoom || !userInfo) return;

        socket.emit('join_room', {
            roomId:   currentRoom._id,
            userId:   userInfo._id,
            username: userInfo.username,
        });

        socket.on('previous_messages', (msgs) => setMessages(msgs));
        socket.on('receive_message', (msg) => {
            setMessages(prev => [...prev, msg]);
            if (msg.username !== userInfo.username) {
                pushNotification(`New message from ${msg.username}`, 'dm', 3000);
                if (settings.sounds) {
                    const audio = new Audio('/notification.mp3');
                    audio.play().catch(() => {});
                }
            }
        });
        socket.on('room_users_update', (users) => setRoomUsers(users));
        socket.on('user_joined', ({ username }) => pushNotification(`${username} joined the room`, 'join'));
        socket.on('user_left', ({ username }) => pushNotification(`${username} left the room`, 'leave'));

        // Typing
        socket.on('typing_start', ({ username }) => {
            setTypingUsers(prev => prev.includes(username) ? prev : [...prev, username]);
        });
        socket.on('typing_stop', ({ username }) => {
            setTypingUsers(prev => prev.filter(u => u !== username));
        });

        // Reactions
        socket.on('reaction_update', ({ messageId, reactions }) => {
            setMessages(prev => prev.map(m => m._id === messageId ? { ...m, reactions } : m));
        });

        return () => {
            socket.emit('leave_room', {
                roomId:   currentRoom._id,
                userId:   userInfo._id,
                username: userInfo.username,
            });
            socket.off('previous_messages');
            socket.off('receive_message');
            socket.off('room_users_update');
            socket.off('user_joined');
            socket.off('user_left');
            socket.off('typing_start');
            socket.off('typing_stop');
            setMessages([]);
            setTypingUsers([]);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentRoom, socket]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typingUsers]);

    // Focus search
    useEffect(() => {
        if (searchOpen) searchInputRef.current?.focus();
        else setSearchQuery('');
    }, [searchOpen]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        if (!socket || !currentRoom) return;

        if (!isTypingRef.current) {
            isTypingRef.current = true;
            socket.emit('typing_start', { roomId: currentRoom._id, username: userInfo.username });
        }
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            isTypingRef.current = false;
            socket.emit('typing_stop', { roomId: currentRoom._id, username: userInfo.username });
        }, 1500);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        if (isTypingRef.current) {
            isTypingRef.current = false;
            clearTimeout(typingTimerRef.current);
            socket.emit('typing_stop', { roomId: currentRoom._id, username: userInfo.username });
        }

        const tempId = `temp-${Date.now()}`;
        
        // --- Task Command Check ---
        if (newMessage.startsWith('/task')) {
            const parts = newMessage.split(' ');
            if (parts.length >= 2) {
                let category = 'others';
                let titleIdx = 1;
                
                const catMap = { 'important': 'important', 'common': 'common', 'daily': 'daily', 'others': 'others' };
                if (catMap[parts[1].toLowerCase()]) {
                    category = parts[1].toLowerCase();
                    titleIdx = 2;
                }
                
                const taskTitle = parts.slice(titleIdx).join(' ');
                if (taskTitle) {
                    axios.post(`${API_URL}/tasks`, 
                        { title: taskTitle, category },
                        { headers: { Authorization: `Bearer ${userInfo.token}` } }
                    ).then(() => {
                        addToast(`Task added to ${category}!`, 'success');
                        navigate('/tasks');
                    }).catch(() => addToast('Failed to add task', 'error'));
                    
                    setNewMessage('');
                    return;
                }
            }
        }
        // -------------------------

        setMsgStatuses(prev => ({ ...prev, [tempId]: 'sending' }));

        socket.emit('send_message', {
            room:     currentRoom._id,
            username: userInfo.username,
            content:  newMessage,
            tempId,
        }, ({ status, messageId }) => {
            setMsgStatuses(prev => {
                const next = { ...prev };
                delete next[tempId];
                if (messageId) next[messageId] = 'delivered';
                return next;
            });
        });

        setNewMessage('');
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        setUploading(true);

        try {
            const { data } = await axios.post(`${API_URL}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Send file message
            socket.emit('send_message', {
                room: currentRoom._id,
                username: userInfo.username,
                content: `Sent a file: ${data.fileName}`,
                fileUrl: data.url,
                fileType: data.fileType,
                fileName: data.fileName,
            });
            addToast('File uploaded!', 'success');
        } catch (err) {
            addToast('Upload failed', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleEmojiClick = (emojiData) => {
        setNewMessage(prev => prev + emojiData.emoji);
        setShowEmojiPicker(false);
    };

    const handleAddReaction = (messageId, emoji) => {
        if (!socket || !currentRoom) return;
        socket.emit('message_reaction', {
            messageId,
            emoji,
            userId: userInfo._id,
            roomId: currentRoom._id
        });
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        try {
            const token = userInfo?.token;
            await axios.post(`${API_URL}/rooms`,
                { name: newRoomName, description: newRoomDesc },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNewRoomName('');
            setNewRoomDesc('');
            fetchRooms();
            addToast(`Room "${newRoomName}" created!`, 'success');
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to create room', 'error');
        }
    };

    const handleStartDM = async (otherUser) => {
        try {
            const token = userInfo?.token;
            const { data } = await axios.post(`${API_URL}/rooms/dm`, 
                { userId: otherUser._id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Set the "name" of the DM room for display purposes locally
            data.name = otherUser.username; 
            setCurrentRoom(data);
            setShowUserSearch(false);
            setShowMembers(false);
        } catch (err) {
            addToast('Failed to start DM', 'error');
        }
    };

    const handleViewProfile = (user) => {
        setProfileUser(user);
        setShowProfile(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        window.location.href = '/login';
    };

    const handleStartCall = (type) => {
        if (!currentRoom || currentRoom.type !== 'dm') return;
        const otherUser = roomUsers.find(u => u._id !== userInfo._id);
        if (otherUser) {
            setActiveCall({ targetUser: otherUser, type });
        } else {
            addToast('User not found in room', 'error');
        }
    };

    const changeTheme = (theme) => {
        setCurrentTheme(theme);
        localStorage.setItem('chatTheme', theme);
        window.dispatchEvent(new Event('themeChanged'));
    };

    const filteredMessages = searchQuery.trim()
        ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
        : messages;

    const typingText = typingUsers.length === 1
        ? `${typingUsers[0]} is typing`
        : typingUsers.length === 2
            ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
            : typingUsers.length > 2
                ? 'Several people are typing'
                : null;

    if (showAdmin) {
        return <AdminDashboard userInfo={userInfo} onBack={() => setShowAdmin(false)} />;
    }

    return (
        <div className={`chat-dashboard ${currentTheme}`}>
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            {activeCall && (
                <CallPanel 
                    socket={socket} 
                    userInfo={userInfo} 
                    targetUser={activeCall.targetUser} 
                    type={activeCall.type}
                    incomingCall={incomingCall}
                    onEndCall={() => {
                        setActiveCall(null);
                        setIncomingCall(null);
                    }}
                />
            )}

            {/* Side Panels Overlays */}
            {showUserSearch && (
                <UserSearch 
                    userInfo={userInfo} 
                    onClose={() => setShowUserSearch(false)} 
                    onStartDM={handleStartDM}
                    socket={socket}
                    onToast={addToast}
                    onViewProfile={handleViewProfile}
                />
            )}
            {showMembers && (
                <MembersPanel 
                    room={currentRoom} 
                    userInfo={userInfo} 
                    onClose={() => setShowMembers(false)}
                    onStartDM={handleStartDM}
                    onToast={addToast}
                    socket={socket}
                    onViewProfile={handleViewProfile}
                />
            )}
            {showProfile && (
                <ProfilePanel 
                    userInfo={userInfo} 
                    targetUser={profileUser}
                    onClose={() => {
                        setShowProfile(false);
                        setProfileUser(null);
                    }} 
                />
            )}
            {showSettings && (
                <SettingsPanel 
                    settings={settings} 
                    currentTheme={currentTheme}
                    themes={THEMES}
                    onUpdateTheme={changeTheme}
                    onUpdate={(s) => {
                        setSettings(s);
                        localStorage.setItem('chatSettings', JSON.stringify(s));
                    }}
                    onClose={() => setShowSettings(false)} 
                />
            )}
            {showNotifications && (
                <NotificationPanel 
                    notifications={notifications}
                    onClear={() => setNotifications([])}
                    onRemove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
                    onClose={() => setShowNotifications(false)}
                />
            )}
            {showTasks && <TaskManager userInfo={userInfo} onClose={() => setShowTasks(false)} />}

            {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
            <div className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <div className="sidebar-logo">💬</div>
                        <h2>NexChat</h2>
                    </div>
                    <div className="sidebar-actions">
                        <button className="icon-btn" onClick={() => navigate('/')} title="Back to Home">
                            <Home size={18} />
                        </button>
                        <button className="icon-btn" onClick={() => setShowNotifications(true)} title="Notifications">
                            <Bell size={18} />
                            {notifications.length > 0 && <span className="notif-badge">{notifications.length}</span>}
                        </button>
                        <button className="icon-btn" onClick={() => setShowSettings(true)} title="Settings">
                            <Settings size={18} />
                        </button>
                        <button className="icon-btn" onClick={() => handleViewProfile(userInfo)} title="My Profile">
                            <User size={18} />
                        </button>
                        <button className="icon-btn" onClick={() => navigate('/feed')} title="Social Feed">
                            <Home size={18} />
                        </button>
                        <button className="icon-btn logout-btn" onClick={handleLogout} title="Logout">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>



                <div className="sidebar-body">
                    <div className="sidebar-top-actions">
                        <button className="sidebar-action-pill" onClick={() => setShowUserSearch(true)}>
                            <Search size={14} /> Discover People
                        </button>
                        <button className="sidebar-action-pill" onClick={() => navigate('/tasks')}>
                            <CheckCircle size={14} /> Task Board
                        </button>
                        {userInfo?.isAdmin && (
                            <button className="sidebar-action-pill admin-pill" onClick={() => setShowAdmin(true)}>
                                <Shield size={14} /> Admin Panel
                            </button>
                        )}
                    </div>

                    {/* Friends */}
                    <FriendsList 
                        userInfo={userInfo} 
                        onStartDM={handleStartDM} 
                        socket={socket} 
                        onlineUserIds={onlineUserIds} 
                    />

                    {/* Create room */}
                    <div>
                        <p className="section-title"><Plus size={12} /> New Room</p>
                        <form onSubmit={handleCreateRoom} className="create-room-form">
                            <input
                                className="sidebar-input"
                                type="text"
                                placeholder="Room name"
                                value={newRoomName}
                                onChange={e => setNewRoomName(e.target.value)}
                                required
                            />
                            <button type="submit" className="create-btn">
                                <Plus size={14} /> Create Room
                            </button>
                        </form>
                    </div>

                    {/* Room list */}
                    <div className="rooms-list">
                        <p className="section-title"><Hash size={12} /> Rooms</p>
                        <ul>
                            {rooms.filter(r => r.type !== 'dm').map(room => (
                                <li
                                    key={room._id}
                                    className={`room-item ${currentRoom?._id === room._id ? 'active' : ''}`}
                                    onClick={() => setCurrentRoom(room)}
                                >
                                    <div className="room-item-row">
                                        <span className="room-name">{room.name}</span>
                                        <span className="room-users-count">
                                            <Users size={11} /> {room.users?.length || 0}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* DM list */}
                    <div className="rooms-list">
                        <p className="section-title"><MessageSquare size={12} /> Direct Messages</p>
                        <ul>
                            {rooms.filter(r => r.type === 'dm').map(room => {
                                const other = room.participants?.find(p => p._id !== userInfo?._id);
                                const isOnline = other ? onlineUserIds.has(other._id) : false;
                                return (
                                    <li 
                                        key={room._id} 
                                        className={`room-item ${currentRoom?._id === room._id ? 'active' : ''}`} 
                                        onClick={() => setCurrentRoom(room)}
                                    >
                                        <div className="room-item-row">
                                            <span className="room-name">{other?.username || 'Private Chat'}</span>
                                            <span className={isOnline ? 'online-dot' : 'offline-dot'} />
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </div>

            {/* ── MAIN CHAT ─────────────────────────────────────────────────── */}
            <div className="main-chat">
                {currentRoom ? (
                    <>
                        <div className="chat-header">
                            <div className="room-title">
                                <h2>{currentRoom.type === 'dm' ? '@' : '#'} {currentRoom.name}</h2>
                                {currentRoom.description && <p>{currentRoom.description}</p>}
                            </div>

                            <div className="chat-header-right">
                                <div className={`search-bar-wrap ${searchOpen ? 'open' : ''}`}>
                                    <input
                                        ref={searchInputRef}
                                        className="search-input"
                                        placeholder="Search messages..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                    {searchQuery && <span className="search-count">{filteredMessages.length} matches</span>}
                                </div>
                                <button
                                    className="icon-btn"
                                    onClick={() => setSearchOpen(o => !o)}
                                    title={searchOpen ? 'Close search' : 'Search messages'}
                                >
                                    {searchOpen ? <X size={18} /> : <Search size={18} />}
                                </button>
                                
                                {currentRoom.type === 'dm' && (
                                    <>
                                        <button className="icon-btn" onClick={() => handleStartCall('voice')} title="Voice Call"><Phone size={18} /></button>
                                        <button className="icon-btn" onClick={() => handleStartCall('video')} title="Video Call"><Video size={18} /></button>
                                    </>
                                )}

                                {currentRoom.type !== 'dm' && (
                                    <button 
                                        className="icon-btn" 
                                        onClick={() => setShowMembers(true)}
                                        title="Room Members"
                                    >
                                        <Users size={18} />
                                    </button>
                                )}

                                <div className="online-users" onClick={() => setShowMembers(true)}>
                                    {roomUsers.slice(0, 3).map(u => (
                                        <div key={u._id} className="user-pill">
                                            <span className={onlineUserIds.has(u._id) ? 'online-dot' : 'offline-dot'} />
                                            {u.username}
                                        </div>
                                    ))}
                                    {roomUsers.length > 3 && (
                                        <div className="user-pill">+{roomUsers.length - 3}</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="messages-container">
                            {filteredMessages.map((msg, idx) => {
                                const isOwn = msg.username === userInfo?.username;
                                const statusKey = msg._id?.toString();
                                return (
                                    <div
                                        key={msg._id || idx}
                                        className={`message ${isOwn ? 'own-message' : 'other-message'}`}
                                    >
                                        <div className="message-content">
                                            {!isOwn && <span className="sender">{msg.username}</span>}
                                            <p>
                                                <HighlightText text={msg.content} query={searchQuery} />
                                            </p>
                                            
                                            {msg.fileUrl && (
                                                <div className="message-attachment">
                                                    {msg.fileType?.startsWith('image/') ? (
                                                        <a href={`${BACKEND_URL}${msg.fileUrl}`} target="_blank" rel="noreferrer">
                                                            <img src={`${BACKEND_URL}${msg.fileUrl}`} alt="attachment" className="attached-image" />
                                                        </a>
                                                    ) : (
                                                        <a href={`${BACKEND_URL}${msg.fileUrl}`} target="_blank" rel="noreferrer" className="attached-file">
                                                            <FileText size={20} />
                                                            <div className="file-info">
                                                                <span className="file-name">{msg.fileName}</span>
                                                                <span className="file-size">Download File</span>
                                                            </div>
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                            <div className="msg-footer">
                                                <span className="time">
                                                    {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], {
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </span>
                                                {isOwn && <MsgStatus status={msgStatuses[statusKey] || 'delivered'} />}
                                            </div>

                                            {/* Reactions Display */}
                                            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                                <div className="reactions-row">
                                                    {Object.entries(msg.reactions).map(([emoji, users]) => (
                                                        <div 
                                                            key={emoji} 
                                                            className={`reaction-pill ${users.includes(userInfo._id) ? 'active' : ''}`}
                                                            onClick={() => handleAddReaction(msg._id, emoji)}
                                                        >
                                                            {emoji} <span>{users.length}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Quick Reaction Actions */}
                                            <div className="quick-reactions">
                                                {['👍', '❤️', '🔥', '😂', '😮'].map(emoji => (
                                                    <button key={emoji} onClick={() => handleAddReaction(msg._id, emoji)}>
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {typingText && (
                                <div className="typing-indicator">
                                    <div className="typing-dots"><span /><span /><span /></div>
                                    <span className="typing-text">{typingText}…</span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="message-form">
                            <div className="input-group">
                                <button 
                                    type="button" 
                                    className="emoji-btn" 
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                >
                                    <Smile size={20} />
                                </button>
                                
                                {showEmojiPicker && (
                                    <div className="emoji-picker-container" ref={emojiPickerRef}>
                                        <EmojiPicker 
                                            onEmojiClick={handleEmojiClick} 
                                            theme={currentTheme.includes('cosmic') || currentTheme.includes('cyber') ? 'dark' : 'light'}
                                            width={320}
                                            height={400}
                                        />
                                    </div>
                                )}

                                <label className="file-upload-btn">
                                    <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
                                    <Paperclip size={20} color={uploading ? 'var(--accent)' : 'currentColor'} />
                                </label>

                                <input
                                    className="message-input"
                                    type="text"
                                    placeholder={uploading ? "Uploading..." : "Type a message..."}
                                    value={newMessage}
                                    onChange={handleTyping}
                                    disabled={uploading}
                                    required={!uploading}
                                />
                                <button type="submit" className="send-btn">
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="no-room-selected">
                        <div className="welcome-icon">💬</div>
                        <h2>Welcome to NexChat</h2>
                        <p>Select a room or friend to start chatting!</p>
                        <button className="create-btn" onClick={() => setShowUserSearch(true)}>
                            <Search size={14} /> Find People
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
