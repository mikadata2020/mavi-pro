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
import InformationEdge from './edges/InformationEdge';
import MaterialEdge from './edges/MaterialEdge';
import Sidebar from './Sidebar';
import TimelineLadder from './TimelineLadder';
import YamazumiChart from './YamazumiChart';
import EPEIAnalysis from './EPEIAnalysis';
import AIVSMGeneratorModal from './AIVSMGeneratorModal';
import VSMWizard from './VSMWizard';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { analyzeVSM, getStoredApiKey, generateVSMFromPrompt, generateVSMFromImage, validateApiKey } from '../../utils/aiGenerator';
import ReactMarkdown from 'react-markdown';
import { Brain, Sparkles, X, Wand2, HelpCircle, ImagePlus, PanelLeftClose, PanelLeftOpen, Eye, EyeOff, BarChart3, Repeat, Undo, Redo, ArrowLeft, ArrowUp, Save, Folder, Layout } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

// Static types that don't need dynamic props
const staticNodeTypes = {
    inventory: InventoryNode,
    productionControl: ProductionControlNode,
    generic: GenericNode,
};

const edgeTypes = {
    information: InformationEdge,
    material: MaterialEdge,
};

const VSMCanvasContent = () => {
    const { currentLanguage } = useLanguage();
    const reactFlowWrapper = useRef(null);
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [selectedEdge, setSelectedEdge] = useState(null);
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
    const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash');
    const [availableModels, setAvailableModels] = useState([]);

    // UI State
    const [showSidebar, setShowSidebar] = useState(true);
    const [showNodeDetails, setShowNodeDetails] = useState(true);
    const [showYamazumi, setShowYamazumi] = useState(false);
    const [showEPEI, setShowEPEI] = useState(false);
    const [showWizard, setShowWizard] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);

    const nodeTypes = useMemo(() => ({
        inventory: (props) => <InventoryNode {...props} showDetails={showNodeDetails} />,
        productionControl: (props) => <ProductionControlNode {...props} showDetails={showNodeDetails} />,
        generic: (props) => <GenericNode {...props} showDetails={showNodeDetails} />,
        process: (props) => <ProcessNode {...props} showDetails={showNodeDetails} />
    }), [showNodeDetails]);
    useEffect(() => {
        const fetchModels = async () => {
            try {
                const apiKey = getStoredApiKey();
                // If we have an API key, try to fetch models
                if (apiKey) {
                    const models = await validateApiKey(apiKey);
                    if (models && models.length > 0) {
                        setAvailableModels(models);

                        // Auto-select a safe default if current selection is not valid or just to be safe
                        // Prefer gemini-1.5-flash variants, then pro, then anything else
                        const preferred = models.find(m => m.includes('1.5-flash')) ||
                            models.find(m => m.includes('flash')) ||
                            models[0];

                        if (preferred) {
                            setSelectedModel(preferred);
                        }
                    }
                }
            } catch (err) {
                console.warn("Failed to fetch models in VSM Canvas", err);
                // Fallback models are already in the UI if we don't overwrite availableModels with empty?
                // Actually if fetch fails, availableModels stays empty.
                // We should initialize availableModels with default list or handle empty list in UI.
            }
        };
        fetchModels();
    }, []);

    // ... (rest of the component state and effects)

    // ... (rest of the component state and effects)

    const handleUploadImage = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsGenerating(true);
        try {
            const apiKey = getStoredApiKey();
            if (!apiKey) {
                throw new Error("API Key not found");
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const imageData = e.target.result;
                    const language = currentLanguage === 'id' ? 'Indonesian' : 'English';

                    const result = await generateVSMFromImage(imageData, apiKey, language, selectedModel);

                    // Ask user: replace or merge?
                    const shouldReplace = confirm(
                        currentLanguage === 'id'
                            ? `VSM berhasil dikenali! ${result.nodes.length} nodes & ${result.edges.length} connections.\n\nOK = Replace Canvas\nCancel = Merge (Add to existing)`
                            : `VSM recognized! ${result.nodes.length} nodes & ${result.edges.length} connections.\n\nOK = Replace Canvas\nCancel = Merge (Add to existing)`
                    );

                    if (shouldReplace) {
                        setNodes(result.nodes);
                        setEdges(result.edges);
                        pushToHistory({ nodes: result.nodes, edges: result.edges });
                    } else {
                        // Merge logic (offset by max X)
                        const maxX = nodes.length > 0 ? Math.max(...nodes.map(n => n.position.x)) : 0;
                        const offsetX = maxX + 400;

                        const offsetNodes = result.nodes.map(node => ({
                            ...node,
                            id: `${node.id}-${Date.now()}`,
                            position: {
                                x: node.position.x + offsetX,
                                y: node.position.y
                            }
                        }));

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

                    alert(currentLanguage === 'id' ? '✅ Image berhasil diproses!' : '✅ Image processed successfully!');

                } catch (err) {
                    console.error('Image Processing Error:', err);
                    alert(currentLanguage === 'id' ? '❌ Gagal memproses gambar: ' + err.message : '❌ Failed to process image: ' + err.message);
                } finally {
                    setIsGenerating(false);
                    event.target.value = ''; // Reset input
                }
            };
            reader.readAsDataURL(file);

        } catch (error) {
            console.error(error);
            alert(error.message);
            setIsGenerating(false);
        }
    };

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

        // 1. Identify Customer for Demand/Takt calculation
        const customerNode = nodes.find(n => n.data?.symbolType === VSMSymbols.CUSTOMER);
        let globalTakt = 0;
        let avgDailyDemand = 0;

        if (customerNode) {
            const demand = Number(customerNode.data.demand || 0);
            const availableSec = Number(customerNode.data.availableTime || 480) * 60;
            const shifts = Number(customerNode.data.shifts || 1);
            const packSize = Number(customerNode.data.packSize || 1);
            if (demand > 0) {
                globalTakt = (availableSec * shifts) / demand;
                avgDailyDemand = demand / shifts; // Simplified to per shift if we use shift as day unit here

                // Add pitch calculation
                const pitch = globalTakt * packSize;
                window.__maviVSMPitch = pitch; // Temporary for state sync
            }
        }

        // Calculate Metrics
        let ct = 0, va = 0, invTime = 0;
        const updatedNodes = nodes.map(node => {
            let newNode = { ...node };
            let hasChanged = false;

            if (node.type === 'process') {
                const nodeCT = Number(node.data.ct || 0);
                const nodeVA = Number(node.data.va || nodeCT);
                ct += nodeCT;
                va += nodeVA;

                // Sync global takt to process nodes for visual feedback
                if (node.data.globalTakt !== globalTakt) {
                    newNode.data = { ...node.data, globalTakt };
                    hasChanged = true;
                }
            }

            if (node.type === 'inventory' || node.data?.symbolType === VSMSymbols.FINISHED_GOODS) {
                // Little's Law: LT = Inventory / Demand
                if (avgDailyDemand > 0) {
                    const qty = Number(node.data.amount || 0);
                    const calculatedDays = (qty / (avgDailyDemand || 1)).toFixed(2);
                    if (node.data.calculatedLT !== calculatedDays) {
                        newNode.data = { ...node.data, calculatedLT: calculatedDays };
                        hasChanged = true;
                    }
                    invTime += Number(calculatedDays) * 86400; // Store as seconds for total calculation
                } else {
                    invTime += Number(node.data.time || 0);
                }
            }

            return newNode;
        });

        // Batch update nodes if calculated fields changed
        const anyChanged = updatedNodes.some((n, i) => n.data !== nodes[i].data);
        if (anyChanged) {
            setNodes(updatedNodes);
        }

        const lt = invTime + ct;
        const eff = lt > 0 ? (va / lt) * 100 : 0;
        setMetrics({
            totalCT: ct,
            totalVA: va,
            totalLT: lt,
            efficiency: eff.toFixed(2),
            taktTime: globalTakt.toFixed(1),
            pitch: (window.__maviVSMPitch || 0).toFixed(1)
        });

        // Expose to Mavi Hub
        window.__maviVSM = {
            nodes: updatedNodes,
            edges,
            metrics: { totalCT: ct, totalVA: va, totalLT: lt, efficiency: eff.toFixed(2), taktTime: globalTakt.toFixed(1) },
            bottleneck: updatedNodes.filter(n => n.type === 'process')
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

    const handleWizardGenerate = (wizardData) => {
        const newNodes = [];
        const newEdges = [];
        const { customer, processes, supplier, logistics, infoFlow } = wizardData;

        // 1. Supplier (Upstream - Left)
        const supplierId = 'node_supplier';
        newNodes.push({
            id: supplierId,
            type: 'generic',
            position: { x: 50, y: 150 },
            data: {
                symbolType: supplier.transportMode || VSMSymbols.SUPPLIER,
                name: supplier.name,
                frequency: supplier.frequency,
                capacity: logistics.truckCapacity
            }
        });

        // 2. Production Control (Top Center)
        const controlId = 'node_control';
        const controlX = (processes.length * 200) + 400;
        newNodes.push({
            id: controlId,
            type: 'productionControl',
            position: { x: controlX, y: -150 },
            data: { name: 'PRODUCTION CONTROL' }
        });

        // 3. Customer (Downstream - Right)
        const customerId = 'node_customer';
        const maxProcessX = processes.length * 400 + 400;
        const customerX = Math.max(800, maxProcessX);
        newNodes.push({
            id: customerId,
            type: 'generic',
            position: { x: customerX, y: 150 },
            data: {
                symbolType: VSMSymbols.CUSTOMER,
                name: customer.name,
                demand: customer.demand,
                shifts: customer.shifts,
                availableTime: customer.hoursPerShift * 60,
                packSize: customer.packSize
            }
        });

        // 4. Processes & Buffers (Horizontal Chain with Parallel Support)
        let lastNodeIds = [supplierId]; // Array to support multiple parallel targets
        let currentX = 400;
        let baseHeight = 350;
        let parallelCount = 0;
        let sourceForParallel = supplierId;

        processes.forEach((proc, idx) => {
            const procId = `node_proc_${idx + 1}`;

            // Adjust coordinates for parallel
            let nodeY = baseHeight;
            let nodeX = currentX;

            if (proc.isParallel) {
                parallelCount++;
                nodeY += (parallelCount * 200);
                nodeX -= 400; // Stay at same X as previous
            } else {
                parallelCount = 0; // Reset stack
                sourceForParallel = lastNodeIds[lastNodeIds.length - 1];
            }

            newNodes.push({
                id: procId,
                type: 'process',
                position: { x: nodeX, y: nodeY },
                data: {
                    name: proc.name,
                    ct: proc.ct,
                    co: proc.co,
                    workers: proc.workers,
                    performance: proc.performance,
                    uptime: 95
                }
            });

            // Edge from source
            const sourceId = proc.isParallel ? sourceForParallel : lastNodeIds[lastNodeIds.length - 1];
            const isPull = proc.flowType === 'pull';

            newEdges.push({
                id: `edge_mat_${idx}`,
                source: sourceId,
                target: procId,
                type: 'smoothstep',
                markerEnd: { type: MarkerType.ArrowClosed, color: isPull ? '#ff9900' : '#fff' },
                style: {
                    strokeWidth: isPull ? 3 : 2,
                    stroke: isPull ? '#ff9900' : '#fff',
                    strokeDasharray: isPull ? '10,5' : '0'
                }
            });

            let currentLastId = procId;

            // Buffer after process
            if (proc.buffer !== 'none') {
                const bufferId = `node_buffer_${idx + 1}`;
                let symbType = VSMSymbols.INVENTORY;
                if (proc.buffer === 'supermarket') symbType = VSMSymbols.SUPERMARKET;
                if (proc.buffer === 'fifo') symbType = VSMSymbols.FIFO;

                newNodes.push({
                    id: bufferId,
                    type: proc.buffer === 'inventory' ? 'inventory' : 'generic',
                    position: { x: nodeX + 200, y: nodeY },
                    data: {
                        symbolType: symbType,
                        name: proc.buffer.toUpperCase(),
                        amount: proc.bufferQty
                    }
                });

                newEdges.push({
                    id: `edge_proc_to_buf_${idx}`,
                    source: procId,
                    target: bufferId,
                    type: 'smoothstep',
                    markerEnd: { type: MarkerType.ArrowClosed },
                    style: { strokeWidth: 2 }
                });
                currentLastId = bufferId;
            }

            if (proc.isParallel) {
                lastNodeIds.push(currentLastId);
            } else {
                lastNodeIds = [currentLastId];
                currentX += 400;
            }
        });

        // Connect all final nodes to Customer
        lastNodeIds.forEach((lastId, idx) => {
            newEdges.push({
                id: `edge_to_customer_${idx}`,
                source: lastId,
                target: customerId,
                type: 'smoothstep',
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { strokeWidth: 2 }
            });
        });

        // 5. Information Flows
        const infoType = infoFlow === 'electronic' ? 'electronic' : 'manual';

        // Customer -> Control
        newEdges.push({
            id: 'info_cust_control',
            source: customerId,
            target: controlId,
            type: 'smoothstep',
            style: { strokeDasharray: infoType === 'electronic' ? '0' : '5,5', stroke: '#0078d4' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#0078d4' }
        });

        // Control -> Supplier
        newEdges.push({
            id: 'info_control_supp',
            source: controlId,
            target: supplierId,
            type: 'smoothstep',
            style: { strokeDasharray: infoType === 'electronic' ? '0' : '5,5', stroke: '#0078d4' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#0078d4' }
        });

        // Control -> Processes (Schedule)
        processes.forEach((proc, idx) => {
            const procId = `node_proc_${idx + 1}`;
            newEdges.push({
                id: `info_control_proc_${idx}`,
                source: controlId,
                target: procId,
                type: 'smoothstep',
                style: { strokeDasharray: infoType === 'electronic' ? '0' : '5,5', stroke: '#0078d4' },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#0078d4' }
            });
        });

        setNodes(newNodes);
        setEdges(newEdges);
        pushToHistory({ nodes: newNodes, edges: newEdges });

        alert(currentLanguage === 'id' ? '✅ VSM berhasil dibuat!' : '✅ VSM generated successfully!');
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
    const Separator = () => <div style={{ width: '1px', height: '20px', backgroundColor: '#555', margin: '0 5px' }} />;

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100%', flexDirection: 'column' }}>
            {/* Top Toolbar */}
            <div style={{
                height: '50px', backgroundColor: '#333', borderBottom: '1px solid #555',
                display: 'flex', alignItems: 'center', padding: '0 20px', gap: '15px', color: 'white',
                overflowX: 'auto', flexShrink: 0
            }}>
                <div style={{
                    fontWeight: '900',
                    fontSize: '1.1rem',
                    letterSpacing: '1px',
                    color: '#0078d4',
                    marginRight: '15px',
                    fontFamily: "'Segoe UI', Roboto, sans-serif"
                }}>MAVi<span style={{ color: 'white', marginLeft: '4px' }}>VSM</span></div>

                <div style={{ display: 'flex', gap: '5px', marginRight: '15px' }}>
                    <button
                        style={{ ...btnStyle, backgroundColor: '#444' }}
                        onClick={() => setShowSidebar(!showSidebar)}
                        title={showSidebar ? (currentLanguage === 'id' ? 'Sembunyikan Toolbox' : 'Hide Toolbox') : (currentLanguage === 'id' ? 'Tampilkan Toolbox' : 'Show Toolbox')}
                    >
                        {showSidebar ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
                    </button>
                    <button
                        style={{ ...btnStyle, backgroundColor: '#444' }}
                        onClick={() => setShowNodeDetails(!showNodeDetails)}
                        title={showNodeDetails ? (currentLanguage === 'id' ? 'Sembunyikan Detail' : 'Hide Details') : (currentLanguage === 'id' ? 'Tampilkan Detail' : 'Show Details')}
                    >
                        {showNodeDetails ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>

                <div style={toolbarGroupStyle}>
                    <button style={btnStyle} onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
                        <Undo size={16} />
                    </button>
                    <button style={btnStyle} onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Y)">
                        <Redo size={16} />
                    </button>
                </div>

                <Separator />

                <div style={toolbarGroupStyle}>
                    <button style={btnStyle} onClick={() => handleAlign('left')} title="Align Left">
                        <ArrowLeft size={16} />
                    </button>
                    <button style={btnStyle} onClick={() => handleAlign('top')} title="Align Top">
                        <ArrowUp size={16} />
                    </button>
                </div>

                <Separator />

                <div style={toolbarGroupStyle}>
                    <button
                        style={{ ...btnStyle, backgroundColor: '#0078d4' }}
                        onClick={handleSaveToFile}
                        title={currentLanguage === 'id' ? 'Simpan VSM ke File' : 'Save VSM to File'}
                    >
                        <Save size={16} />
                    </button>
                    <button
                        style={{ ...btnStyle, backgroundColor: '#107c10' }}
                        onClick={() => fileInputRef.current?.click()}
                        title={currentLanguage === 'id' ? 'Buka VSM dari File' : 'Load VSM from File'}
                    >
                        <Folder size={16} />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".mavi-vsm,.json"
                        onChange={handleLoadFromFile}
                        style={{ display: 'none' }}
                    />
                </div>

                <Separator />

                <div style={toolbarGroupStyle}>
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        style={{
                            padding: '5px',
                            backgroundColor: '#444',
                            color: 'white',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            marginRight: '5px',
                            cursor: 'pointer',
                            maxWidth: '150px'
                        }}
                        title="Select AI Model"
                    >
                        {availableModels.length > 0 ? (
                            availableModels.map(model => (
                                <option key={model} value={model}>{model}</option>
                            ))
                        ) : (
                            <>
                                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash</option>
                            </>
                        )}
                    </select>

                    <button
                        style={{ ...btnStyle, backgroundColor: '#ff6b35', minWidth: 'fit-content' }}
                        onClick={() => setShowGenerateModal(true)}
                        disabled={isGenerating}
                        title={currentLanguage === 'id' ? 'Generate VSM dari Deskripsi' : 'Generate VSM from Description'}
                    >
                        {isGenerating ? '⌛' : <><Wand2 size={16} /> {currentLanguage === 'id' ? 'AI Hasilkan' : 'AI Generate'}</>}
                    </button>

                    <button
                        style={{ ...btnStyle, backgroundColor: '#0078d4', minWidth: 'fit-content' }}
                        onClick={() => setShowWizard(true)}
                        title={currentLanguage === 'id' ? 'Buat VSM dengan Wizard' : 'Create VSM with Wizard'}
                    >
                        <Layout size={16} /> {currentLanguage === 'id' ? 'Wizard' : 'Wizard'}
                    </button>

                    <button
                        style={{ ...btnStyle, backgroundColor: '#d13438' }}
                        onClick={() => imageInputRef.current?.click()}
                        disabled={isGenerating}
                        title={currentLanguage === 'id' ? 'Upload Gambar Hand-Drawn VSM' : 'Upload Hand-Drawn VSM Image'}
                    >
                        {isGenerating ? '⌛' : <><ImagePlus size={16} /> {currentLanguage === 'id' ? 'Gambar' : 'Draw'}</>}
                    </button>
                    <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleUploadImage}
                        style={{ display: 'none' }}
                    />

                    <button style={{ ...btnStyle, backgroundColor: '#8a2be2' }} onClick={handleAIAnalysis} disabled={isAnalyzing}>
                        {isAnalyzing ? '⌛' : <><Brain size={16} /> Analysis</>}
                    </button>
                    <Separator />

                    <button
                        style={{ ...btnStyle, backgroundColor: '#4b0082' }}
                        onClick={() => setShowYamazumi(true)}
                        title={currentLanguage === 'id' ? 'Grafik Penyeimbangan (Yamazumi)' : 'Balancing Chart (Yamazumi)'}
                    >
                        <BarChart3 size={16} /> {currentLanguage === 'id' ? 'Yamazumi' : 'Balancing'}
                    </button>
                    <button
                        style={{ ...btnStyle, backgroundColor: '#ed7d31' }}
                        onClick={() => setShowEPEI(true)}
                        title={currentLanguage === 'id' ? 'Analisis Fleksibilitas (EPEI)' : 'Flexibility Analysis (EPEI)'}
                    >
                        <Repeat size={16} /> EPEI
                    </button>
                    <Separator />
                    <button style={btnStyle} onClick={handleExport} title="Export as PNG">📷 {currentLanguage === 'id' ? 'Ekspor' : 'Export'}</button>
                    <button style={{ ...btnStyle, backgroundColor: '#c50f1f' }} onClick={() => { if (confirm('Clear Canvas?')) { setNodes([]); setEdges([]); pushToHistory({ nodes: [], edges: [] }); } }}>🗑️ {currentLanguage === 'id' ? 'Hapus' : 'Clear'}</button>
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
                {showSidebar && <Sidebar customLibrary={customLibrary} onAddCustom={addCustomIcon} />}

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

                    <TimelineLadder nodes={nodes} metrics={metrics} />

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
                        <MetricBox label="Takt Time" value={`${metrics.taktTime}s`} color="#ff4444" />
                        <MetricBox label="Pitch" value={`${metrics.pitch}s`} color="#ff9900" title="Pitch = Takt Time × Pack Size" />
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
                                    <PropertyField label="Performance (%)" field="performance" node={selectedNode} update={updateNodeData} commit={onPropertyChangeComplete} />
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

                            {selectedNode.data.symbolType === VSMSymbols.CUSTOMER && (
                                <>
                                    <PropertyField label="Avail. Time (min/shift)" field="availableTime" node={selectedNode} update={updateNodeData} commit={onPropertyChangeComplete} />
                                    <PropertyField label="Demand (pcs/shift)" field="demand" node={selectedNode} update={updateNodeData} commit={onPropertyChangeComplete} />
                                    <PropertyField label="Shifts" field="shifts" node={selectedNode} update={updateNodeData} commit={onPropertyChangeComplete} />
                                    <PropertyField label="Pack Size (pcs/container)" field="packSize" node={selectedNode} update={updateNodeData} commit={onPropertyChangeComplete} />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                                        <div style={{ padding: '8px', backgroundColor: '#333', borderRadius: '4px' }}>
                                            <div style={{ fontSize: '0.6rem', color: '#aaa' }}>Takt Time</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#ff4444' }}>{metrics.taktTime}s</div>
                                        </div>
                                        <div style={{ padding: '8px', backgroundColor: '#333', borderRadius: '4px' }}>
                                            <div style={{ fontSize: '0.6rem', color: '#aaa' }}>Pitch</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#ff9900' }}>{metrics.pitch}s</div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {selectedNode.data.symbolType === VSMSymbols.TRUCK && (
                                <>
                                    <PropertyField label="Frequency (x/shift)" field="frequency" node={selectedNode} update={updateNodeData} commit={onPropertyChangeComplete} />
                                    <PropertyField label="Capacity (pcs/trip)" field="capacity" node={selectedNode} update={updateNodeData} commit={onPropertyChangeComplete} />
                                    <PropertyField label="Travel Lead Time (min)" field="leadTime" node={selectedNode} update={updateNodeData} commit={onPropertyChangeComplete} />
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

                    <YamazumiChart
                        isOpen={showYamazumi}
                        onClose={() => setShowYamazumi(false)}
                        nodes={nodes}
                        taktTime={metrics.taktTime}
                        currentLanguage={currentLanguage}
                    />

                    <EPEIAnalysis
                        isOpen={showEPEI}
                        onClose={() => setShowEPEI(false)}
                        nodes={nodes}
                        currentLanguage={currentLanguage}
                    />

                    <VSMWizard
                        isOpen={showWizard}
                        onClose={() => setShowWizard(false)}
                        onGenerate={handleWizardGenerate}
                        currentLanguage={currentLanguage}
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

                                            <h3 style={{ color: '#ff9900' }}>🚀 Fitur TPS Lanjutan</h3>
                                            <ul>
                                                <li><strong>📊 Yamazumi Chart</strong> - Klik tombol "Yamazumi" untuk melihat keseimbangan beban kerja vs Takt Time.</li>
                                                <li><strong>🔄 EPEI Analysis</strong> - Analisis seberapa sering Anda bisa mengganti produk (Every Part Every Interval).</li>
                                                <li><strong>🎯 Pitch Calculation</strong> - Masukkan "Pack Size" di Customer node untuk melihat "Heartbeat" produksi.</li>
                                                <li><strong>🚛 Milk Run</strong> - Gunakan simbol Truck untuk input frekuensi dan kapasitas logistik.</li>
                                                <li><strong>🕒 Timeline Ladder</strong> - Tangga waktu otomatis di bagian bawah menunjukkan Lead Time vs VA Time.</li>
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

                                            <h3 style={{ color: '#4fc3f7' }}>💡 Contoh Prompt "Ultimate Automotive"</h3>
                                            <div style={{ backgroundColor: '#2d2d2d', padding: '15px', borderRadius: '8px', marginTop: '10px', fontSize: '0.85rem' }}>
                                                <code>
                                                    Buatkan VSM komponen otomotif:<br /><br />
                                                    CUSTOMER: demand 1200 unit/hari, 2 shift (8 jam), Pack Size: 24 (untuk Pitch)<br /><br />
                                                    LOGISTICS: Supplier Baja, Truck Milk Run frekuensi 4x/hari, kapasitas 500<br /><br />
                                                    PROSES:<br />
                                                    1. Stamping: CT=15s, CO=45min (EPEI), Performance=95%, Op=1, Inventory=600<br />
                                                    2. Welding: CT=40s, CO=15min, Op=3 (Yamazumi), Performance=98%, Supermarket=400<br />
                                                    3. Assembly: CT=55s, CO=5min, Op=5, Performance=92%, FIFO=100<br /><br />
                                                    INFORMATION: Production Control dengan Heijunka Box & Kanban Signal
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

                                            <h3 style={{ color: '#ff9900' }}>🚀 Advanced TPS Features</h3>
                                            <ul>
                                                <li><strong>📊 Yamazumi Chart</strong> - Click "Yamazumi" to visualize work balance vs Takt Time.</li>
                                                <li><strong>🔄 EPEI Analysis</strong> - Analyze production flexibility (Every Part Every Interval).</li>
                                                <li><strong>🎯 Pitch Calculation</strong> - Set "Pack Size" in Customer node to calculate the production heartbeat.</li>
                                                <li><strong>🚛 Milk Run</strong> - Use the Truck symbol for logistics frequency and capacity data.</li>
                                                <li><strong>🕒 Timeline Ladder</strong> - Automatic ladder at the bottom shows Lead Time vs VA Time steps.</li>
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

                                            <h3 style={{ color: '#4fc3f7' }}>💡 "Ultimate Automotive" Prompt Example</h3>
                                            <div style={{ backgroundColor: '#2d2d2d', padding: '15px', borderRadius: '8px', marginTop: '10px', fontSize: '0.85rem' }}>
                                                <code>
                                                    Create VSM for automotive components:<br /><br />
                                                    CUSTOMER: demand 1200 units/day, 2 shifts (8h), Pack Size: 24 (for Pitch)<br /><br />
                                                    LOGISTICS: Steel Supplier, Milk Run Truck frequency 4x/day, capacity 500<br /><br />
                                                    PROCESSES:<br />
                                                    1. Stamping: CT=15s, CO=45min (EPEI), Performance=95%, Op=1, Inv=600<br />
                                                    2. Welding: CT=40s, CO=15min, Op=3 (Yamazumi), Performance=98%, Supermarket=400<br />
                                                    3. Assembly: CT=55s, CO=5min, Op=5, Performance=92%, FIFO=100<br /><br />
                                                    INFORMATION: Production Control with Heijunka Box & Kanban Signal
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
        </div >
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
