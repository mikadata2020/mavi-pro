import React from 'react';
import { getBezierPath, BaseEdge, EdgeLabelRenderer } from 'reactflow';

export default function InformationEdge({
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
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const isElectronic = data?.infoType === 'electronic';

    // For electronic, we create a "lightning" zigzag along the path
    // Since full path transformation is complex, we use a dasharray and color
    const edgeStyle = isElectronic
        ? { ...style, stroke: '#00ffff', strokeWidth: 2, strokeDasharray: '8 4' }
        : { ...style, stroke: '#ffffff', strokeWidth: 2 };

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={edgeStyle} />
            {isElectronic && (
                <path
                    d={edgePath}
                    fill="none"
                    stroke="#00ffff"
                    strokeWidth={1}
                    strokeOpacity={0.5}
                    style={{ filter: 'blur(2px)' }}
                />
            )}
        </>
    );
}
