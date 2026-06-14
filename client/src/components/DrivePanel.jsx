import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { X, HardDrive, FileImage, FileText, File, Loader2, ExternalLink, CloudOff } from 'lucide-react';
import './DrivePanel.css';

const BACKEND_URL = import.meta.env.PROD ? window.location.origin : `${window.location.protocol}//${window.location.hostname}:5000`;
const API_URL     = `${BACKEND_URL}/api`;

function fmtBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k    = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i    = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function fmtDate(dateStr) {
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function getFileIcon(type) {
    if (!type) return { cls: 'type-other', emoji: '📄' };
    if (type.startsWith('image/')) return { cls: 'type-image', emoji: '🖼️' };
    if (type === 'application/pdf')  return { cls: 'type-pdf',   emoji: '📕' };
    return { cls: 'type-other', emoji: '📄' };
}

const FILTERS = ['All', 'Images', 'Documents'];

const DrivePanel = ({ userInfo, onClose, onUpgrade }) => {
    const [driveData, setDriveData] = useState(null);
    const [loading,   setLoading]   = useState(true);
    const [filter,    setFilter]    = useState('All');
    const [error,     setError]     = useState('');

    const fetchDrive = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const { data } = await axios.get(`${API_URL}/users/drive`, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });
            setDriveData(data);
        } catch (err) {
            setError('Failed to load your drive. Please try again.');
            console.error('Drive fetch error', err);
        } finally {
            setLoading(false);
        }
    }, [userInfo]);

    useEffect(() => { fetchDrive(); }, [fetchDrive]);

    const files       = driveData?.files || [];
    const usedBytes   = driveData?.totalUsedBytes   || 0;
    const limitBytes  = driveData?.limitBytes        || 1;
    const tier        = driveData?.subscriptionTier  || userInfo.subscriptionTier || 'free';
    const pct         = Math.min((usedBytes / limitBytes) * 100, 100);

    const filteredFiles = files.filter(f => {
        if (filter === 'All')       return true;
        if (filter === 'Images')    return f.fileType?.startsWith('image/');
        if (filter === 'Documents') return !f.fileType?.startsWith('image/');
        return true;
    });

    const tierLimits = { free: '50 MB', pro: '1 GB', elite: '5 GB' };

    return (
        <div className="drive-overlay" onClick={onClose}>
            <div className="drive-panel" onClick={e => e.stopPropagation()}>

                {/* ── Header ── */}
                <div className="drive-header">
                    <div className="drive-header-top">
                        <h3>
                            <HardDrive size={18} style={{ color: '#818cf8' }} />
                            Cloud Drive
                            <span className={`drive-tier-badge ${tier}`}>{tier.toUpperCase()}</span>
                        </h3>
                        <button className="drive-close-btn" onClick={onClose} title="Close">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Storage bar */}
                    <div className="drive-storage-bar-wrap">
                        <div className="drive-storage-labels">
                            <span>Used: <strong>{fmtBytes(usedBytes)}</strong></span>
                            <span>Limit: <strong>{tierLimits[tier] || '50 MB'}</strong></span>
                        </div>
                        <div className="drive-storage-track">
                            <div
                                className={`drive-storage-fill tier-${tier} ${pct > 85 ? 'near-full' : ''}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                        <div className="drive-storage-labels">
                            <span style={{ color: pct > 85 ? '#f87171' : '#475569' }}>
                                {pct.toFixed(1)}% used
                            </span>
                            <span>{files.length} file{files.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </div>

                {/* ── Filter tabs ── */}
                <div className="drive-filter-tabs">
                    {FILTERS.map(f => (
                        <button
                            key={f}
                            className={`drive-filter-tab ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* ── Body ── */}
                <div className="drive-body">
                    {loading ? (
                        <div className="drive-loading">
                            <Loader2 size={20} className="spin" />
                            Loading your files…
                        </div>
                    ) : error ? (
                        <div className="drive-empty">
                            <CloudOff size={40} />
                            <p>{error}</p>
                            <button className="drive-upgrade-btn" onClick={fetchDrive}>Retry</button>
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className="drive-empty">
                            <HardDrive size={40} />
                            <p>
                                {filter === 'All'
                                    ? 'No files uploaded yet. Send images or PDFs in chat to see them here!'
                                    : `No ${filter.toLowerCase()} found in your drive.`}
                            </p>
                        </div>
                    ) : (
                        filteredFiles.map(f => {
                            const icon = getFileIcon(f.fileType);
                            return (
                                <a
                                    key={f.messageId}
                                    href={`${BACKEND_URL}${f.fileUrl}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="drive-file-card"
                                    title="Open file"
                                >
                                    <div className={`drive-file-icon ${icon.cls}`}>
                                        {icon.emoji}
                                    </div>
                                    <div className="drive-file-info">
                                        <h4>{f.fileName || 'Unnamed file'}</h4>
                                        <div className="drive-file-meta">
                                            <span>{fmtDate(f.createdAt)}</span>
                                            {f.sizeBytes > 0 && <span>{fmtBytes(f.sizeBytes)}</span>}
                                        </div>
                                    </div>
                                    <ExternalLink size={14} style={{ color: '#475569', flexShrink: 0 }} />
                                </a>
                            );
                        })
                    )}
                </div>

                {/* ── Upgrade prompt for free tier ── */}
                {tier === 'free' && !loading && (
                    <div className="drive-upgrade-prompt">
                        <p>⚡ Upgrade to <strong>Pro</strong> for 1 GB or <strong>Elite</strong> for 5 GB of cloud storage.</p>
                        <button className="drive-upgrade-btn" onClick={() => { onUpgrade?.('pro'); onClose(); }}>
                            Upgrade Plan
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DrivePanel;
