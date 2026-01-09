import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Circle, PlayCircle, Clock, BookOpen, ChevronRight, ChevronDown, Award, Target, Zap, MessageCircle, Send, X, Bot, User, Loader, Settings, Youtube, Volume2, VolumeX, BookmarkCheck, BookmarkPlus, CheckCheck, RotateCcw, Search, FileText, Trophy, BarChart3, GraduationCap, HelpCircle, RefreshCw, ChevronLeft, Flame, Star, Medal, BookMarked, StickyNote, Download, ExternalLink, Info, BadgeCheck, Printer } from 'lucide-react';
import CertificateModal from './features/CertificateModal';
import { getStoredApiKey } from '../utils/aiGenerator';
import { useLanguage } from '../i18n/LanguageContext';
import { modules as staticModules } from '../data/maviClassData';
import { getSupabase } from '../utils/supabaseClient';

// ==================== HELPER FUNCTIONS ====================
// Calculate current streak
const getStreakCount = (analyticsData) => {
    if (!analyticsData?.streakDays || analyticsData.streakDays.length === 0) return 0;
    const sorted = [...analyticsData.streakDays].sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 1; i < sorted.length; i++) {
        const curr = new Date(sorted[i - 1]);
        const prev = new Date(sorted[i]);
        const diff = (curr - prev) / 86400000;
        if (diff === 1) streak++;
        else break;
    }
    return streak;
};

// Calculate Total XP and Level
const calculateXP = (completedLessons, quizScores, allModules) => {
    let totalXP = 0;

    allModules.forEach(module => {
        // Lesson XP
        module.lessons.forEach(lesson => {
            if (completedLessons.includes(lesson.id)) {
                totalXP += (lesson.xp || 0);
            }
        });

        // Quiz XP
        if (module.quiz && quizScores[module.id]?.passed) {
            totalXP += (module.quiz.xp || 0);
        }
    });

    return totalXP;
};

const getLevelInfo = (xp) => {
    if (xp >= 1000) return { level: 5, title: 'Master', min: 1000, max: 2000, color: '#FFD700' };
    if (xp >= 600) return { level: 4, title: 'Expert', min: 600, max: 1000, color: '#F44336' };
    if (xp >= 300) return { level: 3, title: 'Practitioner', min: 300, max: 600, color: '#9C27B0' };
    if (xp >= 100) return { level: 2, title: 'Apprentice', min: 100, max: 300, color: '#2196F3' };
    return { level: 1, title: 'Beginner', min: 0, max: 100, color: '#4CAF50' };
};

// ==================== GLOSSARY DATA ====================
const glossaryTerms = [
    { term: 'Therblig', definition: 'Unit dasar gerakan dalam motion study, terdiri dari 18 elemen gerakan seperti Search, Select, Grasp, dll. Dikembangkan oleh Frank dan Lillian Gilbreth.', category: 'Motion Study' },
    { term: 'Cycle Time', definition: 'Waktu yang diperlukan untuk menyelesaikan satu siklus operasi dari awal sampai akhir.', category: 'Time Study' },
    { term: 'Takt Time', definition: 'Waktu yang tersedia untuk memproduksi satu unit produk agar memenuhi demand pelanggan. Rumus: Available Time / Customer Demand.', category: 'Lean Manufacturing' },
    { term: 'REBA', definition: 'Rapid Entire Body Assessment - metode ergonomi untuk mengevaluasi risiko postur kerja seluruh tubuh dengan skor 1-15.', category: 'Ergonomics' },
    { term: 'RULA', definition: 'Rapid Upper Limb Assessment - metode ergonomi untuk menilai risiko gangguan pada tubuh bagian atas (lengan, leher, punggung).', category: 'Ergonomics' },
    { term: 'VSM', definition: 'Value Stream Mapping - alat visual untuk memetakan aliran material dan informasi dari supplier ke customer.', category: 'Lean Manufacturing' },
    { term: 'Yamazumi', definition: 'Chart visual berbentuk stacked bar untuk menunjukkan distribusi beban kerja per operator/station, digunakan untuk line balancing.', category: 'Lean Manufacturing' },
    { term: 'SWCS', definition: 'Standard Work Combination Sheet - dokumen standar yang menunjukkan kombinasi kerja manual, mesin, dan jalan dalam satu takt time.', category: 'Standard Work' },
    { term: 'Muda', definition: '7 pemborosan dalam Lean: Transport, Inventory, Motion, Waiting, Over-processing, Over-production, Defects (TIMWOOD).', category: 'Lean Manufacturing' },
    { term: 'VA/NVA', definition: 'Value Added / Non-Value Added - klasifikasi aktivitas berdasarkan apakah menambah nilai dari perspektif pelanggan.', category: 'Lean Manufacturing' },
    { term: 'MediaPipe', definition: 'Framework ML dari Google untuk mendeteksi pose tubuh, tangan, dan wajah secara real-time di browser.', category: 'AI/Technology' },
    { term: 'DTW', definition: 'Dynamic Time Warping - algoritma untuk mengukur kesamaan antara dua sequences yang mungkin berbeda kecepatan.', category: 'AI/Technology' },
    { term: 'FSM', definition: 'Finite State Machine - model komputasi dengan states terbatas dan transisi antar state berdasarkan kondisi.', category: 'AI/Technology' },
    { term: 'Line Balancing', definition: 'Proses mendistribusikan beban kerja secara merata di sepanjang lini produksi untuk meminimalkan idle time.', category: 'Production' },
    { term: 'Bottleneck', definition: 'Station atau proses dengan cycle time terpanjang yang membatasi throughput keseluruhan sistem.', category: 'Production' },
    { term: 'Standard Time', definition: 'Waktu yang diperlukan operator terlatih untuk menyelesaikan task pada kondisi normal dengan allowance.', category: 'Time Study' },
    { term: 'Allowance', definition: 'Faktor tambahan pada normal time untuk personal needs, fatigue, dan unavoidable delays.', category: 'Time Study' },
    { term: 'Normal Time', definition: 'Observed time yang disesuaikan dengan rating factor untuk mendapatkan waktu kerja normal.', category: 'Time Study' },
    { term: 'Rating Factor', definition: 'Perbandingan kecepatan kerja operator yang diamati dengan kecepatan kerja standar (normal = 100%).', category: 'Time Study' },
    { term: 'Work Sampling', definition: 'Teknik pengukuran kerja dengan mengambil sampel observasi secara random untuk mengestimasi proporsi waktu aktivitas.', category: 'Time Study' }
];

