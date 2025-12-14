import React, { useState, useRef, useEffect } from 'react';

const VSMSymbols = {
    // Process Flow
    PROCESS: 'process',
    SUPPLIER: 'supplier',
    CUSTOMER: 'customer',
    DATA_BOX: 'data_box',
    OPERATOR: 'operator',
    KAIZEN_BURST: 'kaizen_burst',

    // Material Flow
    INVENTORY: 'inventory',
    SUPERMARKET: 'supermarket',
    FIFO: 'fifo',
    SAFETY_STOCK: 'safety_stock',
    TRUCK: 'truck',
    PUSH_ARROW: 'push_arrow',

    // Information Flow
    ELECTRONIC_INFO: 'electronic_info',
    MANUAL_INFO: 'manual_info',
    KANBAN_POST: 'kanban_post',
    SIGNAL_KANBAN: 'signal_kanban',
    BUFFER: 'buffer',

    // Custom
    CUSTOM: 'custom',

    // Arrows
    ARROW_PUSH: 'arrow_push',
    ARROW_MANUAL: 'arrow_manual',
    ARROW_ELECTRONIC: 'arrow_electronic',
    ARROW_SHIPMENT: 'arrow_shipment',
    ARROW_KANBAN: 'arrow_kanban'
};

const PROCESS_TYPES = {
    NORMAL: 'normal',
    PACEMAKER: 'pacemaker',
    SHARED: 'shared',
    OUTSIDE: 'outside',
    PERIODIC: 'periodic'
};

const INITIAL_DATA = {

    process: { name: 'Process', ct: 0, co: 0, uptime: 100, shifts: 1, processType: 'normal' },
    inventory: { amount: 0, unit: 'pcs', time: 0 },
    supplier: { name: 'Supplier' },
    customer: { name: 'Customer' },
    kaizen_burst: { name: 'Problem/Idea' },
    custom: { name: 'Custom Item', description: '' }
};

