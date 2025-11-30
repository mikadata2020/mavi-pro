import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import Peer from 'peerjs';
import ChatBox from './ChatBox';

const BroadcastManager = forwardRef(({
    onRemoteInteraction,
    isBroadcasting,
    setIsBroadcasting,
    isMuted,
    setIsMuted,
    chatMessages,
    setChatMessages
}, ref) => {
    const [peerId, setPeerId] = useState('');
    const [connectedPeers, setConnectedPeers] = useState([]);
    const [error, setError] = useState(null);
    const peerRef = useRef(null);
    const viewerAudioRefs = useRef({});

    useImperativeHandle(ref, () => ({
        toggleMute,
        sendChatMessage,
        stopBroadcast
    }));

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
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "always",
                    frameRate: 30
                },
                audio: false
            });

            // 2. Get Microphone Audio Stream
            let audioStream;
            try {
                audioStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
                console.log('[BroadcastManager] Microphone audio captured');
            } catch (audioErr) {
                console.warn('[BroadcastManager] Microphone access denied or unavailable:', audioErr);
                // Continue without audio if permission denied
            }

            // 3. Combine video and audio tracks into one stream
            const combinedStream = new MediaStream();

            // Add video track from screen share
            screenStream.getVideoTracks().forEach(track => {
                combinedStream.addTrack(track);
            });

            // Add audio track from microphone if available
            if (audioStream) {
                audioStream.getAudioTracks().forEach(track => {
                    combinedStream.addTrack(track);
                });
            }

            // Handle stream stop (user clicks "Stop Sharing" in browser UI)
            screenStream.getVideoTracks()[0].onended = () => {
                stopBroadcast();
            };

            // 4. Initialize PeerJS
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

                // Handle incoming data (collaboration events + chat)
                conn.on('data', (data) => {
                    console.log('[BroadcastManager] Received data:', data);

                    if (data.type === 'chat') {
                        // Add chat message from viewer
                        setChatMessages(prev => [...prev, {
                            sender: `Viewer ${conn.peer.substring(0, 4)}`,
                            message: data.message,
                            timestamp: data.timestamp
                        }]);
                    } else {
                        // Handle other interactions (cursor, drawing, click)
                        handleRemoteInteraction(data);
                    }
                });

                conn.on('close', () => {
                    setConnectedPeers(prev => prev.filter(p => p !== conn.peer));
                });
            });

            peer.on('call', (call) => {
                console.log('[BroadcastManager] Incoming call from:', call.peer);

                // Answer the call with the combined stream (screen + mic)
                call.answer(combinedStream);

                // Listen for the viewer's audio stream
                call.on('stream', (viewerAudioStream) => {
                    console.log('[BroadcastManager] Received viewer audio stream');
                    playViewerAudio(viewerAudioStream, call.peer);
                });
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
            // Store streams to stop them later
            window.localStream = combinedStream;
            window.screenStream = screenStream;
            window.audioStream = audioStream;

        } catch (err) {
            console.error('[BroadcastManager] Failed to start broadcast:', err);
            if (err.name === 'NotAllowedError') {
                setError('Screen sharing permission denied.');
            } else {
                setError(err.message);
            }
        }
    };

    const playViewerAudio = (audioStream, peerId) => {
        // Create audio element for this viewer if it doesn't exist
        if (!viewerAudioRefs.current[peerId]) {
            const audio = new Audio();
            audio.srcObject = audioStream;
            audio.autoplay = true;
            viewerAudioRefs.current[peerId] = audio;
            console.log('[BroadcastManager] Playing audio from viewer:', peerId);
        }
    };

    const toggleMute = () => {
        if (window.audioStream) {
            const audioTracks = window.audioStream.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
            console.log('[BroadcastManager] Microphone', isMuted ? 'unmuted' : 'muted');
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

    const sendChatMessage = (message) => {
        if (!peerRef.current) return;

        const chatData = {
            type: 'chat',
            message,
            timestamp: Date.now()
        };

        // Add to local chat
        setChatMessages(prev => [...prev, {
            sender: 'Host',
            message,
            timestamp: chatData.timestamp
        }]);

        // Send to all connected viewers
        Object.values(peerRef.current.connections).forEach(conns => {
            conns.forEach(conn => {
                if (conn.open) {
                    conn.send(chatData);
                }
            });
        });
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
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            📋 Copy Link
                        </button>
                        <button
                            onClick={toggleMute}
                            style={{
                                flex: 1,
                                padding: '8px',
                                backgroundColor: isMuted ? '#c50f1f' : '#107c10',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            {isMuted ? '🔇 Unmute' : '🎤 Mute'}
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

            {/* Chat Box removed - using global BroadcastControls */}
        </div>
    );
});

export default BroadcastManager;
