import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const InventoryNode = ({ data, selected }) => {
    return (
        <div style={{ position: 'relative', width: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Handle type="target" position={Position.Left} id="l" style={{ background: '#555' }} />
            <Handle type="target" position={Position.Top} id="t" style={{ background: '#555' }} />

            {/* Triangle Shape */}
            <div style={{
                width: '60px',
                height: '60px',
                position: 'relative',
                filter: selected ? 'drop-shadow(0 0 2px #0078d4)' : 'none'
            }}>
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <polygon points="0,0 100,0 50,100" fill="#ff9900" />
                </svg>
                <div style={{
                    position: 'absolute',
                    top: '20%',
                    left: '0',
                    width: '100%',
                    textAlign: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    pointerEvents: 'none'
                }}>I</div>
            </div>

            {/* Data Label */}
            <div style={{
                marginTop: '5px',
                textAlign: 'center',
                color: '#ff9900',
                fontSize: '0.7rem',
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: '2px 4px',
                borderRadius: '4px'
            }}>
                {data.amount} {data.unit}<br />
                {data.time ? `${data.time}s` : ''}
            </div>

            <Handle type="source" position={Position.Right} id="r" style={{ background: '#555' }} />
            <Handle type="source" position={Position.Bottom} id="b" style={{ background: '#555' }} />
        </div>
    );
};

export default memo(InventoryNode);
