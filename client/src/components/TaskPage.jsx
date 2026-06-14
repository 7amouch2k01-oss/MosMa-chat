import React, { useState, useEffect } from 'react';
import TaskManager from './TaskManager';
import SettingsPanel from './SettingsPanel';
import { useNavigate } from 'react-router-dom';
import { Home, Settings, Loader2, MessageSquare, Globe } from 'lucide-react';
import BillingModal from './BillingModal';
import './TaskPage.css';

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

const TaskPage = () => {
    const navigate = useNavigate();
    const [showSettings, setShowSettings] = useState(false);
    const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('chatTheme') || 'theme-snow');
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('chatSettings');
        return saved ? JSON.parse(saved) : { notifications: true, animations: true };
    });
    const [userInfo, setUserInfo] = useState(() => readStoredUserInfo());
    const [showBilling, setShowBilling] = useState(false);

    useEffect(() => {
        if (!userInfo) navigate('/login', { replace: true });
    }, [userInfo, navigate]);

    if (!userInfo) {
        return (
            <div className={`task-page-container ${currentTheme}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <Loader2 size={36} className="task-boot-loader-icon" aria-label="Loading" />
            </div>
        );
    }

    const changeTheme = (theme) => {
        setCurrentTheme(theme);
        localStorage.setItem('chatTheme', theme);
        window.dispatchEvent(new Event('themeChanged'));
    };

    const isFreeTier = !userInfo?.subscriptionTier || userInfo.subscriptionTier === 'free';

    return (
        <div className={`task-page-container ${currentTheme}`}>
            <nav className="task-page-nav">
                <div className="nav-left">
                    <div className="task-logo" onClick={() => navigate('/')}>
                        <img src="/mosma_logo.png" alt="Logo" style={{width: '32px', height: '32px', objectFit: 'contain', borderRadius: '50%'}} />
                    </div>
                    <h1>Task Board</h1>
                </div>
                <div className="nav-right">
                    <button className="nav-btn" onClick={() => navigate('/feed')}>
                        <Globe size={18} /> Social Feed
                    </button>
                    <button className="nav-btn" onClick={() => navigate('/chat')}>
                        <MessageSquare size={18} /> Chat
                    </button>
                    <button className="nav-btn" onClick={() => setShowSettings(true)}>
                        <Settings size={18} /> Settings
                    </button>
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

            <div className="task-page-content">
                {isFreeTier ? (
                    <div className="task-locked-container">
                        <div className="lock-icon-container">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        </div>
                        <h2>Unlock Task Board</h2>
                        <p className="lock-subtitle">Collaborate on tasks, track progress, and organize your projects with interactive Kanban boards.</p>
                        <div className="lock-benefits-box">
                            <h3>Pro Features Included:</h3>
                            <ul className="lock-benefits-list">
                                <li><span className="lock-check">✓</span> Create, edit, and assign tasks</li>
                                <li><span className="lock-check">✓</span> Interactive drag & drop Kanban board</li>
                                <li><span className="lock-check">✓</span> Add descriptions, priority levels & tags</li>
                                <li><span className="lock-check">✓</span> Collaborative real-time updates</li>
                            </ul>
                        </div>
                        <button className="lock-upgrade-btn" onClick={() => setShowBilling(true)}>
                            Upgrade to Pro ($4.99/mo)
                        </button>
                    </div>
                ) : (
                    <TaskManager userInfo={userInfo} onClose={() => navigate('/chat')} isFullPage={true} />
                )}
            </div>

            <BillingModal 
                isOpen={showBilling} 
                onClose={() => setShowBilling(false)} 
                onSuccess={(updatedUser) => {
                    setUserInfo(updatedUser);
                    // Also dispatch an event so other tabs/components know userInfo changed
                    window.dispatchEvent(new Event('storage'));
                }}
                initialTier="pro"
            />
        </div>
    );
};

export default TaskPage;
