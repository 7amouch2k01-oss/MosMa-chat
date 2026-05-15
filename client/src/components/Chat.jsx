import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { LogOut, Plus, Users, Send, Search, X, Hash, User, UserSearch as UserSearchIcon, Shield, Smile, MoreVertical, MessageSquare, Bell, Settings, Phone, Video, Paperclip, FileText, Image as ImageIcon, Home, CheckCircle, Edit3, Trash2, Menu, RefreshCw } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useToast } from './Toast';
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

const BACKEND_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);
const API_URL = `${BACKEND_URL}/api`;

function readStoredUserInfo() {
    try {
        const raw = localStorage.getItem('userInfo');
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        localStorage.removeItem('userInfo');
        return null;
    }
}

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
    const [userInfo, setUserInfo]         = useState(readStoredUserInfo);
    const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('chatTheme') || 'theme-snow');

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
    const [mobileSidebar, setMobileSidebar] = useState(false);

    // Call state
    const [activeCall, setActiveCall]     = useState(null); // { targetUser, type }
    const [incomingCall, setIncomingCall] = useState(null); // { from, name, offer, type }

    // Message status
    const [msgStatuses, setMsgStatuses] = useState({});
    const [uploading, setUploading] = useState(false);
    const [editingMsgId, setEditingMsgId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [sidebarSearch, setSidebarSearch] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [errorBoundary, setErrorBoundary] = useState(null);
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

    const fetchRooms = useCallback(async () => {
        try {
            const token = readStoredUserInfo()?.token;
            if (!token) return;
            const { data } = await axios.get(`${API_URL}/rooms`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRooms(data);
        } catch (err) {
            console.error('Error fetching rooms', err);
        }
    }, []);

    // Update global online users for sub-components
    useEffect(() => {
        window.__onlineUsers = onlineUserIds;
    }, [onlineUserIds]);

    // ── Init ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        const stored = localStorage.getItem('userInfo');
        if (stored) {
            try {
                setUserInfo(JSON.parse(stored));
            } catch {
                localStorage.removeItem('userInfo');
                navigate('/login');
                return;
            }
        }
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
    }, [fetchRooms, navigate]);

    // ── Socket Setup ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!userInfo) return;

        const newSocket = io(BACKEND_URL, {
            auth: { token: userInfo.token },
        });
        setSocket(newSocket);

        newSocket.emit('user_connected');

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

        // Delete/Edit
        socket.on('message_deleted', ({ messageId }) => {
            setMessages(prev => prev.filter(m => m._id !== messageId));
        });

        socket.on('message_edited', (updatedMsg) => {
            setMessages(prev => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
        });

        return () => {
            socket.emit('leave_room', {
                roomId:   currentRoom._id,
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
        const timer = setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return () => clearTimeout(timer);
    }, [messages, currentRoom, typingUsers]);

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
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${userInfo.token}`,
                }
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
            roomId: currentRoom._id
        });
    };

    const handleDeleteMessage = (messageId) => {
        if (!window.confirm('Delete this message?')) return;
        if (socket && currentRoom) {
            socket.emit('delete_message', { messageId, roomId: currentRoom._id });
        }
    };

    const startEditing = (msg) => {
        setEditingMsgId(msg._id);
        setEditContent(msg.content);
    };

    const handleSaveEdit = (e) => {
        e.preventDefault();
        if (!editContent.trim() || !socket || !currentRoom) return;
        socket.emit('edit_message', { 
            messageId: editingMsgId, 
            content: editContent, 
            roomId: currentRoom._id 
        });
        setEditingMsgId(null);
        setEditContent('');
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        if (!newRoomName.trim()) return;
        try {
            const token = userInfo?.token;
            const { data } = await axios.post(`${API_URL}/rooms`,
                { name: newRoomName, description: newRoomDesc },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setRooms(prev => [data, ...prev]);
            setCurrentRoom(data);
            setNewRoomName('');
            setNewRoomDesc('');
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
            
            // Check if room already in list
            setRooms(prev => {
                const exists = prev.some(r => r._id === data._id);
                if (exists) return prev;
                return [data, ...prev];
            });

            setCurrentRoom(data);
            setShowUserSearch(false);
            setShowMembers(false);
            setMobileSidebar(false);
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

    const handleServerSearch = async () => {
        if (!searchQuery.trim() || !currentRoom) return;
        setSearchLoading(true);
        try {
            const token = userInfo?.token;
            const { data } = await axios.get(`${API_URL}/rooms/${currentRoom._id}/search?q=${searchQuery}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(data); // Replace current messages with search results
            addToast(`Found ${data.length} messages in history`, 'info');
        } catch (err) {
            addToast('Search failed', 'error');
        } finally {
            setSearchLoading(false);
        }
    };

    const filteredMessages = searchQuery.trim() && !searchLoading
        ? messages.filter(m => (m.content || '').toLowerCase().includes(searchQuery.toLowerCase()))
        : messages;

    const typingText = typingUsers.length === 1
        ? `${typingUsers[0]} is typing`
        : typingUsers.length === 2
            ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
            : typingUsers.length > 2
                ? 'Several people are typing'
                : null;

    if (errorBoundary) {
        return (
            <div style={{ padding: '2rem', background: '#000', color: '#ff4d4d', height: '100vh', overflow: 'auto' }}>
                <h2>Something went wrong in Chat.jsx</h2>
                <pre style={{ background: '#111', padding: '1rem', borderRadius: '8px', color: '#fff' }}>
                    {errorBoundary.message}
                    {'\n\n'}
                    {errorBoundary.stack}
                </pre>
                <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', marginTop: '1rem' }}>Reload App</button>
            </div>
        );
    }

    if (!userInfo) {
        return (
            <div className="chat-dashboard loading-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner" />
            </div>
        );
    }

    if (showAdmin) {
        return <AdminDashboard userInfo={userInfo} onBack={() => setShowAdmin(false)} />;
    }

    try {
        return (
            <div className={`chat-dashboard ${currentTheme}`}>
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
            <div className={`sidebar ${mobileSidebar ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <div className="sidebar-logo">
                            <img src="/mosma_logo.png" alt="MosMA Logo" style={{width: '28px', height: '28px', objectFit: 'contain'}} />
                        </div>
                        <h2>MosMA Chat</h2>
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
                        <div className="avatar-xs" style={{ background: userInfo.avatarColor || 'var(--accent)' }}>
                            {userInfo.profilePic ? (
                                <img src={`${BACKEND_URL}${userInfo.profilePic}`} alt="avatar" />
                            ) : (
                                userInfo.username[0].toUpperCase()
                            )}
                        </div>
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

                    <div className="sidebar-search-container">
                        <div className="sidebar-search-box">
                            <Search size={14} />
                            <input 
                                type="text" 
                                placeholder="Search rooms or friends..." 
                                value={sidebarSearch}
                                onChange={(e) => setSidebarSearch(e.target.value)}
                            />
                            {sidebarSearch && <X size={14} onClick={() => setSidebarSearch('')} style={{cursor: 'pointer'}} />}
                        </div>
                    </div>

                    {/* Friends */}
                    <FriendsList 
                        userInfo={userInfo} 
                        onStartDM={handleStartDM} 
                        socket={socket} 
                        onlineUserIds={onlineUserIds}
                        searchQuery={sidebarSearch}
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
                            {rooms
                                .filter(r => r.type !== 'dm')
                                .filter(r => (r.name || '').toLowerCase().includes(sidebarSearch.toLowerCase()))
                                .map(room => (
                                <li
                                    key={room._id}
                                    className={`room-item ${currentRoom?._id === room._id ? 'active' : ''}`}
                                    onClick={() => { setCurrentRoom(room); setMobileSidebar(false); }}
                                >
                                    <div className="room-item-row">
                                        <span className="room-name"># {room.name}</span>
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
                            {rooms
                                .filter(r => r.type === 'dm')
                                .filter(r => {
                                    const other = r.participants?.find(p => p._id !== userInfo?._id);
                                    return (other?.username || 'Private Chat').toLowerCase().includes(sidebarSearch.toLowerCase());
                                })
                                .map(room => {
                                const other = room.participants?.find(p => p._id !== userInfo?._id);
                                const isOnline = other ? onlineUserIds.has(other._id) : false;
                                return (
                                    <li 
                                        key={room._id} 
                                        className={`room-item ${currentRoom?._id === room._id ? 'active' : ''}`} 
                                        onClick={() => { setCurrentRoom(room); setMobileSidebar(false); }}
                                    >
                                        <div className="room-item-row">
                                            <div className="room-dm-info">
                                                <span className={isOnline ? 'online-dot' : 'offline-dot'} />
                                                <span className="room-name">{other?.username || 'Private Chat'}</span>
                                            </div>
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
                            <div className="sidebar-toggle" onClick={() => setMobileSidebar(!mobileSidebar)}>
                                <Menu size={24} />
                            </div>
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
                                        onKeyPress={e => e.key === 'Enter' && handleServerSearch()}
                                    />
                                    <button 
                                        className="server-search-btn" 
                                        onClick={handleServerSearch}
                                        disabled={searchLoading || !searchQuery.trim()}
                                        title="Deep search in history"
                                    >
                                        {searchLoading ? <RefreshCw size={14} className="spin" /> : <Search size={14} />}
                                    </button>
                                    {searchQuery && !searchLoading && <span className="search-count">{filteredMessages.length} matches</span>}
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
                                            <div className="avatar-xs" style={{ background: u.avatarColor || 'var(--accent)' }}>
                                                    {u.profilePic ? (
                                                        <img src={`${BACKEND_URL}${u.profilePic}`} alt="avatar" />
                                                    ) : (
                                                        u.username?.charAt(0).toUpperCase() || '?'
                                                    )}
                                            </div>
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
                                            
                                            {editingMsgId === msg._id ? (
                                                <form className="edit-msg-form" onSubmit={handleSaveEdit}>
                                                    <input 
                                                        autoFocus
                                                        value={editContent} 
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                    />
                                                    <div className="edit-actions">
                                                        <button type="submit">Save</button>
                                                        <button type="button" onClick={() => setEditingMsgId(null)}>Cancel</button>
                                                    </div>
                                                </form>
                                            ) : (
                                                <p>
                                                    <HighlightText text={msg.content} query={searchQuery} />
                                                    {msg.updatedAt && <small className="edited-tag">(edited)</small>}
                                                </p>
                                            )}
                                            
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
                                                {(isOwn || userInfo.isAdmin) && (
                                                    <div className="msg-admin-actions">
                                                        <button title="Edit" onClick={() => startEditing(msg)}><Edit3 size={12} /></button>
                                                        <button title="Delete" onClick={() => handleDeleteMessage(msg._id)}><Trash2 size={12} /></button>
                                                    </div>
                                                )}
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
                        <div className="welcome-icon">
                            <img src="/mosma_logo.png" alt="MosMA Logo" style={{width: '80px', height: '80px', objectFit: 'contain'}} />
                        </div>
                        <h2>Welcome to MosMA Chat</h2>
                        <p>Select a room or friend to start chatting!</p>
                        <button className="create-btn" onClick={() => setShowUserSearch(true)}>
                            <Search size={14} /> Find People
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
    } catch (err) {
        setErrorBoundary(err);
        return null;
    }
};

export default Chat;
