import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { 
    MessageSquare, Heart, Share2, Image as ImageIcon, Send, 
    LogOut, User, Globe, Users, Plus, X, Camera, MoreHorizontal,
    ThumbsUp, MessageCircle, Home, Trash2, Edit3, Flag, Copy, Check, Settings, Loader2,
    ChevronLeft, ChevronRight, UserPlus, Hash, Filter, ExternalLink, Sparkles, SlidersHorizontal
} from 'lucide-react';
import './SocialFeed.css';
import { useToast } from './Toast';
import SettingsPanel from './SettingsPanel';

const BACKEND_URL = import.meta.env.PROD ? window.location.origin : `${window.location.protocol}//${window.location.hostname}:5000`;
const API_URL = `${BACKEND_URL}/api`;

const getFullImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${BACKEND_URL}${url}`;
};

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
    const [userInfo, setUserInfo] = useState(readStoredUserInfo);
    const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('chatTheme') || 'theme-snow');
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
    const [socket, setSocket] = useState(null);
    
    // Friends list and suggested friends carousel states
    const [friendships, setFriendships] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [friendSearch, setFriendSearch] = useState('');
    const [sentRequests, setSentRequests] = useState(new Set());
    const [unfriendingId, setUnfriendingId] = useState(null);
    const [messagingFriendId, setMessagingFriendId] = useState(null);

    // ── Hashtag feature
    const HASHTAGS = ['#general', '#announcement', '#question', '#meme', '#news', '#random', '#tech', '#art'];
    const [selectedTag, setSelectedTag] = useState('');
    const [filterTag, setFilterTag] = useState('');

    // ── Emoji Reactions
    const POST_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
    const [activeReactionPicker, setActiveReactionPicker] = useState(null); // postId

    // ── Share to Chat modal
    const [sharePost, setSharePost] = useState(null); // post object
    
    const navigate = useNavigate();
    const { addToast } = useToast();
    const menuRef = useRef(null);

    // Derived: whether user has any accepted friends
    const hasFriends = friendships.some(f => f.status === 'accepted');

    const fetchFriendData = useCallback(async () => {
        if (!userInfo) return;
        try {
            const token = userInfo.token;
            // Fetch friendships
            const friendRes = await axios.get(`${API_URL}/friends`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFriendships(friendRes.data);

            // Fetch suggestions
            const suggRes = await axios.get(`${API_URL}/friends/suggestions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSuggestions(suggRes.data);
        } catch (err) {
            console.error('Error fetching friend details:', err);
        }
    }, [userInfo]);

    const handleAddFriend = async (userId, username) => {
        try {
            const token = userInfo?.token;
            const { data } = await axios.post(
                `${API_URL}/friends/request`,
                { recipientId: userId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (socket) {
                socket.emit('send_friend_request', {
                    recipientId: userId,
                    request: data,
                    requesterName: userInfo.username
                });
            }
            addToast(`Friend request sent to ${username}!`, 'success');
            // Remove user from suggestions list
            setSuggestions(prev => prev.filter(user => user._id !== userId));
            // Reload friendships
            fetchFriendData();
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to send request', 'error');
        }
    };

    const handleSkipSuggestion = (userId) => {
        setSuggestions(prev => prev.filter(user => user._id !== userId));
    };

    const handleAcceptRequest = async (friendshipId, otherUsername) => {
        try {
            const token = userInfo?.token;
            await axios.put(`${API_URL}/friends/accept/${friendshipId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            addToast(`You are now friends with ${otherUsername}! 🎉`, 'success');
            fetchFriendData();
        } catch (err) {
            addToast('Failed to accept request', 'error');
        }
    };

    const handleDeclineRequest = async (friendshipId, otherUsername) => {
        try {
            const token = userInfo?.token;
            await axios.put(`${API_URL}/friends/decline/${friendshipId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            addToast(`Declined request from ${otherUsername}`, 'info');
            fetchFriendData();
        } catch (err) {
            addToast('Failed to decline request', 'error');
        }
    };

    const handleUnfriend = async (friendshipId, friendUsername) => {
        if (!window.confirm(`Remove ${friendUsername} from your friends?`)) return;
        setUnfriendingId(friendshipId);
        try {
            const token = userInfo?.token;
            await axios.delete(`${API_URL}/friends/${friendshipId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            addToast(`${friendUsername} removed from friends`, 'info');
            fetchFriendData();
        } catch (err) {
            addToast('Failed to remove friend', 'error');
        } finally {
            setUnfriendingId(null);
        }
    };

    const handleMessageFriend = async (friend) => {
        setMessagingFriendId(friend._id);
        try {
            const token = userInfo?.token;
            await axios.post(`${API_URL}/rooms/dm`, { recipientId: friend._id }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (err) {
            // Room may already exist — that's fine
        } finally {
            setMessagingFriendId(null);
        }
        navigate('/chat');
    };

    const prevSlide = () => {
        setCarouselIndex(prev => Math.max(0, prev - 1));
    };

    const nextSlide = () => {
        setCarouselIndex(prev => Math.min(suggestions.length - 1, prev + 1));
    };

    useEffect(() => {
        let newSocket = null;
        const stored = localStorage.getItem('userInfo');
        if (stored) {
            try {
                const user = JSON.parse(stored);
                setUserInfo(user);
                newSocket = io(BACKEND_URL, { auth: { token: user.token } });
                setSocket(newSocket);
                newSocket.on('new_post', (post) => {
                    setPosts(prev => [post, ...prev.filter(p => p._id !== post._id)]);
                });
                newSocket.on('post_update', ({ postId, likes, comments }) => {
                    setPosts(prev => prev.map(p => p._id === postId ? { ...p, likes, comments } : p));
                });
            } catch {
                localStorage.removeItem('userInfo');
                setUserInfo(null);
                navigate('/login');
            }
        } else {
            navigate('/login');
        }

        const storedTheme = localStorage.getItem('chatTheme');
        if (storedTheme) setCurrentTheme(storedTheme);

        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setActiveMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (newSocket) newSocket.disconnect();
        };
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
        fetchFriendData();
    }, [fetchPosts, fetchFriendData]);

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!content.trim() && !imageUrl) return;

        try {
            const { data } = await axios.post(`${API_URL}/posts`, {
                content: selectedTag ? `${selectedTag} ${content}` : content,
                imageUrl
            }, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            
            // setPosts([data, ...posts]); // Local update handled by socket
            if (socket) socket.emit('post_created', data);
            
            setContent('');
            setImageUrl('');
            setSelectedTag('');
            addToast('Post shared!', 'success');
        } catch (err) {
            addToast('Failed to post', 'error');
        }
    };

    // ── Emoji Reaction on Post
    const handlePostReaction = async (postId, emoji) => {
        try {
            const { data } = await axios.put(`${API_URL}/posts/${postId}/react`, { emoji }, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            // Fall back to optimistic update if endpoint not ready
            setPosts(prev => prev.map(p => p._id === postId ? { ...p, reactions: data.reactions ?? p.reactions } : p));
            if (socket) socket.emit('post_updated', { postId, likes: data.likes, comments: data.comments });
        } catch {
            // Optimistic: toggle emoji locally
            setPosts(prev => prev.map(p => {
                if (p._id !== postId) return p;
                const reactions = { ...(p.reactions || {}) };
                const users = reactions[emoji] ? [...reactions[emoji]] : [];
                const idx = users.indexOf(userInfo._id);
                if (idx > -1) users.splice(idx, 1); else users.push(userInfo._id);
                reactions[emoji] = users;
                return { ...p, reactions };
            }));
        }
        setActiveReactionPicker(null);
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
            // data is likes array
            const targetPost = posts.find(p => p._id === postId);
            if (socket) socket.emit('post_updated', { postId, likes: data, comments: targetPost?.comments });
            // setPosts(posts.map(p => p._id === postId ? { ...p, likes: data } : p)); // Handled by socket
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
            // data is comments array
            const targetPost = posts.find(p => p._id === postId);
            if (socket) socket.emit('post_updated', { postId, likes: targetPost?.likes, comments: data });
            // setPosts(posts.map(p => p._id === postId ? { ...p, comments: data } : p)); // Handled by socket
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
            const token = userInfo?.token;
            const { data } = await axios.post(`${API_URL}/upload`, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`
                }
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
                    <div className="social-logo" onClick={() => navigate('/')}>
                        <img src="/mosma_logo.png" alt="MosMA Logo" style={{width: '32px', height: '32px', objectFit: 'contain', borderRadius: '50%'}} />
                    </div>
                    <h1>MosMA Social</h1>
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
                            {userInfo.profilePic ? (
                                <img src={getFullImageUrl(userInfo.profilePic)} alt="avatar" />
                            ) : (
                                userInfo.username?.charAt(0).toUpperCase() || '?'
                            )}
                        </div>
                        <span>{userInfo.username}</span>
                    </div>
                    <button className="icon-btn-settings-premium" onClick={() => setShowSettings(true)} title="Settings">
                        <SlidersHorizontal size={16} />
                        <span>Settings</span>
                    </button>
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
                    userInfo={userInfo}
                    onOpenAdmin={() => {
                        setShowSettings(false);
                        navigate('/chat');
                    }}
                />
            )}

            <div className="social-content">
                <main className="feed-main">
                    {/* --- Create Post --- */}
                    {showPublic && (
                        <div className="create-post-card glass">
                            <div className="create-post-header">
                                <div className="avatar-md" style={{ background: userInfo.avatarColor || 'var(--accent)' }}>
                                        {userInfo.profilePic ? (
                                            <img src={getFullImageUrl(userInfo.profilePic)} alt="avatar" />
                                        ) : (
                                            userInfo.username?.charAt(0).toUpperCase() || '?'
                                        )}
                                </div>
                                <textarea 
                                    placeholder={`What's on your mind, ${userInfo.username}?`}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                />
                            </div>

                            {/* Hashtag selector */}
                            <div className="hashtag-selector">
                                {HASHTAGS.map(tag => (
                                    <button
                                        key={tag}
                                        className={`hashtag-pill ${selectedTag === tag ? 'active' : ''}`}
                                        onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                            
                            {imageUrl && (
                                <div className="image-preview-container">
                                    <img src={getFullImageUrl(imageUrl)} alt="preview" />
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
                                    {selectedTag && (
                                        <span className="selected-tag-preview">{selectedTag}</span>
                                    )}
                                </div>
                                <button className="share-btn" onClick={handleCreatePost} disabled={(!content.trim() && !imageUrl) || uploading}>
                                    {uploading ? 'Processing...' : 'Post'} <Plus size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Hashtag filter bar (public feed) */}
                    {showPublic && filterTag && (
                        <div className="filter-tag-bar glass">
                            <Filter size={14} /> Filtering by <strong>{filterTag}</strong>
                            <button className="clear-filter" onClick={() => setFilterTag('')}><X size={13} /></button>
                        </div>
                    )}

                    {/* --- Posts Feed / Friends Hub --- */}
                    {!showPublic ? (
                        <div className="friends-hub-container animate-fade-in">

                            {/* ── Pending Requests Banner */}
                            {(() => {
                                const pending = friendships.filter(f => f.status === 'pending' && f.recipient?._id === userInfo._id);
                                if (pending.length === 0) return null;
                                return (
                                    <div className="fh-section fh-requests">
                                        <div className="fh-section-header">
                                            <span className="fh-section-icon">📬</span>
                                            <h3>Friend Requests</h3>
                                            <span className="fh-badge">{pending.length}</span>
                                        </div>
                                        <div className="fh-requests-list">
                                            {pending.map(f => {
                                                const req = f.requester;
                                                if (!req) return null;
                                                return (
                                                    <div key={f._id} className="fh-request-row">
                                                        <div className="fh-request-avatar" style={{ background: req.avatarColor || 'var(--accent)' }}>
                                                            {req.profilePic
                                                                ? <img src={getFullImageUrl(req.profilePic)} alt="av" />
                                                                : req.username?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="fh-request-meta">
                                                            <strong>{req.username}</strong>
                                                            <span>{req.email}</span>
                                                        </div>
                                                        <div className="fh-request-actions">
                                                            <button className="fh-btn fh-btn-accept" onClick={() => handleAcceptRequest(f._id, req.username)}>
                                                                <Check size={14} /> Accept
                                                            </button>
                                                            <button className="fh-btn fh-btn-decline" onClick={() => handleDeclineRequest(f._id, req.username)}>
                                                                <X size={14} /> Decline
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* ── My Friends */}
                            {(() => {
                                const accepted = friendships.filter(f => f.status === 'accepted');
                                const filtered = accepted.filter(f => {
                                    const friend = f.requester?._id === userInfo._id ? f.recipient : f.requester;
                                    if (!friend) return false;
                                    return !friendSearch || friend.username?.toLowerCase().includes(friendSearch.toLowerCase());
                                });
                                return (
                                    <div className="fh-section fh-myfriends">
                                        <div className="fh-section-header">
                                            <span className="fh-section-icon">👥</span>
                                            <h3>My Friends</h3>
                                            {accepted.length > 0 && <span className="fh-badge fh-badge-neutral">{accepted.length}</span>}
                                            {accepted.length > 3 && (
                                                <div className="fh-search-wrap">
                                                    <input
                                                        className="fh-search"
                                                        placeholder="Search friends…"
                                                        value={friendSearch}
                                                        onChange={e => setFriendSearch(e.target.value)}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {accepted.length === 0 ? (
                                            <div className="fh-empty">
                                                <div className="fh-empty-icon">🤝</div>
                                                <h4>No friends yet</h4>
                                                <p>Add people from the suggestions below to start connecting!</p>
                                            </div>
                                        ) : filtered.length === 0 ? (
                                            <div className="fh-empty">
                                                <p>No friends match <strong>"{friendSearch}"</strong></p>
                                            </div>
                                        ) : (
                                            <div className="fh-friends-grid">
                                                {filtered.map(f => {
                                                    const friend = f.requester?._id === userInfo._id ? f.recipient : f.requester;
                                                    if (!friend) return null;
                                                    const isMessaging = messagingFriendId === friend._id;
                                                    const isUnfriending = unfriendingId === f._id;
                                                    return (
                                                        <div key={f._id} className="fh-friend-card">
                                                            <div className="fh-friend-avatar-wrap">
                                                                <div className="fh-friend-avatar" style={{ background: friend.avatarColor || 'var(--accent)' }}>
                                                                    {friend.profilePic
                                                                        ? <img src={getFullImageUrl(friend.profilePic)} alt="av" />
                                                                        : friend.username?.charAt(0).toUpperCase()}
                                                                </div>
                                                                <span className="fh-online-dot" />
                                                            </div>
                                                            <div className="fh-friend-info">
                                                                <h4>{friend.username}</h4>
                                                                {friend.subscriptionTier && friend.subscriptionTier !== 'free' && (
                                                                    <span className={`badge badge-${friend.subscriptionTier}`}>{friend.subscriptionTier.toUpperCase()}</span>
                                                                )}
                                                            </div>
                                                            <div className="fh-friend-btns">
                                                                <button
                                                                    className="fh-btn fh-btn-msg"
                                                                    onClick={() => handleMessageFriend(friend)}
                                                                    disabled={isMessaging}
                                                                >
                                                                    <MessageSquare size={13} />
                                                                    {isMessaging ? 'Opening…' : 'Message'}
                                                                </button>
                                                                <button
                                                                    className="fh-btn fh-btn-unfriend"
                                                                    onClick={() => handleUnfriend(f._id, friend.username)}
                                                                    disabled={isUnfriending}
                                                                    title="Unfriend"
                                                                >
                                                                    <X size={13} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* ── Suggestions */}
                            <div className="fh-section fh-suggestions">
                                <div className="fh-section-header">
                                    <span className="fh-section-icon">💡</span>
                                    <h3>People You May Know</h3>
                                    {suggestions.length > 0 && <span className="fh-badge fh-badge-neutral">{suggestions.length}</span>}
                                </div>
                                {suggestions.length === 0 ? (
                                    <div className="fh-empty">
                                        <div className="fh-empty-icon">🔍</div>
                                        <h4>No suggestions right now</h4>
                                        <p>Discover more people via the chat search panel.</p>
                                        <button className="fh-discover-btn" onClick={() => navigate('/chat')}>
                                            <UserPlus size={15} /> Open Discovery
                                        </button>
                                    </div>
                                ) : (
                                    <div className="fh-suggestions-grid">
                                        {suggestions.map(user => {
                                            const sent = sentRequests.has(user._id);
                                            return (
                                                <div key={user._id} className="fh-suggest-card">
                                                    <button
                                                        className="fh-suggest-skip"
                                                        onClick={() => handleSkipSuggestion(user._id)}
                                                        title="Dismiss"
                                                    ><X size={14} /></button>
                                                    <div className="fh-suggest-avatar" style={{ background: user.avatarColor || 'var(--accent)' }}>
                                                        {user.profilePic
                                                            ? <img src={getFullImageUrl(user.profilePic)} alt="av" />
                                                            : user.username?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="fh-suggest-info">
                                                        <h4>{user.username}</h4>
                                                        {user.subscriptionTier && user.subscriptionTier !== 'free' && (
                                                            <span className={`badge badge-${user.subscriptionTier}`}>{user.subscriptionTier.toUpperCase()}</span>
                                                        )}
                                                        <p className="fh-suggest-status">{user.status || 'Active Member'}</p>
                                                    </div>
                                                    <button
                                                        className={`fh-btn fh-btn-add ${sent ? 'fh-btn-sent' : ''}`}
                                                        onClick={() => {
                                                            if (sent) return;
                                                            setSentRequests(prev => new Set([...prev, user._id]));
                                                            handleAddFriend(user._id, user.username);
                                                        }}
                                                        disabled={sent}
                                                    >
                                                        {sent ? <><Check size={13} /> Sent</> : <><UserPlus size={13} /> Add Friend</>}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="posts-list">
                            {posts
                                .filter(post => !filterTag || (post.content && post.content.includes(filterTag)))
                                .length === 0 ? (
                                <div className="empty-feed glass">
                                    <p>No posts to show. Share something with the community!</p>
                                </div>
                            ) : (
                                posts
                                    .filter(post => !filterTag || (post.content && post.content.includes(filterTag)))
                                    .map(post => (
                                    <div key={post._id} className="post-card glass">
                                        <div className="post-header">
                                            <div className="post-user-info">
                                                <div className="avatar-sm" style={{ background: post.user?.avatarColor || 'var(--accent)' }}>
                                                    {post.user?.profilePic ? (
                                                        <img src={getFullImageUrl(post.user.profilePic)} alt="avatar" />
                                                    ) : (
                                                        post.user?.username?.charAt(0).toUpperCase() || '?'
                                                    )}
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
                                            {post.content && (
                                                <p className="post-text">
                                                    {post.content.split(' ').map((word, i) =>
                                                        word.startsWith('#') ? (
                                                            <span
                                                                key={i}
                                                                className="post-hashtag"
                                                                onClick={() => setFilterTag(word)}
                                                            >{word} </span>
                                                        ) : (
                                                            <span key={i}>{word} </span>
                                                        )
                                                    )}
                                                </p>
                                            )}
                                            {post.imageUrl && (
                                                <div className="post-image">
                                                    <img src={getFullImageUrl(post.imageUrl)} alt="post" />
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
                                                {/* Emoji reaction trigger */}
                                                <div className="reaction-trigger-wrap">
                                                    <button
                                                        className="stat-btn reaction-open-btn"
                                                        onClick={() => setActiveReactionPicker(activeReactionPicker === post._id ? null : post._id)}
                                                        title="React"
                                                    >
                                                        😊 <span>{Object.values(post.reactions || {}).reduce((a, b) => a + b.length, 0) || ''}</span>
                                                    </button>
                                                    {activeReactionPicker === post._id && (
                                                        <div className="emoji-reaction-picker">
                                                            {POST_REACTIONS.map(emoji => (
                                                                <button
                                                                    key={emoji}
                                                                    className={`reaction-emoji-btn ${(post.reactions?.[emoji] || []).includes(userInfo._id) ? 'active' : ''}`}
                                                                    onClick={() => handlePostReaction(post._id, emoji)}
                                                                >
                                                                    {emoji}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <button className="icon-btn" title="Share" onClick={() => setSharePost(post)}>
                                                <Share2 size={18} />
                                            </button>
                                        </div>

                                        {/* Emoji reactions tally row */}
                                        {post.reactions && Object.keys(post.reactions).some(e => post.reactions[e].length > 0) && (
                                            <div className="post-reactions-tally">
                                                {Object.entries(post.reactions).filter(([,users]) => users.length > 0).map(([emoji, users]) => (
                                                    <span
                                                        key={emoji}
                                                        className={`reaction-tally-pill ${users.includes(userInfo._id) ? 'active' : ''}`}
                                                        onClick={() => handlePostReaction(post._id, emoji)}
                                                        title={`${users.length} reaction${users.length > 1 ? 's' : ''}`}
                                                    >
                                                        {emoji} {users.length}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* --- Comments Section --- */}
                                        {activeComments.has(post._id) && (
                                            <div className="comments-section">
                                                <div className="comment-input-row">
                                                    <div className="avatar-xs" style={{ background: userInfo.avatarColor || 'var(--accent)' }}>
                                                        {userInfo.profilePic ? (
                                                            <img src={getFullImageUrl(userInfo.profilePic)} alt="avatar" />
                                                        ) : (
                                                            userInfo.username?.charAt(0).toUpperCase() || '?'
                                                        )}
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
                                ))
                            )}
                        </div>
                    )}
                </main>

                <aside className="social-sidebar">
                    <div className="profile-widget glass">
                        <div className="widget-header">
                            <div className="avatar-lg" style={{ background: userInfo.avatarColor || 'var(--accent)' }}>
                                    {userInfo.profilePic ? (
                                        <img src={getFullImageUrl(userInfo.profilePic)} alt="avatar" />
                                    ) : (
                                        userInfo.username?.charAt(0).toUpperCase() || '?'
                                    )}
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

                    {/* Hashtag Filter Widget */}
                    <div className="hashtag-filter-widget glass">
                        <h3><Hash size={14} /> Browse by Topic</h3>
                        <div className="hashtag-filter-pills">
                            {HASHTAGS.map(tag => (
                                <button
                                    key={tag}
                                    className={`hashtag-filter-pill ${filterTag === tag ? 'active' : ''}`}
                                    onClick={() => { setFilterTag(filterTag === tag ? '' : tag); setShowPublic(true); }}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="footer-copyright">
                        <p>&copy; 2026 Mohamed amine Rzeigui</p>
                        <p>All rights reserved</p>
                    </div>
                </aside>
            </div>

            {/* ── SHARE TO CHAT MODAL ─────────────────── */}
            {sharePost && (
                <div className="share-modal-overlay" onClick={() => setSharePost(null)}>
                    <div className="share-modal glass" onClick={e => e.stopPropagation()}>
                        <div className="share-modal-header">
                            <h3><Share2 size={16} /> Share Post</h3>
                            <button className="share-modal-close" onClick={() => setSharePost(null)}><X size={18} /></button>
                        </div>
                        <div className="share-modal-preview">
                            <div className="share-preview-user">
                                <div className="avatar-xs" style={{ background: sharePost.user?.avatarColor || 'var(--accent)' }}>
                                    {sharePost.user?.username?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <span>{sharePost.user?.username}</span>
                            </div>
                            {sharePost.content && <p className="share-preview-text">{sharePost.content.substring(0, 100)}{sharePost.content.length > 100 ? '…' : ''}</p>}
                            {sharePost.imageUrl && <img className="share-preview-img" src={getFullImageUrl(sharePost.imageUrl)} alt="post" />}
                        </div>
                        <div className="share-modal-actions">
                            <button
                                className="share-action-btn copy-btn"
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/post/${sharePost._id}`);
                                    addToast('Link copied to clipboard!', 'success');
                                    setSharePost(null);
                                }}
                            >
                                <Copy size={16} /> Copy Link
                            </button>
                            <button
                                className="share-action-btn chat-btn"
                                onClick={() => {
                                    const link = `${window.location.origin}/post/${sharePost._id}`;
                                    navigator.clipboard.writeText(link);
                                    addToast('Link copied — paste it in Chat!', 'success');
                                    setSharePost(null);
                                    navigate('/chat');
                                }}
                            >
                                <ExternalLink size={16} /> Share to Chat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SocialFeed;
