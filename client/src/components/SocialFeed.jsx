import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { 
    MessageSquare, Heart, Share2, Image as ImageIcon, Send, 
    LogOut, User, Globe, Users, Plus, X, Camera, MoreHorizontal,
    ThumbsUp, MessageCircle, Home, Trash2, Edit3, Flag, Copy, Check, Settings
} from 'lucide-react';
import './SocialFeed.css';
import { useToast } from './Toast';
import SettingsPanel from './SettingsPanel';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${BACKEND_URL}/api`;

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

const SocialFeed = () => {
    const [posts, setPosts] = useState([]);
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [showPublic, setShowPublic] = useState(true);
    const [loading, setLoading] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [currentTheme, setCurrentTheme] = useState('theme-cosmic');
    const [uploading, setUploading] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('chatSettings');
        return saved ? JSON.parse(saved) : {
            notifications: true,
            sounds: true,
            showOnline: true,
            animations: true,
            compactMode: false,
            fontSize: 'medium'
        };
    });
    
    // State for UI interactions
    const [activeMenu, setActiveMenu] = useState(null); // postId
    const [activeComments, setActiveComments] = useState(new Set()); // set of postIds
    const [commentTexts, setCommentTexts] = useState({}); // { postId: text }
    
    const navigate = useNavigate();
    const { addToast } = useToast();
    const menuRef = useRef(null);

    useEffect(() => {
        const stored = localStorage.getItem('userInfo');
        if (stored) {
            setUserInfo(JSON.parse(stored));
        } else {
            navigate('/login');
        }
        
        const storedTheme = localStorage.getItem('chatTheme');
        if (storedTheme) setCurrentTheme(storedTheme);

        // Click outside menu closer
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setActiveMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [navigate]);

    const fetchPosts = useCallback(async () => {
        if (!userInfo) return;
        try {
            const { data } = await axios.get(`${API_URL}/posts?showPublic=${showPublic}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setPosts(data);
        } catch (err) {
            if (err.response?.status === 403) {
                alert('Your account has been banned.');
                localStorage.removeItem('userInfo');
                navigate('/login');
            }
            console.error('Error fetching posts', err);
        }
    }, [userInfo, showPublic]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!content.trim() && !imageUrl) return;

        try {
            const { data } = await axios.post(`${API_URL}/posts`, {
                content,
                imageUrl
            }, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setPosts([data, ...posts]);
            setContent('');
            setImageUrl('');
            addToast('Post shared!', 'success');
        } catch (err) {
            addToast('Failed to post', 'error');
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Delete this post?')) return;
        try {
            await axios.delete(`${API_URL}/posts/${postId}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setPosts(posts.filter(p => p._id !== postId));
            addToast('Post deleted', 'info');
        } catch (err) {
            addToast('Failed to delete', 'error');
        }
    };

    const handleLike = async (postId) => {
        try {
            const { data } = await axios.put(`${API_URL}/posts/${postId}/like`, {}, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setPosts(posts.map(p => p._id === postId ? { ...p, likes: data } : p));
        } catch (err) {
            console.error('Error liking post', err);
        }
    };

    const handleAddComment = async (postId) => {
        const text = commentTexts[postId];
        if (!text || !text.trim()) return;

        try {
            const { data } = await axios.post(`${API_URL}/posts/${postId}/comment`, { text }, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setPosts(posts.map(p => p._id === postId ? { ...p, comments: data } : p));
            setCommentTexts({ ...commentTexts, [postId]: '' });
        } catch (err) {
            addToast('Failed to add comment', 'error');
        }
    };

    const handleDeleteComment = async (postId, commentId) => {
        try {
            const { data } = await axios.delete(`${API_URL}/posts/${postId}/comment/${commentId}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setPosts(posts.map(p => p._id === postId ? { ...p, comments: data } : p));
            addToast('Comment removed', 'info');
        } catch (err) {
            addToast('Failed to delete comment', 'error');
        }
    };

    const toggleComments = (postId) => {
        const next = new Set(activeComments);
        if (next.has(postId)) next.delete(postId);
        else next.add(postId);
        setActiveComments(next);
    };

    const handleShare = (post) => {
        const url = `${window.location.origin}/post/${post._id}`;
        navigator.clipboard.writeText(url).then(() => {
            addToast('Link copied to clipboard!', 'success');
        });
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
            setImageUrl(data.url);
            addToast('Image ready!', 'success');
        } catch (err) {
            addToast('Upload failed', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        navigate('/login');
    };

    const changeTheme = (theme) => {
        setCurrentTheme(theme);
        localStorage.setItem('chatTheme', theme);
        window.dispatchEvent(new Event('themeChanged'));
    };

    if (!userInfo) return null;

    return (
        <div className={`social-dashboard ${currentTheme}`}>
            <nav className="social-nav">
                <div className="nav-left">
                    <div className="social-logo" onClick={() => navigate('/')}>💬</div>
                    <h1>NexSocial</h1>
                </div>
                <div className="nav-center">
                    <button className={`nav-link ${showPublic ? 'active' : ''}`} onClick={() => setShowPublic(true)}>
                        <Globe size={18} /> Public Feed
                    </button>
                    <button className={`nav-link ${!showPublic ? 'active' : ''}`} onClick={() => setShowPublic(false)}>
                        <Users size={18} /> Friends
                    </button>
                </div>
                <div className="nav-right">
                    <button className="chat-nav-btn" onClick={() => navigate('/chat')}><MessageSquare size={18} /> Chat</button>
                    <div className="user-profile-btn" onClick={() => navigate('/profile')}>
                        <div className="avatar-sm" style={{ background: userInfo.avatarColor || 'var(--accent)' }}>
                            {userInfo.username[0].toUpperCase()}
                        </div>
                        <span>{userInfo.username}</span>
                    </div>
                    <button className="icon-btn-settings" onClick={() => setShowSettings(true)}><Settings size={18} /></button>
                    <button className="icon-btn-logout" onClick={handleLogout}><LogOut size={18} /></button>
                </div>
            </nav>

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

            <div className="social-content">
                <main className="feed-main">
                    {/* --- Create Post --- */}
                    <div className="create-post-card glass">
                        <div className="create-post-header">
                            <div className="avatar-md" style={{ background: userInfo.avatarColor || 'var(--accent)' }}>
                                {userInfo.username[0].toUpperCase()}
                            </div>
                            <textarea 
                                placeholder={`What's on your mind, ${userInfo.username}?`}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        </div>
                        
                        {imageUrl && (
                            <div className="image-preview-container">
                                <img src={`${BACKEND_URL}${imageUrl}`} alt="preview" />
                                <button className="remove-img" onClick={() => setImageUrl('')}><X size={16} /></button>
                            </div>
                        )}

                        <div className="create-post-footer">
                            <div className="post-actions-left">
                                <label className="action-pill-btn">
                                    <input type="file" hidden onChange={handleFileUpload} accept="image/*" />
                                    <Camera size={18} />
                                    <span>Photo</span>
                                </label>
                            </div>
                            <button className="share-btn" onClick={handleCreatePost} disabled={(!content.trim() && !imageUrl) || uploading}>
                                {uploading ? 'Processing...' : 'Post'} <Plus size={18} />
                            </button>
                        </div>
                    </div>

                    {/* --- Posts Feed --- */}
                    <div className="posts-list">
                        {posts.map(post => (
                            <div key={post._id} className="post-card glass">
                                <div className="post-header">
                                    <div className="post-user-info">
                                        <div className="avatar-sm" style={{ background: post.user?.avatarColor || 'var(--accent)' }}>
                                            {post.user?.username[0].toUpperCase()}
                                        </div>
                                        <div className="user-meta">
                                            <h3>{post.user?.username}</h3>
                                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="post-options-wrap">
                                        <button className="icon-btn" onClick={() => setActiveMenu(activeMenu === post._id ? null : post._id)}>
                                            <MoreHorizontal size={18} />
                                        </button>
                                        {activeMenu === post._id && (
                                            <div className="post-menu-dropdown" ref={menuRef}>
                                                {post.user?._id === userInfo._id || userInfo.isAdmin ? (
                                                    <>
                                                        <button className="menu-item delete" onClick={() => handleDeletePost(post._id)}>
                                                            <Trash2 size={16} /> Delete Post
                                                        </button>
                                                        <button className="menu-item" onClick={() => addToast('Edit coming soon!', 'info')}>
                                                            <Edit3 size={16} /> Edit Post
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button className="menu-item" onClick={() => addToast('Post reported', 'success')}>
                                                        <Flag size={16} /> Report
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="post-body">
                                    {post.content && <p className="post-text">{post.content}</p>}
                                    {post.imageUrl && (
                                        <div className="post-image">
                                            <img src={`${BACKEND_URL}${post.imageUrl}`} alt="post" />
                                        </div>
                                    )}
                                </div>

                                <div className="post-footer">
                                    <div className="post-stats">
                                        <button 
                                            className={`stat-btn ${post.likes?.includes(userInfo._id) ? 'active' : ''}`}
                                            onClick={() => handleLike(post._id)}
                                        >
                                            <Heart size={18} fill={post.likes?.includes(userInfo._id) ? 'currentColor' : 'none'} />
                                            <span>{post.likes?.length || 0}</span>
                                        </button>
                                        <button className="stat-btn" onClick={() => toggleComments(post._id)}>
                                            <MessageCircle size={18} />
                                            <span>{post.comments?.length || 0}</span>
                                        </button>
                                    </div>
                                    <button className="icon-btn" title="Copy Link" onClick={() => handleShare(post)}>
                                        <Share2 size={18} />
                                    </button>
                                </div>

                                {/* --- Comments Section --- */}
                                {activeComments.has(post._id) && (
                                    <div className="comments-section">
                                        <div className="comment-input-row">
                                            <div className="avatar-xs" style={{ background: userInfo.avatarColor || 'var(--accent)' }}>
                                                {userInfo.username[0].toUpperCase()}
                                            </div>
                                            <input 
                                                type="text" 
                                                placeholder="Write a comment..." 
                                                value={commentTexts[post._id] || ''}
                                                onChange={(e) => setCommentTexts({ ...commentTexts, [post._id]: e.target.value })}
                                                onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post._id)}
                                            />
                                            <button className="send-comment-btn" onClick={() => handleAddComment(post._id)}>
                                                <Send size={16} />
                                            </button>
                                        </div>
                                        <div className="comments-list">
                                            {post.comments?.map(comment => (
                                                <div key={comment._id} className="comment-item">
                                                    <div className="avatar-xs" style={{ background: 'var(--accent)' }}>
                                                        {comment.username[0].toUpperCase()}
                                                    </div>
                                                    <div className="comment-content">
                                                        <div className="comment-bubble">
                                                            <div className="comment-header">
                                                                <h4>{comment.username}</h4>
                                                                {(comment.user === userInfo._id || userInfo.isAdmin) && (
                                                                    <button className="del-comment" onClick={() => handleDeleteComment(post._id, comment._id)}>
                                                                        <X size={12} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <p>{comment.text}</p>
                                                        </div>
                                                        <span className="comment-time">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </main>

                <aside className="social-sidebar">
                    <div className="profile-widget glass">
                        <div className="widget-header">
                            <div className="avatar-lg" style={{ background: userInfo.avatarColor || 'var(--accent)' }}>
                                {userInfo.username[0].toUpperCase()}
                            </div>
                            <h2>{userInfo.username}</h2>
                            <p>{userInfo.email}</p>
                        </div>
                        <div className="widget-stats">
                            <div className="stat-box">
                                <strong>{posts.filter(p => p.user?._id === userInfo._id).length}</strong>
                                <span>Posts</span>
                            </div>
                            <div className="stat-box">
                                <strong>{posts.reduce((acc, p) => acc + (p.likes?.length || 0), 0)}</strong>
                                <span>Likes</span>
                            </div>
                        </div>
                        <button className="profile-view-btn" onClick={() => navigate('/profile')}>My Profile</button>
                    </div>

                    <div className="trending-widget glass">
                        <h3>Trending Posts</h3>
                        {posts.sort((a,b) => (b.likes?.length || 0) - (a.likes?.length || 0)).slice(0, 3).map((p, i) => (
                            <div key={p._id} className="trending-item">
                                <span className="trend-rank">#{i+1}</span>
                                <div className="trend-info">
                                    <p>{p.content?.substring(0, 40)}...</p>
                                    <span>by {p.user?.username}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="suggested-friends glass">
                        <h3>Suggested People</h3>
                        <p className="hint">Discover people to follow</p>
                        <button className="discover-btn" onClick={() => navigate('/chat')}>Open Discovery</button>
                    </div>

                    <div className="footer-copyright">
                        <p>&copy; 2026 Mohamed amine Rzeigui</p>
                        <p>All rights reserved</p>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default SocialFeed;
