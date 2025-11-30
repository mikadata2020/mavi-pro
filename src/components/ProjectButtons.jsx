import React from 'react';

function ProjectButtons({
    onNewProject,
    onOpenProject,
    onExportProject,
    onImportProject,
    currentProject
}) {
    const handleImportClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                onImportProject(file);
            }
        };
        input.click();
    };

    const buttonStyle = {
        width: '35px',
        height: '35px',
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        transition: 'all 0.2s'
    };

    return (
        <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            zIndex: 1000
        }}>
            {/* New Project */}
            <button
                onClick={onNewProject}
                style={{
                    ...buttonStyle,
                    backgroundColor: 'var(--accent-blue)',
                    color: 'white',
                    fontSize: '0.8rem' // Adjust font size for the emoji
                }}
                title="Proyek Baru"
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
                🆕
            </button>

            {/* Open Project */}
            <button
                onClick={onOpenProject}
                style={{
                    ...buttonStyle,
                    backgroundColor: '#2d7d46',
                    color: 'white'
                }}
                title="Buka Proyek"
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
                📂
            </button>

            {/* Export Project */}
            <button
                onClick={onExportProject}
                disabled={!currentProject}
                style={{
                    ...buttonStyle,
                    backgroundColor: currentProject ? '#b8860b' : '#555',
                    color: 'white',
                    opacity: currentProject ? 1 : 0.5,
                    cursor: currentProject ? 'pointer' : 'not-allowed'
                }}
                title="Export Proyek"
                onMouseEnter={(e) => currentProject && (e.target.style.transform = 'scale(1.1)')}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
                💾
            </button>

            {/* Import Project */}
            <button
                onClick={handleImportClick}
                style={{
                    ...buttonStyle,
                    backgroundColor: '#8b4513',
                    color: 'white'
                }}
                title="Import Proyek"
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
                📥
            </button>
        </div>
    );
}

export default ProjectButtons;
