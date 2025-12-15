import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { VSMSymbols } from '../vsm-constants';

const GenericNode = ({ data, selected }) => {
    let content = null;
    let label = data.label || data.name;

    const commonStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5px',
        border: selected ? '2px solid #0078d4' : '2px solid transparent',
        borderRadius: '4px',
        cursor: 'grab'
    };

    switch (data.symbolType) {
        case VSMSymbols.SUPPLIER:
        case VSMSymbols.CUSTOMER:
            content = (
                <div style={{ width: '80px', height: '60px', border: '2px solid white', backgroundColor: data.color || '#1e1e1e', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', top: '-10px', left: '20px', width: '40px', height: '20px', border: '2px solid white', borderBottom: 'none', backgroundColor: data.color || '#1e1e1e' }}></div>
                    <div style={{ color: 'white', fontSize: '0.8rem', zIndex: 1 }}>{label}</div>
                </div>
            );
            break;
        case VSMSymbols.TRUCK:
            content = <div style={{ fontSize: '2.5rem' }}>🚚</div>;
            break;
        case VSMSymbols.OPERATOR:
            content = <div style={{ fontSize: '2rem' }}>👤</div>;
            break;
        case VSMSymbols.EYE_OBSERVATION:
            content = <div style={{ fontSize: '2rem' }}>👁️</div>;
            break;
        case VSMSymbols.KANBAN_PRODUCTION:
            content = (
                <div style={{
                    width: '30px', height: '40px',
                    backgroundColor: '#00cc00',
                    clipPath: 'polygon(0 0, 100% 0, 100% 80%, 50% 100%, 0 80%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 'bold', fontSize: '1.2rem'
                }}>P</div>
            );
            break;
        case VSMSymbols.KANBAN_WITHDRAWAL:
            content = (
                <div style={{
                    width: '30px', height: '40px',
                    backgroundColor: '#ff9900',
                    clipPath: 'polygon(0 0, 100% 0, 100% 80%, 50% 100%, 0 80%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 'bold', fontSize: '1.2rem'
                }}>W</div>
            );
            break;
        case VSMSymbols.SIGNAL_KANBAN:
            content = (
                <div style={{
                    width: '0', height: '0',
                    borderLeft: '20px solid transparent',
                    borderRight: '20px solid transparent',
                    borderBottom: '40px solid #cc0000',
                    position: 'relative',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{ position: 'absolute', top: '15px', color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>S</div>
                </div>
            );
            break;
        case VSMSymbols.RAW_MATERIAL:
            // Just like supplier but often depicted simpler or same
            content = (
                <div style={{ width: '60px', height: '40px', border: '2px solid #aaa', borderStyle: 'dashed', backgroundColor: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ color: '#aaa', fontSize: '0.6rem' }}>RAW</div>
                </div>
            );
            break;
        case VSMSymbols.KAIZEN_BURST:
            content = (
                <div style={{
                    width: '90px', height: '70px',
                    background: 'url(\'data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 0 L60 20 L80 10 L85 30 L100 40 L85 60 L95 80 L70 85 L60 100 L40 85 L20 95 L15 70 L0 60 L20 40 L10 20 L30 15 Z" fill="%23ffeb3b" stroke="red" stroke-width="2"/></svg>\') no-repeat center/contain',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                    color: 'black', fontWeight: 'bold', fontSize: '0.7rem', padding: '15px'
                }}>
                    {label}
                </div>
            );
            break;
        case VSMSymbols.SUPERMARKET:
            content = (
                <div style={{ width: '60px', height: '40px', border: '2px solid lime', borderLeft: 'none', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '10px', height: '100%', borderRight: '2px solid lime' }}></div>
                    <div style={{ position: 'absolute', top: 0, left: '20px', width: '10px', height: '100%', borderRight: '2px solid lime' }}></div>
                    <div style={{ position: 'absolute', top: '10px', left: 0, width: '100%', height: '2px', backgroundColor: 'lime' }}></div>
                    <div style={{ position: 'absolute', top: '25px', left: 0, width: '100%', height: '2px', backgroundColor: 'lime' }}></div>
                    <div style={{ position: 'absolute', bottom: '-15px', width: '100%', textAlign: 'center', color: 'lime', fontSize: '0.6rem' }}>Supermarket</div>
                </div>
            );
            break;
        case VSMSymbols.FIFO:
            content = (
                <div style={{ width: '80px', height: '30px', borderBottom: '2px solid white', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '100%', borderTop: '2px solid white', position: 'absolute', top: 0 }}></div>
                    <span style={{ fontSize: '0.8rem', color: 'white' }}>FIFO</span>
                </div>
            );
            break;
        case VSMSymbols.SAFETY_STOCK:
            content = (
                <div style={{ width: '0', height: '0', borderLeft: '20px solid transparent', borderRight: '20px solid transparent', borderBottom: '35px solid #fff', position: 'relative', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', top: '15px', width: '0', height: '0', borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderBottom: '15px solid #1e1e1e' }}></div>
                </div>
            );
            break;
        case VSMSymbols.CUSTOM:
            content = (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <img src={data.imageUrl} alt="Custom" style={{ maxWidth: '80px', maxHeight: '80px', objectFit: 'contain' }} />
                    {data.description && (
                        <div style={{ fontSize: '0.7rem', backgroundColor: '#333', color: 'white', padding: '2px 4px', borderRadius: '4px', marginTop: '2px', maxWidth: '100px', textAlign: 'center' }}>
                            {data.description}
                        </div>
                    )}
                </div>
            );
            break;
        default:
            content = <div>{label}</div>;
    }

    return (
        <div style={commonStyle}>
            <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
            <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
            {content}
            <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
            <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
        </div>
    );
};

export default memo(GenericNode);
