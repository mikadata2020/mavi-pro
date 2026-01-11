import React, { useState, useEffect } from 'react';
import { getSupabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { modules as staticModules } from '../data/maviClassData';
import {
    BookOpen,
    Video,
    FileText,
    Upload,
    Search,
    Youtube,
    Save,
    ExternalLink,
    ChevronRight,
    Loader,
    Key,
    ShieldCheck,
    Mail
} from 'lucide-react';
import { generateLicenseKey, sendLicenseEmailSimulation } from '../utils/licenseUtils';

function AdminPanel() {
    const { user, userRole, refreshRole, roleError, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);

    // MaviClass management state
    const [customContent, setCustomContent] = useState([]);
    const [selectedModuleId, setSelectedModuleId] = useState(null);
    const [selectedLessonId, setSelectedLessonId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingVideoUrl, setEditingVideoUrl] = useState('');

    // License Requests management state
    const [licenseRequests, setLicenseRequests] = useState([]);
    const [allLicenses, setAllLicenses] = useState([]);
    const [activeTab, setActiveTab] = useState('maviclass'); // 'maviclass', 'licenses', or 'generator'
    const [processingRequest, setProcessingRequest] = useState(null);
    const [manualEmail, setManualEmail] = useState('');
    const [isGeneratingManual, setIsGeneratingManual] = useState(false);

    useEffect(() => {
        // Only load if auth state is resolved
        if (!authLoading) {
            if (userRole === 'admin') {
                loadCustomContent();
                loadLicenseRequests();
                loadAllLicenses();
            } else {
                setLoading(false);
            }
        }
    }, [userRole, authLoading]);

    const loadCustomContent = async () => {
        try {
            const supabase = getSupabase();
            const { data, error } = await supabase
                .from('maviclass_content')
                .select('*');

            if (error) throw error;
            setCustomContent(data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error loading custom content:', error);
            setLoading(false);
        }
    };

    const handleSaveVideoUrl = async (identifier, url) => {
        setIsSaving(true);
        try {
            const supabase = getSupabase();
            const { error } = await supabase
                .from('maviclass_content')
                .upsert({
                    identifier,
                    video_url: url,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'identifier' });

            if (error) throw error;

            await loadCustomContent();
            alert('Video URL saved successfully!');
        } catch (error) {
            console.error('Error saving video URL:', error);
            alert('Failed to save video URL: ' + (error.message || 'Unknown error'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (identifier, file) => {
        if (!file) return;
        setUploading(true);
        try {
            const supabase = getSupabase();
            const fileExt = file.name.split('.').pop();
            const fileName = `${identifier}_${Date.now()}.${fileExt}`;
            const filePath = `resources/${fileName}`;

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('maviclass-resources')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('maviclass-resources')
                .getPublicUrl(filePath);

            // 3. Upsert to Table
            const { error: dbError } = await supabase
                .from('maviclass_content')
                .upsert({
                    identifier,
                    doc_url: publicUrl,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'identifier' });

            if (dbError) throw dbError;

            await loadCustomContent();
            alert('Document uploaded and saved successfully!');
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload document: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const loadLicenseRequests = async () => {
        try {
            const supabase = getSupabase();
            const { data, error } = await supabase
                .from('license_requests')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLicenseRequests(data || []);
        } catch (error) {
            console.error('Error loading license requests:', error);
        }
    };

    const loadAllLicenses = async () => {
        try {
            const supabase = getSupabase();
            const { data, error } = await supabase
                .from('licenses')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            // Normalize data to ensure 'id' and 'user_id' exist even if DB uses 'key_id' or 'claimed_by_user_id'
            const normalizedData = (data || []).map(item => ({
                ...item,
                id: item.id || item.key_id,
                user_id: item.user_id || item.claimed_by_user_id
            }));
            setAllLicenses(normalizedData);
        } catch (error) {
            console.error('Error loading licenses:', error);
        }
    };

    const handleUpdateRequestStatus = async (requestId, newStatus) => {
        setProcessingRequest(requestId);
        try {
            const supabase = getSupabase();
            const { error } = await supabase
                .from('license_requests')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', requestId);

            if (error) throw error;

            // If approved, generate a license key automatically
            if (newStatus === 'approved') {
                const request = licenseRequests.find(r => r.id === requestId);
                if (request) {
                    const newKey = generateLicenseKey();

                    // 1. Create the license in the 'licenses' table
                    const { error: licenseError } = await supabase
                        .from('licenses')
                        .insert({
                            key_string: newKey,
                            email: request.email,
                            user_id: request.user_id,
                            status: 'active'
                        });

                    if (licenseError) throw licenseError;

                    // 2. Simulate sending email
                    await sendLicenseEmailSimulation(request.email, newKey);

                    // 3. Refresh licenses list
                    await loadAllLicenses();
                }
            }

            await loadLicenseRequests();
            alert(`Request ${newStatus} successfully!${newStatus === 'approved' ? ' License key generated and sent to email.' : ''}`);
        } catch (error) {
            console.error('Error updating request status:', error);
            alert('Failed to update request: ' + error.message);
        } finally {
            setProcessingRequest(null);
        }
    };

    const handleGenerateManualKey = async () => {
        if (!manualEmail) {
            alert('Please enter an email address');
            return;
        }
        setIsGeneratingManual(true);
        try {
            const supabase = getSupabase();
            const newKey = generateLicenseKey();

            const { error } = await supabase
                .from('licenses')
                .insert({
                    key_string: newKey,
                    email: manualEmail,
                    status: 'active'
                });

            if (error) throw error;

            await sendLicenseEmailSimulation(manualEmail, newKey);
            await loadAllLicenses();
            setManualEmail('');
            alert(`Key generated successfully and sent to ${manualEmail}\nKey: ${newKey}`);
        } catch (error) {
            console.error('Error generating key:', error);
            alert('Failed to generate key: ' + error.message);
        } finally {
            setIsGeneratingManual(false);
        }
    };

    if (userRole !== 'admin') {
        const supabase = getSupabase();
        return (
            <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                backgroundColor: '#0a0a0a',
                height: '100vh',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔐</div>
                <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Access Denied</h1>
                <p style={{ color: '#888', maxWidth: '500px', margin: '0 auto 30px' }}>
                    You need admin privileges to access the management panel.
                    If you just granted yourself access via SQL, please click the refresh button below.
                </p>

                <div style={{
                    backgroundColor: '#1a1a1a',
                    padding: '24px',
                    borderRadius: '12px',
                    border: '1px solid #333',
                    textAlign: 'left',
                    width: '100%',
                    maxWidth: '600px',
                    marginBottom: '30px',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem'
                }}>
                    <div style={{ marginBottom: '12px' }}>
                        <span style={{ color: '#0078d4' }}>Account Email:</span> {user?.email}
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <span style={{ color: '#0078d4' }}>Your User ID:</span> <code style={{ backgroundColor: '#222', padding: '2px 6px', borderRadius: '4px' }}>{user?.id}</code>
                        <button
                            onClick={() => { navigator.clipboard.writeText(user?.id); alert('ID copied!'); }}
                            style={{ marginLeft: '10px', background: '#333', border: 'none', color: '#ccc', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}
                        >
                            Copy ID
                        </button>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <span style={{ color: '#0078d4' }}>Current Role:</span> <span style={{ color: '#f44336' }}>{userRole || 'standard_user'}</span>
                    </div>
                    {roleError && (
                        <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#331111', borderRadius: '6px', border: '1px solid #662222' }}>
                            <span style={{ color: '#ff5555' }}>Database Error:</span> {roleError}
                            <div style={{ fontSize: '0.7rem', marginTop: '4px', color: '#888' }}>
                                Tip: This usually means the 'user_roles' table is missing or RLS is blocking the query.
                            </div>
                        </div>
                    )}
                    <div>
                        <span style={{ color: '#0078d4' }}>Supabase Project:</span> <span style={{ color: '#888', fontSize: '0.8rem' }}>{supabase.supabaseUrl}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                    <button
                        onClick={() => refreshRole()}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#0078d4',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        🔄 Refresh My Role
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#333',
                            color: 'white',
                            border: '1px solid #444',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Reload App
                    </button>
                </div>

                <p style={{ marginTop: '40px', color: '#555', fontSize: '0.85rem' }}>
                    💡 Tip: Make sure the Supabase Project URL matches where you ran the SQL command.
                </p>
            </div>
        );
    }

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
    }

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0a0a0a' }}>
            {/* Tab Navigation */}
            <div style={{ padding: '20px 30px 0 30px', borderBottom: '1px solid #333' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setActiveTab('maviclass')}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: activeTab === 'maviclass' ? '#0078d4' : 'transparent',
                            color: activeTab === 'maviclass' ? 'white' : '#888',
                            border: 'none',
                            borderBottom: activeTab === 'maviclass' ? '3px solid #0078d4' : '3px solid transparent',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '600',
                            transition: 'all 0.2s'
                        }}
                    >
                        📚 MaviClass Content
                    </button>
                    <button
                        onClick={() => setActiveTab('licenses')}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: activeTab === 'licenses' ? '#0078d4' : 'transparent',
                            color: activeTab === 'licenses' ? 'white' : '#888',
                            border: 'none',
                            borderBottom: activeTab === 'licenses' ? '3px solid #0078d4' : '3px solid transparent',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            position: 'relative'
                        }}
                    >
                        🔑 License Requests
                        {licenseRequests.filter(r => r.status === 'pending').length > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                backgroundColor: '#ff4444',
                                color: 'white',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 'bold'
                            }}>
                                {licenseRequests.filter(r => r.status === 'pending').length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('generator')}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: activeTab === 'generator' ? '#0078d4' : 'transparent',
                            color: activeTab === 'generator' ? 'white' : '#888',
                            border: 'none',
                            borderBottom: activeTab === 'generator' ? '3px solid #0078d4' : '3px solid transparent',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '600',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <ShieldCheck size={18} /> Key Generator
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, overflow: 'hidden' }}>
                {activeTab === 'maviclass' ? (
                    <div style={{ display: 'flex', height: '100%', gap: '30px', padding: '30px' }}>
                        {/* Modules Panel */}
                        <div style={{ flex: 1, backgroundColor: '#1e1e1e', borderRadius: '12px', padding: '24px', overflowY: 'auto', border: '1px solid #333' }}>
                            <h2 style={{ margin: '0 0 24px 0', color: 'white', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <BookOpen size={24} color="#0078d4" /> MaviClass Course
                            </h2>
                            {staticModules.map(module => (
                                <div key={module.id} style={{ marginBottom: '15px' }}>
                                    <div
                                        onClick={() => {
                                            setSelectedModuleId(selectedModuleId === module.id ? null : module.id);
                                            setSelectedLessonId(null);
                                        }}
                                        style={{
                                            padding: '14px 18px',
                                            backgroundColor: selectedModuleId === module.id ? '#2a2a2a' : '#111',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            border: `1px solid ${selectedModuleId === module.id ? '#0078d4' : '#333'}`,
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: module.color }}></div>
                                            <span style={{ color: 'white', fontWeight: '600' }}>{module.title}</span>
                                        </div>
                                        <ChevronRight size={18} color="#666" style={{ transform: selectedModuleId === module.id ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
                                    </div>

                                    {selectedModuleId === module.id && (
                                        <div style={{ paddingLeft: '24px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div
                                                onClick={() => setSelectedLessonId('module-settings')}
                                                style={{
                                                    padding: '12px 15px',
                                                    backgroundColor: selectedLessonId === 'module-settings' ? '#0078d420' : 'transparent',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    color: selectedLessonId === 'module-settings' ? '#0078d4' : '#aaa',
                                                    fontSize: '0.95rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    border: `1px solid ${selectedLessonId === 'module-settings' ? '#0078d440' : 'transparent'}`
                                                }}
                                            >
                                                <FileText size={16} /> Module Resources
                                            </div>

                                            {module.lessons.map(lesson => (
                                                <div
                                                    key={lesson.id}
                                                    onClick={() => {
                                                        setSelectedLessonId(lesson.id);
                                                        const custom = customContent.find(c => c.identifier === lesson.id);
                                                        setEditingVideoUrl(custom?.video_url || lesson.content.videoUrl || '');
                                                    }}
                                                    style={{
                                                        padding: '12px 15px',
                                                        backgroundColor: selectedLessonId === lesson.id ? '#0078d420' : 'transparent',
                                                        borderRadius: '8px',
                                                        cursor: 'pointer',
                                                        color: selectedLessonId === lesson.id ? '#0078d4' : '#aaa',
                                                        fontSize: '0.95rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        border: `1px solid ${selectedLessonId === lesson.id ? '#0078d440' : 'transparent'}`
                                                    }}
                                                >
                                                    <Video size={16} /> {lesson.title}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Editor Panel */}
                        <div style={{ flex: 2, backgroundColor: '#111', borderRadius: '12px', padding: '40px', border: '1px solid #333', overflowY: 'auto' }}>
                            {selectedLessonId ? (
                                <div style={{ color: 'white', maxWidth: '800px' }}>
                                    {selectedLessonId === 'module-settings' ? (
                                        <>
                                            <h2 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>
                                                Resources: <span style={{ color: '#0078d4' }}>{staticModules.find(m => m.id === selectedModuleId)?.title}</span>
                                            </h2>
                                            <p style={{ color: '#888', marginBottom: '40px', lineHeight: '1.6' }}>
                                                Upload reference documents (PDF, Excel, or Word) that will be available for learners to download within this module.
                                            </p>

                                            <div style={{ backgroundColor: '#1e1e1e', padding: '30px', borderRadius: '16px', border: '1px solid #333' }}>
                                                <h4 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem' }}>
                                                    <Upload size={22} color="#0078d4" /> Reference Document
                                                </h4>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                    <div style={{
                                                        height: '120px',
                                                        border: '2px dashed #444',
                                                        borderRadius: '12px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '10px',
                                                        backgroundColor: '#0a0a0a',
                                                        position: 'relative'
                                                    }}>
                                                        <Upload size={30} color="#666" />
                                                        <span style={{ color: '#666', fontSize: '0.9rem' }}>Click or drag to upload document</span>
                                                        <input
                                                            type="file"
                                                            onChange={(e) => handleFileUpload(selectedModuleId, e.target.files[0])}
                                                            disabled={uploading}
                                                            style={{
                                                                position: 'absolute',
                                                                top: 0,
                                                                left: 0,
                                                                width: '100%',
                                                                height: '100%',
                                                                opacity: 0,
                                                                cursor: uploading ? 'not-allowed' : 'pointer'
                                                            }}
                                                        />
                                                    </div>

                                                    {uploading && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#0078d4' }}>
                                                            <Loader size={20} style={{ animation: 'spin 2s linear infinite' }} />
                                                            <span>Uploading to Supabase Storage...</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {customContent.find(c => c.identifier === selectedModuleId)?.doc_url && (
                                                    <div style={{
                                                        marginTop: '30px',
                                                        padding: '15px 20px',
                                                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                                        borderRadius: '10px',
                                                        border: '1px solid rgba(76, 175, 80, 0.3)',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                            <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(76, 175, 80, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <FileText size={20} color="#4CAF50" />
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: '600', color: '#4CAF50', fontSize: '0.95rem' }}>Active Document</div>
                                                                <div style={{ fontSize: '0.8rem', color: '#888' }}>Uploaded on Supabase Storage</div>
                                                            </div>
                                                        </div>
                                                        <a
                                                            href={customContent.find(c => c.identifier === selectedModuleId).doc_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            style={{
                                                                padding: '8px 16px',
                                                                backgroundColor: '#4CAF50',
                                                                borderRadius: '6px',
                                                                color: 'white',
                                                                textDecoration: 'none',
                                                                fontSize: '0.85rem',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px'
                                                            }}
                                                        >
                                                            <ExternalLink size={14} /> View Document
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <h2 style={{ fontSize: '1.8rem', marginBottom: '12px' }}>
                                                Lesson: <span style={{ color: '#0078d4' }}>{staticModules.find(m => m.id === selectedModuleId)?.lessons.find(l => l.id === selectedLessonId)?.title}</span>
                                            </h2>
                                            <p style={{ color: '#888', marginBottom: '40px', lineHeight: '1.6' }}>
                                                Override the default YouTube video for this lesson by entering a new URL below. This allows you to update course content dynamically without changing the code.
                                            </p>

                                            <div style={{ backgroundColor: '#1e1e1e', padding: '30px', borderRadius: '16px', border: '1px solid #333' }}>
                                                <h4 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.1rem' }}>
                                                    <Youtube size={22} color="#ff0000" /> YouTube Content
                                                </h4>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                    <div style={{ display: 'flex', gap: '15px' }}>
                                                        <div style={{ position: 'relative', flex: 1 }}>
                                                            <Youtube size={18} color="#666" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
                                                            <input
                                                                type="text"
                                                                value={editingVideoUrl}
                                                                onChange={(e) => setEditingVideoUrl(e.target.value)}
                                                                placeholder="Paste YouTube Video URL (e.g., https://youtube.com/watch?v=...)"
                                                                style={{
                                                                    width: '100%',
                                                                    padding: '14px 15px 14px 45px',
                                                                    backgroundColor: '#0a0a0a',
                                                                    border: '1px solid #444',
                                                                    borderRadius: '10px',
                                                                    color: 'white',
                                                                    fontSize: '1rem',
                                                                    outline: 'none',
                                                                    transition: 'border-color 0.2s'
                                                                }}
                                                                onFocus={(e) => e.target.style.borderColor = '#0078d4'}
                                                                onBlur={(e) => e.target.style.borderColor = '#444'}
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => handleSaveVideoUrl(selectedLessonId, editingVideoUrl)}
                                                            disabled={isSaving}
                                                            style={{
                                                                padding: '0 25px',
                                                                backgroundColor: '#0078d4',
                                                                border: 'none',
                                                                borderRadius: '10px',
                                                                color: 'white',
                                                                fontWeight: '700',
                                                                cursor: isSaving ? 'not-allowed' : 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '10px',
                                                                transition: 'all 0.2s ease',
                                                                boxShadow: '0 4px 12px rgba(0, 120, 212, 0.3)'
                                                            }}
                                                            onMouseEnter={(e) => { if (!isSaving) e.currentTarget.style.backgroundColor = '#1088e4'; }}
                                                            onMouseLeave={(e) => { if (!isSaving) e.currentTarget.style.backgroundColor = '#0078d4'; }}
                                                        >
                                                            {isSaving ? <Loader size={20} style={{ animation: 'spin 2s linear infinite' }} /> : <Save size={20} />}
                                                            Save Changes
                                                        </button>
                                                    </div>

                                                    <p style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <Search size={14} /> Tip: Make sure the video is public or unlisted for learners to view it.
                                                    </p>
                                                </div>

                                                {editingVideoUrl && (
                                                    <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '1px solid #333' }}>
                                                        <h5 style={{ color: '#888', marginBottom: '15px', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>Video Preview</h5>
                                                        <div style={{
                                                            width: '100%',
                                                            aspectRatio: '16/9',
                                                            backgroundColor: '#000',
                                                            borderRadius: '12px',
                                                            overflow: 'hidden',
                                                            border: '1px solid #333',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}>
                                                            {editingVideoUrl.includes('youtube.com') || editingVideoUrl.includes('youtu.be') ? (
                                                                <iframe
                                                                    width="100%"
                                                                    height="100%"
                                                                    src={`https://www.youtube.com/embed/${editingVideoUrl.split('v=')[1]?.split('&')[0] || editingVideoUrl.split('/').pop()}`}
                                                                    title="Video Preview"
                                                                    frameBorder="0"
                                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                    allowFullScreen
                                                                ></iframe>
                                                            ) : (
                                                                <span style={{ color: '#444' }}>No valid YouTube URL provided</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
                                    <div style={{
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '50%',
                                        backgroundColor: '#1a1a1a',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '24px'
                                    }}>
                                        <BookOpen size={50} color="#333" />
                                    </div>
                                    <h3 style={{ color: '#666', fontSize: '1.2rem', marginBottom: '10px' }}>Content Manager</h3>
                                    <p style={{ maxWidth: '300px', textAlign: 'center', color: '#555', lineHeight: '1.5' }}>
                                        Select a lesson or module from the sidebar to manage its dynamic content and resources.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : activeTab === 'licenses' ? (
                    <div style={{ padding: '30px', overflowY: 'auto', height: '100%' }}>
                        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                            <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '10px' }}>License Requests</h2>
                            <p style={{ color: '#888', marginBottom: '30px' }}>
                                Manage user license requests. Approve or reject requests to grant application access.
                            </p>

                            {licenseRequests.length === 0 ? (
                                <div style={{
                                    padding: '60px',
                                    textAlign: 'center',
                                    backgroundColor: '#1e1e1e',
                                    borderRadius: '12px',
                                    border: '1px solid #333'
                                }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
                                    <h3 style={{ color: '#666', marginBottom: '8px' }}>No License Requests</h3>
                                    <p style={{ color: '#555', fontSize: '0.9rem' }}>
                                        License requests from users will appear here.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {licenseRequests.map(request => (
                                        <div
                                            key={request.id}
                                            style={{
                                                backgroundColor: '#1e1e1e',
                                                padding: '24px',
                                                borderRadius: '12px',
                                                border: `1px solid ${request.status === 'pending' ? '#FFC107' :
                                                    request.status === 'approved' ? '#4CAF50' :
                                                        '#f44336'
                                                    }`,
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        borderRadius: '50%',
                                                        backgroundColor: request.status === 'pending' ? 'rgba(255, 193, 7, 0.2)' :
                                                            request.status === 'approved' ? 'rgba(76, 175, 80, 0.2)' :
                                                                'rgba(244, 67, 54, 0.2)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '1.2rem'
                                                    }}>
                                                        {request.status === 'pending' ? '⏳' :
                                                            request.status === 'approved' ? '✅' : '❌'}
                                                    </div>
                                                    <div>
                                                        <div style={{ color: 'white', fontSize: '1.1rem', fontWeight: '600', marginBottom: '4px' }}>
                                                            {request.email}
                                                        </div>
                                                        <div style={{ color: '#888', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                                                            User ID: {request.user_id?.substring(0, 8)}...
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '20px', color: '#888', fontSize: '0.85rem' }}>
                                                    <div>
                                                        <strong style={{ color: '#aaa' }}>Status:</strong>{' '}
                                                        <span style={{
                                                            color: request.status === 'pending' ? '#FFC107' :
                                                                request.status === 'approved' ? '#4CAF50' : '#f44336',
                                                            textTransform: 'capitalize',
                                                            fontWeight: '600'
                                                        }}>
                                                            {request.status}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <strong style={{ color: '#aaa' }}>Requested:</strong>{' '}
                                                        {new Date(request.created_at).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>

                                            {request.status === 'pending' && (
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button
                                                        onClick={() => handleUpdateRequestStatus(request.id, 'approved')}
                                                        disabled={processingRequest === request.id}
                                                        style={{
                                                            padding: '10px 20px',
                                                            backgroundColor: processingRequest === request.id ? '#444' : '#4CAF50',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            fontWeight: '600',
                                                            cursor: processingRequest === request.id ? 'not-allowed' : 'pointer',
                                                            fontSize: '0.9rem',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        {processingRequest === request.id ? 'Processing...' : '✓ Approve'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateRequestStatus(request.id, 'rejected')}
                                                        disabled={processingRequest === request.id}
                                                        style={{
                                                            padding: '10px 20px',
                                                            backgroundColor: processingRequest === request.id ? '#444' : 'transparent',
                                                            color: processingRequest === request.id ? '#888' : '#f44336',
                                                            border: '1px solid #f44336',
                                                            borderRadius: '8px',
                                                            fontWeight: '600',
                                                            cursor: processingRequest === request.id ? 'not-allowed' : 'pointer',
                                                            fontSize: '0.9rem',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        ✗ Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: '30px', overflowY: 'auto', height: '100%' }}>
                        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                                <div>
                                    <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '10px' }}>License Key Generator</h2>
                                    <p style={{ color: '#888' }}>
                                        Issue manual license keys for users and view history of all generated keys.
                                    </p>
                                </div>
                                <button
                                    onClick={() => loadAllLicenses()}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#1a1a1a',
                                        color: '#888',
                                        border: '1px solid #333',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    <Loader size={16} /> Refresh Keys
                                </button>
                            </div>

                            {/* Manual Generator Form */}
                            <div style={{
                                backgroundColor: '#1e1e1e',
                                padding: '30px',
                                borderRadius: '16px',
                                border: '1px solid #333',
                                marginBottom: '40px'
                            }}>
                                <h3 style={{ color: 'white', fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Key size={20} color="#0078d4" /> Generate Manual Key
                                </h3>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{ position: 'relative', flex: 1 }}>
                                        <Mail size={18} color="#666" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
                                        <input
                                            type="email"
                                            value={manualEmail}
                                            onChange={(e) => setManualEmail(e.target.value)}
                                            placeholder="Recipient Email Address"
                                            style={{
                                                width: '100%',
                                                padding: '14px 15px 14px 45px',
                                                backgroundColor: '#0a0a0a',
                                                border: '1px solid #444',
                                                borderRadius: '10px',
                                                color: 'white',
                                                fontSize: '1rem',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                    <button
                                        onClick={handleGenerateManualKey}
                                        disabled={isGeneratingManual}
                                        style={{
                                            padding: '0 30px',
                                            backgroundColor: '#0078d4',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '10px',
                                            fontWeight: '700',
                                            cursor: isGeneratingManual ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            boxShadow: '0 4px 12px rgba(0, 120, 212, 0.3)'
                                        }}
                                    >
                                        {isGeneratingManual ? (
                                            <Loader size={20} className="animate-spin" />
                                        ) : (
                                            <ShieldCheck size={20} />
                                        )}
                                        Generate & Send Key
                                    </button>
                                </div>
                                <p style={{ color: '#555', fontSize: '0.85rem', marginTop: '15px', fontStyle: 'italic' }}>
                                    Note: Generating a manual key will automatically record it in the database and simulate sending an email to the recipient.
                                </p>
                            </div>

                            {/* License History */}
                            <h3 style={{ color: 'white', fontSize: '1.2rem', marginBottom: '20px' }}>Active Licenses History</h3>
                            <div style={{ backgroundColor: '#1e1e1e', borderRadius: '12px', border: '1px solid #333', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ccc' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#111', borderBottom: '1px solid #333', textAlign: 'left' }}>
                                            <th style={{ padding: '16px' }}>Email</th>
                                            <th style={{ padding: '16px' }}>License Key</th>
                                            <th style={{ padding: '16px' }}>Status</th>
                                            <th style={{ padding: '16px' }}>Issued Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allLicenses.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#555' }}>
                                                    No licenses generated yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            allLicenses.map(license => (
                                                <tr key={license.id || license.key_id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                                                    <td style={{ padding: '16px', color: 'white' }}>{license.email || 'N/A'}</td>
                                                    <td style={{ padding: '16px' }}>
                                                        <code style={{
                                                            backgroundColor: '#0a0a0a',
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            border: '1px solid #333',
                                                            color: '#0078d4',
                                                            fontSize: '0.9rem'
                                                        }}>
                                                            {license.key_string}
                                                        </code>
                                                    </td>
                                                    <td style={{ padding: '16px' }}>
                                                        <span style={{
                                                            padding: '4px 10px',
                                                            borderRadius: '20px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '600',
                                                            backgroundColor: license.status === 'active' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                                                            color: license.status === 'active' ? '#4CAF50' : '#f44336',
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            {license.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '16px', color: '#666', fontSize: '0.85rem' }}>
                                                        {new Date(license.created_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .animate-spin {
                    animation: spin 2s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default AdminPanel;
