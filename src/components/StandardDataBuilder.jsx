import React, { useState } from 'react';
import { mtm1Data } from '../data/mtm1Data';
import { Plus, Trash2, Save, Download, FileText, ChevronRight, ChevronDown } from 'lucide-react';

function StandardDataBuilder() {
    const [sequence, setSequence] = useState([]);
    const [expandedCategory, setExpandedCategory] = useState('reach');
    const [searchQuery, setSearchQuery] = useState('');
    const [title, setTitle] = useState('New Standard Operation');

    const addToSequence = (item) => {
        setSequence(prev => [...prev, { ...item, id: Date.now(), frequency: 1 }]);
    };

    const removeFromSequence = (index) => {
        setSequence(prev => prev.filter((_, i) => i !== index));
    };

    const updateFrequency = (index, val) => {
        const newSeq = [...sequence];
        newSeq[index].frequency = Math.max(1, parseInt(val) || 1);
        setSequence(newSeq);
    };

    const categories = Object.keys(mtm1Data);

    const totalTMU = sequence.reduce((sum, item) => sum + (item.tmu * item.frequency), 0);
    const totalSeconds = (totalTMU * 0.036).toFixed(3);

    const filteredCodes = (category) => {
        const codes = mtm1Data[category].codes;
        if (!searchQuery) return codes;
        return codes.filter(c =>
            c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.desc.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const handleExport = () => {
        const dataStr = JSON.stringify({ title, sequence, totalTMU, totalSeconds }, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/\s+/g, '_')}_PMTS.json`;
        a.click();
    };

    return (
        <div style={{ height: '100%', display: 'flex', backgroundColor: 'var(--bg-primary)', overflow: 'hidden' }}>
            {/* LEFT SIDEBAR - LIBRARY */}
            <div style={{ width: '350px', backgroundColor: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        📚 MTM-1 Library
                    </h2>
                    <input
                        type="text"
                        placeholder="Search codes (e.g., R10)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            color: 'var(--text-primary)'
                        }}
                    />
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {categories.map(cat => (
                        <div key={cat} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <div
                                onClick={() => setExpandedCategory(expandedCategory === cat ? null : cat)}
                                style={{
                                    padding: '15px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    backgroundColor: expandedCategory === cat ? '#333' : 'transparent',
                                    fontWeight: '600'
                                }}
                            >
                                <span>{mtm1Data[cat].title}</span>
                                {expandedCategory === cat ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </div>

                            {expandedCategory === cat && (
                                <div style={{ padding: '10px', backgroundColor: '#1e1e1e' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px', padding: '0 5px' }}>
                                        {mtm1Data[cat].description}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                        {filteredCodes(cat).map((item) => (
                                            <div
                                                key={item.code}
                                                onClick={() => addToSequence(item)}
                                                style={{
                                                    padding: '10px',
                                                    backgroundColor: '#2d2d2d',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    border: '1px solid transparent',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; e.currentTarget.style.backgroundColor = '#3d3d3d'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.backgroundColor = '#2d2d2d'; }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 'bold', color: 'var(--accent-blue)' }}>{item.code}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#ccc' }}>{item.desc}</div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontWeight: 'bold' }}>{item.tmu}</span>
                                                    <Plus size={14} color="#0a5" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* MAIN AREA - SEQUENCE EDITOR */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={{
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderBottom: '2px solid transparent',
                                color: 'var(--text-primary)',
                                padding: '5px',
                                width: '400px'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--accent-blue)'}
                            onBlur={(e) => e.target.style.borderColor = 'transparent'}
                        />
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                            Standard Data Builder (PMTS)
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={handleExport}
                            className="btn"
                            style={{ backgroundColor: '#0078d4', display: 'flex', gap: '8px', padding: '10px 20px', borderRadius: '8px', alignItems: 'center' }}
                        >
                            <Download size={18} /> Export JSON
                        </button>
                    </div>
                </div>

                {/* SEQUENCE TABLE */}
                <div style={{ flex: 1, backgroundColor: '#1e1e1e', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '50px 100px 1fr 80px 80px 80px 50px',
                        padding: '15px',
                        backgroundColor: '#252526',
                        borderBottom: '1px solid var(--border-color)',
                        fontWeight: 'bold',
                        color: '#aaa'
                    }}>
                        <div>#</div>
                        <div>Code</div>
                        <div>Description</div>
                        <div style={{ textAlign: 'right' }}>TMU</div>
                        <div style={{ textAlign: 'center' }}>Freq</div>
                        <div style={{ textAlign: 'right' }}>Total</div>
                        <div></div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                        {sequence.length === 0 ? (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                                <FileText size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                                <p>No operations added yet.</p>
                                <p style={{ fontSize: '0.9rem' }}>Click items from the library on the left to build your sequence.</p>
                            </div>
                        ) : (
                            sequence.map((item, index) => (
                                <div key={item.id} style={{
                                    display: 'grid',
                                    gridTemplateColumns: '50px 100px 1fr 80px 80px 80px 50px',
                                    padding: '12px 15px',
                                    borderBottom: '1px solid #333',
                                    alignItems: 'center',
                                    backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                                }}>
                                    <div style={{ color: '#666' }}>{index + 1}</div>
                                    <div style={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}>{item.code}</div>
                                    <div>{item.desc}</div>
                                    <div style={{ textAlign: 'right', fontFamily: 'monospace' }}>{item.tmu}</div>
                                    <div style={{ textAlign: 'center' }}>
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.frequency}
                                            onChange={(e) => updateFrequency(index, e.target.value)}
                                            style={{
                                                width: '50px',
                                                backgroundColor: '#333',
                                                border: '1px solid #555',
                                                color: 'white',
                                                textAlign: 'center',
                                                borderRadius: '4px',
                                                padding: '4px'
                                            }}
                                        />
                                    </div>
                                    <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#0a5' }}>
                                        {(item.tmu * item.frequency).toFixed(1)}
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <button
                                            onClick={() => removeFromSequence(index)}
                                            style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '5px' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* FOOTER SUMMARY */}
                    <div style={{
                        padding: '20px',
                        backgroundColor: '#252526',
                        borderTop: '1px solid var(--border-color)',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '40px',
                        fontSize: '1.2rem'
                    }}>
                        <div>
                            <span style={{ color: '#888', marginRight: '10px' }}>Total TMU:</span>
                            <span style={{ fontWeight: 'bold', color: 'white' }}>{totalTMU.toFixed(1)}</span>
                        </div>
                        <div>
                            <span style={{ color: '#888', marginRight: '10px' }}>Time (sec):</span>
                            <span style={{ fontWeight: 'bold', color: '#0a5' }}>{totalSeconds}s</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StandardDataBuilder;
