import React, { useState, useEffect, useRef } from 'react';
import VideoRecorder from '../../utils/videoRecorder';

function VideoRecorderComponent({ videoRef, videoSrc, isWebcamActive, onRecordingComplete }) {
    const [recorder] = useState(() => new VideoRecorder());
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState(null);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const [supportedFormats, setSupportedFormats] = useState([]);
    const [selectedFormat, setSelectedFormat] = useState('');
    const durationInterval = useRef(null);

    useEffect(() => {
        // Check supported formats
        const formats = VideoRecorder.getSupportedMimeTypes();
        setSupportedFormats(formats);
        if (formats.length > 0) {
            setSelectedFormat(formats[0].mimeType);
        }

        return () => {
            // Cleanup
            if (durationInterval.current) {
                clearInterval(durationInterval.current);
            }
        };
    }, []);

    const startDurationTimer = () => {
        durationInterval.current = setInterval(() => {
            setDuration(recorder.getRecordingDuration());
        }, 1000);
    };

    const stopDurationTimer = () => {
        if (durationInterval.current) {
            clearInterval(durationInterval.current);
            durationInterval.current = null;
        }
    };

    const handleStartRecording = async () => {
        if (!videoRef?.current || (!videoSrc && !isWebcamActive)) {
            setError('Tidak ada video untuk direkam');
            return;
        }

        setError(null);
        setRecordedBlob(null);

        try {
            await recorder.startRecording(videoRef.current, {
                mimeType: selectedFormat,
                videoBitsPerSecond: 2500000 // 2.5 Mbps
            });

            setIsRecording(true);
            setIsPaused(false);
            setDuration(0);
            startDurationTimer();
        } catch (err) {
            setError(err.message || 'Gagal memulai recording');
            console.error('Recording error:', err);
        }
    };

    // ... (rest of the functions remain the same)

    // ...

    return (
        <div style={{
            backgroundColor: 'rgba(26, 26, 26, 0.95)',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #444',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            marginBottom: '10px'
        }}>
            {/* ... (header remains the same) ... */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '10px'
            }}>
                <span style={{ fontSize: '1.2rem' }}>🎥</span>
                <h3 style={{
                    margin: 0,
                    color: 'white',
                    fontSize: '1rem',
                    flex: 1
                }}>
                    Video Recording
                </h3>
                {isRecording && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: isPaused ? '#ffa500' : '#ff0000',
                        fontSize: '0.85rem',
                        fontWeight: 'bold'
                    }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: isPaused ? '#ffa500' : '#ff0000',
                            animation: isPaused ? 'none' : 'blink 1s infinite'
                        }} />
                        {isPaused ? 'PAUSED' : 'REC'}
                    </div>
                )}
            </div>

            {!isRecording && !recordedBlob && (
                <>
                    {/* Format Selection */}
                    <div style={{ marginBottom: '10px' }}>
                        <label style={{
                            display: 'block',
                            color: '#aaa',
                            fontSize: '0.85rem',
                            marginBottom: '5px'
                        }}>
                            Format:
                        </label>
                        <select
                            value={selectedFormat}
                            onChange={(e) => setSelectedFormat(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                backgroundColor: '#333',
                                color: 'white',
                                border: '1px solid #555',
                                borderRadius: '4px',
                                fontSize: '0.9rem'
                            }}
                        >
                            {supportedFormats.map(format => (
                                <option key={format.mimeType} value={format.mimeType}>
                                    {format.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Start Recording Button */}
                    <button
                        onClick={handleStartRecording}
                        disabled={!videoSrc && !isWebcamActive}
                        style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: (videoSrc || isWebcamActive) ? '#c50f1f' : '#555',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.95rem',
                            fontWeight: 'bold',
                            cursor: (videoSrc || isWebcamActive) ? 'pointer' : 'not-allowed',
                            transition: 'background-color 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                            if (videoSrc || isWebcamActive) e.target.style.backgroundColor = '#a00f1a';
                        }}
                        onMouseLeave={(e) => {
                            if (videoSrc || isWebcamActive) e.target.style.backgroundColor = '#c50f1f';
                        }}
                    >
                        <span style={{ fontSize: '1.2rem' }}>⏺</span>
                        Start Recording
                    </button>

                    {!videoSrc && !isWebcamActive && (
                        <div style={{
                            marginTop: '10px',
                            padding: '8px',
                            backgroundColor: 'rgba(255, 165, 0, 0.1)',
                            border: '1px solid #ffa500',
                            borderRadius: '4px',
                            color: '#ffa500',
                            fontSize: '0.85rem'
                        }}>
                            ℹ️ Load video atau connect ke IP camera/Webcam terlebih dahulu
                        </div>
                    )}
                </>
            )}

            {isRecording && (
                <>
                    {/* Duration Display */}
                    <div style={{
                        padding: '15px',
                        backgroundColor: '#1a1a1a',
                        borderRadius: '4px',
                        marginBottom: '10px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            color: '#aaa',
                            fontSize: '0.75rem',
                            marginBottom: '5px'
                        }}>
                            Duration
                        </div>
                        <div style={{
                            color: isPaused ? '#ffa500' : '#ff0000',
                            fontSize: '1.8rem',
                            fontWeight: 'bold',
                            fontFamily: 'monospace'
                        }}>
                            {formatDuration(duration)}
                        </div>
                    </div>

                    {/* Recording Controls */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px'
                    }}>
                        {/* Pause/Resume Button */}
                        <button
                            onClick={isPaused ? handleResumeRecording : handlePauseRecording}
                            style={{
                                padding: '10px',
                                backgroundColor: '#ffa500',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.95rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#cc8400'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#ffa500'}
                        >
                            {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                        </button>

                        {/* Stop Button */}
                        <button
                            onClick={handleStopRecording}
                            style={{
                                padding: '10px',
                                backgroundColor: '#333',
                                color: 'white',
                                border: '1px solid #555',
                                borderRadius: '4px',
                                fontSize: '0.95rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#444'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#333'}
                        >
                            ⏹️ Stop
                        </button>
                    </div>
                </>
            )}

            {recordedBlob && (
                <>
                    {/* Recording Complete */}
                    <div style={{
                        padding: '10px',
                        backgroundColor: 'rgba(0, 255, 0, 0.1)',
                        border: '1px solid #0f0',
                        borderRadius: '4px',
                        marginBottom: '10px'
                    }}>
                        <div style={{ color: '#0f0', fontSize: '0.9rem', marginBottom: '5px' }}>
                            ✅ Recording Complete
                        </div>
                        <div style={{ color: '#aaa', fontSize: '0.85rem' }}>
                            Duration: {formatDuration(duration)}
                        </div>
                        <div style={{ color: '#aaa', fontSize: '0.85rem' }}>
                            Size: {(recordedBlob.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px'
                    }}>
                        <button
                            onClick={handleDownload}
                            style={{
                                padding: '10px',
                                backgroundColor: '#0078d4',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#005a9e'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#0078d4'}
                        >
                            💾 Download
                        </button>

                        <button
                            onClick={() => {
                                setRecordedBlob(null);
                                setDuration(0);
                            }}
                            style={{
                                padding: '10px',
                                backgroundColor: '#333',
                                color: 'white',
                                border: '1px solid #555',
                                borderRadius: '4px',
                                fontSize: '0.9rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#444'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#333'}
                        >
                            🔄 New Recording
                        </button>
                    </div>
                </>
            )}

            {/* Error Message */}
            {error && (
                <div style={{
                    marginTop: '10px',
                    padding: '8px',
                    backgroundColor: 'rgba(197, 15, 31, 0.2)',
                    border: '1px solid #c50f1f',
                    borderRadius: '4px',
                    color: '#ff6b6b',
                    fontSize: '0.85rem'
                }}>
                    ⚠️ {error}
                </div>
            )}

            <style>
                {`
                    @keyframes blink {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0; }
                    }
                `}
            </style>
        </div>
    );
}

export default VideoRecorderComponent;
