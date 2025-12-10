import React, { useState, useEffect, useRef } from 'react';
import { getAllSessions } from '../utils/database';
import { generateLayoutOptimization } from '../utils/aiGenerator';
import { Sparkles, RefreshCw } from 'lucide-react';

function SpaghettiChart({ currentProject, projectMeasurements }) {
    const [sessions, setSessions] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [nodes, setNodes] = useState([]);
    const [gridSize, setGridSize] = useState(50);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const canvasRef = useRef(null);

    useEffect(() => {
        console.log("SpaghettiChart mounted/updated");
        console.log("Current Project:", currentProject);
        console.log("Project Measurements:", projectMeasurements);
        loadSessions();
    }, [currentProject, projectMeasurements]);

    const loadSessions = async () => {
        try {
            const allSessions = await getAllSessions();
            allSessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            // Add current project as a session option
            if (currentProject && projectMeasurements && projectMeasurements.length > 0) {
                console.log("Adding current project to sessions");
                const projectSession = {
                    id: 'current-project',
                    videoName: `📂 Current Project: ${currentProject.name}`,
                    timestamp: new Date().toISOString(),
                    measurements: projectMeasurements
                };
                allSessions.unshift(projectSession);

                // Auto-select if nothing selected
                if (!selectedSessionId) {
                    console.log("Auto-selecting current project");
                    setSelectedSessionId('current-project');
                }
            } else {
                console.warn("Current project data missing or empty:", { currentProject, measurements: projectMeasurements });
            }

            setSessions(allSessions);
        } catch (error) {
            console.error('Error loading sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectedSession = sessions.find(s => s.id === selectedSessionId);

    useEffect(() => {
        if (selectedSession && canvasRef.current) {
            drawSpaghettiChart();
        }
    }, [selectedSession, nodes, gridSize]);

    const handleSessionSelect = (sessionId) => {
        setSelectedSessionId(sessionId);
        const session = sessions.find(s => s.id === sessionId);

        // Auto-generate nodes from element names if not exists
        if (session) {
            const uniqueLocations = [...new Set(session.measurements.map(m => m.elementName))];
            const autoNodes = uniqueLocations.map((name, idx) => ({
                id: idx,
                name: name,
                x: 100 + (idx % 4) * 150,
                y: 100 + Math.floor(idx / 4) * 120
            }));
            setNodes(autoNodes);
        }
    };

    const drawSpaghettiChart = () => {
        const canvas = canvasRef.current;
        if (!canvas || !selectedSession) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);

        // Draw grid
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Draw movement paths
        const measurements = selectedSession.measurements;
        ctx.lineWidth = 3;

        for (let i = 0; i < measurements.length - 1; i++) {
            const fromNode = nodes.find(n => n.name === measurements[i].elementName);
            const toNode = nodes.find(n => n.name === measurements[i + 1].elementName);

            if (fromNode && toNode) {
                // Color based on category
                const category = measurements[i].category;
                if (category === 'Value-added') {
                    ctx.strokeStyle = 'rgba(0, 90, 158, 0.6)';
                } else if (category === 'Non value-added') {
                    ctx.strokeStyle = 'rgba(191, 169, 0, 0.6)';
                } else {
                    ctx.strokeStyle = 'rgba(197, 15, 31, 0.6)';
                }

                // Draw curved line
                ctx.beginPath();
                ctx.moveTo(fromNode.x, fromNode.y);

                // Calculate control point for curve
                const midX = (fromNode.x + toNode.x) / 2;
                const midY = (fromNode.y + toNode.y) / 2;
                const offsetX = (toNode.y - fromNode.y) * 0.2;
                const offsetY = (fromNode.x - toNode.x) * 0.2;

                ctx.quadraticCurveTo(midX + offsetX, midY + offsetY, toNode.x, toNode.y);
                ctx.stroke();

                // Draw arrow head
                const angle = Math.atan2(toNode.y - midY, toNode.x - midX);
                const arrowSize = 10;
                ctx.fillStyle = ctx.strokeStyle;
                ctx.beginPath();
                ctx.moveTo(toNode.x, toNode.y);
                ctx.lineTo(
                    toNode.x - arrowSize * Math.cos(angle - Math.PI / 6),
                    toNode.y - arrowSize * Math.sin(angle - Math.PI / 6)
                );
                ctx.lineTo(
                    toNode.x - arrowSize * Math.cos(angle + Math.PI / 6),
                    toNode.y - arrowSize * Math.sin(angle + Math.PI / 6)
                );
                ctx.closePath();
                ctx.fill();
            }
        }

        // Draw nodes
        nodes.forEach(node => {
            // Node circle
            ctx.fillStyle = '#4da6ff';
            ctx.beginPath();
            ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
            ctx.fill();

            // Node border
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Node label
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(node.name.substring(0, 15), node.x, node.y - 30);

            // Count visits
            const visits = measurements.filter(m => m.elementName === node.name).length;
            ctx.font = '10px Arial';
            ctx.fillText(`(${visits}x)`, node.x, node.y - 18);
        });
    };

    const handleCanvasClick = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if clicked on a node to drag
        const clickedNode = nodes.find(n => {
            const dist = Math.sqrt((n.x - x) ** 2 + (n.y - y) ** 2);
            return dist < 20;
        });

        if (clickedNode) {
            // Enable drag mode
            const handleMouseMove = (moveEvent) => {
                const newX = moveEvent.clientX - rect.left;
                const newY = moveEvent.clientY - rect.top;
                setNodes(prev => prev.map(n =>
                    n.id === clickedNode.id ? { ...n, x: newX, y: newY } : n
                ));
            };

            const handleMouseUp = () => {
                canvas.removeEventListener('mousemove', handleMouseMove);
                canvas.removeEventListener('mouseup', handleMouseUp);
            };

            canvas.addEventListener('mousemove', handleMouseMove);
            canvas.addEventListener('mouseup', handleMouseUp);
        }
    };

    const calculateStatistics = () => {
        if (!selectedSession) return null;

        const totalDistance = nodes.length * 50; // Simplified
        const pathsByCategory = {
            'Value-added': 0,
            'Non value-added': 0,
            'Waste': 0
        };

        selectedSession.measurements.forEach(m => {
            pathsByCategory[m.category]++;
        });

        return {
            totalMoves: selectedSession.measurements.length,
            totalDistance,
            pathsByCategory
        };
    };



    const handleOptimizeLayout = async () => {
        console.log("Optimize clicked", selectedSession, nodes);
        if (!selectedSession || nodes.length === 0) {
            alert("No session selected or no nodes found");
            return;
        }



        setIsOptimizing(true);

        try {
            console.log("Calculating flow data...");
            // 1. Calculate Flow Data (From -> To frequency)
            const flowMap = {};
            const measurements = selectedSession.measurements;

            for (let i = 0; i < measurements.length - 1; i++) {
                const from = measurements[i].elementName;
                const to = measurements[i + 1].elementName;
                if (from === to) continue;

                const key = `${from}|${to}`;
                flowMap[key] = (flowMap[key] || 0) + 1;
            }

            const flowData = Object.entries(flowMap).map(([key, count]) => {
                const [from, to] = key.split('|');
                return { from, to, count };
            });

            console.log("Flow Data:", flowData);
            // 2. Call AI
            console.log("Calling AI...");
            const optimizedNodes = await generateLayoutOptimization(nodes, flowData);
            console.log("AI Response:", optimizedNodes);

            // 3. Update Nodes
            if (Array.isArray(optimizedNodes)) {
                const newNodes = nodes.map(n => {
                    const opt = optimizedNodes.find(on => on.name === n.name);
                    return opt ? { ...n, x: opt.x, y: opt.y } : n;
                });
                setNodes(newNodes);
                alert("✨ Layout Optimized! Nodes have been rearranged to minimize travel distance.");
            }

        } catch (error) {
            console.error("Optimization failed:", error);
            alert("Failed to optimize layout: " + error.message);
        } finally {
            setIsOptimizing(false);
        }
    };

    const stats = calculateStatistics();

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px', backgroundColor: 'var(--bg-secondary)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>🍝 Spaghetti Chart - Movement Diagram</h2>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>

                    <button
                        onClick={handleOptimizeLayout}
                        disabled={isOptimizing || !selectedSession}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            backgroundColor: isOptimizing ? '#555' : 'var(--accent-blue)', // Use global accent or fallback
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: isOptimizing || !selectedSession ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }}
                    >
                        {isOptimizing ? <RefreshCw size={16} className="spin" /> : <Sparkles size={16} />}
                        {isOptimizing ? 'Optimizing...' : 'Generative Optimize'}
                    </button>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#333', padding: '5px 10px', borderRadius: '6px' }}>
                        <label style={{ color: '#ccc', fontSize: '0.9rem' }}>Grid:</label>
                        <input
                            type="range"
                            min="25"
                            max="100"
                            value={gridSize}
                            onChange={(e) => setGridSize(Number(e.target.value))}
                            style={{ width: '80px' }}
                        />
                        <span style={{ color: '#ccc', fontSize: '0.9rem', minWidth: '35px' }}>{gridSize}px</span>
                    </div>
                </div>
            </div>

            {/* Session Selection */}
            <div>
                <label style={{ display: 'block', color: '#ccc', marginBottom: '5px', fontSize: '0.9rem' }}>
                    Select Session:
                </label>
                <select
                    value={selectedSessionId || ''}
                    onChange={(e) => {
                        const val = e.target.value;
                        handleSessionSelect(isNaN(Number(val)) ? val : Number(val));
                    }}
                    style={{
                        width: '100%',
                        maxWidth: '500px',
                        padding: '8px',
                        backgroundColor: '#333',
                        border: '1px solid #555',
                        color: '#fff',
                        borderRadius: '4px'
                    }}
                >
                    <option value="">Select a session...</option>
                    {sessions.map(session => (
                        <option key={session.id} value={session.id}>
                            {session.videoName} - {new Date(session.timestamp).toLocaleString()} ({session.measurements.length} elements)
                        </option>
                    ))}
                </select>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', gap: '15px', minHeight: 0 }}>
                {/* Canvas */}
                <div style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #333', position: 'relative', overflow: 'hidden' }}>
                    {selectedSession ? (
                        <>
                            <canvas
                                ref={canvasRef}
                                width={1000}
                                height={600}
                                style={{ width: '100%', height: '100%', cursor: 'pointer' }}
                                onClick={handleCanvasClick}
                            />
                            <div style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.7)', padding: '8px', borderRadius: '4px', fontSize: '0.75rem', color: '#ccc' }}>
                                💡 Drag nodes to reposition
                            </div>
                        </>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                            Select a session to view spaghetti chart
                        </div>
                    )}
                </div>

                {/* Statistics Panel */}
                {stats && (
                    <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#4da6ff' }}>📊 Statistics</h3>
                            <div style={{ fontSize: '0.85rem', color: '#ddd', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div>
                                    <span style={{ color: '#888' }}>Total Moves:</span>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>{stats.totalMoves}</div>
                                </div>
                                <div>
                                    <span style={{ color: '#888' }}>Stations:</span>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>{nodes.length}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#4da6ff' }}>🎨 Path Distribution</h3>
                            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#005a9e' }}>■ Value-added</span>
                                    <span style={{ fontWeight: 'bold', color: '#fff' }}>{stats.pathsByCategory['Value-added']}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#bfa900' }}>■ Non VA</span>
                                    <span style={{ fontWeight: 'bold', color: '#fff' }}>{stats.pathsByCategory['Non value-added']}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#c50f1f' }}>■ Waste</span>
                                    <span style={{ fontWeight: 'bold', color: '#fff' }}>{stats.pathsByCategory['Waste']}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#4da6ff' }}>📝 Legend</h3>
                            <div style={{ fontSize: '0.8rem', color: '#ddd', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div>🔵 Blue Circle = Station/Location</div>
                                <div>➡️ Arrow = Movement path</div>
                                <div>🎨 Color = Category type</div>
                                <div>(Nx) = Visit frequency</div>
                            </div>
                        </div>

                        <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#4da6ff' }}>📌 Instructions</h3>
                            <div style={{ fontSize: '0.8rem', color: '#ddd', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div>1. Drag nodes to rearrange layout</div>
                                <div>2. Click "Generative Optimize" to improve</div>
                                <div>3. Analyze flow efficiency</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>


        </div>
    );
}

export default SpaghettiChart;
