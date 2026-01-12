import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const MENU_CATEGORIES = {
    CORE: {
        icon: '🚀',
        label: 'Core Features',
        labelId: 'Fitur Utama',
        description: 'Essential video analysis and file management'
    },
    AI: {
        icon: '🧠',
        label: 'AI Studio',
        labelId: 'Studio AI',
        description: 'Intelligent motion analysis with AI'
    },
    IE: {
        icon: '📉',
        label: 'Industrial Engineering',
        labelId: 'Teknik Industri',
        description: 'Professional IE analysis tools'
    },
    ADVANCED: {
        icon: '⚡',
        label: 'Advanced Tools',
        labelId: 'Fitur Lanjutan',
        description: 'Multi-camera, VR, and advanced features'
    },
    LEARNING: {
        icon: '🎓',
        label: 'Learning & Help',
        labelId: 'Pembelajaran & Bantuan',
        description: 'Tutorials, documentation, and support'
    }
};

const MENU_ITEMS = [
    // CORE
    {
        path: '/',
        icon: '🎬',
        label: 'Video Analysis',
        labelId: 'Analisis Video',
        description: 'Analyze work motions from video recordings',
        descriptionId: 'Analisis gerakan kerja dari rekaman video',
        category: 'CORE'
    },
    {
        path: '/files',
        icon: '📂',
        label: 'File Explorer',
        labelId: 'Penjelajah File',
        description: 'Browse and manage your project files',
        descriptionId: 'Jelajahi dan kelola file proyek Anda',
        category: 'CORE'
    },

    // AI STUDIO
    {
        path: '/teachable-machine',
        icon: '🤖',
        label: 'TM Studio',
        labelId: 'Studio TM',
        description: 'Create custom AI models with Teachable Machine',
        descriptionId: 'Buat model AI kustom dengan Teachable Machine',
        category: 'AI'
    },
    {
        path: '/studio-model',
        icon: '👨‍🏫',
        label: 'Studio Model',
        labelId: 'Model Studio',
        description: 'Build motion analysis models with rules',
        descriptionId: 'Bangun model analisis gerakan dengan aturan',
        category: 'AI'
    },
    {
        path: '/ai-process',
        icon: '🧠',
        label: 'AI Process',
        labelId: 'Proses AI',
        description: 'AI-powered process analysis workspace',
        descriptionId: 'Ruang kerja analisis proses berbasis AI',
        category: 'AI'
    },
    {
        path: '/realtime-compliance',
        icon: '🛡️',
        label: 'Real-time Compliance',
        labelId: 'Kepatuhan Real-time',
        description: 'Monitor work compliance in real-time',
        descriptionId: 'Pantau kepatuhan kerja secara real-time',
        category: 'AI'
    },

    // INDUSTRIAL ENGINEERING
    {
        path: '/swcs',
        icon: '📋',
        label: 'SWCS',
        labelId: 'SWCS',
        description: 'Standard Work Combination Sheet',
        descriptionId: 'Lembar Kombinasi Kerja Standar',
        category: 'IE'
    },
    {
        path: '/yamazumi',
        icon: '🏔️',
        label: 'Yamazumi',
        labelId: 'Yamazumi',
        description: 'Yamazumi Chart for workload balancing',
        descriptionId: 'Grafik Yamazumi untuk penyeimbangan beban kerja',
        category: 'IE'
    },
    {
        path: '/value-stream-map',
        icon: '🏭',
        label: 'Value Stream Map',
        labelId: 'Peta Aliran Nilai',
        description: 'Map material and information flow',
        descriptionId: 'Petakan aliran material dan informasi',
        category: 'IE'
    },
    {
        path: '/therblig',
        icon: '📍',
        label: 'Therblig',
        labelId: 'Therblig',
        description: 'Therblig motion analysis',
        descriptionId: 'Analisis gerakan Therblig',
        category: 'IE'
    },
    {
        path: '/statistical-analysis',
        icon: '📉',
        label: 'Statistical Analysis',
        labelId: 'Analisis Statistik',
        description: 'Statistical analysis of time study data',
        descriptionId: 'Analisis statistik data studi waktu',
        category: 'IE'
    },
    {
        path: '/pmts-builder',
        icon: '🏗️',
        label: 'Standard Data Builder',
        labelId: 'Pembuat Data Standar',
        description: 'Build standard times using PMTS (MTM/MODAPTS)',
        descriptionId: 'Buat waktu standar menggunakan PMTS (MTM/MODAPTS)',
        category: 'IE'
    },
    {
        path: '/best-worst',
        icon: '🏆',
        label: 'Best/Worst Cycle',
        labelId: 'Siklus Terbaik/Terburuk',
        description: 'Compare best and worst cycle performance',
        descriptionId: 'Bandingkan performa siklus terbaik dan terburuk',
        category: 'IE'
    },
    {
        path: '/rearrangement',
        icon: '🔄',
        label: 'Rearrangement',
        labelId: 'Penyusunan Ulang',
        description: 'Optimize work element sequence',
        descriptionId: 'Optimalkan urutan elemen kerja',
        category: 'IE'
    },
    {
        path: '/waste-elimination',
        icon: '🗑️',
        label: 'Waste Elimination',
        labelId: 'Eliminasi Pemborosan',
        description: 'Identify and eliminate waste (Muda)',
        descriptionId: 'Identifikasi dan eliminasi pemborosan (Muda)',
        category: 'IE'
    },
    {
        path: '/manual-creation',
        icon: '📘',
        label: 'Manual Creation',
        labelId: 'Pembuatan Manual',
        description: 'Create work instruction manuals',
        descriptionId: 'Buat manual instruksi kerja',
        category: 'IE'
    },

    // ADVANCED
    {
        path: '/comparison',
        icon: '🎥',
        label: 'Video Comparison',
        labelId: 'Perbandingan Video',
        description: 'Compare two videos side-by-side',
        descriptionId: 'Bandingkan dua video secara berdampingan',
        category: 'ADVANCED'
    },
    {
        path: '/multi-camera',
        icon: '📹',
        label: 'Multi-Camera 3D',
        labelId: 'Multi-Kamera 3D',
        description: 'Fuse multiple camera views for 3D analysis',
        descriptionId: 'Gabungkan beberapa tampilan kamera untuk analisis 3D',
        category: 'ADVANCED'
    },
    {
        path: '/vr-training',
        icon: '🥽',
        label: 'VR Training',
        labelId: 'Pelatihan VR',
        description: 'Virtual reality training mode',
        descriptionId: 'Mode pelatihan realitas virtual',
        category: 'ADVANCED'
    },
    {
        path: '/cycle-segmentation',
        icon: '🔄',
        label: 'Cycle Segmentation',
        labelId: 'Segmentasi Siklus',
        description: 'Automatically segment work cycles',
        descriptionId: 'Segmentasi siklus kerja otomatis',
        category: 'ADVANCED'
    },
    {
        path: '/multi-axial',
        icon: '🛤️',
        label: 'Multi-Axial Analysis',
        labelId: 'Multi-Axial Analysis',
        description: 'Multi-project timeline comparison',
        descriptionId: 'Perbandingan timeline multi-proyek',
        category: 'ADVANCED'
    },

    // LEARNING & COLLABORATION
    {
        path: '/mavi-class',
        icon: '🎓',
        label: 'MAVi Class',
        labelId: 'Kelas MAVi',
        description: 'Interactive learning center',
        descriptionId: 'Pusat pembelajaran interaktif',
        category: 'LEARNING'
    },
    {
        path: '/knowledge-base',
        icon: '📚',
        label: 'Knowledge Base',
        labelId: 'Basis Pengetahuan',
        description: 'Documentation and resources library',
        descriptionId: 'Perpustakaan dokumentasi dan sumber daya',
        category: 'LEARNING'
    },
    {
        path: '/broadcast',
        icon: '📡',
        label: 'Broadcast',
        labelId: 'Siaran',
        description: 'Stream and share live sessions',
        descriptionId: 'Streaming dan berbagi sesi langsung',
        category: 'LEARNING'
    },
    {
        path: '/help',
        icon: '❓',
        label: 'Help',
        labelId: 'Bantuan',
        description: 'Get help and support',
        descriptionId: 'Dapatkan bantuan dan dukungan',
        category: 'LEARNING'
    },
];

