import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { VSMSymbols } from '../vsm-constants';

const GenericNode = ({ data, selected, showDetails }) => {
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
        case VSMSymbols.SEA:
        case VSMSymbols.AIR:
            const transportIcon = data.symbolType === VSMSymbols.SEA ? '🚢' : (data.symbolType === VSMSymbols.AIR ? '✈️' : '🚚');
            // Only flip Truck (🚚) as it usually faces left. Sea and Air usually face right.
            const shouldFlipTransport = data.symbolType === VSMSymbols.TRUCK;
            content = (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '2.5rem', transform: shouldFlipTransport ? 'scaleX(-1)' : 'none' }}>{transportIcon}</div>
                    <div style={{
                        marginTop: '5px', fontSize: '0.6rem', color: '#4fc3f7',
                        backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '4px',
                        textAlign: 'center', border: '1px solid #4fc3f7'
                    }}>
                        <b>{data.frequency || 0}x</b> {data.symbolType === VSMSymbols.SEA ? '/mo' : '/shift'}<br />
                        Cap: {data.capacity || 0}
                    </div>
                </div>
            );
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
        case VSMSymbols.BUFFER:
            content = (
                <div style={{ position: 'relative', width: '60px', height: '40px', border: '2px solid #ffcc00', backgroundColor: '#1e1e1e', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', background: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,204,0,0.2) 5px, rgba(255,204,0,0.2) 10px)' }}></div>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#ffcc00', fontSize: '0.6rem', fontWeight: 'bold' }}>BUFFER</div>
                </div>
            );
            break;
        case VSMSymbols.HEIJUNKA_BOX:
            content = (
                <div style={{ width: '80px', height: '60px', border: '2px solid #ccc', backgroundColor: '#1e1e1e', overflow: 'hidden' }}>
                    <div style={{ height: '15px', borderBottom: '1px solid #555', backgroundColor: '#333' }}></div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', height: '45px' }}>
                        {[...Array(6)].map((_, i) => <div key={i} style={{ border: '1px solid #444' }}></div>)}
                    </div>
                    <div style={{ position: 'absolute', bottom: '-15px', width: '100%', textAlign: 'center', color: '#ccc', fontSize: '0.6rem' }}>Heijunka</div>
                </div>
            );
            break;
        case VSMSymbols.KANBAN_POST:
            content = (
                <div style={{ position: 'relative', width: '40px', height: '60px' }}>
                    <div style={{ width: '30px', height: '40px', border: '2px solid #eee', backgroundColor: '#2d2d2d' }}>
                        <div style={{ margin: '5px auto', width: '15px', height: '2px', backgroundColor: '#555' }}></div>
                        <div style={{ margin: '3px auto', width: '15px', height: '2px', backgroundColor: '#555' }}></div>
                        <div style={{ margin: '3px auto', width: '15px', height: '2px', backgroundColor: '#555' }}></div>
                    </div>
                    <div style={{ width: '4px', height: '20px', backgroundColor: '#eee', margin: '0 auto' }}></div>
                    <div style={{ position: 'absolute', bottom: '-12px', width: '100%', textAlign: 'center', color: '#eee', fontSize: '0.5rem' }}>Kanban Post</div>
                </div>
            );
            break;
        case VSMSymbols.PUSH_ARROW:
            content = (
                <div style={{ width: '100px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="100" height="40" viewBox="0 0 100 40">
                        <defs>
                            <pattern id="striped-arrow" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                                <line x1="0" y1="0" x2="0" y2="10" style={{ stroke: 'white', strokeWidth: 5 }} />
                            </pattern>
                        </defs>
                        <path d="M0 15 H80 V8 L100 20 L80 32 V25 H0 Z" fill="url(#striped-arrow)" stroke="white" strokeWidth="1" />
                    </svg>
                    <div style={{ position: 'absolute', top: '45px', fontSize: '0.6rem', color: '#fff' }}>Push System</div>
                </div>
            );
            break;
        case VSMSymbols.FINISHED_GOODS:
            content = (
                <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                    <svg width="60" height="40" viewBox="0 0 60 40">
                        <rect x="5" y="5" width="50" height="30" fill="#00cc00" stroke="white" strokeWidth="2" />
                        <path d="M5 5 L20 0 L40 0 L55 5" fill="none" stroke="white" strokeWidth="2" />
                    </svg>
                    <div style={{ textAlign: 'center', color: '#00cc00', fontSize: '0.6rem', fontWeight: 'bold' }}>FINISHED<br />{data.amount || 0}</div>
                </div>
            );
            break;
        case VSMSymbols.TIMELINE:
            content = (
                <div style={{ width: '200px', padding: '10px', backgroundColor: '#252526', border: '1px solid #555', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '0.6rem', color: '#aaa' }}>Timeline Ladder</span>
                        <span style={{ fontSize: '0.6rem', color: '#00cc00', fontWeight: 'bold' }}>VA/NVA</span>
                    </div>
                    <svg width="180" height="40" viewBox="0 0 180 40">
                        <path d="M0 0 V30 H60 V10 H120 V30 H180 V0" fill="none" stroke="#ddd" strokeWidth="2" />
                        <text x="30" y="38" fontSize="10" fill="#00cc00" textAnchor="middle">VA</text>
                        <text x="90" y="8" fontSize="10" fill="#ff4444" textAnchor="middle">NVA</text>
                        <text x="150" y="38" fontSize="10" fill="#00cc00" textAnchor="middle">VA</text>
                    </svg>
                    <div style={{ fontSize: '0.6rem', color: '#fff', marginTop: '5px', textAlign: 'center' }}>
                        PLT: {data.leadTime || 0}d | VA: {data.vaTime || 0}s
                    </div>
                </div>
            );
            break;
        case VSMSymbols.ELECTRONIC_INFO:
            content = (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <svg width="100" height="30" viewBox="0 0 100 30">
                        <path d="M0 15 L30 5 L50 25 L70 5 L100 15" fill="none" stroke="#00ffff" strokeWidth="2" strokeDasharray="4 2" />
                        <polygon points="95,10 100,15 95,20" fill="#00ffff" />
                    </svg>
                    <div style={{ fontSize: '0.6rem', color: '#00ffff' }}>Electronic Flow</div>
                </div>
            );
            break;
        case VSMSymbols.MANUAL_INFO:
            content = (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <svg width="100" height="20" viewBox="0 0 100 20">
                        <line x1="0" y1="10" x2="100" y2="10" stroke="#fff" strokeWidth="2" />
                        <polygon points="95,5 100,10 95,15" fill="#fff" />
                    </svg>
                    <div style={{ fontSize: '0.6rem', color: '#fff' }}>Manual Flow</div>
                </div>
            );
            break;
        case VSMSymbols.WAREHOUSE_RECEIVING:
            content = (
                <div style={{ position: 'relative', width: '80px', height: '50px', border: '2px solid #4fc3f7', backgroundColor: '#1e1e1e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', top: '-10px', left: '10px', width: '20px', height: '10px', border: '2px solid #4fc3f7', borderBottom: 'none', backgroundColor: '#1e1e1e' }}></div>
                    <div style={{ fontSize: '0.6rem', color: '#4fc3f7', fontWeight: 'bold' }}>RECEIVING</div>
                    <div style={{ fontSize: '0.8rem', color: 'white' }}>{data.amount || 0}</div>
                </div>
            );
            break;
        case VSMSymbols.FORKLIFT:
            content = (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '2rem', transform: 'scaleX(-1)' }}>🚜</div>
                    <div style={{ fontSize: '0.6rem', color: '#ff9900' }}>FORKLIFT</div>
                </div>
            );
            break;
        case VSMSymbols.TROLLEY:
            content = (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontSize: '2rem', transform: 'scaleX(-1)' }}>🛒</div>
                    <div style={{ fontSize: '0.6rem', color: '#ff9900' }}>TROLLEY</div>
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
            {/* Top handles */}
            <Handle type="target" position={Position.Top} id="top" style={{ background: '#555' }} />
            <Handle type="source" position={Position.Top} id="top-source" style={{ background: '#555', left: '60%' }} />

            {/* Left handles */}
            <Handle type="target" position={Position.Left} id="left" style={{ background: '#555' }} />
            <Handle type="source" position={Position.Left} id="left-source" style={{ background: '#555', top: '60%' }} />

            {content}

            {/* Right handles */}
            <Handle type="source" position={Position.Right} id="right" style={{ background: '#555' }} />
            <Handle type="target" position={Position.Right} id="right-target" style={{ background: '#555', top: '60%' }} />

            {/* Bottom handles */}
            <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: '#555' }} />
            <Handle type="target" position={Position.Bottom} id="bottom-target" style={{ background: '#555', left: '60%' }} />
        </div>
    );
};

export default memo(GenericNode);
