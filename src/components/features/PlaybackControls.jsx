import React from 'react';

function PlaybackControls({
    videoState,
    onTogglePlay,
    onSetSpeed,
    onNextFrame,
    onPreviousFrame,
    onSetZoom,
    onToggleReverse
}) {
    const speedPresets = [0.25, 0.5, 1, 2, 4, 8];
    const zoomLevels = [0.5, 1, 1.5, 2, 3];

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

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
