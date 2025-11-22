import React, { useState, useRef, useEffect } from 'react';

function NarrationRecorder({ sessionId, existingNarration, onNarrationSaved }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [hasNarration, setHasNarration] = useState(!!existingNarration);
    const [audioURL, setAudioURL] = useState(existingNarration || null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState(null);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const audioRef = useRef(null);

    useEffect(() => {
        if (existingNarration) {
            setAudioURL(existingNarration);
            setHasNarration(true);
        }
    }, [existingNarration]);

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(audioBlob);
                setAudioURL(url);
                setHasNarration(true);

                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64Audio = reader.result;
                    if (onNarrationSaved) {
                        onNarrationSaved(base64Audio);
                    }
                };
                reader.readAsDataURL(audioBlob);

                stream.getTracks().forEach(track => track.stop());
                clearInterval(timerRef.current);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(time => time + 1);
            }, 1000);

        } catch (err) {
            console.error('Error accessing microphone:', err);
            setError('Cannot access microphone. Please allow microphone permissions.');
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            clearInterval(timerRef.current);
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            timerRef.current = setInterval(() => {
                setRecordingTime(time => time + 1);
            }, 1000);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);
        }
    };

    const deleteNarration = () => {
        if (confirm('Delete this narration recording?')) {
            setAudioURL(null);
            setHasNarration(false);
            setRecordingTime(0);
            if (onNarrationSaved) {
                onNarrationSaved(null);
            }
        }
    };

    const togglePlayback = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {error && (
                <div style={{
                    position: 'fixed',
                    top: '80px',
                    right: '20px',
                    padding: '10px 15px',
                    backgroundColor: '#4a1a1a',
                    border: '1px solid #a00',
                    borderRadius: '6px',
                    color: '#faa',
                    fontSize: '0.85rem',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}>
                    ⚠️ {error}
                </div>
            )}

            {!isRecording && !hasNarration && (
                <button
                    onClick={startRecording}
                    style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: '#c00',
                        border: 'none',
                        borderRadius: '50%',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(192,0,0,0.4)',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.1)';
                        e.target.style.boxShadow = '0 4px 12px rgba(192,0,0,0.6)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = '0 2px 8px rgba(192,0,0,0.4)';
                    }}
                    title="Start Narration Recording"
                >
                    🎙️
                </button>
            )}

            {isRecording && (
                <>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        backgroundColor: isPaused ? '#3a2a0a' : '#2a0a0a',
                        borderRadius: '20px',
                        border: `1px solid ${isPaused ? '#ffa500' : '#f00'}`
                    }}>
                        <span style={{
                            width: '6px',
                            height: '6px',
                            backgroundColor: isPaused ? '#ffa500' : '#f00',
                            borderRadius: '50%',
                            animation: isPaused ? 'none' : 'blink 1s infinite'
                        }}></span>
                        <span style={{ fontSize: '0.75rem', color: '#fff', fontFamily: 'monospace' }}>
                            {formatTime(recordingTime)}
                        </span>
                    </div>

                    {!isPaused ? (
                        <button
                            onClick={pauseRecording}
                            style={{
                                width: '32px',
                                height: '32px',
                                backgroundColor: '#555',
                                border: 'none',
                                borderRadius: '50%',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="Pause Recording"
                        >
                            ⏸
                        </button>
                    ) : (
                        <button
                            onClick={resumeRecording}
                            style={{
                                width: '32px',
                                height: '32px',
                                backgroundColor: '#0a5',
                                border: 'none',
                                borderRadius: '50%',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="Resume Recording"
                        >
                            ▶
                        </button>
                    )}
                    <button
                        onClick={stopRecording}
                        style={{
                            width: '32px',
                            height: '32px',
                            backgroundColor: '#333',
                            border: '1px solid #666',
                            borderRadius: '50%',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="Stop Recording"
                    >
                        ⏹
                    </button>
                </>
            )}

            {hasNarration && !isRecording && (
                <>
                    <button
                        onClick={togglePlayback}
                        style={{
                            width: '32px',
                            height: '32px',
                            backgroundColor: isPlaying ? '#555' : '#0a5',
                            border: 'none',
                            borderRadius: '50%',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title={isPlaying ? 'Pause Narration' : 'Play Narration'}
                    >
                        {isPlaying ? '⏸' : '▶'}
                    </button>
                    <button
                        onClick={startRecording}
                        style={{
                            width: '32px',
                            height: '32px',
                            backgroundColor: '#c00',
                            border: 'none',
                            borderRadius: '50%',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="Re-record"
                    >
                        🔄
                    </button>
                    <button
                        onClick={deleteNarration}
                        style={{
                            width: '32px',
                            height: '32px',
                            backgroundColor: '#a00',
                            border: 'none',
                            borderRadius: '50%',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="Delete Narration"
                    >
                        🗑
                    </button>
                </>
            )}

            {hasNarration && audioURL && (
                <audio
                    ref={audioRef}
                    src={audioURL}
                    onEnded={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    style={{ display: 'none' }}
                />
            )}

            <style>{`
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }
            `}</style>
        </div>
    );
}

export default NarrationRecorder;