function MainMenu() {
    const navigate = useNavigate();
    const { currentLanguage } = useLanguage();
    const { userRole } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const isId = currentLanguage === 'id';

    const menuItemsWithAdmin = useMemo(() => {
        const baseItems = [...MENU_ITEMS];
        baseItems.push({
            path: '/admin',
            icon: '🔐',
            label: 'Admin Panel',
            labelId: 'Panel Admin',
            description: 'Manage users, permissions, and course content',
            descriptionId: 'Kelola pengguna, izin, dan konten kursus',
            category: 'CORE'
        });
        return baseItems;
    }, []);

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return menuItemsWithAdmin;
        const query = searchQuery.toLowerCase();
        return menuItemsWithAdmin.filter(item => {
            const label = isId ? item.labelId : item.label;
            const description = isId ? item.descriptionId : item.description;
            return label.toLowerCase().includes(query) ||
                description.toLowerCase().includes(query);
        });
    }, [searchQuery, isId, menuItemsWithAdmin]);

    const groupedItems = useMemo(() => {
        const groups = {};
        filteredItems.forEach(item => {
            if (!groups[item.category]) {
                groups[item.category] = [];
            }
            groups[item.category].push(item);
        });
        return groups;
    }, [filteredItems]);

    const handleCardClick = (path) => {
        navigate(path);
    };

    return (
        <div style={{
            height: '100%',
            overflow: 'auto',
            backgroundColor: 'var(--bg-primary)',
            padding: '30px'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '30px',
                flexWrap: 'wrap',
                gap: '15px'
            }}>
                <div>
                    <h1 style={{
                        margin: 0,
                        fontSize: '2rem',
                        color: 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span style={{ fontSize: '2.5rem' }}>🏠</span>
                        {isId ? 'Menu Utama MAVi' : 'MAVi Main Menu'}
                    </h1>
                    <p style={{
                        margin: '5px 0 0 0',
                        color: 'var(--text-secondary)',
                        fontSize: '1rem'
                    }}>
                        {isId ? 'Akses semua fitur dengan mudah' : 'Quick access to all features'}
                    </p>
                </div>

                {/* Search Box */}
                <div style={{
                    position: 'relative',
                    width: '300px',
                    maxWidth: '100%'
                }}>
                    <input
                        type="text"
                        placeholder={isId ? '🔍 Cari fitur...' : '🔍 Search features...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 15px',
                            fontSize: '1rem',
                            border: '2px solid var(--border-color)',
                            borderRadius: '12px',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            transition: 'border-color 0.2s, box-shadow 0.2s'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = 'var(--accent-blue)';
                            e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = 'var(--border-color)';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                </div>
            </div>

            {/* Menu Categories */}
            {Object.keys(MENU_CATEGORIES).map(catKey => {
                const items = groupedItems[catKey];
                if (!items || items.length === 0) return null;

                const category = MENU_CATEGORIES[catKey];

                return (
                    <div key={catKey} style={{ marginBottom: '35px' }}>
                        {/* Category Header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '15px',
                            paddingBottom: '10px',
                            borderBottom: '2px solid var(--border-color)'
                        }}>
                            <span style={{ fontSize: '1.8rem' }}>{category.icon}</span>
                            <div>
                                <h2 style={{
                                    margin: 0,
                                    fontSize: '1.3rem',
                                    color: 'var(--text-primary)',
                                    fontWeight: 600
                                }}>
                                    {isId ? category.labelId : category.label}
                                </h2>
                                <p style={{
                                    margin: 0,
                                    fontSize: '0.85rem',
                                    color: 'var(--text-secondary)'
                                }}>
                                    {category.description}
                                </p>
                            </div>
                        </div>

                        {/* Menu Cards Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                            gap: '15px'
                        }}>
                            {items.map(item => (
                                <div
                                    key={item.path}
                                    onClick={() => handleCardClick(item.path)}
                                    style={{
                                        backgroundColor: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        padding: '20px',
                                        cursor: 'pointer',
                                        transition: 'all 0.25s ease',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
                                        e.currentTarget.style.borderColor = 'var(--accent-blue)';
                                        e.currentTarget.style.background = 'linear-gradient(135deg, var(--bg-secondary) 0%, rgba(59, 130, 246, 0.1) 100%)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.borderColor = 'var(--border-color)';
                                        e.currentTarget.style.background = 'var(--bg-secondary)';
                                    }}
                                >
                                    {/* Icon */}
                                    <div style={{
                                        fontSize: '2.2rem',
                                        marginBottom: '12px'
                                    }}>
                                        {item.icon}
                                    </div>

                                    {/* Label */}
                                    <h3 style={{
                                        margin: '0 0 8px 0',
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)'
                                    }}>
                                        {isId ? item.labelId : item.label}
                                    </h3>

                                    {/* Description */}
                                    <p style={{
                                        margin: 0,
                                        fontSize: '0.85rem',
                                        color: 'var(--text-secondary)',
                                        lineHeight: 1.4
                                    }}>
                                        {isId ? item.descriptionId : item.description}
                                    </p>

                                    {/* Hover Arrow */}
                                    <div style={{
                                        position: 'absolute',
                                        right: '15px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        opacity: 0.3,
                                        fontSize: '1.5rem',
                                        transition: 'opacity 0.2s, transform 0.2s'
                                    }}>
                                        →
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {/* No Results */}
            {Object.keys(groupedItems).length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: 'var(--text-secondary)'
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '15px' }}>🔍</div>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>
                        {isId ? 'Tidak ada hasil' : 'No results found'}
                    </h3>
                    <p style={{ margin: '10px 0 0 0' }}>
                        {isId
                            ? `Tidak ada fitur yang cocok dengan "${searchQuery}"`
                            : `No features match "${searchQuery}"`
                        }
                    </p>
                </div>
            )}

            {/* Quick Tips */}
            <div style={{
                marginTop: '40px',
                padding: '20px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
                <h3 style={{
                    margin: '0 0 10px 0',
                    fontSize: '1rem',
                    color: 'var(--accent-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    💡 {isId ? 'Tips Cepat' : 'Quick Tips'}
                </h3>
                <ul style={{
                    margin: 0,
                    paddingLeft: '20px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    lineHeight: 1.6
                }}>
                    <li>{isId ? 'Gunakan sidebar di sebelah kanan untuk navigasi cepat antar halaman' : 'Use the sidebar on the right for quick navigation between pages'}</li>
                    <li>{isId ? 'Mulai dengan MAVi Class 🎓 untuk mempelajari semua fitur' : 'Start with MAVi Class 🎓 to learn all features'}</li>
                    <li>{isId ? 'Tekan ⚙️ untuk mengatur koneksi AI dan preferensi lainnya' : 'Press ⚙️ to configure AI connections and other preferences'}</li>
                </ul>
            </div>
        </div>
    );
}

export default MainMenu;
