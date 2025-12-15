import React, { useState, useRef, useEffect } from 'react';
import { Upload, MessageSquare, Video, Loader, Send, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { uploadFileToGemini, chatWithVideo } from '../utils/aiGenerator';
import { getStoredApiKey } from '../utils/aiGenerator'; // Need to export this or just rely on the helpers handle it internally? 
// Actually aiGenerator doesn't export getStoredApiKey, but uploadFileToGemini handles it.

const VideoIntelligence = ({ videoRef, onClose }) => {
    const [fileUri, setFileUri] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, ready, error
    const [chatHistory, setChatHistory] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploadStatus('uploading');
        try {
            // Check API Key existence first (implicitly done by upload tool)
            const uri = await uploadFileToGemini(file);
            setFileUri(uri);
            setUploadStatus('ready');
            setChatHistory(prev => [...prev, {
                role: 'system',
                content: `Video "${file.name}" uploaded successfully! You can now ask questions about it.`
            }]);
        } catch (error) {
            console.error("Upload failed:", error);
            setUploadStatus('error');
            setChatHistory(prev => [...prev, {
                role: 'system',
                content: `Error uploading video: ${error.message}. Please check your API Key and try again.`
            }]);
        }
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || !fileUri) return;

        const userMsg = inputMessage;
        setInputMessage('');
        setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsTyping(true);

        try {
            const aiResponse = await chatWithVideo(userMsg, fileUri, chatHistory);
            setChatHistory(prev => [...prev, { role: 'ai', content: aiResponse }]);
        } catch (error) {
            console.error("Chat failed:", error);
            setChatHistory(prev => [...prev, { role: 'ai', content: `Error: ${error.message}` }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    return (
        <div style={{
            position: 'absolute',
            top: isExpanded ? '10px' : '60px',
            right: isExpanded ? '10px' : '20px',
            bottom: isExpanded ? '10px' : '20px',
            left: isExpanded ? '10px' : 'auto',
            width: isExpanded ? 'auto' : '380px',
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            transition: 'all 0.3s ease'
        }}>
            {/* Header */}
            <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#252526',
                borderRadius: '8px 8px 0 0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Video size={18} color="#A78BFA" /> // Purple accent for Geminish look
                    <span style={{ fontWeight: '600', color: '#fff' }}>Gemini Video Intelligence</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                        title={isExpanded ? "Collapse" : "Expand"}
                    >
                        {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                        title="Close"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Upload Section (if not ready) */}
                {uploadStatus !== 'ready' && (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                        color: '#888',
                        gap: '15px'
                    }}>
                        <div style={{
                            width: '60px', height: '60px',
                            borderRadius: '50%', backgroundColor: '#2d2d2d',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {uploadStatus === 'uploading' ? (
                                <Loader size={24} className="spin" color="#A78BFA" />
                            ) : (
                                <Upload size={24} color="#A78BFA" />
                            )}
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            {uploadStatus === 'uploading' ? (
                                <>
                                    <h4 style={{ margin: '0 0 5px 0', color: '#fff' }}>Uploading Video to Gemini...</h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem' }}>This allows the AI to "watch" and understand the content.</p>
                                </>
                            ) : (
                                <>
                                    <h4 style={{ margin: '0 0 5px 0', color: '#fff' }}>Analyze Your Video</h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', maxWidth: '250px' }}>
                                        Upload a video clip to identify anomalies, count cycles, or check safety compliance.
                                    </p>
                                    <button
                                        onClick={triggerFileUpload}
                                        style={{
                                            marginTop: '15px', padding: '8px 16px',
                                            backgroundColor: '#A78BFA', color: '#000', fontWeight: 'bold',
                                            border: 'none', borderRadius: '4px', cursor: 'pointer'
                                        }}
                                    >
                                        Select Video File
                                    </button>
                                </>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept="video/*"
                            style={{ display: 'none' }}
                        />
                    </div>
                )}

                {/* Chat Section (if ready) */}
                {uploadStatus === 'ready' && (
                    <>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {chatHistory.map((msg, idx) => (
                                <div key={idx} style={{
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '80%',
                                    backgroundColor: msg.role === 'user' ? '#A78BFA' : '#2d2d2d',
                                    color: msg.role === 'user' ? '#000' : '#e0e0e0',
                                    padding: '10px 14px',
                                    borderRadius: '12px',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.4'
                                }}>
                                    {msg.content}
                                </div>
                            ))}
                            {isTyping && (
                                <div style={{ alignSelf: 'flex-start', color: '#666', fontSize: '0.8rem', marginLeft: '10px' }}>
                                    Gemini is analyzing video frames...
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div style={{
                            padding: '12px',
                            borderTop: '1px solid #333',
                            backgroundColor: '#1e1e1e',
                            display: 'flex',
                            gap: '8px'
                        }}>
                            <button
                                onClick={() => { setUploadStatus('idle'); setFileUri(null); setChatHistory([]); }}
                                title="Upload New Video"
                                style={{ padding: '8px', backgroundColor: '#333', border: 'none', borderRadius: '4px', color: '#aaa', cursor: 'pointer' }}
                            >
                                <Trash2 size={18} />
                            </button>
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask about this video (e.g., 'Is the worker wearing gloves?')"
                                style={{
                                    flex: 1,
                                    backgroundColor: '#2d2d2d',
                                    border: '1px solid #444',
                                    borderRadius: '4px',
                                    color: 'white',
                                    padding: '8px 12px',
                                    outline: 'none'
                                }}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={isTyping || !inputMessage.trim()}
                                style={{
                                    padding: '8px 12px',
                                    backgroundColor: isTyping ? '#444' : '#A78BFA',
                                    color: isTyping ? '#777' : '#000',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: isTyping ? 'default' : 'pointer'
                                }}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </>
                )}
            </div>

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default VideoIntelligence;
