import React, { useState, useRef, useEffect } from 'react';
import ChatBox from './ChatBox';

function BroadcastControls({
    isBroadcasting,
    isMuted,
    onToggleMute,
    chatMessages,
    onSendMessage,
    userName = 'Host',
    onStopBroadcast
}) {
    const [isVisible, setIsVisible] = useState(true);
    const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
    const [lastMessageCount, setLastMessageCount] = useState(0);

    // Detect new messages
    useEffect(() => {
        if (chatMessages.length > lastMessageCount && !isVisible) {
            setHasUnreadMessages(true);
        }
        setLastMessageCount(chatMessages.length);
    }, [chatMessages.length, lastMessageCount, isVisible]);

    // Clear unread when chat is opened
    useEffect(() => {
        if (isVisible) {
            setHasUnreadMessages(false);
        }
    }, [isVisible]);

    if (!isBroadcasting) return null;

    return (
        <>
            {/* Floating Controls Bar */}
            <div style={{
                position: 'fixed',
                top: '50%',
                right: '120px',
                transform: 'translateY(-50%)',
                backgroundColor: '#1e1e1e',
                border: '1px solid #444',
                borderRadius: '8px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column', // Vertical layout
                gap: '10px',
                alignItems: 'center',
                zIndex: 1001,
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                transition: 'right 0.3s ease'
            }}>
                {/* Mute Button */}
                <button
                    onClick={onToggleMute}
                    style={{
                        padding: '12px',
                        backgroundColor: isMuted ? '#c50f1f' : '#107c10',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%', // Round buttons
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '1.2rem',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                    {isMuted ? '🔇' : '🎤'}
                </button>

                {/* Chat Toggle Button */}
                <button
                    onClick={() => setIsVisible(!isVisible)}
                    style={{
                        padding: '12px',
                        backgroundColor: '#0078d4',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '1.2rem',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                    }}
                    title={isVisible ? 'Hide Chat' : 'Show Chat'}
                >
                    💬
                    {hasUnreadMessages && (
                        <span style={{
                            position: 'absolute',
                            top: '-2px',
                            right: '-2px',
                            backgroundColor: '#c50f1f',
                            color: 'white',
                            borderRadius: '50%',
                            width: '14px',
                            height: '14px',
                            fontSize: '0.7rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            animation: 'pulse 1s infinite',
                            border: '2px solid #1e1e1e'
                        }}>
                            !
                        </span>
                    )}
                </button>

                {/* Stop Broadcast Button */}
                {onStopBroadcast && (
                    <button
                        onClick={onStopBroadcast}
                        style={{
                            padding: '12px',
                            backgroundColor: '#c50f1f',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '1.2rem',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="Stop Broadcasting"
                    >
                        ⏹
                    </button>
                )}
            </div>

            {/* Chat Box */}
            {isVisible && (
                <div style={{ position: 'fixed', bottom: '20px', right: '180px', zIndex: 1000 }}>
                    <ChatBox
                        messages={chatMessages}
                        onSendMessage={onSendMessage}
                        userName={userName}
                        style={{ bottom: 'auto', right: 'auto' }} // Reset default styles
                    />
                </div>
            )}

            {/* Pulse animation for notification */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </>
    );
}

export default BroadcastControls;
