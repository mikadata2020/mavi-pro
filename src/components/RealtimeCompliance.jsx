import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Play, Pause, RefreshCw, AlertTriangle, CheckCircle, Clock, List,
    Video as VideoIcon, Camera, Settings, Plus, X, Maximize2, Trash2, LayoutGrid, Monitor
} from 'lucide-react';
import { initializePoseDetector, detectPose, drawPoseSkeleton } from '../utils/poseDetector';
import { initializeHandDetector, detectHands, drawHandSkeleton } from '../utils/handDetector';
import { ProjectActionMatcher } from '../utils/projectActionMatcher';
import { ComplianceEngine } from '../utils/complianceEngine';
import { getProjectByName, getAllProjects, getAllCameras, saveCamera, deleteCamera, getAllStudioModels } from '../utils/database'; // Added getAllStudioModels
import InferenceEngine from '../utils/studio/InferenceEngine'; // Import Studio Engine

const RealtimeCompliance = ({ projectName: initialProjectName }) => {
    // --- State ---
    const [cameras, setCameras] = useState([]);
    const [activeCameraId, setActiveCameraId] = useState(null);
    const [isManaging, setIsManaging] = useState(false);
    const [availableProjects, setAvailableProjects] = useState([]);
    const [availableStudioModels, setAvailableStudioModels] = useState([]); // New State
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'focus'
    const [showOverlay, setShowOverlay] = useState(true); // Overlay visibility toggle

    // Camera Operational States (Map: cameraId -> state)
    const [cameraStates, setCameraStates] = useState({});
    const poseSequenceRefs = useRef({}); // Map: cameraId -> array
    const requestRefs = useRef({}); // Map: cameraId -> animationFrameId
    const videoRefs = useRef({}); // Map: cameraId -> videoElement
    const canvasRefs = useRef({}); // Map: cameraId -> canvasElement

    // --- Initialization ---
    useEffect(() => {
        const init = async () => {
            try {
                const [allProjects, allCams, studioModels] = await Promise.all([
                    getAllProjects(),
                    getAllCameras(),
                    getAllStudioModels()
                ]);
                setAvailableProjects(allProjects);
                setAvailableStudioModels(studioModels);
                setCameras(allCams);

                // Auto-create default if empty (backward compatibility)
                if (allCams.length === 0 && initialProjectName) {
                    const defaultCam = {
                        name: "Main Station",
                        projectName: initialProjectName,
                        url: "webcam",
                        type: "webcam"
                    };
                    const id = await saveCamera(defaultCam);
                    setCameras([{ ...defaultCam, id }]);
                    setActiveCameraId(id);
                } else if (allCams.length > 0) {
                    setActiveCameraId(allCams[0].id);
                }

                await initializePoseDetector();
                await initializeHandDetector();
            } catch (err) {
                console.error("Compliance Init Error:", err);
            } finally {
                setLoading(false);
            }
        };
        init();
        return () => {
            // Cleanup all monitoring loops
            Object.values(requestRefs.current).forEach(id => cancelAnimationFrame(id));
        };
    }, []);

    // Sync Engines when cameras change
    useEffect(() => {
        const syncEngines = async () => {
            const newStates = { ...cameraStates };
            for (const cam of cameras) {
                if (!newStates[cam.id] && cam.projectName) {
                    // Try Standard Work Project first
                    const proj = await getProjectByName(cam.projectName);
                    if (proj) {
                        const matcher = new ProjectActionMatcher(proj);
                        const engine = new ComplianceEngine(proj, matcher);
                        newStates[cam.id] = {
                            engine,
                            status: engine.getStatus(0),
                            isMonitoring: false,
                            scoreHistory: [],
                            type: cam.type || 'webcam',
                            modelType: 'standard'
                        };
                        poseSequenceRefs.current[cam.id] = [];
                    } else {
                        // Try finding in Studio Models
                        const studioModel = getAllStudioModels().find(m => m.name === cam.projectName);
                        if (studioModel) {
                            const engine = new InferenceEngine();
                            engine.loadModel(studioModel);
                            newStates[cam.id] = {
                                engine,
                                status: { currentStep: { elementName: 'Initializing...' }, match: { score: 100 } },
                                isMonitoring: false,
                                type: cam.type || 'webcam',
                                modelType: 'studio'
                            };
                        }
                    }
                }
            }
            setCameraStates(newStates);
        };
        if (cameras.length > 0) syncEngines();
    }, [cameras]);

    // --- Monitoring Logic ---
    const monitorCamera = useCallback(async (cameraId) => {
        const camState = cameraStates[cameraId];
        const video = videoRefs.current[cameraId];
        if (!camState || !camState.isMonitoring || !video || !camState.engine) return;

        try {
            // For IP cameras, if streaming via <img>, we might need a different pose detection method
            // but for now we assume they are compatible with detectPose if correctly loaded
            const poses = await detectPose(video);
            const hands = await detectHands(video);

            // Draw overlay if enabled
            if (showOverlay) {
                const canvas = canvasRefs.current[cameraId];
                if (canvas && video) {
                    const ctx = canvas.getContext('2d');
                    canvas.width = video.videoWidth || video.width || 640;
                    canvas.height = video.videoHeight || video.height || 480;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // Draw pose skeleton
                    if (poses && poses.length > 0) {
                        poses.forEach(pose => {
                            drawPoseSkeleton(ctx, [pose], canvas.width, canvas.height);
                        });
                    }

                    // Draw hand landmarks
                    if (hands && hands.length > 0) {
                        hands.forEach(hand => {
                            drawHandSkeleton(ctx, hand, canvas.width, canvas.height);
                        });
                    }
                }
            }

            if (poses && poses.length > 0) {
                if (camState.modelType === 'studio') {
                    // --- STUDIO MODEL ENGINE ---
                    // InferenceEngine expects { poses, objects, hands, timestamp }
                    // It returns { tracks, logs, timelineEvents }
                    const result = camState.engine.processFrame({
                        poses: poses,
                        hands: hands,
                        timestamp: Date.now()
                    });

                    // Adapt result for UI (Simplified mapping)
                    const primaryTrack = result.tracks[0];
                    const currentStatusName = primaryTrack ? primaryTrack.state : 'No Subject';

                    setCameraStates(prev => ({
                        ...prev,
                        [cameraId]: {
                            ...prev[cameraId],
                            status: {
                                currentStep: { elementName: currentStatusName },
                                match: { score: primaryTrack ? 100 : 0 },
                                actualCT: primaryTrack ? parseFloat(primaryTrack.duration) : 0,
                                history: result.timelineEvents.map(e => ({
                                    elementName: e.state,
                                    actualCT: (e.duration / 1000).toFixed(1)
                                })).reverse().slice(0, 10), // Show last 10 events
                                isSequenceMismatch: false
                            },
                            timelineEvents: result.timelineEvents || [] // Store full timeline
                        }
                    }));

                } else {
                    // --- STANDARD WORK ENGINE ---
                    const pose = poses[0]; // Fix: Define pose from poses array
                    const seq = poseSequenceRefs.current[cameraId] || [];
                    seq.push(pose);
                    if (seq.length > 60) seq.shift();
                    poseSequenceRefs.current[cameraId] = seq;

                    if (seq.length >= 15) {
                        const engine = camState.engine;
                        const match = engine.matcher.match(seq, engine.currentStepIndex);
                        const currentStatus = engine.update(match);

                        setCameraStates(prev => ({
                            ...prev,
                            [cameraId]: {
                                ...prev[cameraId],
                                status: currentStatus,
                                scoreHistory: [...(prev[cameraId].scoreHistory || []), currentStatus.match?.score || 0].slice(-10)
                            }
                        }));
                    }
                }
            }
        } catch (err) {
            console.error(`Monitor error for cam ${cameraId}:`, err);
        }

        requestRefs.current[cameraId] = requestAnimationFrame(() => monitorCamera(cameraId));
    }, [cameraStates]);

    const handleToggleMonitoring = async (cameraId) => {
        const cam = cameras.find(c => c.id === cameraId);
        if (!cam) return;

        setCameraStates(prev => {
            const isStarting = !prev[cameraId].isMonitoring;
            if (isStarting) {
                prev[cameraId].engine.reset();
                poseSequenceRefs.current[cameraId] = [];

                // Initialize webcam stream if needed
                if (cam.type === 'webcam') {
                    const video = videoRefs.current[cameraId];
                    if (video && !video.srcObject) {
                        navigator.mediaDevices.getUserMedia({
                            video: {
                                width: { ideal: 1280 },
                                height: { ideal: 720 },
                                facingMode: 'user'
                            }
                        })
                            .then(stream => {
                                video.srcObject = stream;
                                video.play();
                                // Delay monitoring start to allow video load
                                setTimeout(() => monitorCamera(cameraId), 1000);
                            })
                            .catch(err => {
                                console.error('Webcam access error:', err);
                                alert('Unable to access webcam. Please check permissions.');
                            });
                    } else {
                        // Stream already active
                        setTimeout(() => monitorCamera(cameraId), 1000);
                    }
                } else {
                    // IP Camera - already streaming via img src
                    setTimeout(() => monitorCamera(cameraId), 1000);
                }
            } else {
                if (requestRefs.current[cameraId]) cancelAnimationFrame(requestRefs.current[cameraId]);

                // Stop webcam stream
                if (cam.type === 'webcam') {
                    const video = videoRefs.current[cameraId];
                    if (video && video.srcObject) {
                        video.srcObject.getTracks().forEach(track => track.stop());
                        video.srcObject = null;
                    }
                }
            }
            return {
                ...prev,
                [cameraId]: { ...prev[cameraId], isMonitoring: isStarting }
            };
        });
    };

    // --- Camera Management ---
    const [newCam, setNewCam] = useState({ name: '', url: '', projectName: '', type: 'webcam', modelType: 'standard' });

    const handleAddCamera = async () => {
        if (!newCam.name || !newCam.projectName) return;
        const id = await saveCamera(newCam);
        setCameras([...cameras, { ...newCam, id }]);
        setNewCam({ name: '', url: '', projectName: '', type: 'webcam', modelType: 'standard' });
        setIsManaging(false);
    };

    const handleDeleteCamera = async (id) => {
        await deleteCamera(id);
        if (requestRefs.current[id]) cancelAnimationFrame(requestRefs.current[id]);
        setCameras(cameras.filter(c => c.id !== id));
        setCameraStates(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    // --- Render Helpers ---
    if (loading) return <div style={{ color: '#888', padding: '40px', textAlign: 'center' }}>Loading Multi-Camera Engine...</div>;

    const renderGrid = () => (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '20px',
            padding: '20px',
            overflowY: 'auto',
            height: 'calc(100vh - 180px)'
        }}>
            {cameras.map(cam => {
                const state = cameraStates[cam.id];
                const status = state?.status;
                return (
                    <div key={cam.id} style={{
                        backgroundColor: '#252526',
                        borderRadius: '12px',
                        border: `1px solid ${status?.isSequenceMismatch ? '#ff4b4b' : '#333'}`,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer'
                    }} onClick={() => { setActiveCameraId(cam.id); setViewMode('focus'); }}>
                        <div style={{ position: 'relative', height: '200px', backgroundColor: '#000' }}>
                            {cam.type === 'webcam' ? (
                                <video
                                    ref={el => videoRefs.current[cam.id] = el}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    autoPlay muted playsInline
                                />
                            ) : (
                                <img
                                    ref={el => videoRefs.current[cam.id] = el}
                                    src={cam.url}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    alt={cam.name}
                                    crossOrigin="anonymous"
                                />
                            )}

                            {/* Canvas Overlay */}
                            <canvas
                                ref={el => canvasRefs.current[cam.id] = el}
                                style={{
                                    position: 'absolute',
                                    top: 0, left: 0,
                                    width: '100%', height: '100%',
                                    pointerEvents: 'none',
                                    display: showOverlay ? 'block' : 'none'
                                }}
                            />

                            <div style={{
                                position: 'absolute', top: '10px', left: '10px',
                                padding: '4px 8px', borderRadius: '4px',
                                backgroundColor: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)',
                                fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '5px'
                            }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: state?.isMonitoring ? '#00ff00' : '#888' }} />
                                {cam.name}
                            </div>

                            {status?.isSequenceMismatch && (
                                <div style={{
                                    position: 'absolute', bottom: '10px', left: '10px', right: '10px',
                                    backgroundColor: 'rgba(255,75,75,0.9)', padding: '5px', borderRadius: '4px',
                                    fontSize: '0.7rem', fontWeight: 'bold', textAlign: 'center'
                                }}>
                                    ⚠️ SEQUENCE MISMATCH
                                </div>
                            )}
                        </div>

                        <div style={{ padding: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ fontSize: '0.8rem', color: '#888' }}>{cam.projectName}</span>
                                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#00d2ff' }}>
                                    {status?.match?.score?.toFixed(0) || 0}%
                                </span>
                            </div>
                            <div style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {status?.currentStep?.elementName || 'Standby'}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Add Camera Placeholder */}
            <div
                onClick={() => setIsManaging(true)}
                style={{
                    border: '2px dashed #444',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '280px',
                    cursor: 'pointer',
                    color: '#666'
                }}
            >
                <Plus size={48} />
                <div style={{ marginTop: '10px' }}>Tambah Kamera / Station</div>
            </div>
        </div>
    );

    const renderFocus = () => {
        const cam = cameras.find(c => c.id === activeCameraId);
        const state = cameraStates[activeCameraId];
        const status = state?.status;
        if (!cam || !state) return null;

        return (
            <div style={{
                display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px', padding: '20px',
                height: 'calc(100vh - 180px)', overflow: 'hidden'
            }}>
                {/* Left: Video */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ position: 'relative', flex: 1, backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333' }}>
                        {cam.type === 'webcam' ? (
                            <video
                                ref={el => videoRefs.current[cam.id] = el}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                autoPlay muted
                            />
                        ) : (
                            <img
                                ref={el => videoRefs.current[cam.id] = el}
                                src={cam.url}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                alt={cam.name}
                                crossOrigin="anonymous"
                            />
                        )}

                        {/* Canvas Overlay */}
                        <canvas
                            ref={el => canvasRefs.current[cam.id] = el}
                            style={{
                                position: 'absolute',
                                top: 0, left: 0,
                                width: '100%', height: '100%',
                                pointerEvents: 'none',
                                display: showOverlay ? 'block' : 'none'
                            }}
                        />
                        <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', gap: '10px' }}>
                            <div style={{
                                padding: '10px 15px', borderRadius: '8px', backgroundColor: state.isMonitoring ? 'rgba(16, 124, 65, 0.9)' : 'rgba(51, 51, 51, 0.9)',
                                display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold'
                            }}>
                                <VideoIcon size={18} /> {cam.name.toUpperCase()}
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowOverlay(!showOverlay); }}
                                style={{
                                    padding: '10px 15px', borderRadius: '8px',
                                    backgroundColor: showOverlay ? 'rgba(0, 210, 255, 0.9)' : 'rgba(51, 51, 51, 0.9)',
                                    border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '8px'
                                }}
                                title={showOverlay ? 'Hide Overlay' : 'Show Overlay'}
                            >
                                <Activity size={18} /> {showOverlay ? 'ON' : 'OFF'}
                            </button>
                        </div>
                    </div>

                    <div style={{ padding: '20px', backgroundColor: '#252526', borderRadius: '12px', display: 'flex', justifyContent: 'space-between' }}>
                        <button
                            onClick={() => handleToggleMonitoring(cam.id)}
                            style={{
                                padding: '12px 24px', backgroundColor: state.isMonitoring ? '#ff4b4b' : '#00d2ff',
                                color: '#fff', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '10px'
                            }}
                        >
                            {state.isMonitoring ? <Pause size={20} /> : <Play size={20} />}
                            {state.isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
                        </button>
                        <button onClick={() => setViewMode('grid')} style={{ background: 'none', border: '1px solid #444', color: '#888', padding: '0 20px', borderRadius: '8px' }}>
                            Back to Grid
                        </button>
                    </div>
                </div>

                {/* Right: Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                    <div style={{ padding: '20px', backgroundColor: '#252526', borderRadius: '12px', border: '1px solid #333' }}>
                        <div style={{ fontSize: '0.85rem', color: '#888' }}>Current Step</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '5px 0' }}>{status?.currentStep?.elementName || '---'}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#00d2ff' }}>
                            <span>Std: {status?.currentStep?.duration?.toFixed(1)}s</span>
                            <span style={{ color: status?.ctVariance > 0 ? '#ff4b4b' : '#4caf50' }}>Actual: {status?.actualCT?.toFixed(1)}s</span>
                        </div>
                    </div>

                    {/* Timeline Events Panel (for Studio Models) */}
                    {state.modelType === 'studio' && state.timelineEvents && state.timelineEvents.length > 0 && (
                        <div style={{ flex: 1, backgroundColor: '#252526', borderRadius: '12px', padding: '20px', border: '1px solid #333' }}>
                            <h3 style={{ margin: '0 0 15px 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Clock size={16} color="#00d2ff" /> Timeline Events
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                                {state.timelineEvents.slice().reverse().slice(0, 20).map((event, i) => {
                                    const duration = (event.duration / 1000).toFixed(2);
                                    const startTime = new Date(event.startTime).toLocaleTimeString();
                                    return (
                                        <div key={i} style={{
                                            padding: '10px',
                                            backgroundColor: i === 0 ? 'rgba(0, 210, 255, 0.1)' : 'rgba(16, 124, 65, 0.05)',
                                            border: `1px solid ${i === 0 ? '#00d2ff' : '#107c41'}`,
                                            borderRadius: '6px',
                                            fontSize: '0.8rem'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: 'bold', color: i === 0 ? '#00d2ff' : '#fff' }}>
                                                    {event.state}
                                                </span>
                                                <span style={{ color: '#888', fontSize: '0.75rem' }}>
                                                    {startTime}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#888' }}>Duration:</span>
                                                <span style={{
                                                    color: parseFloat(duration) > 5 ? '#ff4b4b' : '#4caf50',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {duration}s
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Standard Work Sequence (for Standard Models) */}
                    {state.modelType !== 'studio' && (
                        <div style={{ flex: 1, backgroundColor: '#252526', borderRadius: '12px', padding: '20px', border: '1px solid #333' }}>
                            <h3 style={{ margin: '0 0 15px 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <List size={16} color="#00d2ff" /> Standard Work Sequence
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {status?.history?.map((h, i) => (
                                    <div key={i} style={{ padding: '8px', backgroundColor: 'rgba(16, 124, 65, 0.1)', border: '1px solid #107c41', borderRadius: '4px', fontSize: '0.8rem' }}>
                                        ✓ {h.elementName} ({h.actualCT}s)
                                    </div>
                                ))}
                                <div style={{ padding: '8px', backgroundColor: '#1e1e1e', border: '1px solid #00d2ff', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                    → {status?.currentStep?.elementName}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={{ backgroundColor: '#1a1a1a', minHeight: '100%', color: '#fff' }}>
            <div style={{
                padding: '20px', borderBottom: '1px solid #333', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h1 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Monitor color="#00d2ff" /> Real-time Compliance Dashboard
                    </h1>
                    <div style={{ backgroundColor: '#333', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', color: '#888' }}>
                        {cameras.length} Active Stations
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setViewMode(viewMode === 'grid' ? 'focus' : 'grid')}
                        style={{ background: '#252526', border: '1px solid #444', color: '#fff', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        {viewMode === 'grid' ? <Maximize2 size={18} /> : <LayoutGrid size={18} />}
                    </button>
                    <button
                        onClick={() => setIsManaging(true)}
                        style={{ backgroundColor: '#00d2ff', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Plus size={18} /> Add Camera
                    </button>
                </div>
            </div>

            {viewMode === 'grid' ? renderGrid() : renderFocus()}

            {/* Management Modal */}
            {isManaging && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{ backgroundColor: '#252526', padding: '30px', borderRadius: '12px', width: '450px', border: '1px solid #444' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Configure Camera</h2>
                            <X onClick={() => setIsManaging(false)} style={{ cursor: 'pointer' }} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>Station Name</label>
                                <input
                                    value={newCam.name}
                                    onChange={e => setNewCam({ ...newCam, name: e.target.value })}
                                    placeholder="e.g. Assembly Line 1"
                                    style={{ width: '100%', padding: '10px', backgroundColor: '#1a1a1a', border: '1px solid #444', color: '#fff', borderRadius: '6px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>Camera Type</label>
                                <select
                                    value={newCam.type}
                                    onChange={e => setNewCam({ ...newCam, type: e.target.value })}
                                    style={{ width: '100%', padding: '10px', backgroundColor: '#1a1a1a', border: '1px solid #444', color: '#fff', borderRadius: '6px' }}
                                >
                                    <option value="webcam">Local Webcam</option>
                                    <option value="mjpeg">IP Camera (MJPEG/HTTP)</option>
                                </select>
                            </div>
                            {newCam.type === 'mjpeg' && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>Stream URL</label>
                                    <input
                                        value={newCam.url}
                                        onChange={e => setNewCam({ ...newCam, url: e.target.value })}
                                        placeholder="http://192.168.1.50/mjpeg"
                                        style={{ width: '100%', padding: '10px', backgroundColor: '#1a1a1a', border: '1px solid #444', color: '#fff', borderRadius: '6px' }}
                                    />
                                </div>
                            )}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>Base Model</label>
                                <select
                                    value={newCam.projectName}
                                    onChange={e => setNewCam({ ...newCam, projectName: e.target.value })}
                                    style={{ width: '100%', padding: '10px', backgroundColor: '#1a1a1a', border: '1px solid #444', color: '#fff', borderRadius: '6px' }}
                                >
                                    <option value="">-- Select Model --</option>
                                    {availableStudioModels.map(m => <option key={'m_' + m.id} value={m.name}>{m.name}</option>)}
                                </select>
                            </div>
                            <button
                                onClick={handleAddCamera}
                                style={{ backgroundColor: '#00d2ff', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', marginTop: '10px' }}
                            >
                                Save Configuration
                            </button>
                        </div>

                        {cameras.length > 0 && (
                            <div style={{ marginTop: '20px', borderTop: '1px solid #444', paddingTop: '20px' }}>
                                <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px' }}>Configured Stations:</div>
                                {cameras.map(c => (
                                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#1a1a1a', borderRadius: '4px', marginBottom: '5px' }}>
                                        <span>{c.name}</span>
                                        <Trash2 size={16} color="#ff4b4b" style={{ cursor: 'pointer' }} onClick={() => handleDeleteCamera(c.id)} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-thumb { background: #444; border-radius: 10px; }
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.9; }
                    50% { transform: scale(1.02); opacity: 1; }
                    100% { transform: scale(1); opacity: 0.9; }
                }
            `}</style>
        </div>
    );
};

export default RealtimeCompliance;
