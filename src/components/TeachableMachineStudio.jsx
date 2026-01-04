import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Upload, Scissors, Play, Pause, Download, Trash2, CheckCircle,
    ExternalLink, RefreshCw, Save, Video, Bot, Terminal, HelpCircle, X,
    Image, FolderArchive, Loader2, Database
} from 'lucide-react';
import { loadModelFromURL, loadImageModelFromURL, predict } from '../utils/teachableMachine';
import { helpContent } from '../utils/helpContent';
import { extractFramesToZip } from '../utils/videoToImages';
import { saveAs } from 'file-saver';

// Static Styles
const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#0f172a',
        color: '#f1f5f9',
        padding: '20px',
        overflowY: 'auto'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        borderBottom: '1px solid #334155',
        paddingBottom: '15px'
    },
    tabBar: {
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        backgroundColor: '#1e293b',
        padding: '5px',
        borderRadius: '10px',
        width: 'fit-content'
    },
    tab: {
        padding: '8px 20px',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontWeight: '600',
        fontSize: '0.9rem',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    activeTab: {
        backgroundColor: '#3b82f6',
        color: 'white'
    },
    inactiveTab: {
        backgroundColor: 'transparent',
        color: '#94a3b8'
    },
    mainGrid: {
        display: 'grid',
        gridTemplateColumns: '1.2fr 0.8fr',
        gap: '20px',
        flex: 1
    },
    card: {
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
    },
    videoContainer: {
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        backgroundColor: '#000',
        borderRadius: '8px',
        overflow: 'hidden'
    },
    controls: {
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        padding: '10px 15px',
        borderRadius: '8px',
        border: '1px solid #334155'
    },
    button: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 18px',
        borderRadius: '8px',
        cursor: 'pointer',
        border: 'none',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        transition: 'all 0.2s'
    },
    primaryBtn: {
        backgroundColor: '#3b82f6',
        color: 'white'
    },
    secondaryBtn: {
        backgroundColor: '#334155',
        color: '#e2e8f0'
    },
    accentBtn: {
        backgroundColor: '#ec4899',
        color: 'white'
    },
    input: {
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        color: 'white',
        padding: '10px 15px',
        borderRadius: '8px',
        flex: 1,
        outline: 'none'
    },
    clipItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px',
        backgroundColor: '#0f172a',
        borderRadius: '8px',
        border: '1px solid #334155'
    }
};

