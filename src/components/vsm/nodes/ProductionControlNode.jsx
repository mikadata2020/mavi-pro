import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const ProductionControlNode = ({ data, selected, showDetails }) => {
    return (
        <div style={{ position: 'relative', minWidth: '160px' }}>
            <Handle type="target" position={Position.Top} id="t" style={{ background: '#555' }} />
            <Handle type="target" position={Position.Left} id="l" style={{ background: '#555' }} />
            <Handle type="target" position={Position.Right} id="r" style={{ background: '#555' }} />
            <Handle type="target" position={Position.Bottom} id="b" style={{ background: '#555' }} />

            <div style={{
                border: '2px solid white',
                backgroundColor: '#1e1e1e',
                color: 'white',
                padding: '10px 15px',
                minHeight: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                fontSize: '0.8rem',
                boxShadow: selected ? '0 0 0 2px #0078d4' : 'none'
            }}>
                {data.name || 'Production Control'}
            </div>

            <Handle type="source" position={Position.Top} id="st" style={{ background: '#555', top: 0 }} />
            <Handle type="source" position={Position.Left} id="sl" style={{ background: '#555', left: 0 }} />
            <Handle type="source" position={Position.Right} id="sr" style={{ background: '#555', right: 0 }} />
            <Handle type="source" position={Position.Bottom} id="sb" style={{ background: '#555', bottom: 0 }} />
        </div>
    );
};

export default memo(ProductionControlNode);
