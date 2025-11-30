import React from 'react';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '../i18n/LanguageContext';

function Header({ videoName, onUpload, currentView, setCurrentView, onOpenSessionManager, theme, toggleTheme, onLogout, sidebarCollapsed }) {
    const { t } = useLanguage();

    return (
        <header style={{
            height: '100vh',
            width: sidebarCollapsed ? '0px' : '60px',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: sidebarCollapsed ? '0' : '20px 0',
            borderLeft: '1px solid var(--border-color)',
            justifyContent: 'flex-start',
            gap: '20px',
            transition: 'width 0.3s ease, padding 0.3s ease',
            overflow: 'hidden'
        }}>
            <div style={{ display: sidebarCollapsed ? 'none' : 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px', flexShrink: 0 }}>
                <h1 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--accent-blue)', writingMode: 'vertical-rl', textOrientation: 'mixed' }}>MAVi</h1>
            </div>

            {setCurrentView && (
                <div style={{
                    display: sidebarCollapsed ? 'none' : 'flex',
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
                        title={t('header.video')}
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
                        title={t('header.analysis')}
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
                        title={t('header.rearrange')}
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
                        title={t('header.cycleAnalysis')}
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
                        title={t('header.aggregation')}
                    >
                        Σ
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
                        title={t('header.standardTime')}
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
                        title={t('header.waste')}
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
                        title={t('header.therblig')}
                    >
                        📍
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: currentView === 'statistical-analysis' ? 'var(--accent-blue)' : '',
                            padding: '8px',
                            fontSize: '1.2rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                        onClick={() => setCurrentView('statistical-analysis')}
                        title="Statistical Analysis"
                    >
                        📉
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: currentView === 'mtm-calculator' ? 'var(--accent-blue)' : '',
                            padding: '8px',
                            fontSize: '1.2rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                        onClick={() => setCurrentView('mtm-calculator')}
                        title="MTM Calculator"
                    >
                        ⏱️
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: currentView === 'allowance-calculator' ? 'var(--accent-blue)' : '',
                            padding: '8px',
                            fontSize: '1.2rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                        onClick={() => setCurrentView('allowance-calculator')}
                        title="Allowance Calculator"
                    >
                        🔧
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
                        title={t('header.bestWorst')}
                    >
                        🏆
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: currentView === 'yamazumi' ? 'var(--accent-blue)' : '',
                            padding: '8px',
                            fontSize: '1.2rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                        onClick={() => setCurrentView('yamazumi')}
                        title="Yamazumi Chart"
                    >
                        🏔️
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: currentView === 'multi-axial' ? 'var(--accent-blue)' : '',
                            padding: '8px',
                            fontSize: '1.2rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                        onClick={() => setCurrentView('multi-axial')}
                        title="Multi-Axial Analysis"
                    >
                        📑
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: currentView === 'manual-creation' ? 'var(--accent-blue)' : '',
                            padding: '8px',
                            fontSize: '1.2rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                        onClick={() => setCurrentView('manual-creation')}
                        title="Manual Creation"
                    >
                        📘
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
                        title={t('header.comparison')}
                    >
                        🎥
                    </button>
                    <button
                        className="btn"
                        style={{
                            backgroundColor: currentView === 'broadcast' ? 'var(--accent-blue)' : '',
                            padding: '8px',
                            fontSize: '1.2rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                        onClick={() => setCurrentView('broadcast')}
                        title="Broadcast / Share Video"
                    >
                        📡
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
                        title={t('header.help')}
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

                    <LanguageSelector />

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
                        title={t('header.uploadLogo')}
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
                        title={t('header.screenshot')}
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
                        title={t('header.exportData')}
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
                        title={t('header.sessions')}
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
