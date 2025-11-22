import React, { useState, useEffect } from 'react';

function TimelineMeasurement({ videoState, onAddMeasurement, onRemoveMeasurement }) {
    const [measurementStart, setMeasurementStart] = useState(null);
    const [newElementName, setNewElementName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Value-added');
    const [quickMode, setQuickMode] = useState(false);
    const [autoCounter, setAutoCounter] = useState(1);
    const [currentCycle, setCurrentCycle] = useState(1);

    const categories = ['Value-added', 'Non value-added', 'Waste'];

    const getCategoryColor = (category) => {
        switch (category) {
            case 'Value-added': return '#005a9e';
            case 'Non value-added': return '#bfa900';
            case 'Waste': return '#c50f1f';
            default: return '#666';
        }
    };

    const handleStartMeasurement = () => {
        setMeasurementStart(videoState.currentTime);
        if (quickMode) {
            setNewElementName(`Element ${autoCounter}`);
        }
    };

    const handleEndMeasurement = () => {
        if (measurementStart !== null && newElementName.trim()) {
            const measurement = {
                id: Date.now().toString(),
                startTime: measurementStart,
                endTime: videoState.currentTime,
                elementName: newElementName,
                category: selectedCategory,
                duration: videoState.currentTime - measurementStart,
                rating: 0,
                cycle: currentCycle
            };
            onAddMeasurement(measurement);
            setMeasurementStart(null);
            setNewElementName('');
            if (quickMode) {
                setAutoCounter(prev => prev + 1);
            }
        }
    };

    const handleCancelMeasurement = () => {
        setMeasurementStart(null);
        setNewElementName('');
    };

    const handleNextCycle = () => {
        setCurrentCycle(prev => prev + 1);
        // Optional: Reset autoCounter if desired for new cycle
        // setAutoCounter(1); 
    };

    // Keyboard shortcut for quick measurement
    useEffect(() => {
        const handleKeyPress = (e) => {
            // M key for quick mark
            if (e.key === 'm' || e.key === 'M') {
                if (!e.target.matches('input, textarea, select')) {
                    e.preventDefault();
                    if (measurementStart === null) {
                        handleStartMeasurement();
                    } else {
                        handleEndMeasurement();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [measurementStart, newElementName, selectedCategory, quickMode, autoCounter, currentCycle]);

    return (
        <div style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '8px',
            borderRadius: '4px',
            marginTop: '10px'
        }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Left side: Start button or Recording controls */}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flex: 1 }}>
                    {measurementStart === null ? (
                        <button
                            className="btn"
                            onClick={handleStartMeasurement}
                            style={{
                                width: '40px',
                                height: '40px',
                                backgroundColor: 'var(--accent-blue)',
                                border: 'none',
                                borderRadius: '50%',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '1.3rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 3px 10px rgba(0,150,255,0.4)',
                                transition: 'all 0.2s',
                                padding: 0,
                                flexShrink: 0
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = 'scale(1.1)';
                                e.target.style.boxShadow = '0 5px 14px rgba(0,150,255,0.6)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = 'scale(1)';
                                e.target.style.boxShadow = '0 3px 10px rgba(0,150,255,0.4)';
                            }}
                            title={`Start Measurement${quickMode ? ' (M)' : ''}`}
                        >
                            ⏱️
                        </button>
                    ) : (
                        <>
                            <div style={{
                                padding: '4px 10px',
                                backgroundColor: '#1a1a1a',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                color: '#0f0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                border: '1px solid #0a0',
                                flexShrink: 0
                            }}>
                                🔴 {measurementStart.toFixed(2)}s
                            </div>
                            <button
                                className="btn"
                                onClick={handleEndMeasurement}
                                style={{
                                    backgroundColor: '#0a0',
                                    padding: '6px 12px',
                                    fontSize: '1rem',
                                    minWidth: '36px',
                                    borderRadius: '4px',
                                    flexShrink: 0
                                }}
                                title="End & Save (E key)"
                            >
                                ✓
                            </button>
                            <button
                                className="btn"
                                onClick={handleCancelMeasurement}
                                style={{
                                    backgroundColor: '#a00',
                                    padding: '6px 12px',
                                    fontSize: '1rem',
                                    minWidth: '36px',
                                    borderRadius: '4px',
                                    flexShrink: 0
                                }}
                                title="Cancel"
                            >
                                ✗
                            </button>
                            {!quickMode && (
                                <input
                                    type="text"
                                    placeholder="Element Name"
                                    value={newElementName}
                                    onChange={(e) => setNewElementName(e.target.value)}
                                    autoFocus
                                    style={{
                                        padding: '4px 8px',
                                        backgroundColor: '#333',
                                        border: '1px solid #555',
                                        color: 'white',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        flex: 1,
                                        minWidth: '120px'
                                    }}
                                />
                            )}
                            {quickMode && (
                                <div style={{
                                    padding: '4px 8px',
                                    backgroundColor: '#222',
                                    borderRadius: '4px',
                                    fontSize: '0.8rem',
                                    color: '#0ff',
                                    border: '1px solid #555',
                                    flexShrink: 0
                                }}>
                                    {newElementName}
                                </div>
                            )}
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                style={{
                                    padding: '4px 8px',
                                    backgroundColor: '#333',
                                    border: '1px solid #555',
                                    color: 'white',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    flexShrink: 0
                                }}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </>
                    )}
                </div>

                {/* Right side: Cycle Control */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#1a1a1a',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: '1px solid #444',
                    flexShrink: 0
                }}>
                    <span style={{ color: '#aaa', fontSize: '0.75rem' }}>Cycle:</span>
                    <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem' }}>{currentCycle}</span>
                    <button
                        className="btn"
                        onClick={handleNextCycle}
                        title="Next Cycle"
                        style={{ padding: '3px 8px', fontSize: '0.75rem', backgroundColor: '#444', borderRadius: '4px' }}
                    >
                        Next ⏭
                    </button>
                </div>
            </div>

            {/* Quick Mode Info */}
            {quickMode && (
                <div style={{
                    padding: '8px',
                    backgroundColor: '#1a3a1a',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    color: '#0f0',
                    marginBottom: '10px',
                    border: '1px solid #0a0'
                }}>
                    💡 Quick Mode Active: Press <kbd style={{ backgroundColor: '#333', padding: '2px 6px', borderRadius: '3px' }}>M</kbd> to start/end measurement. Elements auto-named.
                </div>
            )}



            {/* Measurements List */}
            {videoState.measurements.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#aaa' }}>
                        Elements ({videoState.measurements.length})
                    </h4>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        {videoState.measurements.map((m, index) => (
                            <div
                                key={m.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: '5px',
                                    backgroundColor: index % 2 === 0 ? '#2a2a2a' : '#333',
                                    fontSize: '0.8rem',
                                    borderLeft: `4px solid ${getCategoryColor(m.category)}`
                                }}
                            >
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <span style={{ color: '#888', fontSize: '0.75rem', border: '1px solid #555', padding: '0 4px', borderRadius: '3px' }}>C{m.cycle || 1}</span>
                                    <span>{m.elementName}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <span>{m.duration.toFixed(2)}s</span>
                                    <button
                                        onClick={() => onRemoveMeasurement(m.id)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#f00',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        ✗
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default TimelineMeasurement;
