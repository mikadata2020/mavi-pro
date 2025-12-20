import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import ChatBox from './ChatBox';

function BroadcastViewer({ roomId, onClose }) {
    const [status, setStatus] = useState('Connecting...');
    const [error, setError] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [isMuted, setIsMuted] = useState(true);
    const [drawingMode, setDrawingMode] = useState(false);
    const [tool, setTool] = useState('pen'); // pen, eraser, rect, arrow
    const [color, setColor] = useState('#FF0000');
    const [isPlaying, setIsPlaying] = useState(false);
    const [stats, setStats] = useState({ fps: 0, bitrate: 0 });

    const videoRef = useRef(null);
    const peerRef = useRef(null);
    const connRef = useRef(null);
    const localAudioStreamRef = useRef(null);
    const canvasRef = useRef(null);
    const isDrawing = useRef(false);
    const lastPoint = useRef(null);
    const startPoint = useRef(null);

    useEffect(() => {
        const joinBroadcast = async () => {
            try {
                const peer = new Peer({ debug: 2 });
                peerRef.current = peer;

                peer.on('open', (id) => {
                    setStatus('Joining room...');
                    const conn = peer.connect(roomId, {
                        metadata: { userName: `User_${id.substring(0, 4)}` }
                    });
                    connRef.current = conn;

                    conn.on('open', () => setStatus('Connected to Host'));
                    conn.on('data', (data) => {
                        if (data.type === 'text' || data.type === 'file') {
                            const newMsg = { ...data };
                            if (data.type === 'file' && data.file) {
                                newMsg.url = URL.createObjectURL(new Blob([data.file]));
                            }
                            setChatMessages(prev => [...prev, newMsg]);
                        }
                    });

                    // Request Mic for Two-Way Audio
                    navigator.mediaDevices.getUserMedia({ audio: true })
                        .then(stream => {
                            localAudioStreamRef.current = stream;
                            const call = peer.call(roomId, stream);
                            setupCall(call);
                        })
                        .catch(err => {
                            console.warn('Mic access denied, joining without audio', err);
                            const canvas = document.createElement('canvas');
                            const call = peer.call(roomId, canvas.captureStream(1));
                            setupCall(call);
                        });
                });

                peer.on('error', (err) => setError('Peer connection error: ' + err.type));
            } catch (err) {
                setError(err.message);
            }
        };

        let statsInterval;

        const setupCall = (call) => {
            call.on('stream', (remoteStream) => {
                setStatus('Receiving stream...');
                if (videoRef.current) {
                    videoRef.current.srcObject = remoteStream;
                    videoRef.current.play()
                        .then(() => setIsPlaying(true))
                        .catch(() => setStatus('Click "Join" to watch'));
                }

                // Monitor Stats
                const pc = call.peerConnection;
                if (statsInterval) clearInterval(statsInterval);
                statsInterval = setInterval(async () => {
                    if (!pc || pc.connectionState === 'closed') return;
                    try {
                        const stats = await pc.getStats();
                        stats.forEach(report => {
                            if (report.type === 'inbound-rtp' && report.kind === 'video') {
                                setStats({
                                    fps: Math.round(report.framesPerSecond || 0),
                                    bitrate: Math.round((report.bytesReceived * 8) / 2000) || 0 // bits to Kbps over ~2s
                                });
                            }
                        });
                    } catch (err) {
                        console.warn('Stats error:', err);
                    }
                }, 2000);
            });
        };

        if (roomId) joinBroadcast();
        return () => {
            peerRef.current?.destroy();
            if (statsInterval) clearInterval(statsInterval);
        };
    }, [roomId]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const handleResize = () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            };
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    const sendDrawData = (action, x, y) => {
        if (connRef.current?.open) {
            connRef.current.send({
                type: 'draw',
                action, x, y, tool, color,
                timestamp: Date.now()
            });
        }
    };

    const handleMouseDown = (e) => {
        if (!drawingMode) return;
        isDrawing.current = true;
        const rect = videoRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        startPoint.current = { x, y };
        lastPoint.current = { x, y };
        sendDrawData('start', x, y);
    };

    const handleMouseMove = (e) => {
        if (!videoRef.current) return;
        const rect = videoRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        // Send mouse position for cursor sync
        if (connRef.current?.open) {
            connRef.current.send({ type: 'cursor', x, y });
        }

        if (drawingMode && isDrawing.current) {
            const ctx = canvasRef.current.getContext('2d');
            const canvasRect = canvasRef.current.getBoundingClientRect();
            const curX = e.clientX - canvasRect.left;
            const curY = e.clientY - canvasRect.top;

            if (tool === 'pen' || tool === 'eraser') {
                ctx.beginPath();
                ctx.moveTo(lastPoint.current.x * canvasRect.width, lastPoint.current.y * canvasRect.height);
                ctx.lineTo(curX, curY);
                ctx.strokeStyle = tool === 'eraser' ? '#000' : color;
                ctx.lineWidth = tool === 'eraser' ? 20 : 3;
                ctx.stroke();
                sendDrawData('draw', x, y);
                lastPoint.current = { x, y };
            }
        }
    };

    const handleMouseUp = (e) => {
        if (!isDrawing.current) return;
        isDrawing.current = false;
        const rect = videoRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        sendDrawData('end', x, y);
    };

    const toggleMute = () => {
        if (localAudioStreamRef.current) {
            localAudioStreamRef.current.getAudioTracks().forEach(t => t.enabled = isMuted);
            setIsMuted(!isMuted);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative', flex: 1 }}>
                <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'contain' }} playsInline muted />
                <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: drawingMode ? 'auto' : 'none' }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} />

                {/* Status Overlays */}
                <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', gap: '10px' }}>
                    <div style={{ padding: '6px 12px', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '20px', color: 'white', fontSize: '0.8rem' }}>
                        {status}
                    </div>
                    {stats.fps > 0 && (
                        <div style={{ padding: '6px 12px', backgroundColor: 'rgba(16, 124, 16, 0.6)', borderRadius: '20px', color: 'white', fontSize: '0.8rem' }}>
                            🟢 {stats.fps} FPS | {stats.bitrate} KB/s
                        </div>
                    )}
                </div>

                <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: '10px' }}>
                    <button onClick={toggleMute} style={{ padding: '10px', backgroundColor: isMuted ? '#c50f1f' : '#107c10', border: 'none', borderRadius: '50%', cursor: 'pointer', color: 'white' }}>
                        {isMuted ? '🔇' : '🎤'}
                    </button>
                    <button onClick={onClose} style={{ padding: '10px 20px', backgroundColor: '#c50f1f', border: 'none', borderRadius: '4px', color: 'white', fontWeight: 'bold' }}>
                        Exit
                    </button>
                </div>

                {/* Toolbar */}
                <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '15px', padding: '10px', backgroundColor: 'rgba(30,30,30,0.9)', borderRadius: '12px', border: '1px solid #444' }}>
                    <button onClick={() => setDrawingMode(!drawingMode)} style={{ padding: '8px 15px', backgroundColor: drawingMode ? '#0078d4' : '#444', border: 'none', borderRadius: '4px', color: 'white' }}>
                        ✏️ Annotate
                    </button>
                    {drawingMode && (
                        <>
                            <select value={tool} onChange={(e) => setTool(e.target.value)} style={{ backgroundColor: '#2d2d2d', color: 'white', border: '1px solid #444', borderRadius: '4px' }}>
                                <option value="pen">Pen</option>
                                <option value="eraser">Eraser</option>
                                <option value="rect">Rectangle</option>
                                <option value="arrow">Arrow</option>
                            </select>
                            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: '30px', height: '30px', padding: 0, border: 'none' }} />
                        </>
                    )}
                </div>

                {!isPlaying && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                        <button onClick={() => { videoRef.current?.play(); setIsPlaying(true); }} style={{ padding: '20px 40px', fontSize: '1.2rem', backgroundColor: '#0078d4', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                            ▶ Join Broadcast
                        </button>
                    </div>
                )}
            </div>

            <ChatBox
                messages={chatMessages}
                onSendMessage={(data) => connRef.current?.send({
                    ...data,
                    timestamp: Date.now(),
                    sender: `Viewer ${peerRef.current?.id?.substring(0, 4) || '...'}`
                })}
                userName={`Viewer ${peerRef.current?.id?.substring(0, 4) || '...'}`}
            />
        </div>
    );
}

export default BroadcastViewer;
