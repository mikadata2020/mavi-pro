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
        approvedBy: '',
        // TPS Additional Fields
        processName: '',
        station: '',
        revision: '1.0',
        standardWIP: 0,
        targetOutput: ''
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
        {
            elementName: 'Elemen 1',
            manualTime: 0,
            autoTime: 0,
            walkTime: 0,
            waitingTime: 0,
            timingMode: 'series',
            offset: 0,
            // TPS Fields
            qualityCheck: false,
            qualityCheckDescription: '',
            safetyPoint: false,
            safetyPointDescription: '',
            valueType: { manual: 'VA', auto: 'VA', walk: 'NVA', waiting: 'NNVA' },
            equipment: '',
            skillLevel: 1,
            kaizenFlag: false,
            kaizenNote: ''
        }
    ]);

    // ... (existing useEffects)

    const [drawMode, setDrawMode] = useState(null); // 'text', 'arrow' (future), etc.
    const [columnWidths, setColumnWidths] = useState({
        no: 30,
        name: 150,
        man: 45,
        auto: 45,
        walk: 45,
        waiting: 45,
        manVT: 55,
        autoVT: 55,
        walkVT: 55,
        total: 45,
        quality: 30,
        safety: 30,
        kaizen: 30,
        timing: 80,
        offset: 50,
        start: 50,
        finish: 50,
        delete: 30
    });

    // Column visibility state
    const [columnVisibility, setColumnVisibility] = useState({
        no: true,
        name: true,
        man: true,
        auto: true,
        walk: true,
        waiting: true,
        manVT: true,
        autoVT: true,
        walkVT: true,
        total: true,
        quality: true,
        safety: true,
        kaizen: true,
        timing: true,
        offset: true,
        start: true,
        finish: true
    });

    const [showColumnSettings, setShowColumnSettings] = useState(false);

    const toggleColumn = (columnId) => {
        setColumnVisibility(prev => ({
            ...prev,
            [columnId]: !prev[columnId]
        }));
    };

    const showAllColumns = () => {
        const allVisible = {};
        Object.keys(columnVisibility).forEach(key => {
            allVisible[key] = true;
        });
        setColumnVisibility(allVisible);
    };

    const hideOptionalColumns = () => {
        setColumnVisibility({
            no: true,
            name: true,
            man: true,
            auto: true,
            walk: true,
            waiting: false,
            manVT: false,
            autoVT: false,
            walkVT: false,
            total: true,
            quality: false,
            safety: false,
            kaizen: false,
            timing: false,
            offset: false,
            start: true,
            finish: true
        });
    };

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
        } else if (field === 'qualityCheck' || field === 'safetyPoint' || field === 'kaizenFlag') {
            // Boolean fields
            newMeasurements[index] = { ...newMeasurements[index], [field]: value };
        } else if (field.startsWith('valueType.')) {
            // Handle nested valueType updates (e.g., 'valueType.manual')
            const timeType = field.split('.')[1]; // 'manual', 'auto', 'walk'
            newMeasurements[index] = {
                ...newMeasurements[index],
                valueType: {
                    ...newMeasurements[index].valueType,
                    [timeType]: value
                }
            };
        } else {
            // Numeric fields
            newMeasurements[index] = { ...newMeasurements[index], [field]: parseFloat(value) || 0 };
        }
        setManualMeasurements(newMeasurements);
    };

    const addManualRow = () => {
        setManualMeasurements([...manualMeasurements, {
            elementName: '',
            manualTime: 0,
            autoTime: 0,
            walkTime: 0,
            waitingTime: 0,
            timingMode: 'series',
            offset: 0,
            // TPS Fields
            qualityCheck: false,
            qualityCheckDescription: '',
            safetyPoint: false,
            safetyPointDescription: '',
            valueType: { manual: 'VA', auto: 'VA', walk: 'NVA', waiting: 'NNVA' },
            equipment: '',
            skillLevel: 1,
            kaizenFlag: false,
            kaizenNote: ''
        }]);
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
            const waiting = parseFloat(m.waitingTime) || 0;
            const duration = manual + auto + walk + waiting;

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
            // Standard SWCS Pattern: Manual -> Auto (parallel with next?) -> Walk -> Waiting
            // Usually: Manual happens, then Auto machine runs (operator moves away?), Walk happens, then Waiting
            // Visualizing:
            // Manual Bar: Starts at startTime
            // Auto Bar: Starts at startTime + manual (if auto follows manual)
            // Walk Bar: Starts at startTime + manual (if walk follows manual) OR startTime + manual + auto?
            // Waiting Bar: Starts after walk (waste time - operator idle)

            const rowStart = startTime;
            const manualStart = rowStart;
            const manualEnd = manualStart + manual;

            const autoStart = manualEnd; // Machine starts after loading
            const autoEnd = autoStart + auto;

            const walkStart = manualEnd; // Operator walks after loading
            const walkEnd = walkStart + walk;

            const waitingStart = walkEnd; // Waiting starts after walk
            const waitingEnd = waitingStart + waiting;

            // For the next row calculations
            lastRowStart = rowStart;
            // The "Operator" is free after Manual + Walk + Waiting
            // In SWCS, the "Time Line" usually follows the Operator.
            // So the next element starts when the Operator is available.
            // Operator time = Manual + Walk + Waiting.
            lastFinishTime = Math.max(manualEnd, autoEnd, walkEnd, waitingEnd);

            return {
                ...m,
                _calculated: {
                    startTime: rowStart,
                    finishTime: Math.max(manualEnd, autoEnd, walkEnd, waitingEnd), // Total duration of this row's activity
                    manualStart,
                    manualEnd,
                    autoStart,
                    autoEnd,
                    walkStart,
                    walkEnd,
                    waitingStart,
                    waitingEnd
                }
            };
        });
    };

    const timedMeasurements = calculateTimedMeasurements();

    // TPS Analysis Calculations
    const calculateTPSAnalysis = () => {
        const measurements = timedMeasurements;
        if (!measurements || measurements.length === 0) {
            return {
                cycleTime: 0,
                taktTime: parseFloat(headerInfo.taktTime) || 0,
                capacity: 0,
                vaTime: 0,
                nvaTime: 0,
                nnvaTime: 0,
                vaPercentage: 0,
                nvaPercentage: 0,
                nnvaPercentage: 0,
                bottleneckIndex: -1,
                bottleneckTime: 0,
                kaizenCount: 0,
                qualityCheckCount: 0,
                safetyPointCount: 0
            };
        }

        // Calculate cycle time (total operator time)
        let totalManual = 0;
        let totalAuto = 0;
        let totalWalk = 0;
        let totalWaiting = 0;
        let vaTime = 0;
        let nvaTime = 0;
        let nnvaTime = 0;
        let bottleneckIndex = -1;
        let bottleneckTime = 0;
        let kaizenCount = 0;
        let qualityCheckCount = 0;
        let safetyPointCount = 0;

        measurements.forEach((m, idx) => {
            const manual = parseFloat(m.manualTime) || 0;
            const auto = parseFloat(m.autoTime) || 0;
            const walk = parseFloat(m.walkTime) || 0;
            const waiting = parseFloat(m.waitingTime) || 0;
            const elementTotal = manual + auto + walk + waiting;

            totalManual += manual;
            totalAuto += auto;
            totalWalk += walk;
            totalWaiting += waiting;

            // Find bottleneck (slowest element)
            if (elementTotal > bottleneckTime) {
                bottleneckTime = elementTotal;
                bottleneckIndex = idx;
            }

            // Count TPS markers
            if (m.kaizenFlag) kaizenCount++;
            if (m.qualityCheck) qualityCheckCount++;
            if (m.safetyPoint) safetyPointCount++;

            // Calculate VA/NVA/NNVA time
            if (m.valueType) {
                if (m.valueType.manual === 'VA') vaTime += manual;
                else if (m.valueType.manual === 'NVA') nvaTime += manual;
                else if (m.valueType.manual === 'NNVA') nnvaTime += manual;

                if (m.valueType.auto === 'VA') vaTime += auto;
                else if (m.valueType.auto === 'NVA') nvaTime += auto;
                else if (m.valueType.auto === 'NNVA') nnvaTime += auto;

                if (m.valueType.walk === 'VA') vaTime += walk;
                else if (m.valueType.walk === 'NVA') nvaTime += walk;
                else if (m.valueType.walk === 'NNVA') nnvaTime += walk;

                if (m.valueType.waiting === 'VA') vaTime += waiting;
                else if (m.valueType.waiting === 'NVA') nvaTime += waiting;
                else if (m.valueType.waiting === 'NNVA') nnvaTime += waiting;
            } else {
                // Default categorization if not specified
                vaTime += manual + auto;
                nvaTime += walk;
                nnvaTime += waiting; // Waiting is always waste by default
            }
        });

        const cycleTime = totalManual + totalWalk + totalWaiting; // Operator cycle time includes waiting
        const taktTime = parseFloat(headerInfo.taktTime) || 0;
        const capacity = taktTime > 0 ? (cycleTime / taktTime) * 100 : 0;
        const totalTime = vaTime + nvaTime + nnvaTime;
        const vaPercentage = totalTime > 0 ? (vaTime / totalTime) * 100 : 0;
        const nvaPercentage = totalTime > 0 ? (nvaTime / totalTime) * 100 : 0;
        const nnvaPercentage = totalTime > 0 ? (nnvaTime / totalTime) * 100 : 0;

        return {
            cycleTime,
            taktTime,
            capacity,
            vaTime,
            nvaTime,
            nnvaTime,
            vaPercentage,
            nvaPercentage,
            nnvaPercentage,
            bottleneckIndex,
            bottleneckTime,
            kaizenCount,
            qualityCheckCount,
            safetyPointCount
        };
    };

    const tpsAnalysis = calculateTPSAnalysis();

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

                        // Check if this is the bottleneck
                        const isBottleneck = index === tpsAnalysis.bottleneckIndex;

                        // Get value type colors
                        const getValueColor = (baseColor, valueType) => {
                            if (!valueType) return baseColor;
                            if (valueType === 'VA') return '#4CAF50'; // Green
                            if (valueType === 'NVA') return '#FFA500'; // Orange
                            if (valueType === 'NNVA') return '#FF4444'; // Red
                            return baseColor;
                        };

                        // Manual
                        if (manualWidth > 0) {
                            const manualColor = getValueColor('green', m.valueType?.manual);
                            elements.push(
                                <line
                                    key={`manual-${index}`}
                                    x1={manualStart * pixelsPerSecond}
                                    y1={y}
                                    x2={manualEnd * pixelsPerSecond}
                                    y2={y}
                                    stroke={manualColor}
                                    strokeWidth={isBottleneck ? "8" : "6"}
                                    strokeLinecap="round"
                                />
                            );
                            if (isBottleneck) {
                                elements.push(
                                    <line
                                        key={`manual-bottleneck-${index}`}
                                        x1={manualStart * pixelsPerSecond}
                                        y1={y}
                                        x2={manualEnd * pixelsPerSecond}
                                        y2={y}
                                        stroke="red"
                                        strokeWidth="10"
                                        strokeLinecap="round"
                                        opacity="0.3"
                                    />
                                );
                            }
                        }

                        // Auto
                        if (autoWidth > 0) {
                            const autoColor = getValueColor('darkblue', m.valueType?.auto);
                            elements.push(
                                <line
                                    key={`auto-${index}`}
                                    x1={autoStart * pixelsPerSecond}
                                    y1={y}
                                    x2={autoEnd * pixelsPerSecond}
                                    y2={y}
                                    stroke={autoColor}
                                    strokeWidth={isBottleneck ? "6" : "4"}
                                    strokeDasharray="5,3"
                                />
                            );
                        }

                        // Walk
                        if (walkWidth > 0) {
                            const walkColor = getValueColor('red', m.valueType?.walk);
                            elements.push(
                                <path
                                    key={`walk-${index}`}
                                    d={generateWavyPath(walkStart * pixelsPerSecond, y, walkEnd * pixelsPerSecond)}
                                    stroke={walkColor}
                                    strokeWidth="2"
                                    fill="none"
                                />
                            );
                        }

                        // Waiting (Waste Time)
                        const { waitingStart, waitingEnd } = m._calculated;
                        const waitingWidth = (waitingEnd - waitingStart) * pixelsPerSecond;
                        if (waitingWidth > 0) {
                            const waitingColor = getValueColor('#FF6B6B', m.valueType?.waiting); // Bright red for waste
                            elements.push(
                                <line
                                    key={`waiting-${index}`}
                                    x1={waitingStart * pixelsPerSecond}
                                    y1={y}
                                    x2={waitingEnd * pixelsPerSecond}
                                    y2={y}
                                    stroke={waitingColor}
                                    strokeWidth="4"
                                    strokeDasharray="2,2"
                                    strokeLinecap="round"
                                />
                            );
                        }

                        // Quality Check Marker
                        if (m.qualityCheck) {
                            const qcX = manualEnd * pixelsPerSecond;
                            elements.push(
                                <g key={`qc-${index}`}>
                                    <circle cx={qcX} cy={y - 15} r="8" fill="#4CAF50" stroke="white" strokeWidth="2" />
                                    <text x={qcX} y={y - 11} fontSize="10" fill="white" fontWeight="bold" textAnchor="middle">✓</text>
                                </g>
                            );
                        }

                        // Safety Point Marker
                        if (m.safetyPoint) {
                            const spX = manualStart * pixelsPerSecond;
                            elements.push(
                                <g key={`sp-${index}`}>
                                    <polygon
                                        points={`${spX},${y - 20} ${spX - 8},${y - 8} ${spX + 8},${y - 8}`}
                                        fill="#FFC107"
                                        stroke="white"
                                        strokeWidth="2"
                                    />
                                    <text x={spX} y={y - 11} fontSize="10" fill="black" fontWeight="bold" textAnchor="middle">⚠</text>
                                </g>
                            );
                        }

                        // Kaizen Flag Marker
                        if (m.kaizenFlag) {
                            const kzX = (manualStart + manualEnd) * pixelsPerSecond / 2;
                            elements.push(
                                <g key={`kz-${index}`}>
                                    <circle cx={kzX} cy={y + 15} r="8" fill="#2196F3" stroke="white" strokeWidth="2" />
                                    <text x={kzX} y={y + 19} fontSize="10" fill="white" fontWeight="bold" textAnchor="middle">💡</text>
                                </g>
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
                                {/* Bottleneck Background Highlight */}
                                {isBottleneck && (
                                    <rect
                                        x="0"
                                        y={headerHeight + index * rowHeight}
                                        width={chartWidth}
                                        height={rowHeight}
                                        fill="#ffebee"
                                        opacity="0.5"
                                    />
                                )}
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
                            <button
                                onClick={() => setShowColumnSettings(!showColumnSettings)}
                                style={{
                                    padding: '5px 12px',
                                    backgroundColor: showColumnSettings ? '#0078d4' : '#666',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    marginLeft: '10px'
                                }}
                                title="Column Visibility"
                            >
                                👁️ Columns
                            </button>
                        </>
                    )}
                </div>

                {/* Column Settings Panel */}
                {mode === 'manual' && showColumnSettings && (
                    <div style={{
                        backgroundColor: '#2d2d2d',
                        padding: '15px',
                        marginBottom: '10px',
                        borderRadius: '4px',
                        border: '1px solid #555'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h4 style={{ margin: 0, color: 'white' }}>Column Visibility</h4>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={showAllColumns}
                                    style={{
                                        padding: '5px 10px',
                                        backgroundColor: '#0078d4',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    Show All
                                </button>
                                <button
                                    onClick={hideOptionalColumns}
                                    style={{
                                        padding: '5px 10px',
                                        backgroundColor: '#666',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    Hide Optional
                                </button>
                            </div>
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                            gap: '8px',
                            color: 'white'
                        }}>
                            {[
                                { id: 'no', label: 'No' },
                                { id: 'name', label: 'Element Name' },
                                { id: 'man', label: 'Manual Time' },
                                { id: 'auto', label: 'Auto Time' },
                                { id: 'walk', label: 'Walk Time' },
                                { id: 'waiting', label: 'Waiting Time' },
                                { id: 'manVT', label: 'Manual Value Type' },
                                { id: 'autoVT', label: 'Auto Value Type' },
                                { id: 'walkVT', label: 'Walk Value Type' },
                                { id: 'total', label: 'Total Time' },
                                { id: 'quality', label: 'Quality ✓' },
                                { id: 'safety', label: 'Safety ⚠' },
                                { id: 'kaizen', label: 'Kaizen 💡' },
                                { id: 'timing', label: 'Timing Mode' },
                                { id: 'offset', label: 'Offset' },
                                { id: 'start', label: 'Start Time' },
                                { id: 'finish', label: 'Finish Time' }
                            ].map(col => (
                                <label
                                    key={col.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={columnVisibility[col.id]}
                                        onChange={() => toggleColumn(col.id)}
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <span>{col.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', fontSize: '0.85rem' }}>
                            <div>
                                <div style={{ display: 'flex', marginBottom: '5px' }}>
                                    <span style={{ width: '90px', fontWeight: 'bold', fontSize: '0.8rem' }}>Process:</span>
                                    <input
                                        type="text"
                                        value={headerInfo.processName}
                                        onChange={(e) => handleHeaderChange('processName', e.target.value)}
                                        style={{ border: 'none', borderBottom: '1px solid #ccc', flex: 1, outline: 'none', fontSize: '0.8rem' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', marginBottom: '5px' }}>
                                    <span style={{ width: '90px', fontWeight: 'bold', fontSize: '0.8rem' }}>Part Name:</span>
                                    <input
                                        type="text"
                                        value={headerInfo.partName}
                                        onChange={(e) => handleHeaderChange('partName', e.target.value)}
                                        style={{ border: 'none', borderBottom: '1px solid #ccc', flex: 1, outline: 'none', fontSize: '0.8rem' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', marginBottom: '5px' }}>
                                    <span style={{ width: '90px', fontWeight: 'bold', fontSize: '0.8rem' }}>Station:</span>
                                    <input
                                        type="text"
                                        value={headerInfo.station}
                                        onChange={(e) => handleHeaderChange('station', e.target.value)}
                                        style={{ border: 'none', borderBottom: '1px solid #ccc', flex: 1, outline: 'none', fontSize: '0.8rem' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', marginBottom: '5px' }}>
                                    <span style={{ width: '90px', fontWeight: 'bold', fontSize: '0.8rem' }}>Part No:</span>
                                    <input
                                        type="text"
                                        value={headerInfo.partNo}
                                        onChange={(e) => handleHeaderChange('partNo', e.target.value)}
                                        style={{ border: 'none', borderBottom: '1px solid #ccc', flex: 1, outline: 'none', fontSize: '0.8rem' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', marginBottom: '5px' }}>
                                    <span style={{ width: '90px', fontWeight: 'bold', fontSize: '0.8rem' }}>Takt Time:</span>
                                    <input
                                        type="number"
                                        value={headerInfo.taktTime}
                                        onChange={(e) => handleHeaderChange('taktTime', e.target.value)}
                                        style={{ border: 'none', borderBottom: '1px solid #ccc', flex: 1, outline: 'none', fontSize: '0.8rem' }}
                                        placeholder="seconds"
                                    />
                                </div>
                                <div style={{ display: 'flex', marginBottom: '5px' }}>
                                    <span style={{ width: '90px', fontWeight: 'bold', fontSize: '0.8rem' }}>Std WIP:</span>
                                    <input
                                        type="number"
                                        value={headerInfo.standardWIP}
                                        onChange={(e) => handleHeaderChange('standardWIP', e.target.value)}
                                        style={{ border: 'none', borderBottom: '1px solid #ccc', flex: 1, outline: 'none', fontSize: '0.8rem' }}
                                        placeholder="units"
                                    />
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', marginBottom: '5px' }}>
                                    <span style={{ width: '90px', fontWeight: 'bold', fontSize: '0.8rem' }}>Date:</span>
                                    <input
                                        type="date"
                                        value={headerInfo.date}
                                        onChange={(e) => handleHeaderChange('date', e.target.value)}
                                        style={{ border: 'none', borderBottom: '1px solid #ccc', flex: 1, outline: 'none', fontSize: '0.8rem' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', marginBottom: '5px' }}>
                                    <span style={{ width: '90px', fontWeight: 'bold', fontSize: '0.8rem' }}>Revision:</span>
                                    <input
                                        type="text"
                                        value={headerInfo.revision}
                                        onChange={(e) => handleHeaderChange('revision', e.target.value)}
                                        style={{ border: 'none', borderBottom: '1px solid #ccc', flex: 1, outline: 'none', fontSize: '0.8rem' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* TPS Analysis Panel */}
                        {hasData && (
                            <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px', border: '1px solid #ddd' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '0.85rem' }}>📊 TPS Analysis</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', fontSize: '0.75rem' }}>
                                    <div style={{ padding: '4px', backgroundColor: 'white', borderRadius: '3px', textAlign: 'center' }}>
                                        <div style={{ fontWeight: 'bold', color: '#666' }}>Cycle Time</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{tpsAnalysis.cycleTime.toFixed(1)}s</div>
                                    </div>
                                    <div style={{ padding: '4px', backgroundColor: 'white', borderRadius: '3px', textAlign: 'center' }}>
                                        <div style={{ fontWeight: 'bold', color: '#666' }}>Capacity</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: tpsAnalysis.capacity > 100 ? 'red' : 'green' }}>
                                            {tpsAnalysis.capacity.toFixed(1)}%
                                        </div>
                                    </div>
                                    <div style={{ padding: '4px', backgroundColor: 'white', borderRadius: '3px', textAlign: 'center' }}>
                                        <div style={{ fontWeight: 'bold', color: '#4CAF50' }}>VA Time</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{tpsAnalysis.vaPercentage.toFixed(1)}%</div>
                                    </div>
                                    <div style={{ padding: '4px', backgroundColor: 'white', borderRadius: '3px', textAlign: 'center' }}>
                                        <div style={{ fontWeight: 'bold', color: '#FFA500' }}>NVA Time</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{tpsAnalysis.nvaPercentage.toFixed(1)}%</div>
                                    </div>
                                    <div style={{ padding: '4px', backgroundColor: 'white', borderRadius: '3px', textAlign: 'center' }}>
                                        <div style={{ fontWeight: 'bold', color: '#FF4444' }}>Waste</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{tpsAnalysis.nnvaPercentage.toFixed(1)}%</div>
                                    </div>
                                    <div style={{ padding: '4px', backgroundColor: 'white', borderRadius: '3px', textAlign: 'center' }}>
                                        <div style={{ fontWeight: 'bold', color: '#2196F3' }}>Kaizen</div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{tpsAnalysis.kaizenCount}</div>
                                    </div>
                                </div>
                            </div>
                        )}
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
                                            { id: 'waiting', label: 'Wait', width: columnWidths.waiting, title: 'Waiting Time (Waste)' },
                                            { id: 'manVT', label: 'M-VT', width: columnWidths.manVT, title: 'Manual Value Type', bg: '#e8f5e9' },
                                            { id: 'autoVT', label: 'A-VT', width: columnWidths.autoVT, title: 'Auto Value Type', bg: '#e8f5e9' },
                                            { id: 'walkVT', label: 'W-VT', width: columnWidths.walkVT, title: 'Walk Value Type', bg: '#fff3e0' },
                                            { id: 'total', label: 'Total', width: columnWidths.total },
                                        ].filter(col => columnVisibility[col.id]).map((col) => (
                                            <th key={col.id} style={{
                                                borderBottom: '1px solid black',
                                                borderRight: '1px solid black',
                                                padding: col.id === 'name' ? '0 5px' : '0',
                                                width: col.width,
                                                textAlign: col.textAlign || 'center',
                                                boxSizing: 'border-box',
                                                height: '40px',
                                                whiteSpace: 'nowrap',
                                                position: 'relative',
                                                backgroundColor: col.bg || 'inherit',
                                                fontSize: '0.75rem'
                                            }} title={col.title}>
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
                                            { id: 'quality', label: '✓', width: columnWidths.quality, title: 'Quality Check' },
                                            { id: 'safety', label: '⚠', width: columnWidths.safety, title: 'Safety Point' },
                                            { id: 'kaizen', label: '💡', width: columnWidths.kaizen, title: 'Kaizen' },
                                            { id: 'timing', label: 'Timing', width: columnWidths.timing },
                                            { id: 'offset', label: 'Offset', width: columnWidths.offset },
                                            { id: 'start', label: 'Start', width: columnWidths.start, bg: '#e6f7ff' },
                                            { id: 'finish', label: 'Finish', width: columnWidths.finish, bg: '#e6f7ff' },
                                            { id: 'delete', label: '', width: columnWidths.delete },
                                        ].filter(col => col.id === 'delete' || columnVisibility[col.id]).map((col) => (
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
                                                position: 'relative',
                                                fontSize: col.id === 'quality' || col.id === 'safety' || col.id === 'kaizen' ? '1rem' : 'inherit'
                                            }} title={col.title}>
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
                                            <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '0', textAlign: 'center', height: '40px', boxSizing: 'border-box', width: columnWidths.waiting, backgroundColor: '#fff5f5' }}>
                                                {mode === 'manual' ? (
                                                    <input
                                                        type="number"
                                                        value={m.waitingTime || 0}
                                                        onChange={(e) => handleManualChange(idx, 'waitingTime', e.target.value)}
                                                        style={{ width: '100%', height: '100%', border: 'none', padding: '0', outline: 'none', textAlign: 'center', boxSizing: 'border-box', background: 'transparent' }}
                                                        placeholder="0"
                                                        title="Waiting Time (Waste)"
                                                    />
                                                ) : (m.waitingTime ? m.waitingTime.toFixed(1) : '')}
                                            </td>
                                            {/* Value Type Dropdowns */}
                                            {columnVisibility.manVT && (
                                                <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '0', textAlign: 'center', height: '40px', boxSizing: 'border-box', width: columnWidths.manVT, backgroundColor: m.valueType?.manual === 'VA' ? '#e8f5e9' : m.valueType?.manual === 'NVA' ? '#fff3e0' : '#ffebee' }}>
                                                    {mode === 'manual' ? (
                                                        <select
                                                            value={m.valueType?.manual || 'VA'}
                                                            onChange={(e) => handleManualChange(idx, 'valueType.manual', e.target.value)}
                                                            style={{ width: '100%', height: '100%', border: 'none', padding: '0', outline: 'none', textAlign: 'center', boxSizing: 'border-box', background: 'transparent', fontSize: '0.7rem', cursor: 'pointer' }}
                                                            title="Manual Value Type"
                                                        >
                                                            <option value="VA">VA</option>
                                                            <option value="NVA">NVA</option>
                                                            <option value="NNVA">NNVA</option>
                                                        </select>
                                                    ) : (m.valueType?.manual || 'VA')}
                                                </td>
                                            )}
                                            {columnVisibility.autoVT && (
                                                <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '0', textAlign: 'center', height: '40px', boxSizing: 'border-box', width: columnWidths.autoVT, backgroundColor: m.valueType?.auto === 'VA' ? '#e8f5e9' : m.valueType?.auto === 'NVA' ? '#fff3e0' : '#ffebee' }}>
                                                    {mode === 'manual' ? (
                                                        <select
                                                            value={m.valueType?.auto || 'VA'}
                                                            onChange={(e) => handleManualChange(idx, 'valueType.auto', e.target.value)}
                                                            style={{ width: '100%', height: '100%', border: 'none', padding: '0', outline: 'none', textAlign: 'center', boxSizing: 'border-box', background: 'transparent', fontSize: '0.7rem', cursor: 'pointer' }}
                                                            title="Auto Value Type"
                                                        >
                                                            <option value="VA">VA</option>
                                                            <option value="NVA">NVA</option>
                                                            <option value="NNVA">NNVA</option>
                                                        </select>
                                                    ) : (m.valueType?.auto || 'VA')}
                                                </td>
                                            )}
                                            {columnVisibility.walkVT && (
                                                <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '0', textAlign: 'center', height: '40px', boxSizing: 'border-box', width: columnWidths.walkVT, backgroundColor: m.valueType?.walk === 'VA' ? '#e8f5e9' : m.valueType?.walk === 'NVA' ? '#fff3e0' : '#ffebee' }}>
                                                    {mode === 'manual' ? (
                                                        <select
                                                            value={m.valueType?.walk || 'NVA'}
                                                            onChange={(e) => handleManualChange(idx, 'valueType.walk', e.target.value)}
                                                            style={{ width: '100%', height: '100%', border: 'none', padding: '0', outline: 'none', textAlign: 'center', boxSizing: 'border-box', background: 'transparent', fontSize: '0.7rem', cursor: 'pointer' }}
                                                            title="Walk Value Type"
                                                        >
                                                            <option value="VA">VA</option>
                                                            <option value="NVA">NVA</option>
                                                            <option value="NNVA">NNVA</option>
                                                        </select>
                                                    ) : (m.valueType?.walk || 'NVA')}
                                                </td>
                                            )}
                                            <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '0', textAlign: 'center', fontWeight: 'bold', height: '40px', boxSizing: 'border-box', width: columnWidths.total }}>
                                                {((parseFloat(m.manualTime) || 0) + (parseFloat(m.autoTime) || 0) + (parseFloat(m.walkTime) || 0) + (parseFloat(m.waitingTime) || 0)).toFixed(1)}
                                            </td>
                                            {mode === 'manual' && (
                                                <>
                                                    <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '0', textAlign: 'center', height: '40px', boxSizing: 'border-box', width: columnWidths.quality }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={m.qualityCheck || false}
                                                            onChange={(e) => handleManualChange(idx, 'qualityCheck', e.target.checked)}
                                                            style={{ cursor: 'pointer' }}
                                                            title="Quality Check Point"
                                                        />
                                                    </td>
                                                    <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '0', textAlign: 'center', height: '40px', boxSizing: 'border-box', width: columnWidths.safety }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={m.safetyPoint || false}
                                                            onChange={(e) => handleManualChange(idx, 'safetyPoint', e.target.checked)}
                                                            style={{ cursor: 'pointer' }}
                                                            title="Safety Point"
                                                        />
                                                    </td>
                                                    <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '0', textAlign: 'center', height: '40px', boxSizing: 'border-box', width: columnWidths.kaizen }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={m.kaizenFlag || false}
                                                            onChange={(e) => handleManualChange(idx, 'kaizenFlag', e.target.checked)}
                                                            style={{ cursor: 'pointer' }}
                                                            title="Kaizen Opportunity"
                                                        />
                                                    </td>
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
                                            <td colSpan={14} style={{ borderBottom: '1px solid black', padding: '0', textAlign: 'center', height: '40px' }}>
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
                                        <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '0', textAlign: 'center', height: '40px', width: columnWidths.waiting, backgroundColor: '#fff5f5' }}>
                                            {timedMeasurements.reduce((sum, m) => sum + (parseFloat(m.waitingTime) || 0), 0).toFixed(1)}
                                        </td>
                                        {columnVisibility.manVT && <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', height: '40px', width: columnWidths.manVT }}></td>}
                                        {columnVisibility.autoVT && <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', height: '40px', width: columnWidths.autoVT }}></td>}
                                        {columnVisibility.walkVT && <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', height: '40px', width: columnWidths.walkVT }}></td>}
                                        <td style={{ borderBottom: '1px solid black', borderRight: '1px solid black', padding: '0', textAlign: 'center', height: '40px', width: columnWidths.total }}>
                                            {timedMeasurements.reduce((sum, m) => sum + (parseFloat(m.manualTime) || 0) + (parseFloat(m.autoTime) || 0) + (parseFloat(m.walkTime) || 0) + (parseFloat(m.waitingTime) || 0), 0).toFixed(1)}
                                        </td>
                                        {mode === 'manual' && <td colSpan={8} style={{ borderBottom: '1px solid black', height: '40px' }}></td>}
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Right Panel: Chart */}
                        <div style={{ flex: 1, border: '1px solid black', padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            {renderChart()}
                            <div style={{ marginTop: 'auto', paddingTop: '10px', display: 'flex', gap: '20px', fontSize: '0.8rem', borderTop: '1px solid #ccc', justifyContent: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <div style={{ width: '20px', height: '6px', backgroundColor: 'green', borderRadius: '2px' }}></div> Manual (Solid)
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <div style={{ width: '20px', height: '4px', borderTop: '2px dashed darkblue' }}></div> Auto (Dashed)
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <svg width="20" height="10"><path d="M 0 5 Q 5 0 10 5 T 20 5" stroke="red" strokeWidth="2" fill="none" /></svg> Walk (Wavy)
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '10px', paddingLeft: '10px', borderLeft: '1px solid #ccc' }}>
                                    <span style={{ fontWeight: 'bold', color: '#666' }}>Colors:</span>
                                    <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>VA (Green)</span>
                                    <span style={{ color: '#FFA500', fontWeight: 'bold' }}>NVA (Orange)</span>
                                    <span style={{ color: '#FF4444', fontWeight: 'bold' }}>Waste (Red)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StandardWorkCombinationSheet;
