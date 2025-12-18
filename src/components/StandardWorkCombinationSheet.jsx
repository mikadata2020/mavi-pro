import React, { useState, useEffect } from 'react';
import { getAllProjects } from '../utils/database';

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
        if (!selectedProject) return;
        const filename = `SWCS_${headerInfo.partName || 'Untitled'}_${headerInfo.date}.pdf`;
        exportSWCSToPDF('swcs-container', filename);
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

    const renderChart = () => {
        if (!selectedProject || !selectedProject.measurements || selectedProject.measurements.length === 0) {
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
                    <div style={{ fontWeight: 'bold', color: '#ccc' }}>Tidak ada data pengukuran</div>
                    <p style={{ fontSize: '0.9rem', margin: '5px 0 0' }}>
                        Silakan pilih proyek yang memiliki data pengukuran elemen kerja atau buka "AI Studio" untuk mulai menganalisis video.
                    </p>
                </div>
            );
        }

        const measurements = selectedProject.measurements;
        const rowHeight = 40;
        const headerHeight = 30;
        const chartWidth = 800; // Fixed width for now, could be dynamic
        const chartHeight = measurements.length * rowHeight + headerHeight;

        let maxDuration = 0;
        measurements.forEach(m => {
            const total = (m.manualTime || 0) + (m.autoTime || 0) + (m.walkTime || 0);
            if (total > maxDuration) maxDuration = total;
        });

        // If maxDuration is small, ensure a minimum scale
        const maxScaleTime = Math.max(maxDuration * 1.2, 10); // Add some padding
        const pixelsPerSecond = chartWidth / maxScaleTime;

        return (
            <div style={{ overflowX: 'auto', backgroundColor: '#fff', padding: '10px', borderRadius: '4px' }}>
                <svg width={chartWidth} height={chartHeight} style={{ display: 'block' }}>
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
                        />
                    ))}

                    {/* Time Labels */}
                    {Array.from({ length: Math.ceil(maxScaleTime / 5) + 1 }).map((_, i) => {
                        const time = i * 5;
                        return (
                            <text
                                key={i}
                                x={time * pixelsPerSecond}
                                y={20}
                                fontSize="10"
                                fill="#666"
                                textAnchor="middle"
                            >
                                {time}s
                            </text>
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
                        let currentX = 0;

                        const manualWidth = (m.manualTime || 0) * pixelsPerSecond;
                        const autoWidth = (m.autoTime || 0) * pixelsPerSecond;
                        const walkWidth = (m.walkTime || 0) * pixelsPerSecond;

                        const elements = [];

                        // Manual
                        if (manualWidth > 0) {
                            elements.push(
                                <line
                                    key={`manual-${index}`}
                                    x1={currentX}
                                    y1={y}
                                    x2={currentX + manualWidth}
                                    y2={y}
                                    stroke="green"
                                    strokeWidth="3"
                                />
                            );
                            currentX += manualWidth;
                        }

                        // Auto
                        if (autoWidth > 0) {
                            elements.push(
                                <line
                                    key={`auto-${index}`}
                                    x1={currentX}
                                    y1={y}
                                    x2={currentX + autoWidth}
                                    y2={y}
                                    stroke="darkblue"
                                    strokeWidth="3"
                                    strokeDasharray="5,3"
                                />
                            );
                            currentX += autoWidth;
                        }

                        // Walk
                        if (walkWidth > 0) {
                            elements.push(
                                <path
                                    key={`walk-${index}`}
                                    d={generateWavyPath(currentX, y, currentX + walkWidth)}
                                    stroke="red"
                                    strokeWidth="2"
                                    fill="none"
                                />
                            );
                            currentX += walkWidth;
                        }

                        return (
                            <g key={index}>
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
                </svg>
            </div>
        );
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-secondary)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>📋 Standard Work Combination Sheet</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
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
                    <button
                        onClick={handleExport}
                        disabled={!selectedProject}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: selectedProject ? '#0078d4' : '#555',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: selectedProject ? 'pointer' : 'not-allowed'
                        }}
                    >
                        Export PDF
                    </button>
                </div>
            </div>

            {selectedProject ? (
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
                        <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
                            {/* Left Panel: Table */}
                            <div style={{ flex: '0 0 350px', border: '1px solid black' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#eee' }}>
                                            <th style={{ border: '1px solid black', padding: '5px' }}>No</th>
                                            <th style={{ border: '1px solid black', padding: '5px' }}>Element Name</th>
                                            <th style={{ border: '1px solid black', padding: '5px' }}>Man</th>
                                            <th style={{ border: '1px solid black', padding: '5px' }}>Auto</th>
                                            <th style={{ border: '1px solid black', padding: '5px' }}>Walk</th>
                                            <th style={{ border: '1px solid black', padding: '5px' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedProject.measurements.map((m, idx) => (
                                            <tr key={idx}>
                                                <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>{idx + 1}</td>
                                                <td style={{ border: '1px solid black', padding: '5px' }}>{m.elementName}</td>
                                                <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>{m.manualTime ? m.manualTime.toFixed(1) : ''}</td>
                                                <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>{m.autoTime ? m.autoTime.toFixed(1) : ''}</td>
                                                <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>{m.walkTime ? m.walkTime.toFixed(1) : ''}</td>
                                                <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center', fontWeight: 'bold' }}>
                                                    {((m.manualTime || 0) + (m.autoTime || 0) + (m.walkTime || 0)).toFixed(1)}
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Totals Row */}
                                        <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                                            <td colSpan="2" style={{ border: '1px solid black', padding: '5px', textAlign: 'right' }}>Total</td>
                                            <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>
                                                {selectedProject.measurements.reduce((sum, m) => sum + (m.manualTime || 0), 0).toFixed(1)}
                                            </td>
                                            <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>
                                                {selectedProject.measurements.reduce((sum, m) => sum + (m.autoTime || 0), 0).toFixed(1)}
                                            </td>
                                            <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>
                                                {selectedProject.measurements.reduce((sum, m) => sum + (m.walkTime || 0), 0).toFixed(1)}
                                            </td>
                                            <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>
                                                {selectedProject.measurements.reduce((sum, m) => sum + (m.manualTime || 0) + (m.autoTime || 0) + (m.walkTime || 0), 0).toFixed(1)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Right Panel: Chart */}
                            <div style={{ flex: 1, border: '1px solid black', padding: '10px', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ marginBottom: '10px', display: 'flex', gap: '20px', fontSize: '0.8rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <div style={{ width: '20px', height: '2px', backgroundColor: 'green' }}></div> Manual
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <div style={{ width: '20px', height: '2px', borderTop: '2px dashed darkblue' }}></div> Auto
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <svg width="20" height="10"><path d="M 0 5 Q 5 0 10 5 T 20 5" stroke="red" fill="none" /></svg> Walk
                                    </div>
                                    {headerInfo.taktTime && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <div style={{ width: '20px', height: '0', borderTop: '2px dashed red' }}></div> Takt Time
                                        </div>
                                    )}
                                </div>
                                {renderChart()}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', border: '2px dashed #444', borderRadius: '8px' }}>
                    Pilih proyek untuk melihat Standard Work Combination Sheet.
                </div>
            )}
        </div>
    );
}

export default StandardWorkCombinationSheet;
