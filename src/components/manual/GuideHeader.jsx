import React, { useState } from 'react';

const GuideHeader = ({ headerInfo, onChange }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleChange = (field, value) => {
        onChange({ ...headerInfo, [field]: value });
    };

    return (
        <div style={{ backgroundColor: '#252526', borderBottom: '1px solid #333' }}>
            {/* Collapsible Header Bar */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    padding: '12px 20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#1e1e1e',
                    borderBottom: isExpanded ? '1px solid #333' : 'none'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{isExpanded ? '▼' : '▶'}</span>
                    <strong style={{ color: '#fff' }}>Document Information</strong>
                    <span style={{ color: '#888', fontSize: '0.85rem' }}>
                        ({headerInfo.documentNumber || 'No Doc #'} - {headerInfo.status || 'Draft'})
                    </span>
                </div>
                <span style={{ color: '#888', fontSize: '0.8rem' }}>Click to {isExpanded ? 'hide' : 'show'}</span>
            </div>

            {/* Expandable Content */}
            {isExpanded && (
                <div style={{ padding: '20px' }}>
                    {/* Main Title */}
                    <div style={{ marginBottom: '15px' }}>
                        <input
                            value={headerInfo.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="Work Instructions Title"
                            style={{
                                width: '100%',
                                fontSize: '1.8rem',
                                fontWeight: 'bold',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderBottom: '2px solid #444',
                                color: '#fff',
                                padding: '5px 0',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Document Metadata Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '15px',
                        marginBottom: '15px'
                    }}>
                        {/* Document Number */}
                        <div>
                            <label style={{ display: 'block', color: '#888', fontSize: '0.7rem', marginBottom: '4px', textTransform: 'uppercase' }}>
                                Document Number
                            </label>
                            <input
                                value={headerInfo.documentNumber || ''}
                                onChange={(e) => handleChange('documentNumber', e.target.value)}
                                placeholder="DOC-001"
                                style={inputStyle}
                            />
                        </div>

                        {/* Version */}
                        <div>
                            <label style={{ display: 'block', color: '#888', fontSize: '0.7rem', marginBottom: '4px', textTransform: 'uppercase' }}>
                                Version
                            </label>
                            <input
                                value={headerInfo.version || '1.0'}
                                onChange={(e) => handleChange('version', e.target.value)}
                                placeholder="1.0"
                                style={inputStyle}
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label style={{ display: 'block', color: '#888', fontSize: '0.7rem', marginBottom: '4px', textTransform: 'uppercase' }}>
                                Status
                            </label>
                            <select
                                value={headerInfo.status || 'Draft'}
                                onChange={(e) => handleChange('status', e.target.value)}
                                style={inputStyle}
                            >
                                <option value="Draft">Draft</option>
                                <option value="Proposed">Proposed</option>
                                <option value="In Review">In Review</option>
                                <option value="Approved">Approved</option>
                                <option value="Released">Released</option>
                            </select>
                        </div>

                        {/* Author */}
                        <div>
                            <label style={{ display: 'block', color: '#888', fontSize: '0.7rem', marginBottom: '4px', textTransform: 'uppercase' }}>
                                Author
                            </label>
                            <input
                                value={headerInfo.author || ''}
                                onChange={(e) => handleChange('author', e.target.value)}
                                placeholder="Author Name"
                                style={inputStyle}
                            />
                        </div>

                        {/* Revision Date */}
                        <div>
                            <label style={{ display: 'block', color: '#888', fontSize: '0.7rem', marginBottom: '4px', textTransform: 'uppercase' }}>
                                Revision Date
                            </label>
                            <input
                                type="date"
                                value={headerInfo.revisionDate || new Date().toISOString().split('T')[0]}
                                onChange={(e) => handleChange('revisionDate', e.target.value)}
                                style={inputStyle}
                            />
                        </div>

                        {/* Effective Date */}
                        <div>
                            <label style={{ display: 'block', color: '#888', fontSize: '0.7rem', marginBottom: '4px', textTransform: 'uppercase' }}>
                                Effective Date
                            </label>
                            <input
                                type="date"
                                value={headerInfo.effectiveDate || ''}
                                onChange={(e) => handleChange('effectiveDate', e.target.value)}
                                style={inputStyle}
                            />
                        </div>

                        {/* Difficulty */}
                        <div>
                            <label style={{ display: 'block', color: '#888', fontSize: '0.7rem', marginBottom: '4px', textTransform: 'uppercase' }}>
                                Difficulty
                            </label>
                            <select
                                value={headerInfo.difficulty}
                                onChange={(e) => handleChange('difficulty', e.target.value)}
                                style={inputStyle}
                            >
                                <option value="Very Easy">Very Easy</option>
                                <option value="Easy">Easy</option>
                                <option value="Moderate">Moderate</option>
                                <option value="Difficult">Difficult</option>
                                <option value="Very Difficult">Very Difficult</option>
                            </select>
                        </div>

                        {/* Time Required */}
                        <div>
                            <label style={{ display: 'block', color: '#888', fontSize: '0.7rem', marginBottom: '4px', textTransform: 'uppercase' }}>
                                Time Required
                            </label>
                            <input
                                value={headerInfo.timeRequired}
                                onChange={(e) => handleChange('timeRequired', e.target.value)}
                                placeholder="e.g. 10 - 20 minutes"
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    {/* Description/Summary */}
                    <div>
                        <label style={{ display: 'block', color: '#888', fontSize: '0.7rem', marginBottom: '4px', textTransform: 'uppercase' }}>
                            Description
                        </label>
                        <textarea
                            value={headerInfo.summary}
                            onChange={(e) => handleChange('summary', e.target.value)}
                            placeholder="Optional brief description of the process"
                            style={{
                                width: '100%',
                                backgroundColor: '#333',
                                color: '#fff',
                                border: '1px solid #444',
                                borderRadius: '4px',
                                padding: '8px',
                                fontSize: '0.9rem',
                                resize: 'vertical',
                                minHeight: '60px',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const inputStyle = {
    width: '100%',
    backgroundColor: '#333',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: '4px',
    padding: '6px 8px',
    fontSize: '0.9rem',
    outline: 'none'
};

export default GuideHeader;
