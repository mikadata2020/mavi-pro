import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Play, Pause, RefreshCw, CheckCircle, AlertTriangle, Save, Upload, Camera } from 'lucide-react';

const MachineLearningData = ({ videoSrc }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [consistencyScore, setConsistencyScore] = useState(0);
    const [goldenCycle, setGoldenCycle] = useState(null);
    const [dataPoints, setDataPoints] = useState([]);
    const [anomalies, setAnomalies] = useState(0);
    const canvasRef = useRef(null);
    const requestRef = useRef();
    const fileInputRef = useRef(null);

    // Mock data generation for the graph
    useEffect(() => {
        if (isAnalyzing) {
            const interval = setInterval(() => {
                const newPoint = {
                    time: new Date().toLocaleTimeString(),
                    score: 85 + Math.random() * 15 - (Math.random() > 0.8 ? 20 : 0), // Mostly high, occasional drop
                    threshold: 80
                };

                setDataPoints(prev => {
                    const newData = [...prev, newPoint];
                    if (newData.length > 20) newData.shift();
                    return newData;
                });

                setConsistencyScore(Math.round(newPoint.score));
                if (newPoint.score < 80) setAnomalies(prev => prev + 1);

            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isAnalyzing]);

    // Canvas animation for "Scanning" effect
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let scanLineY = 0;

        const animate = () => {
            if (!isAnalyzing) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                return;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw simulated skeleton nodes
            ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.arc(150 + Math.sin(Date.now() / 500 + i) * 50, 100 + i * 40, 5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw scan line
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.moveTo(0, scanLineY);
            ctx.lineTo(canvas.width, scanLineY);
            ctx.stroke();

            // Gradient trail
            const gradient = ctx.createLinearGradient(0, scanLineY - 50, 0, scanLineY);
            gradient.addColorStop(0, 'rgba(0, 255, 0, 0)');
            gradient.addColorStop(1, 'rgba(0, 255, 0, 0.2)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, scanLineY - 50, canvas.width, 50);

            scanLineY += 2;
            if (scanLineY > canvas.height) scanLineY = 0;

            requestRef.current = requestAnimationFrame(animate);
        };

        if (isAnalyzing) {
            requestRef.current = requestAnimationFrame(animate);
        } else {
            cancelAnimationFrame(requestRef.current);
        }

        return () => cancelAnimationFrame(requestRef.current);
    }, [isAnalyzing]);

    const handleCaptureGoldenCycle = () => {
        setGoldenCycle({
            timestamp: new Date().toISOString(),
            duration: '12.5s',
            score: '98%',
            source: 'current_video'
        });
        alert("Golden Cycle Captured! This will be used as the reference standard.");
    };

    const handleUploadGoldenCycle = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('video/')) {
            const videoURL = URL.createObjectURL(file);
            setGoldenCycle({
                timestamp: new Date().toISOString(),
                duration: 'Uploaded',
                score: '100%',
                source: 'uploaded_video',
                fileName: file.name,
                videoURL: videoURL
            });
            alert(`Golden Cycle uploaded: ${file.name}`);
        } else {
            alert('Please upload a valid video file.');
        }
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
                    <button
                        onClick={() => setIsAnalyzing(!isAnalyzing)}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            background: isAnalyzing ? '#ff4b4b' : '#00d2ff',
                            color: '#fff',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
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
                {/* Golden Cycle Card */}
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
                                    {goldenCycle.source === 'uploaded_video' ? '📤 Uploaded' : '📹 Captured'}
                                </span>
                            </div>
                            {goldenCycle.fileName && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <span style={{ color: '#aaa' }}>File:</span>
                                    <span style={{ fontSize: '0.75rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {goldenCycle.fileName}
                                    </span>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                <span style={{ color: '#aaa' }}>Captured:</span>
                                <span>{new Date(goldenCycle.timestamp).toLocaleTimeString()}</span>
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
                            <p style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '10px' }}>No reference cycle set.</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <button
                                    onClick={handleCaptureGoldenCycle}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        background: 'rgba(255,215,0,0.1)',
                                        border: '1px solid #ffd700',
                                        color: '#ffd700',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}
                                >
                                    <Camera size={14} /> Capture Current
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        background: 'rgba(0,210,255,0.1)',
                                        border: '1px solid #00d2ff',
                                        color: '#00d2ff',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}
                                >
                                    <Upload size={14} /> Upload Video
                                </button>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="video/*"
                                onChange={handleUploadGoldenCycle}
                                style={{ display: 'none' }}
                            />
                        </div>
                    )}
                </div>

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
                        color: '#00ff00',
                        border: '1px solid #00ff00'
                    }}>
                        LIVE INFERENCE
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
        </div>
    );
};

export default MachineLearningData;
