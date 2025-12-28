import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2, Video, Activity, Box } from 'lucide-react';
import ModelBuilder from './ModelBuilder';

// Mock data for initial testing
const MOCK_MODELS = [
    {
        id: 'model_001',
        name: 'Drilling Operation Standard',
        description: 'Standard work for manual drilling process',
        created: '2024-12-25',
        states: 4,
        rules: 6
    },
    {
        id: 'model_002',
        name: 'Assembly Station A',
        description: 'Cycle time analysis for station A',
        created: '2024-12-26',
        states: 5,
        rules: 8
    }
];

const StudioModel = () => {
    // Load from localStorage or default to MOCK
    const [models, setModels] = useState(() => {
        const saved = localStorage.getItem('motionModels');
        return saved ? JSON.parse(saved) : MOCK_MODELS;
    });

    // Persist changes
    useEffect(() => {
        localStorage.setItem('motionModels', JSON.stringify(models));
    }, [models]);

    const [searchTerm, setSearchTerm] = useState('');
    const [isBuilderActive, setIsBuilderActive] = useState(false);
    const [selectedModel, setSelectedModel] = useState(null);
    const [showHelp, setShowHelp] = useState(false);

    const handleCreateModel = () => {
        const newModel = {
            id: `model_${Date.now()}`,
            name: 'New Motion Model',
            description: 'Description of the new model',
            created: new Date().toISOString().split('T')[0],
            states: 0,
            rules: 0,
            statesList: [], // Initialize empty arrays
            transitions: [],
            isNew: true
        };
        setSelectedModel(newModel);
        setIsBuilderActive(true);
    };

    const handleEditModel = (model) => {
        setSelectedModel(model);
        setIsBuilderActive(true);
    };

    const handleDeleteModel = (id) => {
        if (window.confirm('Are you sure you want to delete this model?')) {
            setModels(models.filter(m => m.id !== id));
        }
    };

    const handleCloseBuilder = () => {
        setIsBuilderActive(false);
        setSelectedModel(null);
    };

    // Reuse HelpModal text/content
    const HelpModal = () => (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                backgroundColor: '#1f2937', color: 'white', padding: '30px',
                borderRadius: '12px', maxWidth: '800px', width: '90%',
                maxHeight: '85vh', overflowY: 'auto', border: '1px solid #374151',
                position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
            }}>
                <button
                    onClick={() => setShowHelp(false)}
                    style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
                >
                    ✕ Close
                </button>

                <h2 style={{ marginBottom: '20px', borderBottom: '1px solid #374151', paddingBottom: '10px' }}>
                    Panduan Studio Model (Motion Rules)
                </h2>

                <div style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>
                    <p>Sistem ini dirancang untuk membuat <strong>"Aturan Gerakan" (Motion Rules)</strong> tanpa koding, menggunakan logika <strong>Finite State Machine (FSM)</strong>.</p>
                    <div style={{ marginTop: '20px' }}>
                        <h4 style={{ color: '#60a5fa', marginBottom: '8px' }}>1. Konsep Dasar (Logic)</h4>
                        <ul style={{ paddingLeft: '20px', color: '#d1d5db' }}>
                            <li><strong>State (Status):</strong> Kondisi operator saat ini (Contoh: <em>Menunggu, Mengambil, Merakit</em>).</li>
                            <li><strong>Transition:</strong> Perpindahan dari satu State ke State lain.</li>
                            <li><strong>Rule (Aturan):</strong> Syarat agar transisi terjadi (Contoh: <em>Jika Tangan Kanan &gt; Meja</em>, pindah ke 'Mengambil').</li>
                        </ul>

                        <h4 style={{ color: '#60a5fa', marginBottom: '8px', marginTop: '16px' }}>2. Workflow Pembuatan Model</h4>
                        <ol style={{ paddingLeft: '20px', color: '#d1d5db' }}>
                            <li><strong>Upload Video:</strong> Masukkan video operator standar/baku.</li>
                            <li><strong>Definisikan States:</strong> Buat daftar aktivitas (langkah kerja).</li>
                            <li><strong>Buat Transisi & Rule:</strong> Hubungkan state dengan logika deteksi otomatis.</li>
                            <li><strong>Validasi:</strong> Test dengan video lain untuk memastikan akurasi.</li>
                        </ol>

                        <h4 style={{ color: '#60a5fa', marginBottom: '8px', marginTop: '16px' }}>3. Navigasi Editor</h4>
                        <ul style={{ paddingLeft: '20px', color: '#d1d5db' }}>
                            <li><strong>Tab States:</strong> Menambah/Mengedit nama langkah kerja.</li>
                            <li><strong>Tab Rules:</strong> Membuat logika "Kapan pindah langkah".</li>
                            <li><strong>Tab Test/Debug:</strong> Melihat hasil deteksi real-time.</li>
                        </ul>

                        <h4 style={{ color: '#60a5fa', marginBottom: '8px', marginTop: '16px' }}>4. Tipe Rule (Aturan)</h4>
                        <ul style={{ paddingLeft: '20px', color: '#d1d5db' }}>
                            <li><strong style={{ color: '#fbbf24' }}>Pose Angle:</strong> Sudut sendi (Contoh: Siku &lt; 90 derajat).</li>
                            <li><strong style={{ color: '#fbbf24' }}>Pose Relation:</strong> Posisi satu titik banding titik lain/nilai (Contoh: Wrist Y &lt; Shoulder Y).</li>
                            <li><strong style={{ color: '#fbbf24' }}>Pose Velocity:</strong> Kecepatan gerak sendi (Deteksi gerakan cepat/lambat).</li>
                            <li><strong style={{ color: '#fbbf24' }}>Object Proximity:</strong> Jarak tangan ke objek (Alat/Part).</li>
                        </ul>
                    </div>
                    <div style={{ backgroundColor: '#111827', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
                        <h4 style={{ color: '#60a5fa', marginBottom: '8px' }}>5. 📚 Contoh Skenario: Deteksi Pengangkatan Aman (Safe Lifting)</h4>
                        <div style={{ background: '#1f2937', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
                            <p style={{ marginBottom: '8px' }}><strong>Tujuan:</strong> Memastikan operator melakukan <em>Squat</em> (jongkok) saat mengambil barang di bawah.</p>
                            <ul style={{ paddingLeft: '20px', color: '#d1d5db', lineHeight: '1.6' }}>
                                <li><strong>Setup:</strong> Pilih Mode <strong>Body-Centric</strong> di Settings.</li>
                                <li><strong>State 1 (Berdiri):</strong> Posisi awal.</li>
                                <li><strong>State 2 (Jongkok):</strong> Transisi saat <code>Hip Y</code> turun mendekati <code>Knee Y</code>. Gunakan <strong>Hysteresis 0.5s</strong>.</li>
                                <li><strong>State 3 (Lifting):</strong> Transisi saat <code>Wrist Velocity</code> &gt; 0.5 (Cepat naik).</li>
                            </ul>
                        </div>

                        <h4 style={{ color: '#60a5fa', marginBottom: '8px' }}>6. Tips & Trik</h4>
                        <ol style={{ marginLeft: '20px', marginTop: '5px', color: '#d1d5db' }}>
                            <li>Click <strong>+ Create New Model</strong> to start.</li>
                            <li>Upload a video of the standard work.</li>
                            <li>Define the <strong>States</strong> (Steps of the process).</li>
                            <li>Add <strong>Rules</strong> to link the states together.</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );

    if (isBuilderActive) {
        return (
            <ModelBuilder
                model={selectedModel}
                onClose={handleCloseBuilder}
                onSave={(updatedModel) => {
                    if (updatedModel.isNew) {
                        setModels([...models, { ...updatedModel, isNew: false }]);
                    } else {
                        setModels(models.map(m => m.id === updatedModel.id ? updatedModel : m));
                    }
                    setIsBuilderActive(false);
                }}
            />
        );
    }

    const styles = {
        helpButton: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            background: '#374151',
            borderRadius: '12px',
            fontWeight: '600',
            color: '#e5e7eb',
            border: '1px solid #4b5563',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginRight: '12px'
        },
        container: {
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#111827', // gray-900
            color: 'white',
            padding: '24px',
            overflow: 'hidden',
            fontFamily: 'Inter, sans-serif'
        },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px'
        },
        title: {
            fontSize: '1.875rem',
            fontWeight: 'bold',
            background: 'linear-gradient(to right, #60a5fa, #a855f7)', // blue-400 to purple-500
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            margin: 0
        },
        subtitle: {
            color: '#9ca3af', // gray-400
            marginTop: '4px',
            margin: 0
        },
        createButton: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: 'linear-gradient(to right, #2563eb, #9333ea)', // blue-600 to purple-600
            borderRadius: '12px',
            fontWeight: 'bold',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
        },
        searchContainer: {
            display: 'flex',
            gap: '16px',
            marginBottom: '24px'
        },
        searchInputWrapper: {
            position: 'relative',
            flex: 1,
            maxWidth: '448px' // max-w-md
        },
        searchIcon: {
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af'
        },
        searchInput: {
            width: '100%',
            backgroundColor: '#1f2937', // gray-800
            border: '1px solid #374151', // gray-700
            borderRadius: '8px',
            padding: '12px 16px 12px 40px',
            color: 'white',
            outline: 'none',
            fontSize: '1rem'
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px',
            overflowY: 'auto',
            paddingBottom: '24px'
        },
        card: {
            backgroundColor: 'rgba(31, 41, 55, 0.5)', // gray-800/50
            border: '1px solid #374151',
            borderRadius: '12px',
            padding: '20px',
            transition: 'all 0.2s',
            cursor: 'pointer',
            position: 'relative'
        },
        cardHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '16px'
        },
        iconWrapper: {
            padding: '12px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)', // blue-500/10
            borderRadius: '8px'
        },
        actionButtons: {
            display: 'flex',
            gap: '8px'
        },
        actionBtn: {
            padding: '8px',
            borderRadius: '8px',
            background: 'transparent',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            transition: 'background 0.2s'
        },
        cardTitle: {
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '8px',
            margin: 0
        },
        cardDesc: {
            color: '#9ca3af',
            fontSize: '0.875rem',
            marginBottom: '16px',
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
        },
        cardFooter: {
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '0.875rem',
            color: '#6b7280', // gray-500
            borderTop: '1px solid #374151',
            paddingTop: '16px'
        },
        statItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
        }
    };

    return (
        <div style={styles.container}>
            {showHelp && <HelpModal />}
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>
                        Studio Model
                    </h1>
                    <p style={styles.subtitle}>Design and build motion analysis models</p>
                </div>
                <div style={{ display: 'flex' }}>
                    <button
                        style={styles.helpButton}
                        onClick={() => setShowHelp(true)}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#374151'}
                    >
                        ? Help
                    </button>
                    <button
                        onClick={handleCreateModel}
                        style={styles.createButton}
                        onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(37, 99, 235, 0.2)'}
                        onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
                    >
                        <Plus size={20} />
                        Create New Model
                    </button>
                </div>
            </div>
            {/* ... rest of return ... */}

            {/* Search */}
            <div style={styles.searchContainer}>
                <div style={styles.searchInputWrapper}>
                    <Search style={styles.searchIcon} size={18} />
                    <input
                        type="text"
                        placeholder="Search models..."
                        style={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#374151'}
                    />
                </div>
            </div>

            {/* Grid */}
            <div style={styles.grid}>
                {models
                    .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(model => (
                        <div
                            key={model.id}
                            style={styles.card}
                            onMouseOver={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                                e.currentTarget.style.backgroundColor = '#1f2937';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.borderColor = '#374151';
                                e.currentTarget.style.backgroundColor = 'rgba(31, 41, 55, 0.5)';
                            }}
                            onClick={() => handleEditModel(model)}
                        >
                            <div style={styles.cardHeader}>
                                <div style={styles.iconWrapper}>
                                    <Activity color="#60a5fa" size={24} />
                                </div>
                                <div style={styles.actionButtons}>
                                    <button
                                        style={styles.actionBtn}
                                        onClick={(e) => { e.stopPropagation(); handleEditModel(model); }}
                                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#374151'; e.currentTarget.style.color = 'white'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                    <button
                                        style={styles.actionBtn}
                                        onClick={(e) => { e.stopPropagation(); handleDeleteModel(model.id); }}
                                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'; e.currentTarget.style.color = '#f87171'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <h3 style={styles.cardTitle}>{model.name}</h3>
                            <p style={styles.cardDesc}>{model.description}</p>

                            <div style={styles.cardFooter}>
                                <div style={styles.statItem}>
                                    <Box size={14} />
                                    <span>{model.states} States</span>
                                </div>
                                <div style={styles.statItem}>
                                    <Activity size={14} />
                                    <span>{model.rules} Rules</span>
                                </div>
                            </div>
                        </div>
                    ))}

                {/* Empty State */}
                {models.length === 0 && (
                    <div style={{
                        gridColumn: '1 / -1',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '48px',
                        color: '#6b7280',
                        border: '2px dashed #374151',
                        borderRadius: '12px'
                    }}>
                        <Video size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <p style={{ fontSize: '1.125rem', margin: 0 }}>No models found</p>
                        <button
                            onClick={handleCreateModel}
                            style={{
                                marginTop: '16px',
                                color: '#60a5fa',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            Create your first model
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudioModel;
