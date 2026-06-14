import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, UserPlus, MessageCircle, X, Check, User as UserIcon } from 'lucide-react';
import './UserSearch.css';

const BACKEND_URL = import.meta.env.PROD ? window.location.origin : `${window.location.protocol}//${window.location.hostname}:5000`;
const API_URL = `${BACKEND_URL}/api`;

const UserSearch = ({ userInfo, onClose, onStartDM, socket, onToast, onViewProfile }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [friends, setFriends] = useState([]);

    useEffect(() => {
        fetchFriends();
    }, []);

    const fetchFriends = async () => {
        try {
            const token = userInfo?.token;
            const { data } = await axios.get(`${API_URL}/friends`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFriends(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setLoading(false);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const token = userInfo?.token;
                const { data } = await axios.get(`${API_URL}/users/search?q=${query}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setResults(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [query, userInfo?.token]);

    const handleSearch = (e) => setQuery(e.target.value);

    const getFriendship = (userId) => {
        if (!friends || !Array.isArray(friends)) return null;
        return friends.find(f =>
            (f.requester && f.requester._id === userId) ||
            (f.recipient && f.recipient._id === userId)
        );
    };

    const handleAddFriend = async (user) => {
        try {
            const token = userInfo?.token;
            const { data } = await axios.post(
                `${API_URL}/friends/request`,
                { recipientId: user._id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (socket) {
                socket.emit('send_friend_request', {
                    recipientId: user._id,
                    request: data,
                    requesterName: userInfo.username
                });
            }
            onToast(`Friend request sent to ${user.username}!`, 'success');
            fetchFriends();
        } catch (err) {
            onToast(err.response?.data?.message || 'Failed to send request', 'error');
        }
    };

    const handleAcceptRequest = async (friendship) => {
        try {
            const token = userInfo?.token;
            await axios.put(`${API_URL}/friends/accept/${friendship._id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (socket) {
                socket.emit('accept_friend_request', { 
                    requesterId: friendship.requester._id,
                    recipient: userInfo 
                });
            }
            onToast(`You are now friends with ${friendship.requester.username}!`, 'success');
            fetchFriends();
        } catch (err) {
            onToast('Failed to accept request', 'error');
        }
    };

    const handleDeclineRequest = async (friendship) => {
        try {
            const token = userInfo?.token;
            await axios.put(`${API_URL}/friends/decline/${friendship._id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onToast(`Declined request from ${friendship.requester.username}`, 'info');
            fetchFriends();
        } catch (err) {
            onToast('Failed to decline request', 'error');
        }
    };

    return (
        <div className="user-search-overlay" onClick={onClose}>
            <div className="user-search-panel" onClick={e => e.stopPropagation()}>
                <div className="user-search-header">
                    <h3><Search size={16} /> Discover Users</h3>
                    <button className="icon-btn" onClick={onClose}><X size={18} /></button>
                </div>

                <div className="user-search-input-wrap">
                    <Search size={15} className="search-icon-inside" />
                    <input
                        autoFocus
                        type="text"
                        placeholder="Search by username..."
                        value={query}
                        onChange={handleSearch}
                        className="user-search-input"
                    />
                </div>

                <div className="user-search-results">
                    {loading && <p className="search-hint">Searching…</p>}
                    {!loading && query && results.length === 0 && (
                        <p className="search-hint">No users found for "{query}"</p>
                    )}
                    {!loading && !query && (
                        <p className="search-hint">Type a username to find people</p>
                    )}
                    {results.map(user => {
                        const online = window.__onlineUsers?.has(user._id);
                        const friendship = getFriendship(user._id);
                        const isAccepted = friendship?.status === 'accepted';
                        const isPending = friendship?.status === 'pending';
                        const sentByMe = friendship?.requester?._id === userInfo?._id;

                        return (
                            <div key={user._id} className="user-result-card">
                                <div
                                    className="user-result-avatar"
                                    style={{ background: user.avatarColor || '#4F46E5', cursor: 'pointer' }}
                                    onClick={() => onViewProfile(user)}
                                    title="View Profile"
                                >
                                    {user.username.charAt(0).toUpperCase()}
                                    {online && <span className="online-badge" />}
                                </div>
                                <div className="user-result-info" onClick={() => onViewProfile(user)} style={{ cursor: 'pointer' }}>
                                    <span className="user-result-name" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {user.username}
                                        {user.subscriptionTier === 'pro' && <span className="badge badge-pro" style={{ fontSize: '0.55rem', fontWeight: 800, padding: '1px 4px', borderRadius: '3px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.35)', color: '#818cf8', display: 'inline-block' }}>PRO</span>}
                                        {user.subscriptionTier === 'elite' && <span className="badge badge-elite" style={{ fontSize: '0.55rem', fontWeight: 800, padding: '1px 4px', borderRadius: '3px', background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.35)', color: '#eab308', display: 'inline-block' }}>ELITE</span>}
                                        {user.isOwner && <span className="badge badge-owner" style={{ fontSize: '0.55rem', fontWeight: 800, padding: '1px 4px', borderRadius: '3px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#f87171', display: 'inline-block' }}>OWNER</span>}
                                    </span>
                                    <span className="user-result-status">
                                        {online ? '🟢 Online' : '⚫ Offline'}
                                    </span>
                                </div>
                                <div className="user-result-actions">
                                    {/* Expose DM button for all search results (except current user themselves) */}
                                    {user._id !== userInfo?._id && (
                                        <button className="action-btn dm-btn" onClick={() => onStartDM(user)} title="Message User">
                                            <MessageCircle size={14} /> DM
                                        </button>
                                    )}

                                    {user._id !== userInfo?._id && (
                                        isAccepted ? (
                                            <span className="friend-badge" style={{ color: '#818cf8', fontSize: '0.75rem', fontWeight: 600, padding: '4px 6px' }}>✓ Friend</span>
                                        ) : isPending ? (
                                            sentByMe ? (
                                                <span className="pending-badge">Sent</span>
                                            ) : (
                                                <div className="pending-actions">
                                                    <button className="action-btn accept-btn" onClick={() => handleAcceptRequest(friendship)} title="Accept">
                                                        <Check size={14} />
                                                    </button>
                                                    <button className="action-btn decline-btn" onClick={() => handleDeclineRequest(friendship)} title="Decline">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            )
                                        ) : (
                                            <button className="action-btn add-btn" onClick={() => handleAddFriend(user)}>
                                                <UserPlus size={14} /> Add
                                            </button>
                                        )
                                    )}
                                    <button className="action-btn profile-btn" onClick={() => onViewProfile(user)} title="View Profile">
                                        <UserIcon size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default UserSearch;
