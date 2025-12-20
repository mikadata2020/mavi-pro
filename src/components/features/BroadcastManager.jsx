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
    setChatMessages,
    isRecording,
    setIsRecording,
    isWebcamOn,
    setIsWebcamOn,
    connectedPeers,
    setConnectedPeers
}, ref) => {
    const [peerId, setPeerId] = useState('');
    const [error, setError] = useState(null);

    const peerRef = useRef(null);
    const viewerAudioRefs = useRef({});
    const recorderRef = useRef(null);
    const recordedChunks = useRef([]);
    const canvasMixerRef = useRef(null);
    const webcamStreamRef = useRef(null);

    useImperativeHandle(ref, () => ({
        toggleMute,
        sendChatMessage,
        stopBroadcast,
        toggleWebcam,
        startRecording,
        stopRecording,
        takeScreenshot,
        isRecording,
        isWebcamOn
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
            }

            // 3. Setup Canvas Mixer for Screen + Webcam Overlay
            const canvas = document.createElement('canvas');
            canvas.width = 1280; // Standard HD
            canvas.height = 720;
            canvasMixerRef.current = canvas;
            const ctx = canvas.getContext('2d');

            const screenVideo = document.createElement('video');
            screenVideo.srcObject = screenStream;
            screenVideo.play();

            const mixerInterval = setInterval(() => {
                if (!screenStream.active) {
                    clearInterval(mixerInterval);
                    return;
                }

                // Draw Screen
                ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);

                // Draw Webcam if active
                if (webcamStreamRef.current && webcamStreamRef.current.active) {
                    const webcamVideo = webcamStreamRef.current._videoElement;
                    const w = 240;
                    const h = 180;
                    const x = canvas.width - w - 20;
                    const y = canvas.height - h - 20;

                    // Draw border/shadow for webcam
                    ctx.fillStyle = 'rgba(0,0,0,0.5)';
                    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
                    ctx.drawImage(webcamVideo, x, y, w, h);
                }
            }, 1000 / 30); // 30 FPS

            const mixedStream = canvas.captureStream(30);

            // 4. Combine with Audio
            const combinedStream = new MediaStream();
            mixedStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));
            if (audioStream) {
                audioStream.getAudioTracks().forEach(track => combinedStream.addTrack(track));
            }

            // Handle stream stop
            screenStream.getVideoTracks()[0].onended = () => {
                stopBroadcast();
            };

            // 5. Initialize PeerJS
            const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
            const peer = new Peer(randomId, { debug: 2 });

            peer.on('open', (id) => {
                setPeerId(id);
                setIsBroadcasting(true);
            });

            peer.on('connection', (conn) => {
                setConnectedPeers(prev => [...prev, conn.peer]);
                conn.on('data', (data) => {
                    const { type, sender, timestamp } = data;
                    if (type === 'text' || type === 'file') {
                        const msg = {
                            ...data,
                            sender: sender || `Viewer ${conn.peer.substring(0, 4)}`,
                            timestamp: timestamp || Date.now()
                        };
                        if (type === 'file' && data.file) {
                            msg.url = URL.createObjectURL(new Blob([data.file]));
                        }
                        setChatMessages(prev => [...prev, msg]);
                    } else if (type === 'request_speak') {
                        // Request speak logic
                    } else {
                        onRemoteInteraction(data, conn.peer);
                    }
                });
                conn.on('close', () => {
                    setConnectedPeers(prev => prev.filter(p => p !== conn.peer));
                });
            });

            peer.on('call', (call) => {
                call.answer(combinedStream);
                call.on('stream', (remoteStream) => {
                    playViewerAudio(remoteStream, call.peer);
                });
            });

            peerRef.current = peer;
            window.localStream = combinedStream;
            window.screenStream = screenStream;
            window.audioStream = audioStream;

        } catch (err) {
            console.error('[BroadcastManager] Failed to start broadcast:', err);
            setError(err.message);
        }
    };

    const toggleWebcam = async () => {
        if (!isWebcamOn) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                const video = document.createElement('video');
                video.srcObject = stream;
                video.play();
                stream._videoElement = video; // Store for mixer
                webcamStreamRef.current = stream;
                setIsWebcamOn(true);
            } catch (err) {
                alert('Webcam access denied: ' + err.message);
            }
        } else {
            if (webcamStreamRef.current) {
                webcamStreamRef.current.getTracks().forEach(t => t.stop());
                webcamStreamRef.current = null;
            }
            setIsWebcamOn(false);
        }
    };

    const startRecording = () => {
        if (!window.localStream) return;
        recordedChunks.current = [];
        const recorder = new MediaRecorder(window.localStream, { mimeType: 'video/webm' });

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) recordedChunks.current.push(e.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `broadcast-recording-${Date.now()}.webm`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 100);
        };

        recorder.start();
        recorderRef.current = recorder;
        setIsRecording(true);
    };

    const stopRecording = () => {
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
            recorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const takeScreenshot = () => {
        if (!canvasMixerRef.current) return;
        const url = canvasMixerRef.current.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `broadcast-screenshot-${Date.now()}.png`;
        a.click();
    };

    const playViewerAudio = (audioStream, peerId) => {
        if (!viewerAudioRefs.current[peerId]) {
            const audio = new Audio();
            audio.srcObject = audioStream;
            audio.autoplay = true;
            viewerAudioRefs.current[peerId] = audio;
        }
    };

    const toggleMute = () => {
        if (window.audioStream) {
            const audioTracks = window.audioStream.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };



    const stopBroadcast = () => {
        if (isRecording) stopRecording();
        if (isWebcamOn) toggleWebcam();

        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
        if (window.screenStream) window.screenStream.getTracks().forEach(t => t.stop());
        if (window.audioStream) window.audioStream.getTracks().forEach(t => t.stop());

        setPeerId('');
        setIsBroadcasting(false);
        setConnectedPeers([]);
    };

    const copyLink = () => {
        const url = `${window.location.origin}/?watch=${peerId}`;
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
    };

    const sendChatMessage = (data) => {
        if (!peerRef.current) return;
        const chatData = {
            ...data,
            timestamp: Date.now(),
            sender: 'Host'
        };

        if (data.type === 'file') {
            chatData.url = URL.createObjectURL(data.file);
        }

        setChatMessages(prev => [...prev, chatData]);

        Object.values(peerRef.current.connections).forEach(conns => {
            conns.forEach(conn => {
                if (conn.open) conn.send(chatData);
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