// Standalone Interactive Timeline
const InteractiveTimeline = ({
    duration,
    currentTime,
    startTime,
    endTime,
    setStartTime,
    setEndTime,
    setCurrentTime,
    videoRef,
    stepFrame
}) => {
    const barRef = useRef(null);
    const [dragging, setDragging] = useState(null); // 'start', 'end', or null

    const handleProgressJump = (e) => {
        if (!barRef.current || !duration || !videoRef.current || dragging) return;
        const rect = barRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        const time = percent * duration;

        videoRef.current.currentTime = time;
        setCurrentTime(time);
    };

    const handleMouseMove = useCallback((e) => {
        if (!dragging || !barRef.current || !duration) return;
        const rect = barRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        const time = parseFloat((percent * duration).toFixed(2));

        if (dragging === 'start') {
            setStartTime(Math.min(time, endTime - 0.1));
        } else if (dragging === 'end') {
            setEndTime(Math.max(time, startTime + 0.1));
        }
    }, [dragging, duration, startTime, endTime, setStartTime, setEndTime]);

    const handleMouseUp = useCallback(() => {
        setDragging(null);
    }, []);

    useEffect(() => {
        if (dragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, handleMouseMove, handleMouseUp]);

    const rangeStartPercent = duration ? (startTime / duration) * 100 : 0;
    const rangeEndPercent = duration ? (endTime / duration) * 100 : 0;
    const currentPercent = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div style={{ marginTop: '10px', marginBottom: '10px' }}>
            <div
                ref={barRef}
                onMouseDown={handleProgressJump}
                style={{
                    height: '36px',
                    backgroundColor: '#1e293b',
                    borderRadius: '6px',
                    position: 'relative',
                    cursor: dragging ? 'ew-resize' : 'pointer',
                    border: '1px solid #334155',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                    paddingBottom: '12px'
                }}
            >
                {/* Track Background */}
                <div style={{ position: 'absolute', top: '10px', left: '5px', right: '5px', height: '4px', backgroundColor: '#334155', borderRadius: '2px' }} />

                {/* Ruler Ticks */}
                {duration > 0 && Array.from({ length: 11 }).map((_, i) => (
                    <div key={i} style={{
                        position: 'absolute',
                        left: `${i * 10}%`,
                        top: '16px',
                        width: '1px',
                        height: i % 2 === 0 ? '6px' : '4px',
                        backgroundColor: i % 2 === 0 ? '#475569' : '#334155',
                        zIndex: 0
                    }}>
                        {i % 2 === 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '8px',
                                left: '-10px',
                                width: '20px',
                                textAlign: 'center',
                                fontSize: '8px',
                                color: '#64748b',
                                fontFamily: 'monospace'
                            }}>
                                {((i / 10) * duration).toFixed(0)}s
                            </span>
                        )}
                    </div>
                ))}

                {/* Selected Range Overlay */}
                <div style={{
                    position: 'absolute',
                    left: `${rangeStartPercent}%`,
                    width: `${rangeEndPercent - rangeStartPercent}%`,
                    top: '8px',
                    height: '8px',
                    backgroundColor: 'rgba(236, 72, 153, 0.4)',
                    borderRadius: '4px',
                    zIndex: 1
                }} />

                {/* Start Marker Handle */}
                <div
                    onMouseDown={(e) => { e.stopPropagation(); setDragging('start'); }}
                    style={{
                        position: 'absolute',
                        left: `${rangeStartPercent}%`,
                        top: 0, bottom: 0,
                        width: '12px',
                        marginLeft: '-6px',
                        cursor: 'ew-resize',
                        zIndex: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}
                >
                    <div style={{ width: '2px', height: '100%', backgroundColor: '#10b981', boxShadow: '0 0 5px rgba(16, 185, 129, 0.5)' }} />
                    <div style={{
                        position: 'absolute', top: '-15px', backgroundColor: '#10b981', color: 'white',
                        fontSize: '9px', padding: '1px 4px', borderRadius: '3px', fontWeight: 'bold'
                    }}>IN</div>
                </div>

                {/* End Marker Handle */}
                <div
                    onMouseDown={(e) => { e.stopPropagation(); setDragging('end'); }}
                    style={{
                        position: 'absolute',
                        left: `${rangeEndPercent}%`,
                        top: 0, bottom: 0,
                        width: '12px',
                        marginLeft: '-6px',
                        cursor: 'ew-resize',
                        zIndex: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}
                >
                    <div style={{ width: '2px', height: '100%', backgroundColor: '#ec4899', boxShadow: '0 0 5px rgba(236, 72, 153, 0.5)' }} />
                    <div style={{
                        position: 'absolute', bottom: '-15px', backgroundColor: '#ec4899', color: 'white',
                        fontSize: '9px', padding: '1px 4px', borderRadius: '3px', fontWeight: 'bold'
                    }}>OUT</div>
                </div>

                {/* Playhead */}
                <div style={{
                    position: 'absolute',
                    left: `${currentPercent}%`,
                    top: 0, bottom: 0,
                    width: '2px',
                    backgroundColor: '#3b82f6',
                    zIndex: 2,
                    boxShadow: '0 0 8px #3b82f6'
                }}>
                    <div style={{ position: 'absolute', top: '-5px', left: '-4px', width: '10px', height: '10px', backgroundColor: '#3b82f6', borderRadius: '50%', border: '2px solid white' }} />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={{ ...styles.button, ...styles.secondaryBtn, padding: '5px 10px', fontSize: '0.75rem' }} onClick={() => stepFrame(-0.04)}>
                            &lt; Frame
                        </button>
                        <button style={{ ...styles.button, ...styles.secondaryBtn, padding: '5px 10px', fontSize: '0.75rem' }} onClick={() => stepFrame(0.04)}>
                            Frame &gt;
                        </button>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontFamily: 'monospace', backgroundColor: '#0f172a', padding: '4px 10px', borderRadius: '4px', border: '1px solid #334155' }}>
                        <span style={{ color: '#3b82f6' }}>{currentTime.toFixed(2)}s</span> / {duration.toFixed(2)}s
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0f172a', padding: '6px 10px', borderRadius: '6px', border: '1px solid #334155' }}>
                        <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 'bold' }}>IN</span>
                        <input type="number" step="0.1" style={{ ...styles.input, backgroundColor: 'transparent', border: 'none', padding: 0, width: '100%', fontSize: '0.85rem' }} value={startTime.toFixed(2)} onChange={(e) => setStartTime(parseFloat(e.target.value))} />
                        <button title="Set to current" style={{ background: 'none', border: 'none', color: '#ec4899', cursor: 'pointer' }} onClick={() => setStartTime(currentTime)}>
                            <Save size={14} />
                        </button>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0f172a', padding: '6px 10px', borderRadius: '6px', border: '1px solid #334155' }}>
                        <span style={{ fontSize: '0.7rem', color: '#ec4899', fontWeight: 'bold' }}>OUT</span>
                        <input type="number" step="0.1" style={{ ...styles.input, backgroundColor: 'transparent', border: 'none', padding: 0, width: '100%', fontSize: '0.85rem' }} value={endTime.toFixed(2)} onChange={(e) => setEndTime(parseFloat(e.target.value))} />
                        <button title="Set to current" style={{ background: 'none', border: 'none', color: '#ec4899', cursor: 'pointer' }} onClick={() => setEndTime(currentTime)}>
                            <Save size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TeachableMachineStudio = ({ videoSrc: initialVideoSrc }) => {
    const [activeTab, setActiveTab] = useState('slicer');
    const [videoSrc, setVideoSrc] = useState(initialVideoSrc);
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showHelp, setShowHelp] = useState(false);

    // Slicer State
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedClips, setRecordedClips] = useState([]);
    const mediaRecorderRef = useRef(null);
    const capturingRef = useRef(false);

    // TM Model State
    const [tmUrl, setTmUrl] = useState('');
    const [tmType, setTmType] = useState('pose');
    const [model, setModel] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [prediction, setPrediction] = useState(null);
    const [isTesting, setIsTesting] = useState(false);
    const testLoopRef = useRef(null);
    const canvasRef = useRef(null);
    const [extractingClipId, setExtractingClipId] = useState(null);
    const [savedModels, setSavedModels] = useState([]);
    const [modelName, setModelName] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('mavi_tm_models');
        if (stored) {
            try { setSavedModels(JSON.parse(stored)); } catch (e) { console.error(e); }
        }
    }, []);

    const saveModelToLibrary = () => {
        if (!tmUrl) return alert('Enter a Model URL first');
        const name = modelName || `Model ${savedModels.length + 1}`;
        const newModel = { id: Date.now(), name, url: tmUrl, type: tmType, timestamp: new Date().toLocaleString() };
        const updated = [newModel, ...savedModels];
        setSavedModels(updated);
        localStorage.setItem('mavi_tm_models', JSON.stringify(updated));
        setModelName('');
        alert('Model saved to library!');
    };

    const deleteModelFromLibrary = (id) => {
        const updated = savedModels.filter(m => m.id !== id);
        setSavedModels(updated);
        localStorage.setItem('mavi_tm_models', JSON.stringify(updated));
    };

    const loadFromLibrary = (libModel) => {
        setTmUrl(libModel.url);
        setTmType(libModel.type);
        setActiveTab('tester');
    };

    // Draw Skeleton
    useEffect(() => {
        if (!canvasRef.current || !prediction || !videoRef.current || prediction.type !== 'pose') {
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const video = videoRef.current;
        canvas.width = video.clientWidth;
        canvas.height = video.clientHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (prediction.pose && prediction.pose.keypoints) {
            const minPartConfidence = 0.5;
            prediction.pose.keypoints.forEach(kp => {
                if (kp.score > minPartConfidence) {
                    ctx.beginPath();
                    ctx.arc(kp.x * canvas.width, kp.y * canvas.height, 5, 0, 2 * Math.PI);
                    ctx.fillStyle = "#3b82f6"; ctx.fill();
                    ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.stroke();
                }
            });

            const adjacentKeyPoints = [
                ['left_shoulder', 'right_shoulder'], ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
                ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'], ['left_shoulder', 'left_hip'],
                ['right_shoulder', 'right_hip'], ['left_hip', 'right_hip'], ['left_hip', 'left_knee'],
                ['left_knee', 'left_ankle'], ['right_hip', 'right_knee'], ['right_knee', 'right_ankle']
            ];

            adjacentKeyPoints.forEach(([s, e]) => {
                const kp1 = prediction.pose.keypoints.find(k => k.name === s);
                const kp2 = prediction.pose.keypoints.find(k => k.name === e);
                if (kp1 && kp2 && kp1.score > minPartConfidence && kp2.score > minPartConfidence) {
                    ctx.beginPath();
                    ctx.moveTo(kp1.x * canvas.width, kp1.y * canvas.height);
                    ctx.lineTo(kp2.x * canvas.width, kp2.y * canvas.height);
                    ctx.strokeStyle = "rgba(59, 130, 246, 0.6)"; ctx.lineWidth = 3; ctx.stroke();
                }
            });
        }
    }, [prediction]);

    const handleCaptureClip = async () => {
        if (!videoRef.current || capturingRef.current) return;

        capturingRef.current = true;
        const video = videoRef.current;
        const currentStartTime = startTime;
        const currentEndTime = endTime;

        video.pause();
        video.currentTime = currentStartTime;

        let hasStarted = false;
        let captureTimeout = null;

        const startRecording = () => {
            if (hasStarted) return;
            hasStarted = true;

            if (captureTimeout) {
                clearTimeout(captureTimeout);
                captureTimeout = null;
            }

            video.removeEventListener('seeked', startRecording);

            // Create capturing canvas
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || video.clientWidth;
            canvas.height = video.videoHeight || video.clientHeight;
            const ctx = canvas.getContext('2d');

            video.play();
            setIsPlaying(true);
            setIsRecording(true);

            // Setup MediaRecorder with best possible format
            const stream = canvas.captureStream(30);
            const mimeTypes = [
                'video/webm;codecs=vp9',
                'video/webm;codecs=vp8',
                'video/webm;codecs=h264',
                'video/webm',
                'video/mp4;codecs=h264',
                'video/mp4;codecs=avc1',
                'video/mp4'
            ];
            const supportedType = mimeTypes.find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm';

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: supportedType,
                videoBitsPerSecond: 5000000
            });
            mediaRecorderRef.current = mediaRecorder;
            const localChunks = [];

            // Robust drawing loop using setInterval (works better when tab is inactive)
            const drawInterval = setInterval(() => {
                if (mediaRecorder.state === 'recording') {
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                } else {
                    clearInterval(drawInterval);
                }
            }, 1000 / 30);

            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) localChunks.push(e.data); };
            mediaRecorder.onstop = () => {
                clearInterval(drawInterval);
                const blob = new Blob(localChunks, { type: supportedType });

                // Final guard against double entry
                setRecordedClips(prev => {
                    // Check if a clip with almost exact same time was just added
                    const isDuplicate = prev.some(c =>
                        Math.abs(parseFloat(c.startTime) - currentStartTime) < 0.01 &&
                        Math.abs(parseFloat(c.endTime) - currentEndTime) < 0.01
                    );
                    if (isDuplicate) return prev;

                    return [{
                        id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        url: URL.createObjectURL(blob),
                        blob,
                        mimeType: supportedType,
                        startTime: currentStartTime.toFixed(2),
                        endTime: currentEndTime.toFixed(2),
                        timestamp: new Date().toLocaleTimeString(),
                        name: `Clip_${prev.length + 1}`
                    }, ...prev];
                });

                setIsRecording(false);
                capturingRef.current = false;
            };

            mediaRecorder.start();

            const checkEnd = setInterval(() => {
                if (video.currentTime >= currentEndTime || video.paused) {
                    if (mediaRecorder.state === 'recording') mediaRecorder.stop();
                    video.pause();
                    setIsPlaying(false);
                    clearInterval(checkEnd);
                }
            }, 100);
        };

        video.addEventListener('seeked', startRecording);

        // Safety timeout for seeked event
        captureTimeout = setTimeout(() => {
            if (!hasStarted) {
                startRecording();
            }
        }, 1000);
    };

    const downloadClip = (clip) => {
        const a = document.createElement('a'); a.href = clip.url;
        // Use correct extension to avoid "corrupt file" errors in players
        // Most browsers record WebM. Renaming WebM to MP4 makes Windows Media Player fail.
        const isMp4 = clip.mimeType?.includes('video/mp4');
        const extension = isMp4 ? 'mp4' : 'webm';
        a.download = `${clip.name}_${clip.startTime}-${clip.endTime}.${extension}`; a.click();
    };

    const stepFrame = (seconds) => {
        if (!videoRef.current) return;
        videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    };

    const handleExtractImages = async (clip) => {
        if (!clip.blob) return;
        setExtractingClipId(clip.id);
        try {
            const zipBlob = await extractFramesToZip(clip.blob, 5, clip.name.replace(/\s+/g, '_'));
            saveAs(zipBlob, `${clip.name}_images.zip`);
        } catch (err) {
            console.error('Frame extraction failed:', err);
            alert('Gagal mengambil gambar dari video: ' + err.message);
        } finally {
            setExtractingClipId(null);
        }
    };
    const handleLoadModel = async (urlToLoad) => {
        const url = urlToLoad || tmUrl;
        if (!url) return;
        setIsLoading(true);
        try {
            const loadedModel = tmType === 'pose' ? await loadModelFromURL(url) : await loadImageModelFromURL(url);
            setModel(loadedModel);
            alert('Model loaded successfully!');
        } catch (e) {
            console.error(e);
            alert('Failed to load model: ' + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleTesting = () => {
        if (isTesting) {
            setIsTesting(false);
            if (testLoopRef.current) cancelAnimationFrame(testLoopRef.current);
            setPrediction(null);
        } else {
            if (!model) return alert('Load a model first');
            setIsTesting(true);
            runTestLoop();
        }
    };

    const runTestLoop = async () => {
        if (!videoRef.current || !model || !isTesting) return;
        try {
            const result = await predict(model, videoRef.current);
            setPrediction(result);
        } catch (e) { console.error(e); }
        testLoopRef.current = requestAnimationFrame(runTestLoop);
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ backgroundColor: '#ec4899', padding: '10px', borderRadius: '12px' }}>
                        <Terminal size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Teachable Machine Studio</h1>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>Dataset Prep & Verification Lab</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button style={{ ...styles.button, ...styles.secondaryBtn }} onClick={() => setShowHelp(true)}>
                        <HelpCircle size={18} /> Guide
                    </button>
                </div>
            </div>

            <div style={styles.tabBar}>
                <button style={{ ...styles.tab, ...(activeTab === 'slicer' ? styles.activeTab : styles.inactiveTab) }} onClick={() => setActiveTab('slicer')}>
                    <Scissors size={18} /> 1. Dataset Prep
                </button>
                <button style={{ ...styles.tab, ...(activeTab === 'trainer' ? styles.activeTab : styles.inactiveTab) }} onClick={() => setActiveTab('trainer')}>
                    <ExternalLink size={18} /> 2. Train Model (GTM)
                </button>
                <button style={{ ...styles.tab, ...(activeTab === 'tester' ? styles.activeTab : styles.inactiveTab) }} onClick={() => setActiveTab('tester')}>
                    <Terminal size={18} /> 3. Verification
                </button>
                <button style={{ ...styles.tab, ...(activeTab === 'cvat' ? styles.activeTab : styles.inactiveTab) }} onClick={() => setActiveTab('cvat')}>
                    <Image size={18} /> 4. CVAT.ai
                </button>
                <button style={{ ...styles.tab, ...(activeTab === 'roboflow' ? styles.activeTab : styles.inactiveTab) }} onClick={() => setActiveTab('roboflow')}>
                    <Database size={18} /> 5. Roboflow
                </button>
            </div>

            {showHelp && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ backgroundColor: '#1e293b', maxWidth: '600px', width: '100%', borderRadius: '16px', padding: '30px', position: 'relative', border: '1px solid #334155' }}>
                        <button style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }} onClick={() => setShowHelp(false)}>
                            <X size={24} />
                        </button>
                        <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Bot size={28} color="#3b82f6" /> MAVi Guide: TM Studio
                        </h2>
                        <div style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
                            {helpContent['teachable-machine']?.content}
                        </div>
                        <button
                            style={{ ...styles.button, ...styles.primaryBtn, marginTop: '30px', width: '100%', padding: '12px', justifyContent: 'center' }}
                            onClick={() => setShowHelp(false)}
                        >
                            Saya Mengerti
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'slicer' && (
                <div style={styles.mainGrid}>
                    <div style={styles.card}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Scissors size={20} color="#ec4899" /> Video Slicer
                            </h2>
                            {!videoSrc && (
                                <label style={{ ...styles.button, ...styles.accentBtn, cursor: 'pointer' }}>
                                    <Upload size={16} /> Upload Video
                                    <input type="file" hidden onChange={(e) => setVideoSrc(URL.createObjectURL(e.target.files[0]))} />
                                </label>
                            )}
                        </div>

                        <div style={styles.videoContainer}>
                            {videoSrc ? (
                                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                    <video
                                        ref={videoRef} src={videoSrc} style={{ width: '100%', height: '100%' }}
                                        onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                                        onLoadedMetadata={(e) => { setDuration(e.target.duration); setEndTime(e.target.duration); }}
                                        crossOrigin="anonymous"
                                    />
                                    <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }} />
                                </div>
                            ) : (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                    No video loaded. Upload a video to start slicing.
                                </div>
                            )}
                            {isRecording && (
                                <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', zIndex: 10 }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse 1s infinite' }} />
                                    <span style={{ fontWeight: 'bold' }}>RECORDING...</span>
                                </div>
                            )}
                        </div>

                        {videoSrc && (
                            <div style={styles.controls}>
                                <button style={{ ...styles.button, ...styles.secondaryBtn, height: '40px' }} onClick={() => {
                                    if (isPlaying) videoRef.current.pause(); else videoRef.current.play();
                                    setIsPlaying(!isPlaying);
                                }}>
                                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                                </button>
                                <div style={{ flex: 1 }}>
                                    <InteractiveTimeline
                                        duration={duration} currentTime={currentTime} startTime={startTime} endTime={endTime}
                                        setStartTime={setStartTime} setEndTime={setEndTime} setCurrentTime={setCurrentTime}
                                        videoRef={videoRef} stepFrame={stepFrame} styles={styles}
                                    />
                                </div>
                                <button style={{ ...styles.button, ...styles.accentBtn, opacity: isRecording ? 0.5 : 1, height: '40px' }} onClick={handleCaptureClip} disabled={isRecording}>
                                    <Scissors size={18} /> Capture
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={styles.card}>
                            <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Video size={20} color="#ec4899" /> Recorded Clips ({recordedClips.length})
                            </h3>
                            <div style={{ maxHeight: '480px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {recordedClips.length === 0 ? (
                                    <div style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '40px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px dashed #334155' }}>
                                        No clips captured yet.
                                    </div>
                                ) : recordedClips.map(clip => (
                                    <div key={clip.id} style={styles.clipItem}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                                            <div style={{ width: '32px', height: '32px', backgroundColor: '#1e293b', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Scissors size={14} color="#ec4899" />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{clip.name}</div>
                                                <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{clip.startTime}s - {clip.endTime}s</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '2px' }}>
                                            <button
                                                title="Extract Images for TM"
                                                style={{ background: 'none', border: 'none', color: '#10b981', cursor: extractingClipId === clip.id ? 'not-allowed' : 'pointer', padding: '4px' }}
                                                onClick={() => handleExtractImages(clip)}
                                                disabled={extractingClipId === clip.id}
                                            >
                                                {extractingClipId === clip.id ? <Loader2 size={16} className="animate-spin" /> : <FolderArchive size={16} />}
                                            </button>
                                            <button title="Download" style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '4px' }} onClick={() => downloadClip(clip)}>
                                                <Download size={16} />
                                            </button>
                                            <button title="Delete" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }} onClick={() => setRecordedClips(prev => prev.filter(c => c.id !== clip.id))}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {activeTab === 'trainer' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', padding: '0 20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
                        {/* Teachable Machine Card */}
                        <div style={{ ...styles.card, textAlign: 'center', padding: '30px' }}>
                            <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', width: '60px', height: '60px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <Bot size={30} color="#3b82f6" />
                            </div>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.4rem' }}>Teachable Machine</h3>
                            <p style={{ margin: '0 0 20px 0', color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                Cepat dan mudah. Cocok untuk pemula dan prototipe cepat langsung di browser.
                            </p>
                            <button style={{ ...styles.button, ...styles.primaryBtn, width: '100%', padding: '12px', justifyContent: 'center' }} onClick={() => window.open('https://teachablemachine.withgoogle.com/train/pose', '_blank', 'width=1000,height=800')}>
                                <ExternalLink size={18} /> Launch TM Trainer
                            </button>
                        </div>

                        {/* CVAT.ai Card */}
                        <div style={{ ...styles.card, textAlign: 'center', padding: '30px' }}>
                            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', width: '60px', height: '60px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                <Terminal size={30} color="#10b981" />
                            </div>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.4rem' }}>CVAT.ai (Professional)</h3>
                            <p style={{ margin: '0 0 20px 0', color: '#94a3b8', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                Standar industri. Gunakan untuk anotasi dataset besar dan pelatihan model profesional.
                            </p>
                            <button style={{ ...styles.button, backgroundColor: '#10b981', color: 'white', width: '100%', padding: '12px', justifyContent: 'center' }} onClick={() => window.open('https://cvat.ai', '_blank')}>
                                <ExternalLink size={18} /> Open CVAT.ai
                            </button>
                        </div>
                    </div>

                    <div style={{ ...styles.card, maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                        <h4 style={{ margin: 0, color: '#3b82f6' }}>Alur Kerja Integrasi</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '15px' }}>
                            <div style={{ padding: '10px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
                                <div style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.7rem', marginBottom: '5px' }}>1. SLICE & EXTRACT</div>
                                <div style={{ fontSize: '0.8rem' }}>Gunakan Video Slicer untuk mengambil klip dan klik 🖼️ (Extract Images).</div>
                            </div>
                            <div style={{ padding: '10px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
                                <div style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.7rem', marginBottom: '5px' }}>2. ANNOTATE & TRAIN</div>
                                <div style={{ fontSize: '0.8rem' }}>Upload ZIP ke CVAT/TM untuk melatih model klasifikasi atau pose.</div>
                            </div>
                            <div style={{ padding: '10px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
                                <div style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '0.7rem', marginBottom: '5px' }}>3. DEPLOY & TEST</div>
                                <div style={{ fontSize: '0.8rem' }}>Salin link model ke tab "Tester" untuk digunakan di MAVi.</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'tester' && (
                <div style={styles.mainGrid}>
                    <div style={styles.card}>
                        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Video size={20} color="#3b82f6" /> Live Preview
                        </h2>
                        <div style={styles.videoContainer}>
                            {videoSrc ? (
                                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                    <video ref={videoRef} src={videoSrc} style={{ width: '100%', height: '100%' }} onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)} crossOrigin="anonymous" />
                                    <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }} />
                                </div>
                            ) : (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>No video loaded.</div>
                            )}
                        </div>
                        <div style={styles.controls}>
                            <button style={{ ...styles.button, ...styles.secondaryBtn }} onClick={() => { if (isPlaying) videoRef.current.pause(); else videoRef.current.play(); setIsPlaying(!isPlaying); }}>
                                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                            </button>
                            <input type="range" min="0" max={duration} step="0.01" value={currentTime} onChange={(e) => { videoRef.current.currentTime = parseFloat(e.target.value); setCurrentTime(parseFloat(e.target.value)); }} style={{ flex: 1 }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={styles.card}>
                            <h3 style={{ margin: 0 }}>Load Model</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <select style={{ ...styles.input, width: '100px', flex: 'none' }} value={tmType} onChange={(e) => setTmType(e.target.value)}>
                                        <option value="pose">Pose</option><option value="image">Image</option>
                                    </select>
                                    <input type="text" style={styles.input} placeholder="Model URL..." value={tmUrl} onChange={(e) => setTmUrl(e.target.value)} />
                                </div>
                                <button style={{ ...styles.button, ...styles.primaryBtn, justifyContent: 'center' }} onClick={() => handleLoadModel(tmUrl.trim())} disabled={isLoading}>
                                    {isLoading ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} />} {isLoading ? 'Loading...' : 'Load Model'}
                                </button>
                                {model && (
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <input type="text" style={{ ...styles.input, fontSize: '0.8rem' }} placeholder="Save name..." value={modelName} onChange={(e) => setModelName(e.target.value)} />
                                        <button style={{ ...styles.button, ...styles.secondaryBtn }} onClick={saveModelToLibrary}><Save size={16} /></button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={styles.card}>
                            <h3 style={{ margin: 0 }}>Model Library</h3>
                            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {savedModels.length === 0 ? <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No saved models.</p> : savedModels.map(m => (
                                    <div key={m.id} style={styles.clipItem}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{m.name}</div>
                                            <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{m.type.toUpperCase()} - {m.timestamp}</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button title="Load" onClick={() => loadFromLibrary(m)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}><RefreshCw size={16} /></button>
                                            <button title="Delete" onClick={() => deleteModelFromLibrary(m.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button style={{ ...styles.button, ...(isTesting ? styles.accentBtn : styles.primaryBtn), justifyContent: 'center' }} onClick={toggleTesting}>
                            {isTesting ? <Pause size={18} /> : <Play size={18} />} {isTesting ? 'Stop Live Test' : 'Start Live Test'}
                        </button>

                        {prediction && (
                            <div style={{ ...styles.card, borderLeft: '4px solid #3b82f6', padding: '15px' }}>
                                <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>PREDICTION RESULT:</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#3b82f6' }}>{prediction.bestClass}</div>
                                <div style={{ fontSize: '1rem', color: '#cbd5e1' }}>Confidence: {(prediction.accuracy * 100).toFixed(1)}%</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'cvat' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', height: '100%', padding: '0 20px', maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ ...styles.card, borderBottom: '4px solid #10b981' }}>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '20px', borderRadius: '15px' }}>
                                <Image size={40} color="#10b981" />
                            </div>
                            <div>
                                <h2 style={{ margin: 0 }}>CVAT.ai Professional Tooling</h2>
                                <p style={{ margin: '5px 0 0 0', color: '#94a3b8' }}>Computer Vision Annotation Tool untuk dataset industri.</p>
                            </div>
                            <div style={{ marginLeft: 'auto' }}>
                                <button style={{ ...styles.button, backgroundColor: '#10b981', color: 'white' }} onClick={() => window.open('https://cvat.ai', '_blank')}>
                                    <ExternalLink size={18} /> Go to CVAT.ai
                                </button>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={styles.card}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Upload size={20} color="#3b82f6" /> Cara Integrasi CVAT
                            </h3>
                            <ul style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.6', paddingLeft: '20px' }}>
                                <li><strong>Export:</strong> Gunakan tab "Dataset Prep" untuk memotong klip dan klik 🖼️ (Extract Images).</li>
                                <li><strong>Cloud Upload:</strong> Login ke CVAT.ai, buat "New Task", dan upload file ZIP yang baru saja diunduh.</li>
                                <li><strong>Annotation:</strong> Lakukan pelabelan (bounding box, polygons, atau skeleton) di CVAT.</li>
                                <li><strong>Train:</strong> Gunakan data dari CVAT untuk melatih model YOLO, PoseNet, atau lainnya.</li>
                            </ul>
                        </div>

                        <div style={styles.card}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Bot size={20} color="#ec4899" /> Optimal Settings
                            </h3>
                            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
                                Gunakan setting berikut di CVAT untuk hasil terbaik dengan MAVi:
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                                <div style={{ padding: '8px', backgroundColor: '#0f172a', borderRadius: '6px', fontSize: '0.8rem' }}>
                                    <span style={{ color: '#10b981' }}>Image Quality:</span> 90% (sudah diatur otomatis saat export)
                                </div>
                                <div style={{ padding: '8px', backgroundColor: '#0f172a', borderRadius: '6px', fontSize: '0.8rem' }}>
                                    <span style={{ color: '#10b981' }}>Frame Rate:</span> 5-10 FPS (rekomendasi untuk motion analysis)
                                </div>
                                <div style={{ padding: '8px', backgroundColor: '#0f172a', borderRadius: '6px', fontSize: '0.8rem' }}>
                                    <span style={{ color: '#10b981' }}>Data Format:</span> COCO, Pascal VOC, atau CVAT for Images.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ ...styles.card, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f172a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <Bot size={24} color="#3b82f6" />
                            <div>
                                <div style={{ fontWeight: 'bold' }}>Model Deployment</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Setelah model selesai dilatih, masukkan URL model ke tab "Tester".</div>
                            </div>
                        </div>
                        <button style={{ ...styles.button, ...styles.secondaryBtn }} onClick={() => setActiveTab('tester')}>
                            Setup Model Tester
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'roboflow' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', height: '100%', padding: '0 20px', maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ ...styles.card, borderBottom: '4px solid #7e22ce' }}>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                            <div style={{ backgroundColor: 'rgba(126, 34, 206, 0.1)', padding: '20px', borderRadius: '15px' }}>
                                <Database size={40} color="#7e22ce" />
                            </div>
                            <div>
                                <h2 style={{ margin: 0 }}>Roboflow Dataset Management</h2>
                                <p style={{ margin: '5px 0 0 0', color: '#94a3b8' }}>Organisasi, Augmentasi, dan Preprocessing Dataset.</p>
                            </div>
                            <div style={{ marginLeft: 'auto' }}>
                                <button style={{ ...styles.button, backgroundColor: '#7e22ce', color: 'white' }} onClick={() => window.open('https://roboflow.com', '_blank')}>
                                    <ExternalLink size={18} /> Go to Roboflow
                                </button>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div style={styles.card}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Upload size={20} color="#3b82f6" /> Cara Integrasi Roboflow
                            </h3>
                            <ul style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.6', paddingLeft: '20px' }}>
                                <li><strong>Upload:</strong> Unggah hasil label dari CVAT atau gambar mentah langsung ke Roboflow.</li>
                                <li><strong>Pre-processing:</strong> Resize otomatis (wajib agar semua gambar sama ukurannya).</li>
                                <li><strong>Augmentation:</strong> Tambahkan variasi (Flip, Rotate, Blur, Noise) untuk memperkuat model.</li>
                                <li><strong>Export:</strong> Download dataset siap pakai dengan format YOLO, TensorFlow, dll.</li>
                            </ul>
                        </div>

                        <div style={styles.card}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Bot size={20} color="#ec4899" /> Why Roboflow?
                            </h3>
                            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
                                Roboflow menyempurnakan dataset CVAT Anda sebelum training.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                                <div style={{ padding: '8px', backgroundColor: '#0f172a', borderRadius: '6px', fontSize: '0.8rem' }}>
                                    <span style={{ color: '#a855f7' }}>Auto-Split:</span> Otomatis membagi data menjadi Train (70%), Valid (20%), Test (10%).
                                </div>
                                <div style={{ padding: '8px', backgroundColor: '#0f172a', borderRadius: '6px', fontSize: '0.8rem' }}>
                                    <span style={{ color: '#a855f7' }}>Health Check:</span> Mendeteksi gambar duplikat atau label yang hilang.
                                </div>
                                <div style={{ padding: '8px', backgroundColor: '#0f172a', borderRadius: '6px', fontSize: '0.8rem' }}>
                                    <span style={{ color: '#a855f7' }}>Format Conversion:</span> Konversi otomatis dari format CVAT ke format training apa pun.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeachableMachineStudio;
