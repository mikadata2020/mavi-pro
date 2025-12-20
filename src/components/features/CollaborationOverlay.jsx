import React, { useEffect, useRef } from 'react';

const CollaborationOverlay = ({ remoteCursors = {}, lastDrawingAction }) => {
    const canvasRef = useRef(null);
    const tempCanvasRef = useRef(null); // For drawing shapes preview
    const lastPoint = useRef(null);
    const startPoint = useRef(null);

    useEffect(() => {
        [canvasRef, tempCanvasRef].forEach(ref => {
            if (ref.current) {
                ref.current.width = window.innerWidth;
                ref.current.height = window.innerHeight;
            }
        });

        const handleResize = () => {
            [canvasRef, tempCanvasRef].forEach(ref => {
                if (ref.current) {
                    ref.current.width = window.innerWidth;
                    ref.current.height = window.innerHeight;
                }
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (lastDrawingAction && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            const tempCtx = tempCanvasRef.current.getContext('2d');
            const { action, x, y, color, tool } = lastDrawingAction;
            const w = canvasRef.current.width;
            const h = canvasRef.current.height;
            const drawX = x * w;
            const drawY = y * h;

            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = color;

            if (action === 'start') {
                ctx.beginPath();
                startPoint.current = { x: drawX, y: drawY };
                lastPoint.current = { x: drawX, y: drawY };
                if (tool === 'pen' || tool === 'eraser') ctx.moveTo(drawX, drawY);
            } else if (action === 'draw') {
                if (tool === 'pen' || tool === 'eraser') {
                    ctx.beginPath();
                    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
                    ctx.lineTo(drawX, drawY);
                    ctx.strokeStyle = tool === 'eraser' ? '#000' : color;
                    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
                    ctx.lineWidth = tool === 'eraser' ? 20 : 3;
                    ctx.stroke();
                    ctx.globalCompositeOperation = 'source-over';
                } else {
                    // Preview shapes on temp canvas
                    tempCtx.clearRect(0, 0, w, h);
                    tempCtx.strokeStyle = color;
                    tempCtx.lineWidth = 3;
                    if (tool === 'rect') {
                        tempCtx.strokeRect(startPoint.current.x, startPoint.current.y, drawX - startPoint.current.x, drawY - startPoint.current.y);
                    } else if (tool === 'arrow') {
                        drawArrow(tempCtx, startPoint.current.x, startPoint.current.y, drawX, drawY);
                    }
                }
                lastPoint.current = { x: drawX, y: drawY };
            } else if (action === 'end') {
                tempCtx.clearRect(0, 0, w, h);
                if (tool === 'rect') {
                    ctx.strokeRect(startPoint.current.x, startPoint.current.y, drawX - startPoint.current.x, drawY - startPoint.current.y);
                } else if (tool === 'arrow') {
                    drawArrow(ctx, startPoint.current.x, startPoint.current.y, drawX, drawY);
                }
                lastPoint.current = null;
                startPoint.current = null;
            } else if (action === 'clear') {
                ctx.clearRect(0, 0, w, h);
            }
        }
    }, [lastDrawingAction]);

    const drawArrow = (ctx, fromx, fromy, tox, toy) => {
        const headlen = 15;
        const angle = Math.atan2(toy - fromy, tox - fromx);
        ctx.beginPath();
        ctx.moveTo(fromx, fromy);
        ctx.lineTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(tox, toy);
        ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    };

    return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9998 }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%', position: 'absolute' }} />
            <canvas ref={tempCanvasRef} style={{ width: '100%', height: '100%', position: 'absolute' }} />
            {Object.entries(remoteCursors).map(([userId, cursor]) => (
                <div key={userId} style={{ position: 'absolute', left: `${cursor.x * 100}%`, top: `${cursor.y * 100}%`, transform: 'translate(-5px, -5px)', zIndex: 9999 }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M5.65 12.36L0.5 16.88V1.19L11.78 12.36H5.65Z" fill={cursor.color || '#ff0000'} stroke="white" strokeWidth="1" />
                    </svg>
                    <div style={{ backgroundColor: cursor.color || '#ff0000', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                        {cursor.name || userId}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CollaborationOverlay;
