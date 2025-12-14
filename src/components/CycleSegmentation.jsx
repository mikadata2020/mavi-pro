import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Camera, Play, Pause, Download, BarChart3, RefreshCw, Settings, HelpCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CycleSegmentationEngine from '../utils/cycleSegmentationEngine';
import { initializePoseDetector, detectPose, drawPoseSkeleton } from '../utils/poseDetector';
import { loadModelFromURL, loadModelFromFiles } from '../utils/teachableMachine';
import {
    saveCycleProject,
    getCycleProject,
    getAllCycleProjects,
    updateCycleProject,
    saveCycle,
    getCyclesForProject,
    deleteCycleProject
} from '../utils/cycleSegmentationDB';
import CycleTimeline from './features/CycleTimeline';

const CycleSegmentation = () => {
    const navigate = useNavigate();

    // Phase Management
    const [currentPhase, setCurrentPhase] = useState('setup'); // setup, training, segmentation, analysis

    // Video and Project State
    const [videoFile, setVideoFile] = useState(null);
    const [videoSrc, setVideoSrc] = useState(null);
    const [projectName, setProjectName] = useState('');
    const [currentProject, setCurrentProject] = useState(null);

    // AI State
    const [poseDetector, setPoseDetector] = useState(null);
    const [tmModel, setTmModel] = useState(null);
    const [useTeachableMachine, setUseTeachableMachine] = useState(false);
    const [tmModelURL, setTmModelURL] = useState('');
    const [tmModelType, setTmModelType] = useState('online');

    // Golden Cycle State
    const [goldenCycle, setGoldenCycle] = useState(null);
    const [isRecordingGolden, setIsRecordingGolden] = useState(false);
    const [recordingProgress, setRecordingProgress] = useState(0);
    const [recordingMethod, setRecordingMethod] = useState('manual'); // 'manual' or 'timeline'
    const [timelineStart, setTimelineStart] = useState(0);
    const [timelineEnd, setTimelineEnd] = useState(0);
    const [isSettingTimeline, setIsSettingTimeline] = useState(false);

    // Segmentation State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState(0);
    const [detectedCycles, setDetectedCycles] = useState([]);
    const [selectedCycles, setSelectedCycles] = useState([]);

    // Settings
    const [settings, setSettings] = useState({
        minCycleDuration: 1.0,
        threshold: 20,
        fps: 30,
        useGoldenCycle: true
    });

    // Statistics
    const [statistics, setStatistics] = useState(null);

    // Refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const engineRef = useRef(new CycleSegmentationEngine());
    const modelFileRef = useRef(null);
    const weightsFileRef = useRef(null);
    const metadataFileRef = useRef(null);
    const recordingDataRef = useRef([]);
    const recordingStartTime = useRef(null);
    const animationFrameRef = useRef(null);

    // Initialize pose detector on mount
    useEffect(() => {
        const init = async () => {
            try {
                const detector = await initializePoseDetector();
                setPoseDetector(detector);
            } catch (error) {
                console.error('Failed to initialize pose detector:', error);
                alert('⚠️ AI Pose Detection gagal diinisialisasi. Harap refresh halaman.');
            }
        };
        init();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    // Handle video upload
    const handleVideoUpload = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('video/')) {
            setVideoFile(file);
            const url = URL.createObjectURL(file);
            setVideoSrc(url);
            setProjectName(file.name.replace(/\.[^/.]+$/, '')); // Remove extension
        } else {
            alert('Harap upload file video yang valid');
        }
    };

    // Start new project
    const handleStartProject = async () => {
        if (!projectName || !videoFile) {
            alert('Harap masukkan nama project dan upload video');
            return;
        }

        try {
            const videoBlob = new Blob([await videoFile.arrayBuffer()], { type: videoFile.type });

            const projectId = await saveCycleProject({
                name: projectName,
                videoBlob: videoBlob,
                videoName: videoFile.name,
                goldenCycle: null,
                settings: settings,
                status: 'training'
            });

            setCurrentProject({ id: projectId, name: projectName });
            setCurrentPhase('training');
        } catch (error) {
            console.error('Error creating project:', error);
            alert('Gagal membuat project: ' + error.message);
        }
    };

    // OPTION 1: Manual Start/Stop Golden Cycle Recording
    const handleStartManualRecording = () => {
        if (!videoRef.current || !poseDetector) {
            alert('Video belum dimuat atau AI belum siap');
            return;
        }

        setIsRecordingGolden(true);
        recordingDataRef.current = [];
        recordingStartTime.current = videoRef.current.currentTime;
        alert('🔴 Recording dimulai! Klik "Stop Recording" setelah 1 cycle selesai.');
    };

    const handleStopManualRecording = async () => {
        if (!isRecordingGolden) return;

        setIsRecordingGolden(false);

        if (recordingDataRef.current.length === 0) {
            alert('❌ Tidak ada pose terdeteksi. Harap coba lagi.');
            return;
        }

        const goldenData = {
            frames: recordingDataRef.current,
            frameCount: recordingDataRef.current.length,
            duration: recordingDataRef.current[recordingDataRef.current.length - 1].time - recordingDataRef.current[0].time,
            startTime: recordingStartTime.current,
            endTime: videoRef.current.currentTime,
            timestamp: new Date().toISOString()
        };

        setGoldenCycle(goldenData);
        engineRef.current.setGoldenCycle(goldenData);

        // Update project
        if (currentProject) {
            await updateCycleProject(currentProject.id, {
                goldenCycle: goldenData,
                status: 'ready_for_segmentation'
            });
        }

        alert(`✅ Golden Cycle berhasil direkam! ${goldenData.frameCount} frames, ${goldenData.duration.toFixed(2)}s`);
    };

    // Continuous pose detection during manual recording
    const captureManualRecordingFrames = useCallback(async () => {
        if (!isRecordingGolden || !videoRef.current) return;

        try {
            const poses = await detectPose(videoRef.current);

            if (poses && poses.length > 0) {
                recordingDataRef.current.push({
                    time: videoRef.current.currentTime,
                    pose: poses[0],
                    keypoints: poses[0].keypoints
                });

                // Draw pose
                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    drawPoseSkeleton(ctx, poses);

                    // Draw recording indicator
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
                    ctx.beginPath();
                    ctx.arc(30, 30, 10, 0, Math.PI * 2);
                    ctx.fill();

                    // Draw elapsed time
                    const elapsed = videoRef.current.currentTime - recordingStartTime.current;
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 16px Arial';
                    ctx.fillText(`Recording: ${elapsed.toFixed(1)}s`, 50, 35);
                }
            }
        } catch (error) {
            console.error('Error capturing frame:', error);
        }

        animationFrameRef.current = requestAnimationFrame(captureManualRecordingFrames);
    }, [isRecordingGolden]);

    useEffect(() => {
        if (isRecordingGolden && recordingMethod === 'manual') {
            captureManualRecordingFrames();
        }
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isRecordingGolden, recordingMethod, captureManualRecordingFrames]);

    // OPTION 2: Timeline Selection Golden Cycle
    const handleSetTimelineStart = () => {
        if (!videoRef.current) return;
        const currentTime = videoRef.current.currentTime;
        setTimelineStart(currentTime);
        alert(`✅ Start point set at ${currentTime.toFixed(2)}s`);
    };

    const handleSetTimelineEnd = () => {
        if (!videoRef.current) return;
        const currentTime = videoRef.current.currentTime;
        if (currentTime <= timelineStart) {
            alert('❌ End time harus lebih besar dari start time!');
            return;
        }
        setTimelineEnd(currentTime);
        alert(`✅ End point set at ${currentTime.toFixed(2)}s`);
    };

    const handleAnalyzeTimelineSelection = async () => {
        if (!videoRef.current || !poseDetector) {
            alert('Video atau AI belum siap');
            return;
        }

        if (timelineEnd <= timelineStart) {
            alert('❌ Harap set start dan end point terlebih dahulu!');
            return;
        }

        setIsSettingTimeline(true);
        recordingDataRef.current = [];

        try {
            // Analyze frames between start and end
            const fps = 30;
            const duration = timelineEnd - timelineStart;
            const totalFrames = Math.floor(duration * fps);

            for (let i = 0; i < totalFrames; i++) {
                const time = timelineStart + (i / fps);
                videoRef.current.currentTime = time;

                // Wait for video to seek
                await new Promise(resolve => {
                    videoRef.current.onseeked = resolve;
                });

                const poses = await detectPose(videoRef.current);
                if (poses && poses.length > 0) {
                    recordingDataRef.current.push({
                        time: time,
                        pose: poses[0],
                        keypoints: poses[0].keypoints
                    });
                }

                // Update progress
                setRecordingProgress(Math.round((i / totalFrames) * 100));
            }

            if (recordingDataRef.current.length === 0) {
                alert('❌ Tidak ada pose terdeteksi di range tersebut.');
                setIsSettingTimeline(false);
                return;
            }

            const goldenData = {
                frames: recordingDataRef.current,
                frameCount: recordingDataRef.current.length,
                duration: duration,
                startTime: timelineStart,
                endTime: timelineEnd,
                timestamp: new Date().toISOString()
            };

            setGoldenCycle(goldenData);
            engineRef.current.setGoldenCycle(goldenData);

            // Update project
            if (currentProject) {
                await updateCycleProject(currentProject.id, {
                    goldenCycle: goldenData,
                    status: 'ready_for_segmentation'
                });
            }

            alert(`✅ Golden Cycle berhasil dianalisa! ${goldenData.frameCount} frames, ${duration.toFixed(2)}s`);
        } catch (error) {
            console.error('Error analyzing timeline:', error);
            alert('❌ Error: ' + error.message);
        } finally {
            setIsSettingTimeline(false);
            setRecordingProgress(0);
        }
    };

    // Load Teachable Machine model
    const handleLoadTMModel = async () => {
        try {
            let model;
            if (tmModelType === 'online') {
                if (!tmModelURL) {
                    alert('Harap masukkan URL model');
                    return;
                }
                model = await loadModelFromURL(tmModelURL);
            } else {
                if (!modelFileRef.current || !weightsFileRef.current || !metadataFileRef.current) {
                    alert('Harap upload semua file model');
                    return;
                }
                model = await loadModelFromFiles(
                    modelFileRef.current,
                    weightsFileRef.current,
                    metadataFileRef.current
                );
            }

            setTmModel(model);
            engineRef.current.setTeachableMachineModel(model);
            alert('✅ Model Teachable Machine berhasil dimuat!');
        } catch (error) {
            console.error('Error loading TM model:', error);
            alert('❌ Gagal memuat model: ' + error.message);
        }
    };

    // Start auto-segmentation
    const handleStartSegmentation = async () => {
        if (!goldenCycle && !tmModel) {
            alert('Harap rekam Golden Cycle atau upload Teachable Machine model terlebih dahulu');
            return;
        }

        if (!videoRef.current) {
            alert('Video belum dimuat');
            return;
        }

        setIsAnalyzing(true);
        setAnalysisProgress(0);
        setDetectedCycles([]);
        setCurrentPhase('segmentation');

        try {
            // Analyze video
            const frameData = await engineRef.current.analyzeVideo(
                videoRef.current,
                (progress) => setAnalysisProgress(Math.round(progress * 100)),
                {
                    fps: settings.fps,
                    useTeachableMachine: useTeachableMachine && tmModel !== null
                }
            );

            // Detect cycles
            const cycles = engineRef.current.detectCycles(frameData, {
                minCycleDuration: settings.minCycleDuration,
                threshold: settings.threshold,
                useGoldenCycle: settings.useGoldenCycle && goldenCycle !== null
            });

            setDetectedCycles(cycles);

            // Save cycles to database
            if (currentProject) {
                for (let i = 0; i < cycles.length; i++) {
                    await saveCycle({
                        projectId: currentProject.id,
                        cycleNumber: cycles[i].cycleNumber,
                        startTime: cycles[i].startTime,
                        endTime: cycles[i].endTime,
                        duration: cycles[i].duration,
                        avgMotion: cycles[i].avgMotion,
                        actions: cycles[i].actions,
                        similarityScore: cycles[i].similarityScore || null,
                        deviations: cycles[i].deviations || null
                    });
                }

                await updateCycleProject(currentProject.id, {
                    status: 'completed',
                    cycleCount: cycles.length
                });
            }

            // Calculate statistics
            const stats = engineRef.current.calculateStatistics(cycles);
            setStatistics(stats);

            setCurrentPhase('analysis');
            alert(`✅ Segmentasi selesai! ${cycles.length} siklus terdeteksi`);

        } catch (error) {
            console.error('Error during segmentation:', error);
            alert('❌ Gagal melakukan segmentasi: ' + error.message);
        } finally {
            setIsAnalyzing(false);
            setAnalysisProgress(0);
        }
    };

    // Export cycles to CSV
    const handleExportCSV = () => {
        if (detectedCycles.length === 0) {
            alert('Tidak ada siklus untuk di-export');
            return;
        }

        // Create CSV content
        const headers = ['Cycle Number', 'Start Time', 'End Time', 'Duration', 'Avg Motion', 'Similarity Score'];
        const rows = detectedCycles.map(cycle => [
            cycle.cycleNumber,
            cycle.startTime.toFixed(2),
            cycle.endTime.toFixed(2),
            cycle.duration.toFixed(2),
            cycle.avgMotion,
            cycle.similarityScore !== undefined ? cycle.similarityScore : 'N/A'
        ]);

        let csvContent = headers.join(',') + '\n';
        rows.forEach(row => {
            csvContent += row.join(',') + '\n';
        });

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${projectName}_cycles.csv`;
        link.click();

        alert('✅ Data berhasil di-export ke CSV');
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            backgroundColor: '#1a1a1a',
            color: '#fff',
            fontFamily: 'Inter, sans-serif'
        }}>
            {/* Header */}
            <div style={{
                padding: '15px 20px',
                backgroundColor: '#252526',
                borderBottom: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            background: 'none',
                            border: '1px solid #555',
                            color: '#fff',
                            padding: '8px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', background: 'linear-gradient(45deg, #00d2ff, #3a7bd5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            🔄 AI Cycle Segmentation
                        </h1>
                        <p style={{ margin: 0, color: '#888', fontSize: '0.85rem' }}>
                            Automatic Work Cycle Detection & Analysis
                        </p>
                    </div>
                </div>

                {/* Phase Indicators */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {['setup', 'training', 'segmentation', 'analysis'].map((phase, index) => (
                        <div key={phase} style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            backgroundColor: currentPhase === phase ? '#00d2ff' : '#333',
                            color: currentPhase === phase ? '#000' : '#888',
                            fontWeight: currentPhase === phase ? 'bold' : 'normal'
                        }}>
                            {index + 1}. {phase.charAt(0).toUpperCase() + phase.slice(1)}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
                {/* PHASE 1: SETUP */}
                {currentPhase === 'setup' && (
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <h2 style={{ color: '#00d2ff', marginBottom: '20px' }}>📁 Setup Project</h2>

                        <div style={{
                            background: '#252526',
                            padding: '30px',
                            borderRadius: '12px',
                            border: '1px solid #333'
                        }}>
                            {/* Project Name */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>
                                    Nama Project:
                                </label>
                                <input
                                    type="text"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    placeholder="Contoh: Assembly Line A - Cycle Analysis"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: '#1a1a1a',
                                        border: '1px solid #555',
                                        borderRadius: '6px',
                                        color: '#fff',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            {/* Video Upload */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>
                                    Upload Video Assembly Work:
                                </label>
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={handleVideoUpload}
                                    style={{ display: 'none' }}
                                    id="video-upload"
                                />
                                <label
                                    htmlFor="video-upload"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        padding: '50px',
                                        border: '2px dashed #555',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        backgroundColor: videoFile ? '#2a4a2a' : '#1a1a1a',
                                        transition: 'all 0.3s'
                                    }}
                                >
                                    <Upload size={30} color={videoFile ? '#4caf50' : '#888'} />
                                    <div>
                                        {videoFile ? (
                                            <>
                                                <div style={{ color: '#4caf50', fontWeight: 'bold' }}>
                                                    ✅ {videoFile.name}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#888' }}>
                                                    Klik untuk ganti video
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ color: '#888' }}>
                                                    Klik atau drag video kesini
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                                    Format: MP4, AVI, MOV, WebM
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </label>
                            </div>

                            {/* Video Preview */}
                            {videoSrc && (
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>
                                        Preview Video:
                                    </label>
                                    <video
                                        ref={videoRef}
                                        src={videoSrc}
                                        controls
                                        style={{
                                            width: '100%',
                                            borderRadius: '8px',
                                            backgroundColor: '#000'
                                        }}
                                    />
                                    <canvas
                                        ref={canvasRef}
                                        style={{ display: 'none' }}
                                        width={640}
                                        height={480}
                                    />
                                </div>
                            )}

                            {/* Start Button */}
                            <button
                                onClick={handleStartProject}
                                disabled={!projectName || !videoFile}
                                style={{
                                    width: '100%',
                                    padding: '15px',
                                    backgroundColor: (projectName && videoFile) ? '#00d2ff' : '#555',
                                    color: (projectName && videoFile) ? '#000' : '#888',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '1.1rem',
                                    fontWeight: 'bold',
                                    cursor: (projectName && videoFile) ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px'
                                }}
                            >
                                <Play size={20} />
                                Mulai Project
                            </button>
                        </div>
                    </div>
                )}

                {/* PHASE 2: TRAINING */}
                {currentPhase === 'training' && (
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <h2 style={{ color: '#00d2ff', marginBottom: '20px' }}>🎯 Model Training</h2>

                        {/* Video Preview & Status */}
                        <div style={{
                            background: '#252526',
                            padding: '20px',
                            borderRadius: '12px',
                            marginBottom: '20px',
                            border: '1px solid #333'
                        }}>
                            <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem' }}>📹 Video & AI Status</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                                {/* Video Preview */}
                                <div>
                                    {videoSrc ? (
                                        <>
                                            <video
                                                ref={videoRef}
                                                src={videoSrc}
                                                controls
                                                style={{
                                                    width: '100%',
                                                    borderRadius: '8px',
                                                    backgroundColor: '#000',
                                                    maxHeight: '300px'
                                                }}
                                            />
                                            <canvas
                                                ref={canvasRef}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    pointerEvents: 'none',
                                                    display: isRecordingGolden ? 'block' : 'none'
                                                }}
                                                width={640}
                                                height={480}
                                            />
                                        </>
                                    ) : (
                                        <div style={{
                                            padding: '50px',
                                            textAlign: 'center',
                                            backgroundColor: '#1a1a1a',
                                            borderRadius: '8px',
                                            color: '#666'
                                        }}>
                                            ⚠️ Video tidak ditemukan
                                        </div>
                                    )}
                                </div>

                                {/* Status Indicators */}
                                <div>
                                    <div style={{ marginBottom: '15px' }}>
                                        <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '8px' }}>
                                            System Status:
                                        </div>

                                        {/* Video Status */}
                                        <div style={{
                                            padding: '10px',
                                            backgroundColor: videoRef.current ? '#2a4a2a' : '#4a2a2a',
                                            borderRadius: '6px',
                                            marginBottom: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <span style={{ fontSize: '1.2rem' }}>
                                                {videoRef.current ? '✅' : '❌'}
                                            </span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: videoRef.current ? '#4caf50' : '#ff4b4b' }}>
                                                    Video {videoRef.current ? 'Ready' : 'Not Loaded'}
                                                </div>
                                                {!videoRef.current && (
                                                    <div style={{ fontSize: '0.75rem', color: '#888' }}>
                                                        Tunggu video dimuat
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* AI Status */}
                                        <div style={{
                                            padding: '10px',
                                            backgroundColor: poseDetector ? '#2a4a2a' : '#4a2a2a',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}>
                                            <span style={{ fontSize: '1.2rem' }}>
                                                {poseDetector ? '✅' : '⏳'}
                                            </span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: poseDetector ? '#4caf50' : '#ffa500' }}>
                                                    AI {poseDetector ? 'Ready' : 'Loading...'}
                                                </div>
                                                {!poseDetector && (
                                                    <div style={{ fontSize: '0.75rem', color: '#888' }}>
                                                        Initializing pose detector
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ready Indicator */}
                                    {videoRef.current && poseDetector && (
                                        <div style={{
                                            padding: '12px',
                                            backgroundColor: '#2a4a2a',
                                            borderRadius: '8px',
                                            border: '2px solid #4caf50',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ color: '#4caf50', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                🚀 Ready to Record!
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {/* Golden Cycle Method */}
                            <div style={{
                                background: '#252526',
                                padding: '20px',
                                borderRadius: '12px',
                                border: `2px solid ${!useTeachableMachine ? '#00d2ff' : '#555'}`
                            }}>
                                <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Camera size={20} />
                                    Golden Cycle Method
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '20px' }}>
                                    Rekam 1 siklus kerja sebagai referensi menggunakan AI pose detection
                                </p>

                                {/* Status: Golden Cycle Recorded */}
                                {goldenCycle ? (
                                    <div style={{
                                        padding: '15px',
                                        background: '#2a4a2a',
                                        borderRadius: '8px',
                                        marginBottom: '15px'
                                    }}>
                                        <div style={{ color: '#4caf50', fontWeight: 'bold', marginBottom: '10px' }}>
                                            ✅ Golden Cycle Terekam
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#ccc' }}>
                                            Frames: {goldenCycle.frameCount}<br />
                                            Duration: {goldenCycle.duration.toFixed(2)}s<br />
                                            {goldenCycle.startTime !== undefined && `Range: ${goldenCycle.startTime.toFixed(2)}s - ${goldenCycle.endTime.toFixed(2)}s`}
                                        </div>
                                        <button
                                            onClick={() => setGoldenCycle(null)}
                                            style={{
                                                marginTop: '10px',
                                                padding: '8px 15px',
                                                backgroundColor: '#ff4b4b',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Rekam Ulang
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Method Selection Tabs */}
                                        <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                                            <button
                                                onClick={() => setRecordingMethod('manual')}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px',
                                                    backgroundColor: recordingMethod === 'manual' ? '#00d2ff' : '#333',
                                                    color: recordingMethod === 'manual' ? '#000' : '#ccc',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontWeight: recordingMethod === 'manual' ? 'bold' : 'normal',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                ▶️ Manual Start/Stop
                                            </button>
                                            <button
                                                onClick={() => setRecordingMethod('timeline')}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px',
                                                    backgroundColor: recordingMethod === 'timeline' ? '#00d2ff' : '#333',
                                                    color: recordingMethod === 'timeline' ? '#000' : '#ccc',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontWeight: recordingMethod === 'timeline' ? 'bold' : 'normal',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                📍 Timeline Selection
                                            </button>
                                        </div>

                                        {/* Manual Start/Stop Method */}
                                        {recordingMethod === 'manual' && (
                                            <div>
                                                <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '15px' }}>
                                                    1. Play video sampai awal cycle<br />
                                                    2. Klik "Start Recording"<br />
                                                    3. Klik "Stop Recording" setelah 1 cycle selesai
                                                </p>

                                                {isRecordingGolden ? (
                                                    <>
                                                        <div style={{
                                                            padding: '10px',
                                                            backgroundColor: '#4a2a2a',
                                                            borderRadius: '6px',
                                                            marginBottom: '10px',
                                                            textAlign: 'center'
                                                        }}>
                                                            <div style={{ color: '#ff4b4b', fontWeight: 'bold', marginBottom: '5px' }}>
                                                                🔴 RECORDING...
                                                            </div>
                                                            <div style={{ fontSize: '0.8rem', color: '#ccc' }}>
                                                                Play video untuk capture pose
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={handleStopManualRecording}
                                                            style={{
                                                                width: '100%',
                                                                padding: '12px',
                                                                backgroundColor: '#ff4b4b',
                                                                color: '#fff',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                fontWeight: 'bold',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '8px'
                                                            }}
                                                        >
                                                            ⏹️ Stop Recording
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={handleStartManualRecording}
                                                        disabled={!poseDetector}
                                                        style={{
                                                            width: '100%',
                                                            padding: '12px',
                                                            backgroundColor: poseDetector ? '#00d2ff' : '#555',
                                                            color: poseDetector ? '#000' : '#888',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            fontWeight: 'bold',
                                                            cursor: poseDetector ? 'pointer' : 'not-allowed',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '8px'
                                                        }}
                                                    >
                                                        <Camera size={18} />
                                                        Start Recording
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* Timeline Selection Method */}
                                        {recordingMethod === 'timeline' && (
                                            <div>
                                                <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '15px' }}>
                                                    1. Play video sampai awal cycle → Set Start<br />
                                                    2. Play sampai akhir cycle → Set End<br />
                                                    3. Klik "Analyze Selection"
                                                </p>

                                                <div style={{ marginBottom: '10px' }}>
                                                    <div style={{ fontSize: '0.8rem', color: '#ccc', marginBottom: '5px' }}>
                                                        <strong>Selected Range:</strong> {timelineStart.toFixed(2)}s - {timelineEnd.toFixed(2)}s
                                                        {timelineEnd > timelineStart && ` (${(timelineEnd - timelineStart).toFixed(2)}s)`}
                                                    </div>
                                                </div>

                                                {isSettingTimeline && (
                                                    <div style={{ marginBottom: '10px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                            <span style={{ fontSize: '0.8rem', color: '#ccc' }}>Analyzing...</span>
                                                            <span style={{ fontSize: '0.8rem', color: '#ccc' }}>{recordingProgress}%</span>
                                                        </div>
                                                        <div style={{
                                                            width: '100%',
                                                            height: '6px',
                                                            backgroundColor: '#333',
                                                            borderRadius: '3px',
                                                            overflow: 'hidden'
                                                        }}>
                                                            <div style={{
                                                                width: `${recordingProgress}%`,
                                                                height: '100%',
                                                                backgroundColor: '#00d2ff',
                                                                transition: 'width 0.1s'
                                                            }} />
                                                        </div>
                                                    </div>
                                                )}

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                                                    <button
                                                        onClick={handleSetTimelineStart}
                                                        disabled={!videoRef.current || isSettingTimeline}
                                                        style={{
                                                            padding: '10px',
                                                            backgroundColor: timelineStart > 0 ? '#2a4a2a' : '#333',
                                                            color: '#fff',
                                                            border: '1px solid #555',
                                                            borderRadius: '6px',
                                                            cursor: (!videoRef.current || isSettingTimeline) ? 'not-allowed' : 'pointer',
                                                            fontSize: '0.85rem'
                                                        }}
                                                    >
                                                        📍 Set Start
                                                    </button>
                                                    <button
                                                        onClick={handleSetTimelineEnd}
                                                        disabled={!videoRef.current || isSettingTimeline}
                                                        style={{
                                                            padding: '10px',
                                                            backgroundColor: timelineEnd > timelineStart ? '#2a4a2a' : '#333',
                                                            color: '#fff',
                                                            border: '1px solid #555',
                                                            borderRadius: '6px',
                                                            cursor: (!videoRef.current || isSettingTimeline) ? 'not-allowed' : 'pointer',
                                                            fontSize: '0.85rem'
                                                        }}
                                                    >
                                                        📍 Set End
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={handleAnalyzeTimelineSelection}
                                                    disabled={timelineEnd <= timelineStart || !poseDetector || isSettingTimeline}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px',
                                                        backgroundColor: (timelineEnd > timelineStart && poseDetector && !isSettingTimeline) ? '#00d2ff' : '#555',
                                                        color: (timelineEnd > timelineStart && poseDetector && !isSettingTimeline) ? '#000' : '#888',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontWeight: 'bold',
                                                        cursor: (timelineEnd > timelineStart && poseDetector && !isSettingTimeline) ? 'pointer' : 'not-allowed',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px'
                                                    }}
                                                >
                                                    <BarChart3 size={18} />
                                                    {isSettingTimeline ? 'Analyzing...' : 'Analyze Selection'}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}

                                <button
                                    onClick={() => setUseTeachableMachine(false)}
                                    style={{
                                        width: '100%',
                                        marginTop: '10px',
                                        padding: '10px',
                                        backgroundColor: !useTeachableMachine ? '#00d2ff' : '#333',
                                        color: !useTeachableMachine ? '#000' : '#ccc',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {!useTeachableMachine ? '✅ ' : ''}Pilih Method Ini
                                </button>
                            </div>

                            {/* Teachable Machine Method */}
                            <div style={{
                                background: '#252526',
                                padding: '20px',
                                borderRadius: '12px',
                                border: `2px solid ${useTeachableMachine ? '#00d2ff' : '#555'}`
                            }}>
                                <h3 style={{ margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Settings size={20} />
                                    Teachable Machine
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '20px' }}>
                                    Upload custom model Anda untuk action classification
                                </p>

                                <div style={{ marginBottom: '15px' }}>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                checked={tmModelType === 'online'}
                                                onChange={() => setTmModelType('online')}
                                            />
                                            <span style={{ fontSize: '0.9rem' }}>Online URL</span>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                checked={tmModelType === 'offline'}
                                                onChange={() => setTmModelType('offline')}
                                            />
                                            <span style={{ fontSize: '0.9rem' }}>Offline Files</span>
                                        </label>
                                    </div>

                                    {tmModelType === 'online' ? (
                                        <input
                                            type="text"
                                            value={tmModelURL}
                                            onChange={(e) => setTmModelURL(e.target.value)}
                                            placeholder="https://teachablemachine.withgoogle.com/models/..."
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                backgroundColor: '#1a1a1a',
                                                border: '1px solid #555',
                                                borderRadius: '6px',
                                                color: '#fff',
                                                fontSize: '0.9rem'
                                            }}
                                        />
                                    ) : (
                                        <div style={{ fontSize: '0.85rem' }}>
                                            <div style={{ marginBottom: '8px' }}>
                                                <label>model.json: </label>
                                                <input type="file" accept=".json" onChange={(e) => modelFileRef.current = e.target.files[0]} />
                                            </div>
                                            <div style={{ marginBottom: '8px' }}>
                                                <label>weights.bin: </label>
                                                <input type="file" accept=".bin" onChange={(e) => weightsFileRef.current = e.target.files[0]} />
                                            </div>
                                            <div>
                                                <label>metadata.json: </label>
                                                <input type="file" accept=".json" onChange={(e) => metadataFileRef.current = e.target.files[0]} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleLoadTMModel}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: tmModel ? '#4caf50' : '#2196f3',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        marginBottom: '10px'
                                    }}
                                >
                                    {tmModel ? '✅ Model Loaded' : 'Load Model'}
                                </button>

                                <button
                                    onClick={() => setUseTeachableMachine(true)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        backgroundColor: useTeachableMachine ? '#00d2ff' : '#333',
                                        color: useTeachableMachine ? '#000' : '#ccc',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {useTeachableMachine ? '✅ ' : ''}Pilih Method Ini
                                </button>
                            </div>
                        </div>

                        {/* Next Button */}
                        <button
                            onClick={handleStartSegmentation}
                            disabled={(!goldenCycle && !tmModel)}
                            style={{
                                width: '100%',
                                marginTop: '20px',
                                padding: '15px',
                                backgroundColor: (goldenCycle || tmModel) ? '#00d2ff' : '#555',
                                color: (goldenCycle || tmModel) ? '#000' : '#888',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                cursor: (goldenCycle || tmModel) ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px'
                            }}
                        >
                            <Play size={20} />
                            Start Auto-Segmentation
                        </button>
                    </div>
                )}

                {/* PHASE 3: SEGMENTATION */}
                {currentPhase === 'segmentation' && (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔄</div>
                        <h2 style={{ color: '#00d2ff', marginBottom: '15px' }}>Analyzing Video...</h2>
                        <p style={{ color: '#aaa', marginBottom: '30px' }}>
                            AI sedang mendeteksi siklus kerja dari video Anda
                        </p>

                        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span>Progress:</span>
                                <span>{analysisProgress}%</span>
                            </div>
                            <div style={{
                                width: '100%',
                                height: '20px',
                                backgroundColor: '#333',
                                borderRadius: '10px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${analysisProgress}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #00d2ff, #3a7bd5)',
                                    transition: 'width 0.3s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    paddingRight: '10px'
                                }}>
                                    {analysisProgress > 10 && (
                                        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#000' }}>
                                            {analysisProgress}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PHASE 4: ANALYSIS */}
                {currentPhase === 'analysis' && (
                    <div>
                        <h2 style={{ color: '#00d2ff', marginBottom: '20px' }}>📊 Analysis Results</h2>

                        {/* Statistics Cards */}
                        {statistics && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                                <div style={{ background: '#252526', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                                    <div style={{ fontSize: '0.85rem', color: '#888' }}>Total Cycles</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00d2ff' }}>{statistics.totalCycles}</div>
                                </div>
                                <div style={{ background: '#252526', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                                    <div style={{ fontSize: '0.85rem', color: '#888' }}>Avg Duration</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4caf50' }}>{statistics.avgDuration}s</div>
                                </div>
                                <div style={{ background: '#252526', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                                    <div style={{ fontSize: '0.85rem', color: '#888' }}>Min / Max</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>{statistics.minDuration}s / {statistics.maxDuration}s</div>
                                </div>
                                <div style={{ background: '#252526', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                                    <div style={{ fontSize: '0.85rem', color: '#888' }}>Consistency</div>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: statistics.consistency > 80 ? '#4caf50' : '#ffa500' }}>
                                        {statistics.consistency}%
                                    </div>
                                </div>
                                {statistics.avgSimilarity !== null && (
                                    <div style={{ background: '#252526', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
                                        <div style={{ fontSize: '0.85rem', color: '#888' }}>Avg Similarity</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: statistics.avgSimilarity > 80 ? '#4caf50' : '#ffa500' }}>
                                            {statistics.avgSimilarity}%
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Cycles Timeline */}
                        {detectedCycles.length > 0 && (
                            <CycleTimeline
                                cycles={detectedCycles}
                                onSelectCycle={(cycle) => setSelectedCycles([cycle])}
                                selectedCycles={selectedCycles}
                            />
                        )}

                        {/* Export Button */}
                        <button
                            onClick={handleExportCSV}
                            style={{
                                marginTop: '20px',
                                padding: '12px 25px',
                                backgroundColor: '#4caf50',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <Download size={18} />
                            Export to CSV
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CycleSegmentation;
