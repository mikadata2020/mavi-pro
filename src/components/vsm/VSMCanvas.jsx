import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import ReactFlow, {
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    MiniMap,
    MarkerType,
    useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import html2canvas from 'html2canvas';

import { INITIAL_DATA, PROCESS_TYPES, VSMSymbols } from './vsm-constants';
import ProcessNode from './nodes/ProcessNode';
import InventoryNode from './nodes/InventoryNode';
import ProductionControlNode from './nodes/ProductionControlNode';
import GenericNode from './nodes/GenericNode';
import Sidebar from './Sidebar';
import AIVSMGeneratorModal from './AIVSMGeneratorModal';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { analyzeVSM, getStoredApiKey, generateVSMFromPrompt } from '../../utils/aiGenerator';
import ReactMarkdown from 'react-markdown';
import { Brain, Sparkles, X, Wand2, HelpCircle } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

const nodeTypes = {
    process: ProcessNode,
    inventory: InventoryNode,
    productionControl: ProductionControlNode,
    generic: GenericNode,
};

const VSMCanvasContent = () => {
    const { currentLanguage } = useLanguage();
    const reactFlowWrapper = useRef(null);
    const fileInputRef = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [customLibrary, setCustomLibrary] = useState([]);
    const { screenToFlowPosition, getNodes, setNodes: setReactFlowNodes } = useReactFlow();

    // Undo/Redo Hook
    // We store { nodes, edges } in history
    const { state: historyState, set: pushToHistory, undo, redo, canUndo, canRedo } = useUndoRedo({ nodes: [], edges: [] });
    // Flag to prevent loop when strictly setting from history
    const isUndoing = useRef(false);

    // Metrics Logic
    const [metrics, setMetrics] = useState({ totalCT: 0, totalVA: 0, totalLT: 0, efficiency: 0 });

    // AI Analysis State
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // AI VSM Generator State
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Help Modal State
    const [showHelpModal, setShowHelpModal] = useState(false);

    // Load Initial Data
    useEffect(() => {
        const saved = localStorage.getItem('vsm_flow_data');
        const savedCustom = localStorage.getItem('vsm_custom_icons');

        let initialNodes = [];
        let initialEdges = [];

        if (saved) {
            try {
                const flow = JSON.parse(saved);
                if (flow) {
                    initialNodes = flow.nodes || [];
                    initialEdges = flow.edges || [];
                }
            } catch (e) {
                console.error("Failed to parse saved flow", e);
            }
        }

        setNodes(initialNodes);
        setEdges(initialEdges);
        pushToHistory({ nodes: initialNodes, edges: initialEdges }); // Initial history state

        if (savedCustom) {
            setCustomLibrary(JSON.parse(savedCustom));
        }
    }, []);

    // Effect: Sync History -> UI when Undoing/Redoing
    useEffect(() => {
        if (historyState && (historyState.nodes !== nodes || historyState.edges !== edges)) {
            isUndoing.current = true;
            setNodes(historyState.nodes);
            setEdges(historyState.edges);
            setTimeout(() => { isUndoing.current = false; }, 100);
        }
    }, [historyState]);

    // Effect: Metrics & Auto-save
    useEffect(() => {
        if (isUndoing.current) return;

        // Auto Save to LocalStorage
        const flow = { nodes, edges };
        localStorage.setItem('vsm_flow_data', JSON.stringify(flow));

        // Calculate Metrics
        let ct = 0, va = 0, invTime = 0;
        nodes.forEach(node => {
            if (node.type === 'process') {
                const nodeCT = Number(node.data.ct || 0);
                const nodeVA = Number(node.data.va || nodeCT);
                ct += nodeCT;
                va += nodeVA;
            }
            if (node.type === 'inventory') {
                invTime += Number(node.data.time || 0);
            }
        });
        const lt = invTime + ct;
        const eff = lt > 0 ? (va / lt) * 100 : 0;
        setMetrics({ totalCT: ct, totalVA: va, totalLT: lt, efficiency: eff.toFixed(2) });

        // Expose to Mavi Hub
        window.__maviVSM = {
            nodes,
            edges,
            metrics: { totalCT: ct, totalVA: va, totalLT: lt, efficiency: eff.toFixed(2) },
            bottleneck: nodes.filter(n => n.type === 'process')
                .sort((a, b) => Number(b.data.ct) - Number(a.data.ct))[0]?.data.name
        };

        return () => {
            delete window.__maviVSM;
        };
    }, [nodes, edges]);

    const recordHistory = useCallback(() => {
        if (isUndoing.current) return;
        pushToHistory({ nodes, edges });
    }, [nodes, edges, pushToHistory]);

    // --- Interaction Handlers ---

    const onConnect = useCallback((params) => {
        setEdges((eds) => {
            const newEdges = addEdge({ ...params, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, style: { strokeWidth: 2 } }, eds);
            // We need to record history AFTER state update, but here we are in callback.
            // Simplified: use useEffect dependencies to trigger history push? No, too frequent.
            // Better: Trigger explicit history save wrapper.
            // For now, let's rely on manual trigger or specific events.
            return newEdges;
        });
        // We'll trust the user to perform an action that triggers history save, or we can use a separate effect that debounces.
        // Let's implement a debounce saver for history in the future if needed, but for "Professional" feel, actions should be discrete.
        // We will trigger recordHistory in onConnect/DragStop logic if possible. 
        // Actually, just calling recordHistory() directly here holds stale state closure.
        // So we will use a "useEffect" that watches nodes/edges but is debounced?
        // Or simply:
        setTimeout(() => {
            // Hacky way to get latest state? No. 
            // Correct way: useNodesState and useEdgesState set functions accept a callback.
            // We will leave history recording to major events for now.
        }, 100);
    }, []);

    // Record history on drag stop
    const onNodeDragStop = useCallback(() => {
        recordHistory();
    }, [recordHistory]);

    const onDrop = useCallback((event) => {
        event.preventDefault();
        const type = event.dataTransfer.getData('application/reactflow');
        const symbolType = event.dataTransfer.getData('application/vsmsymbol');
        const customDataStr = event.dataTransfer.getData('application/customdata');

        if (!type) return;

        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

        let data = { ...INITIAL_DATA[symbolType] || {} };
        if (Object.keys(data).length === 0 && INITIAL_DATA[type]) data = { ...INITIAL_DATA[type] };
        if (!data.name) data.name = symbolType;
        data = { ...data, symbolType };
        if (customDataStr) {
            const customData = JSON.parse(customDataStr);
            data = { ...data, ...customData };
        }

        const newNode = {
            id: `${type}-${Date.now()}`,
            type,
            position,
            data: data,
        };

        setNodes((nds) => {
            const newNodes = nds.concat(newNode);
            pushToHistory({ nodes: newNodes, edges });
            return newNodes;
        });
    }, [screenToFlowPosition, pushToHistory, edges]);

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onNodeClick = (event, node) => setSelectedNode(node);
    const onPaneClick = () => setSelectedNode(null);

    const updateNodeData = (id, field, value) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    const newData = { ...node.data, [field]: value };
                    if (field === 'color') newData.color = value;
                    return { ...node, data: newData };
                }
                return node;
            })
        );
        if (selectedNode && selectedNode.id === id) {
            setSelectedNode(prev => ({ ...prev, data: { ...prev.data, [field]: value } }));
        }
    };

    // Save history when user finishes editing a property (onBlur)
    const onPropertyChangeComplete = () => {
        recordHistory();
    };

    const deleteNode = (id) => {
        setNodes((nds) => {
            const newNodes = nds.filter(n => n.id !== id);
            pushToHistory({ nodes: newNodes, edges });
            return newNodes;
        });
        setSelectedNode(null);
    };

    const addCustomIcon = (icon) => {
        setCustomLibrary(prev => {
            const newLib = [...prev, icon];
            localStorage.setItem('vsm_custom_icons', JSON.stringify(newLib));
            return newLib;
        });
    };

    // --- Toolbar Actions ---

    const handleExport = async () => {
        if (!reactFlowWrapper.current) return;
        try {
            // Find just the canvas element or use wrapper
            // Note: html2canvas might have issues with transforms. React Flow has native support internally maybe? 
            // Using a simple querySelector for the viewport
            const element = reactFlowWrapper.current.querySelector('.react-flow__viewport');
            const canvas = await html2canvas(reactFlowWrapper.current, {
                ignoreElements: (node) => node.classList.contains('react-flow__controls') || node.classList.contains('react-flow__minimap')
            });
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'vsm-diagram.png';
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error('Export failed', error);
            alert('Export failed. Please try again.');
        }
    };

    const handleAlign = (alignment) => {
        const selectedNodes = getNodes().filter(n => n.selected);
        if (selectedNodes.length < 2) return;

        let targetVal = 0;
        if (alignment === 'left') targetVal = Math.min(...selectedNodes.map(n => n.position.x));
        if (alignment === 'top') targetVal = Math.min(...selectedNodes.map(n => n.position.y));
        if (alignment === 'center_x') {
            const sum = selectedNodes.reduce((acc, n) => acc + n.position.x, 0);
            targetVal = sum / selectedNodes.length;
        }

        setNodes((nds) => {
            const newNodes = nds.map((node) => {
                if (node.selected) {
                    if (alignment === 'left') return { ...node, position: { ...node.position, x: targetVal } };
                    if (alignment === 'top') return { ...node, position: { ...node.position, y: targetVal } };
                    if (alignment === 'center_x') return { ...node, position: { ...node.position, x: targetVal } };
                }
                return node;
            });
            pushToHistory({ nodes: newNodes, edges });
            return newNodes;
        });
    };

    const handleAIAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            const apiKey = getStoredApiKey();
            const languageName = currentLanguage === 'id' ? 'Indonesian' : 'English';
            const result = await analyzeVSM({ nodes, edges, metrics }, apiKey, languageName);
            setAiAnalysis(result);
        } catch (error) {
            console.error('AI Analysis failed', error);
            alert('AI Analysis failed: ' + error.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerateFromPrompt = async ({ prompt, language, mode }) => {
        setShowGenerateModal(false);
        setIsGenerating(true);
        try {
            const apiKey = getStoredApiKey();
            if (!apiKey) {
                throw new Error(currentLanguage === 'id'
                    ? 'API Key tidak ditemukan. Silakan konfigurasi di AI Settings.'
                    : 'API Key not found. Please configure it in AI Settings.');
            }

            console.log('Generating VSM from prompt:', { prompt, language, mode });
            const result = await generateVSMFromPrompt(prompt, apiKey, language);

            // Validate result
            if (!result.nodes || !Array.isArray(result.nodes) || result.nodes.length === 0) {
                throw new Error(currentLanguage === 'id'
                    ? 'AI tidak menghasilkan node VSM. Coba deskripsi yang lebih detail.'
                    : 'AI did not generate VSM nodes. Try a more detailed description.');
            }
            if (!result.edges || !Array.isArray(result.edges)) {
                throw new Error(currentLanguage === 'id'
                    ? 'AI tidak menghasilkan koneksi VSM yang valid.'
                    : 'AI did not generate valid VSM connections.');
            }

            // Apply to canvas
            if (mode === 'replace') {
                // Replace entire canvas
                setNodes(result.nodes);
                setEdges(result.edges);
                pushToHistory({ nodes: result.nodes, edges: result.edges });
            } else {
                // Merge with existing - offset new nodes to the right
                const maxX = nodes.length > 0
                    ? Math.max(...nodes.map(n => n.position.x))
                    : 0;
                const offsetX = maxX + 300; // 300px spacing

                const offsetNodes = result.nodes.map(node => ({
                    ...node,
                    id: `${node.id}-${Date.now()}`, // Ensure unique IDs
                    position: {
                        x: node.position.x + offsetX,
                        y: node.position.y
                    }
                }));

                // Update edge IDs to match new node IDs
                const nodeIdMap = {};
                result.nodes.forEach((oldNode, idx) => {
                    nodeIdMap[oldNode.id] = offsetNodes[idx].id;
                });

                const offsetEdges = result.edges.map(edge => ({
                    ...edge,
                    id: `${edge.id}-${Date.now()}`,
                    source: nodeIdMap[edge.source] || edge.source,
                    target: nodeIdMap[edge.target] || edge.target
                }));

                const newNodes = [...nodes, ...offsetNodes];
                const newEdges = [...edges, ...offsetEdges];
                setNodes(newNodes);
                setEdges(newEdges);
                pushToHistory({ nodes: newNodes, edges: newEdges });
            }

            // Show success message
            const successMsg = currentLanguage === 'id'
                ? `✅ VSM berhasil dibuat! ${result.nodes.length} node dan ${result.edges.length} koneksi ditambahkan.`
                : `✅ VSM generated successfully! ${result.nodes.length} nodes and ${result.edges.length} connections added.`;
            alert(successMsg);

        } catch (error) {
            console.error('VSM Generation Error:', error);
            const errorMsg = currentLanguage === 'id'
                ? `❌ Gagal membuat VSM: ${error.message}\n\nTips:\n- Pastikan API Key sudah dikonfigurasi\n- Gunakan deskripsi yang lebih detail\n- Sertakan cycle time dan informasi proses`
                : `❌ Failed to generate VSM: ${error.message}\n\nTips:\n- Ensure API Key is configured\n- Use more detailed description\n- Include cycle times and process information`;
            alert(errorMsg);
        } finally {
            setIsGenerating(false);
        }
    };

    // --- Save/Load Functions ---

    const handleSaveToFile = () => {
        try {
            const vsmData = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                nodes,
                edges,
                customLibrary,
                metadata: {
                    totalNodes: nodes.length,
                    totalEdges: edges.length,
                    metrics
                }
            };

            const dataStr = JSON.stringify(vsmData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `vsm-${new Date().toISOString().split('T')[0]}.mavi-vsm`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            const successMsg = currentLanguage === 'id'
                ? '✅ VSM berhasil disimpan!'
                : '✅ VSM saved successfully!';
            alert(successMsg);
        } catch (error) {
            console.error('Save failed:', error);
            const errorMsg = currentLanguage === 'id'
                ? '❌ Gagal menyimpan VSM: ' + error.message
                : '❌ Failed to save VSM: ' + error.message;
            alert(errorMsg);
        }
    };

    const handleLoadFromFile = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result;
                if (typeof content !== 'string') {
                    throw new Error('Invalid file content');
                }

                const vsmData = JSON.parse(content);

                // Validate structure
                if (!vsmData.nodes || !Array.isArray(vsmData.nodes)) {
                    throw new Error(currentLanguage === 'id'
                        ? 'File tidak valid: nodes tidak ditemukan'
                        : 'Invalid file: nodes not found');
                }
                if (!vsmData.edges || !Array.isArray(vsmData.edges)) {
                    throw new Error(currentLanguage === 'id'
                        ? 'File tidak valid: edges tidak ditemukan'
                        : 'Invalid file: edges not found');
                }

                // Ask user: replace or merge?
                const shouldReplace = confirm(
                    currentLanguage === 'id'
                        ? `Load ${vsmData.nodes.length} nodes dan ${vsmData.edges.length} edges?\n\nOK = Replace canvas\nCancel = Merge dengan yang ada`
                        : `Load ${vsmData.nodes.length} nodes and ${vsmData.edges.length} edges?\n\nOK = Replace canvas\nCancel = Merge with existing`
                );

                if (shouldReplace) {
                    // Replace mode
                    setNodes(vsmData.nodes);
                    setEdges(vsmData.edges);
                    if (vsmData.customLibrary) {
                        setCustomLibrary(vsmData.customLibrary);
                        localStorage.setItem('vsm_custom_icons', JSON.stringify(vsmData.customLibrary));
                    }
                    pushToHistory({ nodes: vsmData.nodes, edges: vsmData.edges });
                } else {
                    // Merge mode - offset loaded nodes
                    const maxX = nodes.length > 0 ? Math.max(...nodes.map(n => n.position.x)) : 0;
                    const offsetX = maxX + 300;

                    const offsetNodes = vsmData.nodes.map(node => ({
                        ...node,
                        id: `${node.id}-${Date.now()}`,
                        position: {
                            x: node.position.x + offsetX,
                            y: node.position.y
                        }
                    }));

                    const nodeIdMap = {};
                    vsmData.nodes.forEach((oldNode, idx) => {
                        nodeIdMap[oldNode.id] = offsetNodes[idx].id;
                    });

                    const offsetEdges = vsmData.edges.map(edge => ({
                        ...edge,
                        id: `${edge.id}-${Date.now()}`,
                        source: nodeIdMap[edge.source] || edge.source,
                        target: nodeIdMap[edge.target] || edge.target
                    }));

                    const newNodes = [...nodes, ...offsetNodes];
                    const newEdges = [...edges, ...offsetEdges];
                    setNodes(newNodes);
                    setEdges(newEdges);
                    pushToHistory({ nodes: newNodes, edges: newEdges });

                    if (vsmData.customLibrary) {
                        const mergedLibrary = [...customLibrary, ...vsmData.customLibrary];
                        setCustomLibrary(mergedLibrary);
                        localStorage.setItem('vsm_custom_icons', JSON.stringify(mergedLibrary));
                    }
                }

                const successMsg = currentLanguage === 'id'
                    ? '✅ VSM berhasil dimuat!'
                    : '✅ VSM loaded successfully!';
                alert(successMsg);

            } catch (error) {
                console.error('Load failed:', error);
                const errorMsg = currentLanguage === 'id'
                    ? '❌ Gagal memuat VSM: ' + error.message
                    : '❌ Failed to load VSM: ' + error.message;
                alert(errorMsg);
            }
        };

        reader.onerror = () => {
            const errorMsg = currentLanguage === 'id'
                ? '❌ Gagal membaca file'
                : '❌ Failed to read file';
            alert(errorMsg);
        };

        reader.readAsText(file);
        // Reset input so same file can be loaded again
        event.target.value = '';
    };

    // --- Render Helpers ---

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100%', flexDirection: 'column' }}>
            {/* Top Toolbar */}
            <div style={{
                height: '50px', backgroundColor: '#333', borderBottom: '1px solid #555',
                display: 'flex', alignItems: 'center', padding: '0 20px', gap: '15px', color: 'white'
            }}>
                <div style={{ fontWeight: 'bold', marginRight: '20px' }}>MAVi VSM</div>

                <div style={toolbarGroupStyle}>
                    <button style={btnStyle} onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">↩️ Undo</button>
                    <button style={btnStyle} onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">↪️ Redo</button>
                </div>

                <div style={toolbarGroupStyle}>
                    <button style={btnStyle} onClick={() => handleAlign('left')} title="Align Left">⬅️ Align Left</button>
                    <button style={btnStyle} onClick={() => handleAlign('top')} title="Align Top">⬆️ Align Top</button>
                </div>

                <div style={toolbarGroupStyle}>
                    <button
                        style={{ ...btnStyle, backgroundColor: '#0078d4' }}
                        onClick={handleSaveToFile}
                        title={currentLanguage === 'id' ? 'Simpan VSM ke File' : 'Save VSM to File'}
                    >
                        💾 {currentLanguage === 'id' ? 'Simpan' : 'Save'}
                    </button>
                    <button
                        style={{ ...btnStyle, backgroundColor: '#107c10' }}
                        onClick={() => fileInputRef.current?.click()}
                        title={currentLanguage === 'id' ? 'Buka VSM dari File' : 'Load VSM from File'}
                    >
                        📂 {currentLanguage === 'id' ? 'Buka' : 'Load'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".mavi-vsm,.json"
                        onChange={handleLoadFromFile}
                        style={{ display: 'none' }}
                    />
                </div>

                <div style={toolbarGroupStyle}>
                    <button
                        style={{ ...btnStyle, backgroundColor: '#ff6b35' }}
                        onClick={() => setShowGenerateModal(true)}
                        disabled={isGenerating}
                        title={currentLanguage === 'id' ? 'Generate VSM dari Deskripsi' : 'Generate VSM from Description'}
                    >
                        {isGenerating ? '⌛ Generating...' : <><Wand2 size={16} /> AI Generate</>}
                    </button>
                    <button style={{ ...btnStyle, backgroundColor: '#8a2be2' }} onClick={handleAIAnalysis} disabled={isAnalyzing}>
                        {isAnalyzing ? '⌛ Analyzing...' : <><Brain size={16} /> AI Analysis</>}
                    </button>
                    <button style={btnStyle} onClick={handleExport} title="Export as PNG">📷 Export PNG</button>
                    <button style={{ ...btnStyle, backgroundColor: '#c50f1f' }} onClick={() => { if (confirm('Clear Canvas?')) { setNodes([]); setEdges([]); pushToHistory({ nodes: [], edges: [] }); } }}>🗑️ Clear</button>
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                        {nodes.length} Nodes | {edges.length} Connections
                    </div>
                    <button
                        style={{ ...btnStyle, backgroundColor: '#0078d4' }}
                        onClick={() => setShowHelpModal(true)}
                        title={currentLanguage === 'id' ? 'Bantuan & Panduan' : 'Help & Guide'}
                    >
                        <HelpCircle size={16} /> {currentLanguage === 'id' ? 'Bantuan' : 'Help'}
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <Sidebar customLibrary={customLibrary} onAddCustom={addCustomIcon} />

                <div className="reactflow-wrapper" ref={reactFlowWrapper} style={{ flex: 1, height: '100%', position: 'relative', backgroundColor: '#1e1e1e' }}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeDragStop={onNodeDragStop}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        nodeTypes={nodeTypes}
                        connectionMode="loose"
                        fitView
                        snapToGrid={true}
                        snapGrid={[15, 15]}
                    >
                        <Controls />
                        <MiniMap style={{ backgroundColor: '#333' }} nodeColor="#555" maskColor="rgba(0, 0, 0, 0.7)" />
                        <Background color="#555" gap={15} size={1} variant="dots" />
                    </ReactFlow>

                    {/* Bottom Metrics Bar */}
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, width: '100%', height: '60px',
                        backgroundColor: 'rgba(45, 45, 45, 0.95)', borderTop: '1px solid #666',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
                        padding: '0 20px', zIndex: 5, color: 'white', backdropFilter: 'blur(5px)'
                    }}>
                        <MetricBox label="Total Cycle Time" value={`${metrics.totalCT}s`} />
                        <MetricBox label="Total VA Time" value={`${metrics.totalVA}s`} color="#4caf50" />
                        <MetricBox label="Total Lead Time" value={`${metrics.totalLT}s`} color="#ff9900" />
                        <MetricBox label="Efficiency" value={`${metrics.efficiency}%`} color="#00bfff" />
                    </div>

                    {/* Properties Panel */}
                    {selectedNode && (
                        <div style={{
                            position: 'absolute', right: 20, top: 20, width: '280px', maxHeight: 'calc(100% - 140px)',
                            backgroundColor: '#252526', padding: '15px', borderRadius: '8px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.5)', border: '1px solid #444',
                            zIndex: 10, overflowY: 'auto'
                        }}>
                            <h3 style={{ color: 'white', marginTop: 0, fontSize: '1rem', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
                                Properties
                            </h3>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={labelStyle}>Label / Name</label>
                                <input
                                    value={selectedNode.data.label || selectedNode.data.name || ''}
                                    onChange={(e) => updateNodeData(selectedNode.id, 'name', e.target.value)}
                                    onBlur={onPropertyChangeComplete}
                                    style={inputStyle}
                                />
                            </div>

                            {/* Color Coding (Visual Polish) */}
                            <div style={{ marginBottom: '15px' }}>
                                <label style={labelStyle}>Node Color</label>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    {['#1e1e1e', '#c50f1f', '#0078d4', '#107c10', '#d13438', '#881798'].map(color => (
                                        <div
                                            key={color}
                                            onClick={() => { updateNodeData(selectedNode.id, 'color', color); onPropertyChangeComplete(); }}
                                            style={{
                                                width: '20px', height: '20px', backgroundColor: color,
                                                border: selectedNode.data.color === color ? '2px solid white' : '1px solid #555',
                                                cursor: 'pointer', borderRadius: '4px'
                                            }}
                                            title={color}
                                        />
                                    ))}
                                </div>
                            </div>

                            {selectedNode.type === 'process' && (
                                <>
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={labelStyle}>Process Type</label>
                                        <select
                                            value={selectedNode.data.processType || PROCESS_TYPES.NORMAL}
                                            onChange={(e) => { updateNodeData(selectedNode.id, 'processType', e.target.value); onPropertyChangeComplete(); }}
                                            style={inputStyle}
                                        >
                                            <option value={PROCESS_TYPES.NORMAL}>Normal</option>
                                            <option value={PROCESS_TYPES.PACEMAKER}>Pacemaker</option>
                                            <option value={PROCESS_TYPES.SHARED}>Shared</option>
                                            <option value={PROCESS_TYPES.OUTSIDE}>Outside</option>
                                        </select>
                                    </div>
                                    <PropertyField label="Cycle Time (sec)" field="ct" node={selectedNode} update={updateNodeData} commit={onPropertyChangeComplete} />
                                    <PropertyField label="Changeover (min)" field="co" node={selectedNode} update={updateNodeData} commit={onPropertyChangeComplete} />
                                    <PropertyField label="Uptime (%)" field="uptime" node={selectedNode} update={updateNodeData} commit={onPropertyChangeComplete} />
                                    <PropertyField label="Yield (%)" field="yield" node={selectedNode} update={updateNodeData} commit={onPropertyChangeComplete} />
                                    <PropertyField label="VA Time (sec)" field="va" node={selectedNode} update={updateNodeData} commit={onPropertyChangeComplete} />
                                    <PropertyField label="Operators" field="operators" node={selectedNode} update={updateNodeData} commit={onPropertyChangeComplete} />
                                </>
                            )}

                            {selectedNode.type === 'inventory' && (
                                <>
                                    <PropertyField label="Amount" field="amount" node={selectedNode} update={updateNodeData} commit={onPropertyChangeComplete} />
                                    <PropertyField label="Unit" field="unit" type="text" node={selectedNode} update={updateNodeData} commit={onPropertyChangeComplete} />
                                    <PropertyField label="Time Eq. (sec)" field="time" node={selectedNode} update={updateNodeData} commit={onPropertyChangeComplete} />
                                </>
                            )}

                            <button onClick={() => deleteNode(selectedNode.id)} style={{ width: '100%', padding: '8px', backgroundColor: '#333', color: '#c50f1f', border: '1px solid #c50f1f', borderRadius: '4px', cursor: 'pointer', marginTop: '20px' }}>Delete Node</button>
                        </div>
                    )}

                    {/* AI Analysis Modal/Overlay */}
                    {aiAnalysis && (
                        <div style={{
                            position: 'absolute', top: '70px', left: '50%', transform: 'translateX(-50%)',
                            width: '450px', maxHeight: 'calc(100% - 150px)', backgroundColor: '#1e1e1e',
                            color: 'white', borderRadius: '12px', border: '1px solid #8a2be2',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.8)', zIndex: 100, overflow: 'hidden',
                            display: 'flex', flexDirection: 'column'
                        }}>
                            <div style={{
                                padding: '15px', backgroundColor: '#8a2be2', display: 'flex',
                                justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
                                    <Sparkles size={20} /> MAVi AI VSM Insights
                                </div>
                                <button onClick={() => setAiAnalysis(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div style={{ padding: '20px', overflowY: 'auto', fontSize: '0.9rem', lineHeight: '1.5' }} className="markdown-container">
                                <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                                <style>{`
                                    .markdown-container h1, .markdown-container h2, .markdown-container h3 { color: #8a2be2; margin-top: 20px; }
                                    .markdown-container ul { padding-left: 20px; }
                                    .markdown-container li { margin-bottom: 8px; }
                                `}</style>
                            </div>
                            <div style={{ padding: '15px', borderTop: '1px solid #333', textAlign: 'right' }}>
                                <button onClick={() => setAiAnalysis(null)} style={{ padding: '6px 15px', backgroundColor: '#444', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>
                                    Close
                                </button>
                            </div>
                        </div>
                    )}

                    {/* AI VSM Generator Modal */}
                    <AIVSMGeneratorModal
                        isOpen={showGenerateModal}
                        onClose={() => setShowGenerateModal(false)}
                        onGenerate={handleGenerateFromPrompt}
                        currentLanguage={currentLanguage}
                        existingNodesCount={nodes.length}
                    />

                    {/* Help Modal */}
                    {showHelpModal && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 200,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: '20px'
                        }}>
                            <div style={{
                                width: '90%', maxWidth: '900px', maxHeight: '90vh',
                                backgroundColor: '#1e1e1e', borderRadius: '12px',
                                border: '1px solid #0078d4', boxShadow: '0 10px 40px rgba(0,0,0,0.9)',
                                display: 'flex', flexDirection: 'column', overflow: 'hidden'
                            }}>
                                {/* Header */}
                                <div style={{
                                    padding: '20px', backgroundColor: '#0078d4',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', fontSize: '1.2rem', color: 'white' }}>
                                        <HelpCircle size={24} />
                                        {currentLanguage === 'id' ? 'Panduan VSM' : 'VSM Guide'}
                                    </div>
                                    <button onClick={() => setShowHelpModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                                        <X size={24} />
                                    </button>
                                </div>

                                {/* Content */}
                                <div style={{ padding: '30px', overflowY: 'auto', color: 'white', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                    {currentLanguage === 'id' ? (
                                        <>
                                            <h2 style={{ color: '#0078d4', marginTop: 0 }}>🎯 Cara Menggunakan VSM</h2>

                                            <h3 style={{ color: '#4fc3f7', marginTop: '25px' }}>1. Menambah Simbol</h3>
                                            <ul>
                                                <li>Drag simbol dari <strong>VSM Toolbox</strong> (sidebar kiri)</li>
                                                <li>Drop ke canvas untuk menambahkan</li>
                                                <li>Klik simbol untuk edit properties</li>
                                            </ul>

                                            <h3 style={{ color: '#4fc3f7' }}>2. Menghubungkan Proses</h3>
                                            <ul>
                                                <li>Drag dari titik connection satu node ke node lain</li>
                                                <li>Otomatis membuat arrow connection</li>
                                            </ul>

                                            <h3 style={{ color: '#4fc3f7' }}>3. Keyboard Shortcuts</h3>
                                            <ul>
                                                <li><kbd>Ctrl + Z</kbd> - Undo</li>
                                                <li><kbd>Ctrl + Y</kbd> - Redo</li>
                                                <li><kbd>Delete</kbd> - Hapus node yang dipilih</li>
                                                <li><kbd>Mouse Wheel</kbd> - Zoom in/out</li>
                                                <li><kbd>Space + Drag</kbd> - Pan canvas</li>
                                            </ul>

                                            <h3 style={{ color: '#4fc3f7' }}>4. Fitur Save/Load</h3>
                                            <ul>
                                                <li><strong>💾 Simpan</strong> - Download VSM sebagai file .mavi-vsm</li>
                                                <li><strong>📂 Buka</strong> - Load VSM dari file</li>
                                                <li>Pilih mode: Replace (ganti semua) atau Merge (gabung)</li>
                                            </ul>

                                            <h3 style={{ color: '#4fc3f7' }}>5. AI Generate VSM</h3>
                                            <ul>
                                                <li>Klik <strong>🪄 AI Generate</strong></li>
                                                <li>Tulis deskripsi proses produksi Anda</li>
                                                <li>Sertakan: Cycle Time, Uptime, Operators, Inventory</li>
                                                <li>AI akan membuat VSM otomatis!</li>
                                            </ul>

                                            <h3 style={{ color: '#4fc3f7' }}>📊 Referensi Simbol</h3>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                                                <div><strong>Process Data:</strong></div>
                                                <div>🏭 Process Box, 👤 Operator, 💥 Kaizen</div>

                                                <div><strong>Material Flow:</strong></div>
                                                <div>🏭 Supplier, 🏢 Customer, ⚠️ Inventory, 🛒 Supermarket, 🔄 FIFO, ✅ Finished, ➡️ Push</div>

                                                <div><strong>Information:</strong></div>
                                                <div>🏢 Control, 📊 Heijunka, 📮 Kanban Post, 🟩 Prod Kanban, 🟧 W-Draw, 👁️ Go See</div>

                                                <div><strong>Timeline:</strong></div>
                                                <div>⏱️ Timeline</div>
                                            </div>

                                            <h3 style={{ color: '#4fc3f7' }}>💡 Contoh Prompt AI</h3>
                                            <div style={{ backgroundColor: '#2d2d2d', padding: '15px', borderRadius: '8px', marginTop: '10px', fontSize: '0.85rem' }}>
                                                <code>
                                                    Buatkan VSM untuk produksi PCB:<br /><br />
                                                    CUSTOMER: demand 500 unit/hari<br /><br />
                                                    PROSES:<br />
                                                    1. Screen Printing: CT=45s, CO=30min, Uptime=95%, Operators=2<br />
                                                    &nbsp;&nbsp;&nbsp;Inventory: 500 pcs (6 jam)<br /><br />
                                                    2. Component Placement: CT=60s, CO=45min, Uptime=90%, Operators=1<br />
                                                    &nbsp;&nbsp;&nbsp;Supermarket: 300 pcs dengan kanban<br /><br />
                                                    INFORMATION: Production Control dengan Heijunka Box
                                                </code>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <h2 style={{ color: '#0078d4', marginTop: 0 }}>🎯 How to Use VSM</h2>

                                            <h3 style={{ color: '#4fc3f7', marginTop: '25px' }}>1. Adding Symbols</h3>
                                            <ul>
                                                <li>Drag symbols from <strong>VSM Toolbox</strong> (left sidebar)</li>
                                                <li>Drop onto canvas to add</li>
                                                <li>Click symbol to edit properties</li>
                                            </ul>

                                            <h3 style={{ color: '#4fc3f7' }}>2. Connecting Processes</h3>
                                            <ul>
                                                <li>Drag from connection point of one node to another</li>
                                                <li>Automatically creates arrow connection</li>
                                            </ul>

                                            <h3 style={{ color: '#4fc3f7' }}>3. Keyboard Shortcuts</h3>
                                            <ul>
                                                <li><kbd>Ctrl + Z</kbd> - Undo</li>
                                                <li><kbd>Ctrl + Y</kbd> - Redo</li>
                                                <li><kbd>Delete</kbd> - Delete selected node</li>
                                                <li><kbd>Mouse Wheel</kbd> - Zoom in/out</li>
                                                <li><kbd>Space + Drag</kbd> - Pan canvas</li>
                                            </ul>

                                            <h3 style={{ color: '#4fc3f7' }}>4. Save/Load Features</h3>
                                            <ul>
                                                <li><strong>💾 Save</strong> - Download VSM as .mavi-vsm file</li>
                                                <li><strong>📂 Load</strong> - Load VSM from file</li>
                                                <li>Choose mode: Replace (clear all) or Merge (combine)</li>
                                            </ul>

                                            <h3 style={{ color: '#4fc3f7' }}>5. AI Generate VSM</h3>
                                            <ul>
                                                <li>Click <strong>🪄 AI Generate</strong></li>
                                                <li>Describe your production process</li>
                                                <li>Include: Cycle Time, Uptime, Operators, Inventory</li>
                                                <li>AI will create VSM automatically!</li>
                                            </ul>

                                            <h3 style={{ color: '#4fc3f7' }}>📊 Symbol Reference</h3>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                                                <div><strong>Process Data:</strong></div>
                                                <div>🏭 Process Box, 👤 Operator, 💥 Kaizen</div>

                                                <div><strong>Material Flow:</strong></div>
                                                <div>🏭 Supplier, 🏢 Customer, ⚠️ Inventory, 🛒 Supermarket, 🔄 FIFO, ✅ Finished, ➡️ Push</div>

                                                <div><strong>Information:</strong></div>
                                                <div>🏢 Control, 📊 Heijunka, 📮 Kanban Post, 🟩 Prod Kanban, 🟧 W-Draw, 👁️ Go See</div>

                                                <div><strong>Timeline:</strong></div>
                                                <div>⏱️ Timeline</div>
                                            </div>

                                            <h3 style={{ color: '#4fc3f7' }}>💡 AI Prompt Example</h3>
                                            <div style={{ backgroundColor: '#2d2d2d', padding: '15px', borderRadius: '8px', marginTop: '10px', fontSize: '0.85rem' }}>
                                                <code>
                                                    Create VSM for PCB manufacturing:<br /><br />
                                                    CUSTOMER: demand 500 units/day<br /><br />
                                                    PROCESSES:<br />
                                                    1. Screen Printing: CT=45s, CO=30min, Uptime=95%, Operators=2<br />
                                                    &nbsp;&nbsp;&nbsp;Inventory: 500 pcs (6 hours)<br /><br />
                                                    2. Component Placement: CT=60s, CO=45min, Uptime=90%, Operators=1<br />
                                                    &nbsp;&nbsp;&nbsp;Supermarket: 300 pcs with kanban<br /><br />
                                                    INFORMATION: Production Control with Heijunka Box
                                                </code>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Footer */}
                                <div style={{ padding: '15px 30px', borderTop: '1px solid #333', textAlign: 'right', backgroundColor: '#252526' }}>
                                    <button
                                        onClick={() => setShowHelpModal(false)}
                                        style={{
                                            padding: '8px 20px', backgroundColor: '#0078d4', border: 'none',
                                            color: 'white', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                                        }}
                                    >
                                        {currentLanguage === 'id' ? 'Tutup' : 'Close'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper for Property Fields
const PropertyField = ({ label, field, node, update, commit, type = 'number' }) => (
    <div style={{ marginBottom: '10px' }}>
        <label style={labelStyle}>{label}</label>
        <input
            type={type}
            value={node.data[field]}
            onChange={(e) => update(node.id, field, e.target.value)}
            onBlur={commit}
            style={inputStyle}
        />
    </div>
);

const ToolbarButton = ({ children, onClick, title, disabled, color }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        style={{ ...btnStyle, backgroundColor: color || '#444', opacity: disabled ? 0.5 : 1 }}
    >
        {children}
    </button>
);

const VSMCanvas = () => (
    <ReactFlowProvider>
        <VSMCanvasContent />
    </ReactFlowProvider>
);

const MetricBox = ({ label, value, color }) => (
    <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.7rem', color: '#aaa', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: color || 'white' }}>{value}</div>
    </div>
);

const toolbarGroupStyle = { display: 'flex', gap: '5px', borderRight: '1px solid #555', paddingRight: '15px' };
const btnStyle = { padding: '5px 10px', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' };
const labelStyle = { display: 'block', marginBottom: '3px', color: '#aaa', fontSize: '0.75rem' };
const inputStyle = { width: '100%', padding: '6px', backgroundColor: '#333', border: '1px solid #555', color: 'white', borderRadius: '4px' };

export default VSMCanvas;
