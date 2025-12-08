import React from 'react';

const StepList = ({ steps, activeStepId, onSelectStep, onAddStep, onDeleteStep, onReorderStep }) => {
    return (
        <div style={{
            width: '250px',
            backgroundColor: '#1e1e1e',
            borderRight: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
        }}>
            <div style={{ padding: '10px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: '#ccc' }}>Steps</span>
                <button
                    onClick={onAddStep}
                    style={{
                        backgroundColor: '#0078d4',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '0.8rem'
                    }}
                >
                    + Add
                </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {steps.map((step, index) => (
                    <div
                        key={step.id}
                        onClick={() => onSelectStep(step.id)}
                        style={{
                            padding: '10px',
                            backgroundColor: activeStepId === step.id ? '#37373d' : '#252526',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            borderLeft: activeStepId === step.id ? '3px solid #0078d4' : '3px solid transparent'
                        }}
                    >
                        <div style={{
                            width: '24px',
                            height: '24px',
                            backgroundColor: '#444',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            color: '#fff',
                            fontWeight: 'bold'
                        }}>
                            {index + 1}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.9rem', truncate: 'true', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {step.title || 'Untitled Step'}
                            </div>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDeleteStep(step.id); }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#666',
                                cursor: 'pointer',
                                fontSize: '1rem'
                            }}
                            title="Delete Step"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StepList;
