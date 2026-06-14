import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Users, Hash, MessageSquare, Shield, 
    Trash2, UserCheck, UserX, Search,
    BarChart3, Settings, LogOut, ChevronLeft, Ban,
    Megaphone, FileText, Image as ImageIcon, Send, RefreshCw,
    ShieldAlert, Menu, X, AlertTriangle, CheckCircle2, AlertCircle, Info
} from 'lucide-react';
import './AdminDashboard.css';

const BACKEND_URL = import.meta.env.PROD ? window.location.origin : `${window.location.protocol}//${window.location.hostname}:5000`;
const API_URL = `${BACKEND_URL}/api/admin`;

const AdminDashboard = ({ userInfo, onBack }) => {
    const [stats, setStats] = useState({ userCount: 0, roomCount: 0, messageCount: 0, onlineCount: 0, postCount: 0 });
    const [users, setUsers] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [posts, setPosts] = useState([]);
    const [logs, setLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Custom dialog modal states
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        onConfirm: null,
        isDanger: false
    });
    const [alertModal, setAlertModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'success' // 'success' | 'error' | 'info'
    });

    const token = userInfo?.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const showConfirm = (title, message, onConfirm, isDanger = false, confirmText = 'Confirm', cancelText = 'Cancel') => {
        setConfirmModal({
            isOpen: true,
            title,
            message,
            confirmText,
            cancelText,
            onConfirm,
            isDanger
        });
    };

    const showAlert = (title, message, type = 'success') => {
        setAlertModal({
            isOpen: true,
            title,
            message,
            type
        });
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'overview') {
                const { data } = await axios.get(`${API_URL}/stats`, config);
                setStats(data);
            } else if (activeTab === 'users') {
                const { data } = await axios.get(`${API_URL}/users`, config);
                setUsers(data);
            } else if (activeTab === 'rooms') {
                const { data } = await axios.get(`${API_URL}/rooms`, config);
                setRooms(data);
            } else if (activeTab === 'posts') {
                const { data } = await axios.get(`${API_URL}/posts`, config);
                setPosts(data);
            } else if (activeTab === 'security-logs') {
                const { data } = await axios.get(`${API_URL}/logs?type=security`, config);
                setLogs(data);
            } else if (activeTab === 'admin-logs') {
                const { data } = await axios.get(`${API_URL}/logs?type=admin_action`, config);
                setLogs(data);
            }
        } catch (err) {
            console.error('Failed to fetch admin data', err);
            showAlert('Fetch Error', 'Failed to retrieve administrative data from the server.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAdmin = async (user) => {
        showConfirm(
            user.isAdmin ? 'Revoke Admin Privileges?' : 'Grant Admin Privileges?',
            `Are you sure you want to change the role of "${user.username}"? ${user.isAdmin ? 'They will lose all administrative dashboard privileges immediately.' : 'They will gain full access to the administrative dashboard.'}`,
            async () => {
                try {
                    await axios.put(`${API_URL}/users/${user._id}/role`, { isAdmin: !user.isAdmin }, config);
                    setUsers(users.map(u => u._id === user._id ? { ...u, isAdmin: !u.isAdmin } : u));
                    showAlert('Success', `User privileges successfully updated for ${user.username}.`, 'success');
                } catch (err) {
                    showAlert('Update Failed', err.response?.data?.message || 'Failed to update user privileges.', 'error');
                }
            },
            user.isAdmin
        );
    };

    const handleToggleBan = async (user) => {
        showConfirm(
            user.isBanned ? 'Unban User?' : 'Ban User?',
            `Are you sure you want to ${user.isBanned ? 'unban' : 'ban'} user "${user.username}"? ${user.isBanned ? 'They will be allowed back into the chat application.' : 'They will be logged out and locked out of the chat application.'}`,
            async () => {
                try {
                    await axios.put(`${API_URL}/users/${user._id}/ban`, {}, config);
                    setUsers(users.map(u => u._id === user._id ? { ...u, isBanned: !u.isBanned } : u));
                    showAlert('Success', `User "${user.username}" is now ${user.isBanned ? 'unbanned' : 'banned'}.`, 'success');
                } catch (err) {
                    showAlert('Update Failed', err.response?.data?.message || 'Failed to update ban status.', 'error');
                }
            },
            !user.isBanned
        );
    };

    const handleDeleteUser = async (userId) => {
        const user = users.find(u => u._id === userId);
        const name = user ? user.username : 'this user';
        showConfirm(
            'Delete User Permanently?',
            `Are you sure you want to delete "${name}" permanently? All associated posts, messages, tasks, and friendship logs will be deleted from the database. This action is final.`,
            async () => {
                try {
                    await axios.delete(`${API_URL}/users/${userId}`, config);
                    setUsers(users.filter(u => u._id !== userId));
                    showAlert('User Removed', `User "${name}" has been deleted successfully.`, 'success');
                } catch (err) {
                    showAlert('Delete Failed', 'An error occurred while deleting the user.', 'error');
                }
            },
            true,
            'Delete User',
            'Cancel'
        );
    };

    const handleDeleteRoom = async (roomId) => {
        const room = rooms.find(r => r._id === roomId);
        const name = room ? room.name : 'this room';
        showConfirm(
            'Delete Chat Room?',
            `Are you sure you want to delete room "#${name}"? All conversations, messages, and shared files in this room will be destroyed.`,
            async () => {
                try {
                    await axios.delete(`${API_URL}/rooms/${roomId}`, config);
                    setRooms(rooms.filter(r => r._id !== roomId));
                    showAlert('Room Removed', `Chat room "#${name}" has been deleted.`, 'success');
                } catch (err) {
                    showAlert('Delete Failed', 'An error occurred while deleting the chat room.', 'error');
                }
            },
            true,
            'Delete Room',
            'Cancel'
        );
    };

    const handleDeletePost = async (postId) => {
        showConfirm(
            'Delete Post?',
            'Are you sure you want to delete this social feed post and all of its comments?',
            async () => {
                try {
                    await axios.delete(`${API_URL}/posts/${postId}`, config);
                    setPosts(posts.filter(p => p._id !== postId));
                    showAlert('Post Removed', 'Social post deleted successfully.', 'success');
                } catch (err) {
                    showAlert('Delete Failed', 'An error occurred while deleting the post.', 'error');
                }
            },
            true,
            'Delete Post',
            'Cancel'
        );
    };

    const handleSendBroadcast = async () => {
        if (!broadcastMsg.trim()) return;
        showConfirm(
            'Send System Broadcast?',
            'This broadcast message will be pushed instantly to all online users. Are you sure you want to transmit?',
            async () => {
                try {
                    await axios.post(`${API_URL}/broadcast`, { message: broadcastMsg }, config);
                    setBroadcastMsg('');
                    showAlert('Broadcast Sent', 'Broadcast announcement sent successfully to all online users.', 'success');
                } catch (err) {
                    showAlert('Broadcast Failed', 'An error occurred while sending the broadcast.', 'error');
                }
            },
            false,
            'Send Announcement',
            'Cancel'
        );
    };

    // Filters users/rooms/posts based on search query
    const filteredUsers = users.filter(u => 
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredRooms = rooms.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPosts = posts.filter(p => 
        p.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.content?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="admin-dashboard">
            {/* Mobile Header */}
            <div className="admin-mobile-header">
                <button className="menu-toggle-btn" onClick={() => setIsSidebarOpen(true)}>
                    <Menu size={22} />
                </button>
                <span className="mobile-title">MosMA Admin</span>
                <div className="mobile-user-avatar" style={{ background: userInfo.avatarColor }}>
                    {userInfo.username[0].toUpperCase()}
                </div>
            </div>

            {/* Sidebar Backdrop Overlay on Mobile */}
            {isSidebarOpen && <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />}

            <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header-mobile">
                    <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <div className="admin-logo">
                    <img src="/mosma_logo.png" alt="MosMA Logo" style={{width: '28px', height: '28px', objectFit: 'contain', borderRadius: '50%'}} />
                    <span>MosMA Admin</span>
                </div>

                <nav className="admin-nav">
                    <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}>
                        <BarChart3 size={18} /> <span>Overview</span>
                    </button>
                    <button className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }}>
                        <Users size={18} /> <span>Users</span>
                    </button>
                    <button className={`nav-item ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => { setActiveTab('posts'); setIsSidebarOpen(false); }}>
                        <FileText size={18} /> <span>Posts</span>
                    </button>
                    <button className={`nav-item ${activeTab === 'rooms' ? 'active' : ''}`} onClick={() => { setActiveTab('rooms'); setIsSidebarOpen(false); }}>
                        <Hash size={18} /> <span>Rooms</span>
                    </button>
                    <button className={`nav-item ${activeTab === 'broadcast' ? 'active' : ''}`} onClick={() => { setActiveTab('broadcast'); setIsSidebarOpen(false); }}>
                        <Megaphone size={18} /> <span>Broadcast</span>
                    </button>
                    <button className={`nav-item ${activeTab === 'security-logs' ? 'active' : ''}`} onClick={() => { setActiveTab('security-logs'); setIsSidebarOpen(false); }}>
                        <ShieldAlert size={18} /> <span>Security Logs</span>
                    </button>
                    <button className={`nav-item ${activeTab === 'admin-logs' ? 'active' : ''}`} onClick={() => { setActiveTab('admin-logs'); setIsSidebarOpen(false); }}>
                        <Shield size={18} /> <span>Admin Actions</span>
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <button className="back-btn" onClick={onBack}><ChevronLeft size={18} /> <span>Back to Chat</span></button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <div className="header-left">
                        <h2>
                            {activeTab === 'security-logs' ? 'Security Logs' : 
                             activeTab === 'admin-logs' ? 'Admin Actions' : 
                             activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </h2>
                        <button className="refresh-btn" onClick={fetchData}><RefreshCw size={14} /></button>
                    </div>
                    
                    {/* Search Bar for management lists */}
                    {(activeTab === 'users' || activeTab === 'rooms' || activeTab === 'posts') && (
                        <div className="header-search">
                            <Search size={16} />
                            <input 
                                type="text" 
                                placeholder={`Search ${activeTab}...`} 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && <button className="clear-search-btn" onClick={() => setSearchQuery('')}><X size={14} /></button>}
                        </div>
                    )}

                    <div className="admin-user-info">
                        <div className="admin-avatar" style={{ background: userInfo.avatarColor }}>
                            {userInfo.username[0].toUpperCase()}
                        </div>
                        <div className="admin-meta">
                            <span className="username">{userInfo.username}</span>
                            <span className="role-label">
                                {userInfo.isOwner ? 'Project Owner' : 'System Administrator'}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="admin-content">
                    {loading ? (
                        <div className="loading-state">
                            <RefreshCw size={36} className="spinner" />
                            <p>Fetching server metrics and logs...</p>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'overview' && (
                                <div className="overview-container">
                                    <div className="overview-grid">
                                        <div className="stat-card glass user-card">
                                            <div className="stat-icon-wrapper">
                                                <Users size={24} />
                                            </div>
                                            <div className="stat-info">
                                                <span className="stat-value">{stats.userCount}</span>
                                                <span className="stat-label">Total Users</span>
                                            </div>
                                        </div>
                                        <div className="stat-card glass online-card">
                                            <div className="stat-icon-wrapper">
                                                <RefreshCw size={24} />
                                            </div>
                                            <div className="stat-info">
                                                <span className="stat-value">{stats.onlineCount}</span>
                                                <span className="stat-label">Online Now</span>
                                            </div>
                                        </div>
                                        <div className="stat-card glass post-card">
                                            <div className="stat-icon-wrapper">
                                                <FileText size={24} />
                                            </div>
                                            <div className="stat-info">
                                                <span className="stat-value">{stats.postCount}</span>
                                                <span className="stat-label">Total Posts</span>
                                            </div>
                                        </div>
                                        <div className="stat-card glass msg-card">
                                            <div className="stat-icon-wrapper">
                                                <MessageSquare size={24} />
                                            </div>
                                            <div className="stat-info">
                                                <span className="stat-value">{stats.messageCount}</span>
                                                <span className="stat-label">Total Messages</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SVG Activity Trend */}
                                    <div className="activity-card glass chart-card">
                                        <h3><BarChart3 size={16} /> Weekly Activity Trends</h3>
                                        <div className="chart-container">
                                            <svg viewBox="0 0 500 200" className="activity-svg">
                                                <defs>
                                                    <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                                                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                                                    </linearGradient>
                                                    <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0">
                                                        <stop offset="0%" stopColor="#4f46e5" />
                                                        <stop offset="50%" stopColor="#6366f1" />
                                                        <stop offset="100%" stopColor="#818cf8" />
                                                    </linearGradient>
                                                </defs>
                                                {/* Grid Lines */}
                                                <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                                                <line x1="40" y1="60" x2="480" y2="60" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                                                <line x1="40" y1="100" x2="480" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                                                <line x1="40" y1="140" x2="480" y2="140" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                                                <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                                                
                                                {/* Gradient Fill under Line */}
                                                <path d="M 40 170 Q 110 120, 150 90 T 260 110 T 370 60 T 480 80 L 480 170 Z" fill="url(#chart-glow)" />
                                                
                                                {/* Main glowing line */}
                                                <path d="M 40 170 Q 110 120, 150 90 T 260 110 T 370 60 T 480 80" fill="none" stroke="url(#line-grad)" strokeWidth="3" strokeLinecap="round" />
                                                
                                                {/* Dots */}
                                                <circle cx="40" cy="170" r="4" fill="#4f46e5" stroke="#fff" strokeWidth="1.5" />
                                                <circle cx="150" cy="90" r="4" fill="#6366f1" stroke="#fff" strokeWidth="1.5" />
                                                <circle cx="260" cy="110" r="4" fill="#6366f1" stroke="#fff" strokeWidth="1.5" />
                                                <circle cx="370" cy="60" r="4" fill="#818cf8" stroke="#fff" strokeWidth="1.5" />
                                                <circle cx="480" cy="80" r="4" fill="#818cf8" stroke="#fff" strokeWidth="1.5" />

                                                {/* Labels */}
                                                <text x="40" y="190" fill="#64748b" fontSize="9" textAnchor="middle">Mon</text>
                                                <text x="113" y="190" fill="#64748b" fontSize="9" textAnchor="middle">Tue</text>
                                                <text x="186" y="190" fill="#64748b" fontSize="9" textAnchor="middle">Wed</text>
                                                <text x="260" y="190" fill="#64748b" fontSize="9" textAnchor="middle">Thu</text>
                                                <text x="333" y="190" fill="#64748b" fontSize="9" textAnchor="middle">Fri</text>
                                                <text x="406" y="190" fill="#64748b" fontSize="9" textAnchor="middle">Sat</text>
                                                <text x="480" y="190" fill="#64748b" fontSize="9" textAnchor="middle">Sun</text>
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="activity-grid">
                                        <div className="activity-card glass">
                                            <h3><Users size={16} /> Recent User Signups</h3>
                                            <div className="activity-list">
                                                {stats.recentUsers?.map(u => (
                                                    <div key={u._id} className="activity-item">
                                                        <div className="mini-avatar" style={{ background: u.avatarColor }}>{u.username[0].toUpperCase()}</div>
                                                        <div className="activity-details">
                                                            <strong>{u.username}</strong>
                                                            <span>Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!stats.recentUsers || stats.recentUsers.length === 0) && (
                                                    <div className="no-activity">No recent signups found</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="activity-card glass">
                                            <h3><FileText size={16} /> Recent Posts</h3>
                                            <div className="activity-list">
                                                {stats.recentPosts?.map(p => (
                                                    <div key={p._id} className="activity-item">
                                                        <div className="activity-details">
                                                            <div className="post-activity-author">
                                                                <strong>{p.user?.username || 'Deleted User'}</strong>
                                                                <span className="post-date">{new Date(p.createdAt || Date.now()).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="post-text">{p.content ? p.content.substring(0, 70) + (p.content.length > 70 ? '...' : '') : 'Empty content'}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!stats.recentPosts || stats.recentPosts.length === 0) && (
                                                    <div className="no-activity">No recent posts found</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'users' && (
                                <div className="management-card glass">
                                    <div className="table-wrap">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>User Identity</th>
                                                    <th>Email</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredUsers.map(u => (
                                                    <tr key={u._id}>
                                                        <td>
                                                            <div className="table-user">
                                                                <div className="user-icon" style={{ background: u.avatarColor }}>{u.username[0].toUpperCase()}</div>
                                                                <div className="user-name-tag">
                                                                    <strong>{u.username}</strong>
                                                                    <span className="tag">#{u.tag || '0000'}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>{u.email}</td>
                                                        <td>
                                                            <div className="badge-container">
                                                                {u.isOwner ? (
                                                                    <span className="role-badge owner">Owner</span>
                                                                ) : (
                                                                    <span className={`role-badge ${u.isAdmin ? 'admin' : 'user'}`}>{u.isAdmin ? 'Admin' : 'User'}</span>
                                                                )}
                                                                {u.isBanned && <span className="role-badge banned">Banned</span>}
                                                            </div>
                                                        </td>
                                                        <td className="actions-cell">
                                                            <button 
                                                                className={`action-icon-btn ${u.isAdmin ? 'admin-active' : ''}`} 
                                                                title={u.isAdmin ? "Revoke Admin Access" : "Grant Admin Access"} 
                                                                onClick={() => handleToggleAdmin(u)}
                                                            >
                                                                {u.isAdmin ? <UserX size={15} /> : <UserCheck size={15} />}
                                                            </button>
                                                            <button 
                                                                className={`action-icon-btn ${u.isBanned ? 'banned-active' : ''}`} 
                                                                title={u.isBanned ? "Unban Account" : "Ban Account"} 
                                                                onClick={() => handleToggleBan(u)}
                                                            >
                                                                <Ban size={15} />
                                                            </button>
                                                            <button 
                                                                className="action-icon-btn delete" 
                                                                title="Delete Permanently" 
                                                                onClick={() => handleDeleteUser(u._id)}
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {filteredUsers.length === 0 && (
                                                    <tr><td colSpan="4" style={{textAlign: 'center'}}>No users found matching query</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'posts' && (
                                <div className="management-card glass">
                                    <div className="table-wrap">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Author</th>
                                                    <th>Content</th>
                                                    <th>Engagement</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredPosts.map(p => (
                                                    <tr key={p._id}>
                                                        <td>
                                                            <div className="table-user">
                                                                <div className="user-icon" style={{ background: p.user?.avatarColor || '#ccc' }}>{p.user?.username ? p.user.username[0].toUpperCase() : '?'}</div>
                                                                <span>{p.user?.username || 'Deleted User'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="post-content-cell">
                                                            <div className="post-preview">
                                                                {p.imageUrl && <ImageIcon size={14} />}
                                                                <p>{p.content ? p.content.substring(0, 60) + (p.content.length > 60 ? '...' : '') : 'No text content'}</p>
                                                            </div>
                                                        </td>
                                                        <td>{p.likes?.length || 0} Likes / {p.comments?.length || 0} Comments</td>
                                                        <td>
                                                            <button className="action-icon-btn delete" title="Delete Post" onClick={() => handleDeletePost(p._id)}><Trash2 size={15} /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {filteredPosts.length === 0 && (
                                                    <tr><td colSpan="4" style={{textAlign: 'center'}}>No posts found matching query</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'broadcast' && (
                                <div className="broadcast-card glass">
                                    <h3>System Broadcast Message</h3>
                                    <p>Dispatch a pop-up alert instantly to the dashboard and chat screens of all active users online.</p>
                                    <textarea 
                                        placeholder="Type transmission announcement here..."
                                        value={broadcastMsg}
                                        onChange={(e) => setBroadcastMsg(e.target.value)}
                                    />
                                    <button className="send-broadcast-btn" onClick={handleSendBroadcast}>
                                        <Send size={16} /> Broadcast Message
                                    </button>
                                </div>
                            )}

                            {activeTab === 'rooms' && (
                                <div className="management-card glass">
                                    <div className="table-wrap">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Room Name</th>
                                                    <th>Members Count</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredRooms.map(room => (
                                                    <tr key={room._id}>
                                                        <td>
                                                            <span className="room-name-cell"><Hash size={15} /> {room.name}</span>
                                                        </td>
                                                        <td>{room.users?.length || 0} users</td>
                                                        <td>
                                                            <button className="action-icon-btn delete" title="Delete Room" onClick={() => handleDeleteRoom(room._id)}><Trash2 size={15} /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {filteredRooms.length === 0 && (
                                                    <tr><td colSpan="3" style={{textAlign: 'center'}}>No rooms found matching query</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security-logs' && (
                                <div className="management-card logs-card glass security-theme">
                                    <div className="table-wrap">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Date & Time</th>
                                                    <th>Severity</th>
                                                    <th>Threat Event</th>
                                                    <th>Target Account</th>
                                                    <th>Full Details & IP Address</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {logs.map(log => (
                                                    <tr key={log._id}>
                                                        <td className="log-date">{new Date(log.createdAt).toLocaleString()}</td>
                                                        <td>
                                                            <span className={`log-badge ${log.severity || 'low'}`}>
                                                                {log.severity || 'low'}
                                                            </span>
                                                        </td>
                                                        <td><strong className="log-action-text">{log.action}</strong></td>
                                                        <td>
                                                            <span className="log-target-text">{log.target || 'System'}</span>
                                                        </td>
                                                        <td>
                                                            <div className="log-details-block">
                                                                <p className="log-desc">{log.details}</p>
                                                                <small className="log-ip">IP Address: {log.ip || 'Unknown'}</small>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {logs.length === 0 && (
                                                    <tr><td colSpan="5" style={{textAlign: 'center'}}>No security threat logs generated</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'admin-logs' && (
                                <div className="management-card logs-card glass admin-theme">
                                    <div className="table-wrap">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Date & Time</th>
                                                    <th>Administrator</th>
                                                    <th>Admin Action</th>
                                                    <th>Target Entity</th>
                                                    <th>Details & IP Address</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {logs.map(log => (
                                                    <tr key={log._id}>
                                                        <td className="log-date">{new Date(log.createdAt).toLocaleString()}</td>
                                                        <td className="log-admin-cell">
                                                            {log.admin ? (
                                                                <div className="admin-actor">
                                                                    <div className="mini-avatar" style={{ background: '#4f46e5' }}>{log.admin.username[0].toUpperCase()}</div>
                                                                    <strong>{log.admin.username}</strong>
                                                                </div>
                                                            ) : (
                                                                <span className="system-actor">System Auto</span>
                                                            )}
                                                        </td>
                                                        <td><strong className="log-action-text admin">{log.action}</strong></td>
                                                        <td>
                                                            <span className="log-target-text">{log.target}</span>
                                                        </td>
                                                        <td>
                                                            <div className="log-details-block">
                                                                <p className="log-desc">{log.details}</p>
                                                                <small className="log-ip">IP Address: {log.ip || 'Unknown'}</small>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {logs.length === 0 && (
                                                    <tr><td colSpan="5" style={{textAlign: 'center'}}>No admin action logs registered</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Custom Confirm Dialog Modal */}
            {confirmModal.isOpen && (
                <div className="custom-modal-overlay">
                    <div className={`custom-modal-card ${confirmModal.isDanger ? 'danger' : ''}`}>
                        <div className="modal-header">
                            <div className="modal-icon-container">
                                <AlertTriangle size={24} className="warning-icon" />
                            </div>
                            <h3>{confirmModal.title}</h3>
                        </div>
                        <div className="modal-body">
                            <p>{confirmModal.message}</p>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-btn cancel" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>
                                {confirmModal.cancelText}
                            </button>
                            <button className="modal-btn confirm" onClick={() => {
                                confirmModal.onConfirm();
                                setConfirmModal({ ...confirmModal, isOpen: false });
                            }}>
                                {confirmModal.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Alert Dialog Modal */}
            {alertModal.isOpen && (
                <div className="custom-modal-overlay">
                    <div className={`custom-modal-card alert-modal ${alertModal.type}`}>
                        <div className="modal-header">
                            <div className="modal-icon-container">
                                {alertModal.type === 'success' && <CheckCircle2 size={24} className="success-icon" />}
                                {alertModal.type === 'error' && <AlertCircle size={24} className="error-icon" />}
                                {alertModal.type === 'info' && <Info size={24} className="info-icon" />}
                            </div>
                            <h3>{alertModal.title}</h3>
                        </div>
                        <div className="modal-body">
                            <p>{alertModal.message}</p>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-btn confirm" onClick={() => setAlertModal({ ...alertModal, isOpen: false })}>
                                Okay
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
