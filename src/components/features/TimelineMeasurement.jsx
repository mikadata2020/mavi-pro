import React, { useState, useEffect, useRef } from 'react';
import { THERBLIGS } from '../../constants/therbligs.jsx';
import {
    getAutoCompleteSuggestions,
    validateMeasurement,
    detectDuplicates
} from '../../utils/smartSuggestions';

function TimelineMeasurement({ videoState, onAddMeasurement, onRemoveMeasurement }) {
    const [measurementStart, setMeasurementStart] = useState(null);
    const [newElementName, setNewElementName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Value-added');
    const [selectedTherblig, setSelectedTherblig] = useState('');
    const [quickMode, setQuickMode] = useState(false);
    const [autoCounter, setAutoCounter] = useState(1);
    const [currentCycle, setCurrentCycle] = useState(1);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [validationWarnings, setValidationWarnings] = useState([]);
    const inputRef = useRef(null);

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
        } else {
            setValidationWarnings([]);
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
                therblig: selectedTherblig,
                duration: videoState.currentTime - measurementStart,
                rating: 0,
                cycle: currentCycle
            };

            // Validate before adding
            const { warnings } = validateMeasurement(measurement, videoState.measurements);
            if (warnings.length > 0) {
                setValidationWarnings(warnings);
                // Still add but show warnings
            }

            onAddMeasurement(measurement);
            setMeasurementStart(null);
            setNewElementName('');
            setValidationWarnings([]);
            setSuggestions([]);
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
    }, [measurementStart, newElementName, selectedCategory, selectedTherblig, quickMode, autoCounter, currentCycle]);

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
                                <div style={{ position: 'relative', flex: 1, minWidth: '120px' }}>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        placeholder="Element Name"
                                        value={newElementName}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setNewElementName(value);

                                            // Get suggestions
                                            if (value.length >= 2) {
                                                const autoSuggestions = getAutoCompleteSuggestions(
                                                    value,
                                                    videoState.measurements,
                                                    selectedCategory
                                                );
                                                setSuggestions(autoSuggestions.elementNames);
                                                setShowSuggestions(true);

                                                // Auto-suggest category and therblig
                                                if (autoSuggestions.category && !selectedCategory) {
                                                    setSelectedCategory(autoSuggestions.category);
                                                }
                                                if (autoSuggestions.therblig && !selectedTherblig) {
                                                    setSelectedTherblig(autoSuggestions.therblig);
                                                }
                                            } else {
                                                setSuggestions([]);
                                                setShowSuggestions(false);
                                            }
                                        }}
                                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                        autoFocus
                                        style={{
                                            padding: '4px 8px',
                                            backgroundColor: '#333',
                                            border: '1px solid #555',
                                            color: 'white',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem',
                                            width: '100%'
                                        }}
                                    />
                                    {/* Auto-complete dropdown */}
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            backgroundColor: '#2a2a2a',
                                            border: '1px solid #555',
                                            borderRadius: '4px',
                                            marginTop: '2px',
                                            maxHeight: '150px',
                                            overflowY: 'auto',
                                            zIndex: 1000,
                                            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                                        }}>
                                            {suggestions.map((suggestion, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => {
                                                        setNewElementName(suggestion);
                                                        setShowSuggestions(false);
                                                        inputRef.current?.focus();
                                                    }}
                                                    style={{
                                                        padding: '6px 10px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem',
                                                        color: '#fff',
                                                        borderBottom: index < suggestions.length - 1 ? '1px solid #444' : 'none'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#005a9e'}
                                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                                >
                                                    💡 {suggestion}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {/* Validation warnings */}
                                    {validationWarnings.length > 0 && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            backgroundColor: '#3a2a00',
                                            border: '1px solid #ff9800',
                                            borderRadius: '4px',
                                            marginTop: '2px',
                                            padding: '6px 10px',
                                            fontSize: '0.75rem',
                                            color: '#ffa726',
                                            zIndex: 999
                                        }}>
                                            {validationWarnings.map((warning, index) => (
                                                <div key={index}>⚠️ {warning.message}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
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
                            <select
                                value={selectedTherblig}
                                onChange={(e) => setSelectedTherblig(e.target.value)}
                                style={{
                                    padding: '4px 8px',
                                    backgroundColor: '#333',
                                    border: '1px solid #555',
                                    color: 'white',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    flexShrink: 0,
                                    maxWidth: '100px'
                                }}
                            >
                                <option value="">Therblig</option>
                                {Object.entries(THERBLIGS).map(([code, { name }]) => (
                                    <option key={code} value={code}>{code}</option>
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



            {/* Gantt Chart Area */}
            {videoState.measurements.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#aaa' }}>
                        Gantt Chart Area ({videoState.measurements.length})
                    </h4>
                    <div style={{ maxHeight: '150px', overflowY: 'auto', backgroundColor: '#1a1a1a', padding: '5px', borderRadius: '4px', border: '1px solid #333' }}>
                        {(() => {
                            const totalDuration = Math.max(...videoState.measurements.map(m => m.endTime), videoState.duration || 1);
                            const markerCount = Math.min(Math.ceil(totalDuration), 20); // Max 20 markers
                            const interval = totalDuration / markerCount;

                            return (
                                <>
                                    {/* Ruler */}
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', fontSize: '0.7rem' }}>
                                        <div style={{ width: '120px', marginRight: '10px' }}></div>
                                        <div style={{ flex: 1, position: 'relative', height: '20px', borderBottom: '1px solid #555' }}>
                                            {Array.from({ length: markerCount + 1 }).map((_, i) => {
                                                const time = i * interval;
                                                const pos = (time / totalDuration) * 100;
                                                return (
                                                    <div key={i} style={{
                                                        position: 'absolute',
                                                        left: `${pos}%`,
                                                        top: 0,
                                                        height: '100%',
                                                        borderLeft: '1px solid #666',
                                                        display: 'flex',
                                                        alignItems: 'flex-end',
                                                        paddingBottom: '2px'
                                                    }}>
                                                        <span style={{
                                                            fontSize: '0.65rem',
                                                            color: '#888',
                                                            transform: 'translateX(-50%)',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            {time.toFixed(1)}s
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                            {/* Playhead indicator */}
                                            {videoState.currentTime > 0 && (
                                                <div style={{
                                                    position: 'absolute',
                                                    left: `${(videoState.currentTime / totalDuration) * 100}%`,
                                                    top: '-5px',
                                                    bottom: '-5px',
                                                    width: '2px',
                                                    backgroundColor: '#ff0000',
                                                    pointerEvents: 'none',
                                                    zIndex: 100
                                                }}>
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '-6px',
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        width: 0,
                                                        height: 0,
                                                        borderLeft: '5px solid transparent',
                                                        borderRight: '5px solid transparent',
                                                        borderTop: '6px solid #ff0000'
                                                    }} />
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ width: '45px', marginLeft: '5px' }}></div>
                                    </div>

                                    {/* Gantt Bars */}
                                    {videoState.measurements.map((m, index) => {
                                        const startPercent = (m.startTime / totalDuration) * 100;
                                        const widthPercent = (m.duration / totalDuration) * 100;

                                        return (
                                            <div key={m.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', fontSize: '0.75rem' }}>
                                                <div style={{ width: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '10px', color: '#ccc' }} title={m.elementName}>
                                                    {m.elementName}
                                                </div>
                                                <div style={{ flex: 1, position: 'relative', height: '16px', backgroundColor: '#333', borderRadius: '2px' }}>
                                                    {/* Grid lines */}
                                                    {Array.from({ length: markerCount + 1 }).map((_, i) => {
                                                        const pos = (i * interval / totalDuration) * 100;
                                                        return (
                                                            <div key={i} style={{
                                                                position: 'absolute',
                                                                left: `${pos}%`,
                                                                top: 0,
                                                                bottom: 0,
                                                                borderLeft: '1px solid #444',
                                                                pointerEvents: 'none'
                                                            }} />
                                                        );
                                                    })}
                                                    {/* Bar */}
                                                    <div style={{
                                                        position: 'absolute',
                                                        left: `${startPercent}%`,
                                                        width: `${Math.max(widthPercent, 1)}%`,
                                                        height: '100%',
                                                        backgroundColor: getCategoryColor(m.category),
                                                        borderRadius: '2px',
                                                        minWidth: '2px',
                                                        zIndex: 1
                                                    }} title={`${m.elementName}: ${m.duration.toFixed(2)}s`} />
                                                </div>
                                                <div style={{ width: '45px', textAlign: 'right', marginLeft: '5px', color: '#888' }}>
                                                    {m.duration.toFixed(2)}s
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}

export default TimelineMeasurement;
