import React, { useEffect, useRef } from 'react';

const CollaborationOverlay = ({ remoteCursors = {}, lastDrawingAction }) => {
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
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 9998
        }}>
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%'
                }}
            />
            {Object.entries(remoteCursors).map(([userId, cursor]) => (
                <div
                    key={userId}
                    style={{
                        position: 'absolute',
                        left: `${cursor.x * 100}%`,
                        top: `${cursor.y * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none',
                        zIndex: 9999,
                        transition: 'all 0.1s linear' // Smooth interpolation
                    }}
                >
                    {/* Cursor Icon (Arrow) */}
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.3))' }}>
                        <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19177L11.7841 12.3673H5.65376Z" fill={cursor.color || '#ff0000'} stroke="white" strokeWidth="1" />
                    </svg>

                    {/* Name Label */}
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        left: '10px',
                        backgroundColor: cursor.color || '#ff0000',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        whiteSpace: 'nowrap',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                        {cursor.name || userId}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CollaborationOverlay;
