import React, { useRef, useState, useEffect } from 'react';

function VideoAnnotation({ videoRef, videoState, annotations, onUpdateAnnotations }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentTool, setCurrentTool] = useState('pen'); // pen, line, arrow, rectangle, circle, text, eraser
    const [drawColor, setDrawColor] = useState('#ff0000');
    const [lineWidth, setLineWidth] = useState(3);
    const [drawingData, setDrawingData] = useState([]);
    const [currentPath, setCurrentPath] = useState([]);
    const [startPoint, setStartPoint] = useState(null);
    const [showToolbar, setShowToolbar] = useState(true);

    // Initialize canvas
    useEffect(() => {
        if (!canvasRef.current || !videoRef.current) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;

        // Match canvas size to video
        canvas.width = video.offsetWidth;
        canvas.height = video.offsetHeight;

        // Redraw annotations
        redrawCanvas();
    }, [videoState.currentTime, drawingData, annotations]);

    const redrawCanvas = () => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw all annotations for current time
        const currentTime = videoState.currentTime;
        const relevantAnnotations = (annotations || []).filter(
            ann => ann.timestamp >= currentTime - 0.5 && ann.timestamp <= currentTime + 0.5
        );

        relevantAnnotations.forEach(annotation => {
            drawAnnotation(ctx, annotation);
        });

        // Draw current drawing
        drawingData.forEach(item => {
            drawAnnotation(ctx, item);
        });
    };

    const drawAnnotation = (ctx, annotation) => {
        ctx.strokeStyle = annotation.color || drawColor;
        ctx.fillStyle = annotation.color || drawColor;
        ctx.lineWidth = annotation.lineWidth || lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        switch (annotation.type) {
            case 'pen':
                if (annotation.path && annotation.path.length > 1) {
                    ctx.beginPath();
                    ctx.moveTo(annotation.path[0].x, annotation.path[0].y);
                    annotation.path.forEach(point => {
                        ctx.lineTo(point.x, point.y);
                    });
                    ctx.stroke();
                }
                break;

            case 'line':
                if (annotation.start && annotation.end) {
                    ctx.beginPath();
                    ctx.moveTo(annotation.start.x, annotation.start.y);
                    ctx.lineTo(annotation.end.x, annotation.end.y);
                    ctx.stroke();
                }
                break;

            case 'arrow':
                if (annotation.start && annotation.end) {
                    drawArrow(ctx, annotation.start, annotation.end);
                }
                break;

            case 'rectangle':
                if (annotation.start && annotation.end) {
                    const width = annotation.end.x - annotation.start.x;
                    const height = annotation.end.y - annotation.start.y;
                    ctx.strokeRect(annotation.start.x, annotation.start.y, width, height);
                }
                break;

            case 'circle':
                if (annotation.start && annotation.end) {
                    const radius = Math.sqrt(
                        Math.pow(annotation.end.x - annotation.start.x, 2) +
                        Math.pow(annotation.end.y - annotation.start.y, 2)
                    );
                    ctx.beginPath();
                    ctx.arc(annotation.start.x, annotation.start.y, radius, 0, 2 * Math.PI);
                    ctx.stroke();
                }
                break;

            case 'text':
                if (annotation.position && annotation.text) {
                    ctx.font = `${annotation.fontSize || 24}px Arial`;
                    ctx.fillText(annotation.text, annotation.position.x, annotation.position.y);
                }
                break;
        }
    };

    const drawArrow = (ctx, start, end) => {
        const headLength = 15;
        const angle = Math.atan2(end.y - start.y, end.x - start.x);

        // Draw line
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        // Draw arrowhead
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
            end.x - headLength * Math.cos(angle - Math.PI / 6),
            end.y - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(
            end.x - headLength * Math.cos(angle + Math.PI / 6),
            end.y - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
    };

    const getCanvasPoint = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const handleMouseDown = (e) => {
        if (!canvasRef.current) return;

        const point = getCanvasPoint(e);
        setIsDrawing(true);
        setStartPoint(point);

        if (currentTool === 'pen') {
            setCurrentPath([point]);
        }
    };

    const handleMouseMove = (e) => {
        if (!isDrawing || !canvasRef.current) return;

        const point = getCanvasPoint(e);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (currentTool === 'pen') {
            setCurrentPath(prev => [...prev, point]);

            // Draw immediately for smooth feedback
            ctx.strokeStyle = drawColor;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (currentPath.length > 0) {
                ctx.beginPath();
                ctx.moveTo(currentPath[currentPath.length - 1].x, currentPath[currentPath.length - 1].y);
                ctx.lineTo(point.x, point.y);
                ctx.stroke();
            }
        } else {
            // For shapes, redraw with preview
            redrawCanvas();

            const tempAnnotation = {
                type: currentTool,
                start: startPoint,
                end: point,
                color: drawColor,
                lineWidth: lineWidth
            };

            drawAnnotation(ctx, tempAnnotation);
        }
    };

    const handleMouseUp = (e) => {
        if (!isDrawing) return;

        const point = getCanvasPoint(e);

        const newAnnotation = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            type: currentTool,
            timestamp: videoState.currentTime,
            color: drawColor,
            lineWidth: lineWidth
        };

        if (currentTool === 'pen') {
            newAnnotation.path = currentPath;
        } else {
            newAnnotation.start = startPoint;
            newAnnotation.end = point;
        }

        setDrawingData(prev => [...prev, newAnnotation]);
        setIsDrawing(false);
        setCurrentPath([]);
        setStartPoint(null);
    };

    const saveAnnotations = () => {
        if (onUpdateAnnotations) {
            onUpdateAnnotations([...(annotations || []), ...drawingData]);
            setDrawingData([]);
        }
    };

    const clearAll = () => {
        setDrawingData([]);
        if (onUpdateAnnotations) {
            onUpdateAnnotations([]);
        }
    };

    const tools = [
        { id: 'pen', icon: '✏️', label: 'Pen' },
        { id: 'line', icon: '📏', label: 'Line' },
        { id: 'arrow', icon: '➡️', label: 'Arrow' },
        { id: 'rectangle', icon: '⬜', label: 'Rectangle' },
        { id: 'circle', icon: '⭕', label: 'Circle' }
    ];

    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff', '#000000'];

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* Canvas Overlay */}
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => setIsDrawing(false)}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    cursor: 'crosshair',
                    pointerEvents: showToolbar ? 'auto' : 'none',
                    zIndex: 10
                }}
            />

            {/* Toolbar */}
            {showToolbar && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    padding: '10px',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    zIndex: 20
                }}>
                    {/* Tools */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '200px' }}>
                        {tools.map(tool => (
                            <button
                                key={tool.id}
                                onClick={() => setCurrentTool(tool.id)}
                                style={{
                                    padding: '6px',
                                    backgroundColor: currentTool === tool.id ? '#005a9e' : '#333',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    minWidth: '36px'
                                }}
                                title={tool.label}
                            >
                                {tool.icon}
                            </button>
                        ))}
                    </div>

                    {/* Colors */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '200px' }}>
                        {colors.map(color => (
                            <button
                                key={color}
                                onClick={() => setDrawColor(color)}
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    backgroundColor: color,
                                    border: drawColor === color ? '2px solid white' : '1px solid #666',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    padding: 0
                                }}
                            />
                        ))}
                    </div>

                    {/* Line Width */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'white', fontSize: '0.75rem' }}>Width:</span>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={lineWidth}
                            onChange={(e) => setLineWidth(parseInt(e.target.value))}
                            style={{ flex: 1 }}
                        />
                        <span style={{ color: 'white', fontSize: '0.75rem' }}>{lineWidth}</span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        <button
                            onClick={saveAnnotations}
                            style={{
                                flex: 1,
                                padding: '6px',
                                backgroundColor: '#107c10',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                            }}
                        >
                            💾 Save
                        </button>
                        <button
                            onClick={clearAll}
                            style={{
                                flex: 1,
                                padding: '6px',
                                backgroundColor: '#c50f1f',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                            }}
                        >
                            🗑️ Clear
                        </button>
                    </div>

                    {/* Toggle Toolbar */}
                    <button
                        onClick={() => setShowToolbar(false)}
                        style={{
                            padding: '4px',
                            backgroundColor: '#333',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.7rem'
                        }}
                    >
                        Hide
                    </button>
                </div>
            )}

            {/* Show Toolbar Button (when hidden) */}
            {!showToolbar && (
                <button
                    onClick={() => setShowToolbar(true)}
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        padding: '8px',
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        zIndex: 20
                    }}
                >
                    🎨 Draw
                </button>
            )}
        </div>
    );
}

export default VideoAnnotation;
