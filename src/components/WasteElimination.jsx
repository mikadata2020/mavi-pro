import React, { useState, useEffect } from 'react';
import { getAllSessions } from '../utils/database';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

function WasteElimination() {
    const [sessions, setSessions] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [analysisData, setAnalysisData] = useState(null);

    useEffect(() => {
        loadSessions();
    }, []);

    useEffect(() => {
        if (selectedSessionId) {
            calculateWasteElimination();
        } else {
            setAnalysisData(null);
        }
    }, [selectedSessionId, sessions]);

    const loadSessions = async () => {
        try {
            const allSessions = await getAllSessions();
            allSessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setSessions(allSessions);
        } catch (error) {
            console.error('Error loading sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateWasteElimination = () => {
        const session = sessions.find(s => s.id === selectedSessionId);
        if (!session) return;

        const measurements = session.measurements;

        // Calculate Before (with waste)
        const totalTime = measurements.reduce((sum, m) => sum + m.duration, 0);
        const vaTime = measurements.filter(m => m.category === 'Value-added').reduce((sum, m) => sum + m.duration, 0);
        const nvaTime = measurements.filter(m => m.category === 'Non value-added').reduce((sum, m) => sum + m.duration, 0);
        const wasteTime = measurements.filter(m => m.category === 'Waste').reduce((sum, m) => sum + m.duration, 0);

        // Calculate After (without waste)
        const afterTime = totalTime - wasteTime;
        const vaPercent = totalTime > 0 ? (vaTime / totalTime) * 100 : 0;
        const vaPercentAfter = afterTime > 0 ? (vaTime / afterTime) * 100 : 0;

        // Waste elements
        const wasteElements = measurements.filter(m => m.category === 'Waste');

        // Savings
        const timeSaved = wasteTime;
        const percentSaved = totalTime > 0 ? (wasteTime / totalTime) * 100 : 0;
        const vaImprovement = vaPercentAfter - vaPercent;

        setAnalysisData({
            sessionName: session.videoName,
            before: {
                total: totalTime,
                va: vaTime,
                nva: nvaTime,
                waste: wasteTime,
                vaPercent: vaPercent
            },
            after: {
                total: afterTime,
                va: vaTime,
                nva: nvaTime,
                waste: 0,
                vaPercent: vaPercentAfter
            },
            savings: {
                time: timeSaved,
                percent: percentSaved,
                vaImprovement: vaImprovement
            },
            wasteElements: wasteElements
        });
    };

    const chartData = analysisData ? [
        {
            name: 'Before (With Waste)',
            'Value Added': analysisData.before.va,
            'Non Value Added': analysisData.before.nva,
            'Waste': analysisData.before.waste
        },
        {
            name: 'After (No Waste)',
            'Value Added': analysisData.after.va,
            'Non Value Added': analysisData.after.nva,
            'Waste': 0
        }
    ] : [];

    return (
        <div style={{ height: '100%', display: 'flex', gap: '20px', padding: '20px', backgroundColor: 'var(--bg-secondary)' }}>
            {/* Left Panel: Session Selection */}
            <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '15px', borderRight: '1px solid #444', paddingRight: '20px' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem' }}>📂 Pilih Sesi</h2>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {loading ? (
                        <div style={{ color: '#888' }}>Loading...</div>
                    ) : sessions.length === 0 ? (
                        <div style={{ color: '#888' }}>Belum ada sesi tersimpan.</div>
                    ) : (
                        sessions.map(session => (
                            <div
                                key={session.id}
                                onClick={() => setSelectedSessionId(session.id)}
                                style={{
                                    padding: '10px',
                                    backgroundColor: selectedSessionId === session.id ? 'var(--accent-blue)' : '#333',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    border: '1px solid #555',
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.9rem' }}>
                                    {session.videoName}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#ccc' }}>
                                    {new Date(session.timestamp).toLocaleString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Panel: Analysis Results */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>🗑️ Simulasi Eliminasi Waste</h2>

                {!analysisData ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', border: '2px dashed #444', borderRadius: '8px' }}>
                        Pilih sesi di sebelah kiri untuk melihat simulasi.
                    </div>
                ) : (
                    <>
                        {/* Savings Summary */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                            <div style={{ padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '2px solid #ff4d4d' }}>
                                <div style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '5px' }}>Time Saved</div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff4d4d' }}>
                                    {analysisData.savings.time.toFixed(2)}s
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#888' }}>
                                    ({analysisData.savings.percent.toFixed(1)}% reduction)
                                </div>
                            </div>
                            <div style={{ padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '2px solid #4da6ff' }}>
                                <div style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '5px' }}>VA% Improvement</div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4da6ff' }}>
                                    +{analysisData.savings.vaImprovement.toFixed(1)}%
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#888' }}>
                                    {analysisData.before.vaPercent.toFixed(1)}% → {analysisData.after.vaPercent.toFixed(1)}%
                                </div>
                            </div>
                            <div style={{ padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '2px solid #0a5' }}>
                                <div style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '5px' }}>Cycle Time</div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0a5' }}>
                                    {analysisData.after.total.toFixed(2)}s
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#888' }}>
                                    from {analysisData.before.total.toFixed(2)}s
                                </div>
                            </div>
                        </div>

                        {/* Comparison Chart */}
                        <div style={{ height: '350px', backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#fff' }}>📊 Before vs After Comparison</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                    <XAxis dataKey="name" stroke="#888" />
                                    <YAxis stroke="#888" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#333', border: '1px solid #555', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="Value Added" stackId="a" fill="#0078d4" />
                                    <Bar dataKey="Non Value Added" stackId="a" fill="#ffaa00" />
                                    <Bar dataKey="Waste" stackId="a" fill="#d13438" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Waste Elements List */}
                        <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#fff' }}>🗑️ Waste Elements to Eliminate ({analysisData.wasteElements.length})</h3>
                            {analysisData.wasteElements.length === 0 ? (
                                <div style={{ color: '#0a5', padding: '20px', textAlign: 'center', fontSize: '1.1rem' }}>
                                    ✅ No waste elements found! This cycle is already optimized.
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', color: '#ddd' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #444', textAlign: 'left', backgroundColor: '#252525' }}>
                                            <th style={{ padding: '10px' }}>Element Name</th>
                                            <th style={{ padding: '10px', textAlign: 'right' }}>Duration (s)</th>
                                            <th style={{ padding: '10px', textAlign: 'right' }}>Start Time (s)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analysisData.wasteElements.map((element, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #333' }}>
                                                <td style={{ padding: '10px' }}>{element.elementName}</td>
                                                <td style={{ padding: '10px', textAlign: 'right', color: '#ff4d4d', fontWeight: 'bold' }}>
                                                    {element.duration.toFixed(2)}
                                                </td>
                                                <td style={{ padding: '10px', textAlign: 'right', color: '#888' }}>
                                                    {element.startTime.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default WasteElimination;
