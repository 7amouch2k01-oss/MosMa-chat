import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Calendar, MessageSquare, Users,
    Heart, MessageCircle, MoreHorizontal, Home,
    Shield, Mail, Edit2, Camera, X, Check, Loader2,
    AlertCircle, RefreshCw, Globe, Award, Zap,
    Image as ImageIcon, FileText, UserCheck, Star
} from 'lucide-react';
import { useToast } from './Toast';
import BillingModal from './BillingModal';
import './SocialFeed.css';
import './ProfileView.css';

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

const AVATAR_COLORS = ['#4F46E5', '#F97316', '#06B6D4', '#10B981', '#EC4899', '#8B5CF6', '#EF4444', '#F59E0B'];

const TIER_INFO = {
    free:  { icon: '🌱', label: 'Free',  color: '#94a3b8', desc: 'Basic access to MosMA Chat.' },
    pro:   { icon: '⚡', label: 'Pro',   color: '#818cf8', desc: 'Priority support, Pro badge & custom profile.' },
    elite: { icon: '👑', label: 'Elite', color: '#fbbf24', desc: 'All Pro features + profile music, Glow FX & more.' },
};

const ProfileView = () => {
    const [posts, setPosts]       = useState([]);
    const [stats, setStats]       = useState({ messageCount: 0, friendCount: 0 });
    const [userInfo, setUserInfo] = useState(readStoredUserInfo);
    const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('chatTheme') || 'theme-snow');
    const [isEditing, setIsEditing]   = useState(false);
    const [editData, setEditData]     = useState({});
    const [uploading, setUploading]   = useState(false);
    const [showBilling, setShowBilling] = useState(false);
    const [activeTab, setActiveTab]   = useState('posts'); // posts | about | friends

    // Email verification
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [verifying, setVerifying]     = useState(false);
    const [resendingCode, setResendingCode] = useState(false);
    const [verifyError, setVerifyError] = useState('');
    const [devVerificationCode, setDevVerificationCode] = useState('');

    const { addToast } = useToast();
    const navigate     = useNavigate();

    /* ── Bootstrap ──────────────────────────────── */
    useEffect(() => {
        const stored = localStorage.getItem('userInfo');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setUserInfo(parsed);
                if (parsed.devVerificationCode) setDevVerificationCode(parsed.devVerificationCode);
            } catch {
                localStorage.removeItem('userInfo');
                navigate('/login');
            }
        } else {
            navigate('/login');
        }
        const t = localStorage.getItem('chatTheme');
        if (t) setCurrentTheme(t);
    }, [navigate]);

    useEffect(() => {
        if (userInfo) { fetchStats(); fetchUserPosts(); }
    }, [userInfo?._id]);

    /* ── Data fetchers ──────────────────────────── */
    const fetchStats = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/users/stats?userId=${userInfo._id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setStats(data);
        } catch {}
    };

    const fetchUserPosts = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/posts/user/${userInfo._id}`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setPosts(data);
        } catch {}
    };

    /* ── Edit profile ───────────────────────────── */
    const handleEditProfile = () => {
        setEditData({
            username: userInfo.username,
            email:    userInfo.email || '',
            status:   userInfo.status || '',
            bio:      userInfo.bio || '',
            profilePic:     userInfo.profilePic || '',
            avatarColor:    userInfo.avatarColor || '#4F46E5',
            profileBgType:  userInfo.profileBgType || 'color',
            profileCardBg:  userInfo.profileCardBg || '',
            glowColor:      userInfo.glowColor || '',
            profileMusicUrl: userInfo.profileMusicUrl || ''
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
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${userInfo.token}` }
            });
            setEditData(prev => ({ ...prev, profilePic: data.url }));
            addToast('Photo uploaded!', 'success');
        } catch { addToast('Upload failed', 'error'); }
        finally   { setUploading(false); }
    };

    const saveProfile = async () => {
        try {
            const { data } = await axios.put(`${API_URL}/users/profile`, editData, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            const emailChanged = editData.email.toLowerCase().trim() !== userInfo.email.toLowerCase().trim();
            const updated = { ...userInfo, ...data };
            localStorage.setItem('userInfo', JSON.stringify(updated));
            setUserInfo(updated);
            setIsEditing(false);
            if (emailChanged) {
                if (data.devVerificationCode) setDevVerificationCode(data.devVerificationCode);
                addToast('Email updated! Please verify your new address.', 'info');
                setShowVerifyModal(true);
            } else {
                addToast('Profile saved! ✨', 'success');
            }
            fetchUserPosts();
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to update profile', 'error');
        }
    };

    /* ── Email verification ─────────────────────── */
    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setVerifyError('');
        if (!verificationCode.trim()) return setVerifyError('Code is required');
        if (!/^\d{6}$/.test(verificationCode.trim())) return setVerifyError('Must be 6 digits');
        setVerifying(true);
        try {
            const { data } = await axios.post(
                `${API_URL}/auth/verify-email`,
                { code: verificationCode.trim() },
                { headers: { Authorization: `Bearer ${userInfo.token}` } }
            );
            const updated = { ...userInfo, ...data };
            delete updated.devVerificationCode;
            localStorage.setItem('userInfo', JSON.stringify(updated));
            setUserInfo(updated);
            setDevVerificationCode(''); setVerificationCode('');
            setShowVerifyModal(false);
            addToast('Email verified! ✅', 'success');
        } catch (err) {
            setVerifyError(err.response?.data?.message || 'Incorrect code.');
        } finally { setVerifying(false); }
    };

    const handleResendCode = async () => {
        setVerifyError(''); setResendingCode(true);
        try {
            const { data } = await axios.post(`${API_URL}/auth/resend-verification`, {}, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            addToast('New code sent to your email!', 'success');
            if (data.devVerificationCode) {
                setDevVerificationCode(data.devVerificationCode);
                localStorage.setItem('userInfo', JSON.stringify({ ...userInfo, devVerificationCode: data.devVerificationCode }));
            }
        } catch (err) { addToast(err.response?.data?.message || 'Failed to resend', 'error'); }
        finally { setResendingCode(false); }
    };

    if (!userInfo) {
        return (
            <div className={`social-dashboard ${currentTheme} feed-boot-loader`}>
                <Loader2 size={36} className="feed-boot-loader-icon" />
            </div>
        );
    }

    const tier     = TIER_INFO[userInfo.subscriptionTier] || TIER_INFO.free;
    const joinYear = userInfo.createdAt ? new Date(userInfo.createdAt).getFullYear() : new Date().getFullYear();
    const totalLikes = posts.reduce((acc, p) => acc + (p.likes?.length || 0), 0);

    return (
        <div className={`social-dashboard ${currentTheme}`}>
            {/* ── Nav ───────────────────────────────── */}
            <nav className="social-nav">
                <div className="nav-left">
                    <button className="icon-btn-back" onClick={() => navigate('/feed')} title="Back">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="social-logo" onClick={() => navigate('/')}>
                        <img src="/mosma_logo.png" alt="MosMA" style={{ width: 30, height: 30, objectFit: 'contain', borderRadius: '50%' }} />
                    </div>
                    <h1>My Profile</h1>
                </div>
                <div className="nav-right">
                    <button className="chat-nav-btn" onClick={() => navigate('/feed')}><Globe size={16} /> Feed</button>
                    <button className="chat-nav-btn" onClick={() => navigate('/chat')}><MessageSquare size={16} /> Chat</button>
                </div>
            </nav>

            <div className="profile-view-container">
                {/* ── Cover ─────────────────────────── */}
                <div className="profile-cover">
                    <div className="profile-cover-bg" />
                    <div className="profile-cover-orbs">
                        <span /><span /><span />
                    </div>
                    <div className="profile-cover-overlay" />

                    <div className="profile-hero">
                        <div className="pv-avatar-wrap">
                            <div className="avatar-huge" style={{ background: userInfo.avatarColor || '#4F46E5', boxShadow: userInfo.glowColor ? `0 0 30px ${userInfo.glowColor}, 0 0 60px ${userInfo.glowColor}40` : undefined }}>
                                {userInfo.profilePic
                                    ? <img src={getFullImageUrl(userInfo.profilePic)} alt="avatar" className="avatar-img-full" />
                                    : userInfo.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                        </div>

                        <div className="profile-details">
                            <div className="profile-title-row">
                                <h2>{userInfo.username}</h2>
                                <button className="edit-profile-btn" onClick={handleEditProfile}>
                                    <Edit2 size={14} /> Edit Profile
                                </button>
                                <button className="edit-profile-btn manage-sub-btn" onClick={() => setShowBilling(true)}>
                                    💳 Subscription
                                </button>
                            </div>

                            <p className="status-label">"{userInfo.status || 'No status set'}"</p>

                            <div className="email-label">
                                <Mail size={13} />
                                <span>{userInfo.email}</span>
                                {userInfo.isVerified ? (
                                    <span style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                        <Check size={10} /> Verified
                                    </span>
                                ) : (
                                    <button onClick={() => setShowVerifyModal(true)} style={{ background: '#ef4444', border: 'none', borderRadius: '8px', color: '#fff', padding: '2px 8px', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 700 }}>
                                        Verify
                                    </button>
                                )}
                            </div>

                            <div className="profile-badges">
                                {userInfo.isOwner && (
                                    <span style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', padding: '3px 10px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid rgba(245,158,11,0.3)' }}>
                                        <Shield size={11} /> Owner
                                    </span>
                                )}
                                {!userInfo.isOwner && userInfo.isAdmin && (
                                    <span className="badge-admin"><Shield size={11} /> Admin</span>
                                )}
                                {userInfo.subscriptionTier && userInfo.subscriptionTier !== 'free' && (
                                    <span style={{ background: userInfo.subscriptionTier === 'elite' ? 'rgba(234,179,8,0.18)' : 'rgba(99,102,241,0.18)', color: userInfo.subscriptionTier === 'elite' ? '#fbbf24' : '#818cf8', padding: '3px 10px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700, border: `1px solid ${userInfo.subscriptionTier === 'elite' ? 'rgba(234,179,8,0.35)' : 'rgba(99,102,241,0.35)'}` }}>
                                        {tier.icon} {tier.label}
                                    </span>
                                )}
                                <span className="badge-member"><Calendar size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />Member since {joinYear}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Stats bar ────────────────────── */}
                <div className="pv-stats-bar">
                    <div className="pv-stat-item">
                        <MessageSquare size={16} className="pv-stat-icon" />
                        <span className="pv-stat-value">{stats.messageCount}</span>
                        <span className="pv-stat-label">Messages</span>
                    </div>
                    <div className="pv-stat-item">
                        <Users size={16} className="pv-stat-icon" />
                        <span className="pv-stat-value">{stats.friendCount}</span>
                        <span className="pv-stat-label">Friends</span>
                    </div>
                    <div className="pv-stat-item">
                        <FileText size={16} className="pv-stat-icon" />
                        <span className="pv-stat-value">{posts.length}</span>
                        <span className="pv-stat-label">Posts</span>
                    </div>
                    <div className="pv-stat-item">
                        <Heart size={16} className="pv-stat-icon" />
                        <span className="pv-stat-value">{totalLikes}</span>
                        <span className="pv-stat-label">Likes Received</span>
                    </div>
                </div>

                {/* ── Tabs ─────────────────────────── */}
                <div style={{ marginTop: 24 }}>
                    <div className="pv-tabs">
                        {[
                            { id: 'posts',   icon: <ImageIcon size={15} />,   label: 'Posts' },
                            { id: 'about',   icon: <FileText size={15} />,    label: 'About' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                className={`pv-tab ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Body ─────────────────────────── */}
                <div className="pv-body">
                    {/* Sidebar */}
                    <aside className="pv-sidebar">
                        {/* Tier card */}
                        <div className={`pv-card pv-tier-card ${userInfo.subscriptionTier === 'elite' ? 'elite' : ''}`}>
                            <div className="pv-tier-icon">{tier.icon}</div>
                            <div className="pv-tier-name" style={{ color: tier.color }}>{tier.label} Plan</div>
                            <div className="pv-tier-desc">{tier.desc}</div>
                            {(userInfo.subscriptionTier === 'free' || userInfo.subscriptionTier === 'pro') && (
                                <button
                                    className={`pv-upgrade-btn ${userInfo.subscriptionTier === 'pro' ? 'gold' : ''}`}
                                    onClick={() => setShowBilling(true)}
                                >
                                    {userInfo.subscriptionTier === 'free' ? '⚡ Upgrade to Pro' : '👑 Upgrade to Elite'}
                                </button>
                            )}
                        </div>

                        {/* Info card */}
                        <div className="pv-card">
                            <h4>Profile Info</h4>
                            <div className="pv-info-list">
                                <div className="pv-info-row"><Mail size={14} /><span>{userInfo.email}</span></div>
                                <div className="pv-info-row"><Calendar size={14} /><span>Joined <strong>{joinYear}</strong></span></div>
                                {userInfo.isOwner && <div className="pv-info-row"><Shield size={14} /><strong>Platform Owner</strong></div>}
                                {!userInfo.isOwner && userInfo.isAdmin && <div className="pv-info-row"><Shield size={14} /><strong>Administrator</strong></div>}
                                <div className="pv-info-row">
                                    {userInfo.isVerified
                                        ? <><UserCheck size={14} /><span style={{ color: '#4ade80' }}>Email Verified</span></>
                                        : <><AlertCircle size={14} /><span style={{ color: '#f87171' }}>Email Not Verified</span></>}
                                </div>
                            </div>
                        </div>

                        {/* Stats detail */}
                        <div className="pv-card">
                            <h4>Activity</h4>
                            <div className="pv-detail-stats">
                                <div className="pv-detail-stat">
                                    <MessageSquare size={18} />
                                    <div className="pv-detail-stat-meta">
                                        <strong>{stats.messageCount}</strong>
                                        <span>Total Messages</span>
                                    </div>
                                </div>
                                <div className="pv-detail-stat">
                                    <Users size={18} />
                                    <div className="pv-detail-stat-meta">
                                        <strong>{stats.friendCount}</strong>
                                        <span>Friends</span>
                                    </div>
                                </div>
                                <div className="pv-detail-stat">
                                    <FileText size={18} />
                                    <div className="pv-detail-stat-meta">
                                        <strong>{posts.length}</strong>
                                        <span>Posts Shared</span>
                                    </div>
                                </div>
                                <div className="pv-detail-stat">
                                    <Heart size={18} />
                                    <div className="pv-detail-stat-meta">
                                        <strong>{totalLikes}</strong>
                                        <span>Likes Received</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main tab content */}
                    <main className="pv-main">
                        {/* ── POSTS TAB ── */}
                        {activeTab === 'posts' && (
                            <>
                                <div className="pv-section-header">
                                    <h3>My Posts</h3>
                                    <span>{posts.length} post{posts.length !== 1 ? 's' : ''}</span>
                                </div>
                                {posts.length === 0 ? (
                                    <div className="empty-posts glass">
                                        <ImageIcon size={40} style={{ opacity: 0.3 }} />
                                        <p>You haven't shared anything yet.</p>
                                        <button onClick={() => navigate('/feed')}>Share your first post →</button>
                                    </div>
                                ) : (
                                    <div className="posts-list">
                                        {posts.map(post => (
                                            <div key={post._id} className="post-card glass">
                                                <div className="post-header">
                                                    <div className="post-user-info">
                                                        <div className="avatar-sm" style={{ background: post.user?.avatarColor || 'var(--accent)' }}>
                                                            {post.user?.profilePic
                                                                ? <img src={getFullImageUrl(post.user.profilePic)} alt="av" />
                                                                : post.user?.username?.charAt(0).toUpperCase() || '?'}
                                                        </div>
                                                        <div className="user-meta">
                                                            <h3>{post.user?.username || 'You'}</h3>
                                                            <span>{new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                                        </div>
                                                    </div>
                                                    <button className="icon-btn"><MoreHorizontal size={18} /></button>
                                                </div>
                                                <div className="post-body">
                                                    {post.content && <p className="post-text">{post.content}</p>}
                                                    {post.imageUrl && (
                                                        <div className="post-image">
                                                            <img src={getFullImageUrl(post.imageUrl)} alt="post" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="post-footer">
                                                    <div className="post-stats">
                                                        <button className={`stat-btn ${post.likes?.includes(userInfo._id) ? 'active' : ''}`}>
                                                            <Heart size={17} fill={post.likes?.includes(userInfo._id) ? 'currentColor' : 'none'} />
                                                            <span>{post.likes?.length || 0}</span>
                                                        </button>
                                                        <button className="stat-btn">
                                                            <MessageCircle size={17} />
                                                            <span>{post.comments?.length || 0}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {/* ── ABOUT TAB ── */}
                        {activeTab === 'about' && (
                            <>
                                <div className="pv-section-header"><h3>About Me</h3></div>
                                <div className="pv-card">
                                    <h4>Bio</h4>
                                    <p className="pv-about-text">
                                        {userInfo.bio || 'No bio set yet. Click "Edit Profile" to add one!'}
                                    </p>
                                </div>
                                <div className="pv-card">
                                    <h4>Details</h4>
                                    <div className="pv-info-list">
                                        <div className="pv-info-row"><Mail size={15} /><span><strong>Email:</strong> {userInfo.email}</span></div>
                                        <div className="pv-info-row"><Calendar size={15} /><span><strong>Member since:</strong> {joinYear}</span></div>
                                        <div className="pv-info-row"><Star size={15} /><span><strong>Plan:</strong> {tier.icon} {tier.label}</span></div>
                                        {userInfo.status && <div className="pv-info-row"><Zap size={15} /><span><strong>Status:</strong> {userInfo.status}</span></div>}
                                    </div>
                                </div>
                                {(userInfo.subscriptionTier === 'elite' || userInfo.subscriptionTier === 'pro') && (
                                    <div className="pv-card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.05))', borderColor: 'rgba(99,102,241,0.25)' }}>
                                        <h4>Premium Perks</h4>
                                        <div className="pv-info-list">
                                            <div className="pv-info-row"><Award size={15} /><span>Custom profile glow color</span></div>
                                            <div className="pv-info-row"><ImageIcon size={15} /><span>Profile card background themes</span></div>
                                            {userInfo.subscriptionTier === 'elite' && (
                                                <div className="pv-info-row"><Star size={15} /><span>Profile background music</span></div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>

            {/* ── EDIT PROFILE MODAL ──────────────── */}
            {isEditing && (
                <div className="modal-overlay" onClick={() => setIsEditing(false)}>
                    <div className="edit-profile-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>✏️ Edit Profile</h3>
                            <button className="close-btn" onClick={() => setIsEditing(false)}><X size={18} /></button>
                        </div>
                        <div className="modal-body">
                            {/* Avatar */}
                            <div className="profile-pic-edit">
                                <div className="avatar-preview" style={{ background: editData.avatarColor }}>
                                    {editData.profilePic
                                        ? <img src={getFullImageUrl(editData.profilePic)} alt="preview" />
                                        : editData.username?.[0]?.toUpperCase()}
                                    <label className="upload-overlay">
                                        <input type="file" hidden onChange={handleProfilePicUpload} accept="image/*" />
                                        {uploading ? <Loader2 size={22} className="spin" /> : <Camera size={22} />}
                                    </label>
                                </div>
                                <span>Click to change photo</span>
                            </div>

                            <div className="input-field">
                                <label>Username</label>
                                <input type="text" value={editData.username} onChange={e => setEditData({ ...editData, username: e.target.value })} />
                            </div>
                            <div className="input-field">
                                <label>Email Address</label>
                                <input type="email" value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} />
                            </div>
                            <div className="input-field">
                                <label>Status</label>
                                <input type="text" placeholder="What's on your mind?" value={editData.status} onChange={e => setEditData({ ...editData, status: e.target.value })} />
                            </div>
                            <div className="input-field">
                                <label>Bio</label>
                                <textarea placeholder="Tell the community about yourself…" value={editData.bio} onChange={e => setEditData({ ...editData, bio: e.target.value })} />
                            </div>

                            <div className="color-selector">
                                <label>Avatar Color</label>
                                <div className="colors-grid">
                                    {AVATAR_COLORS.map(color => (
                                        <div
                                            key={color}
                                            className={`color-box ${editData.avatarColor === color ? 'active' : ''}`}
                                            style={{ background: color }}
                                            onClick={() => setEditData({ ...editData, avatarColor: color })}
                                        >
                                            {editData.avatarColor === color && <Check size={13} />}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Premium customizer */}
                            {(userInfo.subscriptionTier === 'elite' || userInfo.subscriptionTier === 'pro') && (
                                <div className="customizer-section">
                                    <div className="customizer-section-title">
                                        <span>✨</span>
                                        <span>Profile Customizer</span>
                                        <span className="customizer-tier-badge">{userInfo.subscriptionTier.toUpperCase()}</span>
                                    </div>

                                    <div className="input-field">
                                        <label>Avatar Glow Color</label>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                            <input
                                                type="color"
                                                value={editData.glowColor || '#6366f1'}
                                                onChange={e => setEditData({ ...editData, glowColor: e.target.value })}
                                                style={{ width: 44, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent' }}
                                            />
                                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', flex: 1 }}>Adds a glowing border around your avatar</span>
                                            <button type="button" onClick={() => setEditData({ ...editData, glowColor: '' })} style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer' }}>None</button>
                                        </div>
                                    </div>

                                    <div className="input-field">
                                        <label>Profile Card Background</label>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            {[
                                                { label: 'Default',  val: '' },
                                                { label: 'Midnight', val: 'linear-gradient(135deg,#0f172a,#1e293b)' },
                                                { label: 'Cosmic',   val: 'linear-gradient(135deg,#1e1b4b,#312e81)' },
                                                { label: 'Ember',    val: 'linear-gradient(135deg,#431407,#7c2d12)' },
                                                { label: 'Aurora',   val: 'linear-gradient(135deg,#052e16,#14532d)' },
                                                { label: 'Rose',     val: 'linear-gradient(135deg,#4c0519,#881337)' },
                                            ].map(bg => (
                                                <button
                                                    key={bg.val}
                                                    type="button"
                                                    onClick={() => setEditData({ ...editData, profileCardBg: bg.val, profileBgType: bg.val ? 'gradient' : 'color' })}
                                                    style={{ padding: '6px 12px', borderRadius: 8, border: editData.profileCardBg === bg.val ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.1)', background: bg.val || 'rgba(255,255,255,0.06)', color: '#e2e8f0', fontSize: '0.73rem', cursor: 'pointer', fontWeight: editData.profileCardBg === bg.val ? 700 : 400 }}
                                                >{bg.label}</button>
                                            ))}
                                        </div>
                                    </div>

                                    {userInfo.subscriptionTier === 'elite' && (
                                        <div className="input-field">
                                            <label>🎵 Profile Music <span style={{ fontSize: '0.66rem', color: '#fbbf24' }}>ELITE ONLY</span></label>
                                            <input type="url" placeholder="https://… (MP3 direct link)" value={editData.profileMusicUrl} onChange={e => setEditData({ ...editData, profileMusicUrl: e.target.value })} />
                                            <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Plays when others visit your profile</small>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                            <button className="save-btn" onClick={saveProfile}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── VERIFY EMAIL MODAL ──────────────── */}
            {showVerifyModal && (
                <div className="modal-overlay" onClick={() => setShowVerifyModal(false)}>
                    <div className="edit-profile-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="modal-header">
                            <h3>📧 Verify Email</h3>
                            <button className="close-btn" onClick={() => setShowVerifyModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleVerifyCode}>
                            <div className="modal-body">
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                                    Enter the 6-digit code sent to <strong>{userInfo.email}</strong>.
                                </p>
                                {verifyError && (
                                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', padding: '10px 14px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                                        <AlertCircle size={14} /> {verifyError}
                                    </div>
                                )}
                                {devVerificationCode && (
                                    <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#c7d2fe', padding: '8px 14px', borderRadius: 10, fontSize: '0.8rem' }}>
                                        💡 <strong>Dev Code:</strong> <strong>{devVerificationCode}</strong>
                                    </div>
                                )}
                                <div className="input-field">
                                    <label>6-Digit Code</label>
                                    <input
                                        type="text" placeholder="123456" maxLength={6}
                                        value={verificationCode}
                                        onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                        style={{ letterSpacing: '3px', textAlign: 'center', fontSize: '1.3rem', fontWeight: 800 }}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
                                <button type="button" className="cancel-btn" onClick={handleResendCode} disabled={resendingCode} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <RefreshCw size={13} className={resendingCode ? 'spin' : ''} /> Resend
                                </button>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button type="button" className="cancel-btn" onClick={() => setShowVerifyModal(false)}>Close</button>
                                    <button type="submit" className="save-btn" disabled={verifying}>
                                        {verifying ? 'Verifying…' : 'Verify'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <BillingModal
                isOpen={showBilling}
                onClose={() => setShowBilling(false)}
                onSuccess={(updatedUser) => {
                    setUserInfo(updatedUser);
                    window.dispatchEvent(new Event('storage'));
                }}
                initialTier={userInfo.subscriptionTier || 'pro'}
            />
        </div>
    );
};

export default ProfileView;
