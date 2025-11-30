import React, { useState, useRef, useEffect } from 'react';

function ChatBox({ messages, onSendMessage, userName = 'You', style = {} }) {
    const [inputMessage, setInputMessage] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (!isCollapsed) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isCollapsed]);

    const handleSend = () => {
        if (inputMessage.trim()) {
            onSendMessage(inputMessage.trim());
            setInputMessage('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '320px',
            backgroundColor: '#1e1e1e',
            border: '1px solid #444',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: isCollapsed ? '50px' : '400px',
            transition: 'max-height 0.3s ease',
            ...style
        }}>
            {/* Header */}
            <div
                onClick={() => setIsCollapsed(!isCollapsed)}
                style={{
                    padding: '12px',
                    backgroundColor: '#2d2d2d',
                    borderTopLeftRadius: '8px',
                    borderTopRightRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: isCollapsed ? 'none' : '1px solid #444'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>💬</span>
                    <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Chat</span>
                    {messages.length > 0 && (
                        <span style={{
                            backgroundColor: '#0078d4',
                            color: 'white',
                            borderRadius: '10px',
                            padding: '2px 6px',
                            fontSize: '0.7rem',
                            fontWeight: 'bold'
                        }}>
                            {messages.length}
                        </span>
                    )}
                </div>
                <span style={{ color: '#888', fontSize: '0.8rem' }}>
                    {isCollapsed ? '▲' : '▼'}
                </span>
            </div>

            {/* Messages */}
            {!isCollapsed && (
                <>
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        minHeight: '200px',
                        maxHeight: '280px'
                    }}>
                        {messages.length === 0 ? (
                            <div style={{
                                color: '#666',
                                textAlign: 'center',
                                padding: '20px',
                                fontSize: '0.85rem'
                            }}>
                                Belum ada pesan
                            </div>
                        ) : (
                            messages.map((msg, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '2px'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span style={{
                                            color: msg.sender === userName ? '#0078d4' : '#4ec9b0',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold'
                                        }}>
                                            {msg.sender}
                                        </span>
                                        <span style={{
                                            color: '#666',
                                            fontSize: '0.7rem'
                                        }}>
                                            {formatTime(msg.timestamp)}
                                        </span>
                                    </div>
                                    <div style={{
                                        backgroundColor: msg.sender === userName ? '#0078d420' : '#2d2d2d',
                                        color: 'white',
                                        padding: '6px 10px',
                                        borderRadius: '6px',
                                        fontSize: '0.85rem',
                                        wordWrap: 'break-word'
                                    }}>
                                        {msg.message}
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div style={{
                        padding: '10px',
                        borderTop: '1px solid #444',
                        display: 'flex',
                        gap: '8px'
                    }}>
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ketik pesan..."
                            style={{
                                flex: 1,
                                padding: '8px',
                                backgroundColor: '#2d2d2d',
                                border: '1px solid #444',
                                borderRadius: '4px',
                                color: 'white',
                                fontSize: '0.85rem',
                                outline: 'none'
                            }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!inputMessage.trim()}
                            style={{
                                padding: '8px 12px',
                                backgroundColor: inputMessage.trim() ? '#0078d4' : '#444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: inputMessage.trim() ? 'pointer' : 'not-allowed',
                                fontSize: '0.85rem',
                                fontWeight: 'bold'
                            }}
                        >
                            Kirim
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default ChatBox;
