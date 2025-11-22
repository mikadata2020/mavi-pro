import React from 'react';

function Header({ videoName, onUpload, currentView, setCurrentView, onOpenSessionManager, theme, toggleTheme }) {
    return (
        <header style={{
            height: 'var(--header-height)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            borderBottom: '1px solid var(--border-color)',
            justifyContent: 'space-between'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--accent-blue)' }}>MAVi</h1>
            </div>

            {setCurrentView && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: currentView === 'dashboard' ? 'var(--accent-blue)' : '',
                            padding: '8px 10px',
                            fontSize: '1.2rem'
                        }}
                        onClick={() => setCurrentView('dashboard')}
                        title="Video Analysis Workspace"
                    >
                        🎬
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: currentView === 'analysis' ? 'var(--accent-blue)' : '',
                            padding: '8px 10px',
                            fontSize: '1.2rem'
                        }}
                        onClick={() => setCurrentView('analysis')}
                        title="Analysis Summary & Charts"
                    >
                        📊
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: currentView === 'rearrangement' ? 'var(--accent-blue)' : '',
                            padding: '8px 10px',
                            fontSize: '1.2rem'
                        }}
                        onClick={() => setCurrentView('rearrangement')}
                        title="Rearrange Elements & Simulate"
                    >
                        🔄
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: currentView === 'comparison' ? 'var(--accent-blue)' : '',
                            padding: '8px 10px',
                            fontSize: '1.2rem'
                        }}
                        onClick={() => setCurrentView('comparison')}
                        title="Compare Multiple Sessions"
                    >
                        ⚖️
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: currentView === 'aggregation' ? 'var(--accent-blue)' : '',
                            padding: '8px 10px',
                            fontSize: '1.2rem'
                        }}
                        onClick={() => setCurrentView('aggregation')}
                        title="Cycle Time Aggregation"
                    >
                        📈
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: currentView === 'standard-time' ? 'var(--accent-blue)' : '',
                            padding: '8px 10px',
                            fontSize: '1.2rem'
                        }}
                        onClick={() => setCurrentView('standard-time')}
                        title="Standard Time Calculation"
                    >
                        ⏱️
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: currentView === 'waste-elimination' ? 'var(--accent-blue)' : '',
                            padding: '8px 10px',
                            fontSize: '1.2rem'
                        }}
                        onClick={() => setCurrentView('waste-elimination')}
                        title="Waste Elimination Simulation"
                    >
                        🗑️
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: currentView === 'spaghetti' ? 'var(--accent-blue)' : '',
                            padding: '8px 10px',
                            fontSize: '1.2rem'
                        }}
                        onClick={() => setCurrentView('spaghetti')}
                        title="Spaghetti Chart - Movement Diagram"
                    >
                        🍝
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: currentView === 'best-worst' ? 'var(--accent-blue)' : '',
                            padding: '8px 10px',
                            fontSize: '1.2rem'
                        }}
                        onClick={() => setCurrentView('best-worst')}
                        title="Best vs Worst Cycle Analysis"
                    >
                        🏆
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: currentView === 'video-comparison' ? 'var(--accent-blue)' : '',
                            padding: '8px 10px',
                            fontSize: '1.2rem'
                        }}
                        onClick={() => setCurrentView('video-comparison')}
                        title="Video Side-by-Side Comparison"
                    >
                        🎥
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: currentView === 'help' ? 'var(--accent-blue)' : '',
                            padding: '8px 10px',
                            fontSize: '1.2rem'
                        }}
                        onClick={() => setCurrentView('help')}
                        title="Help & User Guide"
                    >
                        ❓
                    </button>
                    <button
                        className="btn"
                        onClick={toggleTheme}
                        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                        style={{ padding: '6px 10px', fontSize: '1.2rem' }}
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>

                    <div style={{ width: '1px', height: '30px', backgroundColor: '#555', margin: '0 5px' }}></div>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: '#f80',
                            padding: '6px 12px'
                        }}
                        onClick={() => document.getElementById('header-logo-upload')?.click()}
                        title="Upload Logo/Watermark"
                    >
                        🎨 Logo
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: '#0a5',
                            padding: '6px 12px'
                        }}
                        onClick={() => window.dispatchEvent(new CustomEvent('screenshot'))}
                        title="Capture Screenshot"
                    >
                        📸 Screenshot
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: '#05a',
                            padding: '6px 12px'
                        }}
                        onClick={() => window.dispatchEvent(new CustomEvent('export-json'))}
                        title="Export Analysis Data"
                    >
                        💾 Export
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: '#0a5',
                            padding: '6px 12px'
                        }}
                        onClick={onOpenSessionManager}
                        title="Manage Saved Sessions"
                    >
                        📂 Sessions
                    </button>
                    <input
                        type="file"
                        accept="image/*"
                        id="header-logo-upload"
                        style={{ display: 'none' }}
                    />
                </div>
            )}
        </header>
    );
}

export default Header;
