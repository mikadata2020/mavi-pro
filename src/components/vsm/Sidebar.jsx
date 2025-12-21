import React, { useRef } from 'react';
import { VSMSymbols } from './vsm-constants';

const Sidebar = ({ customLibrary, onAddCustom, activeEdgeType, onEdgeTypeSelect }) => {
    const fileInputRef = useRef(null);

    const onDragStart = (event, nodeType, symbolType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/vsmsymbol', symbolType);
        event.dataTransfer.effectAllowed = 'move';
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                onAddCustom({
                    id: Date.now().toString(),
                    url: event.target.result,
                    name: file.name
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const blockBtnStyle = {
        padding: '8px',
        backgroundColor: '#333',
        color: 'white',
        border: '1px solid #555',
        borderRadius: '4px',
        cursor: 'grab',
        textAlign: 'center',
        fontSize: '0.7rem',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '40px'
    };

    const sectionTitleStyle = {
        fontSize: '0.8rem',
        color: '#ccc',
        marginBottom: '10px',
        textTransform: 'uppercase',
        marginTop: '20px',
        fontWeight: 'bold',
        borderBottom: '1px solid #444',
        paddingBottom: '5px'
    };

    return (
        <div style={{ width: '240px', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column', backgroundColor: '#252526', overflowY: 'auto', height: '100%' }}>
            <div style={{ padding: '15px', borderBottom: '1px solid #333', fontWeight: 'bold', fontSize: '1.2rem', color: 'white' }}>VSM Toolbox</div>

            <div style={{ padding: '15px' }}>

                {/* FLOW CONNECTIONS (LINES) */}
                <div style={{ ...sectionTitleStyle, marginTop: 0 }}>Flow Connections</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '15px' }}>
                    <button
                        onClick={() => onEdgeTypeSelect('material')}
                        draggable
                        onDragStart={(event) => {
                            event.dataTransfer.setData('application/reactflow', 'edgeMode');
                            event.dataTransfer.setData('application/vsmEdgeType', 'material');
                            event.dataTransfer.effectAllowed = 'move';
                        }}
                        style={{
                            ...blockBtnStyle,
                            cursor: 'grab',
                            backgroundColor: activeEdgeType === 'material' ? '#0078d4' : '#333',
                            border: activeEdgeType === 'material' ? '1px solid #fff' : '1px solid #555'
                        }}
                    >
                        ━━ Material
                    </button>
                    <button
                        onClick={() => onEdgeTypeSelect('information')}
                        draggable
                        onDragStart={(event) => {
                            event.dataTransfer.setData('application/reactflow', 'edgeMode');
                            event.dataTransfer.setData('application/vsmEdgeType', 'information');
                            event.dataTransfer.effectAllowed = 'move';
                        }}
                        style={{
                            ...blockBtnStyle,
                            cursor: 'grab',
                            backgroundColor: activeEdgeType === 'information' ? '#0078d4' : '#333',
                            border: activeEdgeType === 'information' ? '1px solid #fff' : '1px solid #555'
                        }}
                    >
                        --- Manual Info
                    </button>
                    <button
                        onClick={() => onEdgeTypeSelect('electronic')}
                        draggable
                        onDragStart={(event) => {
                            event.dataTransfer.setData('application/reactflow', 'edgeMode');
                            event.dataTransfer.setData('application/vsmEdgeType', 'electronic');
                            event.dataTransfer.effectAllowed = 'move';
                        }}
                        style={{
                            ...blockBtnStyle,
                            cursor: 'grab',
                            backgroundColor: activeEdgeType === 'electronic' ? '#0078d4' : '#333',
                            border: activeEdgeType === 'electronic' ? '1px solid #fff' : '1px solid #555',
                            gridColumn: 'span 2'
                        }}
                    >
                        ⚡ Electronic Info
                    </button>
                </div>
                {/* PROCESS SECTION */}
                <div style={sectionTitleStyle}>Process Data</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={blockBtnStyle} onDragStart={(event) => onDragStart(event, 'process', VSMSymbols.PROCESS)} draggable>
                        🏭 Process Box
                    </div>
                    <div style={blockBtnStyle} onDragStart={(event) => onDragStart(event, 'generic', VSMSymbols.OPERATOR)} draggable>
                        👤 Operator
                    </div>
                    <div style={blockBtnStyle} onDragStart={(event) => onDragStart(event, 'generic', VSMSymbols.KAIZEN_BURST)} draggable>
                        💥 Kaizen Burst
                    </div>
                </div>

                {/* MATERIAL FLOW */}
                <div style={sectionTitleStyle}>Material Flow</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={blockBtnStyle} onDragStart={(event) => onDragStart(event, 'generic', VSMSymbols.SUPPLIER)} draggable>
                        🏭 Supplier
                    </div>
                    <div style={blockBtnStyle} onDragStart={(event) => onDragStart(event, 'generic', VSMSymbols.CUSTOMER)} draggable>
                        🏢 Customer
                    </div>
                    <div style={blockBtnStyle} onDragStart={(event) => onDragStart(event, 'inventory', VSMSymbols.INVENTORY)} draggable>
                        ⚠️ Inventory
                    </div>
                    <div style={blockBtnStyle} onDragStart={(event) => onDragStart(event, 'generic', VSMSymbols.SUPERMARKET)} draggable>
                        🛒 Supermarket
                    </div>
                    <div style={blockBtnStyle} onDragStart={(event) => onDragStart(event, 'generic', VSMSymbols.FIFO)} draggable>
                        🔄 FIFO
                    </div>
                    <div style={blockBtnStyle} onDragStart={(event) => onDragStart(event, 'generic', VSMSymbols.SAFETY_STOCK)} draggable>
                        🛡️ Safety Stock
                    </div>
                    <div style={blockBtnStyle} onDragStart={(event) => onDragStart(event, 'generic', VSMSymbols.TRUCK)} draggable>
                        🚚 Truck
                    </div>
                    <div style={blockBtnStyle} onDragStart={(event) => onDragStart(event, 'generic', VSMSymbols.RAW_MATERIAL)} draggable>
                        📦 Raw Mat.
                    </div>
                    <div style={blockBtnStyle} onDragStart={(event) => onDragStart(event, 'generic', VSMSymbols.FINISHED_GOODS)} draggable>
                        ✅ Finished
                    </div>
                    <div style={blockBtnStyle} onDragStart={(event) => onDragStart(event, 'generic', VSMSymbols.PUSH_ARROW)} draggable>
                        ➡️ Push
                    </div>
                </div>

                {/* INFORMATION FLOW */}
                <div style={sectionTitleStyle}>Information Flow</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ ...blockBtnStyle, gridColumn: 'span 2' }} onDragStart={(event) => onDragStart(event, 'productionControl', VSMSymbols.PRODUCTION_CONTROL)} draggable>
                        🏢 Production Control
                    </div>
                    <div style={blockBtnStyle} onDragStart={(event) => onDragStart(event, 'generic', VSMSymbols.HEIJUNKA_BOX)} draggable>
                        📊 Heijunka
                    </div>
                    <div style={blockBtnStyle} onDragStart={(event) => onDragStart(event, 'generic', VSMSymbols.KANBAN_POST)} draggable>
                        📮 Kanban Post
                    </div>
                    <div style={blockBtnStyle} onDragStart={(event) => onDragStart(event, 'generic', VSMSymbols.KANBAN_PRODUCTION)} draggable>
                        🟩 Prod. Kanban
                    </div>
                    <div style={blockBtnStyle} onDragStart={(event) => onDragStart(event, 'generic', VSMSymbols.KANBAN_WITHDRAWAL)} draggable>
                        🟧 W-Draw Kanban
                    </div>
                    <div style={blockBtnStyle} onDragStart={(event) => onDragStart(event, 'generic', VSMSymbols.SIGNAL_KANBAN)} draggable>
                        🔺 Signal Kanban
                    </div>
                    <div style={blockBtnStyle} onDragStart={(event) => onDragStart(event, 'generic', VSMSymbols.EYE_OBSERVATION)} draggable>
                        👁️ Go See
                    </div>
                    <div style={blockBtnStyle} onDragStart={(event) => onDragStart(event, 'generic', VSMSymbols.ELECTRONIC_INFO)} draggable>
                        ⚡ Electronic Info
                    </div>
                    <div style={blockBtnStyle} onDragStart={(event) => onDragStart(event, 'generic', VSMSymbols.MANUAL_INFO)} draggable>
                        📄 Manual Info
                    </div>
                    <div style={blockBtnStyle} onDragStart={(event) => onDragStart(event, 'generic', VSMSymbols.BUFFER)} draggable>
                        🛡️ Buffer
                    </div>
                </div>

                {/* TIMELINE & ANALYSIS */}
                <div style={sectionTitleStyle}>Timeline & Metrics</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                    <div style={{ ...blockBtnStyle, gridColumn: 'span 1' }} onDragStart={(event) => onDragStart(event, 'generic', VSMSymbols.TIMELINE)} draggable>
                        ⏱️ Timeline
                    </div>
                </div>

                {/* GENERAL & NOTES */}
                <div style={sectionTitleStyle}>General / Notes</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                    <div style={{ ...blockBtnStyle, backgroundColor: '#ffff88', color: '#000', border: '1px solid #e0e040' }} onDragStart={(event) => onDragStart(event, 'text_note', VSMSymbols.TEXT_NOTE)} draggable>
                        📝 Sticky Note / Text
                    </div>
                </div>

                {/* CUSTOM SECTION */}
                <div style={sectionTitleStyle}>Custom (My Icons)</div>
                <button onClick={() => fileInputRef.current.click()} style={{ ...blockBtnStyle, cursor: 'pointer', backgroundColor: '#0078d4', borderColor: '#0078d4', width: '100%', gap: '5px' }}>
                    <span>📤</span> Upload Icon
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept="image/*" />

                {customLibrary && customLibrary.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                        {customLibrary.map(icon => (
                            <div
                                key={icon.id}
                                onDragStart={(event) => {
                                    event.dataTransfer.setData('application/reactflow', 'generic');
                                    event.dataTransfer.setData('application/vsmsymbol', VSMSymbols.CUSTOM);
                                    event.dataTransfer.setData('application/customdata', JSON.stringify({ imageUrl: icon.url, description: icon.name }));
                                    event.dataTransfer.effectAllowed = 'move';
                                }}
                                draggable
                                style={{ cursor: 'grab', border: '1px solid #444', padding: '5px', borderRadius: '4px', textAlign: 'center', backgroundColor: '#2d2d2d', height: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <img src={icon.url} alt={icon.name} style={{ maxWidth: '100%', maxHeight: '40px', objectFit: 'contain' }} />
                                <div style={{ fontSize: '0.6rem', color: '#aaa', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{icon.name}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ padding: '15px', color: '#888', fontSize: '0.7rem', borderTop: '1px solid #333', marginTop: 'auto' }}>
                Drag & Drop symbols. Connect nodes. <br />Use scroll wheel to zoom.
            </div>
        </div>
    );
};

export default Sidebar;
