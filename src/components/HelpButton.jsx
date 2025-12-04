import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

const HelpButton = ({ title, content }) => {
    const [showHelp, setShowHelp] = useState(false);

    return (
        <>
            <button
                onClick={() => setShowHelp(true)}
                style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #666',
                    background: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.2)';
                    e.target.style.borderColor = '#00d2ff';
                }}
                onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255,255,255,0.1)';
                    e.target.style.borderColor = '#666';
                }}
                title={`Help - ${title}`}
            >
                <HelpCircle size={18} /> Help
            </button>

            {showHelp && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 9999,
                        padding: '20px'
                    }}
                    onClick={() => setShowHelp(false)}
                >
                    <div
                        style={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '12px',
                            padding: '30px',
                            maxWidth: '700px',
                            maxHeight: '85vh',
                            overflowY: 'auto',
                            color: '#fff',
                            position: 'relative',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowHelp(false)}
                            style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                background: 'transparent',
                                border: 'none',
                                color: '#999',
                                cursor: 'pointer',
                                padding: '5px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                            title="Close"
                        >
                            <X size={24} />
                        </button>

                        <h2 style={{ margin: '0 0 20px 0', color: '#00d2ff', paddingRight: '40px' }}>
                            {title}
                        </h2>

                        <div style={{ lineHeight: '1.8', color: '#ccc' }}>
                            {content}
                        </div>

                        <button
                            onClick={() => setShowHelp(false)}
                            style={{
                                marginTop: '25px',
                                padding: '12px 24px',
                                background: 'linear-gradient(45deg, #00d2ff, #3a7bd5)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                width: '100%',
                                fontSize: '1rem'
                            }}
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default HelpButton;
