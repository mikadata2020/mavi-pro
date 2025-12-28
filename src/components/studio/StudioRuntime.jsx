import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Activity, FileText, AlertCircle } from 'lucide-react';
import { inferenceEngine } from '../../utils/studio/InferenceEngine';
import { initializePoseDetector as loadPoseDetector, detectPose as estimatePose } from '../../utils/poseDetector';
// import { detectObjects } from '../../utils/objectDetector'; // Assuming this exists

const StudioRuntime = ({ videoRef, isPlaying, currentTime }) => {
    const [models, setModels] = useState([]);
    const [selectedModelId, setSelectedModelId] = useState('');
    const [logs, setLogs] = useState([]);
    const [tracks, setTracks] = useState([]);
    const [isEngineReady, setIsEngineReady] = useState(false);

    // Canvas for overlays
    const canvasRef = useRef(null);
    const requestRef = useRef();

    useEffect(() => {
        // Load models
        const saved = localStorage.getItem('motionModels');
        if (saved) {
            setModels(JSON.parse(saved));
        }

        // Initialize Detectors
        const initAI = async () => {
            await loadPoseDetector();
            // await loadObjectDetector();
            setIsEngineReady(true);
        };
        initAI();

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    const handleModelSelect = (id) => {
        setSelectedModelId(id);
        const model = models.find(m => m.id === id);
        if (model) {
            inferenceEngine.loadModel(model);
        }
    };

    // Main Detection Loop
    const detect = async () => {
        if (!videoRef.current || videoRef.current.paused || !videoRef.current.readyState === 4) return;

        const video = videoRef.current;

        // Run Detection
        const poses = await estimatePose(video);
        const objects = []; // await detectObjects(video);

        // Process
        const result = inferenceEngine.processFrame({
            poses,
            objects,
            timestamp: video.currentTime * 1000 // ms
        });

        // Update UI
        setLogs(result.logs);
        setTracks(result.tracks);

        // Draw Overlay (Simple ID & State)
        drawOverlay(poses, result.tracks);

        if (!video.paused) {
            requestRef.current = requestAnimationFrame(detect);
        }
    };

    const drawOverlay = (poses, tracks) => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx || !videoRef.current) return;

        // Clear and resize
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        // Map tracks to poses (simplified 1-1 assumption for now)
        if (poses.length > 0 && tracks.length > 0) {
            const pose = poses[0];
            const track = tracks[0]; // Assuming ID 1

            // Draw Bounding Box around pose
            const keypoints = pose.keypoints;
            const x = Math.min(...keypoints.map(k => k.x));
            const y = Math.min(...keypoints.map(k => k.y));
            // Simple text
            ctx.fillStyle = '#00ff00';
            ctx.font = '24px Arial';
            ctx.fillText(`${track.state} (${track.duration})`, x, y - 10);
        }
    };

    // Watch video play state to start/stop loop
    useEffect(() => {
        if (isPlaying && selectedModelId && isEngineReady) {
            detect();
        } else {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }
    }, [isPlaying, selectedModelId, isEngineReady]);


    return (
        <div style={{
            position: 'absolute',
            top: 20,
            right: 20,
            width: '350px',
            backgroundColor: 'rgba(31, 41, 55, 0.95)',
            border: '1px solid #374151',
            borderRadius: '12px',
            padding: '16px',
            color: 'white',
            zIndex: 100,
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Activity color="#60a5fa" />
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Runtime Engine</h3>
            </div>

            {/* Model Selector */}
            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>
                    Active Model
                </label>
                <select
                    value={selectedModelId}
                    onChange={(e) => handleModelSelect(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: '#111827',
                        border: '1px solid #4b5563',
                        color: 'white',
                        borderRadius: '6px'
                    }}
                >
                    <option value="">Select a model...</option>
                    {models.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
                {models.length === 0 && (
                    <div style={{ fontSize: '0.8rem', color: '#f87171', marginTop: '4px' }}>
                        No models found. Create one in Studio.
                    </div>
                )}
            </div>

            {/* Active Tracks */}
            <div style={{ marginBottom: '16px', borderTop: '1px solid #4b5563', paddingTop: '12px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px' }}>Active Operators</div>
                {tracks.length === 0 ? (
                    <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>Waiting for detection...</div>
                ) : (
                    tracks.map(t => (
                        <div key={t.id} style={{
                            display: 'flex', justifyContent: 'space-between',
                            background: '#064e3b', padding: '8px', borderRadius: '4px',
                            marginBottom: '4px'
                        }}>
                            <span>OP-{t.id}</span>
                            <span style={{ fontWeight: 'bold' }}>{t.state}</span>
                            <span>{t.duration}</span>
                        </div>
                    ))
                )}
            </div>

            {/* Logs Window */}
            <div style={{ flex: 1, minHeight: '150px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px' }}>Event Log</div>
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    background: '#111827',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace'
                }}>
                    {logs.map(log => (
                        <div key={log.id} style={{ marginBottom: '4px', borderBottom: '1px solid #374151', paddingBottom: '2px' }}>
                            <span style={{ color: '#6b7280' }}>[{log.timestamp}]</span>{' '}
                            <span style={{ color: log.type === 'Transition' ? '#34d399' : '#fff' }}>
                                {log.message}
                            </span>
                        </div>
                    ))}
                    {logs.length === 0 && <div style={{ color: '#6b7280' }}>System ready.</div>}
                </div>
            </div>

            {/* Invisible Canvas for Overlay Computation if needed, or Absolute Overlay */}
            <canvas
                ref={canvasRef}
                style={{
                    position: 'fixed', // Fixed to cover video area if possible, but simpler to use parent relative
                    top: 0,
                    left: 0,
                    pointerEvents: 'none',
                    zIndex: 90,
                    width: '100%', // This might need careful positioning relative to video player container
                    height: '100%',
                    display: 'none' // Currently just calculating, drawing needs overlay approach
                }}
            />
        </div>
    );
};

export default StudioRuntime;
