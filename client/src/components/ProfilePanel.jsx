import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Mail, Calendar, MessageSquare, Users } from 'lucide-react';
import './ProfilePanel.css';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${BACKEND_URL}/api`;

const AVATAR_COLORS = [
    '#4F46E5', '#7C3AED', '#DB2777', '#DC2626',
    '#D97706', '#16A34A', '#0891B2', '#EA580C',
    '#00D2FF', '#00FF96', '#FFD700', '#FF00FF',
    '#7F7F7F', '#1A1A1A', '#FF7F50', '#8A2BE2'
];

const ProfilePanel = ({ userInfo, targetUser, onClose }) => {
    // If targetUser is provided, we are viewing someone else. Otherwise, we view ourselves.
    const displayUser = targetUser || userInfo;
    const isOwnProfile = !targetUser || targetUser._id === userInfo?._id;

    const [avatarColor, setAvatarColor] = useState(displayUser?.avatarColor || AVATAR_COLORS[0]);
    const [stats, setStats] = useState({ messageCount: 0, friendCount: 0 });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (displayUser) {
            setAvatarColor(displayUser.avatarColor || AVATAR_COLORS[0]);
            fetchStats();
        }
    }, [displayUser]);

    const fetchStats = async () => {
        try {
            const token = userInfo?.token;
            const { data } = await axios.get(`${API_URL}/users/stats?userId=${displayUser._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(data);
        } catch (err) {
            console.error('Failed to fetch stats', err);
        }
    };

    const memberSince = displayUser?.createdAt
        ? new Date(displayUser.createdAt).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })
        : 'Unknown';

    const handleColorSave = async (color) => {
        if (!isOwnProfile) return;
        setAvatarColor(color);
        setSaving(true);
        try {
            const token = userInfo?.token;
            await axios.put(
                `${API_URL}/users/avatar`,
                { avatarColor: color },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Update local storage if it's our own profile
            const updated = { ...userInfo, avatarColor: color };
            localStorage.setItem('userInfo', JSON.stringify(updated));
        } catch (err) {
            console.error('Failed to save avatar color', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="profile-overlay" onClick={onClose}>
            <div className="profile-panel" onClick={e => e.stopPropagation()}>
                <div className="profile-header">
                    <h3>{isOwnProfile ? 'My Profile' : `${displayUser.username}'s Profile`}</h3>
                    <button className="profile-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="profile-body">
                    <div className="profile-avatar-section">
                        <div className="profile-avatar" style={{ background: avatarColor }}>
                            {displayUser?.username?.charAt(0).toUpperCase()}
                        </div>
                        <h2 className="profile-username">
                            {displayUser?.username}
                            <span className="profile-tag">#{displayUser?.tag || '0000'}</span>
                        </h2>
                        <p className="profile-email">{displayUser?.email}</p>
                    </div>

                    <div className="profile-stats-grid">
                        <div className="stat-card">
                            <MessageSquare size={20} className="stat-icon" />
                            <div className="stat-value">{stats.messageCount}</div>
                            <div className="stat-label">Messages</div>
                        </div>
                        <div className="stat-card">
                            <Users size={20} className="stat-icon" />
                            <div className="stat-value">{stats.friendCount}</div>
                            <div className="stat-label">Friends</div>
                        </div>
                    </div>

                    <div className="profile-info-list">
                        <div className="info-item">
                            <Calendar size={16} />
                            <span>Joined {memberSince}</span>
                        </div>
                    </div>

                    {isOwnProfile && (
                        <div className="profile-section">
                            <p className="profile-section-title">Avatar Theme Color</p>
                            <div className="color-grid">
                                {AVATAR_COLORS.map(color => (
                                    <button
                                        key={color}
                                        className={`color-swatch ${avatarColor === color ? 'selected' : ''}`}
                                        style={{ background: color }}
                                        onClick={() => handleColorSave(color)}
                                    />
                                ))}
                            </div>
                            {saving && <p className="saving-text">Updating color…</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePanel;
