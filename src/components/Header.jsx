import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '../i18n/LanguageContext';
import GlobalSettingsDialog from './GlobalSettingsDialog';

const MENU_CATEGORIES = {
    CORE: '🚀',
    AI: '🧠',
    IE: '📉',
    ADVANCED: '⚡',
    LEARNING: '🎓'
};

const MENU_ITEMS = [
    // MAIN MENU
    { path: '/menu', icon: '🏠', labelKey: 'header.mainMenu', title: 'Main Menu', category: 'CORE' },

    // CORE
    { path: '/', icon: '🎬', labelKey: 'header.video', exact: true, category: 'CORE' },
    { path: '/files', icon: '📂', labelKey: 'header.files', title: 'File Explorer', category: 'CORE' },

    // AI STUDIO
    { path: '/teachable-machine', icon: '🤖', title: 'TM Studio', labelKey: 'header.tmStudio', category: 'AI' },
    { path: '/studio-model', icon: '👨‍🏫', title: 'Studio Model', labelKey: 'header.studioModel', category: 'AI' },
    { path: '/ai-process', icon: '🧠', title: 'AI Process', labelKey: 'header.aiProcess', category: 'AI' },
    { path: '/realtime-compliance', icon: '🛡️', title: 'Real-time Compliance', labelKey: 'header.realtimeCompliance', category: 'AI' },

    // INDUSTRIAL ENGINEERING
    { path: '/swcs', icon: '📋', labelKey: 'header.swcs', title: 'Standard Work Combination Sheet', category: 'IE' },
    { path: '/yamazumi', icon: '🏔️', labelKey: 'header.yamazumi', title: 'Yamazumi Chart', category: 'IE' },
    { path: '/value-stream-map', icon: '🏭', labelKey: 'header.valueStreamMap', title: 'Value Stream Map', category: 'IE' },
    { path: '/therblig', icon: '📍', labelKey: 'header.therblig', title: 'Therblig Analysis', category: 'IE' },
    { path: '/statistical-analysis', icon: '📉', labelKey: 'header.statisticalAnalysis', title: 'Statistical Analysis', category: 'IE' },
    { path: '/best-worst', icon: '🏆', labelKey: 'header.bestWorst', category: 'IE' },
    { path: '/rearrangement', icon: '🔄', labelKey: 'header.rearrange', category: 'IE' },
    { path: '/waste-elimination', icon: '🗑️', labelKey: 'header.waste', category: 'IE' },
    { path: '/manual-creation', icon: '📘', labelKey: 'header.manualCreation', title: 'Manual Creation', category: 'IE' },

    // ADVANCED
    { path: '/comparison', icon: '🎥', labelKey: 'header.comparison', category: 'ADVANCED' },
    { path: '/multi-camera', icon: '📹', labelKey: 'header.multiCamera', title: 'Multi-Camera 3D Fusion', category: 'ADVANCED' },
    { path: '/vr-training', icon: '🥽', labelKey: 'header.vrTraining', title: 'VR Training Mode', category: 'ADVANCED' },
    { path: '/cycle-segmentation', icon: '🔄', labelKey: 'header.cycleSegmentation', title: 'Cycle Segmentation', category: 'ADVANCED' },

    // LEARNING & COLLABORATION
    { path: '/mavi-class', icon: '🎓', title: 'MAVi Class', labelKey: 'header.maviClass', category: 'LEARNING' },
    { path: '/knowledge-base', icon: '📚', labelKey: 'header.knowledgeBase', title: 'Knowledge Base', category: 'LEARNING' },
    { path: '/broadcast', icon: '📡', labelKey: 'header.broadcast', title: 'Broadcast', category: 'LEARNING' },
    { path: '/help', icon: '❓', labelKey: 'header.help', category: 'LEARNING' },
];

function Header({ videoName, onUpload, onOpenSessionManager, theme, toggleTheme, onLogout, sidebarCollapsed }) {
    const { t } = useLanguage();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Listen for global event to open AI settings
    useEffect(() => {
        const handleOpenAISettings = () => {
            setIsSettingsOpen(true);
        };
        window.addEventListener('open-ai-settings', handleOpenAISettings);
        return () => window.removeEventListener('open-ai-settings', handleOpenAISettings);
    }, []);

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

            <div style={{
                display: sidebarCollapsed ? 'none' : 'flex',
                flexDirection: 'column',
                gap: '10px',
                alignItems: 'center',
                width: '100%',
                overflowY: 'auto',
                flex: 1,
                paddingBottom: '20px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
            }}>
                <style>
                    {`
                        header div::-webkit-scrollbar {
                            display: none;
                        }
                    `}
                </style>

                {Object.keys(MENU_CATEGORIES).map((catKey, catIndex) => (
                    <React.Fragment key={catKey}>
                        {catIndex > 0 && <div style={{ width: '30px', height: '1px', backgroundColor: '#333', margin: '5px 0' }}></div>}

                        {/* Optionally add category header icon/label if space allows, but for now just visual separator */}

                        {MENU_ITEMS.filter(item => item.category === catKey).map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => isNaN(isActive) ? "btn" : (`btn ${isActive ? 'active' : ''}`)}
                                style={({ isActive }) => ({
                                    backgroundColor: isActive ? 'var(--accent-blue)' : '',
                                    padding: '8px',
                                    fontSize: '1.2rem',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '8px',
                                    transition: 'all 0.2s ease'
                                })}
                                title={item.labelKey ? t(item.labelKey) : item.title}
                            >
                                {item.icon}
                            </NavLink>
                        ))}
                    </React.Fragment>
                ))}

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

            <GlobalSettingsDialog
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />

            {!sidebarCollapsed && (
                <div style={{ marginTop: 'auto', marginBottom: '10px' }}>
                    <button
                        className="btn"
                        onClick={() => setIsSettingsOpen(true)}
                        title="AI Settings"
                        style={{
                            padding: '8px',
                            fontSize: '1.2rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: '#333',
                            border: '1px solid #555'
                        }}
                    >
                        ⚙️
                    </button>
                </div>
            )}
        </header>
    );
}

export default Header;
