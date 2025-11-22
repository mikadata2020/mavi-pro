import React from 'react';

function Header({ currentView, setCurrentView, onOpenSessionManager }) {
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
                <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--accent-blue)' }}>Analisis Gerakan</h1>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Operasi mudah melalui antarmuka pengguna grafis yang intuitif.
                </span>
            </div>

            {setCurrentView && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: currentView === 'dashboard' ? 'var(--accent-blue)' : '',
                            padding: '6px 12px'
                        }}
                        onClick={() => setCurrentView('dashboard')}
                        title="Video Analysis Workspace"
                    >
                        🎬 Video
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: currentView === 'analysis' ? 'var(--accent-blue)' : '',
                            padding: '6px 12px'
                        }}
                        onClick={() => setCurrentView('analysis')}
                        title="Analysis Summary & Charts"
                    >
                        📊 Analysis
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: currentView === 'rearrangement' ? 'var(--accent-blue)' : '',
                            padding: '6px 12px'
                        }}
                        onClick={() => setCurrentView('rearrangement')}
                        title="Rearrange Elements & Simulate"
                    >
                        🔄 Rearrange
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: currentView === 'comparison' ? 'var(--accent-blue)' : '',
                            padding: '6px 12px'
                        }}
                        onClick={() => setCurrentView('comparison')}
                        title="Compare Multiple Sessions"
                    >
                        ⚖️ Comparison
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
