import React, { useRef, useState } from 'react';

function TimelineEditor({ videoState, measurements, onSeek, onSelectMeasurement, onAddMeasurement, onUpdateMeasurements }) {
    const timelineRef = useRef(null);
    const [hoveredMeasurement, setHoveredMeasurement] = useState(null);
    const [dragState, setDragState] = useState(null); // { type: 'move' | 'resize-left' | 'resize-right', id: string, startX: number, originalStart: number, originalEnd: number }

    const getCategoryColor = (category) => {
        switch (category) {
            case 'Value-added': return '#005a9e';
            case 'Non value-added': return '#bfa900';
            case 'Waste': return '#c50f1f';
            default: return '#666';
        }
    };

    const handleMouseDown = (e, measurement, type) => {
        e.stopPropagation();
        if (!onUpdateMeasurements) return;

        setDragState({
            type,
            id: measurement.id,
            startX: e.clientX,
            originalStart: measurement.startTime,
            originalEnd: measurement.endTime
        });

        document.body.style.userSelect = 'none';
        document.body.style.cursor = type === 'move' ? 'grabbing' : 'col-resize';
    };

    const handleMouseMove = (e) => {
        if (!dragState || !timelineRef.current || !videoState.duration) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const deltaPixels = e.clientX - dragState.startX;
        const deltaTime = (deltaPixels / rect.width) * videoState.duration;

        let newStart = dragState.originalStart;
        let newEnd = dragState.originalEnd;

        if (dragState.type === 'move') {
            newStart += deltaTime;
            newEnd += deltaTime;
        } else if (dragState.type === 'resize-left') {
            newStart += deltaTime;
        } else if (dragState.type === 'resize-right') {
            newEnd += deltaTime;
        }

        // Constraints
        if (newStart < 0) newStart = 0;
        if (newEnd > videoState.duration) newEnd = videoState.duration;

        // Minimum duration constraint (0.1s)
        if (newEnd - newStart < 0.1) {
            if (dragState.type === 'resize-left') newStart = newEnd - 0.1;
            else if (dragState.type === 'resize-right') newEnd = newStart + 0.1;
        }

        // Update measurements
        const updatedMeasurements = measurements.map(m => {
            if (m.id === dragState.id) {
                return {
                    ...m,
                    startTime: newStart,
                    endTime: newEnd,
                    duration: newEnd - newStart
                };
            }
            return m;
        });

        onUpdateMeasurements(updatedMeasurements);
    };

    const handleMouseUp = () => {
        if (dragState) {
            setDragState(null);
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        }
    };

    React.useEffect(() => {
        if (dragState) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [dragState, videoState.duration]);

    const handleTimelineClick = (e) => {
        if (!timelineRef.current || !videoState.duration) return;

        // Prevent click if we just finished dragging
        if (dragState) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const clickedTime = percentage * videoState.duration;

        // Check if click was on empty space (not on a measurement block)
        const clickedOnMeasurement = e.target.closest('[data-measurement-id]');

        if (!clickedOnMeasurement && onAddMeasurement) {
            // Find the last measurement (by end time)
            let startTime = 0;

            if (measurements.length > 0) {
                // Sort measurements by end time and get the last one
                const sortedMeasurements = [...measurements].sort((a, b) => b.endTime - a.endTime);
                const lastMeasurement = sortedMeasurements[0];
                startTime = lastMeasurement.endTime;
            }

            // End time is where user clicked
            let endTime = clickedTime;

            // Make sure end time is after start time
            if (endTime <= startTime) {
                endTime = startTime + 0.5; // Add minimum 0.5 second duration
            }

            // Make sure we don't exceed video duration
            if (endTime > videoState.duration) {
                endTime = videoState.duration;
            }

            const duration = endTime - startTime;

            onAddMeasurement({
                startTime: startTime,
                endTime: endTime,
                duration: duration
            });
        } else if (onSeek) {
            // If clicked on empty space but no onAddMeasurement, just seek
            onSeek(clickedTime);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{
            backgroundColor: '#1a1a1a',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '5px'
        }}>
            {/* Timeline Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '0.75rem',
                color: '#888'
            }}>
                <span>Timeline Editor - Drag to move/resize, Click empty space to add</span>
                <span>{measurements.length} measurements</span>
            </div>

            {/* Timeline Track */}
            <div
                ref={timelineRef}
                onClick={handleTimelineClick}
                style={{
                    position: 'relative',
                    height: '60px',
                    backgroundColor: '#0a0a0a',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    border: '1px solid #333',
                    overflow: 'hidden'
                }}
            >
                {/* Time markers */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    pointerEvents: 'none'
                }}>
                    {[0, 0.25, 0.5, 0.75, 1].map((pos, i) => (
                        <div
                            key={i}
                            style={{
                                position: 'absolute',
                                left: `${pos * 100}%`,
                                top: 0,
                                bottom: 0,
                                width: '1px',
                                backgroundColor: '#333',
                                display: 'flex',
                                alignItems: 'flex-end',
                                paddingBottom: '2px'
                            }}
                        >
                            <span style={{
                                fontSize: '0.65rem',
                                color: '#666',
                                transform: 'translateX(-50%)',
                                backgroundColor: '#0a0a0a',
                                padding: '0 2px'
                            }}>
                                {formatTime(pos * (videoState.duration || 0))}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Measurement blocks */}
                {measurements.map((measurement, index) => {
                    const startPercent = (measurement.startTime / (videoState.duration || 1)) * 100;
                    const widthPercent = (measurement.duration / (videoState.duration || 1)) * 100;
                    const isHovered = hoveredMeasurement?.id === measurement.id;

                    return (
                        <div
                            key={measurement.id}
                            data-measurement-id={measurement.id}
                            onMouseEnter={() => setHoveredMeasurement(measurement)}
                            onMouseLeave={() => setHoveredMeasurement(null)}
                            onMouseDown={(e) => handleMouseDown(e, measurement, 'move')}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectMeasurement) {
                                    onSelectMeasurement(measurement);
                                }
                                if (onSeek) {
                                    onSeek(measurement.startTime);
                                }
                            }}
                            style={{
                                position: 'absolute',
                                left: `${startPercent}%`,
                                top: '20px',
                                width: `${widthPercent}%`,
                                height: '30px',
                                backgroundColor: getCategoryColor(measurement.category),
                                border: isHovered ? '2px solid white' : '1px solid rgba(0,0,0,0.3)',
                                borderRadius: '2px',
                                cursor: 'grab',
                                transition: dragState?.id === measurement.id ? 'none' : 'all 0.2s',
                                transform: isHovered ? 'scaleY(1.2)' : 'scaleY(1)',
                                zIndex: isHovered || dragState?.id === measurement.id ? 10 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'visible' // Changed to visible for handles
                            }}
                            title={`${measurement.elementName} (${measurement.duration.toFixed(2)}s)`}
                        >
                            <span style={{
                                fontSize: '0.65rem',
                                color: 'white',
                                fontWeight: 'bold',
                                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                padding: '0 4px',
                                pointerEvents: 'none'
                            }}>
                                {widthPercent > 5 ? measurement.elementName : ''}
                            </span>

                            {/* Resize Handles (only visible on hover) */}
                            {isHovered && (
                                <>
                                    <div
                                        onMouseDown={(e) => handleMouseDown(e, measurement, 'resize-left')}
                                        style={{
                                            position: 'absolute',
                                            left: 0,
                                            top: 0,
                                            bottom: 0,
                                            width: '6px',
                                            cursor: 'col-resize',
                                            backgroundColor: 'rgba(255,255,255,0.5)',
                                            zIndex: 20
                                        }}
                                    />
                                    <div
                                        onMouseDown={(e) => handleMouseDown(e, measurement, 'resize-right')}
                                        style={{
                                            position: 'absolute',
                                            right: 0,
                                            top: 0,
                                            bottom: 0,
                                            width: '6px',
                                            cursor: 'col-resize',
                                            backgroundColor: 'rgba(255,255,255,0.5)',
                                            zIndex: 20
                                        }}
                                    />
                                </>
                            )}
                        </div>
                    );
                })}

                {/* Current time indicator */}
                {videoState.duration > 0 && (
                    <div
                        style={{
                            position: 'absolute',
                            left: `${(videoState.currentTime / videoState.duration) * 100}%`,
                            top: 0,
                            bottom: 0,
                            width: '2px',
                            backgroundColor: '#ff0000',
                            pointerEvents: 'none',
                            zIndex: 20,
                            boxShadow: '0 0 4px rgba(255,0,0,0.8)'
                        }}
                    >
                        <div style={{
                            position: 'absolute',
                            top: '-8px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '6px solid transparent',
                            borderRight: '6px solid transparent',
                            borderTop: '8px solid #ff0000'
                        }} />
                    </div>
                )}
            </div>

            {/* Hovered measurement info */}
            {hoveredMeasurement && (
                <div style={{
                    marginTop: '8px',
                    padding: '6px 8px',
                    backgroundColor: '#222',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    color: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span style={{ fontWeight: 'bold' }}>{hoveredMeasurement.elementName}</span>
                    <span style={{ color: '#888' }}>
                        {formatTime(hoveredMeasurement.startTime)} - {formatTime(hoveredMeasurement.endTime)}
                        <span style={{ marginLeft: '8px', color: getCategoryColor(hoveredMeasurement.category) }}>
                            ({hoveredMeasurement.duration.toFixed(2)}s)
                        </span>
                    </span>
                </div>
            )}
        </div>
    );
}

export default TimelineEditor;
