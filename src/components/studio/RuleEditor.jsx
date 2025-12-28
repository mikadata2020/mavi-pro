import React, { useState } from 'react';
import { Plus, Trash2, ArrowRight, Check } from 'lucide-react';
import { RULE_TYPES, JOINTS } from '../../utils/studio/ModelBuilderEngine';
import { getDetectableClasses } from '../../utils/objectDetector';

const RuleEditor = ({ states, transitions, onAddTransition, onDeleteTransition, onUpdateTransition }) => {
    const [fromState, setFromState] = useState('');
    const [toState, setToState] = useState('');
    const [editingTransition, setEditingTransition] = useState(null);

    const handleCreateTransition = () => {
        if (fromState && toState) {
            onAddTransition(fromState, toState);
            setFromState('');
            setToState('');
        }
    };

    const handleAddRule = (transitionId) => {
        const transition = transitions.find(t => t.id === transitionId);
        if (!transition) return;

        const newRule = {
            id: `rule_${Date.now()}`,
            type: 'POSE_ANGLE',
            params: {
                jointA: 'right_shoulder',
                jointB: 'right_elbow',
                jointC: 'right_wrist',
                operator: '<',
                value: 90
            }
        };

        const updatedCondition = {
            ...transition.condition,
            rules: [...transition.condition.rules, newRule]
        };

        onUpdateTransition(transitionId, { condition: updatedCondition });
    };

    const handleUpdateRule = (transitionId, ruleId, updates) => {
        const transition = transitions.find(t => t.id === transitionId);
        if (!transition) return;

        const updatedRules = transition.condition.rules.map(r =>
            r.id === ruleId ? { ...r, ...updates } : r
        );

        onUpdateTransition(transitionId, {
            condition: { ...transition.condition, rules: updatedRules }
        });
    };

    const handleDeleteRule = (transitionId, ruleId) => {
        const transition = transitions.find(t => t.id === transitionId);
        if (!transition) return;

        const updatedRules = transition.condition.rules.filter(r => r.id !== ruleId);

        onUpdateTransition(transitionId, {
            condition: { ...transition.condition, rules: updatedRules }
        });
    };

    const styles = {
        container: {
            padding: '20px',
            color: 'white',
            fontFamily: 'Inter, sans-serif',
            height: '100%',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column'
        },
        createSection: {
            backgroundColor: '#1f2937',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '24px',
            border: '1px solid #374151'
        },
        sectionTitle: {
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '12px',
            color: '#60a5fa'
        },
        controls: {
            display: 'flex',
            gap: '12px',
            alignItems: 'center'
        },
        select: {
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            backgroundColor: '#111827',
            border: '1px solid #4b5563',
            color: 'white',
            outline: 'none'
        },
        button: {
            padding: '10px 20px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        transitionList: {
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
        },
        transitionCard: {
            backgroundColor: '#1f2937',
            borderRadius: '12px',
            border: '1px solid #374151',
            overflow: 'hidden'
        },
        cardHeader: {
            padding: '12px 16px',
            backgroundColor: 'rgba(55, 65, 81, 0.5)',
            borderBottom: '1px solid #374151',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        flow: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '600'
        },
        stateBadge: {
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: 'rgba(96, 165, 250, 0.2)',
            color: '#60a5fa',
            fontSize: '0.9rem'
        },
        rulesContainer: {
            padding: '16px',
            maxHeight: '350px',
            overflowY: 'scroll',
            scrollbarWidth: 'thin',
            scrollbarColor: '#4b5563 transparent'
        },
        ruleItem: {
            backgroundColor: '#111827',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '8px',
            fontSize: '0.9rem'
        },
        ruleControls: {
            display: 'grid',
            gridTemplateColumns: '130px 1fr 30px',
            gap: '8px',
            alignItems: 'start',
            marginTop: '8px'
        },
        paramSelect: {
            padding: '6px',
            borderRadius: '4px',
            backgroundColor: '#1f2937',
            border: '1px solid #4b5563',
            color: 'white',
            fontSize: '0.85rem'
        },
        input: {
            padding: '6px',
            borderRadius: '4px',
            backgroundColor: '#1f2937',
            border: '1px solid #4b5563',
            color: 'white',
            width: '100%',
            fontSize: '0.85rem'
        }
    };

    const objectClasses = getDetectableClasses();

    const getRuleDescription = (rule) => {
        if (!rule || !rule.params) return 'Invalid rule';

        switch (rule.type) {
            case 'POSE_ANGLE':
                return `Angle ${rule.params.jointA}-${rule.params.jointB}-${rule.params.jointC} ${rule.params.operator || '<'} ${rule.params.value || 90}°`;

            case 'POSE_RELATION':
                const comp = rule.params.component || 'y';
                if (rule.params.targetType === 'POINT' && rule.params.jointB) {
                    return `${rule.params.jointA}.${comp} ${rule.params.operator || '<'} ${rule.params.jointB}.${comp}`;
                } else {
                    return `${rule.params.jointA}.${comp} ${rule.params.operator || '<'} ${rule.params.value || 0}`;
                }

            case 'POSE_VELOCITY':
                return `${rule.params.joint} velocity ${rule.params.operator || '>'} ${rule.params.value || 0} u/s`;

            case 'OBJECT_PROXIMITY':
                return `${rule.params.joint} to ${rule.params.objectClass} ${rule.params.operator || '<'} ${rule.params.value || 0}`;

            default:
                return `Unknown rule type: ${rule.type}`;
        }
    };

    const renderRuleParams = (rule, transitionId) => {
        const type = RULE_TYPES[rule.type];

        return (
            <div style={styles.ruleControls}>
                <select
                    style={styles.paramSelect}
                    value={rule.type}
                    onChange={(e) => handleUpdateRule(transitionId, rule.id, { type: e.target.value })}
                >
                    {Object.entries(RULE_TYPES).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                    ))}
                </select>

                {/* Dynamic params based on type */}
                {rule.type === 'POSE_ANGLE' && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <select
                            style={styles.paramSelect}
                            value={rule.params.jointA}
                            onChange={(e) => handleUpdateRule(transitionId, rule.id, { params: { ...rule.params, jointA: e.target.value } })}
                        >
                            {JOINTS.map(j => <option key={j} value={j}>{j}</option>)}
                        </select>
                        <select
                            style={styles.paramSelect}
                            value={rule.params.jointB} // Vertex
                            onChange={(e) => handleUpdateRule(transitionId, rule.id, { params: { ...rule.params, jointB: e.target.value } })}
                        >
                            {JOINTS.map(j => <option key={j} value={j}>{j}</option>)}
                        </select>
                        <select
                            style={styles.paramSelect}
                            value={rule.params.jointC}
                            onChange={(e) => handleUpdateRule(transitionId, rule.id, { params: { ...rule.params, jointC: e.target.value } })}
                        >
                            {JOINTS.map(j => <option key={j} value={j}>{j}</option>)}
                        </select>
                        <span style={{ color: '#9ca3af', alignSelf: 'center' }}>Angle</span>
                    </div>
                )}

                {rule.type === 'POSE_RELATION' && (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Point A */}
                        <select
                            style={styles.paramSelect}
                            value={rule.params.jointA}
                            onChange={(e) => handleUpdateRule(transitionId, rule.id, { params: { ...rule.params, jointA: e.target.value } })}
                        >
                            <option value="">Select Point...</option>
                            {JOINTS.map(j => <option key={j} value={j}>{j}</option>)}
                        </select>

                        {/* Component */}
                        <select
                            style={{ ...styles.paramSelect, width: '50px' }}
                            value={rule.params.component || 'y'}
                            onChange={(e) => handleUpdateRule(transitionId, rule.id, { params: { ...rule.params, component: e.target.value } })}
                        >
                            <option value="x">X</option>
                            <option value="y">Y</option>
                            <option value="z">Z</option>
                            <option value="score">Conf</option>
                        </select>

                        {/* Operator */}
                        <select
                            style={{ ...styles.paramSelect, width: '50px' }}
                            value={rule.params.operator || '<'}
                            onChange={(e) => handleUpdateRule(transitionId, rule.id, { params: { ...rule.params, operator: e.target.value } })}
                        >
                            {['>', '<', '=', '!=', '>='].map(op => <option key={op} value={op}>{op}</option>)}
                        </select>

                        {/* Target Type Toggle */}
                        <select
                            style={{ ...styles.paramSelect, width: '80px', color: '#60a5fa' }}
                            value={rule.params.targetType || 'VALUE'}
                            onChange={(e) => handleUpdateRule(transitionId, rule.id, { params: { ...rule.params, targetType: e.target.value, value: 0, jointB: '' } })}
                        >
                            <option value="VALUE">Value</option>
                            <option value="POINT">Point</option>
                        </select>

                        {/* Target Input */}
                        {rule.params.targetType === 'POINT' ? (
                            <select
                                style={styles.paramSelect}
                                value={rule.params.jointB || ''}
                                onChange={(e) => handleUpdateRule(transitionId, rule.id, { params: { ...rule.params, jointB: e.target.value } })}
                            >
                                <option value="">Target Point...</option>
                                {JOINTS.map(j => <option key={j} value={j}>{j}</option>)}
                            </select>
                        ) : (
                            <input
                                type="number"
                                step="0.01"
                                style={{ ...styles.input, width: '70px' }}
                                value={rule.params.value || 0}
                                onChange={(e) => handleUpdateRule(transitionId, rule.id, { params: { ...rule.params, value: parseFloat(e.target.value) } })}
                            />
                        )}
                    </div>
                )}

                {rule.type === 'POSE_VELOCITY' && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <select
                            style={styles.paramSelect}
                            value={rule.params.joint}
                            onChange={(e) => handleUpdateRule(transitionId, rule.id, { params: { ...rule.params, joint: e.target.value } })}
                        >
                            {JOINTS.map(j => <option key={j} value={j}>{j}</option>)}
                        </select>

                        <select
                            style={{ ...styles.paramSelect, width: '50px' }}
                            value={rule.params.operator || '>'}
                            onChange={(e) => handleUpdateRule(transitionId, rule.id, { params: { ...rule.params, operator: e.target.value } })}
                        >
                            {['>', '<'].map(op => <option key={op} value={op}>{op}</option>)}
                        </select>

                        <input
                            type="number"
                            step="0.1"
                            style={styles.input}
                            value={rule.params.value || 0}
                            onChange={(e) => handleUpdateRule(transitionId, rule.id, { params: { ...rule.params, value: parseFloat(e.target.value) } })}
                            placeholder="Speed"
                        />
                        <span style={{ fontSize: '0.8rem', color: '#9ca3af', alignSelf: 'center' }}>u/s</span>
                    </div>
                )}

                {rule.type === 'OBJECT_PROXIMITY' && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <select
                            style={styles.paramSelect}
                            value={rule.params.joint}
                            onChange={(e) => handleUpdateRule(transitionId, rule.id, { params: { ...rule.params, joint: e.target.value } })}
                        >
                            {JOINTS.map(j => <option key={j} value={j}>{j}</option>)}
                        </select>
                        <span style={{ color: '#9ca3af' }}>to</span>
                        <select
                            style={styles.paramSelect}
                            value={rule.params.objectClass}
                            onChange={(e) => handleUpdateRule(transitionId, rule.id, { params: { ...rule.params, objectClass: e.target.value } })}
                        >
                            {objectClasses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {/* Operator & Value for Dist */}
                        <select
                            style={styles.paramSelect}
                            value={rule.params.operator}
                            onChange={(e) => handleUpdateRule(transitionId, rule.id, { params: { ...rule.params, operator: e.target.value } })}
                            className="col-span-1"
                        >
                            {['>', '<'].map(op => <option key={op} value={op}>{op}</option>)}
                        </select>

                        <input
                            type="number"
                            style={styles.input}
                            value={rule.params.value}
                            onChange={(e) => handleUpdateRule(transitionId, rule.id, { params: { ...rule.params, value: parseFloat(e.target.value) } })}
                            placeholder="Dist"
                        />
                    </div>
                )}

                <button
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
                    onClick={() => handleDeleteRule(transitionId, rule.id)}
                >
                    <Trash2 size={16} />
                </button>
            </div>
        );
    };

    return (
        <div style={styles.container} className="custom-scrollbar">
            {/* Create Transition */}
            <div style={styles.createSection}>
                <h3 style={styles.sectionTitle}>Add State Transition</h3>
                <div style={styles.controls}>
                    <select
                        style={styles.select}
                        value={fromState}
                        onChange={(e) => setFromState(e.target.value)}
                    >
                        <option value="">From State...</option>
                        {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <ArrowRight size={20} color="#6b7280" />
                    <select
                        style={styles.select}
                        value={toState}
                        onChange={(e) => setToState(e.target.value)}
                    >
                        <option value="">To State...</option>
                        {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <button style={styles.button} onClick={handleCreateTransition}>
                        <Plus size={18} /> Add
                    </button>
                </div>
            </div>

            {/* List Transitions */}
            <div style={styles.transitionList}>
                {transitions.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                        No transitions defined
                    </div>
                )}

                {transitions.map(transition => {
                    const fromName = states.find(s => s.id === transition.from)?.name || 'Unknown';
                    const toName = states.find(s => s.id === transition.to)?.name || 'Unknown';

                    return (
                        <div key={transition.id} style={styles.transitionCard}>
                            <div style={styles.cardHeader}>
                                <div style={styles.flow}>
                                    <span style={styles.stateBadge}>{fromName}</span>
                                    <ArrowRight size={16} color="#9ca3af" />
                                    <span style={styles.stateBadge}>{toName}</span>
                                </div>
                                <button
                                    style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
                                    onClick={() => onDeleteTransition(transition.id)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div style={styles.rulesContainer} className="custom-scrollbar">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px dashed #374151' }}>
                                    <span style={{ fontSize: '0.85rem', color: '#eab308' }}>⚡ Hysteresis (Hold Time):</span>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        style={{ ...styles.input, width: '60px' }}
                                        value={transition.condition.holdTime || 0}
                                        onChange={(e) => onUpdateTransition(transition.id, {
                                            condition: { ...transition.condition, holdTime: parseFloat(e.target.value) }
                                        })}
                                    />
                                    <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>seconds (Buffer)</span>
                                </div>

                                <div style={{ marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                        <h4 style={{ margin: 0, color: '#9ca3af', fontSize: '0.85rem' }}>Conditions</h4>

                                        {/* Logic Operator Toggle */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                                            <span style={{ color: '#6b7280' }}>Match:</span>
                                            <div style={{ display: 'flex', backgroundColor: '#111827', borderRadius: '4px', border: '1px solid #4b5563', overflow: 'hidden' }}>
                                                <button
                                                    onClick={() => onUpdateTransition(transition.id, { condition: { ...transition.condition, operator: 'AND' } })}
                                                    style={{
                                                        background: (!transition.condition.operator || transition.condition.operator === 'AND') ? '#1d4ed8' : 'transparent',
                                                        color: 'white', border: 'none', padding: '2px 8px', cursor: 'pointer'
                                                    }}
                                                >ALL (AND)</button>
                                                <button
                                                    onClick={() => onUpdateTransition(transition.id, { condition: { ...transition.condition, operator: 'OR' } })}
                                                    style={{
                                                        background: (transition.condition.operator === 'OR') ? '#1d4ed8' : 'transparent',
                                                        color: 'white', border: 'none', padding: '2px 8px', cursor: 'pointer'
                                                    }}
                                                >ANY (OR)</button>
                                            </div>
                                        </div>
                                    </div>

                                    {transition.condition.rules.map((rule, idx) => (
                                        <div key={rule.id || idx} style={styles.ruleItem}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #374151', paddingBottom: '4px' }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#60a5fa' }}>
                                                    Rule #{idx + 1}: {rule.type}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#9ca3af', cursor: 'pointer' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={!!rule.invert}
                                                            onChange={(e) => handleUpdateRule(transition.id, rule.id, { invert: e.target.checked })}
                                                            style={{ cursor: 'pointer', accentColor: '#f59e0b' }}
                                                        />
                                                        Invert (NOT)
                                                    </label>
                                                </div>
                                            </div>
                                            {renderRuleParams(rule, transition.id)}
                                        </div>
                                    ))}
                                    {transition.condition.rules.length === 0 && <div style={{ color: '#6b7280', fontSize: '0.8rem', fontStyle: 'italic' }}>No conditions added.</div>}

                                    {/* Add Rule Button */}
                                    <button
                                        onClick={() => handleAddRule(transition.id)}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            marginTop: '8px',
                                            background: 'rgba(37, 99, 235, 0.1)',
                                            color: '#60a5fa',
                                            border: '1px dashed #2563eb',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            fontSize: '0.85rem',
                                            fontWeight: '500'
                                        }}
                                    >
                                        <Plus size={14} /> Add Rule
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RuleEditor;
