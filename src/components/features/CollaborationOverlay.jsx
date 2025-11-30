import React, { useEffect, useRef } from 'react';

const CollaborationOverlay = ({ cursor, lastDrawingAction }) => {
    const canvasRef = useRef(null);
    const lastPoint = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const handleResize = () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            };

            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    useEffect(() => {
        if (lastDrawingAction && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            const { action, x, y, color } = lastDrawingAction;
            const width = canvasRef.current.width;
            const height = canvasRef.current.height;
            const drawX = x * width;
            const drawY = y * height;

            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = color;

            if (action === 'start') {
                ctx.beginPath();
                ctx.moveTo(drawX, drawY);
                lastPoint.current = { x: drawX, y: drawY };
            } else if (action === 'draw') {
                // If we have a last point, start from there to ensure continuity
                // This handles the case where 'start' might have been missed or for smooth lines
                if (lastPoint.current) {
                    ctx.beginPath();
                    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
                    ctx.lineTo(drawX, drawY);
                    ctx.stroke();
                }
                lastPoint.current = { x: drawX, y: drawY };
            } else if (action === 'end') {
                lastPoint.current = null;
            }
        }
    }, [lastDrawingAction]);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 9998 // Below the cursor but above content
        }}>
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%'
                }}
            />
            {cursor && cursor.x !== null && (
                <div
                    style={{
                        position: 'absolute',
                        left: `${cursor.x * 100}%`,
                        top: `${cursor.y * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none',
                        zIndex: 9999,
                        transition: 'all 0.1s ease-out'
                    }}
                >
                    <div style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: 'rgba(255, 0, 0, 0.5)',
                        border: '2px solid red',
                        borderRadius: '50%'
                    }} />
                    {cursor.label && (
                        <div style={{
                            position: 'absolute',
                            top: '25px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: 'red',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            whiteSpace: 'nowrap'
                        }}>
                            {cursor.label}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CollaborationOverlay;
