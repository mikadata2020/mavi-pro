import React, { useState, useEffect } from 'react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
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

// Sortable Task Item
function SortableTask({ id, task }) {
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
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: isDragging ? '#2a2a2a' : '#333',
        padding: '10px',
        margin: '0 0 8px 0',
        borderRadius: '4px',
        border: '1px solid #444',
        cursor: 'grab',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    };

    // Calculate Operator Time
    const man = parseFloat(task.manualTime) || 0;
    const walk = parseFloat(task.walkTime) || 0;
    const wait = parseFloat(task.waitingTime) || 0;
    const auto = parseFloat(task.autoTime) || 0;

    let operatorTime = man + walk + wait;
    if (operatorTime === 0 && auto === 0 && task.duration > 0) {
        operatorTime = task.duration;
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '10px' }}>
                <div style={{ color: '#fff', fontSize: '0.9rem' }}>{task.elementName || task.name}</div>
                <div style={{ color: '#888', fontSize: '0.75rem' }}>{task.category}</div>
            </div>
            <div style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '0.9rem', minWidth: '50px', textAlign: 'right' }}>
                {operatorTime.toFixed(2)}s
            </div>
        </div>
    );
}

// Station Container
function StationColumn({ id, title, tasks, totalTime, taktTime }) {
    const { setNodeRef } = useSortable({ id });

    const isOverTakt = totalTime > taktTime;

    return (
        <div
            ref={setNodeRef}
            style={{
                backgroundColor: '#1a1a1a',
                padding: '15px',
                borderRadius: '8px',
                border: `1px solid ${isOverTakt ? '#c50f1f' : '#333'}`,
                minWidth: '250px',
                width: '250px',
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
            }}
        >
            <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #333' }}>
                {title.includes('::') ? (
                    <>
                        <div style={{ color: '#888', fontSize: '0.8rem', marginBottom: '2px' }}>
                            {title.split('::')[0]}
                        </div>
                        <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>
                            {title.split('::')[1]}
                        </h3>
                    </>
                ) : (
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>{title}</h3>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                    <span style={{ color: '#888', fontSize: '0.85rem' }}>Total:</span>
                    <span style={{ color: isOverTakt ? '#c50f1f' : '#fff', fontWeight: 'bold' }}>
                        {totalTime.toFixed(2)}s
                    </span>
                </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', minHeight: '100px' }}>
                <SortableContext id={id} items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <SortableTask key={task.id} id={task.id} task={task} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}

export default function LineBalancingBoard({ measurements, onUpdateMeasurements, taktTime }) {
    const [activeId, setActiveId] = useState(null);
    const [items, setItems] = useState({});

    // Initialize items from measurements
    useEffect(() => {
        const grouped = measurements.reduce((acc, m) => {
            const station = m.operator || m.station || 'Station 1';
            if (!acc[station]) acc[station] = [];
            acc[station].push({ ...m, id: m.id.toString() }); // Ensure ID is string for dnd-kit
            return acc;
        }, {});
        setItems(grouped);
    }, [measurements]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const findContainer = (id) => {
        if (id in items) return id;
        return Object.keys(items).find((key) => items[key].find((item) => item.id === id));
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        const overId = over?.id;

        if (!overId || active.id === overId) return;

        const activeContainer = findContainer(active.id);
        const overContainer = findContainer(overId);

        if (!activeContainer || !overContainer || activeContainer === overContainer) return;

        setItems((prev) => {
            const activeItems = prev[activeContainer];
            const overItems = prev[overContainer];
            const activeIndex = activeItems.findIndex((item) => item.id === active.id);
            const overIndex = overItems.findIndex((item) => item.id === overId);

            let newIndex;
            if (overId in prev) {
                newIndex = overItems.length + 1;
            } else {
                const isBelowOverItem =
                    over &&
                    active.rect.current.translated &&
                    active.rect.current.translated.top > over.rect.top + over.rect.height;

                const modifier = isBelowOverItem ? 1 : 0;
                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
            }

            return {
                ...prev,
                [activeContainer]: [
                    ...prev[activeContainer].filter((item) => item.id !== active.id),
                ],
                [overContainer]: [
                    ...prev[overContainer].slice(0, newIndex),
                    activeItems[activeIndex],
                    ...prev[overContainer].slice(newIndex, prev[overContainer].length),
                ],
            };
        });
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        const activeContainer = findContainer(active.id);
        const overContainer = findContainer(over?.id);

        if (activeContainer && overContainer && activeContainer !== overContainer) {
            // Update the measurements with new station
            const newMeasurements = [];
            Object.entries(items).forEach(([station, tasks]) => {
                tasks.forEach(task => {
                    newMeasurements.push({
                        ...task,
                        station: station,
                        operator: station // Update both for consistency
                    });
                });
            });
            onUpdateMeasurements(newMeasurements);
        } else if (activeContainer === overContainer) {
            // Reorder within same station (optional, but good for UX)
            const activeIndex = items[activeContainer].findIndex((item) => item.id === active.id);
            const overIndex = items[overContainer].findIndex((item) => item.id === over.id);

            if (activeIndex !== overIndex) {
                const newItems = {
                    ...items,
                    [activeContainer]: arrayMove(items[activeContainer], activeIndex, overIndex),
                };
                setItems(newItems);

                // Update measurements order
                const newMeasurements = [];
                Object.entries(newItems).forEach(([station, tasks]) => {
                    tasks.forEach(task => {
                        newMeasurements.push({
                            ...task,
                            station: station,
                            operator: station
                        });
                    });
                });
                onUpdateMeasurements(newMeasurements);
            }
        }

        setActiveId(null);
    };

    return (
        <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', padding: '20px 0', minHeight: '400px' }}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                {Object.keys(items).sort().map((station) => (
                    <StationColumn
                        key={station}
                        id={station}
                        title={station}
                        tasks={items[station]}
                        totalTime={items[station].reduce((sum, t) => {
                            const man = parseFloat(t.manualTime) || 0;
                            const walk = parseFloat(t.walkTime) || 0;
                            const wait = parseFloat(t.waitingTime) || 0;
                            const auto = parseFloat(t.autoTime) || 0;
                            let opTime = man + walk + wait;
                            if (opTime === 0 && auto === 0 && t.duration > 0) opTime = t.duration;
                            return sum + opTime;
                        }, 0)}
                        taktTime={taktTime}
                    />
                ))}
                <DragOverlay>
                    {activeId ? (
                        <div style={{
                            padding: '10px',
                            backgroundColor: '#2a2a2a',
                            border: '1px solid #444',
                            borderRadius: '4px',
                            color: '#fff',
                            boxShadow: '0 5px 15px rgba(0,0,0,0.5)'
                        }}>
                            Dragging Task...
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
