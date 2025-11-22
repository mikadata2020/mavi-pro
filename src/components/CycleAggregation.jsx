import React, { useState, useEffect } from 'react';
import { getAllSessions } from '../utils/database';
import { exportAggregationToExcel } from '../utils/excelExport';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function CycleAggregation() {
    const [sessions, setSessions] = useState([]);
    const [selectedSessionIds, setSelectedSessionIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [aggregatedData, setAggregatedData] = useState([]);

    useEffect(() => {
        loadSessions();
    }, []);

    useEffect(() => {
        if (selectedSessionIds.length > 0) {
            calculateAggregation();
        } else {
            setAggregatedData([]);
        }
    }, [selectedSessionIds, sessions]);

    const loadSessions = async () => {
        try {
            const allSessions = await getAllSessions();
            // Sort by timestamp (newest first)
            allSessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setSessions(allSessions);
        } catch (error) {
            console.error('Error loading sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSessionSelection = (id) => {
        setSelectedSessionIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(sessionId => sessionId !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const calculateAggregation = () => {
        const selectedSessions = sessions.filter(s => selectedSessionIds.includes(s.id));
        if (selectedSessions.length === 0) return;

        // Group measurements by element name
        const elementGroups = {};

        selectedSessions.forEach(session => {
            session.measurements.forEach(m => {
                if (!elementGroups[m.elementName]) {
                    elementGroups[m.elementName] = {
                        name: m.elementName,
                        category: m.category,
                        durations: []
                    };
                }
                elementGroups[m.elementName].durations.push(m.duration);
            });
        });

        // Calculate stats for each element
        const stats = Object.values(elementGroups).map(group => {
            const count = group.durations.length;
            const sum = group.durations.reduce((a, b) => a + b, 0);
            const min = Math.min(...group.durations);
            const max = Math.max(...group.durations);
            const avg = sum / count;

            // Standard Deviation
            const squareDiffs = group.durations.map(value => Math.pow(value - avg, 2));
            const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / count;
            const stdDev = Math.sqrt(avgSquareDiff);

            return {
                name: group.name,
                category: group.category,
                count,
                min,
                max,
                avg,
                stdDev,
                total: sum
            };
        });

        setAggregatedData(stats);
    };

    return (
        <div style={{ height: '100%', display: 'flex', gap: '20px', padding: '20px', backgroundColor: 'var(--bg-secondary)' }}>
            {/* Left Panel: Session Selection */}
            <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '15px', borderRight: '1px solid #444', paddingRight: '20px' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem' }}>📂 Pilih Sesi (Cycles)</h2>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {loading ? (
                        <div style={{ color: '#888' }}>Loading...</div>
                    ) : sessions.length === 0 ? (
                        <div style={{ color: '#888' }}>Belum ada sesi tersimpan.</div>
                    ) : (
                        sessions.map(session => (
                            <div
                                key={session.id}
                                onClick={() => toggleSessionSelection(session.id)}
                                style={{
                                    padding: '10px',
                                    backgroundColor: selectedSessionIds.includes(session.id) ? 'var(--accent-blue)' : '#333',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    border: '1px solid #555',
                                    transition: 'background-color 0.2s',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.9rem' }}>
                                        {session.videoName}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#ccc' }}>
                                        {new Date(session.timestamp).toLocaleString()}
                                    </div>
                                </div>
                                {selectedSessionIds.includes(session.id) && <span style={{ color: '#fff' }}>✓</span>}
                            </div>
                        ))
                    )}
                </div>
                <div style={{ padding: '10px', backgroundColor: '#2a2a2a', borderRadius: '6px', fontSize: '0.9rem', color: '#ccc' }}>
                    <p style={{ margin: 0 }}>Pilih beberapa sesi untuk melihat rata-rata waktu per elemen.</p>
                </div>
            </div>

            {/* Right Panel: Aggregation Results */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>📊 Agregasi Waktu Siklus</h2>
                    {aggregatedData.length > 0 && (
                        <button
                            className="btn"
                            onClick={() => exportAggregationToExcel(aggregatedData)}
                            style={{ backgroundColor: '#05a', padding: '8px 16px' }}
                        >
                            📥 Export Excel
                        </button>
                    )}
                </div>

                {selectedSessionIds.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', border: '2px dashed #444', borderRadius: '8px' }}>
                        Pilih sesi di sebelah kiri untuk melihat hasil agregasi.
                    </div>
                ) : (
                    <>
                        {/* Summary Table */}
                        <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>📋 Tabel Agregasi ({selectedSessionIds.length} Sesi Dipilih)</h3>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', color: '#ddd' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #444', textAlign: 'left', backgroundColor: '#252525' }}>
                                            <th style={{ padding: '10px' }}>Proses</th>
                                            <th style={{ padding: '10px' }}>Kategori</th>
                                            <th style={{ padding: '10px', textAlign: 'center' }}>Count</th>
                                            <th style={{ padding: '10px', textAlign: 'right' }}>Min (s)</th>
                                            <th style={{ padding: '10px', textAlign: 'right' }}>Max (s)</th>
                                            <th style={{ padding: '10px', textAlign: 'right', color: '#4da6ff' }}>Avg (s)</th>
                                            <th style={{ padding: '10px', textAlign: 'right' }}>Std Dev</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {aggregatedData.map((data, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #333' }}>
                                                <td style={{ padding: '10px' }}>{data.name}</td>
                                                <td style={{ padding: '10px' }}>
                                                    <span style={{
                                                        color: data.category === 'Value-added' ? '#4da6ff' :
                                                            data.category === 'Non value-added' ? '#ffd700' : '#ff4d4d'
                                                    }}>
                                                        {data.category}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '10px', textAlign: 'center' }}>{data.count}</td>
                                                <td style={{ padding: '10px', textAlign: 'right' }}>{data.min.toFixed(2)}</td>
                                                <td style={{ padding: '10px', textAlign: 'right' }}>{data.max.toFixed(2)}</td>
                                                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#4da6ff' }}>{data.avg.toFixed(2)}</td>
                                                <td style={{ padding: '10px', textAlign: 'right', color: '#888' }}>{data.stdDev.toFixed(3)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Chart */}
                        <div style={{ height: '400px', backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#fff' }}>📈 Grafik Variasi Waktu (Min - Avg - Max)</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={aggregatedData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                    <XAxis dataKey="name" stroke="#888" fontSize={12} tickFormatter={(val) => val.length > 10 ? val.substring(0, 10) + '...' : val} />
                                    <YAxis stroke="#888" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#333', border: '1px solid #555', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="min" name="Min Time" fill="#0078d4" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="avg" name="Avg Time" fill="#00b7c3" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="max" name="Max Time" fill="#ffaa00" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default CycleAggregation;
