import React from 'react';

function Header({ videoName, onUpload, currentView, setCurrentView, onOpenSessionManager, theme, toggleTheme, onLogout }) {
    return (
        <header style={{
            height: '100vh',
            width: '60px',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px 0',
            borderLeft: '1px solid var(--border-color)',
            justifyContent: 'flex-start',
            gap: '20px'
        }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px', flexShrink: 0 }}>
                <h1 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--accent-blue)', writingMode: 'vertical-rl', textOrientation: 'mixed' }}>MAVi</h1>
            </div>

            {setCurrentView && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    alignItems: 'center',
                    width: '100%',
                    overflowY: 'auto',
                    flex: 1,
                    paddingBottom: '20px',
                    scrollbarWidth: 'none', /* Firefox */
                    msOverflowStyle: 'none'  /* IE and Edge */
                }}>
                    <style>
                        {`
                            header div::-webkit-scrollbar {
                                display: none;
                            }
                        `}
                    </style>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: currentView === 'dashboard' ? 'var(--accent-blue)' : '',
                            padding: '8px',
                            fontSize: '1.2rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
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
                            padding: '8px',
                            fontSize: '1.2rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
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
                            padding: '8px',
                            fontSize: '1.2rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                        onClick={() => setCurrentView('rearrangement')}
                        title="Rearrange Elements & Simulate"
                    >
                        🔄
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: currentView === 'cycle-analysis' ? 'var(--accent-blue)' : '',
                            padding: '8px',
                            fontSize: '1.2rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                        onClick={() => setCurrentView('cycle-analysis')}
                        title="Cycle Time Analysis"
                    >
                        📈
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: currentView === 'aggregation' ? 'var(--accent-blue)' : '',
                            padding: '8px',
                            fontSize: '1.2rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
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
                            padding: '8px',
                            fontSize: '1.2rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
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
                            padding: '8px',
                            fontSize: '1.2rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
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
                            padding: '8px',
                            fontSize: '1.2rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                        onClick={() => setCurrentView('spaghetti')}
                        title="Therblig Analysis - Layout & Icons"
                    >
                        📍
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: currentView === 'best-worst' ? 'var(--accent-blue)' : '',
                            padding: '8px',
                            fontSize: '1.2rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
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
                            padding: '8px',
                            fontSize: '1.2rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
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
                            padding: '8px',
                            fontSize: '1.2rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
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
                        style={{
                            padding: '8px',
                            fontSize: '1.2rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>

                    <div style={{ width: '30px', height: '1px', backgroundColor: '#555', margin: '5px 0' }}></div>

                    <button
                        className="btn"
                        style={{
                            backgroundColor: '#f80',
                            padding: '8px',
                            fontSize: '1.2rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                        onClick={() => document.getElementById('header-logo-upload')?.click()}
                        title="Upload Logo/Watermark"
                    >
                        🎨
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: '#0a5',
                            padding: '8px',
                            fontSize: '1.2rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                        onClick={() => window.dispatchEvent(new CustomEvent('screenshot'))}
                        title="Capture Screenshot"
                    >
                        📸
                    </button>

                    <div style={{ width: '30px', height: '1px', backgroundColor: '#555', margin: '5px 0' }}></div>

                    <button
                        className="btn"
                        style={{
                            backgroundColor: '#05a',
                            padding: '8px',
                            fontSize: '1.2rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                        onClick={() => window.dispatchEvent(new CustomEvent('export-json'))}
                        title="Export Analysis Data (JSON)"
                    >
                        💾
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: '#0a5',
                            padding: '8px',
                            fontSize: '1.2rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                        onClick={onOpenSessionManager}
                        title="Manage Saved Sessions"
                    >
                        📂
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
