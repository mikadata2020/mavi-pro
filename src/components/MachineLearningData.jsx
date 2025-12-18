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
import { THERBLIG_ACTIONS } from '../utils/actionClassifier';

const MachineLearningData = ({ videoSrc, measurements, onUpdateMeasurements, externalVideoRef }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [consistencyScore, setConsistencyScore] = useState(0);
    const [goldenCycle, setGoldenCycle] = useState(null);
    const [dataPoints, setDataPoints] = useState([]);
    const [anomalies, setAnomalies] = useState(0);
    const [anomalyHistory, setAnomalyHistory] = useState([]);
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
    const internalVideoRef = useRef(null);
    const videoRef = externalVideoRef || internalVideoRef;
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

                    const score = (result.accuracy * 100);

                    // Update graph with accuracy of best class
                    const newPoint = {
                        time: new Date().toLocaleTimeString(),
                        score: score.toFixed(1),
                        threshold: 80
                    };

                    setDataPoints(prev => {
                        const newData = [...prev, newPoint];
                        if (newData.length > 20) newData.shift();
                        return newData;
                    });
                    setConsistencyScore(score.toFixed(0));

                    // Anomaly detection for TM (score < 80%)
                    if (score < 80) {
                        setAnomalies(prev => prev + 1);
                        setAnomalyHistory(prev => [...prev, {
                            time: videoRef.current.currentTime,
                            score: score.toFixed(1)
                        }]);
                    }

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
                            setAnomalyHistory(prev => [...prev, {
                                time: videoRef.current.currentTime,
                                score: comparison.score
                            }]);
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

    const handleExportAnomalies = () => {
        if (!anomalyHistory.length || !onUpdateMeasurements) {
            alert("Tidak ada anomali yang terdeteksi untuk diekspor.");
            return;
        }

        // Sort by time just in case
        const sortedHistory = [...anomalyHistory].sort((a, b) => a.time - b.time);

        const clusters = [];
        let currentCluster = null;
        const GAP_THRESHOLD = 2000; // 2 seconds gap between detections to form a new cluster

        sortedHistory.forEach(anomaly => {
            if (!currentCluster) {
                currentCluster = {
                    startTime: anomaly.time,
                    endTime: anomaly.time,
                    minScore: parseFloat(anomaly.score),
                    count: 1,
                    videoTimestamp: anomaly.time // anomalyHistory[i].time is already the video current time per analyzeFrame
                };
            } else if (anomaly.time - currentCluster.endTime < 2.0) { // Using 2 seconds as gap
                currentCluster.endTime = anomaly.time;
                currentCluster.minScore = Math.min(currentCluster.minScore, parseFloat(anomaly.score));
                currentCluster.count++;
            } else {
                clusters.push(currentCluster);
                currentCluster = {
                    startTime: anomaly.time,
                    endTime: anomaly.time,
                    minScore: parseFloat(anomaly.score),
                    count: 1,
                    videoTimestamp: anomaly.time
                };
            }
        });

        if (currentCluster) clusters.push(currentCluster);

        // Convert clusters to measurements
        const newMeasurements = clusters.map((cluster, idx) => {
            const startStr = new Date().toLocaleTimeString(); // Approximation for label
            const duration = Math.max(1.0, cluster.endTime - cluster.startTime);

            return {
                id: `anomaly-${Date.now()}-${idx}`,
                elementName: `Anomaly Detected (${(cluster.minScore).toFixed(0)}% consistency)`,
                category: 'Waste',
                rating: 0,
                cycle: 1,
                startTime: cluster.startTime, // This is video time
                endTime: cluster.startTime + duration,
                duration: duration,
                note: `Detected group of ${cluster.count} low-consistency frames.`
            };
        });

        onUpdateMeasurements([...measurements, ...newMeasurements]);
        alert(`${newMeasurements.length} anomali telah ditambahkan ke timeline sebagai kategori 'Waste'.`);
        setAnomalyHistory([]); // Reset history after export
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
            {/* ... Header ... */}

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
                {/* ... Model Source Controls ... */}

                {/* Anomaly Counter & Export */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '15px',
                    background: 'rgba(255, 0, 0, 0.1)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 0, 0, 0.3)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff4b4b' }}>
                            <AlertTriangle size={18} /> Anomalies
                        </span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ff4b4b' }}>{anomalies}</span>
                    </div>
                    <button
                        onClick={handleExportAnomalies}
                        disabled={anomalies === 0}
                        style={{
                            padding: '8px',
                            backgroundColor: anomalies > 0 ? '#ff4b4b' : '#555',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: anomalies > 0 ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            fontSize: '0.85rem'
                        }}
                    >
                        <Save size={14} /> Export to Timeline
                    </button>
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
                        border: `1px solid ${isAnalyzing || isRecording ? '#00ff00' : '#666'} `
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
