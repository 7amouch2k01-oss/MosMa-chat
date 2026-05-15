import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Users, Hash, MessageSquare, Shield, 
    Trash2, UserCheck, UserX, Search,
    BarChart3, Settings, LogOut, ChevronLeft, Ban,
    Megaphone, FileText, Image as ImageIcon, Send, RefreshCw,
    ShieldAlert
} from 'lucide-react';
import './AdminDashboard.css';

const BACKEND_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);
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
    
    const token = userInfo?.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };

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
            } else if (activeTab === 'logs') {
                const { data } = await axios.get(`${API_URL}/logs`, config);
                setLogs(data);
            }
        } catch (err) {
            console.error('Failed to fetch admin data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAdmin = async (user) => {
        try {
            await axios.put(`${API_URL}/users/${user._id}/role`, { isAdmin: !user.isAdmin }, config);
            setUsers(users.map(u => u._id === user._id ? { ...u, isAdmin: !u.isAdmin } : u));
        } catch (err) { alert('Failed to update role'); }
    };

    const handleToggleBan = async (user) => {
        try {
            await axios.put(`${API_URL}/users/${user._id}/ban`, {}, config);
            setUsers(users.map(u => u._id === user._id ? { ...u, isBanned: !u.isBanned } : u));
        } catch (err) { alert(err.response?.data?.message || 'Failed to update ban status'); }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Delete user permanently?')) return;
        try {
            await axios.delete(`${API_URL}/users/${userId}`, config);
            setUsers(users.filter(u => u._id !== userId));
        } catch (err) { alert('Delete failed'); }
    };

    const handleDeleteRoom = async (roomId) => {
        if (!window.confirm('Delete room?')) return;
        try {
            await axios.delete(`${API_URL}/rooms/${roomId}`, config);
            setRooms(rooms.filter(r => r._id !== roomId));
        } catch (err) { alert('Delete failed'); }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Delete post?')) return;
        try {
            await axios.delete(`${API_URL}/posts/${postId}`, config);
            setPosts(posts.filter(p => p._id !== postId));
        } catch (err) { alert('Delete failed'); }
    };

    const handleSendBroadcast = async () => {
        if (!broadcastMsg.trim()) return;
        try {
            await axios.post(`${API_URL}/broadcast`, { message: broadcastMsg }, config);
            setBroadcastMsg('');
            alert('Broadcast sent to all users!');
        } catch (err) { alert('Broadcast failed'); }
    };

    return (
        <div className="admin-dashboard">
            <aside className="admin-sidebar">
                <div className="admin-logo">
                    <img src="/mosma_logo.png" alt="MosMA Logo" style={{width: '24px', height: '24px', objectFit: 'contain'}} />
                    <span>MosMA Admin</span>
                </div>

                <nav className="admin-nav">
                    <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                        <BarChart3 size={18} /> Overview
                    </button>
                    <button className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                        <Users size={18} /> Users
                    </button>
                    <button className={`nav-item ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
                        <FileText size={18} /> Posts
                    </button>
                    <button className={`nav-item ${activeTab === 'rooms' ? 'active' : ''}`} onClick={() => setActiveTab('rooms')}>
                        <Hash size={18} /> Rooms
                    </button>
                    <button className={`nav-item ${activeTab === 'broadcast' ? 'active' : ''}`} onClick={() => setActiveTab('broadcast')}>
                        <Megaphone size={18} /> Broadcast
                    </button>
                    <button className={`nav-item ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
                        <ShieldAlert size={18} /> Security Logs
                    </button>
                </nav>

                <div className="sidebar-footer">
                    <button className="back-btn" onClick={onBack}><ChevronLeft size={18} /> Back to Chat</button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <div className="header-left">
                        <h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
                        <button className="refresh-btn" onClick={fetchData}><RefreshCw size={14} /></button>
                    </div>
                    <div className="admin-user-info">
                        <div className="admin-avatar" style={{ background: userInfo.avatarColor }}>
                            {userInfo.username[0].toUpperCase()}
                        </div>
                        <span>{userInfo.username} <small>(Admin)</small></span>
                    </div>
                </header>

                <div className="admin-content">
                    {loading ? (
                        <div className="loading-state">Loading data...</div>
                    ) : (
                        <>
                            {activeTab === 'overview' && (
                                <div className="overview-container">
                                    <div className="overview-grid">
                                        <div className="stat-card">
                                            <Users size={24} />
                                            <div className="stat-info">
                                                <span className="stat-value">{stats.userCount}</span>
                                                <span className="stat-label">Total Users</span>
                                            </div>
                                        </div>
                                        <div className="stat-card">
                                            <RefreshCw size={24} />
                                            <div className="stat-info">
                                                <span className="stat-value">{stats.onlineCount}</span>
                                                <span className="stat-label">Online Now</span>
                                            </div>
                                        </div>
                                        <div className="stat-card">
                                            <FileText size={24} />
                                            <div className="stat-info">
                                                <span className="stat-value">{stats.postCount}</span>
                                                <span className="stat-label">Total Posts</span>
                                            </div>
                                        </div>
                                        <div className="stat-card">
                                            <MessageSquare size={24} />
                                            <div className="stat-info">
                                                <span className="stat-value">{stats.messageCount}</span>
                                                <span className="stat-label">Total Messages</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="activity-grid">
                                        <div className="activity-card glass">
                                            <h3><Users size={16} /> Recent Users</h3>
                                            <div className="activity-list">
                                                {stats.recentUsers?.map(u => (
                                                    <div key={u._id} className="activity-item">
                                                        <div className="mini-avatar" style={{ background: u.avatarColor }}>{u.username[0]}</div>
                                                        <div className="activity-details">
                                                            <strong>{u.username}</strong>
                                                            <span>Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="activity-card glass">
                                            <h3><FileText size={16} /> Recent Posts</h3>
                                            <div className="activity-list">
                                                {stats.recentPosts?.map(p => (
                                                    <div key={p._id} className="activity-item">
                                                        <div className="activity-details">
                                                            <strong>{p.user?.username}</strong>
                                                            <p>{p.content?.substring(0, 30)}...</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'users' && (
                                <div className="management-card">
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
                                                {users.map(u => (
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
                                                            <span className={`role-badge ${u.isAdmin ? 'admin' : 'user'}`}>{u.isAdmin ? 'Admin' : 'User'}</span>
                                                            {u.isBanned && <span className="role-badge banned">Banned</span>}
                                                        </td>
                                                        <td className="actions-cell">
                                                            <button className="action-icon-btn" title="Toggle Admin" onClick={() => handleToggleAdmin(u)}>
                                                                {u.isAdmin ? <UserX size={16} /> : <UserCheck size={16} />}
                                                            </button>
                                                            <button className={`action-icon-btn ${u.isBanned ? 'banned-active' : ''}`} title="Toggle Ban" onClick={() => handleToggleBan(u)}>
                                                                <Ban size={16} />
                                                            </button>
                                                            <button className="action-icon-btn delete" title="Delete" onClick={() => handleDeleteUser(u._id)}><Trash2 size={16} /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'posts' && (
                                <div className="management-card">
                                    <div className="table-wrap">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Author</th>
                                                    <th>Content</th>
                                                    <th>Likes/Comments</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {posts.map(p => (
                                                    <tr key={p._id}>
                                                        <td>
                                                            <div className="table-user">
                                                                <div className="user-icon" style={{ background: p.user?.avatarColor }}>{p.user?.username[0]}</div>
                                                                <span>{p.user?.username} <small>#{p.user?.tag}</small></span>
                                                            </div>
                                                        </td>
                                                        <td className="post-content-cell">
                                                            <div className="post-preview">
                                                                {p.imageUrl && <ImageIcon size={14} />}
                                                                <p>{p.content?.substring(0, 50)}...</p>
                                                            </div>
                                                        </td>
                                                        <td>{p.likes?.length} L / {p.comments?.length} C</td>
                                                        <td>
                                                            <button className="action-icon-btn delete" onClick={() => handleDeletePost(p._id)}><Trash2 size={16} /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'broadcast' && (
                                <div className="broadcast-card glass">
                                    <h3>System Broadcast</h3>
                                    <p>Send a global alert message to all connected users.</p>
                                    <textarea 
                                        placeholder="Type your message here..."
                                        value={broadcastMsg}
                                        onChange={(e) => setBroadcastMsg(e.target.value)}
                                    />
                                    <button className="send-broadcast-btn" onClick={handleSendBroadcast}>
                                        <Send size={18} /> Send to Everyone
                                    </button>
                                </div>
                            )}

                            {activeTab === 'rooms' && (
                                <div className="management-card">
                                    <div className="table-wrap">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Room Name</th>
                                                    <th>Users</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rooms.map(room => (
                                                    <tr key={room._id}>
                                                        <td><Hash size={16} /> {room.name}</td>
                                                        <td>{room.users?.length || 0}</td>
                                                        <td>
                                                            <button className="action-icon-btn delete" onClick={() => handleDeleteRoom(room._id)}><Trash2 size={16} /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'logs' && (
                                <div className="management-card logs-card">
                                    <div className="table-wrap">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Severity</th>
                                                    <th>Action</th>
                                                    <th>Target/User</th>
                                                    <th>Details & IP</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {logs.map(log => (
                                                    <tr key={log._id}>
                                                        <td>{new Date(log.createdAt).toLocaleString()}</td>
                                                        <td>
                                                            <span className={`log-badge ${log.severity || 'low'}`}>
                                                                {log.severity || 'low'}
                                                            </span>
                                                        </td>
                                                        <td><strong>{log.action}</strong></td>
                                                        <td>
                                                            {log.admin ? `Admin: ${log.admin.username}` : `Target: ${log.target}`}
                                                        </td>
                                                        <td>
                                                            <div>{log.details}</div>
                                                            <small className="log-ip">IP: {log.ip}</small>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {logs.length === 0 && (
                                                    <tr><td colSpan="5" style={{textAlign: 'center'}}>No logs available</td></tr>
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
        </div>
    );
};

export default AdminDashboard;
