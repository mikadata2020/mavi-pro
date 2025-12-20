import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { PROCESS_TYPES } from '../vsm-constants';

const ProcessNode = ({ data, selected, showDetails }) => {
    let borderStyle = '2px solid white';
    let bgStyle = data.color || '#1e1e1e';
    let labelExtra = null;

    if (data.processType === PROCESS_TYPES.PACEMAKER) {
        borderStyle = '4px double #ff9900';
        labelExtra = <div style={{ position: 'absolute', top: '-18px', color: '#ff9900', fontSize: '0.6rem', fontWeight: 'bold', width: '100%', textAlign: 'center' }}>PACEMAKER</div>;
    } else if (data.processType === PROCESS_TYPES.SHARED) {
        borderStyle = '2px dashed #00ffff';
        labelExtra = <div style={{ position: 'absolute', top: '-18px', color: '#00ffff', fontSize: '0.6rem', width: '100%', textAlign: 'center' }}>SHARED</div>;
    } else if (data.processType === PROCESS_TYPES.OUTSIDE) {
        borderStyle = '2px dotted #aaa';
        labelExtra = <div style={{ position: 'absolute', top: '-18px', color: '#aaa', fontSize: '0.6rem', width: '100%', textAlign: 'center' }}>OUTSIDE</div>;
    }

    // Bottleneck detection
    const isBottleneck = data.globalTakt > 0 && Number(data.ct) > Number(data.globalTakt);
    if (isBottleneck) {
        borderStyle = '3px solid #ff4444';
        bgStyle = '#441111';
    }

    return (
        <div style={{ position: 'relative' }}>
            {/* Input Handles */}
            <Handle type="target" position={Position.Top} id="t" style={{ background: '#555' }} />
            <Handle type="target" position={Position.Left} id="l" style={{ background: '#555' }} />

            {labelExtra}
            {isBottleneck && (
                <div style={{ position: 'absolute', top: '-18px', right: '0', color: '#ff4444', fontSize: '0.6rem', fontWeight: 'bold' }}>⚠️ BOTTLENECK</div>
            )}

            {/* Main Box */}
            <div style={{
                width: '140px',
                height: '60px',
                border: borderStyle,
                backgroundColor: bgStyle,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.8rem',
                boxShadow: selected ? '0 0 0 2px #0078d4' : (isBottleneck ? '0 0 10px rgba(255, 68, 68, 0.5)' : 'none')
            }}>
                {data.name}
            </div>

            {/* Detailed Data Box - TPS Standard */}
            {showDetails && (
                <div style={{
                    width: '140px',
                    border: '1px solid #666',
                    marginTop: '-1px',
                    backgroundColor: '#252526',
                    fontSize: '0.6rem',
                    padding: '0',
                    color: '#ddd'
                }}>
                    <div style={dataRowStyle}><span style={labelStyle}>C/T (sec)</span><span style={valStyle}>{data.ct}</span></div>
                    <div style={dataRowStyle}><span style={labelStyle}>C/O (min)</span><span style={valStyle}>{data.co}</span></div>
                    <div style={dataRowStyle}><span style={labelStyle}>Uptime (%)</span><span style={valStyle}>{data.uptime}</span></div>
                    <div style={dataRowStyle}><span style={labelStyle}>Perform. (%)</span><span style={valStyle}>{data.performance || 100}</span></div>
                    <div style={dataRowStyle}><span style={labelStyle}>Yield (%)</span><span style={valStyle}>{data.yield || 100}</span></div>
                    <div style={dataRowStyle}><span style={labelStyle}>VA Time (s)</span><span style={valStyle}>{data.va || data.ct}</span></div>
                    <div style={dataRowStyle}><span style={labelStyle}>Operators</span><span style={valStyle}>{data.operators || 1}</span></div>

                    {/* OEE Calculation */}
                    <div style={{ ...dataRowStyle, backgroundColor: '#1a1a1a', borderTop: '1px solid #555' }}>
                        <span style={{ ...labelStyle, color: '#4caf50', fontWeight: 'bold' }}>OEE (%)</span>
                        <span style={{ ...valStyle, color: '#4caf50' }}>
                            {Math.round((Number(data.uptime || 100) / 100) * (Number(data.performance || 100) / 100) * (Number(data.yield || 100) / 100) * 100)}%
                        </span>
                    </div>

                    {/* DEEP ANALYTICS: Capacity */}
                    {data.ct > 0 && (
                        <div style={{ ...dataRowStyle, backgroundColor: '#1a1a1a', borderTop: '1px solid #555' }}>
                            <span style={labelStyle}>Cap/Hr (pcs)</span>
                            <span style={{ ...valStyle, color: '#4fc3f7' }}>
                                {Math.floor((3600 * (Number(data.uptime || 100) / 100) * (Number(data.yield || 100) / 100)) / Number(data.ct))}
                            </span>
                        </div>
                    )}

                    {/* DEEP ANALYTICS: Utilization Bar */}
                    {data.globalTakt > 0 && (
                        <div style={{ padding: '4px', borderTop: '1px solid #444' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5rem', marginBottom: '2px' }}>
                                <span>Utilisasi</span>
                                <span>{Math.round((Number(data.ct) / (Number(data.globalTakt) * Number(data.operators || 1))) * 100)}%</span>
                            </div>
                            <div style={{ height: '4px', width: '100%', backgroundColor: '#333', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${Math.min(100, (Number(data.ct) / (Number(data.globalTakt) * Number(data.operators || 1))) * 100)}%`,
                                    backgroundColor: isBottleneck ? '#ff4444' : '#4caf50'
                                }}></div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Output Handles */}
            <Handle type="source" position={Position.Bottom} id="b" style={{ background: '#555' }} />
            <Handle type="source" position={Position.Right} id="r" style={{ background: '#555' }} />
        </div>
    );
};

const dataRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    borderBottom: '1px solid #444',
    padding: '2px 4px'
};
const labelStyle = { color: '#aaa' };
const valStyle = { fontWeight: 'bold', color: 'white' };

export default memo(ProcessNode);
