import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle, ArrowRight, Play, Zap } from 'lucide-react';

/**
 * Visual State Diagram Component
 * Displays FSM states as draggable nodes with transition arrows
 */
const StateDiagram = ({
    states = [],
    transitions = [],
    currentState = null,
    onSelectState,
    onSelectTransition,
    selectedStateId,
    selectedTransitionId,
    onUpdateStatePosition
}) => {
    const svgRef = useRef(null);
    const [nodePositions, setNodePositions] = useState({});
    const [dragging, setDragging] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Initialize positions from props or default layout
    useEffect(() => {
        if (states.length > 0) {
            setNodePositions(prev => {
                const newPositions = { ...prev };
                let needsLayout = false;

                // Check which states need positions
                const statesNeedingLayout = states.filter(s => {
                    if (s.position) {
                        newPositions[s.id] = s.position;
                        return false;
                    }
                    return !newPositions[s.id];
                });

                if (statesNeedingLayout.length > 0) {
                    const centerX = 300;
                    const centerY = 200;
                    const radius = 150;

                    statesNeedingLayout.forEach((state, index) => {
                        const angle = (index / statesNeedingLayout.length) * 2 * Math.PI - Math.PI / 2;
                        newPositions[state.id] = {
                            x: centerX + radius * Math.cos(angle),
                            y: centerY + radius * Math.sin(angle)
                        };
                    });
                }
                return newPositions;
            });
        }
    }, [states]);

    // Validation - detect orphan states
    const getOrphanStates = useCallback(() => {
        const hasIncoming = new Set();
        const hasOutgoing = new Set();

        transitions.forEach(t => {
            hasOutgoing.add(t.from);
            hasIncoming.add(t.to);
        });

        return states.filter(s => {
            const isStart = s.id === 's_start' || s.name.toLowerCase().includes('start');
            if (isStart) return !hasOutgoing.has(s.id);
            return !hasIncoming.has(s.id) && !hasOutgoing.has(s.id);
        }).map(s => s.id);
    }, [states, transitions]);

    const orphanStates = getOrphanStates();

    // Validation - detect unreachable states
    const getUnreachableStates = useCallback(() => {
        if (states.length === 0) return [];

        const startState = states.find(s => s.id === 's_start' || s.name.toLowerCase().includes('start')) || states[0];
        const reachable = new Set([startState.id]);
        const queue = [startState.id];

        while (queue.length > 0) {
            const current = queue.shift();
            transitions.filter(t => t.from === current).forEach(t => {
                if (!reachable.has(t.to)) {
                    reachable.add(t.to);
                    queue.push(t.to);
                }
            });
        }

        return states.filter(s => !reachable.has(s.id)).map(s => s.id);
    }, [states, transitions]);

    const unreachableStates = getUnreachableStates();

    // Validation - detect potential conflicts (branching without clear mutually exclusive rules)
    // Simplified: Warning if state has > 1 outgoing transition
    const getConflictingStates = useCallback(() => {
        const outgoingCount = {};
        transitions.forEach(t => {
            outgoingCount[t.from] = (outgoingCount[t.from] || 0) + 1;
        });

        // Return states with > 1 outgoing transition as "Potential Conflict"
        // In a real pro app, we would analyze the logic (e.g. x > 5 vs x < 5 is fine)
        // Here we just warn the user to check logic.
        return Object.keys(outgoingCount).filter(id => outgoingCount[id] > 1);
    }, [transitions]);

    const conflictingStates = getConflictingStates();

    // Mouse handlers for dragging
    const handleMouseDown = (e, stateId) => {
        e.stopPropagation();
        const pos = nodePositions[stateId] || { x: 0, y: 0 };
        const svgRect = svgRef.current.getBoundingClientRect();
        setDragging(stateId);
        setDragOffset({
            x: e.clientX - svgRect.left - pos.x,
            y: e.clientY - svgRect.top - pos.y
        });
    };

    const handleMouseMove = (e) => {
        if (!dragging) return;
        const svgRect = svgRef.current.getBoundingClientRect();
        const newX = e.clientX - svgRect.left - dragOffset.x;
        const newY = e.clientY - svgRect.top - dragOffset.y;

        setNodePositions(prev => ({
            ...prev,
            [dragging]: { x: Math.max(50, Math.min(550, newX)), y: Math.max(30, Math.min(370, newY)) }
        }));
    };

    const handleMouseUp = () => {
        if (dragging && onUpdateStatePosition) {
            onUpdateStatePosition(dragging, nodePositions[dragging]);
        }
        setDragging(null);
    };

    // Calculate arrow path between two nodes
    const getArrowPath = (fromId, toId) => {
        const from = nodePositions[fromId];
        const to = nodePositions[toId];
        if (!from || !to) return '';

        const nodeRadius = 40;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist === 0) return '';

        // Calculate start and end points on the node edges
        const startX = from.x + (dx / dist) * nodeRadius;
        const startY = from.y + (dy / dist) * nodeRadius;
        const endX = to.x - (dx / dist) * (nodeRadius + 10);
        const endY = to.y - (dy / dist) * (nodeRadius + 10);

        // Curved path for better visibility
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        const offsetX = -dy / dist * 20;
        const offsetY = dx / dist * 20;

        return `M ${startX} ${startY} Q ${midX + offsetX} ${midY + offsetY} ${endX} ${endY}`;
    };

    // Get state color based on status
    const getStateColor = (stateId) => {
        if (currentState === stateId) return '#22c55e'; // Active - Green
        if (selectedStateId === stateId) return '#3b82f6'; // Selected - Blue
        if (orphanStates.includes(stateId)) return '#ef4444'; // Orphan - Red
        if (unreachableStates.includes(stateId)) return '#f59e0b'; // Unreachable - Orange
        if (conflictingStates.includes(stateId)) return '#eab308'; // Conflict - Yellow
        return '#6b7280'; // Default - Gray
    };

    const healthScore = Math.round(((states.length - orphanStates.length - unreachableStates.length - (conflictingStates.length * 0.5)) / Math.max(states.length, 1)) * 100);

    return (
        <div style={{
            backgroundColor: '#111827',
            borderRadius: '8px',
            padding: '15px',
            border: '1px solid #374151'
        }}>
            {/* Header with Health Score */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
                paddingBottom: '10px',
                borderBottom: '1px solid #374151'
            }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#e5e7eb' }}>
                    📊 State Diagram
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {orphanStates.length > 0 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: 'rgba(239, 68, 68, 0.2)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            color: '#ef4444'
                        }}>
                            <AlertTriangle size={14} />
                            {orphanStates.length} Orphan
                        </div>
                    )}
                    {unreachableStates.length > 0 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: 'rgba(245, 158, 11, 0.2)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            color: '#f59e0b'
                        }}>
                            <AlertTriangle size={14} />
                            {unreachableStates.length} Unreachable
                        </div>
                    )}
                    {conflictingStates.length > 0 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: 'rgba(234, 179, 8, 0.2)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            color: '#eab308'
                        }}>
                            <AlertTriangle size={14} />
                            {conflictingStates.length} Logic Check
                        </div>
                    )}
                    {conflictingStates.length > 0 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: 'rgba(234, 179, 8, 0.2)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            color: '#eab308'
                        }}>
                            <AlertTriangle size={14} />
                            {conflictingStates.length} Logic Check
                        </div>
                    )}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        backgroundColor: healthScore === 100 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        color: healthScore === 100 ? '#22c55e' : '#9ca3af'
                    }}>
                        {healthScore === 100 ? <CheckCircle size={14} /> : <Zap size={14} />}
                        Health: {healthScore}%
                    </div>
                </div>
            </div>

            {/* SVG Diagram */}
            <svg
                ref={svgRef}
                width="100%"
                height="400"
                viewBox="0 0 600 400"
                style={{
                    backgroundColor: '#0f172a',
                    borderRadius: '6px',
                    cursor: dragging ? 'grabbing' : 'default'
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Arrow marker definition */}
                <defs>
                    <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                    >
                        <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
                    </marker>
                    <marker
                        id="arrowhead-active"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                    >
                        <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
                    </marker>
                </defs>

                {/* Transition arrows */}
                {transitions.map(t => {
                    const isActive = currentState === t.from;
                    const path = getArrowPath(t.from, t.to);
                    const fromPos = nodePositions[t.from];
                    const toPos = nodePositions[t.to];
                    const midX = fromPos && toPos ? (fromPos.x + toPos.x) / 2 : 0;
                    const midY = fromPos && toPos ? (fromPos.y + toPos.y) / 2 - 15 : 0;

                    return (
                        <g key={t.id}>
                            <path
                                d={path}
                                fill="none"
                                stroke={selectedTransitionId === t.id ? '#3b82f6' : (isActive ? '#22c55e' : '#4b5563')}
                                strokeWidth={selectedTransitionId === t.id ? 3 : 2}
                                markerEnd={isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                                style={{ cursor: 'pointer' }}
                                onClick={() => onSelectTransition && onSelectTransition(t.id)}
                            />
                            {/* Transition label */}
                            <text
                                x={midX}
                                y={midY}
                                textAnchor="middle"
                                fontSize="10"
                                fill="#9ca3af"
                                style={{ pointerEvents: 'none' }}
                            >
                                {t.condition?.rules?.length || 0} rules
                            </text>
                        </g>
                    );
                })}

                {/* State nodes */}
                {states.map(state => {
                    const pos = nodePositions[state.id] || { x: 100, y: 100 };
                    const color = getStateColor(state.id);
                    const isStart = state.id === 's_start' || state.name.toLowerCase().includes('start');

                    return (
                        <g
                            key={state.id}
                            transform={`translate(${pos.x}, ${pos.y})`}
                            style={{ cursor: 'grab' }}
                            onMouseDown={(e) => handleMouseDown(e, state.id)}
                            onClick={() => onSelectState && onSelectState(state.id)}
                        >
                            {/* Glow effect for active state */}
                            {currentState === state.id && (
                                <circle
                                    r="50"
                                    fill="none"
                                    stroke="#22c55e"
                                    strokeWidth="2"
                                    opacity="0.5"
                                >
                                    <animate
                                        attributeName="r"
                                        values="45;55;45"
                                        dur="1.5s"
                                        repeatCount="indefinite"
                                    />
                                    <animate
                                        attributeName="opacity"
                                        values="0.5;0.2;0.5"
                                        dur="1.5s"
                                        repeatCount="indefinite"
                                    />
                                </circle>
                            )}

                            {/* Node circle */}
                            <circle
                                r="40"
                                fill="#1f2937"
                                stroke={color}
                                strokeWidth="3"
                            />

                            {/* Start indicator */}
                            {isStart && (
                                <circle
                                    r="35"
                                    fill="none"
                                    stroke={color}
                                    strokeWidth="1"
                                    strokeDasharray="4 4"
                                />
                            )}

                            {/* State name */}
                            <text
                                textAnchor="middle"
                                dy="0.35em"
                                fontSize="11"
                                fontWeight="600"
                                fill="#e5e7eb"
                                style={{ pointerEvents: 'none' }}
                            >
                                {state.name.length > 10 ? state.name.substring(0, 10) + '...' : state.name}
                            </text>

                            {/* Warning badge for orphan/unreachable */}
                            {(orphanStates.includes(state.id) || unreachableStates.includes(state.id)) && (
                                <g transform="translate(28, -28)">
                                    <circle r="10" fill={orphanStates.includes(state.id) ? '#ef4444' : '#f59e0b'} />
                                    <text
                                        textAnchor="middle"
                                        dy="0.35em"
                                        fontSize="12"
                                        fill="white"
                                    >
                                        !
                                    </text>
                                </g>
                            )}

                            {/* Warning badge for conflict */}
                            {conflictingStates.includes(state.id) && !orphanStates.includes(state.id) && !unreachableStates.includes(state.id) && (
                                <g transform="translate(28, -28)">
                                    <circle r="10" fill="#eab308" />
                                    <text
                                        textAnchor="middle"
                                        dy="0.35em"
                                        fontSize="12"
                                        fill="black"
                                        fontWeight="bold"
                                    >
                                        ?
                                    </text>
                                </g>
                            )}

                            {/* Play icon for active */}
                            {currentState === state.id && (
                                <g transform="translate(0, 25)">
                                    <Play size={12} fill="#22c55e" />
                                </g>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Legend */}
            <div style={{
                display: 'flex',
                gap: '15px',
                marginTop: '10px',
                fontSize: '0.75rem',
                color: '#9ca3af',
                flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#6b7280' }}></div>
                    Normal
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
                    Active
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></div>
                    Selected
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                    Orphan (No Connections)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
                    Unreachable
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#eab308' }}></div>
                    Branching (Check Logic)
                </div>
            </div>
        </div>
    );
};

export default StateDiagram;
