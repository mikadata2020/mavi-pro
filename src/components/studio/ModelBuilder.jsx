import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Save, Play, Pause, Square, Layers, Settings, Eye, Plus, Trash2, Camera, Box, Video } from 'lucide-react';
import ObjectTracking from '../ObjectTracking'; // Reuse existing component for video + detection
import RuleEditor from './RuleEditor';
import { initializePoseDetector, detectPose } from '../../utils/poseDetector';
import PoseNormalizer from '../../utils/studio/PoseNormalizer';
import PoseSmoother from '../../utils/studio/PoseSmoother';
import StudioAssistant from './StudioAssistant';
import { getAllProjects } from '../../utils/database';
import InferenceEngine from '../../utils/studio/InferenceEngine';

const ModelBuilder = ({ model, onClose, onSave }) => {
    const [currentModel, setCurrentModel] = useState({
        ...model,
        states: model.statesList || [{ id: 's_start', name: 'Start' }], // Initialize with default if empty
        transitions: model.transitions || []
    });
    const [showHelp, setShowHelp] = useState(false);

    // RESTORED STATES
    const [activeTab, setActiveTab] = useState('rules'); // rules, states, test
    const [videoSrc, setVideoSrc] = useState(null);

    // IP Camera Recording States
    const [showIPCameraModal, setShowIPCameraModal] = useState(false);
    const [ipCameraURL, setIpCameraURL] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const mediaRecorderRef = useRef(null);
    const ipCameraRef = useRef(null);
    const [isDrawingROI, setIsDrawingROI] = useState(false);
    const [roiStart, setRoiStart] = useState(null);
    const [selectedStateId, setSelectedStateId] = useState(null);
    const [activePose, setActivePose] = useState(null); // Real-time pose data
    const [selectedKeypoints, setSelectedKeypoints] = useState({}); // { name: boolean }

    const KEYPOINT_NAMES = [
        "nose", "left_eye_inner", "left_eye", "left_eye_outer", "right_eye_inner", "right_eye", "right_eye_outer",
        "left_ear", "right_ear", "mouth_left", "mouth_right", "left_shoulder", "right_shoulder",
        "left_elbow", "right_elbow", "left_wrist", "right_wrist", "left_pinky", "right_pinky",
        "left_index", "right_index", "left_thumb", "right_thumb", "left_hip", "right_hip",
        "left_knee", "right_knee", "left_ankle", "right_ankle", "left_heel", "right_heel",
        "left_foot_index", "right_foot_index"
    ];

    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // Initialize Smoother with alpha=0.5 (Adjustable)
    // 0.1 = Very smooth (slow), 0.9 = Very responsive (jittery)
    const smootherRef = useRef(new PoseSmoother(0.5));
    const engineRef = useRef(null);
    const [testLogs, setTestLogs] = useState([]);
    const [timelineData, setTimelineData] = useState([]);
    const [currentTestState, setCurrentTestState] = useState(null);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setVideoSrc(url);
            smootherRef.current.reset(); // Reset smoothing history on new file
        }
    };

    // IP Camera Recording Handlers
    const handleStartRecording = async () => {
        if (!ipCameraRef.current) return;

        try {
            // Create canvas to capture frames from img element
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = ipCameraRef.current.naturalWidth || 640;
            canvas.height = ipCameraRef.current.naturalHeight || 480;

            // Capture frames at 30fps
            const stream = canvas.captureStream(30);
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp9'
            });

            const chunks = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                setVideoSrc(url);
                setShowIPCameraModal(false);
                setIsRecording(false);
                setRecordingDuration(0);
            };

            // Draw frames from img to canvas
            const drawFrame = () => {
                if (isRecording && ipCameraRef.current) {
                    ctx.drawImage(ipCameraRef.current, 0, 0, canvas.width, canvas.height);
                    requestAnimationFrame(drawFrame);
                }
            };

            mediaRecorder.start();
            mediaRecorderRef.current = mediaRecorder;
            setIsRecording(true);
            setRecordedChunks(chunks);
            drawFrame();

            // Auto-stop after duration
            const durationTimer = setInterval(() => {
                setRecordingDuration(prev => {
                    const newDuration = prev + 1;
                    if (newDuration >= 30) { // Max 30 seconds
                        handleStopRecording();
                        clearInterval(durationTimer);
                    }
                    return newDuration;
                });
            }, 1000);
        } catch (error) {
            console.error('Recording error:', error);
            alert('Failed to start recording: ' + error.message);
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
        }
    };

    // Continuous Detection Loop for UI Visualization
    useEffect(() => {
        let animationFrameId;

        const detectLoop = async () => {
            if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
                const poses = await detectPose(videoRef.current);
                if (poses && poses.length > 0) {
                    const originalKeypoints = poses[0].keypoints;

                    // Apply Smoothing
                    const smoothedKeypoints = smootherRef.current.smooth(originalKeypoints);
                    const smoothedPose = { ...poses[0], keypoints: smoothedKeypoints };

                    // Update active pose with smoothed data
                    setActivePose(smoothedPose);

                    // TEST MODE EXECUTION
                    if (activeTab === 'test') {
                        // Initialize Engine if needed (or if model changed, ideally we reset)
                        if (!engineRef.current) {
                            engineRef.current = new InferenceEngine();
                            engineRef.current.loadModel(currentModel);
                            console.log("Test Engine Started with Model:", currentModel.name);
                        }

                        // Run Engine
                        // We use a dummy ID 'tester' since we are testing on a single person video
                        // The engine expects array of poses.
                        // We need to verify if Engine handles single pose mapping nicely.
                        // Assuming processFrame handles tracking.
                        engineRef.current.processFrame([smoothedPose], [], videoRef.current.currentTime);

                        // Update UI
                        const logs = engineRef.current.getLogs();
                        if (logs.length !== testLogs.length) {
                            setTestLogs([...logs]);
                        }

                        // Update Timeline Data
                        if (engineRef.current.timelineEvents) {
                            // Copy events
                            // Also add the "current active" event which is incomplete
                            const activeEvents = [];
                            engineRef.current.activeTracks.forEach((track, id) => {
                                activeEvents.push({
                                    state: track.currentState,
                                    startTime: track.enterTime,
                                    endTime: videoRef.current.currentTime, // Current time as end
                                    isActive: true
                                });
                            });

                            setTimelineData([...engineRef.current.timelineEvents, ...activeEvents]);
                        }

                        // Visualize Current State
                        // Map tracks to find our person
                        // Engine tracks ID is usually 'p_1' etc.
                        // Let's iterate values
                        const iterator = engineRef.current.tracks.values();
                        const firstTrack = iterator.next().value;
                        if (firstTrack) {
                            setCurrentTestState(firstTrack.currentState);
                        }
                    }
                }
                animationFrameId = requestAnimationFrame(detectLoop);
            }
        };

        if (videoRef.current) {
            videoRef.current.addEventListener('play', detectLoop);
            videoRef.current.addEventListener('pause', () => cancelAnimationFrame(animationFrameId));
            videoRef.current.addEventListener('seeked', async () => {
                const poses = await detectPose(videoRef.current);
                if (poses && poses.length > 0) {
                    // Even on seek, we smooth, but might want to reset if jump is large. 
                    // For now, simple smooth is fine as history will converge quickly.
                    const smoothed = smootherRef.current.smooth(poses[0].keypoints);
                    setActivePose({ ...poses[0], keypoints: smoothed });
                }
            });
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [videoSrc]);

    // Reset Engine when switching tabs
    useEffect(() => {
        if (activeTab !== 'test') {
            engineRef.current = null;
            setTestLogs([]);
            setCurrentTestState(null);
        }
    }, [activeTab]);

    const handleSave = () => {
        // Prepare model object with all required fields for the engine
        const modelToSave = {
            ...currentModel,
            statesList: currentModel.states, // Persist full state objects
            states: currentModel.states.length, // Update count for dashboard
            rules: currentModel.transitions.length, // Update count for dashboard
            updated: new Date().toISOString().split('T')[0]
        };
        onSave(modelToSave);
    };

    // State Management
    const handleAddState = () => {
        const newState = {
            id: `s_${Date.now()}`,
            name: `State ${currentModel.states.length + 1}`,
            minDuration: 1.0,
            roi: null,
            referencePose: null
        };
        setCurrentModel(prev => ({
            ...prev,
            states: [...prev.states, newState]
        }));
    };

    const handleDeleteState = (stateId) => {
        if (currentModel.states.length <= 1) {
            alert("At least one state determines the model.");
            return;
        }
        setCurrentModel(prev => ({
            ...prev,
            states: prev.states.filter(s => s.id !== stateId),
            // Remove transitions connected to this state
            transitions: prev.transitions.filter(t => t.from !== stateId && t.to !== stateId)
        }));
    };

    const [showProjectPicker, setShowProjectPicker] = useState(false);
    const [availableProjects, setAvailableProjects] = useState([]);

    const handleOpenProjectPicker = async () => {
        try {
            const projects = await getAllProjects();
            setAvailableProjects(projects);
            setShowProjectPicker(true);
        } catch (error) {
            console.error("Failed to load projects:", error);
            alert("Gagal memuat daftar project.");
        }
    };

    const handleSelectProject = (project) => {
        if (project.videoBlob) {
            const url = URL.createObjectURL(project.videoBlob);
            setVideoSrc(url);
            setCurrentModel(prev => ({ ...prev, name: project.projectName + " Model" }));
            setShowProjectPicker(false);
        } else {
            alert("Project ini tidak memiliki data video.");
        }
    };

    const handleUpdateStateName = (id, newName) => {
        setCurrentModel(prev => ({
            ...prev,
            states: prev.states.map(s => s.id === id ? { ...s, name: newName } : s)
        }));
    };

    const handleUpdateState = (id, field, value) => {
        setCurrentModel(prev => ({
            ...prev,
            states: prev.states.map(s => s.id === id ? { ...s, [field]: value } : s)
        }));
    };

    // Capture Logic
    const handleCaptureReference = async () => {
        if (!videoRef.current || !selectedStateId) {
            alert("Please select a state and ensure video is loaded.");
            return;
        }

        await initializePoseDetector(); // Ensure loaded
        const poses = await detectPose(videoRef.current);

        if (poses && poses.length > 0) {
            const pose = poses[0];

            // We store the RAW reference pose. 
            // The Inference Engine will handle normalization (Body-Centric) during comparison 
            // if strict matching is enabled.
            handleUpdateState(selectedStateId, 'referencePose', pose.keypoints);
            handleUpdateState(selectedStateId, 'referenceImage', videoRef.current.currentTime);
            alert("Reference pose captured!");
        } else {
            alert("No pose detected. Make sure person is visible.");
        }
    };

    // ROI Logic
    const startDrawingROI = (e) => {
        if (!isDrawingROI || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        setRoiStart({ x, y });
    };

    const drawROI = (e) => {
        if (!isDrawingROI || !roiStart || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const currentX = (e.clientX - rect.left) / rect.width;
        const currentY = (e.clientY - rect.top) / rect.height;

        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            roiStart.x * canvasRef.current.width,
            roiStart.y * canvasRef.current.height,
            (currentX - roiStart.x) * canvasRef.current.width,
            (currentY - roiStart.y) * canvasRef.current.height
        );
    };

    const endDrawingROI = (e) => {
        if (!isDrawingROI || !roiStart || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const currentX = (e.clientX - rect.left) / rect.width;
        const currentY = (e.clientY - rect.top) / rect.height;

        const newROI = {
            x: Math.min(roiStart.x, currentX),
            y: Math.min(roiStart.y, currentY),
            width: Math.abs(currentX - roiStart.x),
            height: Math.abs(currentY - roiStart.y)
        };

        handleUpdateState(selectedStateId, 'roi', newROI);
        setRoiStart(null);
        setIsDrawingROI(false);
    };

    // Transition Management
    const handleAddTransition = (fromId, toId) => {
        const newTransition = {
            id: `t_${Date.now()}`,
            from: fromId,
            to: toId,
            condition: {
                rules: [] // Array of rule objects (AND logic)
            }
        };
        setCurrentModel(prev => ({
            ...prev,
            transitions: [...prev.transitions, newTransition]
        }));
    };

    const handleDeleteTransition = (id) => {
        setCurrentModel(prev => ({
            ...prev,
            transitions: prev.transitions.filter(t => t.id !== id)
        }));
    };

    const handleUpdateTransition = (id, updates) => {
        setCurrentModel(prev => ({
            ...prev,
            transitions: prev.transitions.map(t => t.id === id ? { ...t, ...updates } : t)
        }));
    };

    const HelpModal = () => (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                backgroundColor: '#1f2937', color: 'white', padding: '30px',
                borderRadius: '12px', maxWidth: '800px', width: '90%',
                maxHeight: '85vh', overflowY: 'auto', border: '1px solid #374151',
                position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            }}>
                <button
                    onClick={() => setShowHelp(false)}
                    style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
                >
                    ✕ Close
                </button>

                <h2 style={{ marginBottom: '20px', borderBottom: '1px solid #374151', paddingBottom: '10px' }}>
                    Panduan Studio Model (Motion Rules)
                </h2>

                <div style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>
                    <p>Sistem ini dirancang untuk membuat <strong>"Aturan Gerakan" (Motion Rules)</strong> tanpa koding, menggunakan logika <strong>Finite State Machine (FSM)</strong>.</p>

                    <h3 style={{ color: '#60a5fa', marginTop: '20px' }}>1. Konsep Dasar: State Machine (FSM)</h3>
                    <p>Bayangkan pekerjaan sebagai serangkaian "Status" (Steps).</p>
                    <ul style={{ marginLeft: '20px', listStyleType: 'disc', color: '#d1d5db' }}>
                        <li>Contoh: <code>Diam</code> → <code>Ambil Barang</code> → <code>Pasang</code> → <code>Selesai</code>.</li>
                        <li>Tugas Anda adalah mendefinisikan <strong>KAPAN</strong> sistem harus pindah antar status tersebut.</li>
                    </ul>

                    <h3 style={{ color: '#60a5fa', marginTop: '20px' }}>2. Workflow Pembuatan Model</h3>

                    <div style={{ backgroundColor: '#111827', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
                        <strong style={{ color: '#eab308' }}>Tahap A: Siapkan Data (Tab "Pose Data")</strong>
                        <ol style={{ marginLeft: '20px', marginTop: '5px', color: '#d1d5db' }}>
                            <li>Upload video referensi operator.</li>
                            <li>Buka tab <strong>Pose Data (33)</strong>.</li>
                            <li>Lihat nilai <strong>X/Y</strong> real-time dari 33 titik tubuh saat gerakan terjadi.</li>
                            <li><em>Tips:</em> Perhatikan nilai saat transisi terjadi (misal: Saat tangan diangkat, <code>wrist.y</code> menjadi lebih kecil dari <code>nose.y</code>).</li>
                        </ol>
                    </div>

                    <div style={{ backgroundColor: '#111827', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
                        <strong style={{ color: '#eab308' }}>Tahap B: Buat State (Tab "States")</strong>
                        <ol style={{ marginLeft: '20px', marginTop: '5px', color: '#d1d5db' }}>
                            <li>Buat State baru, misal: <strong>"Idle"</strong> dan <strong>"Lifting"</strong>.</li>
                            <li>(Opsional) Gambar <strong>ROI</strong> (Kotak Hijau) di video untuk menandai area kerja.</li>
                            <li>(Opsional) Klik <strong>Capture Frame</strong> untuk menyimpan pose referensi.</li>
                        </ol>
                    </div>

                    <div style={{ backgroundColor: '#111827', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
                        <strong style={{ color: '#eab308' }}>Tahap C: Buat Aturan (Tab "Rules & Logic")</strong>
                        <ol style={{ marginLeft: '20px', marginTop: '5px', color: '#d1d5db' }}>
                            <li>Hubungkan State: Pilih <strong>From: Idle</strong> → <strong>To: Lifting</strong>.</li>
                            <li>Klik <strong>+ Add Rule</strong> pada transisi tersebut.</li>
                            <li>Pilih Tipe Rule <strong>"Point Relation"</strong>.</li>
                            <li>Contoh Logika: <code>Right Wrist (y)</code> <code>&lt;</code> <code>Nose (y)</code>.</li>
                            <li><em>Artinya:</em> "Pindah ke Lifting JIKA Pergelangan Tangan LEBIH TINGGI dari Hidung".</li>
                        </ol>
                    </div>

                    <h3 style={{ color: '#60a5fa', marginTop: '20px' }}>3. Saat Dijalankan (Live Engine)</h3>
                    <p>Sistem akan memantau CCTV/Webcam secara terus menerus. Jika operator melakukan gerakan yang memenuhi syarat Rule (misal: mengangkat tangan), sistem otomatis pindah Status dan mencatat <strong>Cycle Time</strong> secara akurat.</p>

                    <h3 style={{ color: '#60a5fa', marginTop: '20px' }}>4. Tipe Rule (Aturan)</h3>
                    <ul style={{ marginLeft: '20px', listStyleType: 'disc', color: '#d1d5db' }}>
                        <li><strong>Pose Angle:</strong> Sudut sendi (Contoh: Siku &lt; 90).</li>
                        <li><strong>Pose Relation:</strong> Posisi relatif (Wrist Y &lt; Shoulder Y).</li>
                        <li><strong>Pose Velocity:</strong> Kecepatan gerak (Speed &gt; 0.5).</li>
                        <li><strong>Object Proximity:</strong> Jarak ke alat/part.</li>
                    </ul>

                    <h3 style={{ color: '#60a5fa', marginTop: '20px' }}>5. 📚 Contoh Skenario: Deteksi Pengangkatan Aman</h3>
                    <div style={{ backgroundColor: '#111827', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
                        <p style={{ marginBottom: '8px' }}><strong>Tujuan:</strong> Pastikan Jongkok (Squat) sebelum Angkat.</p>
                        <ul style={{ paddingLeft: '20px', color: '#d1d5db' }}>
                            <li><strong>Setup:</strong> Mode <em>Body-Centric</em>.</li>
                            <li><strong>State Jongkok:</strong> <code>Hip Y</code> &gt; <code>Knee Y</code> (Hysteresis 0.5s).</li>
                            <li><strong>State Angkat:</strong> <code>Wrist Velocity</code> &gt; 0.5.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );

    const styles = {
        container: {
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#111827',
            color: 'white',
            fontFamily: 'Inter, sans-serif'
        },
        header: {
            height: '64px',
            borderBottom: '1px solid #374151',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            backgroundColor: '#1f2937'
        },
        headerLeft: {
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
        },
        backButton: {
            background: 'transparent',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center'
        },
        titleInput: {
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            outline: 'none',
            width: '300px'
        },
        saveButton: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            background: '#2563eb',
            borderRadius: '8px',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600'
        },
        workspace: {
            flex: 1,
            display: 'grid',
            gridTemplateColumns: '1fr 450px', // Wider right panel for RuleEditor
            overflow: 'hidden'
        },
        leftPanel: {
            borderRight: '1px solid #374151',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            backgroundColor: '#000'
        },
        uploadOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: videoSrc ? 'none' : 'flex'
        },
        uploadButton: {
            padding: '12px 24px',
            background: '#374151',
            border: '1px solid #4b5563',
            borderRadius: '8px',
            color: 'white',
            cursor: 'pointer',
            marginTop: '16px'
        },
        rightPanel: {
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#1f2937',
            borderLeft: '1px solid #374151'
        },
        tabs: {
            display: 'flex',
            borderBottom: '1px solid #374151'
        },
        tab: (isActive) => ({
            flex: 1,
            padding: '16px',
            textAlign: 'center',
            background: isActive ? '#111827' : 'transparent',
            color: isActive ? '#60a5fa' : '#9ca3af',
            cursor: 'pointer',
            borderBottom: isActive ? '2px solid #60a5fa' : 'none',
            fontWeight: isActive ? '600' : 'normal',
            fontSize: '0.9rem'
        }),
        content: {
            flex: 1,
            padding: '24px',
            overflowY: 'auto'
        }
    };

    return (
        <div style={styles.container}>
            <StudioAssistant model={currentModel} />
            {showHelp && <HelpModal />}
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.headerLeft}>
                    {/* ... back button and title input ... */}
                    <button
                        style={styles.backButton}
                        onClick={onClose}
                        onMouseOver={(e) => e.currentTarget.style.background = '#374151'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <input
                        value={currentModel.name}
                        onChange={(e) => setCurrentModel({ ...currentModel, name: e.target.value })}
                        style={styles.titleInput}
                    />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        style={{ ...styles.saveButton, background: '#4b5563' }}
                        onClick={() => setShowHelp(true)}
                    >
                        ? Help Guide
                    </button>
                    <button style={styles.saveButton} onClick={handleSave}>
                        <Save size={18} />
                        Save Model
                    </button>
                </div>
            </div>

            {/* ... rest of the component ... */}


            {/* Workspace */}
            <div style={styles.workspace}>
                {/* Left Panel: Video & Detection */}
                <div style={styles.leftPanel}>
                    {/* Custom Video Player with ROI Canvas */}
                    <div style={{
                        flex: 1,
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'black',
                        overflow: 'hidden'
                    }}>
                        {videoSrc ? (
                            <>
                                <video
                                    ref={videoRef}
                                    src={videoSrc}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        display: 'block'
                                    }}
                                    controls
                                    onLoadedMetadata={() => {
                                        if (canvasRef.current && videoRef.current) {
                                            canvasRef.current.width = videoRef.current.clientWidth;
                                            canvasRef.current.height = videoRef.current.clientHeight;
                                        }
                                    }}
                                />
                                <canvas
                                    ref={canvasRef}
                                    onMouseDown={startDrawingROI}
                                    onMouseMove={drawROI}
                                    onMouseUp={endDrawingROI}
                                    style={{
                                        position: 'absolute',
                                        top: 0, left: 0, right: 0, bottom: 0,
                                        width: '100%', height: '100%',
                                        pointerEvents: isDrawingROI ? 'auto' : 'none',
                                        cursor: isDrawingROI ? 'crosshair' : 'default',
                                        zIndex: 10
                                    }}
                                />
                                {activeTab === 'states' && selectedStateId && (
                                    <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 20 }}>
                                        {/* Optional overlay indicators */}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={styles.uploadOverlay}>
                                {/* Show upload logic if no video */}
                                <h3 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Upload Reference Video</h3>
                                <p style={{ color: '#9ca3af' }}>Upload a video to start defining motion rules</p>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                    <button
                                        style={styles.uploadButton}
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        📁 Upload File
                                    </button>
                                    <button
                                        style={{ ...styles.uploadButton, background: '#2563eb', border: '1px solid #3b82f6' }}
                                        onClick={handleOpenProjectPicker}
                                    >
                                        📽️ Select from Project
                                    </button>
                                    <button
                                        style={{ ...styles.uploadButton, background: '#10b981', border: '1px solid #059669' }}
                                        onClick={() => setShowIPCameraModal(true)}
                                    >
                                        📹 Record from IP Camera
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Project Picker Modal */}
                        {showProjectPicker && (
                            <div style={{
                                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <div style={{
                                    backgroundColor: '#1f2937', padding: '24px', borderRadius: '12px',
                                    width: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <h3 style={{ color: 'white', margin: 0 }}>Select Project Video</h3>
                                        <button onClick={() => setShowProjectPicker(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>✕</button>
                                    </div>
                                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {availableProjects.length === 0 ? (
                                            <p style={{ color: '#9ca3af', textAlign: 'center' }}>No projects found.</p>
                                        ) : (
                                            availableProjects.map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => handleSelectProject(p)}
                                                    style={{
                                                        padding: '12px', borderRadius: '8px', backgroundColor: '#374151',
                                                        cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#374151'}
                                                >
                                                    <div>
                                                        <div style={{ color: 'white', fontWeight: 'bold' }}>{p.projectName}</div>
                                                        <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{new Date(p.createdAt).toLocaleDateString()}</div>
                                                    </div>
                                                    <div style={{ color: '#60a5fa' }}>Select</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* IP Camera Recording Modal */}
                        {showIPCameraModal && (
                            <div style={{
                                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 2000,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <div style={{
                                    backgroundColor: '#1f2937', padding: '24px', borderRadius: '12px',
                                    width: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                                    border: '1px solid #374151'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <h3 style={{ color: 'white', margin: 0 }}>📹 Record from IP Camera</h3>
                                        <button
                                            onClick={() => {
                                                setShowIPCameraModal(false);
                                                setIpCameraURL('');
                                                setIsRecording(false);
                                            }}
                                            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.2rem' }}
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    {/* URL Input */}
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', color: '#9ca3af', marginBottom: '8px', fontSize: '0.9rem' }}>
                                            Camera Stream URL (MJPEG/HTTP)
                                        </label>
                                        <input
                                            type="text"
                                            value={ipCameraURL}
                                            onChange={(e) => setIpCameraURL(e.target.value)}
                                            placeholder="http://192.168.1.100/mjpeg"
                                            style={{
                                                width: '100%', padding: '10px', backgroundColor: '#111827',
                                                border: '1px solid #374151', borderRadius: '6px', color: 'white',
                                                outline: 'none'
                                            }}
                                            disabled={isRecording}
                                        />
                                    </div>

                                    {/* Live Preview */}
                                    <div style={{
                                        backgroundColor: '#000', borderRadius: '8px', marginBottom: '16px',
                                        height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        border: '1px solid #374151', position: 'relative', overflow: 'hidden'
                                    }}>
                                        {ipCameraURL ? (
                                            <>
                                                <img
                                                    ref={ipCameraRef}
                                                    src={ipCameraURL}
                                                    alt="IP Camera Feed"
                                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                                    crossOrigin="anonymous"
                                                />
                                                {isRecording && (
                                                    <div style={{
                                                        position: 'absolute', top: '10px', left: '10px',
                                                        backgroundColor: 'rgba(239, 68, 68, 0.9)', padding: '8px 12px',
                                                        borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px',
                                                        color: 'white', fontWeight: 'bold'
                                                    }}>
                                                        <div style={{
                                                            width: '12px', height: '12px', borderRadius: '50%',
                                                            backgroundColor: 'white', animation: 'pulse 1s infinite'
                                                        }} />
                                                        REC {recordingDuration}s / 30s
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div style={{ color: '#6b7280', textAlign: 'center' }}>
                                                <Camera size={48} style={{ marginBottom: '8px', opacity: 0.5 }} />
                                                <p>Enter camera URL to preview</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Recording Controls */}
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {!isRecording ? (
                                            <button
                                                onClick={handleStartRecording}
                                                disabled={!ipCameraURL}
                                                style={{
                                                    flex: 1, padding: '12px', backgroundColor: ipCameraURL ? '#10b981' : '#374151',
                                                    color: 'white', border: 'none', borderRadius: '8px',
                                                    fontWeight: 'bold', cursor: ipCameraURL ? 'pointer' : 'not-allowed',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                                }}
                                            >
                                                <Play size={18} /> Start Recording
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleStopRecording}
                                                style={{
                                                    flex: 1, padding: '12px', backgroundColor: '#ef4444',
                                                    color: 'white', border: 'none', borderRadius: '8px',
                                                    fontWeight: 'bold', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                                }}
                                            >
                                                <Square size={18} /> Stop Recording
                                            </button>
                                        )}
                                    </div>

                                    <p style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '12px', marginBottom: 0 }}>
                                        💡 Tip: Recording will automatically stop after 30 seconds. Make sure the camera URL is accessible.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* VISUAL TIMELINE (Test Mode) */}
                    {videoSrc && activeTab === 'test' && (
                        <div style={{
                            height: '50px',
                            backgroundColor: '#111827',
                            borderTop: '1px solid #374151',
                            padding: '5px 10px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '0.7rem', color: '#9ca3af' }}>
                                <span>00:00</span>
                                <span>Timeline Visualization</span>
                                {videoRef.current && <span>{videoRef.current.duration?.toFixed(2)}s</span>}
                            </div>
                            <div style={{
                                height: '24px',
                                backgroundColor: '#374151',
                                position: 'relative',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                cursor: 'pointer'
                            }}
                                onClick={(e) => {
                                    // Global seek on bar click
                                    if (!videoRef.current) return;
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const pct = x / rect.width;
                                    videoRef.current.currentTime = pct * videoRef.current.duration;
                                }}
                            >
                                {timelineData.map((event, idx) => {
                                    const duration = videoRef.current ? videoRef.current.duration : 1;
                                    if (!duration) return null;

                                    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                                    const colorIdx = (typeof event.state === 'string' ? event.state.length : 0) % colors.length;
                                    // Simple deterministic color

                                    const left = (event.startTime / duration) * 100;
                                    let width = ((event.endTime - event.startTime) / duration) * 100;
                                    if (width < 0.5) width = 0.5; // Min width visibility

                                    return (
                                        <div
                                            key={idx}
                                            style={{
                                                position: 'absolute',
                                                left: `${left}%`,
                                                width: `${width}%`,
                                                height: '100%',
                                                backgroundColor: colors[colorIdx],
                                                opacity: event.isActive ? 1 : 0.8,
                                                borderRight: '1px solid rgba(0,0,0,0.2)',
                                                fontSize: '0.6rem',
                                                color: 'white',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                paddingLeft: '2px',
                                                lineHeight: '24px'
                                            }}
                                            title={`${event.state}: ${event.startTime.toFixed(2)}s - ${event.endTime.toFixed(2)}s`}
                                        >
                                            {width > 5 && event.state}
                                        </div>
                                    );
                                })}
                                {/* Playhead Indicator */}
                                <div style={{
                                    position: 'absolute',
                                    left: `${(videoRef.current?.currentTime / (videoRef.current?.duration || 1)) * 100}%`,
                                    top: 0, bottom: 0, width: '2px', backgroundColor: 'white', zIndex: 10,
                                    boxShadow: '0 0 4px rgba(0,0,0,0.5)'
                                }} />
                            </div>
                        </div>
                    )}    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="video/*"
                        onChange={handleFileUpload}
                    />
                </div>

                {/* Right Panel: Editor */}
                <div style={styles.rightPanel}>
                    <div style={styles.tabs}>
                        <div
                            style={styles.tab(activeTab === 'rules')}
                            onClick={() => setActiveTab('rules')}
                        >
                            Rules & Logic
                        </div>
                        <div
                            style={styles.tab(activeTab === 'states')}
                            onClick={() => setActiveTab('states')}
                        >
                            States ({currentModel.states.length})
                        </div>
                        <div
                            style={styles.tab(activeTab === 'extraction')}
                            onClick={() => setActiveTab('extraction')}
                        >
                            Pose Data (33)
                        </div>
                        <div
                            style={styles.tab(activeTab === 'settings')}
                            onClick={() => setActiveTab('settings')}
                        >
                            Settings
                        </div>
                        <div
                            style={{ ...styles.tab(activeTab === 'test'), color: activeTab === 'test' ? '#eab308' : '#9ca3af', borderBottom: activeTab === 'test' ? '2px solid #eab308' : 'none' }}
                            onClick={() => setActiveTab('test')}
                        >
                            ▶ Test Run
                        </div>
                    </div>

                    <div style={styles.content}>
                        {activeTab === 'test' && (
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div style={{
                                    padding: '20px',
                                    backgroundColor: currentTestState ? '#064e3b' : '#374151',
                                    borderRadius: '12px',
                                    marginBottom: '20px',
                                    textAlign: 'center',
                                    border: currentTestState ? '2px solid #10b981' : '1px solid #4b5563',
                                    transition: 'all 0.3s'
                                }}>
                                    <h4 style={{ margin: 0, color: '#9ca3af', fontSize: '0.9rem', uppercase: true }}>Current State</h4>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', marginTop: '8px' }}>
                                        {currentTestState || "Waiting..."}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#d1d5db', marginTop: '4px' }}>
                                        {currentTestState ? "Logic matched" : "Play video to test"}
                                    </div>
                                </div>

                                <h3 style={{ marginBottom: '10px' }}>Test Console</h3>
                                <div style={{
                                    flex: 1,
                                    backgroundColor: '#000',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    overflowY: 'auto',
                                    fontFamily: 'monospace',
                                    fontSize: '0.85rem'
                                }}>
                                    {testLogs.length === 0 && <span style={{ color: '#6b7280' }}>System ready. Press Play on video to start simulation.</span>}
                                    {testLogs.map((log, i) => (
                                        <div key={i} style={{
                                            marginBottom: '4px',
                                            color: log.type === 'transition' ? '#10b981' : '#d1d5db',
                                            borderBottom: '1px solid #1f2937',
                                            paddingBottom: '2px'
                                        }}>
                                            <span style={{ color: '#6b7280' }}>[{log.timestamp}]</span> {log.message}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {activeTab === 'rules' && (
                            <RuleEditor
                                states={currentModel.states}
                                transitions={currentModel.transitions}
                                onAddTransition={handleAddTransition}
                                onDeleteTransition={handleDeleteTransition}
                                onUpdateTransition={handleUpdateTransition}
                            />
                        )}

                        {activeTab === 'states' && (
                            <div>
                                <h3 style={{ marginBottom: '16px' }}>Defined States</h3>
                                {selectedStateId ? (
                                    // Detailed View for Selected State
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <button onClick={() => setSelectedStateId(null)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <ArrowLeft size={14} /> Back to List
                                        </button>

                                        {/* State Name */}
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>State Name</label>
                                            <input
                                                value={currentModel.states.find(s => s.id === selectedStateId)?.name || ''}
                                                onChange={(e) => handleUpdateStateName(selectedStateId, e.target.value)}
                                                style={{ width: '100%', padding: '8px', background: '#111827', border: '1px solid #374151', color: 'white', borderRadius: '4px' }}
                                            />
                                        </div>

                                        {/* Duration */}
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '4px' }}>Min Duration (s)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={currentModel.states.find(s => s.id === selectedStateId)?.minDuration || 0}
                                                onChange={(e) => handleUpdateState(selectedStateId, 'minDuration', parseFloat(e.target.value))}
                                                style={{ width: '100%', padding: '8px', background: '#111827', border: '1px solid #374151', color: 'white', borderRadius: '4px' }}
                                            />
                                        </div>

                                        {/* ROI Config */}
                                        <div style={{ border: '1px solid #374151', padding: '12px', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>ROI: {currentModel.states.find(s => s.id === selectedStateId)?.roi ? 'Defined' : 'None'}</span>
                                                <button
                                                    onClick={() => setIsDrawingROI(!isDrawingROI)}
                                                    style={{
                                                        background: isDrawingROI ? '#eab308' : '#374151',
                                                        color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', gap: '5px', alignItems: 'center'
                                                    }}
                                                >
                                                    <Box size={14} /> {isDrawingROI ? 'Drawing...' : 'Draw ROI'}
                                                </button>
                                            </div>
                                            <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: 0 }}>
                                                Draw a box on the video to define the valid area for this step.
                                            </p>
                                        </div>

                                        {/* Reference Pose Config */}
                                        <div style={{ border: '1px solid #374151', padding: '12px', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Pose Reference</span>
                                                <button
                                                    onClick={handleCaptureReference}
                                                    style={{
                                                        background: '#059669',
                                                        color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', gap: '5px', alignItems: 'center'
                                                    }}
                                                >
                                                    <Camera size={14} /> Capture Frame
                                                </button>
                                            </div>
                                            {currentModel.states.find(s => s.id === selectedStateId)?.referencePose && (
                                                <p style={{ color: '#10b981', fontSize: '0.8rem', margin: 0 }}>✓ Reference Pose Captured</p>
                                            )}
                                        </div>

                                    </div>
                                ) : (
                                    // List View
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {currentModel.states.map((state, idx) => (
                                            <div key={state.id}
                                                onClick={() => setSelectedStateId(state.id)}
                                                style={{
                                                    padding: '12px',
                                                    background: '#111827',
                                                    borderRadius: '8px',
                                                    border: '1px solid #374151',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.background = '#1f2937'}
                                                onMouseOut={(e) => e.currentTarget.style.background = '#111827'}
                                            >
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    <span style={{ background: '#374151', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>{idx + 1}</span>
                                                    <span style={{ fontWeight: '500' }}>{state.name}</span>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteState(state.id); }}
                                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                                    disabled={idx === 0}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={handleAddState}
                                            style={{
                                                width: '100%',
                                                padding: '12px',
                                                marginTop: '16px',
                                                background: 'rgba(37, 99, 235, 0.1)',
                                                color: '#60a5fa',
                                                border: '1px dashed #2563eb',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                fontWeight: '500'
                                            }}
                                        >
                                            <Plus size={16} /> Add Next Step
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div>
                                <h3 style={{ marginBottom: '16px' }}>Model Settings</h3>

                                <div style={{ marginBottom: '24px', padding: '16px', background: '#111827', borderRadius: '8px', border: '1px solid #374151' }}>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: 'white' }}>Coordinate System</label>
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="coordSystem"
                                                value="screen"
                                                checked={currentModel.coordinateSystem === 'screen'}
                                                onChange={() => setCurrentModel(m => ({ ...m, coordinateSystem: 'screen' }))}
                                            />
                                            <span>Screen (Absolute 0-1)</span>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="coordSystem"
                                                value="body"
                                                checked={currentModel.coordinateSystem !== 'screen'} // Default to body if undefined
                                                onChange={() => setCurrentModel(m => ({ ...m, coordinateSystem: 'body' }))}
                                            />
                                            <span>Body-Centric (Relative to Hip)</span>
                                        </label>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '8px' }}>
                                        <strong>Body-Centric</strong> is recommended for precision. It remains accurate even if the operator moves around or the camera shifts.
                                        (0,0) is the center of the hips.
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'extraction' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ margin: 0 }}>Pose Extraction Data</h3>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#9ca3af', border: '1px solid #374151', padding: '2px 6px', borderRadius: '4px' }}>
                                            Mode: {currentModel.coordinateSystem === 'screen' ? 'Screen' : 'Body-Relative'}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: activePose ? '#10b981' : '#6b7280' }}>
                                            {activePose ? '● Tracking Live' : '○ No Data'}
                                        </span>
                                    </div>
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '30px 1fr 60px 60px 50px',
                                    gap: '8px',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    color: '#9ca3af',
                                    padding: '0 8px 8px 8px',
                                    borderBottom: '1px solid #374151'
                                }}>
                                    <span>#</span>
                                    <span>Keypoint</span>
                                    <span>X</span>
                                    <span>Y</span>
                                    <span>Conf</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '500px', overflowY: 'auto' }}>
                                    {KEYPOINT_NAMES.map((name, idx) => {
                                        const rawPoint = activePose?.keypoints.find(k => k.name === name);
                                        const isSelected = selectedKeypoints[name];

                                        // Compute display value based on system
                                        let displayPoint = rawPoint;
                                        if (currentModel.coordinateSystem !== 'screen' && activePose) {
                                            // We calculate normalized stats on the fly for visualization
                                            // Optimization: In real app, calculate once per frame outside loop
                                            const normalized = PoseNormalizer.normalize(activePose.keypoints);
                                            displayPoint = normalized.find(k => k.name === name);
                                        }

                                        return (
                                            <div key={name} style={{
                                                display: 'grid',
                                                gridTemplateColumns: '30px 1fr 60px 60px 50px',
                                                gap: '8px',
                                                padding: '8px',
                                                backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                                borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
                                                alignItems: 'center',
                                                fontSize: '0.85rem'
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    checked={!!isSelected}
                                                    onChange={(e) => setSelectedKeypoints(prev => ({ ...prev, [name]: e.target.checked }))}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                <span style={{ color: isSelected ? 'white' : '#9ca3af' }}>{idx}. {name}</span>
                                                <span style={{ fontFamily: 'monospace', color: displayPoint ? '#60a5fa' : '#4b5563' }}>
                                                    {displayPoint ? displayPoint.x.toFixed(2) : '-'}
                                                </span>
                                                <span style={{ fontFamily: 'monospace', color: displayPoint ? '#60a5fa' : '#4b5563' }}>
                                                    {displayPoint ? displayPoint.y.toFixed(2) : '-'}
                                                </span>
                                                <span style={{
                                                    fontFamily: 'monospace',
                                                    color: rawPoint && rawPoint.score > 0.5 ? '#10b981' : '#ef4444'
                                                }}>
                                                    {rawPoint ? (rawPoint.score * 100).toFixed(0) + '%' : '-'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModelBuilder;
