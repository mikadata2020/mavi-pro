import React, { useState, useRef, useEffect } from 'react';
import { Upload, MessageSquare, Video, Loader, Send, Trash2, Maximize2, Minimize2, Zap } from 'lucide-react';
import { uploadFileToGemini, chatWithVideo, generateElementsFromVideo } from '../utils/aiGenerator';
import { getStoredApiKey } from '../utils/aiGenerator';

const VideoIntelligence = ({ videoRef, onClose, onUpdateMeasurements, isEmbedded = false }) => {
    const [fileUri, setFileUri] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, ready, error
    const [chatHistory, setChatHistory] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    // ... (handlers remain the same) ...

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
                content: `Video "${file.name}" uploaded successfully! You can now ask questions or generate elements.`
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

    const handleGenerateElements = async () => {
        if (!fileUri) return;

        setIsGenerating(true);
        setChatHistory(prev => [...prev, { role: 'system', content: '🔄 Analyzing video structure... This may take a minute.' }]);

        try {
            const elements = await generateElementsFromVideo(fileUri, null);

            if (onUpdateMeasurements && Array.isArray(elements) && elements.length > 0) {
                const newMeasurements = elements.map((el, i) => ({
                    id: Date.now() + i,
                    elementName: el.elementName || "Untitled Step",
                    startTime: Number(el.startTime),
                    endTime: Number(el.endTime),
                    duration: Number(el.duration) || (Number(el.endTime) - Number(el.startTime)),
                    category: el.category || "Value-added",
                    therblig: el.therblig || null
                }));

                onUpdateMeasurements(newMeasurements);
                setChatHistory(prev => [...prev, {
                    role: 'system',
                    content: `✅ Successfully generated ${newMeasurements.length} elements! The timeline has been updated.`
                }]);
            } else {
                setChatHistory(prev => [...prev, {
                    role: 'system',
                    content: `⚠️ Analysis complete but no elements were returned or they were in an invalid format.`
                }]);
            }

        } catch (error) {
            console.error("Geneartion failed:", error);
            setChatHistory(prev => [...prev, {
                role: 'system',
                content: `❌ Error generating elements: ${error.message}`
            }]);
        } finally {
            setIsGenerating(false);
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

    const containerStyle = isEmbedded ? {
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a1a',
        display: 'flex',
        flexDirection: 'column'
    } : {
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
    };

    return (
        <div style={containerStyle}>
            {/* Header */}
            <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#252526',
                borderRadius: isEmbedded ? '0' : '8px 8px 0 0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Video size={18} color="#A78BFA" />
                    <span style={{ fontWeight: '600', color: '#fff' }}>Gemini Video Intelligence</span>
                </div>
                {!isEmbedded && (
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
                )}
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
                        {/* Auto Generate Button Toolbar */}
                        <div style={{
                            padding: '10px 16px',
                            borderBottom: '1px solid #333',
                            backgroundColor: '#202020',
                            display: 'flex',
                            gap: '10px'
                        }}>
                            <button
                                onClick={handleGenerateElements}
                                disabled={isGenerating || isTyping}
                                style={{
                                    flex: 1,
                                    padding: '8px',
                                    backgroundColor: isGenerating ? '#444' : '#107c41',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    fontWeight: '500',
                                    fontSize: '0.85rem'
                                }}
                            >
                                {isGenerating ? <Loader size={14} className="spin" /> : <Zap size={14} />}
                                Auto-Generate Elements
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {chatHistory.map((msg, idx) => (
                                <div key={idx} style={{
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
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
                            {(isTyping || isGenerating) && (
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
                                placeholder="Ask about this video..."
                                disabled={isGenerating}
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
                                disabled={isTyping || !inputMessage.trim() || isGenerating}
                                style={{
                                    padding: '8px 12px',
                                    backgroundColor: (isTyping || isGenerating) ? '#444' : '#A78BFA',
                                    color: (isTyping || isGenerating) ? '#777' : '#000',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: (isTyping || isGenerating) ? 'default' : 'pointer'
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
