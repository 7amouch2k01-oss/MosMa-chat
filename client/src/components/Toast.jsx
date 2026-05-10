import React, { useEffect, useState } from 'react';
import './Toast.css';

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 3500, action = null) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration, action }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, addToast, removeToast };
};

const ICONS = {
  info:    '💬',
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  join:    '👋',
  leave:   '🚪',
  online:  '🟢',
  request: '🤝'
};

const Toast = ({ id, message, type, duration, onRemove, action }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (type !== 'request') {
      const timer = setTimeout(() => {
        setExiting(true);
        setTimeout(() => onRemove(id), 350);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onRemove, type]);

  const handleManualRemove = () => {
    setExiting(true);
    setTimeout(() => onRemove(id), 350);
  };

  return (
    <div className={`toast toast-${type} ${exiting ? 'toast-exit' : 'toast-enter'}`}>
      <span className="toast-icon">{ICONS[type] || '💬'}</span>
      <div className="toast-content">
        <span className="toast-msg">{message}</span>
        {action && (
          <div className="toast-actions">
            {typeof action === 'function' ? action(id) : action}
          </div>
        )}
      </div>
      <button className="toast-close" onClick={handleManualRemove}>✕</button>
      {type !== 'request' && <div className="toast-progress" style={{ animationDuration: `${duration}ms` }} />}
    </div>
  );
};

export const ToastContainer = ({ toasts, removeToast }) => (
  <div className="toast-container">
    {toasts.map(t => (
      <Toast key={t.id} {...t} onRemove={removeToast} />
    ))}
  </div>
);

export default Toast;
