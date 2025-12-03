import React, { useState, useEffect, useRef } from 'react';
import VoiceCommandRecognizer, { VOICE_COMMANDS } from '../../utils/voiceCommandRecognizer';

function VoiceCommandPanel({ onCommand, onClose }) {
    const [isListening, setIsListening] = useState(false);
    const [status, setStatus] = useState({ type: 'idle', message: 'Siap' });
    const [language, setLanguage] = useState('id-ID');
    const [commandHistory, setCommandHistory] = useState([]);
    const [continuousMode, setContinuousMode] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const recognizerRef = useRef(null);

    useEffect(() => {
        // Check browser support
        if (!VoiceCommandRecognizer.isSupported()) {
            setStatus({
                type: 'error',
                message: 'Browser tidak mendukung Voice Recognition. Gunakan Chrome atau Edge.'
            });
            return;
        }

        // Initialize recognizer
        const recognizer = new VoiceCommandRecognizer();
        recognizerRef.current = recognizer;

        // Set callbacks
        recognizer.onCommand((command, transcript, confidence) => {
            // Add to history
            setCommandHistory(prev => [
                {
                    command: command.id,
                    transcript,
                    confidence: (confidence * 100).toFixed(0),
                    timestamp: new Date().toLocaleTimeString()
                },
                ...prev.slice(0, 4) // Keep last 5
            ]);

            // Execute command
            if (onCommand) {
                onCommand(command.action);
            }
        });

        recognizer.onStatus((type, message) => {
            setStatus({ type, message });
            setIsListening(type === 'listening');
        });

        return () => {
            if (recognizer) {
                recognizer.stop();
            }
        };
    }, [onCommand]);

    const handleToggleListening = () => {
        const recognizer = recognizerRef.current;
        if (!recognizer) return;

        if (isListening) {
            recognizer.stop();
        } else {
            recognizer.start();
        }
    };

    const handleLanguageChange = (lang) => {
        setLanguage(lang);
        if (recognizerRef.current) {
            recognizerRef.current.setLanguage(lang);
        }
    };

    const handleContinuousModeToggle = () => {
        const newMode = !continuousMode;
        setContinuousMode(newMode);
        if (recognizerRef.current) {
            recognizerRef.current.setContinuousMode(newMode);
        }
    };

    const getStatusColor = () => {
        switch (status.type) {
            case 'listening': return '#0a5';
            case 'success': return '#0078d4';
            case 'error': return '#c50f1f';
            default: return '#666';
        }
    };

    const commands = VoiceCommandRecognizer.getCommands(language);

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '350px',
            backgroundColor: '#1e1e1e',
            border: '1px solid #444',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: isMinimized ? '50px' : '500px',
            transition: 'max-height 0.3s ease'
        }}>
            {/* Header */}
            <div
                onClick={() => setIsMinimized(!isMinimized)}
                style={{
                    padding: '12px 15px',
                    backgroundColor: '#2d2d2d',
                    borderTopLeftRadius: '8px',
                    borderTopRightRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: isMinimized ? 'none' : '1px solid #444'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🎤</span>
                    <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Voice Command</span>
                    {isListening && (
                        <span style={{
                            backgroundColor: '#0a5',
                            color: 'white',
                            borderRadius: '10px',
                            padding: '2px 6px',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            animation: 'pulse 1.5s infinite'
                        }}>
                            LISTENING
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#888',
                            fontSize: '1.2rem',
                            cursor: 'pointer',
                            padding: '0'
                        }}
                    >
                        ×
                    </button>
                    <span style={{ color: '#888', fontSize: '0.8rem' }}>
                        {isMinimized ? '▲' : '▼'}
                    </span>
                </div>
            </div>

            {/* Content */}
            {!isMinimized && (
                <div style={{ flex: 1, overflow: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {/* Controls */}
                    <div style={{
                        backgroundColor: '#252526',
                        padding: '12px',
                        borderRadius: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        {/* Microphone Button */}
                        <button
                            onClick={handleToggleListening}
                            disabled={status.type === 'error'}
                            style={{
                                width: '70px',
                                height: '70px',
                                borderRadius: '50%',
                                backgroundColor: isListening ? '#0a5' : '#333',
                                border: 'none',
                                fontSize: '2rem',
                                cursor: status.type === 'error' ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s',
                                boxShadow: isListening ? '0 0 20px rgba(0, 170, 85, 0.6)' : 'none',
                                animation: isListening ? 'pulse 1.5s infinite' : 'none'
                            }}
                        >
                            🎤
                        </button>

                        {/* Status */}
                        <div style={{
                            fontSize: '0.85rem',
                            color: getStatusColor(),
                            fontWeight: 'bold',
                            textAlign: 'center'
                        }}>
                            {status.message}
                        </div>

                        {/* Language Selector */}
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
                            <button
                                onClick={() => handleLanguageChange('id-ID')}
                                style={{
                                    padding: '5px 10px',
                                    backgroundColor: language === 'id-ID' ? '#0078d4' : '#333',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                }}
                            >
                                🇮🇩 ID
                            </button>
                            <button
                                onClick={() => handleLanguageChange('en-US')}
                                style={{
                                    padding: '5px 10px',
                                    backgroundColor: language === 'en-US' ? '#0078d4' : '#333',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                }}
                            >
                                🇬🇧 EN
                            </button>
                        </div>

                        {/* Continuous Mode */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ccc', fontSize: '0.8rem' }}>
                            <input
                                type="checkbox"
                                checked={continuousMode}
                                onChange={handleContinuousModeToggle}
                            />
                            <span>Auto-restart</span>
                        </label>
                    </div>

                    {/* Command History */}
                    {commandHistory.length > 0 && (
                        <div style={{
                            backgroundColor: '#252526',
                            padding: '10px',
                            borderRadius: '4px'
                        }}>
                            <h4 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '0.85rem' }}>History</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                {commandHistory.slice(0, 3).map((item, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            padding: '6px',
                                            backgroundColor: '#2a2a2a',
                                            borderRadius: '4px',
                                            borderLeft: '3px solid #0078d4',
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                            <span style={{ color: '#4da6ff', fontWeight: 'bold' }}>{item.command}</span>
                                            <span style={{ color: '#0a5' }}>{item.confidence}%</span>
                                        </div>
                                        <div style={{ color: '#888', fontSize: '0.7rem' }}>
                                            "{item.transcript}"
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Help Panel */}
                    <div style={{
                        backgroundColor: '#252526',
                        padding: '10px',
                        borderRadius: '4px'
                    }}>
                        <div
                            onClick={() => setShowHelp(!showHelp)}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                marginBottom: showHelp ? '8px' : 0
                            }}
                        >
                            <h4 style={{ margin: 0, color: '#fff', fontSize: '0.85rem' }}>Commands</h4>
                            <span style={{ color: '#888', fontSize: '0.9rem' }}>{showHelp ? '▼' : '▶'}</span>
                        </div>

                        {showHelp && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '6px' }}>
                                {commands.slice(0, 6).map((cmd, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            padding: '5px',
                                            backgroundColor: '#2a2a2a',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem'
                                        }}
                                    >
                                        <div style={{ color: '#4da6ff', fontWeight: 'bold', marginBottom: '2px' }}>
                                            {cmd.id}
                                        </div>
                                        <div style={{ color: '#888', fontSize: '0.7rem' }}>
                                            {cmd.keywords.slice(0, 2).map(k => `"${k}"`).join(', ')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
            `}</style>
        </div>
    );
}

export default VoiceCommandPanel;
