import React, { useState, useEffect, useRef } from 'react';
import { getAllProjects } from '../utils/database';
import jsPDF from 'jspdf';
import { generateManualContent } from '../utils/aiGenerator';

function ManualCreation() {
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);
    const [videoSrc, setVideoSrc] = useState(null);
    const videoRef = useRef(null);

    // AI State
    const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
    const [showSettings, setShowSettings] = useState(false);
    const [generatingItems, setGeneratingItems] = useState({}); // { index: boolean }

    // Manual Data State
    const [manualData, setManualData] = useState([]);
    const [headerInfo, setHeaderInfo] = useState({
        // 🆔 Identifikasi Dokumen
        companyName: '',
        title: 'WORK INSTRUCTION MANUAL',
        docNo: '',
        issueDate: new Date().toISOString().split('T')[0],
        revisionDate: new Date().toISOString().split('T')[0],
        version: '1.0',
        author: '',
        // 🎯 Tujuan dan Ruang Lingkup
        purpose: '',
        scope: ''
    });

    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        if (selectedProjectId && projects.length > 0) {
            const project = projects.find(p => p.projectName === selectedProjectId);
            setSelectedProject(project);
            if (project.videoBlob) {
                setVideoSrc(URL.createObjectURL(project.videoBlob));
            }
            // Initialize manual data from measurements
            if (project.measurements) {
                setManualData(project.measurements.map(m => ({
                    ...m,
                    image: null, // To store captured screenshot
                    description: m.elementName || '',
                    keyPoints: '',
                    safety: ''
                })));
            }
        } else {
            setSelectedProject(null);
            setVideoSrc(null);
            setManualData([]);
        }
    }, [selectedProjectId, projects]);

    const loadProjects = async () => {
        try {
            const allProjects = await getAllProjects();
            setProjects(allProjects);
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    };

    const captureFrame = (index) => {
        if (!videoRef.current) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // Compress slightly

        setManualData(prev => {
            const newData = [...prev];
            newData[index].image = dataUrl;
            return newData;
        });
    };

    const updateManualItem = (index, field, value) => {
        setManualData(prev => {
            const newData = [...prev];
            newData[index][field] = value;
            return newData;
        });
    };

    const saveApiKey = (key) => {
        setApiKey(key);
        localStorage.setItem('gemini_api_key', key);
        setShowSettings(false);
    };

    const handleAiGenerate = async (index) => {
        const item = manualData[index];
        const taskName = item.description;

        if (!taskName) {
            alert("Please ensure the description (task name) is filled before generating AI content.");
            return;
        }
        if (!apiKey) {
            setShowSettings(true);
            return;
        }

        setGeneratingItems(prev => ({ ...prev, [index]: true }));

        try {
            const content = await generateManualContent(taskName, apiKey);
            setManualData(prev => {
                const newData = [...prev];
                newData[index] = {
                    ...newData[index],
                    description: content.description || newData[index].description,
                    keyPoints: content.keyPoints || '',
                    safety: content.safety || ''
                };
                return newData;
            });
        } catch (error) {
            alert("AI Generation failed: " + error.message);
        } finally {
            setGeneratingItems(prev => ({ ...prev, [index]: false }));
        }
    };

    const seekTo = (time) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
        }
    };

    const exportToPDF = () => {
        try {
            console.log('Starting PDF export...');

            if (!manualData || manualData.length === 0) {
                alert('Tidak ada data untuk diekspor. Silakan pilih proyek terlebih dahulu.');
                return;
            }

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            let yPos = 15;

            // Header
            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            doc.text(headerInfo.title || 'WORK INSTRUCTION MANUAL', pageWidth / 2, yPos, { align: 'center' });
            yPos += 10;

            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Doc No: ${headerInfo.docNo || '-'}`, 15, yPos);
            yPos += 5;
            doc.text(`Date: ${headerInfo.date || '-'}`, 15, yPos);
            yPos += 5;
            doc.text(`Author: ${headerInfo.author || '-'}`, 15, yPos);
            yPos += 10;

            // Table Header
            const tableX = 10;
            const colWidths = [15, 50, 60, 50];
            const rowHeight = 50;

            doc.setFillColor(200, 200, 200);
            doc.rect(tableX, yPos, colWidths.reduce((a, b) => a + b, 0), 8, 'F');

            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            let xPos = tableX + 2;
            doc.text('No', xPos, yPos + 5);
            xPos += colWidths[0];
            doc.text('Image', xPos, yPos + 5);
            xPos += colWidths[1];
            doc.text('Description / Key Points / Safety', xPos, yPos + 5);
            xPos += colWidths[2];
            doc.text('Time', xPos, yPos + 5);

            yPos += 8;

            // Table Body
            doc.setFont(undefined, 'normal');
            doc.setFontSize(8);

            manualData.forEach((item, index) => {
                // Check if we need a new page
                if (yPos + rowHeight > pageHeight - 20) {
                    doc.addPage();
                    yPos = 20;
                }

                // Draw cell borders
                xPos = tableX;
                doc.rect(xPos, yPos, colWidths[0], rowHeight); // No
                xPos += colWidths[0];
                doc.rect(xPos, yPos, colWidths[1], rowHeight); // Image
                xPos += colWidths[1];
                doc.rect(xPos, yPos, colWidths[2], rowHeight); // Description
                xPos += colWidths[2];
                doc.rect(xPos, yPos, colWidths[3], rowHeight); // Time

                // Fill content
                xPos = tableX + 2;
                doc.text(String(index + 1), xPos, yPos + 5);

                xPos += colWidths[0];
                // Add image if exists
                if (item.image) {
                    try {
                        doc.addImage(item.image, 'JPEG', xPos + 2, yPos + 2, 45, 45);
                    } catch (e) {
                        console.error('Error adding image:', e);
                        doc.text('(Image)', xPos + 2, yPos + 25);
                    }
                }

                xPos += colWidths[1];
                // Description, Key Points, Safety
                const textLines = [];
                if (item.description) textLines.push(`Desc: ${item.description}`);
                if (item.keyPoints) textLines.push(`Key: ${item.keyPoints}`);
                if (item.safety) textLines.push(`Safety: ${item.safety}`);

                const splitText = doc.splitTextToSize(textLines.join(' | '), colWidths[2] - 4);
                doc.text(splitText, xPos + 2, yPos + 5);

                xPos += colWidths[2];
                doc.text((item.duration ? item.duration.toFixed(1) : '0.0') + 's', xPos + 2, yPos + 5);

                yPos += rowHeight;
            });

            const filename = `${(headerInfo.title || 'Work_Instruction').replace(/\s+/g, '_')}.pdf`;
            console.log('Saving PDF as:', filename);
            doc.save(filename);
            console.log('PDF export completed successfully');
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Gagal mengekspor PDF: ' + error.message);
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-secondary)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>📘 Manual Creation</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        style={{
                            padding: '8px',
                            backgroundColor: '#333',
                            color: 'white',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                        title="AI Settings"
                    >
                        ⚙️
                    </button>
                    <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
                    >
                        <option value="">-- Pilih Proyek --</option>
                        {projects.map(p => (
                            <option key={p.projectName} value={p.projectName}>{p.projectName}</option>
                        ))}
                    </select>
                    <button
                        onClick={exportToPDF}
                        disabled={!selectedProject}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: selectedProject ? '#0078d4' : '#555',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: selectedProject ? 'pointer' : 'not-allowed'
                        }}
                    >
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{ backgroundColor: '#252526', padding: '20px', borderRadius: '8px', width: '400px', border: '1px solid #444' }}>
                        <h3 style={{ marginTop: 0, color: 'white' }}>AI Settings</h3>
                        <p style={{ color: '#ccc', fontSize: '0.9rem' }}>Enter your Google Gemini API Key to enable AI features.</p>
                        <input
                            type="password"
                            placeholder="Enter API Key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            style={{ width: '100%', padding: '8px', marginBottom: '15px', backgroundColor: '#333', border: '1px solid #555', color: 'white' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setShowSettings(false)} style={{ padding: '8px 16px', backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={() => saveApiKey(apiKey)} style={{ padding: '8px 16px', backgroundColor: '#0078d4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedProject ? (
                <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden' }}>
                    {/* Left Panel: Video & Header Info */}
                    <div style={{ flex: '0 0 400px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ backgroundColor: '#1e1e1e', padding: '10px', borderRadius: '8px' }}>
                            <h3 style={{ marginTop: 0, color: '#ccc', fontSize: '1rem' }}>Header Info</h3>
                            <div style={{ display: 'grid', gap: '10px' }}>
                                <input
                                    placeholder="Document Title"
                                    value={headerInfo.title}
                                    onChange={e => setHeaderInfo({ ...headerInfo, title: e.target.value })}
                                    style={{ padding: '5px', backgroundColor: '#333', border: '1px solid #555', color: 'white' }}
                                />
                                <input
                                    placeholder="Document No"
                                    value={headerInfo.docNo}
                                    onChange={e => setHeaderInfo({ ...headerInfo, docNo: e.target.value })}
                                    style={{ padding: '5px', backgroundColor: '#333', border: '1px solid #555', color: 'white' }}
                                />
                                <input
                                    placeholder="Author"
                                    value={headerInfo.author}
                                    onChange={e => setHeaderInfo({ ...headerInfo, author: e.target.value })}
                                    style={{ padding: '5px', backgroundColor: '#333', border: '1px solid #555', color: 'white' }}
                                />
                            </div>
                        </div>

                        <div style={{ flex: 1, backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {videoSrc && (
                                <video
                                    ref={videoRef}
                                    src={videoSrc}
                                    controls
                                    style={{ width: '100%', maxHeight: '100%' }}
                                />
                            )}
                        </div>
                        <div style={{ textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                            Pause video at desired frame and click "Capture" on the element.
                        </div>
                    </div>

                    {/* Right Panel: Elements List */}
                    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#1e1e1e', borderRadius: '8px', padding: '10px' }}>
                        {manualData.map((item, index) => (
                            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '15px', backgroundColor: '#252526', padding: '10px', borderRadius: '4px', border: '1px solid #333' }}>
                                {/* Image Section */}
                                <div style={{ width: '150px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <div style={{ width: '100%', height: '100px', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #444' }}>
                                        {item.image ? (
                                            <img src={item.image} alt="Step" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                                        ) : (
                                            <span style={{ color: '#555', fontSize: '0.8rem' }}>No Image</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => captureFrame(index)}
                                        style={{ padding: '5px', backgroundColor: '#444', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                                    >
                                        📸 Capture
                                    </button>
                                    <button
                                        onClick={() => seekTo(item.startTime)}
                                        style={{ padding: '5px', backgroundColor: '#333', color: '#ccc', border: '1px solid #555', cursor: 'pointer', fontSize: '0.8rem' }}
                                    >
                                        ▶ Seek Start
                                    </button>
                                </div>

                                {/* Text Inputs */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontWeight: 'bold', color: '#fff' }}>Step {index + 1}</span>
                                            <button
                                                onClick={() => handleAiGenerate(index)}
                                                disabled={generatingItems[index]}
                                                style={{
                                                    padding: '2px 8px',
                                                    backgroundColor: generatingItems[index] ? '#444' : 'transparent',
                                                    color: '#4caf50',
                                                    border: '1px solid #4caf50',
                                                    borderRadius: '4px',
                                                    cursor: generatingItems[index] ? 'wait' : 'pointer',
                                                    fontSize: '0.75rem',
                                                    display: 'flex', alignItems: 'center', gap: '4px'
                                                }}
                                            >
                                                {generatingItems[index] ? '✨ Generating...' : '✨ AI Assist'}
                                            </button>
                                        </div>
                                        <span style={{ color: '#888' }}>{item.duration.toFixed(1)}s</span>
                                    </div>

                                    <textarea
                                        placeholder="Description"
                                        value={item.description}
                                        onChange={e => updateManualItem(index, 'description', e.target.value)}
                                        style={{ width: '100%', height: '60px', backgroundColor: '#333', border: '1px solid #444', color: 'white', fontSize: '0.9rem', padding: '5px' }}
                                    />

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            placeholder="Key Points"
                                            value={item.keyPoints}
                                            onChange={e => updateManualItem(index, 'keyPoints', e.target.value)}
                                            style={{ flex: 1, backgroundColor: '#333', border: '1px solid #444', color: 'white', padding: '5px' }}
                                        />
                                        <input
                                            placeholder="Safety / Quality"
                                            value={item.safety}
                                            onChange={e => updateManualItem(index, 'safety', e.target.value)}
                                            style={{ flex: 1, backgroundColor: '#333', border: '1px solid #444', color: 'white', padding: '5px' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', border: '2px dashed #444', borderRadius: '8px' }}>
                    Pilih proyek untuk mulai membuat manual.
                </div>
            )}
        </div>
    );
}

export default ManualCreation;
