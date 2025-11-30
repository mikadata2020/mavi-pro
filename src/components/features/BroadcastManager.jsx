import React, { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';

function BroadcastManager({ onRemoteInteraction }) {
    const [peerId, setPeerId] = useState('');
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [connectedPeers, setConnectedPeers] = useState([]);
    const [error, setError] = useState(null);
    const peerRef = useRef(null);

    useEffect(() => {
        return () => {
            stopBroadcast();
        };
    }, []);

    const getVideoElement = () => {
        console.log('[BroadcastManager] Checking for video element...');

        // First try to get from global reference (set by VideoWorkspace)
        if (window.__motionVideoElement) {
            console.log('[BroadcastManager] Found video from global reference');
            return window.__motionVideoElement;
        }

        // Fallback: Find the video element in the DOM
        const videos = document.querySelectorAll('video');
        console.log('[BroadcastManager] Found', videos.length, 'video elements in DOM');

        if (videos.length > 0) {
            console.log('[BroadcastManager] Using first video element from DOM');
            return videos[0];
        }

        console.log('[BroadcastManager] No video element found');
        return null;
    };

    const startBroadcast = async () => {
        setError(null);

        try {
            // 1. Get Screen Share Stream
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "always",
                    frameRate: 30
                },
                audio: false
            });

            // Handle stream stop (user clicks "Stop Sharing" in browser UI)
            stream.getVideoTracks()[0].onended = () => {
                stopBroadcast();
            };

            // 2. Initialize PeerJS
            // Generate a random ID for the room (6 chars)
            const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();

            const peer = new Peer(randomId, {
                debug: 2
            });

            peer.on('open', (id) => {
                setPeerId(id);
                setIsBroadcasting(true);
                console.log('[BroadcastManager] Peer ID:', id);
            });

            peer.on('connection', (conn) => {
                console.log('[BroadcastManager] Incoming data connection:', conn.peer);
                setConnectedPeers(prev => [...prev, conn.peer]);

                // Handle incoming data (collaboration events)
                conn.on('data', (data) => {
                    console.log('[BroadcastManager] Received data:', data);
                    // TODO: Handle remote cursor, clicks, drawing
                    handleRemoteInteraction(data);
                });

                conn.on('close', () => {
                    setConnectedPeers(prev => prev.filter(p => p !== conn.peer));
                });
            });

            peer.on('call', (call) => {
                console.log('[BroadcastManager] Incoming call from:', call.peer);
                // Answer the call with the screen stream
                call.answer(stream);
            });

            peer.on('error', (err) => {
                console.error('[BroadcastManager] PeerJS error:', err);
                setError('Broadcast error: ' + err.type);
                if (err.type === 'unavailable-id') {
                    stopBroadcast();
                    setTimeout(startBroadcast, 1000);
                }
            });

            peerRef.current = peer;
            // Store stream ref to stop it later
            window.localStream = stream;

        } catch (err) {
            console.error('[BroadcastManager] Failed to start broadcast:', err);
            if (err.name === 'NotAllowedError') {
                setError('Screen sharing permission denied.');
            } else {
                setError(err.message);
            }
        }
    };

    const handleRemoteInteraction = (data) => {
        if (onRemoteInteraction) {
            onRemoteInteraction(data);
        }
    };

    const stopBroadcast = () => {
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
        setPeerId('');
        setIsBroadcasting(false);
        setConnectedPeers([]);
    };

    const copyLink = () => {
        const url = `${window.location.origin}/?watch=${peerId}`;
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
    };

    return (
        <div style={{
            backgroundColor: '#2d2d2d',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #444',
            color: 'white',
            marginTop: '10px'
        }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>📡 Live Broadcast</h3>

            {!isBroadcasting ? (
                <button
                    onClick={startBroadcast}
                    style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#0078d4',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Start Broadcast
                </button>
            ) : (
                <div>
                    <div style={{
                        padding: '10px',
                        backgroundColor: '#1e1e1e',
                        borderRadius: '4px',
                        marginBottom: '10px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '0.8rem', color: '#aaa' }}>ROOM ID</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '2px', color: '#00ff00' }}>
                            {peerId}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <button
                            onClick={copyLink}
                            style={{
                                flex: 1,
                                padding: '8px',
                                backgroundColor: '#444',
                                color: 'white',
                                border: '1px solid #666',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            📋 Copy Link
                        </button>
                        <button
                            onClick={stopBroadcast}
                            style={{
                                flex: 1,
                                padding: '8px',
                                backgroundColor: '#c50f1f',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            ⏹ Stop
                        </button>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                        👥 Connected Viewers: {connectedPeers.length}
                    </div>
                </div>
            )}

            {error && (
                <div style={{
                    marginTop: '10px',
                    color: '#ff6b6b',
                    fontSize: '0.8rem'
                }}>
                    ⚠️ {error}
                </div>
            )}
        </div>
    );
}

export default BroadcastManager;
