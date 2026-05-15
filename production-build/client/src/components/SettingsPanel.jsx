import React, { useState, useEffect } from 'react';
import { X, Bell, Volume2, Shield, Eye, Palette, Moon, Sun, Monitor, Type, Layout, Activity } from 'lucide-react';
import './SettingsPanel.css';

const SettingsPanel = ({ settings, themes, currentTheme, onUpdateTheme, onUpdate, onClose }) => {
    const [localSettings, setLocalSettings] = useState(settings || {
        notifications: true,
        sounds: true,
        showOnline: true,
        browserPush: false,
        animations: true,
        compactMode: false,
        fontSize: 'medium'
    });

    const handleChange = (key, value) => {
        const updated = { ...localSettings, [key]: value };
        setLocalSettings(updated);
        onUpdate(updated);
        // Notify other components (like ThemeLayout) to refresh settings
        window.dispatchEvent(new Event('themeChanged'));
    };

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-panel" onClick={e => e.stopPropagation()}>
                <div className="settings-header">
                    <h3>Settings</h3>
                    <button className="settings-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="settings-body">
                    <section className="settings-section">
                        <div className="section-title"><Bell size={14} /> Notifications</div>
                        <div className="setting-row">
                            <div className="setting-info">
                                <span className="setting-label">Enable Notifications</span>
                                <span className="setting-desc">Show toast alerts for new messages and requests</span>
                            </div>
                            <label className="switch">
                                <input 
                                    type="checkbox" 
                                    checked={localSettings.notifications} 
                                    onChange={(e) => handleChange('notifications', e.target.checked)} 
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        <div className="setting-row">
                            <div className="setting-info">
                                <span className="setting-label">Sound Effects</span>
                                <span className="setting-desc">Play a sound on new messages</span>
                            </div>
                            <label className="switch">
                                <input 
                                    type="checkbox" 
                                    checked={localSettings.sounds} 
                                    onChange={(e) => handleChange('sounds', e.target.checked)} 
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </section>

                    <section className="settings-section">
                        <div className="section-title"><Shield size={14} /> Privacy</div>
                        <div className="setting-row">
                            <div className="setting-info">
                                <span className="setting-label">Online Status</span>
                                <span className="setting-desc">Allow others to see when you are online</span>
                            </div>
                            <label className="switch">
                                <input 
                                    type="checkbox" 
                                    checked={localSettings.showOnline} 
                                    onChange={(e) => handleChange('showOnline', e.target.checked)} 
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>
                    </section>

                    <section className="settings-section">
                        <div className="section-title"><Palette size={14} /> Appearance</div>
                        <div className="theme-category-wrap">
                            <div className="theme-type-selector">
                                <button 
                                    className={`type-btn ${themes.dark.some(t => t.key === currentTheme) ? 'active' : ''}`}
                                    onClick={() => onUpdateTheme(themes.dark[0].key)}
                                >
                                    <Moon size={14} /> Dark Mode
                                </button>
                                <button 
                                    className={`type-btn ${themes.light.some(t => t.key === currentTheme) ? 'active' : ''}`}
                                    onClick={() => onUpdateTheme(themes.light[0].key)}
                                >
                                    <Sun size={14} /> Light Mode
                                </button>
                            </div>

                            <div className="theme-grid">
                                {(themes.dark.some(t => t.key === currentTheme) ? themes.dark : themes.light).map(t => (
                                    <button
                                        key={t.key}
                                        className={`theme-swatch ${currentTheme === t.key ? 'active' : ''}`}
                                        onClick={() => onUpdateTheme(t.key)}
                                        title={t.label}
                                    >
                                        <div className="swatch-preview" style={{ background: t.color }}></div>
                                        <span className="swatch-label">{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="settings-section">
                        <div className="section-title"><Layout size={14} /> Interface</div>
                        
                        <div className="setting-row">
                            <div className="setting-info">
                                <span className="setting-label">Animations</span>
                                <span className="setting-desc">Smooth background transitions and mesh motion</span>
                            </div>
                            <label className="switch">
                                <input 
                                    type="checkbox" 
                                    checked={localSettings.animations} 
                                    onChange={(e) => handleChange('animations', e.target.checked)} 
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        <div className="setting-row">
                            <div className="setting-info">
                                <span className="setting-label">Compact Mode</span>
                                <span className="setting-desc">Maximize screen space with reduced padding</span>
                            </div>
                            <label className="switch">
                                <input 
                                    type="checkbox" 
                                    checked={localSettings.compactMode} 
                                    onChange={(e) => handleChange('compactMode', e.target.checked)} 
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        <div className="setting-row">
                            <div className="setting-info">
                                <span className="setting-label">Font Size</span>
                                <span className="setting-desc">Adjust the overall text scale</span>
                            </div>
                            <div className="font-size-selector">
                                {['small', 'medium', 'large'].map(size => (
                                    <button 
                                        key={size}
                                        className={`size-btn ${localSettings.fontSize === size ? 'active' : ''}`}
                                        onClick={() => handleChange('fontSize', size)}
                                    >
                                        {size.charAt(0).toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>

                <div className="settings-footer">
                    <p className="app-version">MosMA Chat v1.2.0 • Premium Edition</p>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
