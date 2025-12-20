import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '../i18n/LanguageContext';
import GlobalSettingsDialog from './GlobalSettingsDialog';

const MENU_ITEMS = [
    { path: '/workflow-guide', icon: '🚀', title: 'Workflow Guide', labelKey: 'header.workflowGuide' },
    { path: '/', icon: '🎬', labelKey: 'header.video', exact: true },
    { path: '/ai-process', icon: '🧠', title: 'AI Process', labelKey: 'header.aiProcess' },
    { path: '/rearrangement', icon: '🔄', labelKey: 'header.rearrange' },
    { path: '/waste-elimination', icon: '🗑️', labelKey: 'header.waste' },
    { path: '/therblig', icon: '📍', labelKey: 'header.therblig', title: 'Therblig Analysis' },
    { path: '/statistical-analysis', icon: '📉', labelKey: 'header.statisticalAnalysis', title: 'Statistical Analysis' },
    { path: '/best-worst', icon: '🏆', labelKey: 'header.bestWorst' },
    { path: '/yamazumi', icon: '🏔️', labelKey: 'header.yamazumi', title: 'Yamazumi Chart' },
    { path: '/manual-creation', icon: '📘', labelKey: 'header.manualCreation', title: 'Manual Creation' },
    { path: '/value-stream-map', icon: '🏭', labelKey: 'header.valueStreamMap', title: 'Value Stream Map' },
    { path: '/comparison', icon: '🎥', labelKey: 'header.comparison' },
    { path: '/multi-camera', icon: '📹', labelKey: 'header.multiCamera', title: 'Multi-Camera 3D Fusion' },
    { path: '/vr-training', icon: '🥽', labelKey: 'header.vrTraining', title: 'VR Training Mode' },
    { path: '/knowledge-base', icon: '📚', labelKey: 'header.knowledgeBase', title: 'Knowledge Base' },
    { path: '/broadcast', icon: '📡', labelKey: 'header.broadcast', title: 'Broadcast' },
    { path: '/action-recognition', icon: '🤖', labelKey: 'header.actionRecognition', title: 'Action Recognition' },
    { path: '/cycle-segmentation', icon: '🔄', labelKey: 'header.cycleSegmentation', title: 'Cycle Segmentation' },
    { path: '/files', icon: '📂', labelKey: 'header.files', title: 'File Explorer' },
    { path: '/diagnostics', icon: '🩺', labelKey: 'header.diagnostics', title: 'System Diagnostics' },
    { path: '/help', icon: '❓', labelKey: 'header.help' },
];

function Header({ videoName, onUpload, onOpenSessionManager, theme, toggleTheme, onLogout, sidebarCollapsed }) {
    const { t } = useLanguage();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

                {MENU_ITEMS.map((item) => (
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
                            borderRadius: '8px'
                        })}
                        title={item.labelKey ? t(item.labelKey) : item.title}
                    >
                        {item.icon}
                    </NavLink>
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
