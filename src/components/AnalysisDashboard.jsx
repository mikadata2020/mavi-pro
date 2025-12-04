import React from 'react';
import { PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ProjectGanttChart from './ProjectGanttChart';
import { calculateAllProductivityMetrics } from '../utils/productivityMetrics';
import HelpButton from './HelpButton';
import { helpContent } from '../utils/helpContent.jsx';

function AnalysisDashboard({ measurements = [] }) {
    if (measurements.length === 0) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                <p>Belum ada data untuk ditampilkan. Tambahkan measurements terlebih dahulu.</p>
            </div>
        );
    }

    // Calculate statistics
    const totalTime = measurements.reduce((sum, m) => sum + m.duration, 0);
    const valueAddedTime = measurements.filter(m => m.category === 'Value-added').reduce((sum, m) => sum + m.duration, 0);
    const nonValueAddedTime = measurements.filter(m => m.category === 'Non value-added').reduce((sum, m) => sum + m.duration, 0);
    const wasteTime = measurements.filter(m => m.category === 'Waste').reduce((sum, m) => sum + m.duration, 0);
    // Compute advanced analytics metrics
    const advancedMetrics = calculateAllProductivityMetrics({
        measurements,
        plannedTime: totalTime * 1.1, // assume 10% planned buffer
        actualTime: totalTime,
        standardTime: totalTime / (measurements.length || 1),
        taktTime: totalTime / (measurements.length || 1),
        totalUnits: measurements.length,
        goodUnits: measurements.filter(m => m.rating && m.rating >= 3).length
    });
    const { valueAdded, efficiency, taktAnalysis, summary } = advancedMetrics;
    const { oee, availability, performance, quality, classification: oeeClass } = advancedMetrics.oee ? advancedMetrics.oee : {};

    // Pie chart data
    const pieData = [
        { name: 'Value-added', value: valueAddedTime, color: '#005a9e' },
        { name: 'Non value-added', value: nonValueAddedTime, color: '#bfa900' },
        { name: 'Waste', value: wasteTime, color: '#c50f1f' }
    ].filter(d => d.value > 0);

    // Bar chart data (top 10 elements by duration)
    const barData = [...measurements]
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10)
        .map(m => ({
            name: m.elementName.length > 15 ? m.elementName.substring(0, 15) + '...' : m.elementName,
            duration: parseFloat(m.duration.toFixed(2)),
            category: m.category
        }));

    const getBarColor = (category) => {
        switch (category) {
            case 'Value-added': return '#005a9e';
            case 'Non value-added': return '#bfa900';
            case 'Waste': return '#c50f1f';
            default: return '#666';
        }
    };

    // Calculate averages
    const avgRating = measurements.filter(m => m.rating).length > 0
        ? (measurements.reduce((sum, m) => sum + (m.rating || 0), 0) / measurements.filter(m => m.rating).length).toFixed(1)
        : 'N/A';

    return (
        <div style={{ padding: '15px', backgroundColor: 'var(--bg-secondary)', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem' }}>
                    📊 Analysis Summary
                </h2>
                <HelpButton
                    title={helpContent['analysis'].title}
                    content={helpContent['analysis'].content}
                />
            </div>

            {/* Statistics Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>Total Waktu</div>
                    <div style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 'bold' }}>{totalTime.toFixed(2)}s</div>
                </div>
                <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>Total Elements</div>
                    <div style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 'bold' }}>{measurements.length}</div>
                </div>
                <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>Avg Rating</div>
                    <div style={{ fontSize: '1.5rem', color: '#ffa500', fontWeight: 'bold' }}>⭐ {avgRating}</div>
                </div>
                <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>Value-added %</div>
                    <div style={{ fontSize: '1.5rem', color: '#005a9e', fontWeight: 'bold' }}>
                        {totalTime > 0 ? ((valueAddedTime / totalTime) * 100).toFixed(1) : 0}%
                    </div>
                </div>
                {/* Advanced Analytics Cards */}
                <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>OEE</div>
                    <div style={{ fontSize: '1.5rem', color: '#00ff00', fontWeight: 'bold' }}>{(advancedMetrics.oee?.oee ?? 0).toFixed(1)}%</div>
                </div>
                <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>Efficiency</div>
                    <div style={{ fontSize: '1.5rem', color: '#ffdd00', fontWeight: 'bold' }}>{efficiency?.efficiency?.toFixed(1)}%</div>
                </div>
                <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>Takt vs Cycle</div>
                    <div style={{ fontSize: '1.5rem', color: taktAnalysis?.status === 'On Target' ? '#00ff00' : '#ff4444', fontWeight: 'bold' }}>{taktAnalysis?.status}</div>
                </div>
                <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>Productivity Index</div>
                    <div style={{ fontSize: '1.5rem', color: '#00cfff', fontWeight: 'bold' }}>{summary?.productivityIndex?.toFixed(1) ?? 'N/A'}</div>
                </div>
            </div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                {/* Pie Chart */}
                <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#fff' }}>Distribusi Kategori</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value.toFixed(2)}s`} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Bar Chart */}
                <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#fff' }}>Top 10 Elements (Durasi)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={barData}>
                            <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                            <YAxis tick={{ fill: '#888' }} />
                            <Tooltip formatter={(value) => `${value}s`} />
                            <Bar dataKey="duration">
                                {barData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getBarColor(entry.category)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Category Breakdown */}
            <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#fff' }}>Breakdown per Kategori</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {pieData.map((item, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '20px', height: '20px', backgroundColor: item.color, borderRadius: '4px' }}></div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.9rem', color: '#fff' }}>{item.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#888' }}>
                                    {measurements.filter(m => m.category === item.name).length} elements
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 'bold' }}>{item.value.toFixed(2)}s</div>
                                <div style={{ fontSize: '0.75rem', color: '#888' }}>
                                    {totalTime > 0 ? ((item.value / totalTime) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Gantt Chart */}
            <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '8px', border: '1px solid #333' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#fff' }}>Standard Work Combination</h3>
                <ProjectGanttChart measurements={measurements} />
            </div>
        </div>
    );
}

export default AnalysisDashboard;
