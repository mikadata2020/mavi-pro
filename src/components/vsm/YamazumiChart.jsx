import React from 'react';
import { X, BarChart3 } from 'lucide-react';

const YamazumiChart = ({ isOpen, onClose, nodes, taktTime, currentLanguage }) => {
    if (!isOpen) return null;

    const processNodes = nodes
        .filter(n => n.type === 'process')
        .map(n => ({
            name: n.data.name || 'Process',
            ct: Number(n.data.ct || 0),
            id: n.id
        }));

    const maxTime = Math.max(taktTime * 1.5, ...processNodes.map(p => p.ct), 10);
    const chartHeight = 300;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
        }}>
            <div style={{
                width: '90%', maxWidth: '1000px', backgroundColor: '#1e1e1e',
                borderRadius: '12px', border: '1px solid #444',
                boxShadow: '0 10px 40px rgba(0,0,0,0.9)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '15px 20px', backgroundColor: '#333',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '1px solid #444'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white', fontWeight: 'bold' }}>
                        <BarChart3 size={20} color="#4fc3f7" />
                        {currentLanguage === 'id' ? 'Grafik Yamazumi (Work Balancing)' : 'Yamazumi Chart (Work Balancing)'}
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                    {/* Chart Area */}
                    <div style={{
                        width: '100%', height: `${chartHeight}px`,
                        borderLeft: '2px solid #666', borderBottom: '2px solid #666',
                        position: 'relative', display: 'flex', alignItems: 'flex-end',
                        padding: '0 20px', gap: '20px'
                    }}>
                        {/* Takt Time Line */}
                        {taktTime > 0 && (
                            <div style={{
                                position: 'absolute',
                                left: 0,
                                width: '100%',
                                bottom: `${(taktTime / maxTime) * chartHeight}px`,
                                borderTop: '2px dashed #ff4444',
                                zIndex: 10
                            }}>
                                <span style={{
                                    position: 'absolute', right: '5px', top: '-18px',
                                    color: '#ff4444', fontSize: '0.7rem', fontWeight: 'bold'
                                }}>
                                    TAKT: {taktTime}s
                                </span>
                            </div>
                        )}

                        {/* Bars */}
                        {processNodes.map((p, idx) => {
                            const height = (p.ct / maxTime) * chartHeight;
                            const isOver = taktTime > 0 && p.ct > taktTime;

                            return (
                                <div key={p.id} style={{
                                    flex: 1, display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', minWidth: '60px', maxWidth: '120px'
                                }}>
                                    <div style={{
                                        width: '100%', height: `${height}px`,
                                        backgroundColor: isOver ? '#d13438' : '#0078d4',
                                        borderRadius: '4px 4px 0 0',
                                        position: 'relative',
                                        transition: 'height 0.3s ease',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                                    }}>
                                        <div style={{
                                            position: 'absolute', top: '-20px', width: '100%',
                                            textAlign: 'center', color: 'white', fontSize: '0.7rem'
                                        }}>
                                            {p.ct}s
                                        </div>
                                    </div>
                                    <div style={{
                                        marginTop: '10px', color: '#aaa', fontSize: '0.65rem',
                                        textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden',
                                        textOverflow: 'ellipsis', width: '100%'
                                    }}>
                                        {p.name}
                                    </div>
                                </div>
                            );
                        })}

                        {processNodes.length === 0 && (
                            <div style={{ width: '100%', textAlign: 'center', color: '#666', marginBottom: '100px' }}>
                                {currentLanguage === 'id' ? 'Tidak ada proses yang ditemukan' : 'No processes found'}
                            </div>
                        )}
                    </div>

                    {/* Legend / Info */}
                    <div style={{ marginTop: '40px', width: '100%', display: 'flex', gap: '30px', color: '#ddd', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '12px', height: '12px', backgroundColor: '#0078d4', borderRadius: '2px' }}></div>
                            {currentLanguage === 'id' ? 'Dibawah Takt Time' : 'Below Takt Time'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '12px', height: '12px', backgroundColor: '#d13438', borderRadius: '2px' }}></div>
                            {currentLanguage === 'id' ? 'Melebihi Takt (Bottleneck)' : 'Over Takt (Bottleneck)'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '20px', height: '2px', borderTop: '2px dashed #ff4444' }}></div>
                            Takt Time
                        </div>
                    </div>
                </div>

                {/* Footer Advice */}
                <div style={{ padding: '15px 20px', backgroundColor: '#252526', color: '#aaa', fontSize: '0.75rem', borderTop: '1px solid #444' }}>
                    💡 <strong>TPS Tip:</strong> {currentLanguage === 'id'
                        ? 'Tujuannya adalah menyeimbangkan semua bar agar setara dan sedikit di bawah garis Takt Time (Heijunka).'
                        : 'The goal is to balance all bars so they are equal and slightly below the Takt Time line (Heijunka).'}
                </div>
            </div>
        </div>
    );
};

export default YamazumiChart;