// ==================== BADGES DEFINITIONS ====================
const badgesDefinitions = [
    { id: 'first-lesson', name: 'First Step', icon: '🎯', description: 'Selesaikan lesson pertama', condition: (lessons) => lessons.length >= 1, color: '#4CAF50' },
    { id: 'module-1', name: 'Quick Learner', icon: '📚', description: 'Selesaikan 1 modul penuh', condition: (lessons, modules) => modules.some(m => m.lessons.every(l => lessons.includes(l.id))), color: '#2196F3' },
    { id: 'module-3', name: 'Dedicated Student', icon: '🥉', description: 'Selesaikan 3 modul', condition: (lessons, modules) => modules.filter(m => m.lessons.every(l => lessons.includes(l.id))).length >= 3, color: '#CD7F32' },
    { id: 'module-6', name: 'Knowledge Seeker', icon: '🥈', description: 'Selesaikan 6 modul', condition: (lessons, modules) => modules.filter(m => m.lessons.every(l => lessons.includes(l.id))).length >= 6, color: '#C0C0C0' },
    { id: 'module-all', name: 'MAVi Master', icon: '🥇', description: 'Selesaikan semua modul', condition: (lessons, modules) => modules.every(m => m.lessons.every(l => lessons.includes(l.id))), color: '#FFD700' },
    { id: 'quiz-first', name: 'Quiz Taker', icon: '📝', description: 'Selesaikan quiz pertama', condition: (lessons, modules, scores) => Object.keys(scores).length >= 1, color: '#9C27B0' },
    { id: 'quiz-perfect', name: 'Perfect Score', icon: '💯', description: 'Dapatkan skor 100% di quiz', condition: (lessons, modules, scores) => Object.values(scores).some(s => s.score === 100), color: '#E91E63' },
    { id: 'quiz-all', name: 'Quiz Champion', icon: '🏆', description: 'Lulus semua quiz', condition: (lessons, modules, scores) => modules.filter(m => m.quiz).every(m => scores[m.id]?.passed), color: '#FF9800' },
    { id: 'streak-3', name: 'Consistent', icon: '🔥', description: 'Belajar 3 hari berturut-turut', condition: (lessons, modules, scores, analytics) => getStreakCount(analytics) >= 3, color: '#FF5722' },
    { id: 'streak-7', name: 'Week Warrior', icon: '⚡', description: 'Belajar 7 hari berturut-turut', condition: (lessons, modules, scores, analytics) => getStreakCount(analytics) >= 7, color: '#673AB7' },
    { id: 'notes-5', name: 'Note Taker', icon: '📓', description: 'Buat 5 catatan', condition: (lessons, modules, scores, analytics, notes) => Object.keys(notes).length >= 5, color: '#00BCD4' },
    { id: 'explorer', name: 'Explorer', icon: '🧭', description: 'Kunjungi semua tab (Modules, Glossary, Badges, Analytics)', condition: () => true, color: '#795548' } // Manual check
];

// ==================== SYLLABUS DATA ====================
const syllabusData = {
    title: 'MAVi Class - Industrial Engineering Video Analysis',
    description: 'Kurikulum komprehensif untuk menguasai analisis video dalam Industrial Engineering menggunakan MAVi. Dari dasar Time & Motion Study hingga implementasi AI for compliance monitoring.',
    instructor: {
        name: 'MAVi Sensei (AI)',
        role: 'AI Teaching Assistant',
        expertise: ['Time Study', 'Motion Analysis', 'Lean Manufacturing', 'AI/ML']
    },
    prerequisites: [
        'Pemahaman dasar tentang proses manufaktur',
        'Familiar dengan komputer dan browser modern',
        'Tidak perlu pengalaman programming'
    ],
    outcomes: [
        'Mampu melakukan Time & Motion Study menggunakan video',
        'Dapat mengidentifikasi dan mengeliminasi waste',
        'Mampu membuat Work Instruction dan SOP dari video',
        'Dapat menggunakan AI untuk analisis otomatis',
        'Mampu setup real-time compliance monitoring'
    ],
    weeklyPlan: [
        { week: 1, topics: ['Getting Started', 'Time & Motion Study Basics'], hours: 2 },
        { week: 2, topics: ['AI Features', 'Action Recognition'], hours: 3 },
        { week: 3, topics: ['TPS Tools', 'VSM & Yamazumi'], hours: 4 },
        { week: 4, topics: ['Documentation', 'Manual Creation'], hours: 2 },
        { week: 5, topics: ['Studio Model', 'Real-time Compliance'], hours: 4 },
        { week: 6, topics: ['Advanced Features', 'Case Studies'], hours: 3 }
    ],
    resources: [
        { title: 'Time Study Handbook', type: 'PDF', url: '#' },
        { title: 'Lean Manufacturing Guide', type: 'PDF', url: '#' },
        { title: 'MediaPipe Documentation', type: 'External', url: 'https://mediapipe.dev/' },
        { title: 'TPS Reference Book', type: 'PDF', url: '#' }
    ]
};

