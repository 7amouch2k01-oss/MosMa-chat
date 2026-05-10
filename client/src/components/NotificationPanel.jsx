import React from 'react';
import { X, Bell, Trash2, Clock, CheckCircle, UserPlus, MessageCircle } from 'lucide-react';
import './NotificationPanel.css';

const NotificationPanel = ({ notifications, onClear, onRemove, onClose }) => {
    return (
        <div className="notification-overlay" onClick={onClose}>
            <div className="notification-panel" onClick={e => e.stopPropagation()}>
                <div className="notification-header">
                    <div className="title-area">
                        <Bell size={18} className="bell-icon" />
                        <h3>Notifications</h3>
                    </div>
                    <div className="header-actions">
                        {notifications.length > 0 && (
                            <button className="clear-all" onClick={onClear}>
                                <Trash2 size={14} /> Clear All
                            </button>
                        )}
                        <button className="close-panel" onClick={onClose}><X size={20} /></button>
                    </div>
                </div>

                <div className="notification-body">
                    {notifications.length === 0 ? (
                        <div className="empty-notifications">
                            <Bell size={48} className="empty-icon" />
                            <p>All caught up!</p>
                            <span>No new notifications at the moment.</span>
                        </div>
                    ) : (
                        <div className="notification-list">
                            {notifications.map(notif => (
                                <div key={notif.id} className={`notification-item type-${notif.type}`}>
                                    <div className="notif-icon">
                                        {notif.type === 'request' ? <UserPlus size={16} /> : 
                                         notif.type === 'dm' ? <MessageCircle size={16} /> : 
                                         <Bell size={16} />}
                                    </div>
                                    <div className="notif-content">
                                        <div className="notif-message">{notif.message}</div>
                                        <div className="notif-time">
                                            <Clock size={10} /> {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <button className="notif-remove" onClick={() => onRemove(notif.id)}>
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationPanel;
