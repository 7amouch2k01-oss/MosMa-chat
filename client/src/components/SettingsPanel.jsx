import React, { useState, useEffect } from 'react';
import { X, Bell, Volume2, Shield, Eye, Palette, Moon, Sun, Monitor, Type, Layout, Activity, Crown, Zap, Star, Terminal, AlertTriangle, Database, Cpu, MemoryStick, Wifi, Users, BarChart2 } from 'lucide-react';
import './SettingsPanel.css';

const SettingsPanel = ({ settings, themes, currentTheme, onUpdateTheme, onUpdate, onClose, userInfo, onOpenAdmin }) => {
    const [localSettings, setLocalSettings] = useState(settings || {
        notifications: true,
        sounds: true,
        showOnline: true,
        browserPush: false,
        animations: true,
        compactMode: false,
        fontSize: 'medium'
    });
    const [globalEliteOverride, setGlobalEliteOverride] = useState(false);
    const [adminAlerts, setAdminAlerts] = useState(false);
    const [dbPruneAlerts, setDbPruneAlerts] = useState(false);

    // Simulated real-time diagnostics for Owner
    const [diagMetrics, setDiagMetrics] = useState({
        cpu: 22,
        ram: 580,
        tunnels: 14,
        activeSessions: 7
    });

    useEffect(() => {
        if (!userInfo?.isOwner) return;
        const interval = setInterval(() => {
            setDiagMetrics(prev => ({
                cpu: Math.min(95, Math.max(5, prev.cpu + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 4))),
                ram: Math.min(1024, Math.max(200, prev.ram + (Math.random() > 0.5 ? 10 : -10))),
                tunnels: Math.min(30, Math.max(1, prev.tunnels + (Math.random() > 0.7 ? 1 : Math.random() > 0.7 ? -1 : 0))),
                activeSessions: Math.min(50, Math.max(1, prev.activeSessions + (Math.random() > 0.6 ? 1 : Math.random() > 0.6 ? -1 : 0)))
            }));
        }, 3000);
        return () => clearInterval(interval);
    }, [userInfo?.isOwner]);

    const handleChange = (key, value) => {
        const updated = { ...localSettings, [key]: value };
        setLocalSettings(updated);
        onUpdate(updated);
        window.dispatchEvent(new Event('themeChanged'));
    };

    const tier = userInfo?.subscriptionTier || 'free';
    const tierLabel = { free: 'Free', pro: 'Pro', elite: 'Elite' }[tier] || 'Free';
    const tierColor = { free: '#6b7280', pro: '#818cf8', elite: '#eab308' }[tier] || '#6b7280';

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-panel" onClick={e => e.stopPropagation()}>
                <div className="settings-header">
                    <h3>Settings</h3>
                    <button className="settings-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="settings-body">

                    {/* ── ACCOUNT SECTION ───────────────────────────── */}
                    <section className="settings-section">
                        <div className="section-title"><Star size={14} /> Account</div>
                        <div className="account-info-card">
                            <div className="account-avatar" style={{ background: userInfo?.avatarColor || 'var(--accent)' }}>
                                {userInfo?.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="account-details">
                                <span className="account-username">{userInfo?.username || 'Guest'}</span>
                                <span className="account-email">{userInfo?.email || ''}</span>
                            </div>
                            <span className="account-tier-badge" style={{ background: `${tierColor}22`, border: `1px solid ${tierColor}55`, color: tierColor }}>
                                {tier === 'elite' ? <Crown size={11} /> : tier === 'pro' ? <Zap size={11} /> : <Star size={11} />}
                                {tierLabel}
                            </span>
                        </div>
                        {tier === 'free' && (
                            <div className="upgrade-banner">
                                <Zap size={14} />
                                <span>Upgrade to <strong>Pro</strong> or <strong>Elite</strong> to unlock premium features</span>
                            </div>
                        )}
                        {tier === 'pro' && (
                            <div className="upgrade-banner upgrade-elite">
                                <Crown size={14} />
                                <span>Upgrade to <strong>Elite</strong> for voice calls, higher limits & more</span>
                            </div>
                        )}
                        {tier === 'elite' && (
                            <div className="account-elite-status">
                                <Crown size={14} /> You're on the Elite plan — enjoy all premium features!
                            </div>
                        )}
                    </section>

                    {/* ── NOTIFICATIONS ─────────────────────────────── */}
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

                    {/* ── PRIVACY ───────────────────────────────────── */}
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

                    {/* ── APPEARANCE ───────────────────────────────── */}
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

                    {/* ── INTERFACE ────────────────────────────────── */}
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

                    {/* ── ADMIN PANEL (Admins & Owner only) ────────── */}
                    {(userInfo?.isAdmin || userInfo?.isOwner) && (
                        <section className="settings-section">
                            <div className="section-title admin-title"><Shield size={14} /> System Admin</div>
                            <div className="role-badge-row">
                                <span className="role-badge admin-role">
                                    <Shield size={11} /> {userInfo.isOwner ? 'Owner' : 'Admin'}
                                </span>
                                <span className="role-desc">You have elevated privileges</span>
                            </div>
                            <button className="admin-panel-btn" onClick={() => { onClose(); onOpenAdmin && onOpenAdmin(); }}>
                                <Shield size={16} /> Open Admin Dashboard
                            </button>
                            <div className="setting-row">
                                <div className="setting-info">
                                    <span className="setting-label">System Alert Simulation</span>
                                    <span className="setting-desc">Emit mock system-wide alerts to all users</span>
                                </div>
                                <label className="switch">
                                    <input type="checkbox" checked={adminAlerts} onChange={(e) => setAdminAlerts(e.target.checked)} />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                            <div className="setting-row">
                                <div className="setting-info">
                                    <span className="setting-label">DB Prune Alerts</span>
                                    <span className="setting-desc">Warn admins when database exceeds thresholds</span>
                                </div>
                                <label className="switch">
                                    <input type="checkbox" checked={dbPruneAlerts} onChange={(e) => setDbPruneAlerts(e.target.checked)} />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </section>
                    )}

                    {/* ── OWNER DIAGNOSTICS CONSOLE (Owner only) ──── */}
                    {userInfo?.isOwner && (
                        <section className="settings-section">
                            <div className="section-title owner-title"><Terminal size={14} /> Owner Diagnostics Console</div>
                            <div className="diag-console">
                                <div className="diag-metric">
                                    <div className="diag-icon cpu-icon"><Cpu size={16} /></div>
                                    <div className="diag-info">
                                        <span className="diag-label">CPU Usage</span>
                                        <div className="diag-bar-wrap">
                                            <div className="diag-bar" style={{ width: `${diagMetrics.cpu}%`, background: diagMetrics.cpu > 70 ? '#ef4444' : diagMetrics.cpu > 40 ? '#f97316' : '#10b981' }} />
                                        </div>
                                    </div>
                                    <span className="diag-value">{diagMetrics.cpu}%</span>
                                </div>
                                <div className="diag-metric">
                                    <div className="diag-icon ram-icon"><MemoryStick size={16} /></div>
                                    <div className="diag-info">
                                        <span className="diag-label">RAM</span>
                                        <div className="diag-bar-wrap">
                                            <div className="diag-bar" style={{ width: `${(diagMetrics.ram / 1024) * 100}%`, background: '#818cf8' }} />
                                        </div>
                                    </div>
                                    <span className="diag-value">{diagMetrics.ram} MB</span>
                                </div>
                                <div className="diag-metric">
                                    <div className="diag-icon tunnel-icon"><Wifi size={16} /></div>
                                    <div className="diag-info">
                                        <span className="diag-label">Active Socket Tunnels</span>
                                    </div>
                                    <span className="diag-value diag-pulse">{diagMetrics.tunnels}</span>
                                </div>
                                <div className="diag-metric">
                                    <div className="diag-icon session-icon"><Users size={16} /></div>
                                    <div className="diag-info">
                                        <span className="diag-label">Active Sessions</span>
                                    </div>
                                    <span className="diag-value">{diagMetrics.activeSessions}</span>
                                </div>
                            </div>
                            <div className="setting-row" style={{ marginTop: '8px' }}>
                                <div className="setting-info">
                                    <span className="setting-label">Global Elite Override</span>
                                    <span className="setting-desc">Simulate granting Elite features to all users</span>
                                </div>
                                <label className="switch">
                                    <input type="checkbox" checked={globalEliteOverride} onChange={(e) => setGlobalEliteOverride(e.target.checked)} />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                            {globalEliteOverride && (
                                <div className="owner-override-warning">
                                    <AlertTriangle size={13} /> Global Elite Override is active — all features simulated as unlocked
                                </div>
                            )}
                        </section>
                    )}
                </div>

                <div className="settings-footer">
                    <p className="app-version">MosMA Chat v1.2.0 • Premium Edition</p>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
