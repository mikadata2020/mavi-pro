import React, { useState, useRef, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import AutoCycleDetector from '../../utils/autoCycleDetector';

function CycleDetectionPanel({ videoRef, onApplyCycles, onClose }) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [motionData, setMotionData] = useState([]);
    const [detectedCycles, setDetectedCycles] = useState([]);
    const [threshold, setThreshold] = useState(20);
    const [minCycleDuration, setMinCycleDuration] = useState(1);
    const [stats, setStats] = useState(null);
    const [selectedCycles, setSelectedCycles] = useState(new Set());
    const detectorRef = useRef(new AutoCycleDetector());

    useEffect(() => {
        // Re-detect cycles when threshold or duration changes
        if (motionData.length > 0) {
            detectCyclesFromData();
        }
    }, [threshold, minCycleDuration]);

    const handleAnalyze = async () => {
        if (!videoRef?.current) {
            alert('No video loaded');
            return;
        }

        setIsAnalyzing(true);
        setProgress(0);
        setMotionData([]);
        setDetectedCycles([]);
        setSelectedCycles(new Set());

        try {
            const detector = detectorRef.current;
            detector.reset();

            const data = await detector.analyzeVideo(videoRef.current, (p) => {
                setProgress(Math.round(p * 100));
            });

            setMotionData(data);

            // Auto-detect cycles with current settings
            const cycles = detector.detectCycles(data, threshold, minCycleDuration);
            setDetectedCycles(cycles);

            // Auto-select all cycles
            setSelectedCycles(new Set(cycles.map((_, i) => i)));

            // Calculate stats
            const cycleStats = detector.calculateStats(cycles);
            setStats(cycleStats);

        } catch (error) {
            console.error('Analysis failed:', error);
            alert('Failed to analyze video: ' + error.message);
        } finally {
            setIsAnalyzing(false);
            setProgress(0);
        }
    };

    const detectCyclesFromData = () => {
        const detector = detectorRef.current;
        const cycles = detector.detectCycles(motionData, threshold, minCycleDuration);
        setDetectedCycles(cycles);

        // Preserve selections that still exist
        const newSelected = new Set();
        selectedCycles.forEach(idx => {
            if (idx < cycles.length) {
                newSelected.add(idx);
            }
        });
        setSelectedCycles(newSelected);

        const cycleStats = detector.calculateStats(cycles);
        setStats(cycleStats);
    };

    const toggleCycleSelection = (index) => {
        const newSelected = new Set(selectedCycles);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedCycles(newSelected);
    };

    const handleApply = () => {
        const cyclesToApply = detectedCycles.filter((_, i) => selectedCycles.has(i));

        if (cyclesToApply.length === 0) {
            alert('Please select at least one cycle to apply');
            return;
        }

        // Convert cycles to measurements format
        const measurements = cyclesToApply.map((cycle, index) => ({
            id: Date.now() + index,
            elementName: `Cycle ${index + 1}`,
            startTime: cycle.startTime,
            endTime: cycle.endTime,
            duration: cycle.duration,
            category: 'Value-added', // Default category
            therblig: null,
            station: 'Auto-detected'
        }));

        onApplyCycles(measurements);
        onClose();
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    padding: '8px',
                    border: '1px solid #555',
                    borderRadius: '4px'
                }}>
                    <p style={{ margin: 0, color: '#fff', fontSize: '0.85rem' }}>
                        Time: {payload[0].payload.time.toFixed(2)}s
                    </p>
                    <p style={{ margin: 0, color: '#4da6ff', fontSize: '0.85rem' }}>
                        Motion: {payload[0].value.toFixed(2)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
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
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: '#1e1e1e',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '1200px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: '1px solid #333'
            }}>
                {/* Header */}
                <div style={{
                    padding: '15px 20px',
                    borderBottom: '1px solid #333',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#252526'
                }}>
                    <h2 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>
                        ⏱️ Auto-Cycle Detection
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#888',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            padding: '0 10px'
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Controls */}
                    <div style={{
                        backgroundColor: '#252526',
                        padding: '15px',
                        borderRadius: '4px',
                        display: 'flex',
                        gap: '20px',
                        alignItems: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: isAnalyzing ? '#555' : '#0a5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.95rem'
                            }}
                        >
                            {isAnalyzing ? `Analyzing... ${progress}%` : '🔍 Analyze Video'}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{ color: '#ccc', fontSize: '0.9rem' }}>Sensitivity:</label>
                            <input
                                type="range"
                                min="5"
                                max="50"
                                value={threshold}
                                onChange={(e) => setThreshold(Number(e.target.value))}
                                disabled={motionData.length === 0}
                                style={{ width: '150px' }}
                            />
                            <span style={{ color: '#fff', fontSize: '0.9rem', minWidth: '40px' }}>{threshold}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label style={{ color: '#ccc', fontSize: '0.9rem' }}>Min Duration:</label>
                            <input
                                type="number"
                                min="0.5"
                                max="10"
                                step="0.5"
                                value={minCycleDuration}
                                onChange={(e) => setMinCycleDuration(Number(e.target.value))}
                                disabled={motionData.length === 0}
                                style={{
                                    width: '70px',
                                    padding: '5px',
                                    backgroundColor: '#333',
                                    color: '#fff',
                                    border: '1px solid #555',
                                    borderRadius: '4px'
                                }}
                            />
                            <span style={{ color: '#ccc', fontSize: '0.9rem' }}>sec</span>
                        </div>
                    </div>

                    {/* Motion Graph */}
                    {motionData.length > 0 && (
                        <div style={{
                            backgroundColor: '#252526',
                            padding: '15px',
                            borderRadius: '4px'
                        }}>
                            <h3 style={{ margin: '0 0 15px 0', color: '#fff', fontSize: '1rem' }}>Motion Intensity Graph</h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={motionData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis
                                        dataKey="time"
                                        stroke="#888"
                                        label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5, fill: '#888' }}
                                    />
                                    <YAxis
                                        stroke="#888"
                                        label={{ value: 'Motion Intensity', angle: -90, position: 'insideLeft', fill: '#888' }}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <ReferenceLine y={threshold} stroke="#ff0" strokeDasharray="5 5" label={{ value: 'Threshold', fill: '#ff0' }} />
                                    <Line type="monotone" dataKey="motion" stroke="#4da6ff" dot={false} strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Statistics */}
                    {stats && (
                        <div style={{
                            backgroundColor: '#252526',
                            padding: '15px',
                            borderRadius: '4px'
                        }}>
                            <h3 style={{ margin: '0 0 15px 0', color: '#fff', fontSize: '1rem' }}>Statistics</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                                <div>
                                    <div style={{ color: '#888', fontSize: '0.8rem' }}>Total Cycles</div>
                                    <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }}>{stats.totalCycles}</div>
                                </div>
                                <div>
                                    <div style={{ color: '#888', fontSize: '0.8rem' }}>Avg Duration</div>
                                    <div style={{ color: '#4da6ff', fontSize: '1.2rem', fontWeight: 'bold' }}>{stats.avgDuration}s</div>
                                </div>
                                <div>
                                    <div style={{ color: '#888', fontSize: '0.8rem' }}>Min / Max</div>
                                    <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }}>{stats.minDuration}s / {stats.maxDuration}s</div>
                                </div>
                                <div>
                                    <div style={{ color: '#888', fontSize: '0.8rem' }}>Consistency</div>
                                    <div style={{ color: stats.consistency > 80 ? '#0a5' : '#ff0', fontSize: '1.2rem', fontWeight: 'bold' }}>{stats.consistency}%</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Detected Cycles List */}
                    {detectedCycles.length > 0 && (
                        <div style={{
                            backgroundColor: '#252526',
                            padding: '15px',
                            borderRadius: '4px',
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <h3 style={{ margin: '0 0 15px 0', color: '#fff', fontSize: '1rem' }}>
                                Detected Cycles ({selectedCycles.size} selected)
                            </h3>
                            <div style={{ flex: 1, overflow: 'auto', maxHeight: '300px' }}>
                                {detectedCycles.map((cycle, index) => (
                                    <div
                                        key={index}
                                        onClick={() => toggleCycleSelection(index)}
                                        style={{
                                            padding: '10px',
                                            marginBottom: '8px',
                                            backgroundColor: selectedCycles.has(index) ? '#37373d' : '#2a2a2a',
                                            border: `1px solid ${selectedCycles.has(index) ? '#4da6ff' : '#333'}`,
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedCycles.has(index)}
                                                onChange={() => { }}
                                                style={{ cursor: 'pointer' }}
                                            />
                                            <div>
                                                <div style={{ color: '#fff', fontWeight: 'bold' }}>Cycle {index + 1}</div>
                                                <div style={{ color: '#888', fontSize: '0.85rem' }}>
                                                    {cycle.startTime.toFixed(2)}s - {cycle.endTime.toFixed(2)}s
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: '#4da6ff', fontWeight: 'bold' }}>{cycle.duration.toFixed(2)}s</div>
                                            <div style={{ color: '#888', fontSize: '0.85rem' }}>Avg: {cycle.avgMotion}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {motionData.length === 0 && !isAnalyzing && (
                        <div style={{
                            padding: '40px',
                            textAlign: 'center',
                            color: '#666',
                            fontSize: '1rem'
                        }}>
                            Click "Analyze Video" to detect repetitive work cycles automatically
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '15px 20px',
                    borderTop: '1px solid #333',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '10px',
                    backgroundColor: '#252526'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 20px',
                            backgroundColor: '#333',
                            color: '#ccc',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={selectedCycles.size === 0}
                        style={{
                            padding: '8px 20px',
                            backgroundColor: selectedCycles.size === 0 ? '#555' : '#0a5',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: selectedCycles.size === 0 ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Apply {selectedCycles.size} Cycle{selectedCycles.size !== 1 ? 's' : ''} to Timeline
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CycleDetectionPanel;
