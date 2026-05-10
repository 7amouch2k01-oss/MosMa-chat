import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, Calendar, MessageSquare, Users, 
    ThumbsUp, MessageCircle, MoreHorizontal, Home,
    Shield, Mail
} from 'lucide-react';
import './SocialFeed.css'; // Reuse some styles
import './ProfileView.css';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${BACKEND_URL}/api`;

const ProfileView = () => {
    const [posts, setPosts] = useState([]);
    const [stats, setStats] = useState({ messageCount: 0, friendCount: 0 });
    const [userInfo, setUserInfo] = useState(null);
    const [currentTheme, setCurrentTheme] = useState('theme-cosmic');
    const navigate = useNavigate();

    useEffect(() => {
        const stored = localStorage.getItem('userInfo');
        if (stored) {
            setUserInfo(JSON.parse(stored));
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

    if (!userInfo) return null;

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
                            {userInfo.username[0].toUpperCase()}
                        </div>
                        <div className="profile-details">
                            <h2>{userInfo.username}</h2>
                            <p className="email-label"><Mail size={14} /> {userInfo.email}</p>
                            <div className="profile-badges">
                                {userInfo.isAdmin && <span className="badge-admin"><Shield size={12} /> Admin</span>}
                                <span className="badge-member">Member since {new Date(userInfo.createdAt).getFullYear()}</span>
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
                            <p>This is your personal social hub. All your shared photos and thoughts are archived here for the community to see.</p>
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
                                                <div className="avatar-sm">
                                                    {post.user.username[0].toUpperCase()}
                                                </div>
                                                <div className="user-meta">
                                                    <h3>{post.user.username}</h3>
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
        </div>
    );
};

export default ProfileView;
