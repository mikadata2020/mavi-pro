import React, { useState, useRef, useEffect, useCallback } from 'react';
import ElementEditor from './ElementEditor';
import PlaybackControls from './features/PlaybackControls';
import TimelineMeasurement from './features/TimelineMeasurement';
import TimelineEditor from './features/TimelineEditor';
import VideoAnnotation from './features/VideoAnnotation';
import IPCameraConnect from './features/IPCameraConnect';
import VideoRecorder from './features/VideoRecorder';
import WebcamCapture from './features/WebcamCapture';
import ProjectButtons from './ProjectButtons';
import CycleDetectionPanel from './features/CycleDetectionPanel';
import VoiceCommandPanel from './features/VoiceCommandPanel';
import ErgonomicAnalysis from './ErgonomicAnalysis';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { captureScreenshot, exportAnalysisData } from '../utils/screenshotCapture';

function VideoWorkspace({
    measurements,
    onUpdateMeasurements,
    videoSrc,
    onVideoChange,
    videoName,
    onVideoNameChange,
    currentProject,
    onNewProject,
    onOpenProject,
    onExportProject,
    onImportProject,
    onLogout
}) {
    const fileInputRef = useRef(null);
    const [logoUrl, setLogoUrl] = useState(null);
    const [logoPosition, setLogoPosition] = useState('bottom-right');
    const [logoOpacity, setLogoOpacity] = useState(0.7);
    const [leftPanelWidth, setLeftPanelWidth] = useState(35); // Initial width in percentage
    const [drawingAnnotations, setDrawingAnnotations] = useState([]);
    const [showAnnotationTool, setShowAnnotationTool] = useState(false);
    const [fullScreenMode, setFullScreenMode] = useState('none'); // 'none', 'video', 'editor'

    // Drawing State
    const [currentTool, setCurrentTool] = useState('pen'); // pen, line, arrow, rectangle, circle, text, eraser
    const [drawColor, setDrawColor] = useState('#ff0000');
    const [lineWidth, setLineWidth] = useState(3);

    // IP Camera & Recording State
    const [videoSourceType, setVideoSourceType] = useState('file'); // 'file', 'stream', 'webcam'
    const [showCameraPanel, setShowCameraPanel] = useState(false);
    const [showRecorderPanel, setShowRecorderPanel] = useState(false);
    const [showWebcamPanel, setShowWebcamPanel] = useState(false);
    const [isStreamConnected, setIsStreamConnected] = useState(false);
    const [isWebcamActive, setIsWebcamActive] = useState(false);
    const [isMJPEG, setIsMJPEG] = useState(false);
    const [showCycleDetection, setShowCycleDetection] = useState(false);
    const [showVoiceCommand, setShowVoiceCommand] = useState(false);
    const [showErgonomicAnalysis, setShowErgonomicAnalysis] = useState(false);

    const containerRef = useRef(null);
    const videoContainerRef = useRef(null);
    const isResizing = useRef(false);

    // Use video player hook
    const {
        videoRef,
        videoState,
        togglePlay,
        setPlaybackSpeed,
        nextFrame,
        previousFrame,
        seekTo,
        setZoom,
        addMeasurement,
        removeMeasurement,
        updateMeasurements,
        toggleReverse,
        handleTimeUpdate,
        handleLoadedMetadata
    } = useVideoPlayer(measurements);

    // Store video ref globally for broadcast feature
    // Update continuously, not just on mount
    useEffect(() => {
        const updateGlobalRef = () => {
            if (videoRef.current) {
                window.__motionVideoElement = videoRef.current;
                console.log('[VideoWorkspace] Updated global video reference');
            }
        };

        // Update immediately
        updateGlobalRef();

        // Also update on an interval to catch late initialization
        const interval = setInterval(updateGlobalRef, 1000);

        return () => {
            clearInterval(interval);
            window.__motionVideoElement = null;
            console.log('[VideoWorkspace] Cleared global video reference');
        };
    }, [videoRef, videoSrc, isWebcamActive, isStreamConnected]);

    const startResizing = useCallback(() => {
        isResizing.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const stopResizing = useCallback(() => {
        isResizing.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, []);

    const handleMouseMove = useCallback((e) => {
        if (!isResizing.current || !containerRef.current) return;
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
        if (newWidth > 15 && newWidth < 85) { // Min/Max constraints
            setLeftPanelWidth(newWidth);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [handleMouseMove, stopResizing]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            onVideoChange(url);
            onVideoNameChange(file.name);
        }
    };

    const handleScreenshot = () => {
        captureScreenshot(videoRef.current, videoState.measurements, logoUrl, logoPosition, logoOpacity);
    };

    const handleExportData = () => {
        const videoName = videoSrc ? videoSrc.split('/').pop().split('.')[0] : 'Untitled';
        exportAnalysisData(videoState.measurements, videoName);
    };


    // Handle seek from timeline
    useEffect(() => {
        const handleSeek = (e) => {
            seekTo(e.detail);
        };
        window.addEventListener('seek', handleSeek);
        return () => window.removeEventListener('seek', handleSeek);
    }, [seekTo]);

    // Sync measurements with parent
    useEffect(() => {
        onUpdateMeasurements(videoState.measurements);
    }, [videoState.measurements, onUpdateMeasurements]);

    // Handle logo upload from header
    useEffect(() => {
        const input = document.getElementById('header-logo-upload');
        const handleLogoChange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const url = URL.createObjectURL(file);
                setLogoUrl(url);
            }
        };

        if (input) {
            input.addEventListener('change', handleLogoChange);
            return () => input.removeEventListener('change', handleLogoChange);
        }
    }, []);

    // Handle screenshot from header
    useEffect(() => {
        const handleScreenshotEvent = () => {
            if (videoRef.current && videoSrc) {
                handleScreenshot();
            }
        };
        window.addEventListener('screenshot', handleScreenshotEvent);
        return () => window.removeEventListener('screenshot', handleScreenshotEvent);
    }, [videoRef, videoSrc, logoUrl, logoPosition, logoOpacity, videoState.measurements]);

    // Handle export from header
    useEffect(() => {
        const handleExportEvent = () => {
            if (videoState.measurements.length > 0) {
                handleExportData();
            }
        };
        window.addEventListener('export-json', handleExportEvent);
        return () => window.removeEventListener('export-json', handleExportEvent);
    }, [videoState.measurements, videoSrc]);

    const getLogoStyle = () => {
        const base = {
            position: 'absolute',
            opacity: logoOpacity,
            width: '100px',
            height: 'auto',
            zIndex: 5,
            pointerEvents: 'none'
        };

        switch (logoPosition) {
            case 'top-left':
                return { ...base, top: '10px', left: '10px' };
            case 'top-right':
                return { ...base, top: '10px', right: '10px' };
            case 'bottom-left':
                return { ...base, bottom: '60px', left: '10px' };
            case 'bottom-right':
            default:
                return { ...base, bottom: '60px', right: '10px' };
        }
    };

    const tools = [
        { id: 'pen', icon: '✏️', label: 'Pen' },
        { id: 'line', icon: '📏', label: 'Line' },
        { id: 'arrow', icon: '➡️', label: 'Arrow' },
        { id: 'rectangle', icon: '⬜', label: 'Rectangle' },
        { id: 'circle', icon: '⭕', label: 'Circle' },
        { id: 'text', icon: '📝', label: 'Text' }
    ];

    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff', '#000000'];

    return (
        <div ref={containerRef} style={{ flex: 2, display: 'flex', minHeight: '0', position: 'relative' }}>
            {/* Video Player Section */}
            <div style={{
                width: fullScreenMode === 'video' ? '100%' : fullScreenMode === 'editor' ? '0%' : `${leftPanelWidth}%`,
                display: fullScreenMode === 'editor' ? 'none' : 'flex',
                flexDirection: 'column',
                backgroundColor: '#000',
                position: 'relative'
            }}>
                <div ref={videoContainerRef} style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    {/* Video element - always rendered for webcam/stream support */}
                    <div style={{
                        transform: `scale(${videoState.zoom})`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.2s',
                        position: 'relative',
                        display: (videoSrc || isWebcamActive || isStreamConnected) ? 'block' : 'none'
                    }}>
                        <video
                            ref={videoRef}
                            src={isMJPEG ? '' : videoSrc}
                            onTimeUpdate={handleTimeUpdate}
                            onLoadedMetadata={handleLoadedMetadata}
                            crossOrigin={videoSourceType === 'stream' ? null : "anonymous"}
                            style={{
                                width: '100%',
                                maxHeight: '100%',
                                display: isMJPEG ? 'none' : 'block'
                            }}
                        />

                        {/* MJPEG Stream Fallback */}
                        {isMJPEG && (
                            <img
                                src={videoSrc}
                                alt="MJPEG Stream"
                                style={{
                                    width: '100%',
                                    maxHeight: '100%',
                                    display: 'block',
                                    objectFit: 'contain'
                                }}
                            />
                        )}

                        {/* Video Annotation Overlay */}
                        {showAnnotationTool && (
                            <VideoAnnotation
                                videoRef={videoRef}
                                videoState={videoState}
                                annotations={drawingAnnotations}
                                onUpdateAnnotations={setDrawingAnnotations}
                                currentTool={currentTool}
                                drawColor={drawColor}
                                lineWidth={lineWidth}
                            />
                        )}
                    </div>

                    {/* Placeholder when no video */}
                    {!videoSrc && !isWebcamActive && !isStreamConnected && (
                        <div style={{ color: '#666', textAlign: 'center' }}>
                            <p>Upload video atau gunakan IP Camera/Webcam</p>
                            <button
                                className="btn"
                                onClick={() => fileInputRef.current.click()}
                            >
                                Upload Video
                            </button>
                        </div>
                    )}
                    <input
                        type="file"
                        accept="video/*"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />

                    {/* Zoom Level Indicator */}
                    {videoSrc && videoState.zoom !== 1 && (
                        <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            fontSize: '0.85rem'
                        }}>
                            Zoom: {videoState.zoom}x
                        </div>
                    )}

                    {/* Playback Mode Indicator */}
                    {videoSrc && videoState.isReverse && (
                        <div style={{
                            position: 'absolute',
                            top: '10px',
                            left: '10px',
                            backgroundColor: 'rgba(255,0,0,0.7)',
                            color: 'white',
                            padding: '5px 10px',
                            borderRadius: '4px',
                            fontSize: '0.85rem'
                        }}>
                            ◀ REVERSE MODE
                        </div>
                    )}

                    {/* Logout Button - Top Left */}
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            style={{
                                position: 'absolute',
                                top: '10px',
                                left: '10px',
                                zIndex: 100,
                                backgroundColor: '#c50f1f',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px',
                                cursor: 'pointer',
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '35px',
                                height: '35px',
                                boxShadow: '0 2px 8px rgba(197, 15, 31, 0.3)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#a00f1a';
                                e.target.style.transform = 'scale(1.1)';
                                e.target.style.boxShadow = '0 4px 12px rgba(197, 15, 31, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#c50f1f';
                                e.target.style.transform = 'scale(1)';
                                e.target.style.boxShadow = '0 2px 8px rgba(197, 15, 31, 0.3)';
                            }}
                            title="Logout dari aplikasi"
                        >
                            🔒
                        </button>
                    )}

                    {/* Annotation Toggle Button */}
                    {videoSrc && (
                        <button
                            onClick={() => setShowAnnotationTool(!showAnnotationTool)}
                            style={{
                                position: 'absolute',
                                top: '10px',
                                left: onLogout ? '55px' : '10px',
                                zIndex: 100,
                                backgroundColor: showAnnotationTool ? '#005a9e' : '#333',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px',
                                cursor: 'pointer',
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '35px',
                                height: '35px',
                                boxShadow: showAnnotationTool ? '0 2px 8px rgba(0, 90, 158, 0.5)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.1)';
                                e.target.style.boxShadow = showAnnotationTool ? '0 4px 12px rgba(0, 90, 158, 0.6)' : '0 4px 12px rgba(0, 0, 0, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.boxShadow = showAnnotationTool ? '0 2px 8px rgba(0, 90, 158, 0.5)' : '0 2px 8px rgba(0, 0, 0, 0.3)';
                            }}
                            title={showAnnotationTool ? "Hide Drawing Tools" : "Show Drawing Tools"}
                        >
                            🎨
                        </button>
                    )}

                    {/* IP Camera Toggle Button */}
                    <button
                        onClick={() => setShowCameraPanel(!showCameraPanel)}
                        style={{
                            position: 'absolute',
                            top: '10px',
                            left: videoSrc ? (onLogout ? '100px' : '55px') : (onLogout ? '55px' : '10px'),
                            zIndex: 100,
                            backgroundColor: showCameraPanel ? '#c50f1f' : '#333',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px',
                            cursor: 'pointer',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '35px',
                            height: '35px',
                            boxShadow: showCameraPanel ? '0 2px 8px rgba(197, 15, 31, 0.5)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'scale(1.1)';
                            e.target.style.boxShadow = showCameraPanel ? '0 4px 12px rgba(197, 15, 31, 0.6)' : '0 4px 12px rgba(0, 0, 0, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.boxShadow = showCameraPanel ? '0 2px 8px rgba(197, 15, 31, 0.5)' : '0 2px 8px rgba(0, 0, 0, 0.3)';
                        }}
                        title={showCameraPanel ? "Hide Camera Panel" : "Show Camera Panel"}
                    >
                        📹
                    </button>

                    {/* Recording Toggle Button */}
                    <button
                        onClick={() => setShowRecorderPanel(!showRecorderPanel)}
                        style={{
                            position: 'absolute',
                            top: '10px',
                            left: videoSrc ? (onLogout ? '145px' : '100px') : (onLogout ? '100px' : '55px'),
                            zIndex: 100,
                            backgroundColor: showRecorderPanel ? '#c50f1f' : '#333',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px',
                            cursor: 'pointer',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '35px',
                            height: '35px',
                            boxShadow: showRecorderPanel ? '0 2px 8px rgba(197, 15, 31, 0.5)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'scale(1.1)';
                            e.target.style.boxShadow = showRecorderPanel ? '0 4px 12px rgba(197, 15, 31, 0.6)' : '0 4px 12px rgba(0, 0, 0, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.boxShadow = showRecorderPanel ? '0 2px 8px rgba(197, 15, 31, 0.5)' : '0 2px 8px rgba(0, 0, 0, 0.3)';
                        }}
                        title={showRecorderPanel ? "Hide Recorder Panel" : "Show Recorder Panel"}
                    >
                        🎥
                    </button>

                    {/* Webcam Toggle Button */}
                    <button
                        onClick={() => setShowWebcamPanel(!showWebcamPanel)}
                        style={{
                            position: 'absolute',
                            top: '10px',
                            left: videoSrc ? (onLogout ? '190px' : '145px') : (onLogout ? '145px' : '100px'),
                            zIndex: 100,
                            backgroundColor: showWebcamPanel ? '#0078d4' : '#333',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px',
                            cursor: 'pointer',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '35px',
                            height: '35px',
                            boxShadow: showWebcamPanel ? '0 2px 8px rgba(0, 120, 212, 0.5)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'scale(1.1)';
                            e.target.style.boxShadow = showWebcamPanel ? '0 4px 12px rgba(0, 120, 212, 0.6)' : '0 4px 12px rgba(0, 0, 0, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'scale(1)';
                            e.target.style.boxShadow = showWebcamPanel ? '0 2px 8px rgba(0, 120, 212, 0.5)' : '0 2px 8px rgba(0, 0, 0, 0.3)';
                        }}
                        title={showWebcamPanel ? "Hide Webcam Panel" : "Show Webcam Panel"}
                    >
                        📷
                    </button>

                    {/* Auto-Cycle Detection Button */}
                    {videoSrc && (
                        <button
                            onClick={() => setShowCycleDetection(true)}
                            style={{
                                position: 'absolute',
                                top: '10px',
                                left: onLogout ? '235px' : '190px',
                                zIndex: 100,
                                backgroundColor: '#0a5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px',
                                cursor: 'pointer',
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '35px',
                                height: '35px',
                                boxShadow: '0 2px 8px rgba(0, 170, 85, 0.5)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.1)';
                                e.target.style.boxShadow = '0 4px 12px rgba(0, 170, 85, 0.6)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.boxShadow = '0 2px 8px rgba(0, 170, 85, 0.5)';
                            }}
                            title="Auto-Cycle Detection"
                        >
                            ⏱️
                        </button>
                    )}

                    {/* Voice Command Button */}
                    {videoSrc && (
                        <button
                            onClick={() => setShowVoiceCommand(true)}
                            style={{
                                position: 'absolute',
                                top: '10px',
                                left: onLogout ? '280px' : '235px',
                                zIndex: 100,
                                backgroundColor: '#8B00FF',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px',
                                cursor: 'pointer',
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '35px',
                                height: '35px',
                                boxShadow: '0 2px 8px rgba(139, 0, 255, 0.5)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.1)';
                                e.target.style.boxShadow = '0 4px 12px rgba(139, 0, 255, 0.6)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.boxShadow = '0 2px 8px rgba(139, 0, 255, 0.5)';
                            }}
                            title="Voice Command"
                        >
                            🎤
                        </button>
                    )}

                    {/* Ergonomic Analysis Button */}
                    {videoSrc && (
                        <button
                            onClick={() => setShowErgonomicAnalysis(true)}
                            style={{
                                position: 'absolute',
                                top: '10px',
                                left: onLogout ? '325px' : '280px',
                                zIndex: 100,
                                backgroundColor: '#0078d4',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px',
                                cursor: 'pointer',
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '35px',
                                height: '35px',
                                boxShadow: '0 2px 8px rgba(0, 120, 212, 0.5)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.1)';
                                e.target.style.boxShadow = '0 4px 12px rgba(0, 120, 212, 0.6)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.boxShadow = '0 2px 8px rgba(0, 120, 212, 0.5)';
                            }}
                            title="Ergonomic Analysis (RULA/REBA)"
                        >
                            🧘‍♂️
                        </button>
                    )}

                    {/* Full Screen Video Button */}
                    {videoSrc && (
                        <button
                            onClick={() => setFullScreenMode(fullScreenMode === 'video' ? 'none' : 'video')}
                            style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                zIndex: 100,
                                backgroundColor: fullScreenMode === 'video' ? '#005a9e' : '#333',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px',
                                cursor: 'pointer',
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '35px',
                                height: '35px',
                                boxShadow: fullScreenMode === 'video' ? '0 2px 8px rgba(0, 90, 158, 0.5)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.1)';
                                e.target.style.boxShadow = fullScreenMode === 'video' ? '0 4px 12px rgba(0, 90, 158, 0.6)' : '0 4px 12px rgba(0, 0, 0, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.boxShadow = fullScreenMode === 'video' ? '0 2px 8px rgba(0, 90, 158, 0.5)' : '0 2px 8px rgba(0, 0, 0, 0.3)';
                            }}
                            title={fullScreenMode === 'video' ? "Exit Full Screen" : "Full Screen Video"}
                        >
                            {fullScreenMode === 'video' ? '⛶' : '⛶'}
                        </button>
                    )}

                    {/* Logo Overlay */}
                    {videoSrc && logoUrl && (
                        <img
                            src={logoUrl}
                            alt="Logo"
                            style={getLogoStyle()}
                        />
                    )}

                    {/* Project Management Buttons */}
                    <ProjectButtons
                        currentProject={currentProject}
                        onNewProject={onNewProject}
                        onOpenProject={onOpenProject}
                        onExportProject={onExportProject}
                        onImportProject={onImportProject}
                    />
                </div>

                {/* Timeline Editor */}
                {videoSrc && (
                    <TimelineEditor
                        videoState={videoState}
                        measurements={videoState.measurements}
                        onSeek={seekTo}
                        onAddMeasurement={addMeasurement}
                        onUpdateMeasurements={updateMeasurements}
                    />
                )}

                {/* Playback Controls */}
                {videoSrc && (
                    <PlaybackControls
                        videoState={videoState}
                        onTogglePlay={togglePlay}
                        onSetSpeed={setPlaybackSpeed}
                        onNextFrame={nextFrame}
                        onPreviousFrame={previousFrame}
                        onSetZoom={setZoom}
                        onToggleReverse={toggleReverse}
                    />
                )}
            </div>

            {/* Drawing Toolbar - Rendered OUTSIDE the video container to avoid scaling and z-index issues */}
            {showAnnotationTool && (
                <div style={{
                    position: 'absolute',
                    top: '60px', // Below the top buttons
                    left: '10px',
                    backgroundColor: 'rgba(26, 26, 26, 0.95)',
                    padding: '10px',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    zIndex: 1000, // Very high z-index
                    border: '1px solid #444',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    width: '40px', // Compact vertical toolbar
                    alignItems: 'center'
                }}>
                    {/* Tools */}
                    {tools.map(tool => (
                        <button
                            key={tool.id}
                            onClick={() => setCurrentTool(tool.id)}
                            style={{
                                padding: '6px',
                                backgroundColor: currentTool === tool.id ? '#005a9e' : 'transparent',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '1.2rem',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                            }}
                            title={tool.label}
                        >
                            {tool.icon}
                        </button>
                    ))}

                    <div style={{ width: '100%', height: '1px', backgroundColor: '#444', margin: '4px 0' }} />

                    {/* Colors - Compact Color Picker */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {colors.slice(0, 5).map(color => ( // Show first 5 colors
                            <button
                                key={color}
                                onClick={() => setDrawColor(color)}
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    backgroundColor: color,
                                    border: drawColor === color ? '2px solid white' : '1px solid #666',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    padding: 0
                                }}
                            />
                        ))}
                    </div>

                    <div style={{ width: '100%', height: '1px', backgroundColor: '#444', margin: '4px 0' }} />

                    {/* Line Width */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                        <span style={{ color: '#aaa', fontSize: '0.6rem' }}>Size</span>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={lineWidth}
                            onChange={(e) => setLineWidth(parseInt(e.target.value))}
                            style={{ width: '60px', transform: 'rotate(-90deg)', margin: '20px 0' }}
                        />
                    </div>

                    <div style={{ width: '100%', height: '1px', backgroundColor: '#444', margin: '4px 0' }} />

                    {/* Clear Action */}
                    <button
                        onClick={() => setDrawingAnnotations([])}
                        style={{
                            padding: '6px',
                            backgroundColor: 'transparent',
                            color: '#c50f1f',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="Clear All Drawings"
                    >
                        🗑️
                    </button>
                </div>
            )}

            {/* Resizer Handle - Hidden in full screen mode */}
            {fullScreenMode === 'none' && (
                <div
                    onMouseDown={startResizing}
                    style={{
                        width: '12px',
                        background: '#1a1a1a',
                        cursor: 'col-resize',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                        borderLeft: '1px solid #333',
                        borderRight: '1px solid #333',
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = '#333'}
                    onMouseLeave={(e) => e.target.style.background = '#1a1a1a'}
                    title="Drag to resize"
                >
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px'
                    }}>
                        <div style={{ width: '4px', height: '4px', background: '#666', borderRadius: '50%' }}></div>
                        <div style={{ width: '4px', height: '4px', background: '#666', borderRadius: '50%' }}></div>
                        <div style={{ width: '4px', height: '4px', background: '#666', borderRadius: '50%' }}></div>
                    </div>
                </div>
            )}

            {/* Right Panel: Element Editor + Timeline */}
            <div style={{
                flex: 1,
                minWidth: '0',
                display: fullScreenMode === 'video' ? 'none' : 'flex',
                flexDirection: 'column',
                gap: '10px',
                paddingLeft: fullScreenMode === 'editor' ? '0' : '10px',
                width: fullScreenMode === 'editor' ? '100%' : 'auto',
                position: 'relative'
            }}>
                {/* IP Camera Panel */}
                {showCameraPanel && (
                    <IPCameraConnect
                        videoRef={videoRef}
                        onStreamConnected={(url, type) => {
                            setVideoSourceType('stream');
                            setIsStreamConnected(true);
                            setIsMJPEG(type === 'mjpeg');
                            onVideoChange(url);
                            onVideoNameChange(`Stream: ${url}`);
                        }}
                        onStreamDisconnected={() => {
                            setVideoSourceType('file');
                            setIsStreamConnected(false);
                            setIsMJPEG(false);
                            onVideoChange(null);
                        }}
                    />
                )}

                {/* Video Recorder Panel */}
                {showRecorderPanel && (
                    <VideoRecorder
                        videoRef={videoRef}
                        videoSrc={videoSrc}
                        isWebcamActive={isWebcamActive}
                        onRecordingComplete={(blob, url) => {
                            if (url) {
                                onVideoChange(url);
                                onVideoNameChange('Recorded Video');
                                setVideoSourceType('file');
                            }
                        }}
                    />
                )}

                {/* Webcam Panel */}
                {showWebcamPanel && (
                    <WebcamCapture
                        videoRef={videoRef}
                        onWebcamStarted={(stream) => {
                            setVideoSourceType('webcam');
                            setIsWebcamActive(true);
                            onVideoNameChange('Webcam');
                        }}
                        onWebcamStopped={() => {
                            setVideoSourceType('file');
                            setIsWebcamActive(false);
                            onVideoChange(null);
                        }}
                        onStartRecording={() => setShowRecorderPanel(true)}
                    />
                )}
                {/* Full Screen Element Editor Button */}
                <button
                    onClick={() => setFullScreenMode(fullScreenMode === 'editor' ? 'none' : 'editor')}
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        zIndex: 100,
                        backgroundColor: fullScreenMode === 'editor' ? '#005a9e' : '#333',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '35px',
                        height: '35px',
                        boxShadow: fullScreenMode === 'editor' ? '0 2px 8px rgba(0, 90, 158, 0.5)' : '0 2px 8px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.1)';
                        e.target.style.boxShadow = fullScreenMode === 'editor' ? '0 4px 12px rgba(0, 90, 158, 0.6)' : '0 4px 12px rgba(0, 0, 0, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.boxShadow = fullScreenMode === 'editor' ? '0 2px 8px rgba(0, 90, 158, 0.5)' : '0 2px 8px rgba(0, 0, 0, 0.3)';
                    }}
                    title={fullScreenMode === 'editor' ? "Exit Full Screen" : "Full Screen Editor"}
                >
                    {fullScreenMode === 'editor' ? '⛶' : '⛶'}
                </button>

                <div style={{ flex: 1, minHeight: '300px' }}>
                    <ElementEditor
                        measurements={videoState.measurements}
                        videoName={videoSrc ? videoSrc.split('/').pop().split('.')[0] : 'Untitled'}
                        onUpdateMeasurements={updateMeasurements}
                    />
                </div>

                {videoSrc && (
                    <TimelineMeasurement
                        videoState={videoState}
                        onAddMeasurement={addMeasurement}
                        onRemoveMeasurement={removeMeasurement}
                    />
                )}
            </div>

            {/* Cycle Detection Panel */}
            {showCycleDetection && (
                <CycleDetectionPanel
                    videoRef={videoRef}
                    onApplyCycles={(cycles) => {
                        updateMeasurements([...videoState.measurements, ...cycles]);
                    }}
                    onClose={() => setShowCycleDetection(false)}
                />
            )}

            {/* Voice Command Panel - Floating Window */}
            {showVoiceCommand && (
                <VoiceCommandPanel
                    onCommand={(action) => {
                        console.log('Voice command:', action);

                        switch (action) {
                            case 'play':
                                if (videoRef.current && videoRef.current.paused) {
                                    togglePlay();
                                }
                                break;
                            case 'pause':
                                if (videoRef.current && !videoRef.current.paused) {
                                    togglePlay();
                                }
                                break;
                            case 'startMeasurement':
                                window.dispatchEvent(new CustomEvent('start-measurement'));
                                break;
                            case 'endMeasurement':
                                window.dispatchEvent(new CustomEvent('end-measurement'));
                                break;
                            case 'nextFrame':
                                nextFrame();
                                break;
                            case 'previousFrame':
                                previousFrame();
                                break;
                            case 'speedUp':
                                const currentSpeed = videoState.playbackSpeed;
                                if (currentSpeed < 2) {
                                    setPlaybackSpeed(Math.min(2, currentSpeed + 0.25));
                                }
                                break;
                            case 'slowDown':
                                const speed = videoState.playbackSpeed;
                                if (speed > 0.25) {
                                    setPlaybackSpeed(Math.max(0.25, speed - 0.25));
                                }
                                break;
                            case 'zoomIn':
                                if (videoState.zoom < 3) {
                                    setZoom(Math.min(3, videoState.zoom + 0.25));
                                }
                                break;
                            case 'zoomOut':
                                if (videoState.zoom > 0.5) {
                                    setZoom(Math.max(0.5, videoState.zoom - 0.25));
                                }
                                break;
                            default:
                                console.warn('Unknown voice command:', action);
                        }
                    }}
                    onClose={() => setShowVoiceCommand(false)}
                />
            )}

            {/* Ergonomic Analysis Panel */}
            {showErgonomicAnalysis && (
                <ErgonomicAnalysis
                    videoRef={videoRef}
                    onClose={() => setShowErgonomicAnalysis(false)}
                />
            )}
        </div>
    );
}

export default VideoWorkspace;
