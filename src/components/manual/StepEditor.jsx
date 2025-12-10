import React, { useState } from 'react';
import ImageMarkupDialog from './ImageMarkupDialog';
import RichTextEditor from './RichTextEditor';

const StepEditor = ({ step, onChange, onCaptureImage, onAiImprove, onAiGenerate, isAiLoading, onVoiceDictate, isVoiceListening, videoTime }) => {
    const [showMarkup, setShowMarkup] = useState(false);

    if (!step) return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>Select a step to edit</div>;

    const handleChange = (field, value) => {
        onChange(step.id, { ...step, [field]: value });
    };

    const handleBulletAdd = (type) => {
        const newBullet = { type, text: '' };
        handleChange('bullets', [...(step.bullets || []), newBullet]);
    };

    const handleBulletChange = (index, text) => {
        const newBullets = [...(step.bullets || [])];
        newBullets[index].text = text;
        handleChange('bullets', newBullets);
    };

    const handleBulletDelete = (index) => {
        const newBullets = [...(step.bullets || [])];
        newBullets.splice(index, 1);
        handleChange('bullets', newBullets);
    };

    const handleMarkupSave = (newDataUrl) => {
        handleChange('media', { ...step.media, url: newDataUrl });
    };

    return (
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#1e1e1e', color: '#fff' }}>
            {/* Step Header */}
            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', color: '#888', fontSize: '0.8rem', marginBottom: '5px' }}>Step Title</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                        value={step.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        style={{ flex: 1, padding: '10px', fontSize: '1.2rem', backgroundColor: '#252526', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
                        placeholder="Enter step title..."
                    />
                    {onAiGenerate && (
                        <button
                            onClick={() => onAiGenerate(step.id, step.title)}
                            disabled={isAiLoading || !step.title}
                            style={{
                                padding: '0 15px',
                                backgroundColor: '#0078d4',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: (isAiLoading || !step.title) ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                opacity: (isAiLoading || !step.title) ? 0.6 : 1
                            }}
                            title="Generate instructions from title"
                        >
                            {isAiLoading ? '...' : '⚡ Generate'}
                        </button>
                    )}
                </div>
            </div>

            {/* Media Area */}
            <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#252526', borderRadius: '8px', border: '2px dashed #444', textAlign: 'center' }}>
                {step.media && step.media.url ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img src={step.media.url} alt="Step Media" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '4px' }} />
                        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px' }}>
                            <button
                                onClick={() => setShowMarkup(true)}
                                style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                                ✏️ Markup
                            </button>
                            <button
                                onClick={() => handleChange('media', null)}
                                style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                                ×
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: '40px' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🖼️</div>
                        <p style={{ color: '#888' }}>Drag and drop media here or</p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button
                                onClick={onCaptureImage}
                                style={{ padding: '8px 16px', backgroundColor: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                📷 Capture
                            </button>
                            <label style={{ padding: '8px 16px', backgroundColor: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer', display: 'inline-block' }}>
                                📂 Upload
                                <input
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                                handleChange('media', { type: 'image', url: event.target.result });
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                )}
            </div>

            {/* Markup Dialog */}
            <ImageMarkupDialog
                isOpen={showMarkup}
                onClose={() => setShowMarkup(false)}
                imageSrc={step.media?.url}
                onSave={handleMarkupSave}
            />

            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label style={{ display: 'block', color: '#888', fontSize: '0.8rem' }}>Instructions</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {onVoiceDictate && (
                            <button
                                onClick={() => onVoiceDictate(step.id)}
                                disabled={isAiLoading}
                                style={{
                                    padding: '4px 8px',
                                    backgroundColor: isVoiceListening ? '#ff4444' : 'transparent',
                                    color: isVoiceListening ? 'white' : '#888',
                                    border: `1px solid ${isVoiceListening ? '#ff4444' : '#888'}`,
                                    borderRadius: '4px',
                                    cursor: isAiLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.8rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    opacity: isAiLoading ? 0.6 : 1,
                                    animation: isVoiceListening ? 'pulse 1.5s infinite' : 'none'
                                }}
                                title="Voice dictation"
                            >
                                🎤 {isVoiceListening ? 'Listening...' : 'Dictate'}
                            </button>
                        )}
                        {onAiImprove && step.instructions && (
                            <button
                                onClick={() => onAiImprove(step.id, step)}
                                disabled={isAiLoading}
                                style={{
                                    padding: '4px 8px',
                                    backgroundColor: 'transparent',
                                    color: '#00d2ff',
                                    border: '1px solid #00d2ff',
                                    borderRadius: '4px',
                                    cursor: isAiLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '0.8rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    opacity: isAiLoading ? 0.6 : 1
                                }}
                            >
                                {isAiLoading ? 'Improving...' : '✨ AI Improve'}
                            </button>
                        )}
                    </div>
                </div>
                <RichTextEditor
                    value={step.instructions}
                    onChange={(html) => handleChange('instructions', html)}
                    placeholder="Detailed instructions for this step..."
                />
            </div>

            {/* Bullets / Alerts */}
            <div>
                <label style={{ display: 'block', color: '#888', fontSize: '0.8rem', marginBottom: '10px' }}>Detailed Points & Alerts</label>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <button onClick={() => handleBulletAdd('step')} style={{ ...bulletButtonStyle, borderLeft: '3px solid #888' }}>+ Step</button>
                    <button onClick={() => handleBulletAdd('note')} style={{ ...bulletButtonStyle, borderLeft: '3px solid #0078d4' }}>+ Note</button>
                    <button onClick={() => handleBulletAdd('warning')} style={{ ...bulletButtonStyle, borderLeft: '3px solid #ffaa00' }}>+ Warning</button>
                    <button onClick={() => handleBulletAdd('caution')} style={{ ...bulletButtonStyle, borderLeft: '3px solid #d13438' }}>+ Caution</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(step.bullets || []).map((bullet, index) => (
                        <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            <div style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: '#252526',
                                border: '1px solid #333',
                                borderRadius: '4px',
                                borderLeft: getBorderColor(bullet.type)
                            }}>
                                <div style={{ padding: '0 10px', color: '#888', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                    {bullet.type}
                                </div>
                                <input
                                    value={bullet.text}
                                    onChange={(e) => handleBulletChange(index, e.target.value)}
                                    style={{ flex: 1, padding: '10px', backgroundColor: 'transparent', border: 'none', color: '#fff', outline: 'none' }}
                                    placeholder={`Enter ${bullet.type} text...`}
                                />
                            </div>
                            <button
                                onClick={() => handleBulletDelete(index)}
                                style={{ padding: '0 10px', backgroundColor: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: '1.2rem' }}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const bulletButtonStyle = {
    padding: '6px 12px',
    backgroundColor: '#333',
    color: '#fff',
    border: 'none',
    borderRight: '1px solid #444',
    borderTop: '1px solid #444',
    borderBottom: '1px solid #444',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem'
};

const getBorderColor = (type) => {
    switch (type) {
        case 'note': return '4px solid #0078d4';
        case 'warning': return '4px solid #ffaa00';
        case 'caution': return '4px solid #d13438';
        default: return '4px solid #888';
    }
};

export default StepEditor;
