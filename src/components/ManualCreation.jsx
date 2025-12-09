import React, { useState, useEffect, useRef } from 'react';
import { getAllProjects } from '../utils/database';
import HelpButton from './HelpButton';
import { helpContent } from '../utils/helpContent.jsx';
import GuideHeader from './manual/GuideHeader';
import StepList from './manual/StepList';
import StepEditor from './manual/StepEditor';
import { generateManualContent, improveManualContent } from '../utils/aiGenerator';
import VoiceCommandRecognizer from '../utils/voiceCommandRecognizer';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import PptxGenJS from 'pptxgenjs';

const generateId = () => Math.random().toString(36).substr(2, 9);

function ManualCreation() {
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);
    const [videoSrc, setVideoSrc] = useState(null);
    const videoRef = useRef(null);

    const [guide, setGuide] = useState({
        id: generateId(),
        title: '',
        summary: '',
        difficulty: 'Moderate',
        timeRequired: '',
        documentNumber: '',
        version: '1.0',
        status: 'Draft',
        author: '',
        revisionDate: new Date().toISOString().split('T')[0],
        effectiveDate: '',
        steps: []
    });

    const [activeStepId, setActiveStepId] = useState(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [layoutTemplate, setLayoutTemplate] = useState('standard'); // standard, compact, one-per-page
    const [isVoiceListening, setIsVoiceListening] = useState(false);
    const [voiceRecognizer] = useState(() => {
        if (VoiceCommandRecognizer.isSupported()) {
            const recognizer = new VoiceCommandRecognizer();
            recognizer.setDictationMode(true);
            recognizer.onDictation((transcript) => {
                // This will be handled by handleVoiceDictate
            });
            recognizer.onStatus((status, message) => {
                if (status === 'listening') {
                    setIsVoiceListening(true);
                } else {
                    setIsVoiceListening(false);
                }
            });
            return recognizer;
        }
        return null;
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

            if (project.measurements) {
                const newSteps = project.measurements.map(m => ({
                    id: generateId(),
                    title: m.elementName || 'New Step',
                    media: { type: 'video', url: null },
                    instructions: m.elementName || '',
                    bullets: [],
                    startTime: m.startTime,
                    duration: m.duration
                }));
                if (guide.steps.length === 0) {
                    setGuide(prev => ({
                        ...prev,
                        title: project.projectName || 'New Work Instruction',
                        steps: newSteps
                    }));
                    if (newSteps.length > 0) setActiveStepId(newSteps[0].id);
                }
            }
        } else {
            setSelectedProject(null);
            setVideoSrc(null);
            setGuide({
                id: generateId(),
                title: '',
                summary: '',
                difficulty: 'Moderate',
                timeRequired: '',
                documentNumber: '',
                version: '1.0',
                status: 'Draft',
                author: '',
                revisionDate: new Date().toISOString().split('T')[0],
                effectiveDate: '',
                steps: []
            });
            setActiveStepId(null);
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

    const handleStepSelect = (id) => setActiveStepId(id);

    const handleAddStep = () => {
        const newStep = {
            id: generateId(),
            title: 'New Step',
            media: null,
            instructions: '',
            bullets: []
        };
        setGuide(prev => ({
            ...prev,
            steps: [...prev.steps, newStep]
        }));
        setActiveStepId(newStep.id);
    };

    const handleDeleteStep = (id) => {
        if (!confirm('Are you sure you want to delete this step?')) return;
        setGuide(prev => {
            const newSteps = prev.steps.filter(s => s.id !== id);
            return { ...prev, steps: newSteps };
        });
        if (activeStepId === id) setActiveStepId(null);
    };

    const handleStepChange = (id, updatedStep) => {
        setGuide(prev => ({
            ...prev,
            steps: prev.steps.map(s => s.id === id ? updatedStep : s)
        }));
    };

    const [isAiLoading, setIsAiLoading] = useState(false);

    const getApiKey = () => localStorage.getItem('gemini_api_key');

    const handleAiGenerate = async (stepId, taskName) => {
        const apiKey = getApiKey();
        if (!apiKey) {
            alert('Please set your AI API Key in Settings first.');
            return;
        }

        setIsAiLoading(true);
        try {
            const content = await generateManualContent(taskName, apiKey);

            // Format instructions from description + key points
            let instructions = `<p>${content.description}</p>`;
            if (content.keyPoints) {
                instructions += `<p><strong>Key Points:</strong> ${content.keyPoints}</p>`;
            }

            const bullets = [];
            if (content.safety) {
                bullets.push({ type: 'warning', text: content.safety });
            }

            handleStepChange(stepId, {
                ...guide.steps.find(s => s.id === stepId),
                instructions: instructions,
                bullets: [...(guide.steps.find(s => s.id === stepId).bullets || []), ...bullets]
            });
        } catch (error) {
            console.error('AI Generate Error:', error);
            alert('Failed to generate content: ' + error.message);
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleAiImprove = async (stepId, currentStep) => {
        const apiKey = getApiKey();
        if (!apiKey) {
            alert('Please set your AI API Key in Settings first.');
            return;
        }

        setIsAiLoading(true);
        try {
            // Extract text from HTML instructions for AI (simplification)
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = currentStep.instructions;
            const plainDescription = tempDiv.textContent || tempDiv.innerText || '';

            const inputContent = {
                description: plainDescription,
                keyPoints: '', // We don't have separate keypoints in current model, assuming integrated
                safety: currentStep.bullets.filter(b => b.type === 'warning' || b.type === 'caution').map(b => b.text).join(', ')
            };

            const improved = await improveManualContent(inputContent, apiKey);

            handleStepChange(stepId, {
                ...currentStep,
                instructions: `<p>${improved.description}</p>`,
                // We typically don't want to replace bullets entirely, maybe just update text if matched?
                // For simplicity, let's append improved safety notes if they are new or different?
                // Actually, let's just stick to improving the instructions text for now to avoid messing up structural bullets.
            });
        } catch (error) {
            console.error('AI Improve Error:', error);
            alert('Failed to improve content: ' + error.message);
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleVoiceDictate = (stepId) => {
        if (!voiceRecognizer) {
            alert('Voice recognition is not supported in your browser.');
            return;
        }

        if (isVoiceListening) {
            voiceRecognizer.stop();
            setIsVoiceListening(false);
        } else {
            // Set up one-time dictation callback for this specific step
            voiceRecognizer.onDictation((transcript) => {
                const currentStep = guide.steps.find(s => s.id === stepId);
                if (currentStep) {
                    // Append dictated text to existing instructions
                    const newInstructions = currentStep.instructions
                        ? `${currentStep.instructions} ${transcript}.`
                        : `<p>${transcript}.</p>`;

                    handleStepChange(stepId, {
                        ...currentStep,
                        instructions: newInstructions
                    });
                }
                voiceRecognizer.stop();
            });

            voiceRecognizer.start();
        }
    };

    const handleCaptureFrame = () => {
        if (!videoRef.current || !activeStepId) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

        const currentStep = guide.steps.find(s => s.id === activeStepId);
        if (currentStep) {
            handleStepChange(activeStepId, {
                ...currentStep,
                media: { type: 'image', url: dataUrl }
            });
        }
    };

    const exportToPDF = () => {
        try {
            if (!guide.steps || guide.steps.length === 0) {
                alert('No steps to export.');
                return;
            }

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 15;
            let yPos = margin;

            // Document Title
            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text(guide.title || 'Work Instructions', pageWidth / 2, yPos, { align: 'center' });
            yPos += 8;

            // Black line under title
            doc.setLineWidth(0.5);
            doc.setDrawColor(0, 0, 0);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 8;

            // Document Metadata Table
            doc.setFontSize(8);
            const cellHeight = 6;
            const labelWidth = 38;
            const valueWidth = 52;

            const drawMetaRow = (label1, value1, label2, value2, y) => {
                const x1 = margin;
                const x2 = margin + labelWidth + valueWidth;

                // Draw all rectangles first (structure)
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(0.1);

                // Left label cell (with gray background)
                doc.setFillColor(245, 245, 245);
                doc.rect(x1, y, labelWidth, cellHeight, 'FD');

                // Left value cell (white background)
                doc.setFillColor(255, 255, 255);
                doc.rect(x1 + labelWidth, y, valueWidth, cellHeight, 'FD');

                // Right label cell (with gray background)
                doc.setFillColor(245, 245, 245);
                doc.rect(x2, y, labelWidth, cellHeight, 'FD');

                // Right value cell (white background)
                doc.setFillColor(255, 255, 255);
                doc.rect(x2 + labelWidth, y, valueWidth, cellHeight, 'FD');

                // Now add text on top
                doc.setTextColor(0, 0, 0);

                // Left pair text
                doc.setFont(undefined, 'bold');
                doc.text(label1, x1 + 2, y + 4);
                doc.setFont(undefined, 'normal');
                doc.text(value1 || '-', x1 + labelWidth + 2, y + 4);

                // Right pair text
                doc.setFont(undefined, 'bold');
                doc.text(label2, x2 + 2, y + 4);
                doc.setFont(undefined, 'normal');
                doc.text(value2 || '-', x2 + labelWidth + 2, y + 4);
            };

            drawMetaRow('Doc Number', guide.documentNumber, 'Revision Date', guide.revisionDate, yPos);
            yPos += cellHeight;
            drawMetaRow('Version', guide.version, 'Effective Date', guide.effectiveDate, yPos);
            yPos += cellHeight;
            drawMetaRow('Status', guide.status, 'Difficulty', guide.difficulty, yPos);
            yPos += cellHeight;
            drawMetaRow('Author', guide.author, 'Time Required', guide.timeRequired, yPos);
            yPos += cellHeight;

            // Description (full width)
            doc.setFillColor(245, 245, 245);
            doc.rect(margin, yPos, labelWidth, cellHeight, 'FD');
            doc.setFillColor(255, 255, 255);
            doc.rect(margin + labelWidth, yPos, pageWidth - margin - margin - labelWidth, cellHeight, 'FD');

            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'bold');
            doc.text('Description', margin + 2, yPos + 4);
            doc.setFont(undefined, 'normal');
            const descText = doc.splitTextToSize(guide.summary || '-', pageWidth - margin - margin - labelWidth - 4);
            doc.text(descText, margin + labelWidth + 2, yPos + 4);
            yPos += cellHeight + 10;

            // Steps
            guide.steps.forEach((step, index) => {
                // Check if we need a new page
                if (yPos > pageHeight - 80) {
                    doc.addPage();
                    yPos = margin;
                }

                // Step Title (above everything)
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(0, 0, 0);
                doc.text(`Step ${index + 1}: ${step.title}`, margin, yPos);
                yPos += 8;

                const contentStartY = yPos;
                const imageWidth = 70;
                const imageHeight = 55;
                const textStartX = margin + imageWidth + 5;
                const textWidth = pageWidth - textStartX - margin;

                // Image on the left
                if (step.media && step.media.url) {
                    try {
                        doc.addImage(step.media.url, 'JPEG', margin, yPos, imageWidth, imageHeight);
                    } catch (e) {
                        console.error('PDF Image Error', e);
                    }
                }

                // Instructions and Alerts on the right
                let textY = yPos;
                doc.setFontSize(9);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(0, 0, 0);

                // Instructions
                if (step.instructions) {
                    const plainText = step.instructions.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
                    if (plainText) {
                        const splitInst = doc.splitTextToSize(plainText, textWidth);
                        doc.text(splitInst, textStartX, textY);
                        textY += (splitInst.length * 4) + 3;
                    }
                }

                // Alerts/Bullets
                if (step.bullets && step.bullets.length > 0) {
                    step.bullets.forEach(b => {
                        let prefix = '';
                        let color = [0, 0, 0];

                        if (b.type === 'note') {
                            prefix = 'NOTE: ';
                            color = [0, 120, 212];
                        } else if (b.type === 'warning') {
                            prefix = 'WARNING: ';
                            color = [255, 170, 0];
                        } else if (b.type === 'caution') {
                            prefix = 'CAUTION: ';
                            color = [209, 52, 56];
                        } else {
                            prefix = '• ';
                        }

                        doc.setFont(undefined, 'bold');
                        doc.setTextColor(color[0], color[1], color[2]);
                        const prefixWidth = doc.getTextWidth(prefix);
                        doc.text(prefix, textStartX, textY);

                        doc.setFont(undefined, 'normal');
                        const bulletText = doc.splitTextToSize(b.text, textWidth - prefixWidth - 2);
                        doc.text(bulletText, textStartX + prefixWidth, textY);
                        textY += (bulletText.length * 4) + 2;
                        doc.setTextColor(0, 0, 0);
                    });
                }

                // Move yPos to the bottom of the tallest content (image or text)
                const imageBottom = contentStartY + imageHeight;
                const textBottom = textY;
                yPos = Math.max(imageBottom, textBottom) + 8;
            });

            doc.save(`${(guide.title || 'manual').replace(/\s+/g, '_')}.pdf`);
        } catch (e) {
            console.error(e);
            alert('Export failed: ' + e.message);
        }
    };

    const exportToWord = async () => {
        try {
            if (!guide.steps || guide.steps.length === 0) {
                alert('No steps to export.');
                return;
            }

            const children = [];

            // Title
            children.push(
                new Paragraph({
                    text: guide.title || 'Work Instructions',
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER
                })
            );

            // Metadata table (simplified as paragraphs)
            children.push(new Paragraph({ text: `Document Number: ${guide.documentNumber || '-'}` }));
            children.push(new Paragraph({ text: `Version: ${guide.version || '1.0'}` }));
            children.push(new Paragraph({ text: `Status: ${guide.status || 'Draft'}` }));
            children.push(new Paragraph({ text: `Author: ${guide.author || '-'}` }));
            children.push(new Paragraph({ text: `Description: ${guide.summary || '-'}` }));
            children.push(new Paragraph({ text: '' })); // Spacing

            // Steps
            for (let i = 0; i < guide.steps.length; i++) {
                const step = guide.steps[i];

                children.push(
                    new Paragraph({
                        text: `Step ${i + 1}: ${step.title}`,
                        heading: HeadingLevel.HEADING_2
                    })
                );

                // Instructions
                if (step.instructions) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = step.instructions;
                    const plainText = tempDiv.textContent || tempDiv.innerText || '';
                    children.push(new Paragraph({ text: plainText }));
                }

                // Bullets
                if (step.bullets && step.bullets.length > 0) {
                    step.bullets.forEach(b => {
                        children.push(
                            new Paragraph({
                                text: `${b.type.toUpperCase()}: ${b.text}`,
                                bullet: { level: 0 }
                            })
                        );
                    });
                }

                children.push(new Paragraph({ text: '' })); // Spacing
            }

            const doc = new Document({
                sections: [{
                    properties: {},
                    children: children
                }]
            });

            const blob = await Packer.toBlob(doc);
            saveAs(blob, `${(guide.title || 'manual').replace(/\s+/g, '_')}.docx`);
        } catch (e) {
            console.error(e);
            alert('Word export failed: ' + e.message);
        }
    };

    const exportToPowerPoint = async () => {
        try {
            if (!guide.steps || guide.steps.length === 0) {
                alert('No steps to export.');
                return;
            }

            const pptx = new PptxGenJS();

            // Title slide
            const titleSlide = pptx.addSlide();
            titleSlide.addText(guide.title || 'Work Instructions', {
                x: 0.5,
                y: 1.5,
                w: 9,
                h: 1.5,
                fontSize: 44,
                bold: true,
                align: 'center',
                color: '0078D4'
            });
            titleSlide.addText(`${guide.author || 'Author'} | ${guide.revisionDate || new Date().toLocaleDateString()}`, {
                x: 0.5,
                y: 3.5,
                w: 9,
                h: 0.5,
                fontSize: 18,
                align: 'center',
                color: '666666'
            });

            // Step slides
            for (let i = 0; i < guide.steps.length; i++) {
                const step = guide.steps[i];
                const slide = pptx.addSlide();

                // Step title
                slide.addText(`Step ${i + 1}: ${step.title}`, {
                    x: 0.5,
                    y: 0.3,
                    w: 9,
                    h: 0.6,
                    fontSize: 28,
                    bold: true,
                    color: '0078D4'
                });

                // Image (if available)
                if (step.media && step.media.url) {
                    slide.addImage({
                        data: step.media.url,
                        x: 0.5,
                        y: 1.2,
                        w: 4,
                        h: 3
                    });
                }

                // Instructions
                if (step.instructions) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = step.instructions;
                    const plainText = tempDiv.textContent || tempDiv.innerText || '';

                    slide.addText(plainText, {
                        x: step.media && step.media.url ? 5 : 0.5,
                        y: 1.2,
                        w: step.media && step.media.url ? 4.5 : 9,
                        h: 3,
                        fontSize: 14,
                        valign: 'top'
                    });
                }

                // Bullets
                if (step.bullets && step.bullets.length > 0) {
                    const bulletText = step.bullets.map(b => ({
                        text: `${b.type.toUpperCase()}: ${b.text}`,
                        options: { bullet: true, color: b.type === 'warning' ? 'FF0000' : b.type === 'caution' ? 'FFA500' : '0078D4' }
                    }));

                    slide.addText(bulletText, {
                        x: 0.5,
                        y: 4.5,
                        w: 9,
                        h: 2,
                        fontSize: 12
                    });
                }
            }

            await pptx.writeFile({ fileName: `${(guide.title || 'manual').replace(/\s+/g, '_')}.pptx` });
        } catch (e) {
            console.error(e);
            alert('PowerPoint export failed: ' + e.message);
        }
    };

    const activeStep = guide.steps.find(s => s.id === activeStepId);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#121212', color: '#fff' }}>
            {/* Top Bar */}
            <div style={{ height: '50px', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', padding: '0 20px', backgroundColor: '#1e1e1e' }}>
                <h2 style={{ fontSize: '1rem', margin: 0, marginRight: 'auto' }}>📘 Manual Creation (Dozuki Style)</h2>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                        style={{ padding: '4px 12px', backgroundColor: isPreviewMode ? '#0078d4' : '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        {isPreviewMode ? '✏️ Edit Mode' : '👁️ Preview Mode'}
                    </button>
                    <select
                        onChange={(e) => {
                            const format = e.target.value;
                            if (format === 'pdf') exportToPDF();
                            else if (format === 'word') exportToWord();
                            else if (format === 'pptx') exportToPowerPoint();
                            e.target.value = ''; // Reset
                        }}
                        disabled={!selectedProject}
                        style={{
                            padding: '4px 12px',
                            backgroundColor: '#555',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: selectedProject ? 'pointer' : 'not-allowed'
                        }}
                    >
                        <option value="">📥 Export As...</option>
                        <option value="pdf">📄 PDF</option>
                        <option value="word">📝 Word (.docx)</option>
                        <option value="pptx">📊 PowerPoint (.pptx)</option>
                    </select>
                    <select
                        value={layoutTemplate}
                        onChange={(e) => setLayoutTemplate(e.target.value)}
                        style={{ padding: '4px 12px', backgroundColor: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px' }}
                        title="Layout Template"
                    >
                        <option value="standard">📐 Standard</option>
                        <option value="compact">📋 Compact Table</option>
                        <option value="one-per-page">📄 One Per Page</option>
                    </select>
                    <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        style={{ padding: '4px', borderRadius: '4px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
                    >
                        <option value="">-- Select Project --</option>
                        {projects.map(p => (
                            <option key={p.projectName} value={p.projectName}>{p.projectName}</option>
                        ))}
                    </select>
                    <HelpButton
                        title={helpContent['manual-creation'].title}
                        content={helpContent['manual-creation'].content}
                    />
                </div>
            </div>

            {selectedProject ? (
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* Left: Step List */}
                    {!isPreviewMode && (
                        <StepList
                            steps={guide.steps}
                            activeStepId={activeStepId}
                            onSelectStep={handleStepSelect}
                            onAddStep={handleAddStep}
                            onDeleteStep={handleDeleteStep}
                        />
                    )}

                    {/* Center: Main Editor or Preview */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #333', overflowY: 'auto' }}>
                        {isPreviewMode ? (
                            <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#fff', color: '#000', minHeight: '100%' }}>
                                {/* Document Header */}
                                <div style={{ marginBottom: '30px', borderBottom: '3px solid #0078d4', paddingBottom: '10px' }}>
                                    <h1 style={{ margin: 0, fontSize: '2rem', color: '#0078d4' }}>{guide.title || 'Work Instructions'}</h1>
                                </div>

                                {/* Document Metadata Table */}
                                <table style={{ width: '100%', marginBottom: '30px', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <tbody>
                                        <tr>
                                            <td style={headerCellStyle}>Document Number</td>
                                            <td style={dataCellStyle}>{guide.documentNumber || '-'}</td>
                                            <td style={headerCellStyle}>Revision Date</td>
                                            <td style={dataCellStyle}>{guide.revisionDate || '-'}</td>
                                        </tr>
                                        <tr>
                                            <td style={headerCellStyle}>Version</td>
                                            <td style={dataCellStyle}>{guide.version || '1.0'}</td>
                                            <td style={headerCellStyle}>Effective Date</td>
                                            <td style={dataCellStyle}>{guide.effectiveDate || '-'}</td>
                                        </tr>
                                        <tr>
                                            <td style={headerCellStyle}>Status</td>
                                            <td style={dataCellStyle}>
                                                <span style={{
                                                    padding: '2px 8px',
                                                    backgroundColor: guide.status === 'Released' ? '#4caf50' : guide.status === 'Approved' ? '#2196f3' : '#ff9800',
                                                    color: 'white',
                                                    borderRadius: '3px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {guide.status || 'Draft'}
                                                </span>
                                            </td>
                                            <td style={headerCellStyle}>Difficulty</td>
                                            <td style={dataCellStyle}>{guide.difficulty}</td>
                                        </tr>
                                        <tr>
                                            <td style={headerCellStyle}>Author</td>
                                            <td style={dataCellStyle}>{guide.author || '-'}</td>
                                            <td style={headerCellStyle}>Time Required</td>
                                            <td style={dataCellStyle}>{guide.timeRequired || '-'}</td>
                                        </tr>
                                        <tr>
                                            <td style={headerCellStyle}>Description</td>
                                            <td colSpan="3" style={dataCellStyle}>{guide.summary || '-'}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                {/* Render steps based on layout template */}
                                {layoutTemplate === 'compact' ? (
                                    // Compact Table Layout
                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#0078d4', color: 'white' }}>
                                                <th style={{ padding: '10px', border: '1px solid #ddd', width: '5%' }}>#</th>
                                                <th style={{ padding: '10px', border: '1px solid #ddd', width: '20%' }}>Step</th>
                                                <th style={{ padding: '10px', border: '1px solid #ddd', width: '30%' }}>Image</th>
                                                <th style={{ padding: '10px', border: '1px solid #ddd', width: '45%' }}>Instructions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {guide.steps.map((step, idx) => (
                                                <tr key={step.id}>
                                                    <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                                                    <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>{step.title}</td>
                                                    <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                                        {step.media && step.media.url && (
                                                            <img src={step.media.url} alt={step.title} style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '4px' }} />
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '10px', border: '1px solid #ddd', fontSize: '13px' }}>
                                                        {step.instructions && <div dangerouslySetInnerHTML={{ __html: step.instructions }} />}
                                                        {step.bullets && step.bullets.length > 0 && (
                                                            <div style={{ marginTop: '8px' }}>
                                                                {step.bullets.map((b, i) => (
                                                                    <div key={i} style={{ fontSize: '12px', marginBottom: '4px', color: b.type === 'warning' ? '#ff9800' : b.type === 'caution' ? '#d13438' : '#0078d4' }}>
                                                                        <strong>{b.type.toUpperCase()}:</strong> {b.text}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : layoutTemplate === 'one-per-page' ? (
                                    // One Step Per Page Layout
                                    guide.steps.map((step, idx) => (
                                        <div key={step.id} style={{ marginBottom: '50px', pageBreakAfter: 'always', minHeight: '600px' }}>
                                            <h2 style={{ color: '#0078d4', marginBottom: '30px', fontSize: '2rem', textAlign: 'center' }}>
                                                Step {idx + 1}: {step.title}
                                            </h2>

                                            {step.media && step.media.url && (
                                                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                                                    <img
                                                        src={step.media.url}
                                                        alt={step.title}
                                                        style={{
                                                            maxWidth: '80%',
                                                            maxHeight: '400px',
                                                            borderRadius: '8px',
                                                            border: '2px solid #0078d4',
                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            {step.instructions && (
                                                <div
                                                    style={{
                                                        lineHeight: '1.8',
                                                        marginBottom: '20px',
                                                        fontSize: '16px',
                                                        padding: '20px',
                                                        backgroundColor: '#f9f9f9',
                                                        borderRadius: '8px'
                                                    }}
                                                    dangerouslySetInnerHTML={{ __html: step.instructions }}
                                                />
                                            )}

                                            {step.bullets && step.bullets.length > 0 && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
                                                    {step.bullets.map((b, i) => (
                                                        <div key={i} style={{
                                                            padding: '15px',
                                                            borderLeft: `6px solid ${b.type === 'note' ? '#0078d4' : b.type === 'warning' ? '#ffaa00' : b.type === 'caution' ? '#d13438' : '#888'}`,
                                                            backgroundColor: '#f9f9f9',
                                                            borderRadius: '0 8px 8px 0',
                                                            fontSize: '14px'
                                                        }}>
                                                            <strong style={{ color: b.type === 'note' ? '#0078d4' : b.type === 'warning' ? '#ffaa00' : b.type === 'caution' ? '#d13438' : '#888' }}>
                                                                {b.type.toUpperCase()}:
                                                            </strong> {b.text}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    // Standard Layout (current)
                                    guide.steps.map((step, idx) => (
                                        <div key={step.id} style={{ marginBottom: '50px', pageBreakInside: 'avoid' }}>
                                            <h3 style={{ color: '#0078d4', marginBottom: '20px' }}>Step {idx + 1}: {step.title}</h3>

                                            {/* Side-by-side layout */}
                                            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                                                {/* Left: Image */}
                                                {step.media && step.media.url && (
                                                    <div style={{ flex: '0 0 45%' }}>
                                                        <img
                                                            src={step.media.url}
                                                            alt={step.title}
                                                            style={{
                                                                width: '100%',
                                                                borderRadius: '4px',
                                                                border: '1px solid #ddd',
                                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                                            }}
                                                        />
                                                    </div>
                                                )}

                                                {/* Right: Instructions & Alerts */}
                                                <div style={{ flex: 1 }}>
                                                    {step.instructions && (
                                                        <div
                                                            style={{
                                                                lineHeight: '1.6',
                                                                marginBottom: '15px',
                                                                fontSize: '14px'
                                                            }}
                                                            dangerouslySetInnerHTML={{ __html: step.instructions }}
                                                        />
                                                    )}

                                                    {step.bullets && step.bullets.length > 0 && (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            {step.bullets.map((b, i) => (
                                                                <div key={i} style={{
                                                                    padding: '10px',
                                                                    borderLeft: `4px solid ${b.type === 'note' ? '#0078d4' : b.type === 'warning' ? '#ffaa00' : b.type === 'caution' ? '#d13438' : '#888'}`,
                                                                    backgroundColor: '#f9f9f9',
                                                                    display: 'flex',
                                                                    gap: '10px',
                                                                    alignItems: 'flex-start',
                                                                    borderRadius: '0 4px 4px 0'
                                                                }}>
                                                                    <strong style={{
                                                                        minWidth: '70px',
                                                                        color: b.type === 'note' ? '#0078d4' : b.type === 'warning' ? '#ffaa00' : b.type === 'caution' ? '#d13438' : '#888',
                                                                        fontSize: '12px'
                                                                    }}>
                                                                        {b.type.toUpperCase()}:
                                                                    </strong>
                                                                    <span style={{ fontSize: '13px' }}>{b.text}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <>
                                <GuideHeader headerInfo={guide} onChange={(info) => setGuide(prev => ({ ...prev, ...info }))} />
                                <StepEditor
                                    step={activeStep}
                                    onChange={handleStepChange}
                                    onCaptureImage={handleCaptureFrame}
                                    onAiImprove={handleAiImprove}
                                    onAiGenerate={handleAiGenerate}
                                    isAiLoading={isAiLoading}
                                    onVoiceDictate={handleVoiceDictate}
                                    isVoiceListening={isVoiceListening}
                                />
                            </>
                        )}
                    </div>

                    {/* Right: Video Source */}
                    {!isPreviewMode && (
                        <div style={{ width: '300px', backgroundColor: '#1e1e1e', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #333' }}>
                            <div style={{ padding: '10px', borderBottom: '1px solid #333', fontWeight: 'bold', color: '#ccc' }}>
                                Source Video
                            </div>
                            <div style={{ flex: 1, padding: '10px', display: 'flex', flexDirection: 'column' }}>
                                {videoSrc ? (
                                    <video
                                        ref={videoRef}
                                        src={videoSrc}
                                        controls
                                        style={{ width: '100%', borderRadius: '4px', backgroundColor: '#000' }}
                                    />
                                ) : (
                                    <div style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>
                                        No video loaded
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>📁 No Project Selected</p>
                        <p>Please select a project from the dropdown above to start creating a manual.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

// Style constants for preview table
const headerCellStyle = {
    padding: '8px',
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
    border: '1px solid #ddd',
    width: '20%'
};

const dataCellStyle = {
    padding: '8px',
    border: '1px solid #ddd'
};

export default ManualCreation;
