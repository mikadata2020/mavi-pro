import React, { useState, useEffect } from 'react';
import { getAllProjects } from '../utils/database';
import * as XLSX from 'xlsx';

import { exportSWCSToPDF } from '../utils/swcsExport';

function StandardWorkCombinationSheet({ currentProject }) {
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);
    const [loading, setLoading] = useState(true);

    // Header State
    const [headerInfo, setHeaderInfo] = useState({
        partName: '',
        partNo: '',
        workScope: '',
        taktTime: '',
        date: new Date().toISOString().split('T')[0],
        preparedBy: '',
        approvedBy: ''
    });

    useEffect(() => {
        loadProjects();
    }, []);

    // Sync with global currentProject if it changes
    useEffect(() => {
        if (currentProject && projects.length > 0) {
            const project = projects.find(p => p.projectName === currentProject.projectName);
            if (project) {
                setSelectedProjectId(project.projectName);
                setSelectedProject(project);
            }
        }
    }, [currentProject, projects]);

    useEffect(() => {
        if (selectedProjectId && projects.length > 0) {
            const project = projects.find(p => p.projectName === selectedProjectId);
            setSelectedProject(project);
        } else if (!selectedProjectId) {
            setSelectedProject(null);
        }
    }, [selectedProjectId, projects]);

    const loadProjects = async () => {
        try {
            const allProjects = await getAllProjects();
            if (Array.isArray(allProjects)) {
                allProjects.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
                setProjects(allProjects);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleHeaderChange = (field, value) => {
        setHeaderInfo(prev => ({ ...prev, [field]: value }));
    };

    const handleExport = () => {
        if (!selectedProject && mode === 'project') return;
        const filename = `SWCS_${headerInfo.partName || 'Untitled'}_${headerInfo.date}.pdf`;
        exportSWCSToPDF('swcs-container', filename);
    };

    // Excel and Save Handlers
    const handleSaveManual = () => {
        const data = {
            headerInfo,
            manualMeasurements,
            version: '1.0'
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SWCS_Manual_${headerInfo.partName || 'Project'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleLoadManual = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.headerInfo) setHeaderInfo(data.headerInfo);
                if (data.manualMeasurements) setManualMeasurements(data.manualMeasurements);
                setMode('manual');
            } catch (err) {
                alert('Gagal memuat file JSON. Pastikan format benar.');
            }
        };
        reader.readAsText(file);
    };

    const handleExportExcel = () => {
        const dataToExport = mode === 'project' && selectedProject ? selectedProject.measurements : manualMeasurements;
        if (!dataToExport || dataToExport.length === 0) {
            alert('Tidak ada data untuk diekspor!');
            return;
        }

        const wsData = dataToExport.map((m, i) => ({
            'No': i + 1,
            'Element Name': m.elementName,
            'Manual Time': parseFloat(m.manualTime) || 0,
            'Auto Time': parseFloat(m.autoTime) || 0,
            'Walk Time': parseFloat(m.walkTime) || 0,
            'Timing Mode': m.timingMode || 'series',
            'Offset': m.offset || 0
        }));

        const ws = XLSX.utils.json_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "SWCS Data");
        XLSX.writeFile(wb, `SWCS_Data_${headerInfo.partName || 'Export'}.xlsx`);
    };

    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsName = wb.SheetNames[0];
                const ws = wb.Sheets[wsName];
                const data = XLSX.utils.sheet_to_json(ws);

                const newMeasurements = data.map(row => ({
                    elementName: row['Element Name'] || '',
                    manualTime: parseFloat(row['Manual Time']) || 0,
                    autoTime: parseFloat(row['Auto Time']) || 0,
                    walkTime: parseFloat(row['Walk Time']) || 0,
                    timingMode: (row['Timing Mode'] || 'series').toLowerCase(),
                    offset: parseFloat(row['Offset']) || 0
                }));

                setManualMeasurements(newMeasurements);
                setMode('manual');
            } catch (err) {
                console.error(err);
                alert('Gagal mengimpor Excel.');
            }
        };
        reader.readAsBinaryString(file);
    };

    // Helper to generate wavy path
    const generateWavyPath = (x1, y, x2, amplitude = 3, frequency = 0.2) => {
        let path = `M ${x1} ${y}`;
        const width = x2 - x1;
        const steps = Math.ceil(width); // One step per pixel for smoothness
        for (let i = 0; i <= steps; i++) {
            const x = x1 + i;
            const yOffset = Math.sin(i * frequency) * amplitude;
            path += ` L ${x} ${y + yOffset}`;
        }
        return path;
    };

    const [mode, setMode] = useState('project'); // 'project' or 'manual'
    const [manualMeasurements, setManualMeasurements] = useState([
        { elementName: 'Elemen 1', manualTime: 0, autoTime: 0, walkTime: 0, timingMode: 'series', offset: 0 }
    ]);

    // ... (existing useEffects)

    const [drawMode, setDrawMode] = useState(null); // 'text', 'arrow' (future), etc.
    const [columnWidths, setColumnWidths] = useState({
        no: 30,
        name: 150,
        man: 45,
        auto: 45,
        walk: 45,
        total: 45,
        timing: 80,
        offset: 50,
        start: 50,
        finish: 50,
        delete: 30
    });

    const handleColumnResize = (column, newWidth) => {
        setColumnWidths(prev => ({
            ...prev,
            [column]: Math.max(30, newWidth)
        }));
    };

    const autoFitColumns = () => {
        const newWidths = { ...columnWidths };
        const data = mode === 'project' ? (selectedProject ? selectedProject.measurements : []) : manualMeasurements;

        // Measure Element Name max width
        let maxChars = 12; // Default for 'Element Name'
        data.forEach(m => {
            if (m.elementName && m.elementName.length > maxChars) maxChars = m.elementName.length;
        });
        newWidths.name = Math.min(300, Math.max(100, maxChars * 8)); // Rough estimate

        setColumnWidths(newWidths);
    };

    const handleManualChange = (index, field, value) => {
        const newMeasurements = [...manualMeasurements];
        if (field === 'elementName' || field === 'timingMode') {
            newMeasurements[index] = { ...newMeasurements[index], [field]: value };
        } else {
            newMeasurements[index] = { ...newMeasurements[index], [field]: parseFloat(value) || 0 };
        }
        setManualMeasurements(newMeasurements);
    };

    const addManualRow = () => {
        setManualMeasurements([...manualMeasurements, { elementName: '', manualTime: 0, autoTime: 0, walkTime: 0, timingMode: 'series', offset: 0 }]);
    };

    const deleteManualRow = (index) => {
        const newMeasurements = manualMeasurements.filter((_, i) => i !== index);
        setManualMeasurements(newMeasurements);
    };

    const hasData = mode === 'project'
        ? (selectedProject && selectedProject.measurements && selectedProject.measurements.length > 0)
        : (manualMeasurements.length > 0);

    // Calculate start and end times for rendering
    const calculateTimedMeasurements = () => {
        const rawMeasurements = mode === 'project'
            ? (selectedProject ? selectedProject.measurements : [])
            : manualMeasurements;

        let lastFinishTime = 0;
        let lastRowStart = 0;

        return rawMeasurements.map((m, index) => {
            const manual = parseFloat(m.manualTime) || 0;
            const auto = parseFloat(m.autoTime) || 0;
            const walk = parseFloat(m.walkTime) || 0;
            const duration = manual + auto + walk;

            let startTime = 0;

            if (mode === 'project') {
                // Project mode: purely sequential for now (standard behavior)
                startTime = lastFinishTime; // Or just accumulate? usually SWCS is sequential
                // For existing projects, we assume Series with 0 offset
            } else {
                // Manual mode with advanced timing
                const timingMode = m.timingMode || 'series';
                const offset = parseFloat(m.offset) || 0;

                if (index === 0) {
                    startTime = offset;
                } else {
                    if (timingMode === 'series') {
                        startTime = lastFinishTime + offset;
                    } else if (timingMode === 'parallel') {
                        startTime = lastRowStart + offset;
                    }
                }
            }

            // Calculate component starts relative to row startTime
            // Standard SWCS Pattern: Manual -> Auto (parallel with next?) -> Walk
            // Usually: Manual happens, then Auto machine runs (operator moves away?), Walk happens
            // Visualizing:
            // Manual Bar: Starts at startTime
            // Auto Bar: Starts at startTime + manual (if auto follows manual)
            // Walk Bar: Starts at startTime + manual (if walk follows manual) OR startTime + manual + auto?
            // Let's assume: Manual -> Operator Walks. Auto runs after Manual.

            const rowStart = startTime;
            const manualStart = rowStart;
            const manualEnd = manualStart + manual;

            const autoStart = manualEnd; // Machine starts after loading
            const autoEnd = autoStart + auto;

            const walkStart = manualEnd; // Operator walks after loading
            const walkEnd = walkStart + walk;

            // For the next row calculations
            lastRowStart = rowStart;
            // The "Operator" is free after Manual + Walk? Or just Manual? 
            // In SWCS, the "Time Line" usually follows the Operator.
            // So the next element starts when the Operator is available.
            // Operator time = Manual + Walk.
            lastFinishTime = Math.max(manualEnd, autoEnd, walkEnd);

            return {
                ...m,
                _calculated: {
                    startTime: rowStart,
                    finishTime: Math.max(manualEnd, autoEnd, walkEnd), // Total duration of this row's activity
                    manualStart,
                    manualEnd,
                    autoStart,
                    autoEnd,
                    walkStart,
                    walkEnd
                }
            };
        });
    };

    const timedMeasurements = calculateTimedMeasurements();

    const [annotations, setAnnotations] = useState([]);

    const handleChartClick = (e) => {
        if (!drawMode) return;

        const svg = e.target.closest('svg');
        if (!svg) return;

        const rect = svg.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (drawMode === 'text') {
            const text = prompt('Masukkan teks:');
            if (text) {
                setAnnotations([...annotations, { type: 'text', x, y, content: text, color: 'black' }]);
            }
            setDrawMode(null); // Exit draw mode after one action
        }
    };

    const deleteAnnotation = (index) => {
        if (window.confirm('Hapus anotasi ini?')) {
            setAnnotations(annotations.filter((_, i) => i !== index));
        }
    }; // End Annotation Logic

    const renderChart = () => {
        if (!hasData) {
            return (
                <div style={{
                    color: '#888',
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    border: '1px dashed #444',
                    margin: '20px'
                }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>📊</div>
                    <div style={{ fontWeight: 'bold', color: '#ccc' }}>Tidak ada data</div>
                    <p style={{ fontSize: '0.9rem', margin: '5px 0 0' }}>
                        {mode === 'project' ? 'Pilih proyek yang memiliki data atau beralih ke Mode Manual.' : 'Tambahkan elemen kerja pada tabel di sebelah kiri.'}
                    </p>
                </div>
            );
        }

        const measurements = timedMeasurements;
        const rowHeight = 40;
        const headerHeight = 40; // Matched with table header height
        const chartHeight = measurements.length * rowHeight + headerHeight;

        let maxDuration = 0;
        measurements.forEach(m => {
            if (m._calculated.finishTime > maxDuration) maxDuration = m._calculated.finishTime;
        });

        // Dynamic chart width based on desired pixels per second for readability
        const minPixelsPerSecond = 5; // Minimum 5 pixels per second for readability
        const rulerBuffer = 30; // Fixed buffer in seconds
        const maxScaleTime = Math.max(maxDuration + rulerBuffer, 10);
        const chartWidth = Math.max(800, maxScaleTime * minPixelsPerSecond); // At least 800px or dynamic
        const pixelsPerSecond = chartWidth / maxScaleTime;

        // Debug logging
        console.log('SWCS Ruler Debug:', {
            maxDuration,
            rulerBuffer,
            maxScaleTime,
            chartWidth,
            pixelsPerSecond
        });

        return (
            <div
                className="swcs-chart-container"
                style={{
                    overflowX: 'auto',
                    backgroundColor: '#fff',
                    padding: '0',
                    borderRadius: '0',
                    cursor: drawMode ? 'crosshair' : 'default',
                    scrollbarWidth: 'none', // Hide scrollbar for Firefox
                    msOverflowStyle: 'none' // Hide scrollbar for IE/Edge
                }}
            >
                <style>
                    {`
                        .swcs-chart-container::-webkit-scrollbar {
                            display: none; /* Hide scrollbar for Chrome, Safari, Opera */
                        }
                    `}
                </style>
                <svg
                    width={chartWidth}
                    height={chartHeight}
                    style={{ display: 'block' }}
                    onClick={handleChartClick}
                >
                    {/* Header Background */}
                    <rect x="0" y="0" width={chartWidth} height={headerHeight} fill="#eee" />
                    {/* Header Bottom Border (Light) */}
                    <line x1="0" y1={headerHeight} x2={chartWidth} y2={headerHeight} stroke="#ccc" strokeWidth="1" />

                    {/* Grid Lines */}
                    {Array.from({ length: Math.ceil(maxScaleTime) + 1 }).map((_, i) => (
                        <line
                            key={i}
                            x1={i * pixelsPerSecond}
                            y1={headerHeight}
                            x2={i * pixelsPerSecond}
                            y2={chartHeight}
                            stroke="#eee"
                            strokeWidth="1"
                            pointerEvents="none"
                        />
                    ))}

                    {/* Ruler Ticks & Labels */}
                    {Array.from({ length: Math.ceil(maxScaleTime) + 1 }).map((_, i) => {
                        const x = i * pixelsPerSecond;
                        let tickHeight = 0;
                        let showLabel = false;

                        // Small ticks every 1s
                        tickHeight = 5;

                        // Medium ticks every 5s
                        if (i % 5 === 0) tickHeight = 10;

                        // Major ticks every 10s or 20s or 30s based on width
                        const labelInterval = pixelsPerSecond < 10 ? (pixelsPerSecond < 5 ? 30 : 20) : 10;
                        if (i % labelInterval === 0) {
                            tickHeight = 15;
                            showLabel = true;
                        }

                        return (
                            <g key={i}>
                                <line
                                    x1={x} y1={headerHeight}
                                    x2={x} y2={headerHeight - tickHeight}
                                    stroke="#555"
                                    strokeWidth="1"
                                />
                                {showLabel && (
                                    <text
                                        x={x}
                                        y={headerHeight - 22}
                                        fontSize="9"
                                        fill="#000"
                                        fontWeight="bold"
                                        textAnchor="middle"
                                    >
                                        {i}s
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Takt Time Line */}
                    {headerInfo.taktTime && (
                        <line
                            x1={headerInfo.taktTime * pixelsPerSecond}
                            y1={headerHeight}
                            x2={headerInfo.taktTime * pixelsPerSecond}
                            y2={chartHeight}
                            stroke="red"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                        />
                    )}

                    {/* Rows */}
                    {measurements.map((m, index) => {
                        const y = headerHeight + index * rowHeight + rowHeight / 2;
                        const { manualStart, manualEnd, autoStart, autoEnd, walkStart, walkEnd } = m._calculated;

                        const manualWidth = (manualEnd - manualStart) * pixelsPerSecond;
                        const autoWidth = (autoEnd - autoStart) * pixelsPerSecond;
                        const walkWidth = (walkEnd - walkStart) * pixelsPerSecond;

                        const elements = [];

                        // Manual
                        if (manualWidth > 0) {
                            elements.push(
                                <line
                                    key={`manual-${index}`}
                                    x1={manualStart * pixelsPerSecond}
                                    y1={y}
                                    x2={manualEnd * pixelsPerSecond}
                                    y2={y}
                                    stroke="green"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                />
                            );
                        }

                        // Auto
                        if (autoWidth > 0) {
                            elements.push(
                                <line
                                    key={`auto-${index}`}
                                    x1={autoStart * pixelsPerSecond}
                                    y1={y}
                                    x2={autoEnd * pixelsPerSecond}
                                    y2={y}
                                    stroke="darkblue"
                                    strokeWidth="4"
                                    strokeDasharray="5,3"
                                />
                            );
                        }

                        // Walk
                        if (walkWidth > 0) {
                            elements.push(
                                <path
                                    key={`walk-${index}`}
                                    d={generateWavyPath(walkStart * pixelsPerSecond, y, walkEnd * pixelsPerSecond)}
                                    stroke="red"
                                    strokeWidth="2"
                                    fill="none"
                                />
                            );
                        }

                        return (
                            <g key={index} pointerEvents="none">
                                {/* Row Horizontal Grid Line (Top) */}
                                <line
                                    x1="0"
                                    y1={headerHeight + index * rowHeight}
                                    x2={chartWidth}
                                    y2={headerHeight + index * rowHeight}
                                    stroke="#ccc"
                                    strokeWidth="1"
                                />
                                {/* Bottom Border for the last row or all rows */}
                                <line
                                    x1="0"
                                    y1={headerHeight + (index + 1) * rowHeight}
                                    x2={chartWidth}
                                    y2={headerHeight + (index + 1) * rowHeight}
                                    stroke="#ccc"
                                    strokeWidth="1"
                                />

                                {/* Row Background (Alternating) */}
                                <rect
                                    x="0"
                                    y={headerHeight + index * rowHeight}
                                    width={chartWidth}
                                    height={rowHeight}
                                    fill={index % 2 === 0 ? '#f9f9f9' : '#fff'}
                                    opacity="0.5"
                                />
                                {elements}
                            </g>
                        );
                    })}

                    {/* Annotations Layer */}
                    {annotations.map((ann, idx) => (
                        <g key={idx} onClick={(e) => { e.stopPropagation(); deleteAnnotation(idx); }} style={{ cursor: 'pointer' }}>
                            {ann.type === 'text' && (
                                <text x={ann.x} y={ann.y} fill={ann.color} fontSize="12" fontWeight="bold">{ann.content}</text>
                            )}
                        </g>
                    ))}

                </svg>
            </div>
        );
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-secondary)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>📋 Standard Work Combination Sheet</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', backgroundColor: '#333', borderRadius: '4px', overflow: 'hidden' }}>
                        <button
                            onClick={() => setMode('project')}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: mode === 'project' ? '#0078d4' : 'transparent',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <span style={{ marginRight: '5px' }}>📁</span> Proyek
                        </button>
                        <button
                            onClick={() => setMode('manual')}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: mode === 'manual' ? '#0078d4' : 'transparent',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <span style={{ marginRight: '5px' }}>✍️</span> Manual
                        </button>
                    </div>

                    {mode === 'project' && (
                        <select
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            style={{ padding: '8px', borderRadius: '4px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
                        >
                            <option value="">-- Pilih Proyek --</option>
                            {projects.map(p => (
                                <option key={p.projectName} value={p.projectName}>{p.projectName || p.videoName || 'Untitled'}</option>
                            ))}
                        </select>
                    )}
                    <button
                        onClick={handleExport}
                        disabled={!hasData}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: hasData ? '#0078d4' : '#555',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: hasData ? 'pointer' : 'not-allowed'
                        }}
                    >
                        Export PDF
                    </button>
                    {mode === 'manual' && (
                        <>
                            {/* Save/Load JSON */}
                            <button onClick={handleSaveManual} style={{ padding: '8px', cursor: 'pointer', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '4px' }} title="Simpan Project (JSON)">💾</button>
                            <label style={{ padding: '8px', cursor: 'pointer', backgroundColor: '#444', color: 'white', borderRadius: '4px', display: 'inline-block' }} title="Load Project (JSON)">
                                📂
                                <input type="file" onChange={handleLoadManual} accept=".json" style={{ display: 'none' }} />
                            </label>

                            {/* Excel Import/Export */}
                            <button onClick={handleExportExcel} style={{ padding: '8px', cursor: 'pointer', backgroundColor: '#217346', color: 'white', border: 'none', borderRadius: '4px' }} title="Export Excel">📊</button>
                            <label style={{ padding: '8px', cursor: 'pointer', backgroundColor: '#217346', color: 'white', borderRadius: '4px', display: 'inline-block' }} title="Import Excel">
                                📥
                                <input type="file" onChange={handleImportExcel} accept=".xlsx, .xls" style={{ display: 'none' }} />
                            </label>

                            {/* Draw Tools */}
                            <button
                                onClick={() => setDrawMode(drawMode === 'text' ? null : 'text')}
                                style={{
                                    padding: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: drawMode === 'text' ? '#0078d4' : '#444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px'
                                }}
                                title="Tambah Teks (Klik Chart)"
                            >
                                🔤
                            </button>
                            <button
                                onClick={autoFitColumns}
                                style={{
                                    padding: '5px 12px',
                                    backgroundColor: '#2196F3',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    marginLeft: '10px'
                                }}
                            >
                                📏 Fit Width
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
                {/* Container to be captured */}
                <div
                    id="swcs-container"
                    style={{
                        width: '1123px', // A4 Landscape width approx (at 96 DPI)
                        minHeight: '794px', // A4 Landscape height approx
                        backgroundColor: 'white',
                        padding: '20px',
                        boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                        color: 'black',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {/* Header Section */}
                    <div style={{ border: '1px solid black', marginBottom: '10px', padding: '10px' }}>
                        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.5rem', marginBottom: '10px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>
                            STANDARD WORK COMBINATION SHEET
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '0.9rem' }}>
                            <div>
                                <div style={{ display: 'flex', marginBottom: '5px' }}>
                                    <span style={{ width: '100px', fontWeight: 'bold' }}>Part Name:</span>
                                    <input
                                        type="text"
                                        value={headerInfo.partName}
                                        onChange={(e) => handleHeaderChange('partName', e.target.value)}
                                        style={{ border: 'none', borderBottom: '1px solid #ccc', flex: 1, outline: 'none' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', marginBottom: '5px' }}>
                                    <span style={{ width: '100px', fontWeight: 'bold' }}>Part No:</span>
                                    <input
                                        type="text"
                                        value={headerInfo.partNo}
                                        onChange={(e) => handleHeaderChange('partNo', e.target.value)}
                                        style={{ border: 'none', borderBottom: '1px solid #ccc', flex: 1, outline: 'none' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', marginBottom: '5px' }}>
                                    <span style={{ width: '100px', fontWeight: 'bold' }}>Work Scope:</span>
                                    <input
                                        type="text"
                                        value={headerInfo.workScope}
                                        onChange={(e) => handleHeaderChange('workScope', e.target.value)}
                                        style={{ border: 'none', borderBottom: '1px solid #ccc', flex: 1, outline: 'none' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', marginBottom: '5px' }}>
                                    <span style={{ width: '100px', fontWeight: 'bold' }}>Takt Time (s):</span>
                                    <input
                                        type="number"
                                        value={headerInfo.taktTime}
                                        onChange={(e) => handleHeaderChange('taktTime', e.target.value)}
                                        style={{ border: 'none', borderBottom: '1px solid #ccc', flex: 1, outline: 'none' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', marginBottom: '5px' }}>
                                    <span style={{ width: '100px', fontWeight: 'bold' }}>Date:</span>
                                    <input
                                        type="date"
                                        value={headerInfo.date}
                                        onChange={(e) => handleHeaderChange('date', e.target.value)}
                                        style={{ border: 'none', borderBottom: '1px solid #ccc', flex: 1, outline: 'none' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', marginBottom: '5px' }}>
                                    <span style={{ width: '100px', fontWeight: 'bold' }}>Prepared By:</span>
                                    <input
                                        type="text"
                                        value={headerInfo.preparedBy}
                                        onChange={(e) => handleHeaderChange('preparedBy', e.target.value)}
                                        style={{ border: 'none', borderBottom: '1px solid #ccc', flex: 1, outline: 'none' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div
                        style={{ display: 'flex', gap: '0', flex: 1, overflow: 'hidden' }}
                        onMouseMove={(e) => {
                            if (window._resizingColumn) {
                                const rect = window._resizingTarget.getBoundingClientRect();
                                const newWidth = e.clientX - rect.left;
                                handleColumnResize(window._resizingColumn, newWidth);
                            }
                        }}
                        onMouseUp={() => {
                            window._resizingColumn = null;
                            window._resizingTarget = null;
                            document.body.style.cursor = 'default';
                        }}
                    >
                        {/* Left Panel: Table */}
                        <div style={{ flex: '0 0 auto', border: '1px solid black', borderRight: 'none', overflowX: 'auto', maxWidth: '600px' }}>
                            <table style={{
                                width: 'min-content',
                                borderCollapse: 'separate',
                                borderSpacing: '0',
                                fontSize: '0.8rem',
                                tableLayout: 'fixed',
                                border: 'none'
                            }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#eee', height: '40px' }}>
                                        {[
                                            { id: 'no', label: 'No', width: columnWidths.no },
                                            { id: 'name', label: 'Element Name', width: columnWidths.name, textAlign: 'left' },
                                            { id: 'man', label: 'Man', width: columnWidths.man },
                                            { id: 'auto', label: 'Auto', width: columnWidths.auto },
                                            { id: 'walk', label: 'Walk', width: columnWidths.walk },
                                            { id: 'total', label: 'Total', width: columnWidths.total },
                                        ].map((col) => (
                                            <th key={col.id} style={{
                                                borderBottom: '1px solid black',
                                                borderRight: '1px solid black',
                                                padding: col.id === 'name' ? '0 5px' : '0',
                                                width: col.width,
                                                textAlign: col.textAlign || 'center',
                                                boxSizing: 'border-box',
                                                height: '40px',
                                                whiteSpace: 'nowrap',
                                                position: 'relative'
                                            }}>
                                                {col.label}
                                                <div
                                                    onMouseDown={(e) => {
                                                        window._resizingColumn = col.id;
                                                        window._resizingTarget = e.target.parentElement;
                                                        document.body.style.cursor = 'col-resize';
                                                    }}
                                                    style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '5px', cursor: 'col-resize', zIndex: 10 }}
                                                />
                                            </th>
                                        ))}
                                        {mode === 'manual' && [
                                            { id: 'timing', label: 'Timing', width: columnWidths.timing },
                                            { id: 'offset', label: 'Offset', width: columnWidths.offset },
                                            { id: 'start', label: 'Start', width: columnWidths.start, bg: '#e6f7ff' },
                                            { id: 'finish', label: 'Finish', width: columnWidths.finish, bg: '#e6f7ff' },
                                            { id: 'delete', label: '', width: columnWidths.delete },
                                        ].map((col) => (
                                            <th key={col.id} style={{
                                                borderBottom: '1px solid black',
                                                borderRight: col.id === 'delete' ? 'none' : '1px solid black',
                                                padding: '0',
                                                width: col.width,
                                                textAlign: 'center',
                                                backgroundColor: col.bg || 'inherit',
                                                height: '40px',
                                                boxSizing: 'border-box',
                                                whiteSpace: 'nowrap',
                                                position: 'relative'
                                            }}>
                                                {col.label}
                                                {col.id !== 'delete' && (
                                                    <div
                                                        onMouseDown={(e) => {
                                                            window._resizingColumn = col.id;
                                                            window._resizingTarget = e.target.parentElement;
                                                            document.body.style.cursor = 'col-resize';
                                                        }}
                                                        style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '5px', cursor: 'col-resize', zIndex: 10 }}
                                                    />
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {timedMeasurements.map((m, idx) => (
                                        <tr key={idx} style={{ height: '40px' }}>
                                            <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '0', textAlign: 'center', height: '40px', boxSizing: 'border-box', width: columnWidths.no }}>{idx + 1}</td>
                                            <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '0', height: '40px', boxSizing: 'border-box', width: columnWidths.name }}>
                                                {mode === 'manual' ? (
                                                    <input
                                                        type="text"
                                                        value={m.elementName}
                                                        onChange={(e) => handleManualChange(idx, 'elementName', e.target.value)}
                                                        style={{ width: '100%', height: '100%', border: 'none', padding: '0 5px', outline: 'none', boxSizing: 'border-box', background: 'transparent' }}
                                                        placeholder="Element..."
                                                    />
                                                ) : <div style={{ padding: '0 5px', height: '100%', display: 'flex', alignItems: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.elementName}</div>}
                                            </td>
                                            <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '0', textAlign: 'center', height: '40px', boxSizing: 'border-box', width: columnWidths.man }}>
                                                {mode === 'manual' ? (
                                                    <input
                                                        type="number"
                                                        value={m.manualTime}
                                                        onChange={(e) => handleManualChange(idx, 'manualTime', e.target.value)}
                                                        style={{ width: '100%', height: '100%', border: 'none', padding: '0', outline: 'none', textAlign: 'center', boxSizing: 'border-box', background: 'transparent' }}
                                                    />
                                                ) : (m.manualTime ? m.manualTime.toFixed(1) : '')}
                                            </td>
                                            <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '0', textAlign: 'center', height: '40px', boxSizing: 'border-box', width: columnWidths.auto }}>
                                                {mode === 'manual' ? (
                                                    <input
                                                        type="number"
                                                        value={m.autoTime}
                                                        onChange={(e) => handleManualChange(idx, 'autoTime', e.target.value)}
                                                        style={{ width: '100%', height: '100%', border: 'none', padding: '0', outline: 'none', textAlign: 'center', boxSizing: 'border-box', background: 'transparent' }}
                                                    />
                                                ) : (m.autoTime ? m.autoTime.toFixed(1) : '')}
                                            </td>
                                            <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '0', textAlign: 'center', height: '40px', boxSizing: 'border-box', width: columnWidths.walk }}>
                                                {mode === 'manual' ? (
                                                    <input
                                                        type="number"
                                                        value={m.walkTime}
                                                        onChange={(e) => handleManualChange(idx, 'walkTime', e.target.value)}
                                                        style={{ width: '100%', height: '100%', border: 'none', padding: '0', outline: 'none', textAlign: 'center', boxSizing: 'border-box', background: 'transparent' }}
                                                    />
                                                ) : (m.walkTime ? m.walkTime.toFixed(1) : '')}
                                            </td>
                                            <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '0', textAlign: 'center', fontWeight: 'bold', height: '40px', boxSizing: 'border-box', width: columnWidths.total }}>
                                                {((parseFloat(m.manualTime) || 0) + (parseFloat(m.autoTime) || 0) + (parseFloat(m.walkTime) || 0)).toFixed(1)}
                                            </td>
                                            {mode === 'manual' && (
                                                <>
                                                    <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '0', textAlign: 'center', height: '40px', boxSizing: 'border-box', width: columnWidths.timing }}>
                                                        <select
                                                            value={m.timingMode}
                                                            onChange={(e) => handleManualChange(idx, 'timingMode', e.target.value)}
                                                            style={{ width: '100%', height: '100%', border: 'none', padding: '0 2px', outline: 'none', fontSize: '0.75rem', boxSizing: 'border-box', background: 'transparent' }}
                                                            disabled={idx === 0}
                                                        >
                                                            <option value="series">Series</option>
                                                            <option value="parallel">Parallel</option>
                                                        </select>
                                                    </td>
                                                    <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '0', textAlign: 'center', height: '40px', boxSizing: 'border-box', width: columnWidths.offset }}>
                                                        <input
                                                            type="number"
                                                            value={m.offset}
                                                            onChange={(e) => handleManualChange(idx, 'offset', e.target.value)}
                                                            style={{ width: '100%', height: '100%', border: 'none', padding: '0', outline: 'none', textAlign: 'center', boxSizing: 'border-box', background: 'transparent' }}
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                    <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '0', textAlign: 'center', backgroundColor: '#f0faff', fontSize: '0.8rem', height: '40px', boxSizing: 'border-box', width: columnWidths.start }}>
                                                        <div style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {m._calculated ? m._calculated.startTime.toFixed(1) : '-'}
                                                        </div>
                                                    </td>
                                                    <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '0', textAlign: 'center', backgroundColor: '#f0faff', fontSize: '0.8rem', height: '40px', boxSizing: 'border-box', width: columnWidths.finish }}>
                                                        <div style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {m._calculated ? m._calculated.finishTime.toFixed(1) : '-'}
                                                        </div>
                                                    </td>
                                                    <td style={{ borderBottom: '1px solid black', padding: '0', textAlign: 'center', height: '40px', boxSizing: 'border-box', width: columnWidths.delete }}>
                                                        <button
                                                            onClick={() => deleteManualRow(idx)}
                                                            style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0', height: '100%', width: '100%', boxSizing: 'border-box' }}
                                                            title="Hapus baris"
                                                        >
                                                            &times;
                                                        </button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    {mode === 'manual' && (
                                        <tr style={{ height: '40px' }}>
                                            <td colSpan={11} style={{ borderBottom: '1px solid black', padding: '0', textAlign: 'center', height: '40px' }}>
                                                <button
                                                    onClick={addManualRow}
                                                    style={{ border: 'none', background: '#f5f5f5', width: '100%', height: '100%', padding: '0', cursor: 'pointer', color: '#666', fontSize: '0.8rem' }}
                                                >
                                                    + Tambah Element
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                    {/* Totals Row */}
                                    <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold', height: '40px' }}>
                                        <td colSpan="2" style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '0 5px', textAlign: 'right', height: '40px', width: columnWidths.no + columnWidths.name }}>Total</td>
                                        <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '0', textAlign: 'center', height: '40px', width: columnWidths.man }}>
                                            {timedMeasurements.reduce((sum, m) => sum + (parseFloat(m.manualTime) || 0), 0).toFixed(1)}
                                        </td>
                                        <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '0', textAlign: 'center', height: '40px', width: columnWidths.auto }}>
                                            {timedMeasurements.reduce((sum, m) => sum + (parseFloat(m.autoTime) || 0), 0).toFixed(1)}
                                        </td>
                                        <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '0', textAlign: 'center', height: '40px', width: columnWidths.walk }}>
                                            {timedMeasurements.reduce((sum, m) => sum + (parseFloat(m.walkTime) || 0), 0).toFixed(1)}
                                        </td>
                                        <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '0', textAlign: 'center', height: '40px', width: columnWidths.total }}>
                                            {timedMeasurements.reduce((sum, m) => sum + (parseFloat(m.manualTime) || 0) + (parseFloat(m.autoTime) || 0) + (parseFloat(m.walkTime) || 0), 0).toFixed(1)}
                                        </td>
                                        {mode === 'manual' && <td colSpan={5} style={{ borderBottom: '1px solid black', height: '40px' }}></td>}
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Right Panel: Chart */}
                        <div style={{ flex: 1, border: '1px solid black', padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            {renderChart()}
                            <div style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', gap: '20px', fontSize: '0.8rem', borderTop: '1px solid #ccc', justifyContent: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <div style={{ width: '20px', height: '6px', backgroundColor: 'green', borderRadius: '2px' }}></div> Manual
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <div style={{ width: '20px', height: '4px', borderTop: '2px dashed darkblue' }}></div> Auto
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <svg width="20" height="10"><path d="M 0 5 Q 5 0 10 5 T 20 5" stroke="red" strokeWidth="2" fill="none" /></svg> Walk
                                </div>
                                {headerInfo.taktTime && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <div style={{ width: '20px', height: '0', borderTop: '2px dashed red' }}></div> Takt Time
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StandardWorkCombinationSheet;
