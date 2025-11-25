import React, { useState, useRef, useEffect, useCallback } from 'react';
import ElementEditor from './ElementEditor';
import PlaybackControls from './features/PlaybackControls';
import TimelineMeasurement from './features/TimelineMeasurement';
import TimelineEditor from './features/TimelineEditor';
import VideoAnnotation from './features/VideoAnnotation';
import ProjectButtons from './ProjectButtons';
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
    const containerRef = useRef(null);
    const isResizing = useRef(false);

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
        toggleReverse,
        handleTimeUpdate,
        handleLoadedMetadata,
        updateMeasurements
    } = useVideoPlayer(measurements || []);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
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

    return (
        <div ref={containerRef} style={{ flex: 2, display: 'flex', minHeight: '0' }}>
            {/* Video Player Section */}
            <div style={{ width: `${leftPanelWidth}%`, display: 'flex', flexDirection: 'column', backgroundColor: '#000', position: 'relative' }}>
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    {videoSrc ? (
                        <div style={{
                            transform: `scale(${videoState.zoom})`,
                            transformOrigin: 'center center',
                            transition: 'transform 0.2s',
                            position: 'relative'
                        }}>
                            <video
                                ref={videoRef}
                                src={videoSrc}
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                style={{
                                    width: '100%',
                                    maxHeight: '100%',
                                    display: 'block'
                                }}
                            />

                            {/* Video Annotation Overlay */}
                            {showAnnotationTool && (
                                <VideoAnnotation
                                    videoRef={videoRef}
                                    videoState={videoState}
                                    annotations={drawingAnnotations}
                                    onUpdateAnnotations={setDrawingAnnotations}
                                />
                            )}
                        </div>
                    ) : (
                        <div style={{ color: '#666', textAlign: 'center' }}>
                            <p>Tidak ada video yang dipilih</p>
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

            {/* Resizer Handle */}
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

            {/* Right Panel: Element Editor + Timeline */}
            <div style={{ flex: 1, minWidth: '0', display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '10px' }}>
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
        </div>
    );
}

export default VideoWorkspace;
