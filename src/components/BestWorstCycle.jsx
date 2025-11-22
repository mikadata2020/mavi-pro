import React, { useState, useEffect } from 'react';
import { getAllSessions } from '../utils/database';

function BestWorstCycle() {
    const [sessions, setSessions] = useState([]);
    const [selectedSessionIds, setSelectedSessionIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState(null);

    useEffect(() => {
        loadSessions();
    }, []);

    useEffect(() => {
        if (selectedSessionIds.length >= 2) {
            performAnalysis();
        } else {
            setAnalysis(null);
        }
    }, [selectedSessionIds, sessions]);

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

    const toggleSessionSelection = (id) => {
        setSelectedSessionIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(sessionId => sessionId !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const performAnalysis = () => {
        const selectedSessions = sessions.filter(s => selectedSessionIds.includes(s.id));

        // Calculate total time for each session
        const cyclesWithTime = selectedSessions.map(session => ({
            ...session,
            totalTime: session.measurements.reduce((sum, m) => sum + m.duration, 0)
        }));

        // Find best (shortest) and worst (longest)
        const sortedByTime = [...cyclesWithTime].sort((a, b) => a.totalTime - b.totalTime);
        const bestCycle = sortedByTime[0];
        const worstCycle = sortedByTime[sortedByTime.length - 1];

        // Create element comparison
        const elementComparison = [];
        const allElementNames = new Set([
            ...bestCycle.measurements.map(m => m.elementName),
            ...worstCycle.measurements.map(m => m.elementName)
        ]);

        allElementNames.forEach(elementName => {
            const bestElement = bestCycle.measurements.find(m => m.elementName === elementName);
            const worstElement = worstCycle.measurements.find(m => m.elementName === elementName);

            const bestTime = bestElement ? bestElement.duration : 0;
            const worstTime = worstElement ? worstElement.duration : 0;
            const difference = worstTime - bestTime;
            const percentDiff = bestTime > 0 ? ((difference / bestTime) * 100) : 0;

            elementComparison.push({
                elementName,
                bestTime,
                worstTime,
                difference,
                percentDiff,
                category: bestElement?.category || worstElement?.category || 'Unknown'
            });
        });

        setAnalysis({
            bestCycle,
            worstCycle,
            elementComparison,
            timeSaved: worstCycle.totalTime - bestCycle.totalTime,
            allCycles: cyclesWithTime
        });
    };

    return (
        <div style={{ height: '100%', display: 'flex', gap: '20px', padding: '20px', backgroundColor: 'var(--bg-secondary)' }}>
            {/* Left Panel: Session Selection */}
            <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '15px', borderRight: '1px solid #444', paddingRight: '20px' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem' }}>📂 Pilih Sesi (Min 2)</h2>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {loading ? (
                        <div style={{ color: '#888' }}>Loading...</div>
                    ) : sessions.length === 0 ? (
                        <div style={{ color: '#888' }}>Belum ada sesi tersimpan.</div>
                    ) : (
                        sessions.map(session => {
                            const totalTime = session.measurements.reduce((sum, m) => sum + m.duration, 0);
                            return (
                                <div
                                    key={session.id}
                                    onClick={() => toggleSessionSelection(session.id)}
                                    style={{
                                        padding: '10px',
                                        backgroundColor: selectedSessionIds.includes(session.id) ? 'var(--accent-blue)' : '#333',
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
                                        Total: {totalTime.toFixed(2)}s
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#888' }}>
                                        {new Date(session.timestamp).toLocaleDateString()}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Right Panel: Analysis Results */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>🏆 Best vs Worst Cycle Analysis</h2>

                {!analysis ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', border: '2px dashed #444', borderRadius: '8px' }}>
                        {selectedSessionIds.length < 2
                            ? 'Pilih minimal 2 sesi untuk melihat analisis.'
                            : 'Loading analysis...'}
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                            <div style={{ padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '2px solid #0a5' }}>
                                <div style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '5px' }}>🏆 Best Cycle</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0a5', marginBottom: '5px' }}>
                                    {analysis.bestCycle.totalTime.toFixed(2)}s
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#888' }}>
                                    {analysis.bestCycle.videoName}
                                </div>
                            </div>
                            <div style={{ padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '2px solid #c50f1f' }}>
                                <div style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '5px' }}>📉 Worst Cycle</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#c50f1f', marginBottom: '5px' }}>
                                    {analysis.worstCycle.totalTime.toFixed(2)}s
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#888' }}>
                                    {analysis.worstCycle.videoName}
                                </div>
                            </div>
                            <div style={{ padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '2px solid #4da6ff' }}>
                                <div style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '5px' }}>⚡ Potential Savings</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4da6ff' }}>
                                    {analysis.timeSaved.toFixed(2)}s
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#888' }}>
                                    {((analysis.timeSaved / analysis.worstCycle.totalTime) * 100).toFixed(1)}% improvement
                                </div>
                            </div>
                        </div>

                        {/* All Cycles Ranking */}
                        <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#fff' }}>📊 All Cycles Ranking</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {analysis.allCycles
                                    .sort((a, b) => a.totalTime - b.totalTime)
                                    .map((cycle, index) => (
                                        <div key={cycle.id} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '10px',
                                            backgroundColor: cycle.id === analysis.bestCycle.id ? 'rgba(0, 170, 85, 0.1)' :
                                                cycle.id === analysis.worstCycle.id ? 'rgba(197, 15, 31, 0.1)' : '#252525',
                                            borderRadius: '4px',
                                            border: cycle.id === analysis.bestCycle.id ? '1px solid #0a5' :
                                                cycle.id === analysis.worstCycle.id ? '1px solid #c50f1f' : '1px solid #333'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#888', width: '30px' }}>
                                                    #{index + 1}
                                                </span>
                                                <div>
                                                    <div style={{ color: '#fff', fontSize: '0.9rem' }}>{cycle.videoName}</div>
                                                    <div style={{ color: '#888', fontSize: '0.75rem' }}>
                                                        {new Date(cycle.timestamp).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff' }}>
                                                    {cycle.totalTime.toFixed(2)}s
                                                </div>
                                                {cycle.id !== analysis.bestCycle.id && (
                                                    <div style={{ fontSize: '0.75rem', color: '#ff4d4d' }}>
                                                        +{(cycle.totalTime - analysis.bestCycle.totalTime).toFixed(2)}s
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {/* Element Comparison Table */}
                        <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#fff' }}>📋 Element-by-Element Comparison</h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', color: '#ddd' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #444', textAlign: 'left', backgroundColor: '#252525' }}>
                                            <th style={{ padding: '12px' }}>Element Name</th>
                                            <th style={{ padding: '12px' }}>Category</th>
                                            <th style={{ padding: '12px', textAlign: 'right' }}>Best (s)</th>
                                            <th style={{ padding: '12px', textAlign: 'right' }}>Worst (s)</th>
                                            <th style={{ padding: '12px', textAlign: 'right' }}>Diff (s)</th>
                                            <th style={{ padding: '12px', textAlign: 'right' }}>Diff (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analysis.elementComparison
                                            .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
                                            .map((item, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #333' }}>
                                                    <td style={{ padding: '12px' }}>{item.elementName}</td>
                                                    <td style={{ padding: '12px' }}>
                                                        <span style={{
                                                            color: item.category === 'Value-added' ? '#4da6ff' :
                                                                item.category === 'Non value-added' ? '#ffd700' : '#ff4d4d'
                                                        }}>
                                                            {item.category}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'right', color: '#0a5' }}>
                                                        {item.bestTime.toFixed(2)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'right', color: '#c50f1f' }}>
                                                        {item.worstTime.toFixed(2)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: item.difference > 0 ? '#ff4d4d' : '#0a5' }}>
                                                        {item.difference > 0 ? '+' : ''}{item.difference.toFixed(2)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'right', color: item.percentDiff > 10 ? '#ff4d4d' : '#ccc' }}>
                                                        {item.percentDiff > 0 ? '+' : ''}{item.percentDiff.toFixed(1)}%
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default BestWorstCycle;
