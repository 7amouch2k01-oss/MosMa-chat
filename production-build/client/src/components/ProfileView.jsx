import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Calendar, MessageSquare, Users, 
    ThumbsUp, MessageCircle, MoreHorizontal, Home,
    Shield, Mail, Edit2, Camera, X, Check, Loader2
} from 'lucide-react';
import { useToast } from './Toast';
import './SocialFeed.css'; // Reuse some styles
import './ProfileView.css';

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

const ProfileView = () => {
    const [posts, setPosts] = useState([]);
    const [stats, setStats] = useState({ messageCount: 0, friendCount: 0 });
    const [userInfo, setUserInfo] = useState(readStoredUserInfo);
    const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('chatTheme') || 'theme-snow');
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ username: '', status: '', bio: '', profilePic: '', avatarColor: '' });
    const [uploading, setUploading] = useState(false);
    const { addToast } = useToast();
    const navigate = useNavigate();

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
        } else {
            navigate('/login');
        }

        const storedTheme = localStorage.getItem('chatTheme');
        if (storedTheme) setCurrentTheme(storedTheme);
    }, [navigate]);

    useEffect(() => {
        if (userInfo) {
            fetchStats();
            fetchUserPosts();
        }
    }, [userInfo]);

    const fetchStats = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/users/stats?userId=${userInfo._id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setStats(data);
        } catch (err) {
            console.error('Error fetching stats', err);
        }
    };

    const fetchUserPosts = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/posts/user/${userInfo._id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setPosts(data);
        } catch (err) {
            console.error('Error fetching posts', err);
        }
    };

    const handleEditProfile = () => {
        setEditData({
            username: userInfo.username,
            status: userInfo.status || '',
            bio: userInfo.bio || '',
            profilePic: userInfo.profilePic || '',
            avatarColor: userInfo.avatarColor || '#4F46E5'
        });
        setIsEditing(true);
    };

    const handleProfilePicUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        setUploading(true);

        try {
            const { data } = await axios.post(`${API_URL}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setEditData({ ...editData, profilePic: data.url });
            addToast('Image uploaded!', 'success');
        } catch (err) {
            addToast('Upload failed', 'error');
        } finally {
            setUploading(false);
        }
    };

    const saveProfile = async () => {
        try {
            const { data } = await axios.put(`${API_URL}/users/profile`, editData, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            
            const updatedUserInfo = { ...userInfo, ...data };
            localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
            setUserInfo(updatedUserInfo);
            setIsEditing(false);
            addToast('Profile updated!', 'success');
            // Refresh posts to show new username/pic if changed
            fetchUserPosts();
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to update profile', 'error');
        }
    };

    if (!userInfo) {
        return (
            <div className={`social-dashboard ${currentTheme} feed-boot-loader`}>
                <Loader2 size={36} className="feed-boot-loader-icon" aria-label="Loading" />
            </div>
        );
    }

    return (
        <div className={`social-dashboard ${currentTheme}`}>
            <nav className="social-nav">
                <div className="nav-left">
                    <button className="icon-btn-back" onClick={() => navigate('/feed')}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1>My Profile</h1>
                </div>
                <div className="nav-right">
                    <button className="chat-nav-btn" onClick={() => navigate('/feed')}>
                        <Home size={18} /> Home Feed
                    </button>
                    <button className="chat-nav-btn" onClick={() => navigate('/chat')}>
                        <MessageSquare size={18} /> Chat
                    </button>
                </div>
            </nav>

            <div className="profile-view-container">
                <header className="profile-cover glass">
                    <div className="profile-hero">
                        <div className="avatar-huge" style={{ background: userInfo.avatarColor || '#4F46E5' }}>
                            {userInfo.profilePic ? (
                                <img src={`${BACKEND_URL}${userInfo.profilePic}`} alt="avatar" className="avatar-img-full" />
                            ) : (
                                userInfo.username?.charAt(0).toUpperCase() || '?'
                            )}
                        </div>
                        <div className="profile-details">
                            <div className="profile-title-row">
                                <h2>{userInfo.username}</h2>
                                <button className="edit-profile-btn" onClick={handleEditProfile}>
                                    <Edit2 size={16} /> Edit Profile
                                </button>
                            </div>
                            <p className="status-label">{userInfo.status || 'No status set'}</p>
                            <p className="email-label"><Mail size={14} /> {userInfo.email}</p>
                            <div className="profile-badges">
                                {userInfo.isAdmin && <span className="badge-admin"><Shield size={12} /> Admin</span>}
                                <span className="badge-member">Member since {userInfo.createdAt ? new Date(userInfo.createdAt).getFullYear() : new Date().getFullYear()}</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="profile-view-grid">
                    <aside className="profile-stats-sidebar">
                        <div className="stats-card glass">
                            <h3>Stats Overview</h3>
                            <div className="detailed-stats">
                                <div className="d-stat">
                                    <MessageSquare size={20} />
                                    <div className="d-meta">
                                        <strong>{stats.messageCount}</strong>
                                        <span>Total Messages</span>
                                    </div>
                                </div>
                                <div className="d-stat">
                                    <Users size={20} />
                                    <div className="d-meta">
                                        <strong>{stats.friendCount}</strong>
                                        <span>Friends</span>
                                    </div>
                                </div>
                                <div className="d-stat">
                                    <ThumbsUp size={20} />
                                    <div className="d-meta">
                                        <strong>{posts.length}</strong>
                                        <span>Shared Posts</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="about-card glass">
                            <h3>About</h3>
                            <p>{userInfo.bio || 'This is your personal social hub. All your shared photos and thoughts are archived here for the community to see.'}</p>
                        </div>
                    </aside>

                    <main className="profile-posts-main">
                        <div className="section-title-row">
                            <h3>My Shared Posts</h3>
                            <span>{posts.length} Posts</span>
                        </div>

                        {posts.length === 0 ? (
                            <div className="empty-posts glass">
                                <p>You haven't shared anything yet.</p>
                                <button onClick={() => navigate('/feed')}>Start Sharing</button>
                            </div>
                        ) : (
                            <div className="posts-list">
                                {posts.map(post => (
                                    <div key={post._id} className="post-card glass">
                                        <div className="post-header">
                                            <div className="post-user-info">
                                                <div className="avatar-sm" style={{ background: post.user?.avatarColor || 'var(--accent)' }}>
                                                    {post.user?.profilePic ? (
                                                        <img src={`${BACKEND_URL}${post.user.profilePic}`} alt="avatar" />
                                                    ) : (
                                                        post.user?.username?.charAt(0).toUpperCase() || '?'
                                                    )}
                                                </div>
                                                <div className="user-meta">
                                                    <h3>{post.user?.username || 'Unknown User'}</h3>
                                                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <button className="icon-btn"><MoreHorizontal size={18} /></button>
                                        </div>
                                        <div className="post-body">
                                            {post.content && <p>{post.content}</p>}
                                            {post.imageUrl && (
                                                <div className="post-image">
                                                    <img src={`${BACKEND_URL}${post.imageUrl}`} alt="post" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="post-footer">
                                            <div className="post-stats">
                                                <button className={`stat-btn ${post.likes.includes(userInfo._id) ? 'active' : ''}`}>
                                                    <ThumbsUp size={18} />
                                                    <span>{post.likes.length}</span>
                                                </button>
                                                <button className="stat-btn">
                                                    <MessageCircle size={18} />
                                                    <span>{post.comments.length}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditing && (
                <div className="modal-overlay" onClick={() => setIsEditing(false)}>
                    <div className="edit-profile-modal glass" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Edit Profile</h3>
                            <button className="close-btn" onClick={() => setIsEditing(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="profile-pic-edit">
                                <div className="avatar-preview" style={{ background: editData.avatarColor }}>
                                    {editData.profilePic ? (
                                        <img src={`${BACKEND_URL}${editData.profilePic}`} alt="preview" />
                                    ) : (
                                        editData.username?.[0]?.toUpperCase()
                                    )}
                                    <label className="upload-overlay">
                                        <input type="file" hidden onChange={handleProfilePicUpload} accept="image/*" />
                                        <Camera size={24} />
                                    </label>
                                    {uploading && <div className="upload-loader"><Loader2 className="spin" /></div>}
                                </div>
                                <span>Change Profile Picture</span>
                            </div>

                            <div className="input-field">
                                <label>Username</label>
                                <input 
                                    type="text" 
                                    value={editData.username} 
                                    onChange={e => setEditData({ ...editData, username: e.target.value })} 
                                />
                            </div>

                            <div className="input-field">
                                <label>Status</label>
                                <input 
                                    type="text" 
                                    placeholder="What's on your mind?"
                                    value={editData.status} 
                                    onChange={e => setEditData({ ...editData, status: e.target.value })} 
                                />
                            </div>

                            <div className="input-field">
                                <label>Bio</label>
                                <textarea 
                                    placeholder="Tell us about yourself..."
                                    value={editData.bio} 
                                    onChange={e => setEditData({ ...editData, bio: e.target.value })} 
                                />
                            </div>

                            <div className="color-selector">
                                <label>Avatar Color</label>
                                <div className="colors-grid">
                                    {['#4F46E5', '#F97316', '#06B6D4', '#10B981', '#EC4899', '#8B5CF6'].map(color => (
                                        <div 
                                            key={color} 
                                            className={`color-box ${editData.avatarColor === color ? 'active' : ''}`}
                                            style={{ background: color }}
                                            onClick={() => setEditData({ ...editData, avatarColor: color })}
                                        >
                                            {editData.avatarColor === color && <Check size={14} />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                            <button className="save-btn" onClick={saveProfile}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileView;
