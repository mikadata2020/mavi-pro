import React, { useState, useRef, useEffect } from 'react';

function ElementRearrangement({ measurements, videoSrc, onUpdateMeasurements }) {
    console.log('ElementRearrangement render. videoSrc:', videoSrc ? 'Present' : 'Missing', 'Elements:', measurements.length);
    const [elements, setElements] = useState([]);
    const [draggedItem, setDraggedItem] = useState(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [currentSimulatingIndex, setCurrentSimulatingIndex] = useState(-1);
    const [showInfo, setShowInfo] = useState(true);
    const [selectedElements, setSelectedElements] = useState([]);
    const [showJointOptions, setShowJointOptions] = useState(false);
    const videoRef = useRef(null);
    const simulationTimeoutRef = useRef(null);

    useEffect(() => {
        setElements([...measurements]);
    }, [measurements]);

    const handleDragStart = (e, index) => {
        setDraggedItem(elements[index]);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        const draggedOverItem = elements[index];

        if (draggedItem === draggedOverItem) {
            return;
        }

        let items = elements.filter(item => item !== draggedItem);
        items.splice(index, 0, draggedItem);
        setElements(items);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
    };

    const handleSaveChanges = () => {
        onUpdateMeasurements(elements);
        alert('Urutan elemen berhasil disimpan!');
    };

    const handleAutoArrange = (order) => {
        let sorted = [...elements];
        if (order === 'asc') {
            sorted.sort((a, b) => a.duration - b.duration);
        } else if (order === 'desc') {
            sorted.sort((a, b) => b.duration - a.duration);
        }
        setElements(sorted);
    };

    const toggleSelection = (index) => {
        setSelectedElements(prev => {
            if (prev.includes(index)) {
                return prev.filter(i => i !== index);
            } else {
                if (prev.length >= 2) {
                    // Keep only the most recently selected and the new one, or just prevent?
                    // Let's prevent selecting more than 2 for clarity, or just replace the first one.
                    // User requirement implies selecting 2 specific elements.
                    // Let's allow max 2.
                    return [...prev, index].slice(-2);
                }
                return [...prev, index];
            }
        });
    };

    const handleJointClick = () => {
        if (selectedElements.length !== 2) {
            alert('Pilih tepat 2 elemen untuk digabungkan (Joint).');
            return;
        }
        setShowJointOptions(true);
    };

    const handleJointConfirm = (position) => {
        const [firstIndex, secondIndex] = selectedElements;
        // Ensure indices are valid and sorted to handle removal correctly if needed, 
        // but here we are moving one relative to another.

        // We need to identify the actual elements because indices might shift if we remove one.
        const firstElement = elements[firstIndex];
        const secondElement = elements[secondIndex];

        let newElements = elements.filter((_, idx) => idx !== firstIndex);

        // Find the new index of the second element
        let newSecondIndex = newElements.indexOf(secondElement);

        if (position === 'front') {
            // Insert before the second element
            newElements.splice(newSecondIndex, 0, firstElement);
        } else {
            // Insert after the second element
            newElements.splice(newSecondIndex + 1, 0, firstElement);
        }

        setElements(newElements);
        setSelectedElements([]);
        setShowJointOptions(false);
    };

    const startSimulation = () => {
        console.log('startSimulation called');

        if (!videoSrc) {
            alert('Video belum dimuat! Silakan muat proyek atau video terlebih dahulu.');
            return;
        }

        if (elements.length === 0) {
            alert('Belum ada elemen untuk disimulasikan!');
            return;
        }

        if (!videoRef.current) {
            console.warn('Video ref missing despite videoSrc present');
            return;
        }

        setIsSimulating(true);
        setCurrentSimulatingIndex(0);
    };

    const stopSimulation = () => {
        console.log('stopSimulation called');
        setIsSimulating(false);
        setCurrentSimulatingIndex(-1);
        if (videoRef.current) {
            videoRef.current.pause();
        }
        if (simulationTimeoutRef.current) {
            clearTimeout(simulationTimeoutRef.current);
        }
    };

    useEffect(() => {
        if (isSimulating && currentSimulatingIndex >= 0) {
            if (currentSimulatingIndex >= elements.length) {
                stopSimulation();
                return;
            }

            const element = elements[currentSimulatingIndex];
            console.log('Simulating element:', currentSimulatingIndex, element);

            if (videoRef.current) {
                const startTime = Number(element.startTime);
                if (!isNaN(startTime)) {
                    videoRef.current.currentTime = startTime;
                    videoRef.current.play().catch(err => {
                        console.error("Video play error:", err);
                        // Try playing muted if autoplay blocked
                        if (err.name === 'NotAllowedError') {
                            videoRef.current.muted = true;
                            videoRef.current.play().catch(e => console.error("Muted play also failed:", e));
                        }
                    });

                    const durationMs = element.duration * 1000;
                    simulationTimeoutRef.current = setTimeout(() => {
                        setCurrentSimulatingIndex(prev => prev + 1);
                    }, durationMs);
                } else {
                    console.warn('Invalid startTime for element:', element);
                    // Skip to next if invalid
                    setCurrentSimulatingIndex(prev => prev + 1);
                }
            }
        }

        return () => {
            if (simulationTimeoutRef.current) {
                clearTimeout(simulationTimeoutRef.current);
            }
        };
    }, [isSimulating, currentSimulatingIndex, elements]);

    useEffect(() => {
        if (!isSimulating && videoRef.current) {
            videoRef.current.pause();
            if (simulationTimeoutRef.current) {
                clearTimeout(simulationTimeoutRef.current);
            }
        }
    }, [isSimulating]);

    return (
        <div style={{ height: '100%', display: 'flex', gap: '10px', padding: '10px', backgroundColor: 'var(--bg-secondary)' }}>
            {/* Left Panel: List & Controls */}
            <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>🔄 Rearrange Elements</h2>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            className="btn"
                            onClick={handleSaveChanges}
                            style={{ backgroundColor: '#0a5' }}
                        >
                            💾 Simpan Urutan
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', padding: '10px', backgroundColor: '#2a2a2a', borderRadius: '6px', flexWrap: 'wrap' }}>
                    <span style={{ color: '#aaa', fontSize: '0.9rem', alignSelf: 'center', width: '100%' }}>Auto Arrange:</span>
                    <button className="btn" onClick={() => handleAutoArrange('asc')} style={{ fontSize: '0.8rem', flex: 1 }}>⏱ Shortest</button>
                    <button className="btn" onClick={() => handleAutoArrange('desc')} style={{ fontSize: '0.8rem', flex: 1 }}>⏱ Longest</button>
                    <button
                        className="btn"
                        onClick={handleJointClick}
                        style={{
                            fontSize: '0.8rem',
                            flex: '1 1 100%',
                            backgroundColor: selectedElements.length === 2 ? 'var(--accent-blue)' : '#555',
                            cursor: selectedElements.length === 2 ? 'pointer' : 'not-allowed'
                        }}
                        disabled={selectedElements.length !== 2}
                    >
                        🔗 Joint Element
                    </button>
                </div>

                {showJointOptions && (
                    <div style={{
                        padding: '10px',
                        backgroundColor: '#444',
                        borderRadius: '6px',
                        border: '1px solid var(--accent-blue)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px'
                    }}>
                        <div style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '5px' }}>
                            Gabungkan <strong>Element {selectedElements[0] + 1}</strong> ke <strong>Element {selectedElements[1] + 1}</strong>:
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn" onClick={() => handleJointConfirm('front')} style={{ flex: 1, backgroundColor: '#0a5' }}>Depan</button>
                            <button className="btn" onClick={() => handleJointConfirm('back')} style={{ flex: 1, backgroundColor: '#c50f1f' }}>Belakang</button>
                            <button className="btn" onClick={() => setShowJointOptions(false)} style={{ width: '30px', padding: 0 }}>✕</button>
                        </div>
                    </div>
                )}

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {elements.map((element, index) => (
                        <div
                            key={element.id}
                            draggable={!isSimulating}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            style={{
                                padding: '10px',
                                backgroundColor: currentSimulatingIndex === index ? 'var(--accent-blue)' :
                                    selectedElements.includes(index) ? '#444' : '#333',
                                border: selectedElements.includes(index) ? '1px solid var(--accent-blue)' : '1px solid #555',
                                borderRadius: '4px',
                                cursor: isSimulating ? 'default' : 'grab',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                opacity: draggedItem === element ? 0.5 : 1,
                                transition: 'background-color 0.2s'
                            }}
                        >
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedElements.includes(index)}
                                    onChange={() => toggleSelection(index)}
                                    style={{ cursor: 'pointer' }}
                                />
                                <span style={{ color: '#888', width: '20px' }}>{index + 1}.</span>
                                <span style={{ fontWeight: 'bold', color: '#fff' }}>{element.elementName}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem', color: '#aaa' }}>
                                <span>{element.duration.toFixed(2)}s</span>
                                <span style={{
                                    color: element.category === 'Value-added' ? '#4da6ff' :
                                        element.category === 'Non value-added' ? '#ffd700' : '#ff4d4d'
                                }}>
                                    {element.category}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Panel: Simulation Preview */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>📺 Simulation Preview</h3>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ccc', fontSize: '0.9rem', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={showInfo}
                            onChange={(e) => setShowInfo(e.target.checked)}
                        />
                        Tampilkan Informasi
                    </label>
                </div>

                <div style={{
                    width: '100%',
                    flex: 1,
                    backgroundColor: '#000',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    position: 'relative',
                    border: '1px solid #444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {videoSrc ? (
                        <video
                            ref={videoRef}
                            src={videoSrc}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            controls={false}
                        />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                            No Video Loaded
                        </div>
                    )}

                    {isSimulating && showInfo && elements[currentSimulatingIndex] && (
                        <div style={{
                            position: 'absolute',
                            bottom: '20px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            padding: '10px 20px',
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            color: '#fff',
                            borderRadius: '30px',
                            fontSize: '1rem',
                            textAlign: 'center',
                            border: '1px solid rgba(255,255,255,0.2)',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                            minWidth: '300px'
                        }}>
                            <div style={{ color: 'var(--accent-blue)', fontWeight: 'bold', marginBottom: '2px' }}>
                                {currentSimulatingIndex + 1}. {elements[currentSimulatingIndex].elementName}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#ccc', display: 'flex', justifyContent: 'center', gap: '15px' }}>
                                <span>⏱ {elements[currentSimulatingIndex].duration.toFixed(2)}s</span>
                                <span style={{
                                    color: elements[currentSimulatingIndex].category === 'Value-added' ? '#4da6ff' :
                                        elements[currentSimulatingIndex].category === 'Non value-added' ? '#ffd700' : '#ff4d4d'
                                }}>
                                    ● {elements[currentSimulatingIndex].category}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', paddingBottom: '10px' }}>
                    {!isSimulating ? (
                        <button
                            className="btn"
                            onClick={startSimulation}
                            style={{
                                padding: '10px 30px',
                                fontSize: '1.1rem',
                                backgroundColor: 'var(--accent-blue)',
                                opacity: (!videoSrc || elements.length === 0) ? 0.5 : 1
                            }}
                        >
                            ▶ Start Simulation
                        </button>
                    ) : (
                        <button
                            className="btn"
                            onClick={stopSimulation}
                            style={{ padding: '10px 30px', fontSize: '1.1rem', backgroundColor: '#c50f1f' }}
                        >
                            ⏹ Stop Simulation
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ElementRearrangement;
