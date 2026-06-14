import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Pen, Eraser, Square, Circle, Minus, Type, Download, Trash2, Undo2, Redo2 } from 'lucide-react';
import './Whiteboard.css';

const COLORS = ['#ffffff', '#f87171', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#818cf8', '#e879f9', '#000000', '#64748b'];
const TOOLS  = [
    { key: 'pen',    label: 'Pen',     Icon: Pen      },
    { key: 'line',   label: 'Line',    Icon: Minus    },
    { key: 'rect',   label: 'Rect',    Icon: Square   },
    { key: 'circle', label: 'Circle',  Icon: Circle   },
    { key: 'eraser', label: 'Eraser',  Icon: Eraser   },
];

const Whiteboard = ({ roomId, roomName, socket, userInfo, onClose }) => {
    const canvasRef = useRef(null);
    const overlayCanvasRef = useRef(null);
    const [tool,       setTool]    = useState('pen');
    const [color,      setColor]   = useState('#ffffff');
    const [size,       setSize]    = useState(4);
    const [isDrawing,  setIsDrawing] = useState(false);
    const [showClear,  setShowClear] = useState(false);
    const [history,    setHistory]   = useState([]);  // stack of ImageData
    const [redo,       setRedo]      = useState([]);
    const [onlineCount, setOnlineCount] = useState(1);

    const startPt = useRef(null);
    const snapshotRef = useRef(null);  // canvas snapshot before shape draw

    // ── Helpers ──────────────────────────────────────────────────────────────
    const getCtx  = () => canvasRef.current?.getContext('2d');
    const getOCtx = () => overlayCanvasRef.current?.getContext('2d');

    const getPos = (e, canvas) => {
        const rect = canvas.getBoundingClientRect();
        const src  = e.touches?.[0] ?? e;
        return {
            x: (src.clientX - rect.left) * (canvas.width  / rect.width),
            y: (src.clientY - rect.top)  * (canvas.height / rect.height),
        };
    };

    const pushHistory = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = getCtx();
        setHistory(prev => [...prev.slice(-30), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
        setRedo([]);
    }, []);

    // ── Resize canvas to fill container ──────────────────────────────────────
    useEffect(() => {
        const canvas  = canvasRef.current;
        const overlay = overlayCanvasRef.current;
        if (!canvas || !overlay) return;
        const container = canvas.parentElement;

        const resize = () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            // Save current drawing
            const ctx = canvas.getContext('2d');
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            canvas.width  = overlay.width  = w;
            canvas.height = overlay.height = h;
            ctx.putImageData(imgData, 0, 0);
            // Re-apply background
            ctx.fillStyle = '#0a1628';
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(container);
        return () => ro.disconnect();
    }, []);

    // ── Socket: receive remote draws ─────────────────────────────────────────
    useEffect(() => {
        if (!socket) return;
        socket.emit('whiteboard_join', { roomId });

        socket.on('whiteboard_history', (strokes) => {
            const canvas = canvasRef.current;
            const ctx    = getCtx();
            if (!ctx || !canvas) return;
            strokes.forEach(s => replayStroke(ctx, s));
        });

        socket.on('whiteboard_draw', (stroke) => {
            const ctx = getCtx();
            if (ctx) replayStroke(ctx, stroke);
        });

        socket.on('whiteboard_clear', () => {
            const ctx = getCtx();
            const c   = canvasRef.current;
            if (ctx && c) ctx.clearRect(0, 0, c.width, c.height);
        });

        socket.on('whiteboard_users', (count) => setOnlineCount(count));

        return () => {
            socket.off('whiteboard_history');
            socket.off('whiteboard_draw');
            socket.off('whiteboard_clear');
            socket.off('whiteboard_users');
            socket.emit('whiteboard_leave', { roomId });
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket, roomId]);

    const replayStroke = (ctx, s) => {
        ctx.save();
        ctx.globalCompositeOperation = s.tool === 'eraser' ? 'destination-out' : 'source-over';
        ctx.strokeStyle = s.color;
        ctx.lineWidth   = s.size;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';

        if (s.tool === 'pen') {
            ctx.beginPath();
            s.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
            ctx.stroke();
        } else if (s.tool === 'line') {
            ctx.beginPath();
            ctx.moveTo(s.x1, s.y1);
            ctx.lineTo(s.x2, s.y2);
            ctx.stroke();
        } else if (s.tool === 'rect') {
            ctx.strokeRect(s.x1, s.y1, s.x2 - s.x1, s.y2 - s.y1);
        } else if (s.tool === 'circle') {
            const rx = Math.abs(s.x2 - s.x1) / 2;
            const ry = Math.abs(s.y2 - s.y1) / 2;
            ctx.beginPath();
            ctx.ellipse(s.x1 + (s.x2-s.x1)/2, s.y1 + (s.y2-s.y1)/2, rx, ry, 0, 0, Math.PI*2);
            ctx.stroke();
        } else if (s.tool === 'eraser') {
            ctx.beginPath();
            s.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
            ctx.lineWidth = s.size * 4;
            ctx.stroke();
        }
        ctx.restore();
    };

    // ── Drawing Event Handlers ────────────────────────────────────────────────
    const penPoints = useRef([]);

    const onPointerDown = (e) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        const pos = getPos(e, canvas);
        pushHistory();
        setIsDrawing(true);
        startPt.current = pos;

        if (tool === 'pen' || tool === 'eraser') {
            penPoints.current = [pos];
        } else {
            // snapshot for shape preview
            const ctx = getCtx();
            snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
        }
    };

    const onPointerMove = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        const pos = getPos(e, canvas);
        const ctx = getCtx();

        if (tool === 'pen' || tool === 'eraser') {
            penPoints.current.push(pos);
            ctx.save();
            ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
            ctx.strokeStyle = color;
            ctx.lineWidth   = tool === 'eraser' ? size * 4 : size;
            ctx.lineCap     = 'round';
            ctx.lineJoin    = 'round';
            ctx.beginPath();
            const pts = penPoints.current;
            if (pts.length > 1) {
                ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
                ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
                ctx.stroke();
            }
            ctx.restore();
        } else {
            // Shape preview on overlay
            const oCtx = getOCtx();
            const overlay = overlayCanvasRef.current;
            oCtx.clearRect(0, 0, overlay.width, overlay.height);
            oCtx.save();
            oCtx.strokeStyle = color;
            oCtx.lineWidth   = size;
            oCtx.lineCap     = 'round';
            oCtx.lineJoin    = 'round';
            const sp = startPt.current;
            if (tool === 'line') {
                oCtx.beginPath();
                oCtx.moveTo(sp.x, sp.y);
                oCtx.lineTo(pos.x, pos.y);
                oCtx.stroke();
            } else if (tool === 'rect') {
                oCtx.strokeRect(sp.x, sp.y, pos.x - sp.x, pos.y - sp.y);
            } else if (tool === 'circle') {
                const rx = Math.abs(pos.x - sp.x) / 2;
                const ry = Math.abs(pos.y - sp.y) / 2;
                oCtx.beginPath();
                oCtx.ellipse(sp.x + (pos.x-sp.x)/2, sp.y + (pos.y-sp.y)/2, rx, ry, 0, 0, Math.PI*2);
                oCtx.stroke();
            }
            oCtx.restore();
        }
    };

    const onPointerUp = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const pos = getPos(e, canvas);
        const ctx = getCtx();
        const sp  = startPt.current;
        setIsDrawing(false);

        let strokeData = null;

        if (tool === 'pen' || tool === 'eraser') {
            strokeData = { tool, color, size, points: penPoints.current };
            penPoints.current = [];
        } else {
            // Commit shape from overlay to main canvas
            const overlay = overlayCanvasRef.current;
            const oCtx    = getOCtx();
            // Draw from overlay onto main
            ctx.drawImage(overlay, 0, 0);
            oCtx.clearRect(0, 0, overlay.width, overlay.height);
            strokeData = { tool, color, size, x1: sp.x, y1: sp.y, x2: pos.x, y2: pos.y };
        }

        // Broadcast to room
        if (socket && strokeData) {
            socket.emit('whiteboard_draw', { roomId, stroke: strokeData });
        }
    };

    // ── Actions ───────────────────────────────────────────────────────────────
    const handleUndo = () => {
        if (history.length === 0) return;
        const ctx    = getCtx();
        const canvas = canvasRef.current;
        const last   = history[history.length - 1];
        setRedo(prev => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
        ctx.putImageData(last, 0, 0);
        setHistory(prev => prev.slice(0, -1));
    };

    const handleRedo = () => {
        if (redo.length === 0) return;
        const ctx    = getCtx();
        const canvas = canvasRef.current;
        const next   = redo[redo.length - 1];
        pushHistory();
        ctx.putImageData(next, 0, 0);
        setRedo(prev => prev.slice(0, -1));
    };

    const handleClear = () => {
        const ctx    = getCtx();
        const canvas = canvasRef.current;
        pushHistory();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (socket) socket.emit('whiteboard_clear', { roomId });
        setShowClear(false);
    };

    const handleDownload = () => {
        const canvas = canvasRef.current;
        const link   = document.createElement('a');
        link.download = `whiteboard-${roomName || 'room'}.png`;
        link.href     = canvas.toDataURL('image/png');
        link.click();
    };

    return (
        <div className="whiteboard-overlay" onClick={onClose}>
            <div className="whiteboard-modal" onClick={e => e.stopPropagation()}>
                {/* ── Header ── */}
                <div className="wb-header">
                    <h3>
                        🎨 Whiteboard
                        <span className="wb-room-badge">{roomName || 'Room'}</span>
                    </h3>
                    <div className="wb-header-actions">
                        <button className="wb-download-btn" onClick={handleDownload} title="Download PNG">
                            <Download size={14} /> Save PNG
                        </button>
                        <button className="wb-close-btn" onClick={onClose} title="Close">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* ── Toolbar ── */}
                <div className="wb-toolbar">
                    {/* Tools */}
                    <div className="wb-tool-group">
                        {TOOLS.map(t => (
                            <button
                                key={t.key}
                                className={`wb-tool-btn ${tool === t.key ? 'active' : ''}`}
                                onClick={() => setTool(t.key)}
                                title={t.label}
                            >
                                <t.Icon size={15} />
                            </button>
                        ))}
                    </div>

                    {/* Colors */}
                    <div className="wb-tool-group" style={{ gap: '6px' }}>
                        {COLORS.map(c => (
                            <button
                                key={c}
                                className={`wb-color-btn ${color === c ? 'active' : ''}`}
                                style={{ background: c }}
                                onClick={() => setColor(c)}
                                title={c}
                            />
                        ))}
                    </div>

                    {/* Size */}
                    <div className="wb-tool-group" style={{ gap: '8px' }}>
                        <span className="wb-size-label">{size}px</span>
                        <input
                            type="range"
                            className="wb-size-slider"
                            min={1} max={30}
                            value={size}
                            onChange={e => setSize(Number(e.target.value))}
                        />
                    </div>

                    {/* Undo / Redo */}
                    <div className="wb-tool-group">
                        <button className="wb-tool-btn" onClick={handleUndo} title="Undo" disabled={history.length === 0}>
                            <Undo2 size={15} />
                        </button>
                        <button className="wb-tool-btn" onClick={handleRedo} title="Redo" disabled={redo.length === 0}>
                            <Redo2 size={15} />
                        </button>
                    </div>

                    {/* Clear */}
                    <div className="wb-tool-group">
                        {showClear ? (
                            <div className="wb-clear-confirm">
                                <span>Clear all?</span>
                                <button className="wb-confirm-yes" onClick={handleClear}>Yes</button>
                                <button className="wb-confirm-no"  onClick={() => setShowClear(false)}>No</button>
                            </div>
                        ) : (
                            <button className="wb-tool-btn" onClick={() => setShowClear(true)} title="Clear Board">
                                <Trash2 size={15} />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Canvas ── */}
                <div className="wb-canvas-area">
                    <canvas
                        ref={canvasRef}
                        className={`wb-canvas tool-${tool}`}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerLeave={onPointerUp}
                    />
                    {/* Overlay for shape preview */}
                    <canvas
                        ref={overlayCanvasRef}
                        className="wb-canvas"
                        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
                    />

                    {/* Online users */}
                    <div className="wb-users-strip">
                        {[...Array(Math.min(onlineCount, 5))].map((_, i) => (
                            <div
                                key={i}
                                className="wb-user-dot"
                                style={{ background: COLORS[(i + 2) % COLORS.length] || '#6366f1' }}
                                title={`User ${i + 1}`}
                            >
                                {i === 0 ? (userInfo?.username?.[0]?.toUpperCase() || '?') : '•'}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="wb-footer">
                    <span>Tool: <strong style={{ color: '#a5b4fc' }}>{tool}</strong></span>
                    <span>Color: <strong style={{ color, textShadow: `0 0 6px ${color}` }}>■</strong></span>
                    <span>{onlineCount} user{onlineCount !== 1 ? 's' : ''} online</span>
                    <span>Undo stack: {history.length}</span>
                </div>
            </div>
        </div>
    );
};

export default Whiteboard;
