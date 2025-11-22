import React from 'react';
import { PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
            <h2 style={{ margin: '0 0 15px 0', color: 'var(--text-primary)', fontSize: '1.2rem' }}>
                📊 Analysis Summary
            </h2>

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
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#fff' }}>📅 Gantt Chart - Timeline Elemen</h3>
                <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '500px' }}>
                    <div style={{ minWidth: '800px', position: 'relative' }}>
                        {/* Timeline Header */}
                        <div style={{ display: 'flex', marginBottom: '10px', paddingLeft: '200px', borderBottom: '1px solid #444', paddingBottom: '5px' }}>
                            <div style={{ flex: 1, fontSize: '0.75rem', color: '#888', textAlign: 'center' }}>
                                Timeline (0s - {totalTime.toFixed(2)}s)
                            </div>
                        </div>

                        {/* Gantt Rows */}
                        {measurements.map((element, index) => {
                            const startPercent = (element.startTime / totalTime) * 100;
                            const widthPercent = (element.duration / totalTime) * 100;
                            const categoryColor = element.category === 'Value-added' ? '#005a9e' :
                                element.category === 'Non value-added' ? '#bfa900' : '#c50f1f';

                            return (
                                <div key={element.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', minHeight: '32px' }}>
                                    {/* Element Name */}
                                    <div style={{
                                        width: '200px',
                                        fontSize: '0.8rem',
                                        color: '#fff',
                                        paddingRight: '10px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }} title={element.elementName}>
                                        {index + 1}. {element.elementName}
                                    </div>

                                    {/* Timeline Bar Container */}
                                    <div style={{
                                        flex: 1,
                                        position: 'relative',
                                        height: '28px',
                                        backgroundColor: '#0a0a0a',
                                        borderRadius: '4px',
                                        border: '1px solid #333'
                                    }}>
                                        {/* Timeline Bar */}
                                        <div style={{
                                            position: 'absolute',
                                            left: `${startPercent}%`,
                                            width: `${widthPercent}%`,
                                            height: '100%',
                                            backgroundColor: categoryColor,
                                            borderRadius: '3px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.7rem',
                                            color: '#fff',
                                            fontWeight: 'bold',
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                            transition: 'opacity 0.2s'
                                        }}
                                            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                                            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                            title={`${element.elementName}\nStart: ${element.startTime.toFixed(2)}s\nEnd: ${element.endTime.toFixed(2)}s\nDuration: ${element.duration.toFixed(2)}s\nCategory: ${element.category}`}
                                        >
                                            {widthPercent > 8 && `${element.duration.toFixed(1)}s`}
                                        </div>

                                        {/* Time Markers (every 25%) */}
                                        {[25, 50, 75].map(percent => (
                                            <div key={percent} style={{
                                                position: 'absolute',
                                                left: `${percent}%`,
                                                top: 0,
                                                bottom: 0,
                                                width: '1px',
                                                backgroundColor: '#333',
                                                pointerEvents: 'none'
                                            }} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Time Scale */}
                        <div style={{ display: 'flex', marginTop: '10px', paddingLeft: '200px', borderTop: '1px solid #444', paddingTop: '5px' }}>
                            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#666' }}>
                                <span>0s</span>
                                <span>{(totalTime * 0.25).toFixed(1)}s</span>
                                <span>{(totalTime * 0.5).toFixed(1)}s</span>
                                <span>{(totalTime * 0.75).toFixed(1)}s</span>
                                <span>{totalTime.toFixed(1)}s</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AnalysisDashboard;
