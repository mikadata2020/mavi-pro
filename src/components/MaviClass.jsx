import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Circle, PlayCircle, Clock, BookOpen, ChevronRight, ChevronDown, Award, Target, Zap, MessageCircle, Send, X, Bot, User, Loader, Settings, Youtube, Volume2, VolumeX } from 'lucide-react';
import { getStoredApiKey } from '../utils/aiGenerator';
import { useLanguage } from '../i18n/LanguageContext';

const MaviClass = () => {
    const navigate = useNavigate();
    const { currentLanguage, t } = useLanguage();
    const [expandedModule, setExpandedModule] = useState(null);
    const [completedLessons, setCompletedLessons] = useState(() => {
        const saved = localStorage.getItem('mavi-class-progress');
        return saved ? JSON.parse(saved) : [];
    });
    const [activeLesson, setActiveLesson] = useState(null);

    useEffect(() => {
        localStorage.setItem('mavi-class-progress', JSON.stringify(completedLessons));
    }, [completedLessons]);

    // AI Sensei Chatbot State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([{
        role: 'assistant',
        content: t('sensei.welcome')
    }]);
    const [chatInput, setChatInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(() => {
        const saved = localStorage.getItem('mavi-sensei-muted');
        return saved ? JSON.parse(saved) : false;
    });
    const chatEndRef = useRef(null);

    useEffect(() => {
        localStorage.setItem('mavi-sensei-muted', JSON.stringify(isMuted));
    }, [isMuted]);

    // Update welcome message when language changes
    useEffect(() => {
        if (chatMessages.length === 1 && chatMessages[0].role === 'assistant') {
            setChatMessages([{
                role: 'assistant',
                content: t('sensei.welcome')
            }]);
        }
    }, [currentLanguage]);

    // TTS Logic
    const speak = (text) => {
        if (isMuted || !window.speechSynthesis) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        // Remove markdown formatting for cleaner speech
        const cleanText = text.replace(/\*\*([^*]+)\*\*/g, '$1')
            .replace(/- /g, '')
            .replace(/👋 /g, '')
            .replace(/🚀 /g, '')
            .replace(/⏱️ /g, '')
            .replace(/🧠 /g, '')
            .replace(/📊 /g, '')
            .replace(/📘 /g, '')
            .replace(/⚡ /g, '')
            .replace(/📂 /g, '')
            .replace(/🎓 /g, '')
            .replace(/📹 /g, '')
            .replace(/🗑️ /g, '')
            .replace(/📍 /g, '')
            .replace(/🤔 /g, '')
            .replace(/😅 /g, '')
            .replace(/🏃 /g, '')
            .replace(/✨ /g, '');

        const utterance = new SpeechSynthesisUtterance(cleanText);

        // Map app language to SpeechSynthesis lang codes
        const langMap = {
            id: 'id-ID',
            en: 'en-US',
            jp: 'ja-JP'
        };

        const targetLang = langMap[currentLanguage] || 'id-ID';
        utterance.lang = targetLang;

        // Find suitable voice if available
        const voices = window.speechSynthesis.getVoices();
        const suitableVoice = voices.find(v => v.lang.startsWith(currentLanguage === 'jp' ? 'ja' : currentLanguage));
        if (suitableVoice) utterance.voice = suitableVoice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    // Avatar Component for consistent use
    const SenseiAvatar = ({ size = 40, animated = false }) => (
        <div style={{
            position: 'relative',
            width: size,
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: animated ? 'bounce 3s ease-in-out infinite' : 'none'
        }}>
            <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                opacity: 0.2,
                filter: 'blur(8px)',
                animation: isSpeaking ? 'pulse 1s ease-in-out infinite' : 'none'
            }} />
            <div style={{
                width: size * 0.8,
                height: size * 0.8,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255,255,255,0.3)',
                boxShadow: isSpeaking ? '0 0 15px #667eea' : 'none',
                transition: 'all 0.3s ease',
                zIndex: 2
            }}>
                <Bot size={size * 0.5} color="#fff" />
            </div>
            {isSpeaking && (
                <div style={{
                    position: 'absolute',
                    top: -10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '2px',
                    height: '10px',
                    alignItems: 'flex-end',
                    zIndex: 2
                }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{
                            width: '2px',
                            backgroundColor: '#667eea',
                            borderRadius: '1px',
                            animation: `soundWave ${0.5 + i * 0.1}s ease-in-out infinite`,
                            height: '100%'
                        }} />
                    ))}
                </div>
            )}
        </div>
    );

    const modules = [
        {
            id: 'getting-started',
            title: '🚀 Getting Started',
            description: 'Kenalan dengan MAVi dan fitur-fitur dasarnya',
            duration: '15 menit',
            color: '#4CAF50',
            lessons: [
                {
                    id: 'gs-1',
                    title: 'Apa itu MAVi?',
                    type: 'video',
                    duration: '3 min',
                    content: {
                        description: 'MAVi (Motion Analysis Video Intelligence) adalah aplikasi analisis video untuk Industrial Engineering yang membantu menganalisis proses kerja, mengukur waktu, dan mengidentifikasi waste.',
                        keyPoints: [
                            'Analisis video berbasis AI untuk time & motion study',
                            'Terintegrasi dengan metodologi TPS (Toyota Production System)',
                            'Mendukung pembuatan SOP dan Work Instruction otomatis',
                            'Kolaborasi real-time dan knowledge sharing'
                        ],
                        tryIt: null,
                        videoUrl: 'https://www.youtube.com/watch?v=z6_A96_P3F0'
                    }
                },
                {
                    id: 'gs-2',
                    title: 'Navigasi Aplikasi',
                    type: 'interactive',
                    duration: '5 min',
                    content: {
                        description: 'Pelajari cara menavigasi menu sidebar, shortcut keyboard, dan layout aplikasi.',
                        keyPoints: [
                            'Sidebar menu di sebelah kanan untuk akses cepat',
                            'Klik icon untuk berpindah antar fitur',
                            'Hover untuk melihat tooltip nama fitur',
                            'Toggle sidebar dengan tombol panah'
                        ],
                        tryIt: '/workflow-guide',
                        videoUrl: 'https://www.youtube.com/watch?v=P7p_e2G1p_8'
                    }
                },
                {
                    id: 'gs-3',
                    title: 'Upload Video Pertama',
                    type: 'hands-on',
                    duration: '5 min',
                    content: {
                        description: 'Langkah pertama adalah upload video proses kerja yang akan dianalisis.',
                        keyPoints: [
                            'Klik tombol Upload atau drag & drop video',
                            'Format yang didukung: MP4, WebM, AVI',
                            'Video akan tampil di Video Panel sebelah kiri',
                            'Gunakan kontrol playback untuk navigasi video'
                        ],
                        tryIt: '/',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                },
                {
                    id: 'gs-4',
                    title: 'Membuat Project Baru',
                    type: 'hands-on',
                    duration: '2 min',
                    content: {
                        description: 'Organisasi kerja dengan membuat project untuk menyimpan analisis.',
                        keyPoints: [
                            'Klik "New Project" dari menu',
                            'Beri nama project yang deskriptif',
                            'Pilih video yang akan dianalisis',
                            'Project tersimpan otomatis di database lokal'
                        ],
                        tryIt: '/',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                }
            ]
        },
        {
            id: 'time-measurement',
            title: '⏱️ Time & Motion Study',
            description: 'Belajar mengukur waktu dan breakdown elemen kerja',
            duration: '30 menit',
            color: '#2196F3',
            lessons: [
                {
                    id: 'tm-1',
                    title: 'Element Editor Basics',
                    type: 'video',
                    duration: '5 min',
                    content: {
                        description: 'Element Editor adalah tools utama untuk mengukur waktu dan breakdown proses.',
                        keyPoints: [
                            'Klik Start Measurement untuk mulai pengukuran',
                            'Klik End Measurement untuk selesai',
                            'Berikan nama element yang spesifik',
                            'Pilih tipe Therblig yang sesuai'
                        ],
                        tryIt: '/',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                },
                {
                    id: 'tm-2',
                    title: 'Voice Commands',
                    type: 'interactive',
                    duration: '5 min',
                    content: {
                        description: 'Gunakan perintah suara untuk hands-free measurement.',
                        keyPoints: [
                            'Aktifkan Voice Commands dari panel',
                            'Katakan "Start" untuk mulai measurement',
                            'Katakan "Stop" atau "End" untuk selesai',
                            'Katakan nama element untuk auto-labeling'
                        ],
                        tryIt: '/',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                },
                {
                    id: 'tm-3',
                    title: 'Therblig Classification',
                    type: 'video',
                    duration: '8 min',
                    content: {
                        description: 'Pelajari 18 gerakan dasar Therblig dan cara mengklasifikasikannya.',
                        keyPoints: [
                            'Transport Empty (TE) - tangan kosong bergerak',
                            'Grasp (G) - mengambil objek',
                            'Transport Loaded (TL) - membawa objek',
                            'Position (P) - memposisikan objek',
                            'Release (RL) - melepas objek'
                        ],
                        tryIt: '/therblig',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                },
                {
                    id: 'tm-4',
                    title: 'Value Added Analysis',
                    type: 'hands-on',
                    duration: '5 min',
                    content: {
                        description: 'Identifikasi aktivitas yang memberikan nilai tambah.',
                        keyPoints: [
                            'VA (Value Added) - aktivitas yang mengubah bentuk/fungsi',
                            'NVA (Non-Value Added) - waste yang harus dihilangkan',
                            'NNVA (Necessary NVA) - perlu tapi tidak menambah nilai',
                            'Tandai setiap element dengan klasifikasi yang tepat'
                        ],
                        tryIt: '/',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                },
                {
                    id: 'tm-5',
                    title: 'Cycle Time Analysis',
                    type: 'hands-on',
                    duration: '7 min',
                    content: {
                        description: 'Analisis cycle time dan identifikasi bottleneck.',
                        keyPoints: [
                            'Ukur beberapa cycle untuk data yang valid',
                            'Bandingkan cycle time antar operator',
                            'Identifikasi variasi dan penyebabnya',
                            'Gunakan Best/Worst Cycle untuk perbandingan'
                        ],
                        tryIt: '/best-worst',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                }
            ]
        },
        {
            id: 'ai-features',
            title: '🧠 AI Features',
            description: 'Manfaatkan kekuatan AI untuk analisis otomatis',
            duration: '25 menit',
            color: '#FF9800',
            lessons: [
                {
                    id: 'ai-1',
                    title: 'AI Process Studio',
                    type: 'video',
                    duration: '5 min',
                    content: {
                        description: 'Pusat kendali AI untuk semua fitur analisis cerdas.',
                        keyPoints: [
                            'Auto Cycle Detection - deteksi siklus otomatis',
                            'Video Intelligence - tanya jawab dengan AI',
                            'Motion Analysis - analisis gerakan dan ergonomi',
                            'Anomaly Detection - deteksi ketidaknormalan'
                        ],
                        tryIt: '/ai-process',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                },
                {
                    id: 'ai-2',
                    title: 'Action Recognition',
                    type: 'interactive',
                    duration: '7 min',
                    content: {
                        description: 'AI mengenali aksi dan gerakan secara otomatis.',
                        keyPoints: [
                            'Upload video dan jalankan AI recognition',
                            'AI akan mendeteksi jenis aksi yang dilakukan',
                            'Review dan koreksi hasil deteksi',
                            'Export hasil untuk analisis lanjutan'
                        ],
                        tryIt: '/action-recognition',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                },
                {
                    id: 'ai-3',
                    title: 'Real-time Compliance',
                    type: 'hands-on',
                    duration: '8 min',
                    content: {
                        description: 'Monitor kepatuhan SOP secara real-time dengan AI.',
                        keyPoints: [
                            'Hubungkan kamera live atau IP camera',
                            'AI akan membandingkan dengan standar',
                            'Alert otomatis jika ada penyimpangan',
                            'Log semua anomali untuk review'
                        ],
                        tryIt: '/realtime-compliance',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                },
                {
                    id: 'ai-4',
                    title: 'Video Intelligence',
                    type: 'interactive',
                    duration: '5 min',
                    content: {
                        description: 'Tanya jawab dengan AI tentang isi video.',
                        keyPoints: [
                            'Upload video ke Gemini AI',
                            'Ajukan pertanyaan dalam bahasa natural',
                            'AI akan menganalisis dan menjawab',
                            'Gunakan untuk insight mendalam'
                        ],
                        tryIt: '/ai-process',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                }
            ]
        },
        {
            id: 'tps-tools',
            title: '📊 TPS Tools',
            description: 'Alat-alat Toyota Production System untuk improvement',
            duration: '40 menit',
            color: '#9C27B0',
            lessons: [
                {
                    id: 'tps-1',
                    title: 'Value Stream Mapping',
                    type: 'video',
                    duration: '10 min',
                    content: {
                        description: 'Pemetaan alur nilai dari bahan mentah sampai produk jadi.',
                        keyPoints: [
                            'Buat Current State Map terlebih dahulu',
                            'Identifikasi waste di setiap proses',
                            'Hitung lead time dan cycle time',
                            'Design Future State Map yang lebih efisien'
                        ],
                        tryIt: '/value-stream-map',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                },
                {
                    id: 'tps-2',
                    title: 'Yamazumi Chart',
                    type: 'hands-on',
                    duration: '8 min',
                    content: {
                        description: 'Visualisasi beban kerja untuk line balancing.',
                        keyPoints: [
                            'Import data dari measurement',
                            'Lihat stack bar per operator/station',
                            'Bandingkan dengan takt time',
                            'Identifikasi bottleneck dan idle time'
                        ],
                        tryIt: '/yamazumi',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                },
                {
                    id: 'tps-3',
                    title: 'Standard Work Combination Sheet',
                    type: 'hands-on',
                    duration: '10 min',
                    content: {
                        description: 'Dokumentasi standar kombinasi kerja manusia dan mesin.',
                        keyPoints: [
                            'Buat timeline kerja manual dan mesin',
                            'Visualisasikan walking time',
                            'Set takt time sebagai referensi',
                            'Export untuk dokumentasi SOP'
                        ],
                        tryIt: '/swcs',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                },
                {
                    id: 'tps-4',
                    title: 'Waste Elimination',
                    type: 'interactive',
                    duration: '7 min',
                    content: {
                        description: 'Identifikasi dan hilangkan 7 waste (Muda).',
                        keyPoints: [
                            'Transport - perpindahan yang tidak perlu',
                            'Inventory - stok berlebih',
                            'Motion - gerakan yang tidak efisien',
                            'Waiting - menunggu proses lain',
                            'Over-processing - proses berlebihan',
                            'Over-production - produksi berlebih',
                            'Defects - produk cacat'
                        ],
                        tryIt: '/waste-elimination',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                },
                {
                    id: 'tps-5',
                    title: 'Statistical Analysis',
                    type: 'video',
                    duration: '5 min',
                    content: {
                        description: 'Analisis statistik untuk validasi data dan keputusan.',
                        keyPoints: [
                            'Hitung rata-rata, standar deviasi, range',
                            'Control chart untuk monitoring proses',
                            'Analisis capability process',
                            'Identifikasi outlier dan penyebabnya'
                        ],
                        tryIt: '/statistical-analysis',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                }
            ]
        },
        {
            id: 'documentation',
            title: '📘 Documentation',
            description: 'Buat SOP dan Work Instruction profesional',
            duration: '20 menit',
            color: '#00BCD4',
            lessons: [
                {
                    id: 'doc-1',
                    title: 'Manual Creation',
                    type: 'video',
                    duration: '8 min',
                    content: {
                        description: 'Buat work instruction visual dengan mudah.',
                        keyPoints: [
                            'Capture frame dari video sebagai langkah',
                            'Tambahkan deskripsi dan anotasi',
                            'Gunakan AI untuk generate instruksi',
                            'Export ke PDF, Word, atau PowerPoint'
                        ],
                        tryIt: '/manual-creation',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                },
                {
                    id: 'doc-2',
                    title: 'AI-Generated Instructions',
                    type: 'interactive',
                    duration: '5 min',
                    content: {
                        description: 'Biarkan AI membantu menulis instruksi.',
                        keyPoints: [
                            'Pilih frame yang akan dijelaskan',
                            'AI akan menganalisis gambar',
                            'Generate deskripsi langkah kerja',
                            'Edit dan sesuaikan sesuai kebutuhan'
                        ],
                        tryIt: '/manual-creation',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                },
                {
                    id: 'doc-3',
                    title: 'Knowledge Base',
                    type: 'hands-on',
                    duration: '7 min',
                    content: {
                        description: 'Simpan dan bagikan best practices.',
                        keyPoints: [
                            'Upload manual ke Knowledge Base',
                            'Tambahkan tags untuk pencarian',
                            'Rate dan review dari pengguna lain',
                            'Download template untuk project baru'
                        ],
                        tryIt: '/knowledge-base',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                }
            ]
        },
        {
            id: 'advanced',
            title: '⚡ Advanced Features',
            description: 'Fitur lanjutan untuk power users',
            duration: '30 menit',
            color: '#F44336',
            lessons: [
                {
                    id: 'adv-1',
                    title: 'Multi-Camera Analysis',
                    type: 'video',
                    duration: '8 min',
                    content: {
                        description: 'Analisis 3D dengan multiple camera angles.',
                        keyPoints: [
                            'Sinkronisasi multiple video',
                            'Rekonstruksi gerakan 3D',
                            'Analisis dari berbagai sudut pandang',
                            'Lebih akurat untuk gerakan kompleks'
                        ],
                        tryIt: '/multi-camera',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                },
                {
                    id: 'adv-2',
                    title: 'VR Training Mode',
                    type: 'interactive',
                    duration: '7 min',
                    content: {
                        description: 'Simulasi training dengan VR/AR.',
                        keyPoints: [
                            'Interactive 3D training environment',
                            'Practice mode untuk latihan',
                            'Assessment mode untuk evaluasi',
                            'Tracking progress trainee'
                        ],
                        tryIt: '/vr-training',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                },
                {
                    id: 'adv-3',
                    title: 'Broadcast & Collaboration',
                    type: 'hands-on',
                    duration: '8 min',
                    content: {
                        description: 'Share dan kolaborasi real-time.',
                        keyPoints: [
                            'Broadcast video ke multiple viewer',
                            'Real-time cursor sharing',
                            'Chat dan voice communication',
                            'Remote training dan review'
                        ],
                        tryIt: '/broadcast',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                },
                {
                    id: 'adv-4',
                    title: 'Cycle Segmentation',
                    type: 'hands-on',
                    duration: '7 min',
                    content: {
                        description: 'Segmentasi video menjadi cycle-cycle.',
                        keyPoints: [
                            'AI mendeteksi batas cycle',
                            'Manual adjustment jika diperlukan',
                            'Export cycle sebagai clip terpisah',
                            'Analisis per-cycle yang detail'
                        ],
                        tryIt: '/cycle-segmentation',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                }
            ]
        },
        {
            id: 'study-cases',
            title: '📂 Study Cases',
            description: 'Implementasi nyata MAVi di berbagai industri',
            duration: '45 menit',
            color: '#FFD700',
            lessons: [
                {
                    id: 'sc-1',
                    title: 'Automotive: Line Balancing',
                    type: 'video',
                    duration: '12 min',
                    content: {
                        description: 'Studi kasus optimasi lini perakitan mesin di pabrik otomotif ternama.',
                        keyPoints: [
                            'Identifikasi bottleneck menggunakan Yamazumi Chart',
                            'Redistribusi elemen kerja antar operator',
                            'Peningkatan throughput sebesar 15%',
                            'Eliminasi waiting time pada station kritis'
                        ],
                        tryIt: '/yamazumi',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                },
                {
                    id: 'sc-2',
                    title: 'Textile: Waste Elimination',
                    type: 'interactive',
                    duration: '10 min',
                    content: {
                        description: 'Mengurangi pemborosan gerakan (Motion Waste) pada proses penjahitan.',
                        keyPoints: [
                            'Analisis Therblig untuk gerakan tangan operator',
                            'Rearrangement tata letak material (Layout)',
                            'Pengurangan cycle time sebesar 20%',
                            'Peningkatan ergonomi dan kenyamanan kerja'
                        ],
                        tryIt: '/waste-elimination',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                },
                {
                    id: 'sc-3',
                    title: 'Logistics: VSM Optimization',
                    type: 'hands-on',
                    duration: '15 min',
                    content: {
                        description: 'Optimasi alur dokumen dan barang di pusat distribusi regional.',
                        keyPoints: [
                            'Pemetaan Current State Map (VSM)',
                            'Identifikasi Information Flow yang terputus',
                            'Lead time reduction dari 2 hari menjadi 4 jam',
                            'Implementasi Kan-ban untuk replenishment'
                        ],
                        tryIt: '/value-stream-map',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                },
                {
                    id: 'sc-4',
                    title: 'Electronics: AI Compliance',
                    type: 'interactive',
                    duration: '8 min',
                    content: {
                        description: 'Monitoring kepatuhan pemasangan komponen presisi tinggi.',
                        keyPoints: [
                            'Setting standar gerakan dengan Video Intelligence',
                            'Deteksi anomali pemasangan secara real-time',
                            'Penurunan tingkat defect (rework) hingga 90%',
                            'Audit otomatis tanpa mengganggu produksi'
                        ],
                        tryIt: '/realtime-compliance',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                }
            ]
        },
        {
            id: 'studio-model',
            title: '🎬 Studio Model & Compliance',
            description: 'Buat model AI kustom dan monitor compliance real-time',
            duration: '35 menit',
            color: '#667eea',
            lessons: [
                {
                    id: 'sm-1',
                    title: 'Pengenalan Studio Model',
                    type: 'video',
                    duration: '5 min',
                    content: {
                        description: 'Studio Model memungkinkan Anda membuat model AI kustom untuk mendeteksi gerakan dan state spesifik tanpa coding.',
                        keyPoints: [
                            'Buat model berdasarkan video referensi Anda sendiri',
                            'Definisikan states (kondisi) yang ingin dideteksi',
                            'Atur rules (aturan) untuk transisi antar state',
                            'Gunakan untuk compliance monitoring real-time'
                        ],
                        tryIt: '/studio-model',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                },
                {
                    id: 'sm-2',
                    title: 'Membuat Model Baru',
                    type: 'hands-on',
                    duration: '8 min',
                    content: {
                        description: 'Step-by-step membuat Studio Model pertama Anda.',
                        keyPoints: [
                            'Klik "Create New Model" di Studio Model page',
                            'Beri nama model yang deskriptif (contoh: "Assembly Process")',
                            'Pilih coordinate system: Body-Centric atau Screen-Based',
                            'Tambahkan deskripsi untuk dokumentasi'
                        ],
                        tryIt: '/studio-model',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                },
                {
                    id: 'sm-3',
                    title: 'Definisi States',
                    type: 'hands-on',
                    duration: '7 min',
                    content: {
                        description: 'Buat states untuk setiap kondisi yang ingin dideteksi.',
                        keyPoints: [
                            'State = kondisi/posisi tertentu (contoh: "Idle", "Reaching", "Holding")',
                            'Capture reference pose dari video untuk setiap state',
                            'Definisikan ROI (Region of Interest) jika diperlukan',
                            'Set minimum duration untuk stabilitas deteksi'
                        ],
                        tryIt: '/studio-model',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                },
                {
                    id: 'sm-4',
                    title: 'Rule Configuration',
                    type: 'interactive',
                    duration: '10 min',
                    content: {
                        description: 'Atur aturan transisi antar state menggunakan Rule Builder.',
                        keyPoints: [
                            'Joint Angle: Sudut sendi tubuh (Contoh: Siku &lt; 90°)',
                            'Pose Relation: Posisi relatif terhadap titik lain (Contoh: Tangan di atas Hidung)',
                            'Pose Velocity: Kecepatan gerakan (Contoh: Mendeteksi gerak tiba-tiba)',
                            'Object Proximity: Jarak ke objek AI (Contoh: Tangan menyentuh alat)',
                            'Golden Pose: Kecocokan dengan pose referensi ideal yang direkam',
                            'Logic Operator: Gunakan AND/OR untuk menggabungkan banyak aturan'
                        ],
                        tryIt: '/studio-model',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                },
                {
                    id: 'sm-5',
                    title: 'Teachable Machine Studio',
                    type: 'hands-on',
                    duration: '5 min',
                    content: {
                        description: 'Pelajari cara menggunakan TM Studio untuk membuat dataset video dan menguji model custom Anda.',
                        keyPoints: [
                            'Gunakan Video Slicer untuk memotong video panjang menjadi klip latihan',
                            'Download klip dan upload ke Google Teachable Machine',
                            'Paste URL model yang sudah di-deploy ke TM Studio',
                            'Gunakan model tersebut di Studio Model untuk rules yang lebih kompleks'
                        ],
                        tryIt: '/teachable-machine',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                },
                {
                    id: 'sm-6',
                    title: 'Test Mode & Validation',
                    type: 'hands-on',
                    duration: '5 min',
                    content: {
                        description: 'Test model Anda dengan video sebelum deployment.',
                        keyPoints: [
                            'Upload test video di Test Mode',
                            'Lihat timeline events untuk validasi',
                            'Check apakah state transitions sudah benar',
                            'Adjust rules jika ada false positive/negative'
                        ],
                        tryIt: '/studio-runtime',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                },
                {
                    id: 'sm-6',
                    title: 'Real-time Compliance Setup',
                    type: 'hands-on',
                    duration: '8 min',
                    content: {
                        description: 'Deploy model untuk monitoring compliance real-time.',
                        keyPoints: [
                            'Buka Real-time Compliance dashboard',
                            'Klik "Add Camera" untuk setup station baru',
                            'Pilih Studio Model dari dropdown',
                            'Pilih webcam atau masukkan IP camera URL',
                            'Klik "Start Monitoring" untuk mulai'
                        ],
                        tryIt: '/realtime-compliance',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                },
                {
                    id: 'sm-7',
                    title: 'Timeline Events Analysis',
                    type: 'interactive',
                    duration: '5 min',
                    content: {
                        description: 'Analisis timeline events untuk performance monitoring.',
                        keyPoints: [
                            'Timeline Events panel menampilkan riwayat state transitions',
                            'Lihat timestamp dan duration setiap state',
                            'Warna hijau = cepat (<5s), merah = lambat (>5s)',
                            'Identifikasi bottleneck dari state yang lama',
                            'Export data untuk analisis lebih lanjut'
                        ],
                        tryIt: '/realtime-compliance',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                    }
                }
            ]
        }
    ];

    const toggleCompletion = (lessonId) => {
        setCompletedLessons(prev =>
            prev.includes(lessonId)
                ? prev.filter(id => id !== lessonId)
                : [...prev, lessonId]
        );
    };

    const getTotalLessons = () => modules.reduce((acc, mod) => acc + mod.lessons.length, 0);
    const getCompletedCount = () => completedLessons.length;
    const getProgressPercentage = () => Math.round((getCompletedCount() / getTotalLessons()) * 100);

    const getModuleProgress = (moduleId) => {
        const module = modules.find(m => m.id === moduleId);
        if (!module) return 0;
        const completed = module.lessons.filter(l => completedLessons.includes(l.id)).length;
        return Math.round((completed / module.lessons.length) * 100);
    };

    const getLessonIcon = (type) => {
        switch (type) {
            case 'video': return '🎬';
            case 'interactive': return '🖱️';
            case 'hands-on': return '✋';
            default: return '📝';
        }
    };

    // Build knowledge base from modules for AI context
    const buildKnowledgeBase = () => {
        let knowledge = `MAVi (Motion Analysis Video Intelligence) adalah aplikasi analisis video untuk Industrial Engineering.

FITUR-FITUR UTAMA:

`;
        modules.forEach(mod => {
            knowledge += `## ${mod.title}\n${mod.description}\n`;
            mod.lessons.forEach(lesson => {
                knowledge += `- ${lesson.title}: ${lesson.content.description}\n`;
                knowledge += `  Key points: ${lesson.content.keyPoints.join('; ')}\n`;
                if (lesson.content.tryIt) {
                    knowledge += `  Lokasi menu: ${lesson.content.tryIt}\n`;
                }
            });
            knowledge += '\n';
        });

        knowledge += `
MENU NAVIGASI:
- / (Video Workspace): Upload & analisis video, Element Editor
- /ai-process: AI Process Studio - deteksi cycle, action recognition, video intelligence
- /realtime-compliance: Monitor kepatuhan SOP real-time dengan AI
- /value-stream-map: Value Stream Mapping untuk TPS
- /yamazumi: Yamazumi Chart untuk line balancing
- /swcs: Standard Work Combination Sheet
- /waste-elimination: Identifikasi 7 waste (Muda)
- /therblig: Analisis 18 gerakan dasar Therblig
- /statistical-analysis: Analisis statistik cycle time
- /best-worst: Perbandingan cycle terbaik dan terburuk
- /comparison: Video comparison side-by-side
- /rearrangement: Element rearrangement
- /manual-creation: Buat SOP dan Work Instruction
- /knowledge-base: Repository best practices
- /multi-camera: Multi-camera 3D fusion
- /vr-training: VR Training mode
- /broadcast: Live broadcast & collaboration
- /cycle-segmentation: AI cycle segmentation
- /action-recognition: AI action recognition
- /files: File Explorer
- /diagnostics: System Diagnostics
- /help: Help & Documentation

TIPS PENGGUNAAN:
1. Untuk pemula: Mulai dari Video Workspace, upload video, lalu gunakan Element Editor
2. Gunakan Voice Commands untuk hands-free measurement
3. AI Process Studio adalah pusat kendali untuk semua fitur AI
4. Ekspor data ke SWCS untuk dokumentasi standar kerja
5. Buat work instruction dengan Manual Creation dan AI Generate
`;
        return knowledge;
    };

    // Scroll to bottom when new message
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages]);

    // Send message to AI Sensei
    const sendMessageToSensei = async () => {
        if (!chatInput.trim() || isLoading) return;

        const userMessage = chatInput.trim();
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const apiKey = getStoredApiKey();
            if (!apiKey) {
                setChatMessages(prev => [...prev, {
                    role: 'assistant',
                    content: (
                        <div>
                            <p style={{ margin: '0 0 10px 0' }}>{t('sensei.apiKeyMissing')}</p>
                            <p style={{ margin: '0 0 15px 0', fontSize: '0.9em', color: '#ccc' }}>{t('sensei.apiKeyWarning')}</p>
                            <button
                                onClick={() => window.dispatchEvent(new CustomEvent('open-ai-settings'))}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 16px',
                                    backgroundColor: '#667eea',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    width: '100%',
                                    justifyContent: 'center'
                                }}
                            >
                                <Settings size={16} /> {t('sensei.openSettings')}
                            </button>
                        </div>
                    )
                }]);
                // Provide basic response without API
                const basicResponse = generateBasicResponse(userMessage);
                setChatMessages(prev => [...prev, { role: 'assistant', content: basicResponse }]);
                speak(basicResponse);
                setIsLoading(false);
                return;
            }

            const selectedModel = localStorage.getItem('gemini_model') || 'gemini-1.5-flash-002';

            const knowledgeBase = buildKnowledgeBase();
            const conversationHistory = chatMessages.slice(-6).map(m =>
                `${m.role === 'user' ? 'User' : 'Sensei'}: ${m.content}`
            ).join('\n');

            const prompt = `Kamu adalah MAVi Sensei, asisten AI yang ramah dan profesional untuk mengajarkan penggunaan aplikasi MAVi.

KONTEKS APLIKASI:
${knowledgeBase}

RIWAYAT PERCAKAPAN:
${conversationHistory}

PERTANYAAN USER:
${userMessage}

INSTRUKSI:
1. Jawab dalam Bahasa Indonesia yang ramah dan mudah dipahami
2. Berikan langkah-langkah spesifik jika user bertanya cara melakukan sesuatu
3. Sebutkan lokasi menu/path jika relevan
4. Gunakan emoji untuk membuat respons lebih engaging
5. Jika tidak yakin, akui keterbatasan dan sarankan untuk cek menu Help
6. Jawab secara informatif dan mendalam jika diperlukan, tanpa batasan kata yang kaku.

JAWABAN:`;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 2048
                        }
                    })
                }
            );

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, saya tidak bisa menjawab saat ini. Coba lagi nanti ya!';

            setChatMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
            speak(aiResponse);
        } catch (error) {
            console.error('Sensei AI error:', error);
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: (
                    <div>
                        <p style={{ margin: '0 0 10px 0' }}>😅 **Maaf, ada kendala teknis.**</p>
                        <p style={{ margin: '0 0 15px 0', fontSize: '0.9em', color: '#ccc' }}>Pastikan API Key sudah benar dan koneksi internet stabil.</p>
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('open-ai-settings'))}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                backgroundColor: '#1a1a1a',
                                color: 'white',
                                border: '1px solid #444',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                width: '100%',
                                justifyContent: 'center'
                            }}
                        >
                            <Settings size={16} /> Cek AI Settings
                        </button>
                    </div>
                )
            }]);
            speak(t('sensei.errorTechnical'));
        } finally {
            setIsLoading(false);
        }
    };

    // Basic response generator without API
    const generateBasicResponse = (question) => {
        const lower = question.toLowerCase();

        if (lower.includes('upload') || lower.includes('video')) return t('maviClass.basicResponses.uploadVideo');
        if (lower.includes('element') || lower.includes('measurement') || lower.includes('ukur')) return t('maviClass.basicResponses.measureTime');
        if (lower.includes('ai') || lower.includes('otomatis')) return t('maviClass.basicResponses.aiFeatures');
        if (lower.includes('waste') || lower.includes('muda')) return t('maviClass.basicResponses.wasteElimination');
        if (lower.includes('therblig')) return t('maviClass.basicResponses.therblig');
        if (lower.includes('manual') || lower.includes('sop') || lower.includes('instruksi')) return t('maviClass.basicResponses.createWorkInstruction');
        if (lower.includes('help') || lower.includes('bantuan') || lower.includes('tolong') || lower.includes('tasu')) return t('maviClass.basicResponses.help');
        if (lower.includes('feature') || lower.includes('fitur') || lower.includes('kino')) return t('maviClass.basicResponses.features');
        if (lower.includes('yamazumi')) return t('maviClass.basicResponses.yamazumi');
        if (lower.includes('vsm') || lower.includes('value stream')) return t('maviClass.basicResponses.vsm');

        return t('maviClass.basicResponses.fallback');
    };

    return (
        <div style={{
            height: '100%',
            backgroundColor: '#0a0a0a',
            color: '#fff',
            overflow: 'auto',
            padding: '40px 60px'
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem'
                        }}>
                            🎓
                        </div>
                        <div>
                            <h1 style={{
                                fontSize: '2.5rem',
                                margin: 0,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontWeight: '700'
                            }}>
                                {t('maviClass.title')}
                            </h1>
                            <p style={{ fontSize: '1rem', color: '#888', margin: 0 }}>
                                {t('maviClass.subtitle')}
                            </p>
                        </div>
                    </div>

                    {/* Progress Overview */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '16px',
                        marginTop: '24px'
                    }}>
                        <div style={{
                            padding: '20px',
                            backgroundColor: '#141414',
                            borderRadius: '12px',
                            border: '1px solid #222',
                            textAlign: 'center'
                        }}>
                            <Target size={24} style={{ color: '#667eea', marginBottom: '8px' }} />
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>{getProgressPercentage()}%</div>
                            <div style={{ fontSize: '0.8rem', color: '#888' }}>{t('maviClass.progress')}</div>
                        </div>
                        <div style={{
                            padding: '20px',
                            backgroundColor: '#141414',
                            borderRadius: '12px',
                            border: '1px solid #222',
                            textAlign: 'center'
                        }}>
                            <BookOpen size={24} style={{ color: '#4CAF50', marginBottom: '8px' }} />
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>{getCompletedCount()}/{getTotalLessons()}</div>
                            <div style={{ fontSize: '0.8rem', color: '#888' }}>{t('maviClass.lessons')}</div>
                        </div>
                        <div style={{
                            padding: '20px',
                            backgroundColor: '#141414',
                            borderRadius: '12px',
                            border: '1px solid #222',
                            textAlign: 'center'
                        }}>
                            <Clock size={24} style={{ color: '#FF9800', marginBottom: '8px' }} />
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>~2.5h</div>
                            <div style={{ fontSize: '0.8rem', color: '#888' }}>{t('maviClass.totalDuration')}</div>
                        </div>
                        <div style={{
                            padding: '20px',
                            backgroundColor: '#141414',
                            borderRadius: '12px',
                            border: '1px solid #222',
                            textAlign: 'center'
                        }}>
                            <Award size={24} style={{ color: '#9C27B0', marginBottom: '8px' }} />
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>{modules.length}</div>
                            <div style={{ fontSize: '0.8rem', color: '#888' }}>{t('maviClass.modules')}</div>
                        </div>
                    </div>

                    {/* Overall Progress Bar */}
                    <div style={{ marginTop: '24px' }}>
                        <div style={{
                            height: '8px',
                            backgroundColor: '#1a1a1a',
                            borderRadius: '4px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${getProgressPercentage()}%`,
                                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                                transition: 'width 0.5s ease',
                                boxShadow: getProgressPercentage() > 0 ? '0 0 10px #667eea' : 'none'
                            }} />
                        </div>
                    </div>
                </div>

                {/* Modules */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {modules.map((module, moduleIdx) => (
                        <div
                            key={module.id}
                            style={{
                                backgroundColor: '#141414',
                                borderRadius: '16px',
                                border: `1px solid ${expandedModule === module.id ? module.color : '#222'}`,
                                overflow: 'hidden',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {/* Module Header */}
                            <div
                                onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                                style={{
                                    padding: '20px 24px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    backgroundColor: expandedModule === module.id ? `${module.color}10` : 'transparent',
                                    transition: 'background-color 0.2s ease'
                                }}
                            >
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    backgroundColor: `${module.color}20`,
                                    border: `2px solid ${module.color}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.5rem'
                                }}>
                                    {module.title.split(' ')[0]}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ color: '#888', fontSize: '0.75rem', marginBottom: '4px' }}>
                                            {t('maviClass.moduleLabel')} {moduleIdx + 1}
                                        </div>
                                        <span style={{
                                            padding: '2px 8px',
                                            backgroundColor: `${module.color}20`,
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            color: module.color
                                        }}>
                                            Module {moduleIdx + 1}
                                        </span>
                                    </div>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#888' }}>
                                        {module.description}
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#666' }}>
                                            <Clock size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                            {module.duration}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: '#666' }}>
                                            <BookOpen size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                            {module.lessons.length} lessons
                                        </span>
                                        <div style={{
                                            flex: 1,
                                            maxWidth: '200px',
                                            height: '4px',
                                            backgroundColor: '#333',
                                            borderRadius: '2px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${getModuleProgress(module.id)}%`,
                                                backgroundColor: module.color,
                                                transition: 'width 0.3s ease'
                                            }} />
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: module.color }}>{getModuleProgress(module.id)}%</span>
                                    </div>
                                </div>
                                {expandedModule === module.id ? (
                                    <ChevronDown size={24} style={{ color: module.color }} />
                                ) : (
                                    <ChevronRight size={24} style={{ color: '#666' }} />
                                )}
                            </div>

                            {/* Lessons List */}
                            {expandedModule === module.id && (
                                <div style={{
                                    padding: '0 24px 24px 24px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px'
                                }}>
                                    {module.lessons.map((lesson, lessonIdx) => {
                                        const isCompleted = completedLessons.includes(lesson.id);
                                        const isActive = activeLesson === lesson.id;

                                        return (
                                            <div key={lesson.id}>
                                                <div
                                                    onClick={() => setActiveLesson(isActive ? null : lesson.id)}
                                                    style={{
                                                        padding: '16px',
                                                        backgroundColor: isActive ? '#1a1a1a' : 'transparent',
                                                        borderRadius: '10px',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        border: isActive ? `1px solid ${module.color}40` : '1px solid transparent',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!isActive) e.currentTarget.style.backgroundColor = '#1a1a1a';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                                                    }}
                                                >
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleCompletion(lesson.id);
                                                        }}
                                                        style={{
                                                            cursor: 'pointer',
                                                            color: isCompleted ? '#4CAF50' : '#555',
                                                            transition: 'transform 0.2s ease'
                                                        }}
                                                    >
                                                        {isCompleted ? <CheckCircle size={20} /> : <Circle size={20} />}
                                                    </div>
                                                    <span style={{ fontSize: '1.2rem' }}>{getLessonIcon(lesson.type)}</span>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{
                                                            color: isCompleted ? '#888' : '#fff',
                                                            textDecoration: isCompleted ? 'line-through' : 'none',
                                                            fontSize: '0.95rem'
                                                        }}>
                                                            {lessonIdx + 1}. {lesson.title}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                                            {lesson.type} • {lesson.duration}
                                                        </div>
                                                    </div>
                                                    <PlayCircle size={20} style={{ color: isActive ? module.color : '#555' }} />
                                                </div>

                                                {/* Lesson Content */}
                                                {isActive && (
                                                    <div style={{
                                                        marginTop: '8px',
                                                        marginLeft: '44px',
                                                        padding: '20px',
                                                        backgroundColor: '#1a1a1a',
                                                        borderRadius: '10px',
                                                        border: `1px solid ${module.color}30`,
                                                        animation: 'slideIn 0.3s ease'
                                                    }}>
                                                        <p style={{ margin: '0 0 16px 0', color: '#ccc', lineHeight: '1.6' }}>
                                                            {lesson.content.description}
                                                        </p>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#ccc', marginBottom: '8px' }}>
                                                            {t('maviClass.keyPoints')}:
                                                        </div>
                                                        <ul style={{
                                                            margin: 0,
                                                            paddingLeft: '20px',
                                                            color: '#aaa',
                                                            lineHeight: '1.8'
                                                        }}>
                                                            {lesson.content.keyPoints.map((point, i) => (
                                                                <li key={i} style={{ marginBottom: '4px' }}>{point}</li>
                                                            ))}
                                                        </ul>
                                                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                                            {lesson.content.tryIt && (
                                                                <button
                                                                    onClick={() => navigate(lesson.content.tryIt)}
                                                                    style={{
                                                                        padding: '10px 20px',
                                                                        backgroundColor: module.color,
                                                                        border: 'none',
                                                                        borderRadius: '8px',
                                                                        color: '#fff',
                                                                        cursor: 'pointer',
                                                                        fontWeight: '500',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '8px',
                                                                        transition: 'transform 0.2s ease'
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                                                >
                                                                    <Zap size={16} />
                                                                    Coba Sekarang →
                                                                </button>
                                                            )}
                                                            {lesson.content.videoUrl && (
                                                                <button
                                                                    onClick={() => window.open(lesson.content.videoUrl, '_blank')}
                                                                    style={{
                                                                        padding: '10px 20px',
                                                                        backgroundColor: '#ff0000',
                                                                        border: 'none',
                                                                        borderRadius: '8px',
                                                                        color: '#fff',
                                                                        cursor: 'pointer',
                                                                        fontWeight: '500',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '8px',
                                                                        transition: 'transform 0.2s ease'
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                                                >
                                                                    <Youtube size={16} />
                                                                    Tonton Video
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Completion Badge */}
                {getProgressPercentage() === 100 && (
                    <div style={{
                        marginTop: '40px',
                        padding: '32px',
                        backgroundColor: '#141414',
                        borderRadius: '16px',
                        border: '2px solid #FFD700',
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #141414 0%, #1a1a0a 100%)'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🏆</div>
                        <h2 style={{ color: '#FFD700', margin: '0 0 8px 0' }}>Congratulations!</h2>
                        <p style={{ color: '#888', margin: 0 }}>
                            Anda telah menyelesaikan semua materi MAVi Class. Selamat menjadi MAVi Expert!
                        </p>
                    </div>
                )}

                {/* Reset Progress Button */}
                <div style={{ marginTop: '40px', textAlign: 'center' }}>
                    <button
                        onClick={() => {
                            if (confirm('Reset semua progress? Tindakan ini tidak bisa dibatalkan.')) {
                                setCompletedLessons([]);
                            }
                        }}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: 'transparent',
                            border: '1px solid #333',
                            borderRadius: '6px',
                            color: '#666',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        Reset Progress
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                @keyframes soundWave {
                    0%, 100% { height: 4px; }
                    50% { height: 12px; }
                }
            `}</style>

            {/* AI Sensei Floating Button */}
            <div
                onClick={() => setIsChatOpen(!isChatOpen)}
                style={{
                    position: 'fixed',
                    bottom: '30px',
                    right: '90px',
                    width: '74px',
                    height: '74px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 0 15px rgba(102, 126, 234, 0.3)',
                    zIndex: 1000,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    animation: isChatOpen ? 'none' : 'bounce 3s ease-in-out infinite'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1) translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(102, 126, 234, 0.5)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1) translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
                }}
                title="MAVi Sensei 2.0 - AI Assistant"
            >
                {isChatOpen ? (
                    <X size={28} color="#fff" />
                ) : (
                    <div style={{ position: 'relative' }}>
                        <SenseiAvatar size={50} animated={!isChatOpen} />
                        {!isChatOpen && (
                            <span style={{
                                position: 'absolute',
                                top: '0',
                                right: '0',
                                width: '14px',
                                height: '14px',
                                borderRadius: '50%',
                                backgroundColor: '#4CAF50',
                                border: '2px solid #0a0a0a',
                                boxShadow: '0 0 10px #4CAF50'
                            }} />
                        )}
                    </div>
                )}
            </div>

            {/* AI Sensei Chat Panel */}
            {isChatOpen && (
                <div style={{
                    position: 'fixed',
                    bottom: '100px',
                    right: '90px',
                    width: '380px',
                    height: '650px',
                    maxHeight: '85vh',
                    backgroundColor: '#141414',
                    borderRadius: '16px',
                    border: '1px solid #333',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 999,
                    animation: 'slideIn 0.3s ease'
                }}>
                    {/* Chat Header */}
                    <div style={{
                        padding: '16px 20px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '16px 16px 0 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <SenseiAvatar size={40} />
                            <div>
                                <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1rem' }}>MAVi Sensei 2.0</div>
                                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4CAF50' }} />
                                    {t('sensei.onlineStatus')}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px',
                                color: '#fff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease'
                            }}
                            title={isMuted ? t('sensei.unmute') : t('sensei.mute')}
                        >
                            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div
                        className="custom-scrollbar"
                        style={{
                            flex: 1,
                            minHeight: 0,
                            padding: '16px',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}
                    >
                        {chatMessages.map((msg, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    gap: '8px',
                                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                                    alignItems: 'flex-start'
                                }}
                            >
                                {msg.role === 'assistant' ? (
                                    <SenseiAvatar size={28} />
                                ) : (
                                    <div style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        backgroundColor: '#2196F3',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <User size={14} color="#fff" />
                                    </div>
                                )}
                                <div style={{
                                    maxWidth: '75%',
                                    padding: '10px 14px',
                                    backgroundColor: msg.role === 'user' ? '#2196F3' : '#1a1a1a',
                                    borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                    color: '#fff',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.5',
                                    whiteSpace: 'pre-wrap',
                                    border: msg.role === 'user' ? 'none' : '1px solid #333'
                                }}>
                                    {typeof msg.content === 'string' ? (
                                        msg.content.split('**').map((part, i) =>
                                            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                                        )
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <SenseiAvatar size={28} />
                                <div style={{
                                    padding: '10px 14px',
                                    backgroundColor: '#1a1a1a',
                                    borderRadius: '12px',
                                    border: '1px solid #333',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <Loader size={16} color="#667eea" style={{ animation: 'spin 1s linear infinite' }} />
                                    <span style={{ color: '#888', fontSize: '0.85rem' }}>{t('sensei.thinking')}</span>
                                </div>
                            </div>
                        )}
                        <div style={{ height: '20px', flexShrink: 0 }} />
                        <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div style={{
                        padding: '12px 16px',
                        borderTop: '1px solid #333',
                        display: 'flex',
                        gap: '8px'
                    }}>
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessageToSensei()}
                            placeholder={t('sensei.placeholder')}
                            style={{
                                flex: 1,
                                padding: '10px 14px',
                                backgroundColor: '#1a1a1a',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '0.9rem',
                                outline: 'none'
                            }}
                        />
                        <button
                            onClick={sendMessageToSensei}
                            disabled={isLoading || !chatInput.trim()}
                            style={{
                                padding: '10px 14px',
                                backgroundColor: chatInput.trim() && !isLoading ? '#667eea' : '#333',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: chatInput.trim() && !isLoading ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background-color 0.2s ease'
                            }}
                        >
                            <Send size={18} color="#fff" />
                        </button>
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default MaviClass;
