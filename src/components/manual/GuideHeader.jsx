import React, { useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Plus } from 'lucide-react';

const SortableItem = ({ id, children, isEditing, onRemove, onLabelChange, label }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1000 : 'auto',
        position: 'relative',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <div style={{
                position: 'relative',
                padding: '4px',
                border: isDragging ? '1px solid #0078d4' : '1px solid transparent',
                borderRadius: '4px',
                backgroundColor: isDragging ? '#2d2d2d' : 'transparent',
                transition: 'all 0.2s ease'
            }}>
                {isEditing && (
                    <>
                        <div
                            {...attributes}
                            {...listeners}
                            style={{
                                position: 'absolute',
                                left: '-18px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                cursor: 'grab',
                                color: '#555',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                zIndex: 10
                            }}
                        >
                            <GripVertical size={14} />
                        </div>
                        <button
                            onClick={() => onRemove(id)}
                            style={{
                                position: 'absolute',
                                right: '-8px',
                                top: '-8px',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                backgroundColor: '#d13438',
                                color: '#fff',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                zIndex: 20,
                                fontSize: '10px'
                            }}
                        >
                            <X size={10} />
                        </button>
                    </>
                )}

                {isEditing ? (
                    <div>
                        <input
                            value={label}
                            onChange={(e) => onLabelChange(id, e.target.value)}
                            style={{
                                ...labelStyle,
                                backgroundColor: '#444',
                                border: 'none',
                                padding: '2px 5px',
                                borderRadius: '2px',
                                width: '100%',
                                color: '#aaa',
                                marginBottom: '4px'
                            }}
                        />
                        {children}
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
};

const GuideHeader = ({ headerInfo, onChange }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEditingLayout, setIsEditingLayout] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleChange = (field, value) => {
        onChange({ ...headerInfo, [field]: value });
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = headerInfo.headerOrder.findIndex(item => item.id === active.id);
            const newIndex = headerInfo.headerOrder.findIndex(item => item.id === over.id);

            const newOrder = arrayMove(headerInfo.headerOrder, oldIndex, newIndex);
            onChange({ ...headerInfo, headerOrder: newOrder });
        }
    };

    const handleRemoveField = (id) => {
        const newOrder = headerInfo.headerOrder.filter(item => item.id !== id);
        onChange({ ...headerInfo, headerOrder: newOrder });
    };

    const handleLabelChange = (id, newLabel) => {
        const newOrder = headerInfo.headerOrder.map(item =>
            item.id === id ? { ...item, label: newLabel } : item
        );
        onChange({ ...headerInfo, headerOrder: newOrder });
    };

    const handleAddField = () => {
        const newId = `custom_${Math.random().toString(36).substr(2, 5)}`;
        const newOrder = [...headerInfo.headerOrder, { id: newId, label: 'New Field' }];
        onChange({ ...headerInfo, headerOrder: newOrder });
    };

    const renderInput = (field) => {
        const { id, label } = field;

        switch (id) {
            case 'documentNumber':
                return (
                    <div>
                        {!isEditingLayout && <label style={labelStyle}>{label}</label>}
                        <input
                            value={headerInfo.documentNumber || ''}
                            onChange={(e) => handleChange('documentNumber', e.target.value)}
                            placeholder="DOC-001"
                            style={inputStyle}
                        />
                    </div>
                );
            case 'version':
                return (
                    <div>
                        {!isEditingLayout && <label style={labelStyle}>{label}</label>}
                        <input
                            value={headerInfo.version || '1.0'}
                            onChange={(e) => handleChange('version', e.target.value)}
                            placeholder="1.0"
                            style={inputStyle}
                        />
                    </div>
                );
            case 'status':
                return (
                    <div>
                        {!isEditingLayout && <label style={labelStyle}>{label}</label>}
                        <select
                            value={headerInfo.status || 'Draft'}
                            onChange={(e) => handleChange('status', e.target.value)}
                            style={inputStyle}
                        >
                            <option value="Draft">Draft</option>
                            <option value="Proposed">Proposed</option>
                            <option value="In Review">In Review</option>
                            <option value="Approved">Approved</option>
                            <option value="Released">Released</option>
                        </select>
                    </div>
                );
            case 'author':
                return (
                    <div>
                        {!isEditingLayout && <label style={labelStyle}>{label}</label>}
                        <input
                            value={headerInfo.author || ''}
                            onChange={(e) => handleChange('author', e.target.value)}
                            placeholder="Author Name"
                            style={inputStyle}
                        />
                    </div>
                );
            case 'revisionDate':
                return (
                    <div>
                        {!isEditingLayout && <label style={labelStyle}>{label}</label>}
                        <input
                            type="date"
                            value={headerInfo.revisionDate || ''}
                            onChange={(e) => handleChange('revisionDate', e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                );
            case 'effectiveDate':
                return (
                    <div>
                        {!isEditingLayout && <label style={labelStyle}>{label}</label>}
                        <input
                            type="date"
                            value={headerInfo.effectiveDate || ''}
                            onChange={(e) => handleChange('effectiveDate', e.target.value)}
                            style={inputStyle}
                        />
                    </div>
                );
            case 'difficulty':
                return (
                    <div>
                        {!isEditingLayout && <label style={labelStyle}>{label}</label>}
                        <select
                            value={headerInfo.difficulty}
                            onChange={(e) => handleChange('difficulty', e.target.value)}
                            style={inputStyle}
                        >
                            <option value="Very Easy">Very Easy</option>
                            <option value="Easy">Easy</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Difficult">Difficult</option>
                            <option value="Very Difficult">Very Difficult</option>
                        </select>
                    </div>
                );
            case 'timeRequired':
                return (
                    <div>
                        {!isEditingLayout && <label style={labelStyle}>{label}</label>}
                        <input
                            value={headerInfo.timeRequired}
                            onChange={(e) => handleChange('timeRequired', e.target.value)}
                            placeholder="e.g. 10 - 20 minutes"
                            style={inputStyle}
                        />
                    </div>
                );
            default:
                // Handle custom fields
                return (
                    <div>
                        {!isEditingLayout && <label style={labelStyle}>{label}</label>}
                        <input
                            value={headerInfo[id] || ''}
                            onChange={(e) => handleChange(id, e.target.value)}
                            placeholder="Enter value..."
                            style={inputStyle}
                        />
                    </div>
                );
        }
    };

    return (
        <div style={{ backgroundColor: '#252526', borderBottom: '1px solid #333' }}>
            {/* Collapsible Header Bar */}
            <div
                style={{
                    padding: '12px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#1e1e1e',
                    borderBottom: isExpanded ? '1px solid #333' : 'none'
                }}
            >
                <div
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}
                >
                    <span style={{ fontSize: '1.2rem' }}>{isExpanded ? '▼' : '▶'}</span>
                    <strong style={{ color: '#fff' }}>Document Information</strong>
                    <span style={{ color: '#888', fontSize: '0.85rem' }}>
                        ({headerInfo.documentNumber || 'No Doc #'} - {headerInfo.status || 'Draft'})
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {isExpanded && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditingLayout(!isEditingLayout);
                            }}
                            style={{
                                backgroundColor: isEditingLayout ? '#0078d4' : '#333',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '4px 10px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {isEditingLayout ? 'Finish Layout' : 'Customize Layout'}
                        </button>
                    )}
                    <span
                        onClick={() => setIsExpanded(!isExpanded)}
                        style={{ color: '#888', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                        Click to {isExpanded ? 'hide' : 'show'}
                    </span>
                </div>
            </div>

            {/* Expandable Content */}
            {isExpanded && (
                <div style={{ padding: '20px' }}>
                    {/* Main Title */}
                    <div style={{ marginBottom: '15px' }}>
                        <input
                            value={headerInfo.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="Work Instructions Title"
                            style={{
                                width: '100%',
                                fontSize: '1.8rem',
                                fontWeight: 'bold',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderBottom: '2px solid #444',
                                color: '#fff',
                                padding: '5px 0',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Document Metadata Grid - Now Sortable */}
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={headerInfo.headerOrder.map(item => item.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1fr',
                                gap: '15px',
                                marginBottom: '15px',
                                paddingLeft: isEditingLayout ? '20px' : '3px',
                                transition: 'padding 0.2s ease'
                            }}>
                                {headerInfo.headerOrder.map((field) => (
                                    <SortableItem
                                        key={field.id}
                                        id={field.id}
                                        isEditing={isEditingLayout}
                                        label={field.label}
                                        onRemove={handleRemoveField}
                                        onLabelChange={handleLabelChange}
                                    >
                                        {renderInput(field)}
                                    </SortableItem>
                                ))}

                                {isEditingLayout && (
                                    <div
                                        onClick={handleAddField}
                                        style={{
                                            border: '2px dashed #444',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '10px',
                                            cursor: 'pointer',
                                            color: '#888',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.borderColor = '#0078d4'}
                                        onMouseOut={(e) => e.currentTarget.style.borderColor = '#444'}
                                    >
                                        <Plus size={20} />
                                        <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>ADD FIELD</span>
                                    </div>
                                )}
                            </div>
                        </SortableContext>
                    </DndContext>

                    {/* Description/Summary */}
                    <div>
                        <label style={labelStyle}>
                            Description
                        </label>
                        <textarea
                            value={headerInfo.summary}
                            onChange={(e) => handleChange('summary', e.target.value)}
                            placeholder="Optional brief description of the process"
                            style={{
                                width: '100%',
                                backgroundColor: '#333',
                                color: '#fff',
                                border: '1px solid #444',
                                borderRadius: '4px',
                                padding: '8px',
                                fontSize: '0.9rem',
                                resize: 'vertical',
                                minHeight: '60px',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const labelStyle = {
    display: 'block',
    color: '#888',
    fontSize: '0.7rem',
    marginBottom: '4px',
    textTransform: 'uppercase'
};

const inputStyle = {
    width: '100%',
    backgroundColor: '#333',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: '4px',
    padding: '6px 8px',
    fontSize: '0.9rem',
    outline: 'none'
};

export default GuideHeader;
