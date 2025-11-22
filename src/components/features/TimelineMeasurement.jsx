import React, { useState, useEffect } from 'react';

function TimelineMeasurement({ videoState, onAddMeasurement, onRemoveMeasurement }) {
    const [measurementStart, setMeasurementStart] = useState(null);
    const [newElementName, setNewElementName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Value-added');
    const [quickMode, setQuickMode] = useState(false);
    const [autoCounter, setAutoCounter] = useState(1);

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
                rating: 0
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
    }, [measurementStart, newElementName, selectedCategory, quickMode, autoCounter]);

    return (
        <div style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '10px',
            borderRadius: '4px',
            marginTop: '10px'
        }}>
            {/* Measurement Controls */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                {measurementStart === null ? (
                    <button
                        className="btn"
                        onClick={handleStartMeasurement}
                        style={{ backgroundColor: 'var(--accent-blue)' }}
                    >
                        ⏱ Start Measurement {quickMode && '(M)'}
                    </button>
                ) : (
                    <>
                        <div style={{
                            padding: '5px 10px',
                            backgroundColor: '#333',
                            borderRadius: '4px',
                            fontSize: '0.85rem',
                            color: '#0f0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                        }}>
                            🔴 Recording... Start: {measurementStart.toFixed(2)}s
                        </div>
                        <button
                            className="btn"
                            onClick={handleEndMeasurement}
                            style={{
                                backgroundColor: '#0a0',
                                padding: '8px 14px',
                                fontSize: '1.2rem',
                                minWidth: '40px'
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
                                padding: '8px 14px',
                                fontSize: '1.2rem',
                                minWidth: '40px'
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
                                    padding: '5px 10px',
                                    backgroundColor: '#333',
                                    border: '1px solid #555',
                                    color: 'white',
                                    borderRadius: '4px',
                                    fontSize: '0.85rem',
                                    width: '250px'
                                }}
                            />
                        )}
                        {quickMode && (
                            <div style={{
                                padding: '5px 10px',
                                backgroundColor: '#222',
                                borderRadius: '4px',
                                fontSize: '0.85rem',
                                color: '#0ff',
                                border: '1px solid #555'
                            }}>
                                {newElementName}
                            </div>
                        )}
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            style={{
                                padding: '5px 10px',
                                backgroundColor: '#333',
                                border: '1px solid #555',
                                color: 'white',
                                borderRadius: '4px',
                                fontSize: '0.85rem'
                            }}
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </>
                )}
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

            {/* Timeline Visualization */}
            <div style={{
                position: 'relative',
                height: '60px',
                backgroundColor: '#1a1a1a',
                borderRadius: '4px',
                overflow: 'hidden'
            }}>
                {/* Measurements */}
                {videoState.measurements.map(measurement => {
                    const left = (measurement.startTime / videoState.duration) * 100;
                    const width = ((measurement.endTime - measurement.startTime) / videoState.duration) * 100;

                    return (
                        <div
                            key={measurement.id}
                            style={{
                                position: 'absolute',
                                left: `${left}%`,
                                width: `${width}%`,
                                height: '40px',
                                top: '10px',
                                backgroundColor: getCategoryColor(measurement.category),
                                border: '1px solid #fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                color: 'white',
                                overflow: 'hidden',
                                cursor: 'pointer'
                            }}
                            title={`${measurement.elementName} (${measurement.duration.toFixed(2)}s)`}
                            onClick={() => onRemoveMeasurement(measurement.id)}
                        >
                            {measurement.elementName}
                        </div>
                    );
                })}

                {/* Current Time Indicator */}
                <div
                    style={{
                        position: 'absolute',
                        left: `${(videoState.currentTime / videoState.duration) * 100}%`,
                        width: '2px',
                        height: '100%',
                        backgroundColor: '#f00',
                        zIndex: 10
                    }}
                />
            </div>

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
                                <span>{m.elementName}</span>
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
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default TimelineMeasurement;
