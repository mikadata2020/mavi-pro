import React, { useState, useEffect } from 'react';
import { Play, ArrowRight, CheckCircle, BarChart2, BookOpen, Layers, Users, Shield, Zap, Cloud, AlertTriangle, XCircle, Briefcase, Factory, TrendingUp, HelpCircle, ChevronDown, ChevronUp, Video, Brain, Clock } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from './LanguageSelector';

const LandingPage = ({ onLogin, onDemo }) => {
    const { t } = useLanguage();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Inline Styles
    const styles = {
        container: {
            minHeight: '100vh',
            backgroundColor: '#050505',
            color: '#fff',
            fontFamily: "'Inter', sans-serif",
            overflowX: 'hidden',
        },
        navbar: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            padding: '1.5rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 1000,
            transition: 'all 0.3s ease',
            backgroundColor: scrolled ? 'rgba(5, 5, 5, 0.8)' : 'transparent',
            backdropFilter: scrolled ? 'blur(10px)' : 'none',
            borderBottom: scrolled ? '1px solid rgba(255,255,255,0.1)' : 'none',
        },
        logo: {
            fontSize: '1.5rem',
            fontWeight: '800',
            background: 'linear-gradient(90deg, #4f46e5, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
        },
        navLinks: {
            display: 'flex',
            gap: '1.5rem',
            alignItems: 'center',
        },
        link: {
            color: '#a1a1aa',
            textDecoration: 'none',
            fontSize: '0.95rem',
            fontWeight: '500',
            transition: 'color 0.2s',
            cursor: 'pointer',
        },
        hero: {
            padding: '8rem 2rem 4rem',
            textAlign: 'center',
            backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(79, 70, 229, 0.15) 0%, rgba(5, 5, 5, 0) 70%)',
        },
        h1: {
            fontSize: '4rem',
            fontWeight: '800',
            lineHeight: '1.1',
            marginBottom: '1.5rem',
            letterSpacing: '-1px',
        },
        highlight: {
            color: '#4f46e5',
        },
        subtitle: {
            fontSize: '1.25rem',
            color: '#a1a1aa',
            maxWidth: '600px',
            margin: '0 auto 2.5rem',
            lineHeight: '1.6',
        },
        btnPrimary: {
            padding: '1rem 2rem',
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 4px 14px 0 rgba(79, 70, 229, 0.39)',
        },
        btnSecondary: {
            padding: '1rem 2rem',
            backgroundColor: 'rgba(255,255,255,0.05)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginLeft: '1rem',
            transition: 'background 0.2s',
        },
        section: {
            padding: '5rem 2rem',
            maxWidth: '1200px',
            margin: '0 auto',
        },
        sectionTitle: {
            fontSize: '2.5rem',
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: '3rem',
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
        },
        card: {
            padding: '2rem',
            backgroundColor: '#111',
            borderRadius: '16px',
            border: '1px solid #222',
            transition: 'transform 0.2s',
        },
        cardIcon: {
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            color: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
        },
        cardTitle: {
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '1rem',
        },
        cardText: {
            color: '#a1a1aa',
            lineHeight: '1.6',
        },
        pricingCard: {
            padding: '2.5rem',
            borderRadius: '16px',
            border: '1px solid #222',
            backgroundColor: '#111',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
        },
        popularBadge: {
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#4f46e5',
            color: 'white',
            padding: '0.25rem 1rem',
            borderRadius: '999px',
            fontSize: '0.875rem',
            fontWeight: '600',
        },
        price: {
            fontSize: '3rem',
            fontWeight: '800',
            marginBottom: '0.5rem',
        },
        pricePeriod: {
            fontSize: '1rem',
            color: '#a1a1aa',
            fontWeight: '400',
        },
        featureList: {
            margin: '2rem 0',
            listStyle: 'none',
            padding: 0,
        },
        featureItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1rem',
            color: '#e4e4e7',
            fontSize: '0.95rem',
        },
        footer: {
            padding: '4rem 2rem',
            borderTop: '1px solid #222',
            textAlign: 'center',
            color: '#71717a',
        },
    };

    return (
        <div style={styles.container}>
            {/* Navbar */}
            <nav style={styles.navbar}>
                <div style={styles.logo}>
                    <Zap size={24} /> Mavi
                </div>
                <div style={styles.navLinks}>
                    <a href="#features" style={styles.link}>{t('landing.nav.features')}</a>
                    <a href="#solutions" style={styles.link}>{t('landing.nav.solutions')}</a>
                    <a href="/class" style={styles.link}>MAVi Class</a>
                    <button onClick={onLogin} style={{ ...styles.btnSecondary, padding: '0.5rem 1.5rem', marginLeft: 0 }}>
                        {t('landing.nav.login')}
                    </button>
                    <button onClick={onDemo} style={{ ...styles.btnPrimary, padding: '0.5rem 1.5rem' }}>
                        {t('landing.nav.startDemo')}
                    </button>
                    <LanguageSelector />
                </div>
            </nav>

            {/* Hero */}
            <header style={styles.hero}>
                <style>
                    {`
                    @keyframes scan {
                        0% { top: 0%; opacity: 0; }
                        50% { opacity: 1; }
                        100% { top: 100%; opacity: 0; }
                    }
                    @keyframes pulse-ring {
                        0% { transform: scale(0.8); opacity: 0.5; }
                        100% { transform: scale(1.3); opacity: 0; }
                    }
                    @keyframes float {
                        0% { transform: translateY(0px) rotateX(5deg); }
                        50% { transform: translateY(-10px) rotateX(5deg); }
                        100% { transform: translateY(0px) rotateX(5deg); }
                    }
                    @keyframes chart-grow {
                        0% { height: 10%; }
                        100% { height: var(--target-height); }
                    }
                    .hero-dashboard {
                        animation: float 6s ease-in-out infinite;
                    }
                    .scan-line {
                        position: absolute;
                        left: 0;
                        width: 100%;
                        height: 2px;
                        background: rgba(79, 70, 229, 0.8);
                        box-shadow: 0 0 10px rgba(79, 70, 229, 0.8);
                        animation: scan 3s linear infinite;
                    }
                    .pulse-dot::before {
                        content: '';
                        position: absolute;
                        top: -4px;
                        left: -4px;
                        right: -4px;
                        bottom: -4px;
                        border: 1px solid #4f46e5;
                        border-radius: 50%;
                        animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
                    }
                    `}
                </style>

                {/* Animated Background Grid */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
                    backgroundSize: '50px 50px',
                    maskImage: 'radial-gradient(circle at center, black 40%, transparent 80%)',
                    zIndex: -1,
                    pointerEvents: 'none'
                }}></div>

                <div style={{ display: 'inline-block', padding: '0.5rem 1rem', borderRadius: '999px', backgroundColor: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', fontWeight: '600', fontSize: '0.875rem', marginBottom: '1.5rem', border: '1px solid rgba(79, 70, 229, 0.2)' }}>
                    ✨ {t('landing.hero.newBadge')}
                </div>
                <h1 style={styles.h1}>
                    {t('landing.hero.title')} <br />
                    <span style={{
                        background: 'linear-gradient(90deg, #4f46e5, #06b6d4, #4f46e5)',
                        backgroundSize: '200% auto',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        animation: 'gradient 3s linear infinite'
                    }}>{t('landing.hero.highlight')}</span>
                </h1>
                <p style={styles.subtitle}>
                    {t('landing.hero.subtitle')}
                </p>
                <div style={{ marginBottom: '4rem' }}>
                    <button onClick={onDemo} style={styles.btnPrimary}>
                        {t('landing.hero.ctaPrimary')} <ArrowRight size={18} />
                    </button>
                    <button onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} style={styles.btnSecondary}>
                        {t('landing.hero.ctaSecondary')}
                    </button>
                </div>

                <div style={{ perspective: '1000px' }}>
                    <div className="hero-dashboard" style={{
                        background: 'rgba(20, 20, 20, 0.8)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '16px',
                        padding: '1rem',
                        maxWidth: '1000px',
                        margin: '0 auto',
                        boxShadow: '0 40px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
                        transform: 'rotateX(5deg)'
                    }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', paddingLeft: '0.5rem' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56', opacity: 0.8 }}></div>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e', opacity: 0.8 }}></div>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f', opacity: 0.8 }}></div>
                        </div>

                        <div style={{ height: '500px', background: '#0a0a0a', borderRadius: '12px', display: 'flex', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                            {/* Sidebar */}
                            <div style={{ width: '70px', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: '20px', backgroundColor: '#0f0f0f' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><Zap size={20} /></div>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}><Layers size={20} /></div>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}><BarChart2 size={20} /></div>
                            </div>

                            {/* Main Area */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                {/* Top Bar */}
                                <div style={{ height: '60px', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', padding: '0 2rem', justifyContent: 'space-between', backgroundColor: '#0f0f0f' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#fff' }}>Assembly Line 4 - Station B</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '999px' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'block' }} className="pulse-dot"></span>
                                            Live Analysis
                                        </div>
                                    </div>
                                </div>

                                {/* Content Grid */}
                                <div style={{ flex: 1, padding: '1.5rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', height: '100%', overflow: 'hidden' }}>

                                    {/* Video Feed */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ flex: 1, backgroundColor: '#151515', borderRadius: '12px', border: '1px solid #333', position: 'relative', overflow: 'hidden' }}>
                                            {/* Grid Overlay */}
                                            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

                                            <div style={{ position: 'absolute', top: '20px', left: '20px', padding: '6px 12px', backgroundColor: 'rgba(255,0,0,0.2)', color: '#ff4444', fontSize: '0.75rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(4px)' }}>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ff4444' }}></span> REC 00:04:12
                                            </div>

                                            {/* AI Bounding Box */}
                                            <div style={{ position: 'absolute', top: '25%', left: '35%', width: '180px', height: '240px', border: '2px solid rgba(79, 70, 229, 0.8)', borderRadius: '8px', boxShadow: '0 0 20px rgba(79, 70, 229, 0.2)' }}>
                                                <div style={{ position: 'absolute', top: '-28px', left: '-2px', backgroundColor: '#4f46e5', color: 'white', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px 4px 4px 0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Brain size={12} /> Worker 01 (99%)
                                                </div>
                                                <div style={{ position: 'absolute', bottom: '-28px', left: '-2px', backgroundColor: 'rgba(0,0,0,0.8)', color: '#10b981', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '0 4px 4px 4px', border: '1px solid #333' }}>
                                                    Action: Assembly (Correct)
                                                </div>
                                                {/* Scanning Line */}
                                                <div className="scan-line"></div>
                                            </div>

                                            {/* Skeleton Nodes */}
                                            <div style={{ position: 'absolute', top: '35%', left: '50%', width: '8px', height: '8px', backgroundColor: '#fff', borderRadius: '50%', boxShadow: '0 0 10px #4f46e5' }}></div>
                                            <div style={{ position: 'absolute', top: '30%', left: '42%', width: '8px', height: '8px', backgroundColor: '#fff', borderRadius: '50%', boxShadow: '0 0 10px #4f46e5' }}></div>
                                            <div style={{ position: 'absolute', top: '30%', left: '58%', width: '8px', height: '8px', backgroundColor: '#fff', borderRadius: '50%', boxShadow: '0 0 10px #4f46e5' }}></div>
                                        </div>
                                    </div>

                                    {/* Analytics Panel */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <div style={{ padding: '1.5rem', backgroundColor: '#151515', borderRadius: '12px', border: '1px solid #333' }}>
                                            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                                Cycle Time <span style={{ color: '#aaa' }}>Target: 14s</span>
                                            </div>
                                            <div style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', letterSpacing: '-1px' }}>12.4s</div>
                                            <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <TrendingUp size={14} /> 12% faster than avg
                                            </div>
                                        </div>

                                        <div style={{ flex: 1, backgroundColor: '#151515', borderRadius: '12px', border: '1px solid #333', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>Efficiency Trend</div>
                                            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '8px', justifyContent: 'space-between' }}>
                                                {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
                                                    <div key={i} style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        display: 'flex',
                                                        alignItems: 'flex-end'
                                                    }}>
                                                        <div style={{
                                                            width: '100%',
                                                            height: `${h}%`,
                                                            backgroundColor: i === 5 ? '#4f46e5' : 'rgba(79, 70, 229, 0.2)',
                                                            borderRadius: '4px',
                                                            transition: 'height 1s ease',
                                                            '--target-height': `${h}%`,
                                                            animation: `chart-grow 1s ease-out forwards ${i * 0.1}s`
                                                        }}></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Solutions / Problem vs Solution */}
            <section id="solutions" style={{ ...styles.section, backgroundColor: '#0a0a0a' }}>
                <h2 style={styles.sectionTitle}>{t('landing.solutions.title')}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '4rem', alignItems: 'center' }}>

                    {/* The Old Way */}
                    <div style={{ opacity: 0.7 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                                <AlertTriangle size={24} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{t('landing.solutions.oldWay')}</h3>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            <li style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                                <XCircle size={20} color="#ef4444" style={{ marginTop: '4px', flexShrink: 0 }} />
                                <div>
                                    <strong style={{ color: '#fff', display: 'block', marginBottom: '0.25rem' }}>{t('landing.solutions.old.stopwatch.title')}</strong>
                                    <span style={{ color: '#a1a1aa' }}>{t('landing.solutions.old.stopwatch.desc')}</span>
                                </div>
                            </li>
                            <li style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                                <XCircle size={20} color="#ef4444" style={{ marginTop: '4px', flexShrink: 0 }} />
                                <div>
                                    <strong style={{ color: '#fff', display: 'block', marginBottom: '0.25rem' }}>{t('landing.solutions.old.paper.title')}</strong>
                                    <span style={{ color: '#a1a1aa' }}>{t('landing.solutions.old.paper.desc')}</span>
                                </div>
                            </li>
                            <li style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                                <XCircle size={20} color="#ef4444" style={{ marginTop: '4px', flexShrink: 0 }} />
                                <div>
                                    <strong style={{ color: '#fff', display: 'block', marginBottom: '0.25rem' }}>Analisis Subjektif</strong>
                                    <span style={{ color: '#a1a1aa' }}>Engineer yang berbeda menghasilkan hasil yang berbeda untuk tugas yang sama.</span>
                                </div>
                            </li>
                            <li style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                                <XCircle size={20} color="#ef4444" style={{ marginTop: '4px', flexShrink: 0 }} />
                                <div>
                                    <strong style={{ color: '#fff', display: 'block', marginBottom: '0.25rem' }}>Audit Manual</strong>
                                    <span style={{ color: '#a1a1aa' }}>Pemeriksaan kepatuhan SOP dilakukan acak dan jarang, risiko lolos tinggi.</span>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* The Mavi Way */}
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', inset: '-20px', background: 'radial-gradient(circle, rgba(79, 70, 229, 0.15) 0%, transparent 70%)', zIndex: 0 }}></div>
                        <div style={{ position: 'relative', zIndex: 1, backgroundColor: '#111', padding: '2.5rem', borderRadius: '24px', border: '1px solid rgba(79, 70, 229, 0.3)', boxShadow: '0 20px 50px -10px rgba(79, 70, 229, 0.15)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                    <Zap size={24} />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{t('landing.solutions.maviWay')}</h3>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                <li style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                                    <CheckCircle size={20} color="#10b981" style={{ marginTop: '4px', flexShrink: 0 }} />
                                    <div>
                                        <strong style={{ color: '#fff', display: 'block', marginBottom: '0.25rem' }}>{t('landing.solutions.mavi.video.title')}</strong>
                                        <span style={{ color: '#a1a1aa' }}>{t('landing.solutions.mavi.video.desc')}</span>
                                    </div>
                                </li>
                                <li style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                                    <CheckCircle size={20} color="#10b981" style={{ marginTop: '4px', flexShrink: 0 }} />
                                    <div>
                                        <strong style={{ color: '#fff', display: 'block', marginBottom: '0.25rem' }}>{t('landing.solutions.mavi.digital.title')}</strong>
                                        <span style={{ color: '#a1a1aa' }}>{t('landing.solutions.mavi.digital.desc')}</span>
                                    </div>
                                </li>
                                <li style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                                    <CheckCircle size={20} color="#10b981" style={{ marginTop: '4px', flexShrink: 0 }} />
                                    <div>
                                        <strong style={{ color: '#fff', display: 'block', marginBottom: '0.25rem' }}>Terstandarisasi & Akurat</strong>
                                        <span style={{ color: '#a1a1aa' }}>Analisis konsisten setiap saat, menghilangkan kesalahan dan bias manusia.</span>
                                    </div>
                                </li>
                                <li style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                                    <CheckCircle size={20} color="#10b981" style={{ marginTop: '4px', flexShrink: 0 }} />
                                    <div>
                                        <strong style={{ color: '#fff', display: 'block', marginBottom: '0.25rem' }}>Real-time Compliance</strong>
                                        <span style={{ color: '#a1a1aa' }}>Monitoring otomatis 24/7. Dapatkan alert instan saat terjadi pelanggaran SOP.</span>
                                    </div>
                                </li>
                            </ul>
                            <button onClick={onDemo} style={{ ...styles.btnPrimary, width: '100%', marginTop: '1rem', justifyContent: 'center' }}>
                                {t('landing.solutions.mavi.cta')}
                            </button>
                        </div>
                    </div>

                </div>
            </section>

            {/* Features Grid (Kept below for detail) */}
            <section id="features" style={styles.section}>
                <h2 style={styles.sectionTitle}>{t('landing.features.title')}</h2>
                <div style={styles.grid}>
                    <div style={styles.card}>
                        <div style={styles.cardIcon}><BookOpen size={24} /></div>
                        <h3 style={styles.cardTitle}>{t('landing.features.manual.title')}</h3>
                        <p style={styles.cardText}>{t('landing.features.manual.desc')}</p>
                    </div>
                    <div style={styles.card}>
                        <div style={styles.cardIcon}><Layers size={24} /></div>
                        <h3 style={styles.cardTitle}>{t('landing.features.workflow.title')}</h3>
                        <p style={styles.cardText}>{t('landing.features.workflow.desc')}</p>
                    </div>
                    <div style={styles.card}>
                        <div style={styles.cardIcon}><Cloud size={24} /></div>
                        <h3 style={styles.cardTitle}>{t('landing.features.cloud.title')}</h3>
                        <p style={styles.cardText}>{t('landing.features.cloud.desc')}</p>
                    </div>
                </div>
            </section>



            {/* How It Works */}
            <section style={{ ...styles.section, backgroundColor: '#0a0a0a', textAlign: 'center' }}>
                <h2 style={styles.sectionTitle}>{t('landing.how.title')}</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4rem', marginTop: '3rem' }}>

                    {/* Step 1 */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '300px' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', position: 'relative' }}>
                            <Video size={40} />
                            <div style={{ position: 'absolute', top: '-5px', right: '-5px', width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>1</div>
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>{t('landing.how.capture.title')}</h3>
                        <p style={{ color: '#a1a1aa', lineHeight: '1.6' }}>{t('landing.how.capture.desc')}</p>
                    </div>

                    {/* Arrow (Hidden on mobile) */}
                    <div style={{ display: 'flex', alignItems: 'center', color: '#333' }}>
                        <ArrowRight size={32} />
                    </div>

                    {/* Step 2 */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '300px' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', position: 'relative' }}>
                            <Brain size={40} />
                            <div style={{ position: 'absolute', top: '-5px', right: '-5px', width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>2</div>
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>{t('landing.how.analyze.title')}</h3>
                        <p style={{ color: '#a1a1aa', lineHeight: '1.6' }}>{t('landing.how.analyze.desc')}</p>
                    </div>

                    {/* Arrow */}
                    <div style={{ display: 'flex', alignItems: 'center', color: '#333' }}>
                        <ArrowRight size={32} />
                    </div>

                    {/* Step 3 */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '300px' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', position: 'relative' }}>
                            <TrendingUp size={40} />
                            <div style={{ position: 'absolute', top: '-5px', right: '-5px', width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>3</div>
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>{t('landing.how.improve.title')}</h3>
                        <p style={{ color: '#a1a1aa', lineHeight: '1.6' }}>{t('landing.how.improve.desc')}</p>
                    </div>

                    {/* Arrow */}
                    <div style={{ display: 'flex', alignItems: 'center', color: '#333' }}>
                        <ArrowRight size={32} />
                    </div>

                    {/* Step 4 - Real-time Compliance */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '300px' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', position: 'relative' }}>
                            <Shield size={40} />
                            <div style={{ position: 'absolute', top: '-5px', right: '-5px', width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>4</div>
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Monitor Compliance</h3>
                        <p style={{ color: '#a1a1aa', lineHeight: '1.6' }}>Real-time monitoring ensures workers follow standard procedures. Get instant alerts when deviations occur, maintaining quality and safety standards.</p>
                    </div>

                </div>
            </section>

            {/* Industry Solutions (Use Cases) */}
            <section style={{ ...styles.section, backgroundColor: '#111' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <div style={{ display: 'inline-block', padding: '0.5rem 1rem', borderRadius: '999px', backgroundColor: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', fontWeight: '600', fontSize: '0.875rem', marginBottom: '1rem' }}>
                        INDUSTRIES
                    </div>
                    <h2 style={styles.sectionTitle}>Solutions by Industry</h2>
                    <p style={{ color: '#a1a1aa', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem' }}>
                        Tailored solutions to meet the unique challenges of your sector.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                    {/* Automotive */}
                    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '24px', height: '400px', border: '1px solid #333' }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.9) 100%)', zIndex: 2 }}></div>
                        <img src="/assets/automotive-bg.jpg" alt="Automotive" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
                            onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.background = '#1a1a1a' }} />

                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2rem', zIndex: 3 }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: 'white' }}>
                                <Factory size={24} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'white' }}>Automotive</h3>
                            <p style={{ color: '#d1d5db', marginBottom: '1.5rem' }}>Optimize assembly lines and reduce cycle time variability with precision motion analysis.</p>
                            <ul style={{ listStyle: 'none', padding: 0, color: '#9ca3af', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} color="#ef4444" /> Line Balancing</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} color="#ef4444" /> Standardized Work</li>
                            </ul>
                        </div>
                    </div>

                    {/* Electronics */}
                    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '24px', height: '400px', border: '1px solid #333' }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.9) 100%)', zIndex: 2 }}></div>
                        <img src="/assets/electronics-bg.jpg" alt="Electronics" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
                            onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.background = '#1a1a1a' }} />

                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2rem', zIndex: 3 }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: 'white' }}>
                                <Zap size={24} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'white' }}>Electronics</h3>
                            <p style={{ color: '#d1d5db', marginBottom: '1.5rem' }}>Ensure 100% compliance in high-precision manual assembly tasks.</p>
                            <ul style={{ listStyle: 'none', padding: 0, color: '#9ca3af', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} color="#3b82f6" /> Micro-motion Analysis</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} color="#3b82f6" /> Defect Reduction</li>
                            </ul>
                        </div>
                    </div>

                    {/* Logistics */}
                    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '24px', height: '400px', border: '1px solid #333' }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.9) 100%)', zIndex: 2 }}></div>
                        <img src="/assets/logistics-bg.jpg" alt="Logistics" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
                            onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.background = '#1a1a1a' }} />

                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2rem', zIndex: 3 }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', color: 'white' }}>
                                <Briefcase size={24} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'white' }}>Logistics</h3>
                            <p style={{ color: '#d1d5db', marginBottom: '1.5rem' }}>Improve ergonomics and efficiency in picking and packing operations.</p>
                            <ul style={{ listStyle: 'none', padding: 0, color: '#9ca3af', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} color="#f59e0b" /> Ergonomic Scores</li>
                                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={16} color="#f59e0b" /> Process Optimization</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* MAVi Class Section - Redesigned */}
            <section style={{ ...styles.section, backgroundColor: '#050505', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '20%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(79, 70, 229, 0.08) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)' }}></div>
                <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)' }}></div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h2 style={styles.sectionTitle}>🎓 MAVi Class - Master Modern IE</h2>
                    <p style={{ textAlign: 'center', color: '#a1a1aa', fontSize: '1.1rem', marginBottom: '4rem', maxWidth: '700px', margin: '0 auto' }}>
                        Comprehensive learning path from basics to advanced AI-enabled Industrial Engineering.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
                        {/* Module 1 */}
                        <div style={{
                            padding: '2rem',
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                        }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.borderColor = 'rgba(76, 175, 80, 0.5)';
                                e.currentTarget.style.background = 'rgba(76, 175, 80, 0.05)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                            }}
                            onClick={onLogin}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🚀</div>
                                <div style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: '#888' }}>Tier 1</div>
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Getting Started</h3>
                            <p style={{ color: '#a1a1aa', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', minHeight: '3rem' }}>Kenalan dengan MAVi dan fitur-fitur dasarnya dalam 15 menit.</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: '#666', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                                <Clock size={14} /> 15 mins
                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#444' }}></span>
                                4 lessons
                            </div>
                        </div>

                        {/* Module 2 */}
                        <div style={{
                            padding: '2rem',
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                        }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.borderColor = 'rgba(33, 150, 243, 0.5)';
                                e.currentTarget.style.background = 'rgba(33, 150, 243, 0.05)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                            }}
                            onClick={onLogin}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(33, 150, 243, 0.1)', color: '#2196F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>⏱️</div>
                                <div style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: '#888' }}>Tier 2</div>
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Time & Motion</h3>
                            <p style={{ color: '#a1a1aa', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', minHeight: '3rem' }}>Belajar mengukur waktu dan breakdown elemen kerja secara presisi.</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: '#666', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                                <Clock size={14} /> 30 mins
                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#444' }}></span>
                                5 lessons
                            </div>
                        </div>

                        {/* Module 3 */}
                        <div style={{
                            padding: '2rem',
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                        }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.borderColor = 'rgba(255, 152, 0, 0.5)';
                                e.currentTarget.style.background = 'rgba(255, 152, 0, 0.05)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                            }}
                            onClick={onLogin}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255, 152, 0, 0.1)', color: '#FF9800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🧠</div>
                                <div style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: '#888' }}>Tier 3</div>
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>AI Features</h3>
                            <p style={{ color: '#a1a1aa', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', minHeight: '3rem' }}>Manfaatkan kekuatan AI untuk analisis otomatis dan deteksi.</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: '#666', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                                <Clock size={14} /> 25 mins
                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#444' }}></span>
                                4 lessons
                            </div>
                        </div>
                        {/* Module 4 */}
                        <div style={{
                            padding: '2rem',
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                        }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.borderColor = 'rgba(156, 39, 176, 0.5)';
                                e.currentTarget.style.background = 'rgba(156, 39, 176, 0.05)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                            }}
                            onClick={onLogin}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(156, 39, 176, 0.1)', color: '#9C27B0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📊</div>
                                <div style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: '#888' }}>Tier 4</div>
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>TPS Tools</h3>
                            <p style={{ color: '#a1a1aa', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', minHeight: '3rem' }}>Alat-alat Toyota Production System untuk improvement berkelanjutan.</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: '#666', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                                <Clock size={14} /> 40 mins
                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#444' }}></span>
                                5 lessons
                            </div>
                        </div>

                        {/* Module 5 */}
                        <div style={{
                            padding: '2rem',
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                        }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.5)';
                                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                            }}
                            onClick={onLogin}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(102, 126, 234, 0.1)', color: '#667eea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🎬</div>
                                <div style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: '#888' }}>Tier 5</div>
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Studio Model</h3>
                            <p style={{ color: '#a1a1aa', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', minHeight: '3rem' }}>Buat model AI kustom untuk monitor compliance secara real-time.</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: '#666', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                                <Clock size={14} /> 35 mins
                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#444' }}></span>
                                5 lessons
                            </div>
                        </div>

                        {/* Module 6 */}
                        <div style={{
                            padding: '2rem',
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                        }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)';
                                e.currentTarget.style.background = 'rgba(255, 215, 0, 0.05)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                            }}
                            onClick={onLogin}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255, 215, 0, 0.1)', color: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📂</div>
                                <div style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: '#888' }}>Tier 6</div>
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Study Cases</h3>
                            <p style={{ color: '#a1a1aa', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem', minHeight: '3rem' }}>Implementasi nyata MAVi di berbagai industri terkemuka.</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: '#666', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                                <Clock size={14} /> 45 mins
                                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#444' }}></span>
                                4 lessons
                            </div>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                        <button
                            onClick={onLogin}
                            style={{
                                ...styles.btnPrimary,
                                padding: '1rem 2.5rem',
                                fontSize: '1.1rem',
                                background: 'linear-gradient(90deg, #4f46e5, #06b6d4)',
                                border: 'none'
                            }}>
                            <BookOpen size={20} /> Start Learning Now
                        </button>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section style={{ ...styles.section, maxWidth: '800px' }}>
                <h2 style={styles.sectionTitle}>{t('landing.faq.title')}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ padding: '1.5rem', backgroundColor: '#111', borderRadius: '12px', border: '1px solid #222' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <HelpCircle size={18} color="#4f46e5" /> {t('landing.faq.q1.q')}
                        </h4>
                        <p style={{ color: '#a1a1aa', lineHeight: '1.6', margin: 0 }}>
                            {t('landing.faq.q1.a')}
                        </p>
                    </div>
                    <div style={{ padding: '1.5rem', backgroundColor: '#111', borderRadius: '12px', border: '1px solid #222' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <HelpCircle size={18} color="#4f46e5" /> {t('landing.faq.q2.q')}
                        </h4>
                        <p style={{ color: '#a1a1aa', lineHeight: '1.6', margin: 0 }}>
                            {t('landing.faq.q2.a')}
                        </p>
                    </div>
                    <div style={{ padding: '1.5rem', backgroundColor: '#111', borderRadius: '12px', border: '1px solid #222' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <HelpCircle size={18} color="#4f46e5" /> {t('landing.faq.q3.q')}
                        </h4>
                        <p style={{ color: '#a1a1aa', lineHeight: '1.6', margin: 0 }}>
                            {t('landing.faq.q3.a')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section style={{ padding: '6rem 2rem', textAlign: 'center', background: 'linear-gradient(180deg, #050505 0%, rgba(79, 70, 229, 0.1) 100%)' }}>
                <h2 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1.5rem' }}>{t('landing.cta.title')}</h2>
                <p style={{ fontSize: '1.25rem', color: '#a1a1aa', maxWidth: '600px', margin: '0 auto 3rem' }}>
                    {t('landing.cta.desc')}
                </p>
                <div style={{ display: 'inline-flex', gap: '1rem', justifyContent: 'center' }}>
                    <button onClick={onDemo} style={{ ...styles.btnPrimary, padding: '1.25rem 3rem', fontSize: '1.2rem' }}>
                        {t('landing.cta.button')}
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer style={styles.footer}>
                <div style={{ marginBottom: '1rem', ...styles.logo, justifyContent: 'center' }}>
                    <Zap size={24} /> Mavi
                </div>
                <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '2rem' }}>
                    <a href="#" style={styles.link}>{t('landing.footer.product')}</a>
                    <a href="#" style={styles.link}>{t('landing.footer.company')}</a>
                    <a href="#" style={styles.link}>{t('landing.footer.resources')}</a>
                    <a href="#" style={styles.link}>{t('landing.footer.legal')}</a>
                </div>
                <div>{t('landing.footer.rights')}</div>
            </footer>
        </div>
    );
};

export default LandingPage;
