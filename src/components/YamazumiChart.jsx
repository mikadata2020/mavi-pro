import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { getAllProjects, getProjectByName, updateProject } from '../utils/database';
import LineBalancingBoard from './LineBalancingBoard';
import AIChatOverlay from './features/AIChatOverlay';

function YamazumiChart({ measurements: propMeasurements = [] }) {
    const [measurements, setMeasurements] = useState(propMeasurements);
    const [projects, setProjects] = useState([]);
    const [selectedProjects, setSelectedProjects] = useState([]); // Array of project names
    const [taktTime, setTaktTime] = useState(30); // Default takt time in seconds
    const [showTaktLine, setShowTaktLine] = useState(true);
    const [isBalancingMode, setIsBalancingMode] = useState(false);


    const [showChat, setShowChat] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    // Group measurements by operator/station
    const chartData = useMemo(() => {
        if (measurements.length === 0) return [];

        // Group by operator (if exists) or create default stations
        const grouped = measurements.reduce((acc, m) => {
            // Use composite key if multiple projects are selected to avoid collisions
            // But for display, we might want to show "Project - Station"
            const stationName = m.station || 'Station 1';
            const projectPrefix = m.projectName ? `${m.projectName} - ` : '';
            const uniqueStation = m.projectName ? `${m.projectName}::${stationName}` : stationName;

            if (!acc[uniqueStation]) {
                acc[uniqueStation] = {
                    items: [],
                    displayName: projectPrefix + stationName,
                    projectName: m.projectName
                };
            }
            acc[uniqueStation].items.push(m);
            return acc;
        }, {});

        // Convert to chart data format
        return Object.entries(grouped).map(([uniqueStation, data]) => {
            const { items, displayName } = data;
            const stationData = {
                station: displayName,
                uniqueId: uniqueStation
            };
            let totalTime = 0;

            // Group by category for stacking
            const categories = {};
            items.forEach(item => {
                const category = item.category || 'Other';
                if (!categories[category]) {
                    categories[category] = 0;
                }
                categories[category] += item.duration;
                totalTime += item.duration;
            });

            // Add categories to station data
            Object.entries(categories).forEach(([category, duration]) => {
                stationData[category] = parseFloat(duration.toFixed(2));
            });

            stationData.total = parseFloat(totalTime.toFixed(2));
            stationData.isBottleneck = totalTime > taktTime;

            return stationData;
        }).sort((a, b) => a.station.localeCompare(b.station));
    }, [measurements, taktTime]);

    // Get unique categories for stacking
    const categories = useMemo(() => {
        const cats = new Set();
        chartData.forEach(data => {
            Object.keys(data).forEach(key => {
                if (key !== 'station' && key !== 'total' && key !== 'isBottleneck' && key !== 'uniqueId') {
                    cats.add(key);
                }
            });
        });
        return Array.from(cats);
    }, [chartData]);

    // Color mapping for categories
    const getCategoryColor = (category) => {
        const colorMap = {
            'Value-added': '#005a9e',
            'Non value-added': '#bfa900',
            'Waste': '#c50f1f',
            'Other': '#666'
        };
        return colorMap[category] || '#888';
    };

    // Calculate statistics
    const stats = useMemo(() => {
        if (chartData.length === 0) return null;

        const totalTimes = chartData.map(d => d.total);
        const maxTime = Math.max(...totalTimes);
        const minTime = Math.min(...totalTimes);
        const avgTime = totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length;
        const bottlenecks = chartData.filter(d => d.isBottleneck).length;

        return {
            maxTime: maxTime.toFixed(2),
            minTime: minTime.toFixed(2),
            avgTime: avgTime.toFixed(2),
            bottlenecks,
            balance: ((minTime / maxTime) * 100).toFixed(1)
        };
    }, [chartData]);

    // Custom tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div style={{
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    padding: '10px',
                    border: '1px solid #333',
                    borderRadius: '4px'
                }}>
                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#fff' }}>
                        {data.station}
                    </p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ margin: '2px 0', fontSize: '0.85rem', color: entry.color }}>
                            {entry.name}: {entry.value}s
                        </p>
                    ))}
                    <p style={{ margin: '5px 0 0 0', fontWeight: 'bold', borderTop: '1px solid #555', paddingTop: '5px', color: '#fff' }}>
                        Total: {data.total}s
                    </p>
                    {data.isBottleneck && (
                        <p style={{ margin: '2px 0', fontSize: '0.85rem', color: '#c50f1f' }}>
                            ⚠️ Bottleneck
                        </p>
                    )}
                </div>
            );
        }
        return null;
    };

    // Load projects on mount
    useEffect(() => {
        loadProjects();
    }, []);

    // Update measurements when prop changes (only if no projects selected)
    useEffect(() => {
        if (propMeasurements && propMeasurements.length > 0 && selectedProjects.length === 0) {
            setMeasurements(propMeasurements);
        }
    }, [propMeasurements, selectedProjects]);

    // Fetch measurements for selected projects
    useEffect(() => {
        const fetchProjectMeasurements = async () => {
            if (selectedProjects.length === 0) {
                if (propMeasurements.length === 0) setMeasurements([]);
                return;
            }

            let combinedMeasurements = [];
            for (const projectName of selectedProjects) {
                try {
                    const project = await getProjectByName(projectName);
                    if (project && project.measurements) {
                        // Tag measurements with project name
                        const tagged = project.measurements.map(m => ({
                            ...m,
                            projectName: projectName,
                            // Ensure station has a value
                            station: m.station || m.operator || 'Station 1'
                        }));
                        combinedMeasurements = [...combinedMeasurements, ...tagged];
                    }
                } catch (error) {
                    console.error(`Error loading project ${projectName}:`, error);
                }
            }
            setMeasurements(combinedMeasurements);
        };

        fetchProjectMeasurements();
    }, [selectedProjects, propMeasurements]);

    const loadProjects = async () => {
        try {
            const allProjects = await getAllProjects();
            setProjects(allProjects);
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    };

    const toggleProjectSelection = (projectName) => {
        setSelectedProjects(prev => {
            if (prev.includes(projectName)) {
                return prev.filter(p => p !== projectName);
            } else {
                return [...prev, projectName];
            }
        });
    };

    const handleMeasurementsUpdate = async (newMeasurements) => {
        setMeasurements(newMeasurements);

        // Group by project and save
        const projectGroups = {};

        // Initialize groups for all currently selected projects to ensure we handle empty states if needed
        selectedProjects.forEach(p => projectGroups[p] = []);

        newMeasurements.forEach(m => {
            if (m.projectName) {
                if (!projectGroups[m.projectName]) {
                    projectGroups[m.projectName] = [];
                }
                // Remove the temporary projectName field before saving if desired, 
                // but keeping it might be useful. The database schema doesn't strictly forbid extras.
                // However, let's clean it up to be safe, or keep it if we want to track origin.
                // For now, let's keep the object as is but ensure we strip the composite station name if we used one.
                // Actually, the station name in 'm' is the raw station name (e.g. "Station 1"), 
                // the composite name was only for chartData.
                // Wait, LineBalancingBoard might have updated the station name.
                // If LineBalancingBoard uses the composite name, we need to parse it.

                // Let's check LineBalancingBoard. It uses the 'station' field.
                // If we passed composite names to LineBalancingBoard, we need to split them.
                // But in the current implementation of LineBalancingBoard (which I should check),
                // it groups by 'station'. 
                // We need to ensure LineBalancingBoard works with our data structure.

                projectGroups[m.projectName].push(m);
            }
        });

        // Save each project
        for (const [projectName, measurements] of Object.entries(projectGroups)) {
            try {
                // We need to be careful not to overwrite with empty if it wasn't intended.
                // But here, if a project is selected, we are managing its measurements.
                // If a user moves all tasks out of Project A, Project A should have empty measurements.

                // One edge case: What if a task is moved to a project that wasn't originally its own?
                // The 'projectName' property on the measurement should be updated when it's moved.
                // LineBalancingBoard needs to support updating the 'projectName' if we drag across projects.

                // Currently LineBalancingBoard only updates 'station'.
                // We need to update LineBalancingBoard to handle cross-project moves.
                // For now, let's assume LineBalancingBoard returns measurements with updated 'station'.
                // If we use composite station names in LineBalancingBoard (e.g. "Project A::Station 1"),
                // then we can parse that here to update 'projectName'.

                await updateProject(projectName, { measurements });
            } catch (error) {
                console.error(`Error saving project ${projectName}:`, error);
            }
        }
    };

    // We need to wrap LineBalancingBoard to handle the composite keys
    const handleLineBalancingUpdate = (updatedMeasurements) => {
        // updatedMeasurements will have 'station' set to the composite key (e.g. "Project A::Station 1")
        // We need to parse this back to projectName and station

        const processedMeasurements = updatedMeasurements.map(m => {
            if (m.station && m.station.includes('::')) {
                const [proj, stat] = m.station.split('::');
                return {
                    ...m,
                    projectName: proj,
                    station: stat,
                    operator: stat // Keep operator in sync
                };
            }
            return m;
        });

        handleMeasurementsUpdate(processedMeasurements);
    };

    // Prepare measurements for LineBalancingBoard with composite station names
    const balancingMeasurements = useMemo(() => {
        return measurements.map(m => {
            const stationName = m.station || m.operator || 'Station 1';
            const compositeName = m.projectName ? `${m.projectName}::${stationName}` : stationName;
            return {
                ...m,
                station: compositeName,
                operator: compositeName // Ensure operator matches station for LineBalancingBoard grouping
            };
        });
    }, [measurements]);

    if (measurements.length === 0 && projects.length === 0) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                <p>Loading projects...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '15px', backgroundColor: 'var(--bg-secondary)', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem' }}>
                    📊 Yamazumi Chart
                </h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>

                    {/* Multi-select Dropdown */}
                    <div style={{ position: 'relative' }} ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            style={{
                                padding: '6px 10px',
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                minWidth: '150px',
                                textAlign: 'left',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <span>
                                {selectedProjects.length === 0
                                    ? '-- Pilih Project --'
                                    : `${selectedProjects.length} Project${selectedProjects.length > 1 ? 's' : ''} Selected`}
                            </span>
                            <span>▼</span>
                        </button>

                        {isDropdownOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                width: '250px',
                                maxHeight: '300px',
                                overflowY: 'auto',
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                zIndex: 1000,
                                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                                marginTop: '5px'
                            }}>
                                {projects.map((project) => (
                                    <div
                                        key={project.id}
                                        onClick={() => toggleProjectSelection(project.projectName)}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            borderBottom: '1px solid var(--border-color)',
                                            backgroundColor: selectedProjects.includes(project.projectName) ? 'rgba(0, 90, 158, 0.2)' : 'transparent'
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedProjects.includes(project.projectName)}
                                            readOnly
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                            {project.projectName}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={loadProjects}
                        style={{
                            padding: '6px 10px',
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                        title="Refresh Projects"
                    >
                        🔄
                    </button>
                    <button
                        onClick={() => setIsBalancingMode(!isBalancingMode)}
                        style={{
                            padding: '6px 12px',
                            backgroundColor: isBalancingMode ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                            color: 'white',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                        }}
                    >
                        {isBalancingMode ? '📊 View Chart' : '⚖️ Line Balancing'}
                    </button>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Takt Time:
                        <input
                            type="number"
                            value={taktTime}
                            onChange={(e) => setTaktTime(parseFloat(e.target.value) || 0)}
                            style={{
                                marginLeft: '5px',
                                padding: '4px 8px',
                                width: '80px',
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px'
                            }}
                        />
                        s
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        <input
                            type="checkbox"
                            checked={showTaktLine}
                            onChange={(e) => setShowTaktLine(e.target.checked)}
                        />
                        Show Takt Line
                    </label>

                    <button
                        onClick={() => setShowChat(!showChat)}
                        style={{
                            padding: '6px 12px',
                            backgroundColor: showChat ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
                            color: 'white',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                        }}
                        title="AI Assistant"
                    >
                        🤖 AI
                    </button>
                </div>
            </div>

            {/* Line Balancing Board */}
            {
                isBalancingMode && (
                    <div style={{ marginBottom: '20px' }}>
                        <LineBalancingBoard
                            measurements={balancingMeasurements}
                            onUpdateMeasurements={handleLineBalancingUpdate}
                            taktTime={taktTime}
                        />
                    </div>
                )
            }

            {/* Statistics Cards */}
            {
                stats && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                        <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>Max Cycle Time</div>
                            <div style={{ fontSize: '1.5rem', color: '#c50f1f', fontWeight: 'bold' }}>{stats.maxTime}s</div>
                        </div>
                        <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>Min Cycle Time</div>
                            <div style={{ fontSize: '1.5rem', color: '#005a9e', fontWeight: 'bold' }}>{stats.minTime}s</div>
                        </div>
                        <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>Avg Cycle Time</div>
                            <div style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 'bold' }}>{stats.avgTime}s</div>
                        </div>
                        <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>Line Balance</div>
                            <div style={{ fontSize: '1.5rem', color: '#00ff00', fontWeight: 'bold' }}>{stats.balance}%</div>
                        </div>
                        <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>Bottlenecks</div>
                            <div style={{ fontSize: '1.5rem', color: stats.bottlenecks > 0 ? '#c50f1f' : '#00ff00', fontWeight: 'bold' }}>
                                {stats.bottlenecks}
                            </div>
                        </div>
                        <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>Stations</div>
                            <div style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 'bold' }}>{chartData.length}</div>
                        </div>
                    </div>
                )
            }

            {/* Yamazumi Chart */}
            <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#fff' }}>Work Distribution by Station</h3>
                {measurements.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis
                                dataKey="station"
                                tick={{ fill: '#888', fontSize: 12 }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis
                                tick={{ fill: '#888' }}
                                label={{ value: 'Time (seconds)', angle: -90, position: 'insideLeft', fill: '#888' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />

                            {/* Takt Time Reference Line */}
                            {showTaktLine && (
                                <ReferenceLine
                                    y={taktTime}
                                    stroke="#ff0000"
                                    strokeDasharray="5 5"
                                    strokeWidth={2}
                                    label={{ value: `Takt Time: ${taktTime}s`, position: 'right', fill: '#ff0000' }}
                                />
                            )}

                            {/* Stacked bars for each category */}
                            {categories.map((category, index) => (
                                <Bar
                                    key={category}
                                    dataKey={category}
                                    stackId="a"
                                    fill={getCategoryColor(category)}
                                >
                                    {chartData.map((entry, idx) => (
                                        <Cell
                                            key={`cell-${idx}`}
                                            fill={entry.isBottleneck ? getCategoryColor(category) : getCategoryColor(category)}
                                            opacity={entry.isBottleneck ? 1 : 0.8}
                                        />
                                    ))}
                                </Bar>
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
                        No measurements to display. Select a project or add measurements.
                    </div>
                )}
            </div>

            {/* Station Details Table */}
            <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#fff' }}>Station Details</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #333' }}>
                                <th style={{ padding: '10px', textAlign: 'left', color: '#888', fontSize: '0.9rem' }}>Station</th>
                                {categories.map(cat => (
                                    <th key={cat} style={{ padding: '10px', textAlign: 'right', color: '#888', fontSize: '0.9rem' }}>{cat}</th>
                                ))}
                                <th style={{ padding: '10px', textAlign: 'right', color: '#888', fontSize: '0.9rem' }}>Total</th>
                                <th style={{ padding: '10px', textAlign: 'center', color: '#888', fontSize: '0.9rem' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chartData.map((row, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #333', backgroundColor: row.isBottleneck ? 'rgba(197, 15, 31, 0.1)' : 'transparent' }}>
                                    <td style={{ padding: '10px', color: '#fff', fontWeight: 'bold' }}>{row.station}</td>
                                    {categories.map(cat => (
                                        <td key={cat} style={{ padding: '10px', textAlign: 'right', color: '#888' }}>
                                            {row[cat] ? `${row[cat]}s` : '-'}
                                        </td>
                                    ))}
                                    <td style={{ padding: '10px', textAlign: 'right', color: '#fff', fontWeight: 'bold' }}>{row.total}s</td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>
                                        {row.isBottleneck ? (
                                            <span style={{ color: '#c50f1f', fontWeight: 'bold' }}>⚠️ Bottleneck</span>
                                        ) : (
                                            <span style={{ color: '#00ff00' }}>✓ OK</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <AIChatOverlay
                visible={showChat}
                onClose={() => setShowChat(false)}
                contextData={{
                    projects: selectedProjects,
                    measurements: measurements,
                    stats: stats,
                    chartData: chartData
                }}
                title="Mavi Engineer (Yamazumi)"
                subtitle="Analyzing Line Balance"
            />
        </div >
    );
}


export default YamazumiChart;
