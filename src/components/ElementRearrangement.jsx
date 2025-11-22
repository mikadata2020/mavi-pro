import React, { useState, useRef, useEffect } from 'react';

function ElementRearrangement({ measurements, videoSrc, onUpdateMeasurements }) {
    const [elements, setElements] = useState([]);
    const [draggedItem, setDraggedItem] = useState(null);
    const [isSimulating, setIsSimulating] = useState(false);
    const [currentSimulatingIndex, setCurrentSimulatingIndex] = useState(-1);
    const [showInfo, setShowInfo] = useState(true);
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

    const startSimulation = () => {
        if (!videoRef.current || elements.length === 0) return;
        setIsSimulating(true);
        setCurrentSimulatingIndex(0);
    };

    const stopSimulation = () => {
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
            if (videoRef.current) {
                videoRef.current.currentTime = element.startTime;
                videoRef.current.play().catch(err => console.error("Video play error:", err));

                const durationMs = element.duration * 1000;
                simulationTimeoutRef.current = setTimeout(() => {
                    setCurrentSimulatingIndex(prev => prev + 1);
                }, durationMs);
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
        <div style={{ height: '100%', display: 'flex', gap: '20px', padding: '20px', backgroundColor: 'var(--bg-secondary)' }}>
            {/* Left Panel: List & Controls */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
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

                <div style={{ display: 'flex', gap: '10px', padding: '10px', backgroundColor: '#2a2a2a', borderRadius: '6px' }}>
                    <span style={{ color: '#aaa', fontSize: '0.9rem', alignSelf: 'center' }}>Auto Arrange:</span>
                    <button className="btn" onClick={() => handleAutoArrange('asc')} style={{ fontSize: '0.8rem' }}>⏱ Duration (Shortest)</button>
                    <button className="btn" onClick={() => handleAutoArrange('desc')} style={{ fontSize: '0.8rem' }}>⏱ Duration (Longest)</button>
                </div>

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
                                backgroundColor: currentSimulatingIndex === index ? 'var(--accent-blue)' : '#333',
                                border: '1px solid #555',
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
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>📺 Simulation Preview</h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ccc', fontSize: '0.9rem', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={showInfo}
                            onChange={(e) => setShowInfo(e.target.checked)}
                        />
                        Tampilkan Informasi Elemen (Nama & Waktu)
                    </label>
                </div>

                <div style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    backgroundColor: '#000',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    position: 'relative',
                    border: '1px solid #444'
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

                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                    {!isSimulating ? (
                        <button
                            className="btn"
                            onClick={startSimulation}
                            disabled={!videoSrc || elements.length === 0}
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

                <div style={{ padding: '15px', backgroundColor: '#1a1a1a', borderRadius: '6px', fontSize: '0.9rem', color: '#ccc' }}>
                    <p style={{ margin: '0 0 10px 0' }}><strong>ℹ️ Cara Penggunaan:</strong></p>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        <li>Drag & Drop elemen di list kiri untuk mengubah urutan.</li>
                        <li>Gunakan tombol "Auto Arrange" untuk mengurutkan berdasarkan durasi.</li>
                        <li>Klik "Start Simulation" untuk melihat preview video dengan urutan baru.</li>
                        <li>Centang "Tampilkan Informasi" untuk melihat detail elemen saat simulasi.</li>
                        <li>Klik "Simpan Urutan" untuk menerapkan perubahan ke data utama.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default ElementRearrangement;
