import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, MessageCircle, UserPlus, Users, Search } from 'lucide-react';
import './FriendsList.css';

const BACKEND_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);
const API_URL = `${BACKEND_URL}/api`;

const FriendsList = ({ userInfo, onStartDM, socket, onlineUserIds }) => {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFriends();

        if (socket) {
            socket.on('friend_request_accepted', () => {
                fetchFriends();
            });
            socket.on('friend_removed', () => {
                fetchFriends();
            });
        }

        return () => {
            if (socket) {
                socket.off('friend_request_accepted');
                socket.off('friend_removed');
            }
        };
    }, [socket]);

    const fetchFriends = async () => {
        try {
            const token = userInfo?.token;
            const { data } = await axios.get(`${API_URL}/friends`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter only accepted friends
            const acceptedFriends = data.filter(f => f.status === 'accepted').map(f => {
                return f.requester._id === userInfo._id ? f.recipient : f.requester;
            });
            setFriends(acceptedFriends);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredFriends = friends.filter(f => 
        f.username.toLowerCase().includes((searchQuery || '').toLowerCase())
    );

    return (
        <div className="friends-list-container">
            <p className="section-title"><Users size={12} /> Friends</p>
            {loading ? (
                <p className="friends-hint">Loading friends...</p>
            ) : friends.length === 0 ? (
                <p className="friends-hint">No friends yet. Use search to find people!</p>
            ) : filteredFriends.length === 0 ? (
                <p className="friends-hint">No friends match your search.</p>
            ) : (
                <ul className="friends-list">
                    {filteredFriends.map(friend => {
                        const isOnline = onlineUserIds.has(friend._id);
                        return (
                            <li key={friend._id} className="friend-item" onClick={() => onStartDM(friend)}>
                                <div className="friend-avatar" style={{ background: friend.avatarColor || 'var(--primary)' }}>
                                    {friend.profilePic ? (
                                        <img src={`${BACKEND_URL}${friend.profilePic}`} alt="avatar" />
                                    ) : (
                                        friend.username.charAt(0).toUpperCase()
                                    )}
                                    {isOnline && <span className="online-indicator" />}
                                </div>
                                <div className="friend-info">
                                    <span className="friend-name">{friend.username}</span>
                                    <span className="friend-status">{isOnline ? 'Online' : 'Offline'}</span>
                                </div>
                                <button className="dm-icon-btn">
                                    <MessageCircle size={14} />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default FriendsList;
