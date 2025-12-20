import React from 'react';
import { getSmoothStepPath, BaseEdge } from 'reactflow';

export default function MaterialEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data
}) {
    const [edgePath] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const isPush = data?.materialType === 'push';

    const edgeStyle = isPush
        ? {
            ...style,
            stroke: '#ffffff',
            strokeWidth: 6,
            strokeDasharray: '10 5', // Striped appearance
        }
        : { ...style, stroke: '#ffffff', strokeWidth: 2 };

    return (
        <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
    );
}
