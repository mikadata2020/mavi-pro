import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Play, Pause, RefreshCw, CheckCircle, AlertTriangle, Save, Upload, Camera, HelpCircle } from 'lucide-react';
import HelpButton from './HelpButton';
import { helpContent } from '../utils/helpContent.jsx';
import { initializePoseDetector, detectPose, drawPoseSkeleton } from '../utils/poseDetector';
import {
    extractPoseFeatures,
    createPoseSequence,
    compareWithGoldenCycle,
    detectAnomalies
} from '../utils/motionComparator';
import { loadModelFromURL, loadModelFromFiles, predict } from '../utils/teachableMachine';

const MachineLearningData = ({ videoSrc }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [consistencyScore, setConsistencyScore] = useState(0);
    const [goldenCycle, setGoldenCycle] = useState(null);
    const [dataPoints, setDataPoints] = useState([]);
    const [anomalies, setAnomalies] = useState(0);
    const [showHelp, setShowHelp] = useState(false);

    // Real ML states
    const [detector, setDetector] = useState(null);
    const [status, setStatus] = useState('Initializing AI...');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingProgress, setRecordingProgress] = useState(0);
    const [currentPose, setCurrentPose] = useState(null);
    const [currentSequence, setCurrentSequence] = useState([]);
    const [allScores, setAllScores] = useState([]);

    // Teachable Machine State
    const [useTeachableMachine, setUseTeachableMachine] = useState(false);
    const [tmModel, setTmModel] = useState(null);
    const [tmModelURL, setTmModelURL] = useState('');
    const [tmPrediction, setTmPrediction] = useState(null);
    const [tmLoading, setTmLoading] = useState(false);
    const [tmModelType, setTmModelType] = useState('online'); // 'online' or 'offline'

    // File refs for offline upload
    const modelFileRef = useRef(null);
    const weightsFileRef = useRef(null);
    const metadataFileRef = useRef(null);

    const canvasRef = useRef(null);
    const videoRef = useRef(null);
    const requestRef = useRef();
    const fileInputRef = useRef(null);
    const recordingDataRef = useRef([]);
    const recordingStartTime = useRef(null);

    // Initialize pose detector
    useEffect(() => {
        const initDetector = async () => {
            try {
                const det = await initializePoseDetector();
                setDetector(det);
                setStatus('Ready');
            } catch (error) {
                console.error('Failed to initialize detector:', error);
                setStatus('AI Failed');
            }
        };
        initDetector();
    }, []);

    // Real-time analysis loop
    const analyzeFrame = useCallback(async () => {
        if (!isAnalyzing || !videoRef.current) return;

        if (useTeachableMachine && tmModel) {
            // Teachable Machine Logic
            try {
                const result = await predict(tmModel, videoRef.current);
                if (result) {
                    setTmPrediction(result);

                    // Update graph with accuracy of best class
                    const newPoint = {
                        time: new Date().toLocaleTimeString(),
                        score: (result.accuracy * 100).toFixed(1),
                        threshold: 80
                    };

                    setDataPoints(prev => {
                        const newData = [...prev, newPoint];
                        if (newData.length > 20) newData.shift();
                        return newData;
                    });
                    setConsistencyScore((result.accuracy * 100).toFixed(0));

                    // Draw TM pose
                    const canvas = canvasRef.current;
                    if (canvas && result.pose) {
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        const video = videoRef.current;
                        const scaleX = canvas.width / video.videoWidth;
                        const scaleY = canvas.height / video.videoHeight;

                        ctx.save();
                        ctx.scale(scaleX, scaleY);
                        // TM Pose usually returns keypoints, standard draw function might work if structure matches
                        // Or use TM's own drawing, but let's try our util first since it expects {keypoints}
                        if (result.pose.keypoints) {
                            drawPoseSkeleton(ctx, [result.pose]);
                        }
                        ctx.restore();
                    }
                }
            } catch (error) {
                console.error("TM Prediction Error:", error);
            }
        } else if (!useTeachableMachine && detector) {
            // Original Golden Cycle Logic
            try {
                // Detect pose from video
                const poses = await detectPose(videoRef.current);

                if (poses && poses.length > 0) {
                    const pose = poses[0];
                    setCurrentPose(pose);

                    // Extract features
                    const features = extractPoseFeatures(pose.keypoints);

                    if (features && goldenCycle && goldenCycle.sequence) {
                        // Add to current sequence (keep last 30 frames for comparison)
                        setCurrentSequence(prev => {
                            const newSeq = [...prev, features];
                            if (newSeq.length > 30) newSeq.shift();
                            return newSeq;
                        });

                        // Compare with golden cycle
                        const currentSeqArray = [...currentSequence, features];
                        const comparison = compareWithGoldenCycle(
                            currentSeqArray,
                            goldenCycle.sequence
                        );

                        // Update score and data points
                        setConsistencyScore(comparison.score);

                        const newPoint = {
                            time: new Date().toLocaleTimeString(),
                            score: comparison.score,
                            threshold: 80
                        };

                        setDataPoints(prev => {
                            const newData = [...prev, newPoint];
                            if (newData.length > 20) newData.shift();
                            return newData;
                        });

                        setAllScores(prev => [...prev, comparison.score]);

                        if (comparison.isAnomaly) {
                            setAnomalies(prev => prev + 1);
                        }
                    }

                    // Draw pose on canvas
                    const canvas = canvasRef.current;
                    if (canvas) {
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);

                        // Scale coordinates to canvas size
                        const video = videoRef.current;
                        const scaleX = canvas.width / video.videoWidth;
                        const scaleY = canvas.height / video.videoHeight;

                        ctx.save();
                        ctx.scale(scaleX, scaleY);
                        drawPoseSkeleton(ctx, poses);
                        ctx.restore();
                    }
                }
            } catch (error) {
                console.error('Error in analysis loop:', error);
            }
        }

        requestRef.current = requestAnimationFrame(analyzeFrame);
    }, [isAnalyzing, detector, goldenCycle, currentSequence, useTeachableMachine, tmModel]);

    useEffect(() => {
        if (isAnalyzing && detector) {
            analyzeFrame();
        } else {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        }
        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [isAnalyzing, detector, analyzeFrame]);

    // Recording loop for Golden Cycle
    const recordFrame = useCallback(async () => {
        if (!isRecording || !detector || !videoRef.current) return;

        try {
            const poses = await detectPose(videoRef.current);

            if (poses && poses.length > 0) {
                const pose = poses[0];
                recordingDataRef.current.push(pose.keypoints);

                // Update progress (record for 5 seconds at ~30fps = 150 frames)
                const elapsed = Date.now() - recordingStartTime.current;
                const progress = Math.min(100, (elapsed / 5000) * 100);
                setRecordingProgress(progress);

                // Draw pose on canvas
                const canvas = canvasRef.current;
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    const video = videoRef.current;
                    const scaleX = canvas.width / video.videoWidth;
                    const scaleY = canvas.height / video.videoHeight;

                    ctx.save();
                    ctx.scale(scaleX, scaleY);
                    drawPoseSkeleton(ctx, poses);
                    ctx.restore();

                    // Draw recording indicator
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
                    ctx.beginPath();
                    ctx.arc(20, 20, 8, 0, Math.PI * 2);
                    ctx.fill();
                }

                if (progress >= 100) {
                    // Finish recording
                    finishRecording();
                    return;
                }
            }
        } catch (error) {
            console.error('Error in recording loop:', error);
        }

        requestRef.current = requestAnimationFrame(recordFrame);
    }, [isRecording, detector]);

    useEffect(() => {
        if (isRecording && detector) {
            recordFrame();
        }
        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [isRecording, detector, recordFrame]);

    const handleCaptureGoldenCycle = () => {
        if (!videoRef.current || !detector) {
            alert('Please ensure video is loaded and AI is ready.');
            return;
        }

        setIsRecording(true);
        recordingDataRef.current = [];
        recordingStartTime.current = Date.now();
        setRecordingProgress(0);
    };

    const finishRecording = () => {
        setIsRecording(false);

        // Create pose sequence from recorded data
        const sequence = createPoseSequence(recordingDataRef.current);

        if (sequence.length > 0) {
            setGoldenCycle({
                timestamp: new Date().toISOString(),
                duration: `${(recordingDataRef.current.length / 30).toFixed(1)}s`,
                score: '100%',
                source: 'captured',
                sequence: sequence,
                frameCount: recordingDataRef.current.length
            });
            alert(`Golden Cycle Captured! ${recordingDataRef.current.length} frames recorded.`);
        } else {
            alert('Failed to capture Golden Cycle. No valid poses detected.');
        }

        recordingDataRef.current = [];
        setRecordingProgress(0);
    };

    const handleUploadGoldenCycle = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('video/')) {
            const videoURL = URL.createObjectURL(file);
            // Note: For uploaded video, we would need to process it frame by frame
            // For now, just show a message
            alert('Video uploaded. Please play the video and use "Capture Current" to set Golden Cycle.');
        } else {
            alert('Please upload a valid video file.');
        }
    };

    const handleStartAnalysis = () => {
        if (!goldenCycle) {
            alert('Please set a Golden Cycle first by capturing or uploading a reference video.');
            return;
        }
        if (!videoRef.current) {
            alert('Please ensure video is loaded.');
            return;
        }

        // Reset analysis state
        setDataPoints([]);
        setAnomalies(0);
        setAllScores([]);
        setCurrentSequence([]);

        setIsAnalyzing(!isAnalyzing);
    };

    // Set video ref when videoSrc changes
    useEffect(() => {
        if (videoSrc && videoRef.current) {
            videoRef.current.src = videoSrc;
        }
    }, [videoSrc]);

    const handleLoadTmModel = async () => {
        setTmLoading(true);
        setStatus("Loading TM Model...");
        try {
            let model;
            if (tmModelType === 'online') {
                if (!tmModelURL) {
                    alert("Please enter a Model URL");
                    setTmLoading(false);
                    setStatus("Ready"); // Revert status
                    return;
                }
                model = await loadModelFromURL(tmModelURL);
            } else {
                if (!modelFileRef.current || !weightsFileRef.current || !metadataFileRef.current) {
                    alert("Please upload all 3 files: model.json, metadata.json, weights.bin");
                    setTmLoading(false);
                    setStatus("Ready");
                    return;
                }
                model = await loadModelFromFiles(
                    modelFileRef.current,
                    weightsFileRef.current,
                    metadataFileRef.current
                );
            }

            setTmModel(model);
            setStatus("TM Model Ready");
            alert("Teachable Machine Model Loaded Successfully!");
        } catch (error) {
            console.error(error);
            alert("Failed to load model: " + error.message);
            setStatus("AI Failed");
        } finally {
            setTmLoading(false);
        }
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (type === 'model') modelFileRef.current = file;
        if (type === 'weights') weightsFileRef.current = file;
        if (type === 'metadata') metadataFileRef.current = file;
    };

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '280px 1fr',
            gridTemplateRows: 'auto 1fr',
            gap: '15px',
            height: '100%',
            padding: '15px',
            backgroundColor: '#1a1a1a',
            color: '#fff',
            fontFamily: 'Inter, sans-serif',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem', background: 'linear-gradient(45deg, #00d2ff, #3a7bd5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Machine Learning Consistency Check
                    </h1>
                    <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>Real-time Operator Motion Analysis</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        background: status === 'Ready' ? 'rgba(0,255,0,0.1)' : 'rgba(255,165,0,0.1)',
                        border: `1px solid ${status === 'Ready' ? '#0f0' : '#ffa500'}`,
                        color: status === 'Ready' ? '#0f0' : '#ffa500',
                        fontSize: '0.85rem'
                    }}>
                        {status}
                    </div>
                    <button
                        onClick={() => setShowHelp(true)}
                        style={{
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid #666',
                            background: 'rgba(255,255,255,0.1)',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.9rem'
                        }}
                        title="Help - Panduan Machine Learning Data"
                    >
                        <HelpCircle size={18} /> Help
                    </button>
                    <button
                        onClick={handleStartAnalysis}
                        disabled={status !== 'Ready'}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            background: isAnalyzing ? '#ff4b4b' : '#00d2ff',
                            color: '#fff',
                            fontWeight: 'bold',
                            cursor: status === 'Ready' ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                            opacity: status === 'Ready' ? 1 : 0.5
                        }}
                    >
                        {isAnalyzing ? <Pause size={18} /> : <Play size={18} />}
                        {isAnalyzing ? 'Stop Analysis' : 'Start Analysis'}
                    </button>
                </div>
            </div>

            {/* Left Panel: Controls & Stats */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                {/* Model Source Selection */}
                <div style={{
                    padding: '10px',
                    backgroundColor: '#333',
                    borderRadius: '8px',
                    marginBottom: '10px'
                }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        <button
                            onClick={() => setUseTeachableMachine(false)}
                            style={{
                                flex: 1,
                                padding: '8px',
                                background: !useTeachableMachine ? '#00d2ff' : '#444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Use Golden Cycle
                        </button>
                        <button
                            onClick={() => setUseTeachableMachine(true)}
                            style={{
                                flex: 1,
                                padding: '8px',
                                background: useTeachableMachine ? '#00d2ff' : '#444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Use Teachable Machine
                        </button>
                    </div>

                    {useTeachableMachine && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <label>
                                    <input
                                        type="radio"
                                        name="tmType"
                                        checked={tmModelType === 'online'}
                                        onChange={() => setTmModelType('online')}
                                    /> Online
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        name="tmType"
                                        checked={tmModelType === 'offline'}
                                        onChange={() => setTmModelType('offline')}
                                    /> Offline
                                </label>
                            </div>

                            {tmModelType === 'online' ? (
                                <input
                                    placeholder="Paste Teachable Machine URL..."
                                    value={tmModelURL}
                                    onChange={(e) => setTmModelURL(e.target.value)}
                                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #555', background: '#222', color: 'white' }}
                                />
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.8rem' }}>
                                    <div>Model (model.json): <input type="file" accept=".json" onChange={(e) => handleFileChange(e, 'model')} /></div>
                                    <div>Weights (weights.bin): <input type="file" accept=".bin" onChange={(e) => handleFileChange(e, 'weights')} /></div>
                                    <div>Meta (metadata.json): <input type="file" accept=".json" onChange={(e) => handleFileChange(e, 'metadata')} /></div>
                                </div>
                            )}

                            <button
                                onClick={handleLoadTmModel}
                                disabled={tmLoading}
                                style={{
                                    padding: '8px',
                                    background: tmModel ? '#4caf50' : '#2196f3',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: tmLoading ? 'wait' : 'pointer'
                                }}
                            >
                                {tmLoading ? 'Loading...' : (tmModel ? 'Model Loaded (Reload?)' : 'Load Model')}
                            </button>
                        </div>
                    )}
                </div>

                {!useTeachableMachine && (
                    <div style={{
                        padding: '15px',
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,215,0,0.3)'
                    }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#ffd700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <RefreshCw size={16} /> Golden Cycle
                        </h3>
                        {goldenCycle ? (
                            <div style={{ fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <span style={{ color: '#aaa' }}>Source:</span>
                                    <span style={{ fontSize: '0.8rem' }}>
                                        📹 Captured
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <span style={{ color: '#aaa' }}>Frames:</span>
                                    <span>{goldenCycle.frameCount}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <span style={{ color: '#aaa' }}>Duration:</span>
                                    <span>{goldenCycle.duration}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ color: '#aaa' }}>Baseline Score:</span>
                                    <span style={{ color: '#00ff00' }}>{goldenCycle.score}</span>
                                </div>
                                <button
                                    onClick={() => setGoldenCycle(null)}
                                    style={{
                                        width: '100%',
                                        padding: '6px',
                                        background: 'rgba(255,0,0,0.1)',
                                        border: '1px solid #ff4b4b',
                                        color: '#ff4b4b',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    Clear Golden Cycle
                                </button>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '10px 0' }}>
                                <p style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '10px' }}>
                                    {isRecording ? `Recording... ${recordingProgress.toFixed(0)}%` : 'No reference cycle set.'}
                                </p>
                                {isRecording && (
                                    <div style={{
                                        width: '100%',
                                        height: '4px',
                                        background: '#333',
                                        borderRadius: '2px',
                                        overflow: 'hidden',
                                        marginBottom: '10px'
                                    }}>
                                        <div style={{
                                            width: `${recordingProgress}%`,
                                            height: '100%',
                                            background: '#ffd700',
                                            transition: 'width 0.1s'
                                        }} />
                                    </div>
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <button
                                        onClick={handleCaptureGoldenCycle}
                                        disabled={isRecording || status !== 'Ready'}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            background: 'rgba(255,215,0,0.1)',
                                            border: '1px solid #ffd700',
                                            color: '#ffd700',
                                            borderRadius: '6px',
                                            cursor: (isRecording || status !== 'Ready') ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            gap: '5px',
                                            opacity: (isRecording || status !== 'Ready') ? 0.5 : 1
                                        }}
                                    >
                                        <Camera size={14} /> {isRecording ? 'Recording...' : 'Capture Current'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                )}

                {useTeachableMachine && (
                    <div style={{
                        padding: '15px',
                        background: 'rgba(0,0,255,0.1)',
                        borderRadius: '12px',
                        border: '1px solid rgba(0,210,255,0.3)'
                    }}>
                        <h3 style={{ margin: '0 0 10px 0', color: '#00d2ff' }}>🤖 AI Prediction</h3>
                        {tmPrediction ? (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>
                                    {tmPrediction.bestClass}
                                </div>
                                <div style={{ fontSize: '1rem', color: '#ccc' }}>
                                    Confidence: {(tmPrediction.accuracy * 100).toFixed(1)}%
                                </div>
                                <div style={{ marginTop: '10px', height: '10px', background: '#333', borderRadius: '5px' }}>
                                    <div style={{
                                        width: `${tmPrediction.accuracy * 100}%`,
                                        height: '100%',
                                        background: tmPrediction.accuracy > 0.8 ? '#00ff00' : '#ffa500',
                                        borderRadius: '5px',
                                        transition: 'width 0.2s'
                                    }} />
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: '#aaa', textAlign: 'center' }}>
                                {isAnalyzing ? 'Waiting for detection...' : 'Start Analysis to see results'}
                            </div>
                        )}
                    </div>
                )}

                {/* Consistency Gauge */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                        <svg width="150" height="150" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#333" strokeWidth="10" />
                            <circle
                                cx="50" cy="50" r="45"
                                fill="none"
                                stroke={consistencyScore > 80 ? '#00ff00' : consistencyScore > 60 ? '#ffa500' : '#ff0000'}
                                strokeWidth="10"
                                strokeDasharray={`${consistencyScore * 2.83} 283`}
                                transform="rotate(-90 50 50)"
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dasharray 0.5s ease' }}
                            />
                        </svg>
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center'
                        }}>
                            <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{consistencyScore}%</span>
                            <div style={{ fontSize: '0.7rem', color: '#aaa' }}>MATCH</div>
                        </div>
                    </div>
                </div>

                {/* Anomaly Counter */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '15px',
                    background: 'rgba(255, 0, 0, 0.1)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 0, 0, 0.3)'
                }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff4b4b' }}>
                        <AlertTriangle size={18} /> Anomalies
                    </span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ff4b4b' }}>{anomalies}</span>
                </div>
            </div>

            {/* Right Panel: Visualization & Graphs */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                minHeight: 0,
                overflowY: 'auto'
            }}>
                {/* Video/Canvas Overlay */}
                <div style={{
                    position: 'relative',
                    background: '#000',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '400px',
                    flexShrink: 0
                }}>
                    {videoSrc ? (
                        <video
                            ref={videoRef}
                            src={videoSrc}
                            style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.6 }}
                            autoPlay
                            loop
                            muted
                        />
                    ) : (
                        <div style={{ color: '#555' }}>No Video Source</div>
                    )}
                    <canvas
                        ref={canvasRef}
                        width={800}
                        height={450}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none'
                        }}
                    />
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'rgba(0,0,0,0.7)',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        color: isAnalyzing || isRecording ? '#00ff00' : '#666',
                        border: `1px solid ${isAnalyzing || isRecording ? '#00ff00' : '#666'}`
                    }}>
                        {isRecording ? 'RECORDING' : isAnalyzing ? 'LIVE INFERENCE' : 'IDLE'}
                    </div>
                </div>

                {/* Graph */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    height: '350px',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#ccc' }}>Consistency Trend</h3>
                    {dataPoints.length === 0 ? (
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#666',
                            fontSize: '0.9rem'
                        }}>
                            Press "Start Analysis" to see the graph
                        </div>
                    ) : (
                        <div style={{ width: '100%', height: '280px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dataPoints}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#00d2ff" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="time" stroke="#666" tick={{ fontSize: 10, fill: '#999' }} />
                                    <YAxis domain={[0, 100]} stroke="#666" tick={{ fontSize: 10, fill: '#999' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                                        itemStyle={{ color: '#00d2ff' }}
                                    />
                                    <Area type="monotone" dataKey="score" stroke="#00d2ff" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                                    <Line type="monotone" dataKey="threshold" stroke="#ff4b4b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>

            {/* Help Modal */}
            {showHelp && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 9999
                }} onClick={() => setShowHelp(false)}>
                    <div style={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: '12px',
                        padding: '30px',
                        maxWidth: '600px',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        color: '#fff'
                    }} onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ margin: '0 0 20px 0', color: '#00d2ff' }}>🧠 Machine Learning Data - Help</h2>

                        <h3 style={{ color: '#ffd700', marginTop: '20px' }}>📌 Fungsi</h3>
                        <p style={{ lineHeight: '1.6', color: '#ccc' }}>
                            Analisis konsistensi gerakan operator menggunakan AI Pose Detection dengan Golden Cycle sebagai referensi standar.
                        </p>

                        <h3 style={{ color: '#ffd700', marginTop: '20px' }}>🚀 Cara Pakai</h3>
                        <ol style={{ lineHeight: '1.8', color: '#ccc' }}>
                            <li><strong>Set Golden Cycle</strong> (Gerakan Referensi):
                                <ul>
                                    <li>📹 <strong>Capture Current</strong>: Rekam gerakan standar selama 5 detik</li>
                                    <li>Pastikan video menampilkan gerakan yang konsisten</li>
                                </ul>
                            </li>
                            <li>Klik <strong>Start Analysis</strong> untuk mulai deteksi real-time</li>
                            <li>Monitor:
                                <ul>
                                    <li><strong>Consistency Score</strong>: % kecocokan dengan Golden Cycle (menggunakan DTW algorithm)</li>
                                    <li><strong>Anomaly Graph</strong>: Tren deviasi dari waktu ke waktu</li>
                                    <li><strong>Live Skeleton Feed</strong>: Visualisasi pose detection real-time</li>
                                </ul>
                            </li>
                        </ol>

                        <h3 style={{ color: '#ffd700', marginTop: '20px' }}>💡 Tips</h3>
                        <ul style={{ lineHeight: '1.8', color: '#ccc' }}>
                            <li>Rekam gerakan terbaik sebagai Golden Cycle</li>
                            <li>Threshold 80% = batas minimum konsistensi</li>
                            <li>Anomaly tinggi = perlu retraining operator</li>
                            <li>Pastikan pencahayaan cukup untuk deteksi pose yang akurat</li>
                        </ul>

                        <button
                            onClick={() => setShowHelp(false)}
                            style={{
                                marginTop: '20px',
                                padding: '10px 20px',
                                background: '#00d2ff',
                                border: 'none',
                                borderRadius: '6px',
                                color: '#fff',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                width: '100%'
                            }}
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MachineLearningData;
