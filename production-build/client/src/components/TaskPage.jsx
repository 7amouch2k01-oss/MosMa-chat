import React, { useState, useEffect } from 'react';
import TaskManager from './TaskManager';
import SettingsPanel from './SettingsPanel';
import { useNavigate } from 'react-router-dom';
import { Home, Settings, Loader2, MessageSquare, Globe } from 'lucide-react';
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

    const userInfo = readStoredUserInfo();

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

    return (
        <div className={`task-page-container ${currentTheme}`}>
            <nav className="task-page-nav">
                <div className="nav-left">
                    <div className="task-logo" onClick={() => navigate('/')}>
                        <img src="/mosma_logo.png" alt="Logo" style={{width: '32px', height: '32px', objectFit: 'contain'}} />
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
                <TaskManager userInfo={userInfo} onClose={() => navigate('/chat')} isFullPage={true} />
            </div>
        </div>
    );
};

export default TaskPage;
