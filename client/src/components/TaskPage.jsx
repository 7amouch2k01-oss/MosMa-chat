import React, { useState } from 'react';
import TaskManager from './TaskManager';
import SettingsPanel from './SettingsPanel';
import { useNavigate } from 'react-router-dom';
import { Home, Settings } from 'lucide-react';
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

const TaskPage = () => {
    const navigate = useNavigate();
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const [showSettings, setShowSettings] = useState(false);
    const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('chatTheme') || 'theme-cosmic');
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('chatSettings');
        return saved ? JSON.parse(saved) : { notifications: true, animations: true };
    });

    const changeTheme = (theme) => {
        setCurrentTheme(theme);
        localStorage.setItem('chatTheme', theme);
        window.dispatchEvent(new Event('themeChanged'));
    };

    return (
        <div className="task-page-container">
            <div className="task-page-nav">
                <button className="back-home-btn" onClick={() => navigate('/chat')}>
                    <Home size={20} /> Back to Chat
                </button>
                <button className="back-home-btn" onClick={() => setShowSettings(true)}>
                    <Settings size={20} /> Settings
                </button>
            </div>

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
