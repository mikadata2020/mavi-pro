import React, { useState, useEffect } from 'react';
import { getItemFromCloud } from '../utils/knowledgeBaseDB';

const PublicManualViewer = ({ manualId, onClose }) => {
    const [manual, setManual] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadManual();
    }, [manualId]);

    const loadManual = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await getItemFromCloud(manualId);
            if (data) {
                setManual(data);
            } else {
                setError('Manual not found');
            }
        } catch (err) {
            console.error('Failed to load manual:', err);
            setError('Failed to load manual from cloud');
        } finally {
            setIsLoading(false);
        }
    };

    const styles = {
        container: {
            minHeight: '100vh',
            backgroundColor: '#f5f5f5',
            padding: '20px'
        },
        header: {
            backgroundColor: '#0078d4',
            color: 'white',
            padding: '20px',
            borderRadius: '8px 8px 0 0',
            marginBottom: '0'
        },
        logo: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '15px'
        },
        title: {
            margin: 0,
            fontSize: '1.8rem'
        },
        meta: {
            fontSize: '0.9rem',
            opacity: 0.9
        },
        content: {
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '0 0 8px 8px',
            maxWidth: '900px',
            margin: '0 auto',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        },
        metaTable: {
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '30px',
            fontSize: '0.9rem'
        },
        metaCell: {
            padding: '10px 15px',
            border: '1px solid #ddd'
        },
        metaLabel: {
            backgroundColor: '#f5f5f5',
            fontWeight: 'bold',
            width: '150px'
        },
        step: {
            marginBottom: '25px',
            padding: '20px',
            backgroundColor: '#fafafa',
            borderRadius: '8px',
            border: '1px solid #eee'
        },
        stepHeader: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '15px'
        },
        stepNumber: {
            backgroundColor: '#0078d4',
            color: 'white',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
        },
        stepTitle: {
            margin: 0,
            fontSize: '1.1rem',
            color: '#333'
        },
        stepContent: {
            display: 'flex',
            gap: '20px'
        },
        stepImage: {
            maxWidth: '200px',
            borderRadius: '8px',
            border: '1px solid #ddd'
        },
        stepInstructions: {
            flex: 1,
            lineHeight: 1.6
        },
        loading: {
            textAlign: 'center',
            padding: '60px',
            fontSize: '1.2rem',
            color: '#666'
        },
        error: {
            textAlign: 'center',
            padding: '60px',
            color: '#d13438'
        },
        footer: {
            textAlign: 'center',
            padding: '20px',
            color: '#888',
            fontSize: '0.85rem'
        },
        bullet: {
            padding: '8px 12px',
            borderRadius: '4px',
            marginBottom: '8px'
        }
    };

    if (isLoading) {
        return (
            <div style={styles.container}>
                <div style={{ ...styles.content, maxWidth: '500px', margin: '100px auto' }}>
                    <div style={styles.loading}>
                        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⏳</div>
                        Loading manual...
                    </div>
                </div>
            </div>
        );
    }

    if (error || !manual) {
        return (
            <div style={styles.container}>
                <div style={{ ...styles.content, maxWidth: '500px', margin: '100px auto' }}>
                    <div style={styles.error}>
                        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>❌</div>
                        <h2>Manual Not Found</h2>
                        <p>{error || 'The requested manual could not be found.'}</p>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#0078d4',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                marginTop: '20px'
                            }}
                        >
                            Go to MAVi App
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const steps = manual.steps || manual.content || [];

    return (
        <div style={styles.container}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.logo}>
                        <span style={{ fontSize: '1.5rem' }}>📋</span>
                        <span style={{ fontWeight: 'bold' }}>MAVi Work Instructions</span>
                    </div>
                    <h1 style={styles.title}>{manual.title}</h1>
                    <div style={styles.meta}>
                        <span>📄 {manual.documentNumber || '-'}</span>
                        <span style={{ margin: '0 15px' }}>|</span>
                        <span>Version {manual.version || '1.0'}</span>
                        <span style={{ margin: '0 15px' }}>|</span>
                        <span>{manual.status || 'Published'}</span>
                    </div>
                </div>

                {/* Content */}
                <div style={styles.content}>
                    {/* Meta Info Table */}
                    <table style={styles.metaTable}>
                        <tbody>
                            <tr>
                                <td style={{ ...styles.metaCell, ...styles.metaLabel }}>Author</td>
                                <td style={styles.metaCell}>{manual.author || '-'}</td>
                                <td style={{ ...styles.metaCell, ...styles.metaLabel }}>Difficulty</td>
                                <td style={styles.metaCell}>{manual.difficulty || 'Moderate'}</td>
                            </tr>
                            <tr>
                                <td style={{ ...styles.metaCell, ...styles.metaLabel }}>Time Required</td>
                                <td style={styles.metaCell}>{manual.timeRequired || '-'}</td>
                                <td style={{ ...styles.metaCell, ...styles.metaLabel }}>Category</td>
                                <td style={styles.metaCell}>{manual.category || '-'}</td>
                            </tr>
                            <tr>
                                <td style={{ ...styles.metaCell, ...styles.metaLabel }}>Description</td>
                                <td colSpan="3" style={styles.metaCell}>{manual.summary || manual.description || '-'}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Steps */}
                    {Array.isArray(steps) && steps.length > 0 ? (
                        <div>
                            <h2 style={{ marginBottom: '20px', color: '#0078d4' }}>📝 Steps</h2>
                            {steps.map((step, index) => (
                                <div key={step.id || index} style={styles.step}>
                                    <div style={styles.stepHeader}>
                                        <div style={styles.stepNumber}>{index + 1}</div>
                                        <h3 style={styles.stepTitle}>{step.title}</h3>
                                    </div>
                                    <div style={styles.stepContent}>
                                        {step.media && step.media.url && (
                                            <img
                                                src={step.media.url}
                                                alt={step.title}
                                                style={styles.stepImage}
                                            />
                                        )}
                                        <div style={styles.stepInstructions}>
                                            <div dangerouslySetInnerHTML={{ __html: step.instructions || '' }} />

                                            {step.bullets && step.bullets.length > 0 && (
                                                <div style={{ marginTop: '15px' }}>
                                                    {step.bullets.map((bullet, i) => (
                                                        <div
                                                            key={i}
                                                            style={{
                                                                ...styles.bullet,
                                                                backgroundColor:
                                                                    bullet.type === 'warning' ? '#fff3cd' :
                                                                        bullet.type === 'caution' ? '#f8d7da' :
                                                                            bullet.type === 'note' ? '#cfe2ff' : '#e9ecef',
                                                                borderLeft: `4px solid ${bullet.type === 'warning' ? '#ffaa00' :
                                                                        bullet.type === 'caution' ? '#d13438' :
                                                                            bullet.type === 'note' ? '#0078d4' : '#666'
                                                                    }`
                                                            }}
                                                        >
                                                            <strong>
                                                                {bullet.type === 'warning' && '⚠️ WARNING: '}
                                                                {bullet.type === 'caution' && '🚨 CAUTION: '}
                                                                {bullet.type === 'note' && 'ℹ️ NOTE: '}
                                                            </strong>
                                                            {bullet.text}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                            <p>No step content available</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={styles.footer}>
                    <p>Generated by MAVi Motion Study</p>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#0078d4',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        Open MAVi App
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PublicManualViewer;
