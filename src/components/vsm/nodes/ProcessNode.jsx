import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { PROCESS_TYPES } from '../vsm-constants';

const ProcessNode = ({ data, selected }) => {
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

    return (
        <div style={{ position: 'relative' }}>
            {/* Input Handles */}
            <Handle type="target" position={Position.Top} id="t" style={{ background: '#555' }} />
            <Handle type="target" position={Position.Left} id="l" style={{ background: '#555' }} />

            {labelExtra}

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
                boxShadow: selected ? '0 0 0 2px #0078d4' : 'none'
            }}>
                {data.name}
            </div>

            {/* Detailed Data Box - TPS Standard */}
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
                <div style={dataRowStyle}><span style={labelStyle}>Yield (%)</span><span style={valStyle}>{data.yield || 100}</span></div>
                <div style={dataRowStyle}><span style={labelStyle}>VA Time (s)</span><span style={valStyle}>{data.va || data.ct}</span></div>
                <div style={dataRowStyle}><span style={labelStyle}>Operators</span><span style={valStyle}>{data.operators || 1}</span></div>
            </div>

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
