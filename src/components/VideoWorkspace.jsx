import React, { useState, useRef, useEffect } from 'react';
import ElementEditor from './ElementEditor';
import PlaybackControls from './features/PlaybackControls';
import TimelineMeasurement from './features/TimelineMeasurement';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import { captureScreenshot, exportAnalysisData } from '../utils/screenshotCapture';

function VideoWorkspace({ onMeasurementsChange, videoSrc, setVideoSrc, measurements }) {
    const fileInputRef = useRef(null);
    const [logoUrl, setLogoUrl] = useState(null);
    const [logoPosition, setLogoPosition] = useState('bottom-right');
    const [logoOpacity, setLogoOpacity] = useState(0.7);

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
            setVideoSrc(url);
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
        if (onMeasurementsChange) {
            onMeasurementsChange(videoState.measurements);
        }
    }, [videoState.measurements, onMeasurementsChange]);

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
        <div style={{ flex: 2, display: 'flex', gap: '10px', minHeight: '0' }}>
            {/* Video Player Section */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#000', position: 'relative' }}>
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
                            transition: 'transform 0.2s'
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

                    {/* Logo Overlay */}
                    {videoSrc && logoUrl && (
                        <img
                            src={logoUrl}
                            alt="Logo"
                            style={getLogoStyle()}
                        />
                    )}
                </div>

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

            {/* Right Panel: Element Editor + Timeline */}
            <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
