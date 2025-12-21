import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const ProductionControlNode = ({ data, selected, showDetails }) => {
    return (
        <div style={{ position: 'relative', minWidth: '160px' }}>
            <Handle type="target" position={Position.Top} id="top" style={{ background: '#555' }} />
            <Handle type="source" position={Position.Top} id="top-source" style={{ background: '#555', left: '60%' }} />

            <Handle type="target" position={Position.Left} id="left" style={{ background: '#555' }} />
            <Handle type="source" position={Position.Left} id="left-source" style={{ background: '#555', top: '60%' }} />

            <Handle type="target" position={Position.Right} id="right-target" style={{ background: '#555' }} />
            <Handle type="source" position={Position.Right} id="right" style={{ background: '#555', top: '60%' }} />

            <Handle type="target" position={Position.Bottom} id="bottom-target" style={{ background: '#555' }} />
            <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: '#555', left: '60%' }} />

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
        </div>
    );
};

export default memo(ProductionControlNode);