function ValueStreamMap() {
    const [nodes, setNodes] = useState([]);
    const [connections, setConnections] = useState([]);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [draggedNode, setDraggedNode] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [resizing, setResizing] = useState(false);
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });

    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [customLibrary, setCustomLibrary] = useState([]);
    const canvasRef = useRef(null);

    const fileInputRef = useRef(null);

    // Derived state
    const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

    // Timeline Calculation
    const [totalCycleTime, setTotalCycleTime] = useState(0);
    const [totalLeadTime, setTotalLeadTime] = useState(0);

    useEffect(() => {
        let ct = 0;
        let lt = 0;
        nodes.forEach(node => {
            if (node.type === VSMSymbols.PROCESS) {
                ct += Number(node.data.ct || 0);
            }
            if (node.type === VSMSymbols.INVENTORY) {
                lt += Number(node.data.time || 0);
            }
        });
        setTotalCycleTime(ct);
        setTotalLeadTime(lt + ct);
    }, [nodes]);

    // Load Custom Library from Local Storage
    useEffect(() => {
        const savedLibrary = localStorage.getItem('vsm_custom_icons');
        if (savedLibrary) {
            try {
                setCustomLibrary(JSON.parse(savedLibrary));
            } catch (e) {
                console.error("Failed to load custom icons", e);
            }
        }
    }, []);

    // Save Custom Library to Local Storage
    useEffect(() => {
        localStorage.setItem('vsm_custom_icons', JSON.stringify(customLibrary));
    }, [customLibrary]);

    const addNode = (type, x = 100, y = 100, extraData = {}) => {
        const id = Date.now().toString();
        const baseData = INITIAL_DATA[type] || { name: type.replace('_', ' ').toUpperCase() };
        const newNode = {
            id,
            type,
            x,
            y,
            data: { ...baseData, ...extraData },
            width: type === VSMSymbols.PROCESS ? 120 : (type.startsWith('arrow_') ? 100 : 80),
            height: type === VSMSymbols.PROCESS ? 80 : (type.startsWith('arrow_') ? 40 : 60)
        };
        setNodes(prev => [...prev, newNode]);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const newIcon = {
                    id: Date.now().toString(),
                    url: event.target.result,
                    name: file.name
                };
                setCustomLibrary(prev => [...prev, newIcon]);
            };
            reader.readAsDataURL(file);
        }
    };

    const deleteCustomIcon = (e, id) => {
        e.stopPropagation();
        setCustomLibrary(prev => prev.filter(icon => icon.id !== id));
    };

    const handleMouseDown = (e, node) => {
        e.stopPropagation();

        setSelectedNodeId(node.id);
        setDraggedNode(node.id);
        setDragging(true);
        setOffset({
            x: e.clientX - node.x,
            y: e.clientY - node.y
        });
    };

    const handleResizeStart = (e, node) => {
        e.stopPropagation();
        setResizing(true);
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            w: node.width,
            h: node.height
        });
        // Set selected node if not already (though handle usually implies selection)
        setSelectedNodeId(node.id);
        // Important: Stop dragging from starting
        setDragging(false);
    };

    const handleMouseMove = (e) => {
        if (resizing && selectedNodeId) {
            const dx = e.clientX - resizeStart.x;
            const dy = e.clientY - resizeStart.y;
            // Minimum size constraints
            const newWidth = Math.max(40, resizeStart.w + dx);
            const newHeight = Math.max(20, resizeStart.h + dy);

            setNodes(prev => prev.map(n => {
                if (n.id === selectedNodeId) {
                    return { ...n, width: newWidth, height: newHeight };
                }
                return n;
            }));
            return; // Skip dragging logic
        }

        if (dragging && draggedNode) {
            setNodes(prev => prev.map(n => {
                if (n.id === draggedNode) {
                    return {
                        ...n,
                        x: e.clientX - offset.x,
                        y: e.clientY - offset.y
                    };
                }
                return n;
            }));
        }
    };

    const handleMouseUp = () => {
        setDragging(false);
        setResizing(false);
        setDraggedNode(null);
    };

    const updateNodeData = (id, field, value) => {
        setNodes(prev => prev.map(n => {
            if (n.id === id) {
                return { ...n, data: { ...n.data, [field]: value } };
            }
            return n;
        }));
    };

    const deleteNode = (id) => {
        setNodes(prev => prev.filter(n => n.id !== id));
        setSelectedNodeId(null);
    };

    // Render Helpers
    const renderSymbol = (node) => {
        const style = {
            position: 'absolute',
            left: node.x,
            top: node.y,
            width: node.width,
            height: node.height,
            cursor: 'move',
            border: selectedNodeId === node.id ? '2px solid #0078d4' : 'none',
            zIndex: 10
        };

        const resizeHandleStyle = {
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: '10px',
            height: '10px',
            backgroundColor: '#0078d4',
            cursor: 'se-resize',
            zIndex: 11
        };

        const renderHandle = () => {
            if (selectedNodeId === node.id) {
                return <div style={resizeHandleStyle} onMouseDown={(e) => handleResizeStart(e, node)} />;
            }
            return null;
        };

        const commonBoxStyle = {
            border: '2px solid white',
            backgroundColor: '#1e1e1e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            textAlign: 'center',
            fontSize: '0.8rem'
        };

        switch (node.type) {
            case VSMSymbols.PROCESS:
                let borderStyle = '2px solid white';
                let bgStyle = '#1e1e1e';
                let labelExtra = null;

                if (node.data.processType === PROCESS_TYPES.PACEMAKER) {
                    borderStyle = '4px double #ff9900';
                    labelExtra = <div style={{ position: 'absolute', top: '-15px', color: '#ff9900', fontSize: '0.6rem', fontWeight: 'bold' }}>PACEMAKER</div>;
                } else if (node.data.processType === PROCESS_TYPES.SHARED) {
                    borderStyle = '2px dashed #00ffff';
                    labelExtra = <div style={{ position: 'absolute', top: '-15px', color: '#00ffff', fontSize: '0.6rem' }}>SHARED</div>;
                } else if (node.data.processType === PROCESS_TYPES.OUTSIDE) {
                    borderStyle = '2px dotted #aaa';
                    labelExtra = <div style={{ position: 'absolute', top: '-15px', color: '#aaa', fontSize: '0.6rem' }}>OUTSIDE</div>;
                }

                return (
                    <div style={style} onMouseDown={(e) => handleMouseDown(e, node)}>
                        {labelExtra}
                        <div style={{ ...commonBoxStyle, width: '100%', height: '100%', border: borderStyle, backgroundColor: bgStyle }}>
                            {node.data.name}
                        </div>
                        <div style={{ width: '120px', border: '1px solid #666', marginTop: '-1px', backgroundColor: '#252526', fontSize: '0.7rem', padding: '2px', position: 'absolute', top: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>C/T:</span><span>{node.data.ct}s</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>C/O:</span><span>{node.data.co}m</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Uptime:</span><span>{node.data.uptime}%</span></div>
                        </div>
                        {renderHandle()}
                    </div>
                );
            case VSMSymbols.INVENTORY:
                return (
                    <div style={{ ...style, border: 'none' }} onMouseDown={(e) => handleMouseDown(e, node)}>
                        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <polygon points="0,0 100,0 50,100" fill="#ff9900" />
                            </svg>
                            <span style={{ position: 'absolute', top: '20%', color: 'white', whiteSpace: 'nowrap', fontSize: '0.8rem', zIndex: 1 }}>I</span>
                        </div>
                        <div style={{ width: '100%', textAlign: 'center', color: '#ff9900', fontSize: '0.7rem', marginTop: '5px' }}>
                            {node.data.amount} {node.data.unit}
                        </div>
                        {renderHandle()}
                    </div>
                );
            case VSMSymbols.SUPPLIER:
            case VSMSymbols.CUSTOMER:
                return (
                    <div style={style} onMouseDown={(e) => handleMouseDown(e, node)}>
                        <div style={{ width: '80px', height: '60px', border: '2px solid white', backgroundColor: '#1e1e1e', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '-10px', left: '20px', width: '40px', height: '20px', border: '2px solid white', borderBottom: 'none', backgroundColor: '#1e1e1e' }}></div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>{node.data.name}</div>
                        </div>
                    </div>
                );
            case VSMSymbols.TRUCK:
                return (
                    <div style={style} onMouseDown={(e) => handleMouseDown(e, node)}>
                        <div style={{ fontSize: '2.5rem' }}>🚚</div>
                    </div>
                );
            case VSMSymbols.KAIZEN_BURST:
                return (
                    <div style={style} onMouseDown={(e) => handleMouseDown(e, node)}>
                        <div style={{
                            width: '90px', height: '70px',
                            background: 'url(\'data:image/svg+xml;utf8,<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 0 L60 20 L80 10 L85 30 L100 40 L85 60 L95 80 L70 85 L60 100 L40 85 L20 95 L15 70 L0 60 L20 40 L10 20 L30 15 Z" fill="%23ffeb3b" stroke="red" stroke-width="2"/></svg>\') no-repeat center/contain',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                            color: 'black', fontWeight: 'bold', fontSize: '0.7rem', padding: '10px'
                        }}>
                            {node.data.name}
                        </div>
                    </div>
                );
            case VSMSymbols.SUPERMARKET:
                return (
                    <div style={style} onMouseDown={(e) => handleMouseDown(e, node)}>
                        <div style={{ width: '60px', height: '40px', border: '2px solid lime', borderLeft: 'none', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '10px', height: '100%', borderRight: '2px solid lime' }}></div>
                            <div style={{ position: 'absolute', top: 0, left: '20px', width: '10px', height: '100%', borderRight: '2px solid lime' }}></div>
                            <div style={{ position: 'absolute', top: '10px', left: 0, width: '100%', height: '2px', backgroundColor: 'lime' }}></div>
                            <div style={{ position: 'absolute', top: '25px', left: 0, width: '100%', height: '2px', backgroundColor: 'lime' }}></div>
                        </div>
                    </div>
                );
            case VSMSymbols.FIFO:
                return (
                    <div style={style} onMouseDown={(e) => handleMouseDown(e, node)}>
                        <div style={{ width: '80px', height: '30px', borderBottom: '2px solid white', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: '100%', borderTop: '2px solid white', position: 'absolute', top: 0 }}></div>
                            <span style={{ fontSize: '0.8rem' }}>FIFO</span>
                            <div style={{ position: 'absolute', right: 0, bottom: '-5px', width: '10px', height: '10px', borderRight: '2px solid white', borderBottom: '2px solid white', transform: 'rotate(-45deg)' }}></div>
                        </div>
                    </div>
                );
            case VSMSymbols.SAFETY_STOCK:
                return (
                    <div style={style} onMouseDown={(e) => handleMouseDown(e, node)}>
                        <div style={{ width: '0', height: '0', borderLeft: '20px solid transparent', borderRight: '20px solid transparent', borderBottom: '35px solid #fff', position: 'relative', display: 'flex', justifyContent: 'center' }}>
                            <div style={{ position: 'absolute', top: '15px', width: '0', height: '0', borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderBottom: '15px solid #1e1e1e' }}></div>
                        </div>
                    </div>
                );
            case VSMSymbols.OPERATOR:
                return (
                    <div style={style} onMouseDown={(e) => handleMouseDown(e, node)}>
                        <div style={{ fontSize: '2rem' }}>👤</div>
                    </div>
                );
            case VSMSymbols.ELECTRONIC_INFO:
                return (
                    <div style={style} onMouseDown={(e) => handleMouseDown(e, node)}>
                        <div style={{ width: '80px', height: '2px', backgroundColor: 'white', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '-5px', left: '20px', width: '10px', height: '10px', borderRadius: '50%', border: '2px solid white', backgroundColor: '#1e1e1e' }}></div>
                            <div style={{ position: 'absolute', right: 0, top: '-3px', width: '6px', height: '6px', borderRight: '2px solid white', borderBottom: '2px solid white', transform: 'rotate(-45deg)' }}></div>
                        </div>
                    </div>
                );
            case VSMSymbols.KANBAN_POST:
                return (
                    <div style={style} onMouseDown={(e) => handleMouseDown(e, node)}>
                        <div style={{ width: '10px', height: '40px', backgroundColor: 'white', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '5px', left: '10px', width: '20px', height: '15px', border: '1px solid white', backgroundColor: '#1e1e1e' }}></div>
                        </div>
                    </div>
                );

            case VSMSymbols.ARROW_PUSH:
                const apW = node.width || 100;
                const apH = node.height || 40;
                const apMidY = apH / 2;
                return (
                    <div style={style} onMouseDown={(e) => handleMouseDown(e, node)}>
                        <svg width={apW} height={apH} style={{ overflow: 'visible' }}>
                            <line x1="0" y1={apMidY} x2={apW - 20} y2={apMidY} stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                            <polygon points={`${apW - 20},${apMidY - 10} ${apW},${apMidY} ${apW - 20},${apMidY + 10}`} fill="white" />
                            <rect x={apW / 2 - 10} y={apMidY - 15} width="20" height="15" fill="none" stroke="white" strokeWidth="1" />
                            <polygon points={`${apW / 2 - 10},${apMidY} ${apW / 2},${apMidY - 15} ${apW / 2 + 10},${apMidY}`} fill="#333" stroke="white" strokeWidth="1" />
                        </svg>
                        {renderHandle()}
                    </div>
                );
            case VSMSymbols.ARROW_MANUAL:
                const amW = node.width || 100;
                const amH = node.height || 20;
                const amMidY = amH / 2;
                return (
                    <div style={style} onMouseDown={(e) => handleMouseDown(e, node)}>
                        <svg width={amW} height={amH} style={{ overflow: 'visible' }}>
                            <line x1="0" y1={amMidY} x2={amW - 10} y2={amMidY} stroke="white" strokeWidth="2" />
                            <polygon points={`${amW - 10},${amMidY - 5} ${amW},${amMidY} ${amW - 10},${amMidY + 5}`} fill="white" />
                        </svg>
                        {renderHandle()}
                    </div>
                );
            case VSMSymbols.ARROW_ELECTRONIC:
                const aeW = node.width || 100;
                const aeH = node.height || 30;
                const aeMidY = aeH / 2;
                return (
                    <div style={style} onMouseDown={(e) => handleMouseDown(e, node)}>
                        <svg width={aeW} height={aeH} preserveAspectRatio="none" viewBox={`0 0 100 ${aeH}`}>
                            <polyline points={`0,${aeMidY} 20,${aeMidY} 30,${aeMidY - 10} 40,${aeMidY + 10} 50,${aeMidY - 10} 60,${aeMidY + 10} 70,${aeMidY - 10} 80,${aeMidY} 90,${aeMidY}`} fill="none" stroke="white" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                            <polygon points={`90,${aeMidY - 5} 100,${aeMidY} 90,${aeMidY + 5}`} fill="white" />
                        </svg>
                        {renderHandle()}
                    </div>
                );
            case VSMSymbols.ARROW_SHIPMENT:
                const asW = node.width || 100;
                const asH = node.height || 40;
                const asMidY = asH / 2;
                const headLen = 30;
                const shaftW = asW - headLen;
                const halfShaftH = 10;
                const halfHeadH = 15;
                const pathD = `M0,${asMidY - halfShaftH} L${shaftW},${asMidY - halfShaftH} L${shaftW},${asMidY - halfHeadH} L${asW},${asMidY} L${shaftW},${asMidY + halfHeadH} L${shaftW},${asMidY + halfShaftH} L0,${asMidY + halfShaftH} Z`;

                return (
                    <div style={style} onMouseDown={(e) => handleMouseDown(e, node)}>
                        <svg width={asW} height={asH} style={{ overflow: 'visible' }}>
                            <path d={pathD} fill="white" stroke="white" strokeWidth="1" fillOpacity="0.8" />
                        </svg>
                        {renderHandle()}
                    </div>
                );
            case VSMSymbols.ARROW_KANBAN:
                const akW = node.width || 100;
                const akH = node.height || 40;
                const akMidY = akH / 2;
                return (
                    <div style={style} onMouseDown={(e) => handleMouseDown(e, node)}>
                        <svg width={akW} height={akH} style={{ overflow: 'visible' }}>
                            <line x1="0" y1={akMidY} x2={akW - 10} y2={akMidY} stroke="#0078d4" strokeWidth="2" strokeDasharray="4,2" />
                            <polygon points={`${akW - 10},${akMidY - 5} ${akW},${akMidY} ${akW - 10},${akMidY + 5}`} fill="#0078d4" />
                        </svg>
                        {renderHandle()}
                    </div>
                );
            case VSMSymbols.CUSTOM:
                return (
                    <div style={style} onMouseDown={(e) => handleMouseDown(e, node)}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <img src={node.data.imageUrl} alt="Custom" style={{ maxWidth: '80px', maxHeight: '80px', objectFit: 'contain' }} />
                            {node.data.description && (
                                <div style={{ fontSize: '0.7rem', backgroundColor: '#333', padding: '2px 4px', borderRadius: '4px', marginTop: '2px', maxWidth: '100px', textAlign: 'center' }}>
                                    {node.data.description}
                                </div>
                            )}
                        </div>
                    </div>
                );
            default:
                return (
                    <div style={style} onMouseDown={(e) => handleMouseDown(e, node)}>
                        <div style={commonBoxStyle}>{node.type}</div>
                    </div>
                );
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#1e1e1e', color: 'white' }} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} ref={canvasRef}>
            {/* Sidebar Toolbar */}
            <div style={{ width: '220px', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column', backgroundColor: '#252526', overflowY: 'auto' }}>
                <div style={{ padding: '15px', borderBottom: '1px solid #333', fontWeight: 'bold', fontSize: '1.2rem' }}>VSM Toolbox</div>

                {/* Process Section */}
                <div style={{ padding: '10px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px', textTransform: 'uppercase' }}>Process</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button title="Process Box" onClick={() => addNode(VSMSymbols.PROCESS)} style={blockBtnStyle}>Process</button>
                        <button title="Supplier/Customer" onClick={() => addNode(VSMSymbols.SUPPLIER)} style={blockBtnStyle}>Factory</button>
                        <button title="Operator" onClick={() => addNode(VSMSymbols.OPERATOR)} style={blockBtnStyle}>Operator</button>
                        <button title="Kaizen Burst" onClick={() => addNode(VSMSymbols.KAIZEN_BURST)} style={blockBtnStyle}>Kaizen</button>
                    </div>
                </div>

                {/* Material Section */}
                <div style={{ padding: '10px', borderTop: '1px solid #333' }}>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px', textTransform: 'uppercase' }}>Material</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button title="Inventory" onClick={() => addNode(VSMSymbols.INVENTORY)} style={blockBtnStyle}>Inventory</button>
                        <button title="Supermarket" onClick={() => addNode(VSMSymbols.SUPERMARKET)} style={blockBtnStyle}>Supermkt</button>
                        <button title="FIFO Lane" onClick={() => addNode(VSMSymbols.FIFO)} style={blockBtnStyle}>FIFO</button>
                        <button title="Safety Stock" onClick={() => addNode(VSMSymbols.SAFETY_STOCK)} style={blockBtnStyle}>Safe Stk</button>
                        <button title="Truck Shipment" onClick={() => addNode(VSMSymbols.TRUCK)} style={blockBtnStyle}>Truck</button>
                    </div>
                </div>

                {/* Information Section */}
                <div style={{ padding: '10px', borderTop: '1px solid #333' }}>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px', textTransform: 'uppercase' }}>Information</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button title="Electronic Info" onClick={() => addNode(VSMSymbols.ELECTRONIC_INFO)} style={blockBtnStyle}>E-Info</button>
                        <button title="Kanban Post" onClick={() => addNode(VSMSymbols.KANBAN_POST)} style={blockBtnStyle}>Post</button>
                    </div>
                </div>

                {/* Arrows Section */}
                <div style={{ padding: '10px', borderTop: '1px solid #333' }}>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px', textTransform: 'uppercase' }}>Arrows</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button title="Push Arrow" onClick={() => addNode(VSMSymbols.ARROW_PUSH)} style={blockBtnStyle}>Push</button>
                        <button title="Manual Info" onClick={() => addNode(VSMSymbols.ARROW_MANUAL)} style={blockBtnStyle}>Manual</button>
                        <button title="Electronic Info" onClick={() => addNode(VSMSymbols.ARROW_ELECTRONIC)} style={blockBtnStyle}>Electronic</button>
                        <button title="Shipment" onClick={() => addNode(VSMSymbols.ARROW_SHIPMENT)} style={blockBtnStyle}>Shipment</button>
                        <button title="Kanban Signal" onClick={() => addNode(VSMSymbols.ARROW_KANBAN)} style={blockBtnStyle}>Kanban</button>
                    </div>
                </div>

                {/* Custom Section */}
                <div style={{ padding: '10px', borderTop: '1px solid #333' }}>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '10px', textTransform: 'uppercase' }}>Custom Toolbox</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                        <button onClick={() => fileInputRef.current.click()} style={{ ...blockBtnStyle, backgroundColor: '#0078d4', borderColor: '#0078d4', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                            <span>📤</span> Upload Icon
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept="image/*" />
                    </div>

                    {customLibrary.length > 0 && (
                        <div style={{ marginTop: '15px' }}>
                            <div style={{ fontSize: '0.7rem', color: '#aaa', marginBottom: '5px' }}>My Icons</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                                {customLibrary.map(icon => (
                                    <div key={icon.id} onClick={() => addNode(VSMSymbols.CUSTOM, 100, 100, { imageUrl: icon.url, name: icon.name })} style={{ cursor: 'pointer', border: '1px solid #444', padding: '5px', borderRadius: '4px', textAlign: 'center', backgroundColor: '#2d2d2d', position: 'relative' }}>
                                        <div
                                            onClick={(e) => deleteCustomIcon(e, icon.id)}
                                            style={{
                                                position: 'absolute', top: '-5px', right: '-5px', width: '16px', height: '16px',
                                                backgroundColor: '#ff4444', color: 'white', borderRadius: '50%',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '12px', fontWeight: 'bold', lineHeight: 1,
                                                zIndex: 5, border: '1px solid #252526'
                                            }}
                                            title="Delete Icon"
                                        >
                                            ×
                                        </div>
                                        <img src={icon.url} alt={icon.name} style={{ width: '100%', height: '40px', objectFit: 'contain' }} />
                                        <div style={{ fontSize: '0.6rem', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{icon.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Canvas */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                <div style={{ position: 'absolute', top: 10, left: 10, opacity: 0.5 }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Value Stream Map</h1>
                </div>

                {nodes.map(node => (
                    <React.Fragment key={node.id}>
                        {renderSymbol(node)}
                    </React.Fragment>
                ))}

                {/* Timeline Visualization */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100px', backgroundColor: '#2d2d2d', borderTop: '1px solid #666', display: 'flex', alignItems: 'center', padding: '0 20px', zIndex: 100 }}>
                    <div style={{ display: 'flex', gap: '30px' }}>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: '#888' }}>Total Cycle Time (VA)</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{totalCycleTime}s</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: '#888' }}>Total Lead Time</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ff9900' }}>{totalLeadTime}s</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Properties Panel */}
            {selectedNode && (
                <div style={{ width: '280px', borderLeft: '1px solid #333', backgroundColor: '#252526', padding: '20px', overflowY: 'auto' }}>
                    <h3>Properties</h3>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Name/Label</label>
                        <input
                            type="text"
                            value={selectedNode.data.name || ''}
                            onChange={(e) => updateNodeData(selectedNode.id, 'name', e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    {selectedNode.type === VSMSymbols.PROCESS && (
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Process Type</label>
                            <select
                                value={selectedNode.data.processType || PROCESS_TYPES.NORMAL}
                                onChange={(e) => updateNodeData(selectedNode.id, 'processType', e.target.value)}
                                style={inputStyle}
                            >
                                <option value={PROCESS_TYPES.NORMAL}>Normal</option>
                                <option value={PROCESS_TYPES.PACEMAKER}>Pacemaker (Scheduling Point)</option>
                                <option value={PROCESS_TYPES.SHARED}>Shared Resource</option>
                                <option value={PROCESS_TYPES.OUTSIDE}>Outside Process</option>
                                <option value={PROCESS_TYPES.PERIODIC}>Periodic Process</option>
                            </select>
                        </div>
                    )}

                    {selectedNode.type === VSMSymbols.PROCESS && (
                        <>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Cycle Time (sec)</label>
                                <input
                                    type="number"
                                    value={selectedNode.data.ct || 0}
                                    onChange={(e) => updateNodeData(selectedNode.id, 'ct', e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Changeover (min)</label>
                                <input
                                    type="number"
                                    value={selectedNode.data.co || 0}
                                    onChange={(e) => updateNodeData(selectedNode.id, 'co', e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Uptime (%)</label>
                                <input
                                    type="number"
                                    value={selectedNode.data.uptime || 0}
                                    onChange={(e) => updateNodeData(selectedNode.id, 'uptime', e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                        </>
                    )}

                    {selectedNode.type === VSMSymbols.INVENTORY && (
                        <>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Amount</label>
                                <input
                                    type="number"
                                    value={selectedNode.data.amount || 0}
                                    onChange={(e) => updateNodeData(selectedNode.id, 'amount', e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Time Equivalent (sec)</label>
                                <input
                                    type="number"
                                    value={selectedNode.data.time || 0}
                                    onChange={(e) => updateNodeData(selectedNode.id, 'time', e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                        </>
                    )}

                    {selectedNode.type === VSMSymbols.CUSTOM && (
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Description</label>
                            <textarea
                                value={selectedNode.data.description || ''}
                                onChange={(e) => updateNodeData(selectedNode.id, 'description', e.target.value)}
                                style={{ ...inputStyle, minHeight: '60px' }}
                            />
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button
                            onClick={() => deleteNode(selectedNode.id)}
                            style={{ ...blockBtnStyle, backgroundColor: '#c50f1f', borderColor: '#c50f1f' }}
                        >
                            Delete
                        </button>
                        <button
                            onClick={() => setSelectedNodeId(null)}
                            style={blockBtnStyle}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const blockBtnStyle = {
    padding: '8px',
    backgroundColor: '#333',
    color: 'white',
    border: '1px solid #555',
    borderRadius: '4px',
    cursor: 'pointer',
    textAlign: 'center',
    fontSize: '0.8rem'
};

const inputStyle = {
    width: '100%',
    padding: '8px',
    backgroundColor: '#333',
    border: '1px solid #555',
    color: 'white',
    borderRadius: '4px'
};

export default ValueStreamMap;
