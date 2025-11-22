import React, { useState, useEffect } from 'react';

function PlaybackControls({
    videoState,
    onTogglePlay,
    onSetSpeed,
    onNextFrame,
    onPreviousFrame,
    onSetZoom,
    onToggleReverse
}) {
    const [useRatingSpeed, setUseRatingSpeed] = useState(false);
    const speedPresets = [0.25, 0.5, 1, 2, 4, 8];
    const zoomLevels = [0.5, 1, 1.5, 2, 3];

    // Calculate average rating from measurements
    const calculateRatingSpeed = () => {
        if (!videoState.measurements || videoState.measurements.length === 0) return 1;

        const measurementsWithRating = videoState.measurements.filter(m => m.rating && m.rating > 0);
        if (measurementsWithRating.length === 0) return 1;

        const avgRating = measurementsWithRating.reduce((sum, m) => sum + m.rating, 0) / measurementsWithRating.length;
        return avgRating / 100; // Convert percentage to decimal
    };

    // Apply rating speed when toggle changes
    useEffect(() => {
        if (useRatingSpeed) {
            const ratingSpeed = calculateRatingSpeed();
            onSetSpeed(ratingSpeed);
        } else {
            onSetSpeed(1); // Reset to normal speed
        }
    }, [useRatingSpeed]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    const ratingSpeed = calculateRatingSpeed();
    const hasRatings = videoState.measurements && videoState.measurements.some(m => m.rating && m.rating > 0);

    return (
        <div style={{
            backgroundColor: '#222',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            borderTop: '1px solid #444'
        }}>
            {/* Main Controls - Single Row */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Frame Navigation */}
                <button className="btn" onClick={onPreviousFrame} title="Previous Frame (←)" style={{ padding: '6px 10px', fontSize: '1rem' }}>
                    ⏮
                </button>
                <button className="btn" onClick={onTogglePlay} style={{ padding: '6px 12px', fontSize: '1rem' }}>
                    {videoState.isPlaying ? '⏸' : '▶'}
                </button>
                <button className="btn" onClick={onNextFrame} title="Next Frame (→)" style={{ padding: '6px 10px', fontSize: '1rem' }}>
                    ⏭
                </button>

                {/* Reverse Playback */}
                <button className="btn" onClick={onToggleReverse} title={videoState.isReverse ? 'Reverse Mode' : 'Normal Mode'} style={{ padding: '6px 10px', fontSize: '1rem', backgroundColor: videoState.isReverse ? 'var(--accent-blue)' : '', marginLeft: '4px' }}>
                    {videoState.isReverse ? '◀' : '▶'}
                </button>

                {/* Speed Control - Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
                    <select
                        value={videoState.playbackRate}
                        onChange={(e) => onSetSpeed(parseFloat(e.target.value))}
                        disabled={useRatingSpeed}
                        style={{
                            padding: '6px 8px',
                            backgroundColor: useRatingSpeed ? '#444' : '#333',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '0.85rem',
                            cursor: useRatingSpeed ? 'not-allowed' : 'pointer',
                            minWidth: '80px'
                        }}
                        title="Playback Speed"
                    >
                        <option value="0.25">🐢 0.25x</option>
                        <option value="0.5">🐢 0.5x</option>
                        <option value="1">▶ 1x</option>
                        <option value="2">🐇 2x</option>
                        <option value="4">🐇 4x</option>
                        <option value="8">🐇 8x</option>
                    </select>
                </div>

                {/* Rating Speed Toggle */}
                {hasRatings && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#ccc', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={useRatingSpeed}
                                onChange={(e) => setUseRatingSpeed(e.target.checked)}
                            />
                            <span>⭐ Rating Speed</span>
                        </label>
                        {useRatingSpeed && (
                            <span style={{ fontSize: '0.75rem', color: '#4da6ff', padding: '2px 6px', backgroundColor: '#1a1a1a', borderRadius: '3px' }}>
                                {(ratingSpeed * 100).toFixed(0)}% = {ratingSpeed.toFixed(2)}x
                            </span>
                        )}
                    </div>
                )}

                {/* Zoom Control - Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
                    <select
                        value={videoState.zoom}
                        onChange={(e) => onSetZoom(parseFloat(e.target.value))}
                        style={{
                            padding: '6px 8px',
                            backgroundColor: '#333',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            minWidth: '80px'
                        }}
                        title="Zoom Level"
                    >
                        <option value="0.5">🔍 0.5x</option>
                        <option value="1">🔍 1x</option>
                        <option value="1.5">🔍 1.5x</option>
                        <option value="2">🔍 2x</option>
                        <option value="3">🔍 3x</option>
                    </select>
                </div>

                {/* Time Display - Compact */}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', fontSize: '0.8rem', color: '#aaa' }}>
                    <span>{formatTime(videoState.currentTime)} / {formatTime(videoState.duration)}</span>
                    <span>Frame: {videoState.currentFrame} / {videoState.totalFrames}</span>
                </div>
            </div>

            {/* Timeline Slider */}
            <input
                type="range"
                min="0"
                max={videoState.duration || 0}
                step="0.01"
                value={videoState.currentTime}
                onChange={(e) => {
                    const event = new CustomEvent('seek', { detail: parseFloat(e.target.value) });
                    window.dispatchEvent(event);
                }}
                style={{
                    width: '100%',
                    cursor: 'pointer'
                }}
            />
        </div>
    );
}

export default PlaybackControls;