const MaviClass = () => {
    const navigate = useNavigate();
    const { currentLanguage, t } = useLanguage();

    // Navigation & View State
    const [activeTab, setActiveTab] = useState('modules'); // 'modules', 'glossary', 'badges', 'analytics', 'syllabus'
    const [expandedModule, setExpandedModule] = useState(null);
    const [activeLesson, setActiveLesson] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeQuizModule, setActiveQuizModule] = useState(null);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [showQuizResults, setShowQuizResults] = useState(false);

    // Progress State
    const [completedLessons, setCompletedLessons] = useState(() => {
        const saved = localStorage.getItem('mavi-class-progress');
        return saved ? JSON.parse(saved) : [];
    });

    // Quiz Scores State
    const [quizScores, setQuizScores] = useState(() => {
        const saved = localStorage.getItem('mavi-class-quiz-scores');
        return saved ? JSON.parse(saved) : {};
    });

    // Notes State
    const [notes, setNotes] = useState(() => {
        const saved = localStorage.getItem('mavi-class-notes');
        return saved ? JSON.parse(saved) : {};
    });
    const [activeNoteLesson, setActiveNoteLesson] = useState(null);
    const [noteText, setNoteText] = useState('');

    // Screen Board State
    const [screenBoard, setScreenBoard] = useState(null); // { type: 'video' | 'doc', url: string, title?: string }

    // Certificate State
    const [certificateData, setCertificateData] = useState(null); // { recipientName, courseName, completedDate, instructorName }
    const [isCertificateOpen, setIsCertificateOpen] = useState(false);



    // Analytics State
    const [analytics, setAnalytics] = useState(() => {
        const saved = localStorage.getItem('mavi-class-analytics');
        return saved ? JSON.parse(saved) : {
            startDate: new Date().toISOString().split('T')[0],
            timeSpent: {},
            lastVisit: null,
            streakDays: [],
            totalQuizAttempts: 0
        };
    });

    // Badges State
    const [earnedBadges, setEarnedBadges] = useState(() => {
        const saved = localStorage.getItem('mavi-class-badges');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('mavi-class-progress', JSON.stringify(completedLessons));
    }, [completedLessons]);

    useEffect(() => {
        localStorage.setItem('mavi-class-quiz-scores', JSON.stringify(quizScores));
    }, [quizScores]);

    useEffect(() => {
        localStorage.setItem('mavi-class-notes', JSON.stringify(notes));
    }, [notes]);

    useEffect(() => {
        localStorage.setItem('mavi-class-analytics', JSON.stringify(analytics));
    }, [analytics]);

    useEffect(() => {
        localStorage.setItem('mavi-class-badges', JSON.stringify(earnedBadges));
    }, [earnedBadges]);



    // Track daily visit for streak
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setAnalytics(prev => {
            const newStreakDays = prev.streakDays.includes(today)
                ? prev.streakDays
                : [...prev.streakDays, today].slice(-30); // Keep last 30 days
            return { ...prev, lastVisit: today, streakDays: newStreakDays };
        });
    }, []);

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


    // ==================== HELPER FUNCTIONS ====================




    // ==================== DYNAMIC CONTENT FETCHING ====================
    const [customContent, setCustomContent] = useState({});

    useEffect(() => {
        const fetchCustomContent = async () => {
            try {
                const supabase = getSupabase();
                const { data, error } = await supabase
                    .from('maviclass_content')
                    .select('*');

                if (error) {
                    console.warn('Error fetching custom MaviClass content:', error);
                    return;
                }

                const contentMap = {};
                data.forEach(item => {
                    contentMap[item.identifier] = item;
                });
                setCustomContent(contentMap);
            } catch (error) {
                console.error('Failed to fetch custom content:', error);
            }
        };

        fetchCustomContent();

        // Subscribe to real-time changes
        const supabase = getSupabase();
        const channel = supabase
            .channel('maviclass_content_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'maviclass_content'
            }, () => {
                fetchCustomContent();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Merge static data with custom content from Supabase
    const modules = useMemo(() => {
        return staticModules.map(module => {
            const customModule = customContent[module.id];
            const updatedModule = { ...module };

            // Add document download if exists
            if (customModule?.doc_url) {
                updatedModule.docUrl = customModule.doc_url;
            }

            // Update lessons
            updatedModule.lessons = module.lessons.map(lesson => {
                const customLesson = customContent[lesson.id];
                const updatedLesson = { ...lesson };
                if (customLesson?.video_url) {
                    updatedLesson.content = {
                        ...lesson.content,
                        videoUrl: customLesson.video_url
                    };
                }
                return updatedLesson;
            });

            return updatedModule;
        });
    }, [customContent]);

    // Derived XP State - moved here to ensure 'modules' is defined
    const [xp, setXP] = useState(0);
    const [levelInfo, setLevelInfo] = useState({ level: 1, title: 'Beginner', min: 0, max: 100, color: '#4CAF50' });

    useEffect(() => {
        const calculatedXP = calculateXP(completedLessons, quizScores, modules);
        setXP(calculatedXP);
        const newLevelInfo = getLevelInfo(calculatedXP);
        if (newLevelInfo.level > levelInfo.level) {
            speak(`Congratulations! You've leveled up to ${newLevelInfo.title}!`);
        }
        setLevelInfo(newLevelInfo);
    }, [completedLessons, quizScores, modules]);

    const handleViewCertificate = (module) => {
        // Check if eligible
        const isLessonComplete = module.lessons.every(l => completedLessons.includes(l.id));
        const isQuizPassed = !module.quiz || quizScores[module.id]?.passed;

        if (isLessonComplete && isQuizPassed) {
            setCertificateData({
                recipientName: 'Engineer', // Could value from user settings if available
                courseName: module.title,
                completedDate: new Date().toLocaleDateString(),
                instructorName: 'MAVi AI Sensei'
            });
            setIsCertificateOpen(true);
        } else {
            alert('Please complete all lessons and pass the quiz to earn the certificate.');
        }
    };

    // Check and award badges
    const checkBadges = () => {
        badgesDefinitions.forEach(badge => {
            if (!earnedBadges.includes(badge.id)) {
                let earned = false;
                try {
                    earned = badge.condition(completedLessons, modules, quizScores, analytics, notes);
                } catch (e) {
                    earned = false;
                }
                if (earned) {
                    setEarnedBadges(prev => [...prev, badge.id]);
                }
            }
        });
    };

    useEffect(() => {
        checkBadges();
    }, [completedLessons, quizScores, analytics, notes]);

    // Search function
    const filteredModules = useMemo(() => {
        if (!searchQuery.trim()) return modules;
        const query = searchQuery.toLowerCase();
        return modules.filter(module =>
            module.title.toLowerCase().includes(query) ||
            module.description.toLowerCase().includes(query) ||
            module.lessons.some(lesson =>
                lesson.title.toLowerCase().includes(query) ||
                lesson.content.description.toLowerCase().includes(query) ||
                lesson.content.keyPoints.some(kp => kp.toLowerCase().includes(query))
            )
        );
    }, [searchQuery, modules]);

    // Quiz functions
    const handleQuizAnswer = (questionId, answerIndex) => {
        setQuizAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
    };

    const submitQuiz = (moduleId, quiz) => {
        let correct = 0;
        quiz.questions.forEach(q => {
            if (quizAnswers[q.id] === q.correctAnswer) correct++;
        });
        const score = Math.round((correct / quiz.questions.length) * 100);
        const passed = score >= quiz.passingScore;

        setQuizScores(prev => ({
            ...prev,
            [moduleId]: {
                score,
                passed,
                attempts: (prev[moduleId]?.attempts || 0) + 1,
                lastAttempt: new Date().toISOString()
            }
        }));

        setAnalytics(prev => ({
            ...prev,
            totalQuizAttempts: prev.totalQuizAttempts + 1
        }));

        setShowQuizResults(true);
    };

    const resetQuiz = (moduleId) => {
        setQuizAnswers({});
        setShowQuizResults(false);
    };

    // Save note
    const saveNote = (lessonId, text) => {
        setNotes(prev => ({ ...prev, [lessonId]: text }));
    };

    // Export notes
    const exportNotes = () => {
        let content = '# MAVi Class - Catatan Saya\n\n';
        Object.entries(notes).forEach(([lessonId, note]) => {
            if (note.trim()) {
                content += `## ${lessonId}\n${note}\n\n`;
            }
        });
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mavi-class-notes.md';
        a.click();
    };

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
- /studio-model: Studio Model - buat model AI kustom untuk deteksi gerakan
- /teachable-machine: Teachable Machine Studio - integrasi Google Teachable Machine
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
6. Setup Gemini API Key di Settings untuk mengaktifkan fitur AI
7. Gunakan Studio Model untuk membuat detector gerakan kustom
8. Export data ke Excel untuk analisis lanjutan di spreadsheet
9. REBA Assessment untuk evaluasi ergonomi postur kerja
10. Keyboard shortcut Space untuk play/pause, S untuk start measurement
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
            background: 'radial-gradient(circle at top right, #1a1a2e 0%, #050505 100%)',
            color: '#e0e0e0',
            overflow: 'auto',
            padding: '40px 60px',
            fontFamily: "'Inter', sans-serif"
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

                    {/* Level Badge */}
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            background: `linear-gradient(135deg, ${levelInfo.color}20 0%, ${levelInfo.color}10 100%)`,
                            border: `1px solid ${levelInfo.color}`,
                            borderRadius: '20px',
                            color: levelInfo.color,
                            fontWeight: 'bold',
                            boxShadow: `0 0 15px ${levelInfo.color}20`
                        }}>
                            <Award size={20} />
                            Level {levelInfo.level}: {levelInfo.title}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            <div style={{ width: '100px', height: '4px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min(100, (xp / levelInfo.max) * 100)}%`, backgroundColor: levelInfo.color }} />
                            </div>
                            {xp} / {levelInfo.max} XP
                        </div>
                    </div>
                </div>

                {/* Progress Overview */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '20px',
                    marginTop: '32px'
                }}>
                    {[
                        { icon: Target, value: `${getProgressPercentage()}%`, label: t('maviClass.progress'), color: '#667eea' },
                        { icon: BookOpen, value: `${getCompletedCount()}/${getTotalLessons()}`, label: t('maviClass.lessons'), color: '#4CAF50' },
                        { icon: Clock, value: '~2.5h', label: t('maviClass.totalDuration'), color: '#FF9800' },
                        { icon: Award, value: modules.length, label: t('maviClass.modules'), color: '#9C27B0' }
                    ].map((item, idx) => (
                        <div key={idx} style={{
                            padding: '24px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            textAlign: 'center',
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                            cursor: 'default'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = `0 10px 30px -10px ${item.color}40`;
                                e.currentTarget.style.border = `1px solid ${item.color}40`;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.05)';
                            }}
                        >
                            <item.icon size={28} style={{ color: item.color, marginBottom: '12px', filter: `drop-shadow(0 0 10px ${item.color}60)` }} />
                            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>{item.value}</div>
                            <div style={{ fontSize: '0.85rem', color: '#888', fontWeight: '500' }}>{item.label}</div>
                        </div>
                    ))}
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

                {/* Tab Navigation & Search */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '32px',
                    gap: '20px',
                    flexWrap: 'wrap'
                }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {[
                            { id: 'modules', icon: BookOpen, label: 'Modules' },
                            { id: 'glossary', icon: BookMarked, label: 'Glossary' },
                            { id: 'badges', icon: Trophy, label: 'Badges' },
                            { id: 'analytics', icon: BarChart3, label: 'Analytics' },
                            { id: 'syllabus', icon: GraduationCap, label: 'Syllabus' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 18px',
                                    backgroundColor: activeTab === tab.id ? 'rgba(102, 126, 234, 0.15)' : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${activeTab === tab.id ? '#667eea' : 'rgba(255,255,255,0.1)'}`,
                                    borderRadius: '10px',
                                    color: activeTab === tab.id ? '#667eea' : '#888',
                                    cursor: 'pointer',
                                    fontWeight: activeTab === tab.id ? '600' : '500',
                                    fontSize: '0.9rem',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Search Bar */}
                    {activeTab === 'modules' && (
                        <div style={{
                            position: 'relative',
                            minWidth: '250px'
                        }}>
                            <Search size={18} style={{
                                position: 'absolute',
                                left: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: '#666'
                            }} />
                            <input
                                type="text"
                                placeholder="Cari modul, lesson, atau topik..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px 12px 44px',
                                    backgroundColor: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '10px',
                                    color: '#e0e0e0',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s ease'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: '#666',
                                        cursor: 'pointer',
                                        padding: '4px'
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Streak Badge */}
                    {getStreakCount(analytics) > 0 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            backgroundColor: 'rgba(255, 87, 34, 0.1)',
                            border: '1px solid #FF5722',
                            borderRadius: '20px',
                            color: '#FF5722',
                            fontWeight: '600',
                            fontSize: '0.9rem'
                        }}>
                            <Flame size={18} />
                            {getStreakCount(analytics)} day streak!
                        </div>
                    )}
                </div>
            </div>

            {/* ==================== TAB CONTENT ==================== */}

            {/* MODULES TAB */}
            {activeTab === 'modules' && (
                <>
                    {searchQuery && filteredModules.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
                            <Search size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                            <p style={{ fontSize: '1.1rem', margin: 0 }}>Tidak ditemukan hasil untuk "{searchQuery}"</p>
                        </div>
                    )}

                    {/* Modules */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {filteredModules.map((module, moduleIdx) => (
                            <div
                                key={module.id}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    backdropFilter: 'blur(10px)',
                                    borderRadius: '20px',
                                    border: `1px solid ${expandedModule === module.id ? module.color : 'rgba(255, 255, 255, 0.05)'}`,
                                    overflow: 'hidden',
                                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    transform: expandedModule === module.id ? 'scale(1.01)' : 'scale(1)',
                                    boxShadow: expandedModule === module.id ? `0 20px 40px -10px ${module.color}20` : 'none'
                                }}
                            >
                                {/* Module Header */}
                                <div
                                    onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                                    style={{
                                        padding: '24px 32px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '24px',
                                        background: expandedModule === module.id ? `linear-gradient(90deg, ${module.color}10 0%, transparent 100%)` : 'transparent',
                                        borderBottom: expandedModule === module.id ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                        transition: 'background 0.3s ease'
                                    }}
                                >
                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '16px',
                                        backgroundColor: `${module.color}15`,
                                        border: `1px solid ${module.color}40`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '2rem',
                                        boxShadow: `0 8px 16px -4px ${module.color}30`
                                    }}>
                                        {module.title.split(' ')[0]}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                                            <span style={{
                                                padding: '4px 10px',
                                                backgroundColor: `${module.color}15`,
                                                border: `1px solid ${module.color}30`,
                                                borderRadius: '6px',
                                                fontSize: '0.7rem',
                                                fontWeight: '600',
                                                letterSpacing: '0.5px',
                                                color: module.color,
                                                textTransform: 'uppercase'
                                            }}>
                                                Module {moduleIdx + 1}
                                            </span>
                                            {getModuleProgress(module.id) === 100 && (
                                                <span style={{
                                                    padding: '4px 10px',
                                                    backgroundColor: 'rgba(76, 175, 80, 0.15)',
                                                    border: '1px solid #4CAF50',
                                                    borderRadius: '6px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: '600',
                                                    letterSpacing: '0.5px',
                                                    color: '#4CAF50',
                                                    textTransform: 'uppercase',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    animation: 'pulse 2s infinite'
                                                }}>
                                                    <CheckCircle size={12} /> Selesai
                                                </span>
                                            )}
                                        </div>
                                        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 'bold', color: '#fff' }}>
                                            {module.title}
                                        </h3>
                                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#aaa', lineHeight: '1.5' }}>
                                            {module.description}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '16px' }}>
                                            <span style={{ fontSize: '0.85rem', color: '#888', display: 'flex', alignItems: 'center' }}>
                                                <Clock size={14} style={{ marginRight: '6px' }} />
                                                {module.duration}
                                            </span>
                                            <span style={{ fontSize: '0.85rem', color: '#888', display: 'flex', alignItems: 'center' }}>
                                                <BookOpen size={14} style={{ marginRight: '6px' }} />
                                                {module.lessons.filter(l => completedLessons.includes(l.id)).length}/{module.lessons.length} lessons
                                            </span>
                                            <div style={{
                                                flex: 1,
                                                maxWidth: '240px',
                                                height: '6px',
                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                borderRadius: '3px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${getModuleProgress(module.id)}%`,
                                                    backgroundColor: module.color,
                                                    borderRadius: '3px',
                                                    boxShadow: `0 0 10px ${module.color}`,
                                                    transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                                                }} />
                                            </div>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: module.color }}>{getModuleProgress(module.id)}%</span>

                                            {/* Certificate Button */}
                                            {module.hasCertificate && getModuleProgress(module.id) === 100 && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewCertificate(module);
                                                    }}
                                                    style={{
                                                        padding: '6px 12px',
                                                        backgroundColor: 'rgba(218, 165, 32, 0.15)',
                                                        border: '1px solid #daa520',
                                                        borderRadius: '6px',
                                                        color: '#daa520',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        marginLeft: '8px',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'rgba(218, 165, 32, 0.25)';
                                                        e.currentTarget.style.boxShadow = '0 0 10px rgba(218, 165, 32, 0.2)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'rgba(218, 165, 32, 0.15)';
                                                        e.currentTarget.style.boxShadow = 'none';
                                                    }}
                                                >
                                                    <Award size={14} /> Certificate
                                                </button>
                                            )}
                                            {module.docUrl && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setScreenBoard({
                                                            type: 'doc',
                                                            url: module.docUrl,
                                                            id: module.id,
                                                            title: `Document: ${module.title}`
                                                        });
                                                    }}
                                                    style={{
                                                        padding: '6px 12px',
                                                        backgroundColor: 'rgba(102, 126, 234, 0.15)',
                                                        border: '1px solid #667eea',
                                                        borderRadius: '6px',
                                                        color: '#667eea',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.25)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.15)'}
                                                >
                                                    <FileText size={14} /> Ref Doc
                                                </button>
                                            )}
                                            {/* Mark All Complete Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const allLessonIds = module.lessons.map(l => l.id);
                                                    const allCompleted = allLessonIds.every(id => completedLessons.includes(id));
                                                    if (allCompleted) {
                                                        // Unmark all
                                                        setCompletedLessons(prev => prev.filter(id => !allLessonIds.includes(id)));
                                                    } else {
                                                        // Mark all
                                                        setCompletedLessons(prev => [...new Set([...prev, ...allLessonIds])]);
                                                    }
                                                }}
                                                style={{
                                                    padding: '6px 12px',
                                                    backgroundColor: getModuleProgress(module.id) === 100 ? `${module.color}20` : 'rgba(255,255,255,0.05)',
                                                    border: `1px solid ${getModuleProgress(module.id) === 100 ? module.color : 'rgba(255,255,255,0.1)'}`,
                                                    borderRadius: '6px',
                                                    color: getModuleProgress(module.id) === 100 ? module.color : '#888',
                                                    cursor: 'pointer',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    transition: 'all 0.2s ease',
                                                    whiteSpace: 'nowrap'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.backgroundColor = `${module.color}30`;
                                                    e.currentTarget.style.borderColor = module.color;
                                                    e.currentTarget.style.color = module.color;
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.backgroundColor = getModuleProgress(module.id) === 100 ? `${module.color}20` : 'rgba(255,255,255,0.05)';
                                                    e.currentTarget.style.borderColor = getModuleProgress(module.id) === 100 ? module.color : 'rgba(255,255,255,0.1)';
                                                    e.currentTarget.style.color = getModuleProgress(module.id) === 100 ? module.color : '#888';
                                                }}
                                                title={getModuleProgress(module.id) === 100 ? 'Unmark all lessons' : 'Mark all lessons as complete'}
                                            >
                                                {getModuleProgress(module.id) === 100 ? (
                                                    <><RotateCcw size={12} /> Reset</>
                                                ) : (
                                                    <><CheckCheck size={12} /> Complete All</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.3s ease',
                                        transform: expandedModule === module.id ? 'rotate(180deg)' : 'rotate(0deg)'
                                    }}>
                                        <ChevronDown size={20} style={{ color: expandedModule === module.id ? module.color : '#666' }} />
                                    </div>
                                </div>

                                {/* Lessons List */}
                                {expandedModule === module.id && (
                                    <div style={{
                                        padding: '0 32px 32px 32px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px',
                                        borderTop: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        <div style={{ height: '20px' }}></div>
                                        {module.lessons.map((lesson, lessonIdx) => {
                                            const isCompleted = completedLessons.includes(lesson.id);
                                            const isActive = activeLesson === lesson.id;

                                            return (
                                                <div key={lesson.id} style={{ animation: `slideIn 0.3s ease forwards ${lessonIdx * 0.05}s`, opacity: 0, transform: 'translateY(10px)' }}>
                                                    <div
                                                        onClick={() => setActiveLesson(isActive ? null : lesson.id)}
                                                        style={{
                                                            padding: '20px',
                                                            backgroundColor: isActive ? 'rgba(255,255,255,0.03)' : 'transparent',
                                                            borderRadius: '12px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '20px',
                                                            border: isActive ? `1px solid ${module.color}40` : '1px solid transparent',
                                                            transition: 'all 0.2s ease'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!isActive) {
                                                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
                                                                e.currentTarget.style.transform = 'translateX(5px)';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (!isActive) {
                                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                                e.currentTarget.style.transform = 'translateX(0)';
                                                            }
                                                        }}
                                                    >
                                                        <div
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleCompletion(lesson.id);
                                                            }}
                                                            style={{
                                                                cursor: 'pointer',
                                                                color: isCompleted ? '#4CAF50' : 'rgba(255,255,255,0.2)',
                                                                transition: 'transform 0.2s ease',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                        >
                                                            {isCompleted ? <CheckCircle size={24} weight="fill" /> : <Circle size={24} />}
                                                        </div>

                                                        <div style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '10px',
                                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '1.2rem'
                                                        }}>
                                                            {getLessonIcon(lesson.type)}
                                                        </div>

                                                        <div style={{ flex: 1 }}>
                                                            <div style={{
                                                                color: isCompleted ? '#888' : '#e0e0e0',
                                                                textDecoration: isCompleted ? 'line-through' : 'none',
                                                                fontSize: '1rem',
                                                                fontWeight: '500',
                                                                marginBottom: '4px'
                                                            }}>
                                                                {lesson.title}
                                                            </div>
                                                            <div style={{ fontSize: '0.8rem', color: '#666', display: 'flex', gap: '10px' }}>
                                                                <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)' }}>{lesson.type}</span>
                                                                <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)' }}>{lesson.duration}</span>
                                                            </div>
                                                        </div>
                                                        <div style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '50%',
                                                            backgroundColor: isActive ? module.color : 'rgba(255,255,255,0.05)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'all 0.3s ease'
                                                        }}>
                                                            {isActive ? <ChevronDown size={18} color="#fff" /> : <PlayCircle size={18} style={{ color: isActive ? '#fff' : '#666' }} />}
                                                        </div>
                                                    </div>

                                                    {/* Lesson Content Area */}
                                                    {isActive && (
                                                        <div style={{
                                                            marginTop: '12px',
                                                            marginLeft: '60px', // Align with text
                                                            padding: '24px',
                                                            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                                                            borderRadius: '16px',
                                                            border: `1px solid ${module.color}20`,
                                                            animation: 'slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                                        }}>
                                                            <p style={{ margin: '0 0 20px 0', color: '#d0d0d0', lineHeight: '1.8', fontSize: '1rem' }}>
                                                                {lesson.content.description}
                                                            </p>

                                                            <div style={{ marginBottom: '20px' }}>
                                                                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                                                                    {t('maviClass.keyPoints')}
                                                                </div>
                                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                                                                    {lesson.content.keyPoints.map((point, i) => (
                                                                        <div key={i} style={{
                                                                            padding: '12px',
                                                                            backgroundColor: 'rgba(0,0,0,0.2)',
                                                                            borderRadius: '8px',
                                                                            borderLeft: `3px solid ${module.color}`,
                                                                            color: '#bbb',
                                                                            fontSize: '0.9rem',
                                                                            lineHeight: '1.5'
                                                                        }}>
                                                                            {point}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div style={{ display: 'flex', gap: '16px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                                {lesson.content.tryIt && (
                                                                    <button
                                                                        onClick={() => navigate(lesson.content.tryIt)}
                                                                        style={{
                                                                            padding: '12px 24px',
                                                                            background: `linear-gradient(135deg, ${module.color} 0%, ${module.color}dd 100%)`,
                                                                            border: 'none',
                                                                            borderRadius: '8px',
                                                                            color: '#fff',
                                                                            cursor: 'pointer',
                                                                            fontWeight: '600',
                                                                            fontSize: '0.95rem',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '10px',
                                                                            boxShadow: `0 4px 15px -4px ${module.color}60`,
                                                                            transition: 'all 0.2s ease'
                                                                        }}
                                                                        onMouseEnter={(e) => {
                                                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                                                            e.currentTarget.style.boxShadow = `0 8px 20px -4px ${module.color}80`;
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                                            e.currentTarget.style.boxShadow = `0 4px 15px -4px ${module.color}60`;
                                                                        }}
                                                                    >
                                                                        <Zap size={18} fill="currentColor" />
                                                                        Coba Fitur Ini
                                                                    </button>
                                                                )}
                                                                {lesson.content.videoUrl && (
                                                                    <button
                                                                        onClick={() => setScreenBoard({
                                                                            type: 'video',
                                                                            url: lesson.content.videoUrl,
                                                                            id: lesson.id,
                                                                            title: `Tutorial: ${lesson.title}`
                                                                        })}
                                                                        style={{
                                                                            padding: '12px 24px',
                                                                            backgroundColor: 'rgba(255,0,0,0.1)',
                                                                            border: '1px solid rgba(255,0,0,0.3)',
                                                                            borderRadius: '8px',
                                                                            color: '#ff4444',
                                                                            cursor: 'pointer',
                                                                            fontWeight: '600',
                                                                            fontSize: '0.95rem',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '10px',
                                                                            transition: 'all 0.2s ease'
                                                                        }}
                                                                        onMouseEnter={(e) => {
                                                                            e.currentTarget.style.backgroundColor = 'rgba(255,0,0,0.2)';
                                                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                                                        }}
                                                                        onMouseLeave={(e) => {
                                                                            e.currentTarget.style.backgroundColor = 'rgba(255,0,0,0.1)';
                                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                                        }}
                                                                    >
                                                                        <Youtube size={20} />
                                                                        Tonton Video Tutorial
                                                                    </button>
                                                                )}
                                                                {/* Bookmark / Mark Complete Button */}
                                                                <button
                                                                    onClick={() => toggleCompletion(lesson.id)}
                                                                    style={{
                                                                        padding: '12px 24px',
                                                                        backgroundColor: isCompleted ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255,255,255,0.05)',
                                                                        border: `1px solid ${isCompleted ? '#4CAF50' : 'rgba(255,255,255,0.2)'}`,
                                                                        borderRadius: '8px',
                                                                        color: isCompleted ? '#4CAF50' : '#aaa',
                                                                        cursor: 'pointer',
                                                                        fontWeight: '600',
                                                                        fontSize: '0.95rem',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '10px',
                                                                        transition: 'all 0.2s ease',
                                                                        marginLeft: 'auto'
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        if (!isCompleted) {
                                                                            e.currentTarget.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
                                                                            e.currentTarget.style.borderColor = '#4CAF50';
                                                                            e.currentTarget.style.color = '#4CAF50';
                                                                        }
                                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        if (!isCompleted) {
                                                                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                                                            e.currentTarget.style.color = '#aaa';
                                                                        }
                                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                                    }}
                                                                >
                                                                    {isCompleted ? (
                                                                        <><BookmarkCheck size={18} /> Sudah Dipelajari</>
                                                                    ) : (
                                                                        <><BookmarkPlus size={18} /> Tandai Selesai</>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {/* Practice Challenge Section */}
                                        {module.practice && (
                                            <div style={{
                                                marginTop: '32px',
                                                padding: '30px',
                                                background: `linear-gradient(135deg, ${module.color}15 0%, rgba(255,255,255,0.02) 100%)`,
                                                borderRadius: '24px',
                                                border: `1px solid ${module.color}30`,
                                                position: 'relative',
                                                overflow: 'hidden',
                                                animation: 'slideIn 0.5s ease-out'
                                            }}>
                                                {/* Background Decoration */}
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '-20px',
                                                    right: '-20px',
                                                    fontSize: '8rem',
                                                    opacity: 0.05,
                                                    transform: 'rotate(-15deg)',
                                                    pointerEvents: 'none'
                                                }}>
                                                    🎯
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
                                                    <div style={{
                                                        width: '60px',
                                                        height: '60px',
                                                        borderRadius: '18px',
                                                        backgroundColor: module.color,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        boxShadow: `0 10px 20px -5px ${module.color}60`
                                                    }}>
                                                        <Target size={32} color="#fff" />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: '800', color: '#fff' }}>
                                                            {module.practice.title}
                                                        </h3>
                                                        <p style={{ margin: '0 0 20px 0', color: '#aaa', fontSize: '1.05rem', lineHeight: '1.6' }}>
                                                            {module.practice.description}
                                                        </p>

                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                                            {module.practice.tasks.map((task, i) => (
                                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#ddd' }}>
                                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: module.color }}></div>
                                                                    {task}
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <button
                                                            onClick={() => navigate(module.practice.actionLink)}
                                                            style={{
                                                                padding: '14px 28px',
                                                                backgroundColor: '#fff',
                                                                border: 'none',
                                                                borderRadius: '12px',
                                                                color: '#000',
                                                                cursor: 'pointer',
                                                                fontWeight: '700',
                                                                fontSize: '1rem',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '12px',
                                                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                                                boxShadow: '0 10px 25px -5px rgba(255,255,255,0.2)'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                                                                e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(255,255,255,0.3)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                                                                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(255,255,255,0.2)';
                                                            }}
                                                        >
                                                            {module.practice.actionLabel}
                                                            <ChevronRight size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Completion Badge */}
                    {getProgressPercentage() === 100 && (
                        <div style={{
                            marginTop: '60px',
                            padding: '40px',
                            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: '24px',
                            border: '1px solid rgba(255, 215, 0, 0.3)',
                            textAlign: 'center',
                            boxShadow: '0 20px 50px -20px rgba(255, 215, 0, 0.3)'
                        }}>
                            <div style={{ fontSize: '5rem', marginBottom: '24px', animation: 'bounce 2s infinite' }}>🏆</div>
                            <h2 style={{
                                color: '#FFD700',
                                fontSize: '2.5rem',
                                margin: '0 0 16px 0',
                                textShadow: '0 0 20px rgba(255, 215, 0, 0.5)'
                            }}>
                                Congratulations!
                            </h2>
                            <p style={{ color: '#e0e0e0', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
                                Anda telah menyelesaikan semua materi MAVi Class. Selamat menjadi MAVi Expert!
                            </p>
                        </div>
                    )}

                    {/* Reset Progress Button */}
                    <div style={{ marginTop: '60px', textAlign: 'center', marginBottom: '40px' }}>
                        <button
                            onClick={() => {
                                if (confirm('Reset semua progress? Tindakan ini tidak bisa dibatalkan.')) {
                                    setCompletedLessons([]);
                                }
                            }}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '50px',
                                color: '#666',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: '500',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#ff4444';
                                e.currentTarget.style.color = '#ff4444';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                e.currentTarget.style.color = '#666';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            Reset Progress
                        </button>
                    </div>
                </>
            )}

            {/* GLOSSARY TAB */}
            {activeTab === 'glossary' && (
                <div style={{ animation: 'slideIn 0.4s ease-out' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {glossaryTerms.map((item, idx) => (
                            <div key={idx} style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '0.7rem', color: '#667eea', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>{item.category}</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>{item.term}</div>
                                <p style={{ margin: 0, color: '#aaa', fontSize: '0.9rem', lineHeight: '1.6' }}>{item.definition}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* BADGES TAB */}
            {activeTab === 'badges' && (
                <div style={{ animation: 'slideIn 0.4s ease-out' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                        {badgesDefinitions.map((badge, idx) => {
                            const isEarned = earnedBadges.includes(badge.id);
                            return (
                                <div key={idx} style={{
                                    padding: '30px',
                                    background: isEarned ? `${badge.color}10` : 'rgba(255,255,255,0.02)',
                                    borderRadius: '24px',
                                    border: `1px solid ${isEarned ? `${badge.color}40` : 'rgba(255,255,255,0.05)'}`,
                                    textAlign: 'center',
                                    position: 'relative',
                                    opacity: isEarned ? 1 : 0.6,
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '16px', filter: isEarned ? 'none' : 'grayscale(100%)' }}>{badge.icon}</div>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: isEarned ? badge.color : '#888', marginBottom: '8px' }}>{badge.name}</div>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>{badge.description}</p>
                                    {isEarned && (
                                        <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
                                            <BadgeCheck size={20} color={badge.color} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
                <div style={{ animation: 'slideIn 0.4s ease-out' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
                        {/* Overall Progress */}
                        <div style={{ padding: '30px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Target size={20} color="#667eea" /> Progress Summary
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flexWrap: 'wrap' }}>
                                <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                                    <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#667eea" strokeWidth="3" strokeDasharray={`${getProgressPercentage()}, 100`} strokeLinecap="round" />
                                    </svg>
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>{getProgressPercentage()}%</div>
                                        <div style={{ fontSize: '0.6rem', color: '#666', textTransform: 'uppercase' }}>Done</div>
                                    </div>
                                </div>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#888', fontSize: '0.9rem' }}>Lessons Completed</span>
                                        <span style={{ color: '#fff', fontWeight: 'bold' }}>{getCompletedCount()} / {getTotalLessons()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#888', fontSize: '0.9rem' }}>Modules Mastered</span>
                                        <span style={{ color: '#fff', fontWeight: 'bold' }}>{modules.filter(m => getModuleProgress(m.id) === 100).length} / {modules.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quiz Performance */}
                        <div style={{ padding: '30px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FileText size={20} color="#FF9800" /> Quiz Scores
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '200px', overflowY: 'auto', paddingRight: '10px' }} className="custom-scrollbar">
                                {Object.entries(quizScores).map(([id, data]) => (
                                    <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <span style={{ color: '#e0e0e0', fontSize: '0.9rem', fontWeight: '500' }}>{modules.find(m => m.id === id)?.title.split(' ').slice(1).join(' ') || id}</span>
                                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                            <span style={{ color: data.passed ? '#4CAF50' : '#f44336', fontWeight: 'bold', padding: '2px 8px', backgroundColor: data.passed ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)', borderRadius: '6px' }}>{data.score}%</span>
                                        </div>
                                    </div>
                                ))}
                                {Object.keys(quizScores).length === 0 && (
                                    <div style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '30px' }}>
                                        Belum ada quiz yang diselesaikan
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SYLLABUS TAB */}
            {activeTab === 'syllabus' && (
                <div style={{ animation: 'slideIn 0.4s ease-out' }}>
                    <div style={{ padding: '40px', background: 'rgba(255,255,255,0.03)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '30px', marginBottom: '40px' }}>
                            <div style={{ flex: 1, minWidth: '300px' }}>
                                <h2 style={{ fontSize: '2.2rem', margin: '0 0 16px 0', color: '#fff', fontWeight: '800' }}>{syllabusData.title}</h2>
                                <p style={{ color: '#aaa', lineHeight: '1.8', margin: 0, fontSize: '1.1rem' }}>{syllabusData.description}</p>
                            </div>
                            <div style={{ padding: '24px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '20px', border: '1px solid rgba(102, 126, 234, 0.2)', minWidth: '250px' }}>
                                <div style={{ fontSize: '0.75rem', color: '#667eea', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>Main Instructor</div>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '15px', backgroundColor: '#667eea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>🤖</div>
                                    <div>
                                        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>{syllabusData.instructor.name}</div>
                                        <div style={{ color: '#888', fontSize: '0.85rem' }}>{syllabusData.instructor.role}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
                            <div>
                                <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <CheckCircle size={20} color="#4CAF50" /> Learning Outcomes
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {syllabusData.outcomes.map((item, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '12px', color: '#aaa', fontSize: '0.95rem' }}>
                                            <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>•</div>
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Info size={20} color="#FF9800" /> Learning Resources
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {syllabusData.resources.map((res, i) => (
                                        <a key={i} href={res.url} target="_blank" rel="noopener noreferrer" style={{ padding: '15px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', color: '#fff', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s ease' }}>
                                            {res.type === 'PDF' ? <FileText size={20} color="#f44336" /> : <ExternalLink size={20} color="#667eea" />}
                                            <div>
                                                <div style={{ fontWeight: '600' }}>{res.title}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#666' }}>{res.type} Resource</div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== SCREEN BOARD MODAL (TV / WHITEBOARD STYLE) ==================== */}
            {screenBoard && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.92)',
                    backdropFilter: 'blur(15px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    padding: 0,
                    animation: 'slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <div style={{
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: '#000',
                        borderRadius: 0,
                        // TV Bezel Style - flush to edges
                        border: '8px solid #1a1a1a',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)',
                        position: 'relative'
                    }}>
                        {/* Modal Header (Built-in Display Bar) */}
                        <div style={{
                            padding: '12px 24px',
                            borderBottom: '1px solid #222',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'linear-gradient(to bottom, #1a1a1a, #111)',
                            minHeight: '60px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                {/* LED Status Light */}
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: '#4CAF50',
                                    boxShadow: '0 0 8px #4CAF50',
                                    marginRight: '5px'
                                }} />

                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {screenBoard.type === 'video' ? <Youtube size={16} color="#ff0000" /> : <FileText size={16} color="#0078d4" />}
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1rem', margin: 0, color: '#fff', fontWeight: '600', letterSpacing: '0.5px' }}>
                                        {screenBoard.title || 'MAVi Vision Pro'}
                                    </h2>
                                    <div style={{ fontSize: '0.65rem', color: '#555', marginTop: '2px', fontFamily: 'monospace', display: 'flex', gap: '10px' }}>
                                        <span>ID: {screenBoard.id || 'N/A'}</span>
                                        <span style={{ opacity: 0.6 }}>TYPE: {screenBoard.type.toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                {/* Subtle URL Breadcrumb */}
                                <div style={{
                                    fontSize: '0.7rem',
                                    color: '#333',
                                    backgroundColor: '#050505',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    border: '1px solid #151515',
                                    maxWidth: '400px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {screenBoard.url}
                                </div>

                                <button
                                    onClick={() => setScreenBoard(null)}
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        border: '1px solid #333',
                                        backgroundColor: '#111',
                                        color: '#888',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#cc0000';
                                        e.currentTarget.style.color = '#fff';
                                        e.currentTarget.style.borderColor = '#ff0000';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#111';
                                        e.currentTarget.style.color = '#888';
                                        e.currentTarget.style.borderColor = '#333';
                                    }}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content (Digital Display Area) */}
                        <div style={{ flex: 1, backgroundColor: '#000', position: 'relative' }}>
                            {screenBoard.type === 'video' ? (
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={(() => {
                                        const url = screenBoard.url || '';
                                        if (url.includes('youtube.com') || url.includes('youtu.be')) {
                                            const videoId = url.includes('v=')
                                                ? url.split('v=')[1]?.split('&')[0]
                                                : url.includes('youtu.be/')
                                                    ? url.split('/').pop()?.split('?')[0]
                                                    : url.split('/embed/')[1]?.split('?')[0];
                                            return `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`;
                                        }
                                        return url;
                                    })()}
                                    title="MAVi Video Player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                    style={{ border: 'none' }}
                                ></iframe>
                            ) : (
                                <iframe
                                    src={screenBoard.url}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 'none', filter: 'invert(0)' }}
                                    title="MAVi Document Viewer"
                                ></iframe>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
                    bottom: '120px',
                    right: '90px',
                    width: '420px',
                    height: '700px',
                    maxHeight: '80vh',
                    background: 'rgba(20, 20, 30, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 999,
                    animation: 'slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                    overflow: 'hidden'
                }}>
                    {/* Chat Header */}
                    <div style={{
                        padding: '20px 24px',
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid rgba(255,255,255,0.1)'
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
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMuted(prev => !prev);
                            }}
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
                                transition: 'all 0.2s ease',
                                outline: 'none'
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
            {/* Certificate Modal */}
            <CertificateModal
                isOpen={isCertificateOpen}
                onClose={() => setIsCertificateOpen(false)}
                {...certificateData}
            />
        </div>
    );
};

export default MaviClass;
