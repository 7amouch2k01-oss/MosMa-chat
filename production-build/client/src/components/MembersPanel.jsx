import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, X, UserPlus, MessageCircle, User as UserIcon } from 'lucide-react';
import './MembersPanel.css';

const BACKEND_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);
const API_URL = `${BACKEND_URL}/api`;

const MembersPanel = ({ room, userInfo, onClose, onStartDM, onToast, socket, onViewProfile }) => {
    const [members, setMembers] = useState([]);
    const [friends, setFriends] = useState([]);
    const [showAddList, setShowAddList] = useState(false);

    useEffect(() => {
        if (!room) return;
        const token = userInfo?.token;
        const headers = { Authorization: `Bearer ${token}` };
        axios.get(`${API_URL}/rooms/${room._id}`, { headers }).then(({ data }) => setMembers(data.users || []));
        axios.get(`${API_URL}/friends`, { headers }).then(({ data }) => setFriends(data));
    }, [room]);

    const isFriend = (id) => friends.some(f =>
        (f.requester._id === id || f.recipient._id === id) && f.status === 'accepted'
    );

    const handleAddMember = async (userId) => {
        try {
            const { data } = await axios.post(
                `${API_URL}/rooms/add-member`,
                { roomId: room._id, userId },
                { headers: { Authorization: `Bearer ${userInfo?.token}` } }
            );
            setMembers(data.users || []);
            onToast?.('Member added successfully!', 'success');
            setShowAddList(false);
            socket?.emit('send_message', {
                room: room._id,
                username: 'System',
                content: `${userInfo.username} added a new member to the group.`
            });
        } catch (err) {
            onToast?.('Failed to add member', 'error');
        }
    };

    const friendsNotInRoom = friends.filter(f => {
        const friendId = f.requester._id === userInfo?._id ? f.recipient._id : f.requester._id;
        return !members.some(m => m._id === friendId);
    });

    return (
        <div className="members-overlay" onClick={onClose}>
            <div className="members-panel" onClick={e => e.stopPropagation()}>
                <div className="members-header">
                    <h3><Users size={16} /> Members — {room?.name}</h3>
                    <div className="header-btns">
                        {room?.type === 'group' && (
                            <button className="icon-btn add-btn" title="Add Friend to Group" onClick={() => setShowAddList(!showAddList)}>
                                <UserPlus size={18} />
                            </button>
                        )}
                        <button className="icon-btn" onClick={onClose}><X size={18} /></button>
                    </div>
                </div>

                {showAddList && (
                    <div className="add-member-section">
                        <h4>Add Friends</h4>
                        {friendsNotInRoom.length === 0 ? (
                            <p className="no-friends">No friends to add</p>
                        ) : (
                            <div className="friends-to-add">
                                {friendsNotInRoom.map(f => {
                                    const friend = f.requester._id === userInfo?._id ? f.recipient : f.requester;
                                    return (
                                        <div key={friend._id} className="friend-add-row">
                                            <span>{friend.username}</span>
                                            <button onClick={() => handleAddMember(friend._id)}>Add</button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                <div className="members-count">{members.length} in room</div>
                <div className="members-list">
                    {members.map(member => {
                        const isMe = member._id === userInfo?._id;
                        const online = window.__onlineUsers?.has(member._id);
                        return (
                            <div key={member._id} className="member-card">
                                <div 
                                    className="member-avatar" 
                                    style={{ background: member.avatarColor || '#4F46E5', cursor: 'pointer' }}
                                    onClick={() => onViewProfile?.(member)}
                                >
                                    {member.profilePic ? (
                                        <img src={`${BACKEND_URL}${member.profilePic}`} alt="avatar" />
                                    ) : (
                                        member.username.charAt(0).toUpperCase()
                                    )}
                                    {online && <span className="online-badge" />}
                                </div>
                                <div className="member-info" style={{ cursor: 'pointer' }} onClick={() => onViewProfile?.(member)}>
                                    <span className="member-name">{member.username} {isMe && <em className="you-tag">(you)</em>}</span>
                                    <span className="member-status">{online ? '🟢 Online' : '⚫ Offline'}</span>
                                </div>
                                {!isMe && (
                                    <div className="member-actions">
                                        {!isMe && !isFriend(member._id) && (
                                            <button className="member-action-btn" title="Add Friend" onClick={async () => {
                                                try {
                                                    const { data } = await axios.post(`${API_URL}/friends/request`, { recipientId: member._id }, { headers: { Authorization: `Bearer ${userInfo?.token}` } });
                                                    socket?.emit('send_friend_request', { recipientId: member._id, request: data, requesterName: userInfo.username });
                                                    onToast?.(`Friend request sent to ${member.username}!`, 'success');
                                                } catch (err) { onToast?.('Failed', 'error'); }
                                            }}>
                                                <UserPlus size={14} />
                                            </button>
                                        )}
                                        <button className="member-action-btn dm-action-btn" title="Send DM" onClick={() => { onStartDM(member); onClose(); }}>
                                            <MessageCircle size={14} />
                                        </button>
                                        <button className="member-action-btn" title="View Profile" onClick={() => onViewProfile?.(member)}>
                                            <UserIcon size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MembersPanel;
