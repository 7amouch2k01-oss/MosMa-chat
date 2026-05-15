import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, X, User } from 'lucide-react';
import './FriendRequest.css';

const BACKEND_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);
const API_URL = `${BACKEND_URL}/api`;

const FriendRequest = ({ userInfo, onToast, socket }) => {
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        fetchRequests();

        if (socket) {
            socket.on('receive_friend_request', (data) => {
                setRequests(prev => [data.request, ...prev]);
                onToast(`New friend request from ${data.request.requester.username}`, 'info');
            });
        }

        return () => {
            if (socket) socket.off('receive_friend_request');
        };
    }, [socket]);

    const fetchRequests = async () => {
        try {
            const token = userInfo?.token;
            const { data } = await axios.get(`${API_URL}/friends`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(data.filter(f => f.status === 'pending' && f.recipient._id === userInfo._id));
        } catch (err) {
            console.error(err);
        }
    };

    const handleAction = async (requestId, action, requester) => {
        try {
            const token = userInfo?.token;
            const endpoint = action === 'accept' ? 'accept' : 'decline';
            await axios.put(`${API_URL}/friends/${endpoint}/${requestId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (action === 'accept') {
                onToast(`You are now friends with ${requester.username}!`, 'success');
                socket?.emit('accept_friend_request', { requesterId: requester._id, recipient: userInfo });
            } else {
                onToast(`Request from ${requester.username} declined.`, 'info');
            }

            setRequests(prev => prev.filter(r => r._id !== requestId));
        } catch (err) {
            onToast('Action failed', 'error');
        }
    };

    if (requests.length === 0) return null;

    return (
        <div className="friend-requests-container">
            <p className="section-title">Pending Requests ({requests.length})</p>
            <div className="requests-stack">
                {requests.map(req => (
                    <div key={req._id} className="request-card">
                        <div className="request-user">
                            <div className="request-avatar">
                                <User size={14} />
                            </div>
                            <span className="request-name">{req.requester.username}</span>
                        </div>
                        <div className="request-actions">
                            <button 
                                className="req-btn accept" 
                                onClick={() => handleAction(req._id, 'accept', req.requester)}
                                title="Accept"
                            >
                                <Check size={14} />
                            </button>
                            <button 
                                className="req-btn decline" 
                                onClick={() => handleAction(req._id, 'decline', req.requester)}
                                title="Decline"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FriendRequest;
