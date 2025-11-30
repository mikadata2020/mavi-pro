import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';

function BroadcastViewer({ roomId, onClose }) {
    const [status, setStatus] = useState('Connecting...');
    const [error, setError] = useState(null);
    const videoRef = useRef(null);
    const peerRef = useRef(null);

    useEffect(() => {
        const connectToStream = () => {
            try {
                const peer = new Peer({
                    debug: 2
                });

                peer.on('open', (id) => {
                    console.log('[BroadcastViewer] Viewer Peer ID:', id);
                    setStatus('Connected to server. Joining room...');

                    // Connect to the host peer
                    const conn = peer.connect(roomId);

                    conn.on('open', () => {
                        console.log('[BroadcastViewer] Data connection open');
                        setStatus('Connected to Host. Waiting for stream...');
                    });

                    conn.on('error', (err) => {
                        console.error('[BroadcastViewer] Connection error:', err);
                        setError('Connection failed: ' + err);
                    });

                    // Initiate call to receive stream
                    // We send a dummy stream because PeerJS requires it for bidirectional calls,
                    // but we only care about receiving.
                    // Some browsers might need a valid stream, so we try to get one or use a canvas stream.
                    const canvas = document.createElement('canvas');
                    const dummyStream = canvas.captureStream(1);

                    console.log('[BroadcastViewer] Calling host:', roomId);
                    const call = peer.call(roomId, dummyStream);

                    call.on('stream', (remoteStream) => {
                        console.log('[BroadcastViewer] Stream received!', remoteStream);
                        setStatus('Stream received! Playing...');
                        if (videoRef.current) {
                            videoRef.current.srcObject = remoteStream;
                            videoRef.current.play().catch(e => {
                                console.error('[BroadcastViewer] Auto-play failed', e);
                                setStatus('Click play to watch');
                            });
                        }
                    });

                    call.on('error', (err) => {
                        console.error('[BroadcastViewer] Call error:', err);
                        setError('Call failed: ' + err.type);
                    });

                    call.on('close', () => {
                        console.log('[BroadcastViewer] Call closed');
                        setStatus('Stream ended by host.');
                    });
                });

                peer.on('error', (err) => {
                    console.error('[BroadcastViewer] Peer error:', err);
                    setError('Connection error: ' + err.type);
                });

                peerRef.current = peer;

            } catch (err) {
                console.error('[BroadcastViewer] Setup error:', err);
                setError(err.message);
            }
        };

        if (roomId) {
            connectToStream();
        }

        return () => {
            if (peerRef.current) {
                peerRef.current.destroy();
            }
        };
    }, [roomId]);

    const canvasRef = useRef(null);
    const isDrawing = useRef(false);
    const lastPoint = useRef(null);

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

    const sendDrawData = (type, x, y, color) => {
        const conn = peerRef.current?.connections[roomId]?.[0];
        if (conn && conn.open) {
            conn.send({
                type: 'draw',
                action: type,
                x,
                y,
                color,
                timestamp: Date.now()
            });
        }
    };

    const handleMouseDown = (e) => {
        if (!drawingMode) return;
        isDrawing.current = true;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        lastPoint.current = { x, y };
        sendDrawData('start', x, y, color);

        // Draw locally
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
    };

    const handleMouseMove = (e) => {
        if (!peerRef.current || !videoRef.current) return;

        const rect = videoRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        // Send cursor position
        const conn = peerRef.current.connections[roomId]?.[0];
        if (conn && conn.open) {
            conn.send({
                type: 'cursor',
                x,
                y,
                timestamp: Date.now()
            });
        }

        // Handle drawing
        if (drawingMode && isDrawing.current && canvasRef.current) {
            const canvasRect = canvasRef.current.getBoundingClientRect();
            const ctx = canvasRef.current.getContext('2d');

            ctx.lineTo(e.clientX - canvasRect.left, e.clientY - canvasRect.top);
            ctx.stroke();

            sendDrawData('draw', x, y, color);
            lastPoint.current = { x, y };
        }
    };

    const handleMouseUp = () => {
        if (isDrawing.current) {
            isDrawing.current = false;
            sendDrawData('end', 0, 0, color);
        }
    };

    const handleClick = (e) => {
        if (drawingMode) return; // Don't click if drawing
        if (!peerRef.current || !videoRef.current) return;

        const rect = videoRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        const conn = peerRef.current.connections[roomId]?.[0];
        if (conn && conn.open) {
            conn.send({
                type: 'click',
                x,
                y,
                timestamp: Date.now()
            });
        }
    };

    const [isPlaying, setIsPlaying] = useState(false);
    const [drawingMode, setDrawingMode] = useState(false);
    const [color, setColor] = useState('#FF0000');

    // ... (keep existing useEffect)

    const handlePlay = () => {
        if (videoRef.current) {
            videoRef.current.play()
                .then(() => {
                    setIsPlaying(true);
                    setStatus('Playing');
                })
                .catch(e => {
                    console.error('Play failed:', e);
                    setError('Playback failed: ' + e.message);
                });
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: '#000',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {error ? (
                <div style={{ color: '#ff6b6b', padding: '20px', textAlign: 'center' }}>
                    <h2>⚠️ Error</h2>
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.href = '/'}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            marginTop: '20px'
                        }}
                    >
                        Go Back
                    </button>
                </div>
            ) : (
                <>
                    <div
                        style={{ position: 'relative', width: '100%', height: '100%' }}
                        onMouseMove={handleMouseMove}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onClick={handleClick}
                    >
                        <video
                            ref={videoRef}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain'
                            }}
                            controls={false}
                            playsInline
                            muted
                            onPlay={() => setIsPlaying(true)}
                        />

                        {/* Play Overlay */}
                        {!isPlaying && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                zIndex: 10
                            }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePlay();
                                    }}
                                    style={{
                                        padding: '20px 40px',
                                        fontSize: '1.5rem',
                                        backgroundColor: '#0078d4',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    ▶ Click to Start Watching
                                </button>
                            </div>
                        )}

                        {/* Drawing Canvas */}
                        <canvas
                            ref={canvasRef}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: drawingMode ? 'auto' : 'none'
                            }}
                        />

                        {/* Drawing Tools */}
                        <div style={{
                            position: 'absolute',
                            bottom: '20px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            gap: '10px',
                            padding: '10px',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            borderRadius: '8px',
                            pointerEvents: 'auto',
                            zIndex: 20
                        }}>
                            <button
                                onClick={(e) => { e.stopPropagation(); setDrawingMode(!drawingMode); }}
                                style={{
                                    padding: '8px',
                                    backgroundColor: drawingMode ? '#0078d4' : '#444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                ✏️ Draw
                            </button>
                            {drawingMode && (
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ width: '40px', height: '30px', border: 'none', padding: 0 }}
                                />
                            )}
                        </div>
                    </div>

                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        left: '20px',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        padding: '10px',
                        borderRadius: '4px',
                        color: 'white',
                        pointerEvents: 'none',
                        zIndex: 20
                    }}>
                        {status}
                    </div>

                    <button
                        onClick={() => window.location.href = '/'}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            padding: '10px 20px',
                            backgroundColor: 'rgba(255, 0, 0, 0.7)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            zIndex: 10000
                        }}
                    >
                        Exit Viewer
                    </button>
                </>
            )
            }
        </div >
    );
}

export default BroadcastViewer;
