import React, { useState, useEffect } from 'react';
import { Play, ArrowRight, CheckCircle, BarChart2, BookOpen, Layers, Users, Shield, Zap, Cloud, AlertTriangle, XCircle, Briefcase, Factory, TrendingUp, HelpCircle, ChevronDown, ChevronUp, Video, Brain } from 'lucide-react';
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
                <div style={{ display: 'inline-block', padding: '0.5rem 1rem', borderRadius: '999px', backgroundColor: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', fontWeight: '600', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    {t('landing.hero.newBadge')}
                </div>
                <h1 style={styles.h1}>
                    {t('landing.hero.title')} <br />
                    <span style={styles.highlight}>{t('landing.hero.highlight')}</span>
                </h1>
                <p style={styles.subtitle}>
                    {t('landing.hero.subtitle')}
                </p>
                <div>
                    <button onClick={onDemo} style={styles.btnPrimary}>
                        {t('landing.hero.ctaPrimary')} <ArrowRight size={18} />
                    </button>
                    <button onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} style={styles.btnSecondary}>
                        {t('landing.hero.ctaSecondary')}
                    </button>
                </div>
                <div style={{ marginTop: '4rem', perspective: '1000px' }}>
                    <div style={{
                        background: 'linear-gradient(180deg, rgba(30,30,30,0.8) 0%, rgba(0,0,0,0.8) 100%)',
                        border: '1px solid #333',
                        borderRadius: '12px',
                        padding: '1rem',
                        maxWidth: '900px',
                        margin: '0 auto',
                        boxShadow: '0 20px 50px -10px rgba(0,0,0,0.5)',
                        transform: 'rotateX(5deg)'
                    }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }}></div>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }}></div>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }}></div>
                        </div>
                        <div style={{ height: '400px', background: '#111', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>
                            {/* Simulated Dashboard UI */}
                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0f0f0f', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                                {/* App Header */}
                                <div style={{ height: '50px', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', gap: '20px', color: '#666', fontSize: '0.8rem' }}>
                                        <div style={{ color: '#fff', fontWeight: 'bold' }}>Dashboard</div>
                                        <div>Analysis</div>
                                        <div>Reports</div>
                                    </div>
                                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#333' }}></div>
                                </div>
                                {/* App Body */}
                                <div style={{ flex: 1, display: 'flex' }}>
                                    {/* Sidebar */}
                                    <div style={{ width: '60px', borderRight: '1px solid #333', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: '20px' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: '#333' }}></div>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: '#333' }}></div>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: '#333' }}></div>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: '#333' }}></div>
                                    </div>
                                    {/* Main Content */}
                                    <div style={{ flex: 1, padding: '20px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                                        {/* Video Analysis Panel */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <div style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #333', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <div style={{ position: 'absolute', top: '10px', left: '10px', padding: '4px 8px', backgroundColor: 'rgba(255,0,0,0.2)', color: '#ff4444', fontSize: '0.7rem', borderRadius: '4px' }}>REC</div>
                                                <Play size={48} color="#444" fill="#444" />
                                                {/* Simulated Bounding Boxes */}
                                                <div style={{ position: 'absolute', top: '30%', left: '40%', width: '100px', height: '120px', border: '2px solid #4f46e5', borderRadius: '4px' }}>
                                                    <div style={{ position: 'absolute', top: '-20px', left: '0', backgroundColor: '#4f46e5', color: 'white', fontSize: '0.6rem', padding: '2px 4px', borderRadius: '2px' }}>Worker 1 (98%)</div>
                                                </div>
                                            </div>
                                            {/* Timeline */}
                                            <div style={{ height: '40px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #333', display: 'flex', alignItems: 'center', padding: '0 10px', gap: '5px' }}>
                                                <div style={{ flex: 1, height: '4px', backgroundColor: '#333', borderRadius: '2px', overflow: 'hidden' }}>
                                                    <div style={{ width: '60%', height: '100%', backgroundColor: '#4f46e5' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Metrics Panel */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <div style={{ padding: '15px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
                                                <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '5px' }}>Cycle Time</div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>12.4s</div>
                                                <div style={{ fontSize: '0.7rem', color: '#10b981' }}>↓ 12% vs Standard</div>
                                            </div>
                                            <div style={{ padding: '15px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
                                                <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '5px' }}>Efficiency</div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>94%</div>
                                                <div style={{ fontSize: '0.7rem', color: '#10b981' }}>↑ 4% Improved</div>
                                            </div>
                                            <div style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #333', position: 'relative', overflow: 'hidden' }}>
                                                {/* Fake Chart */}
                                                <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', padding: '10px', gap: '5px', justifyContent: 'space-between' }}>
                                                    {[40, 60, 45, 70, 50, 80, 65].map((h, i) => (
                                                        <div key={i} style={{ width: '100%', height: `${h}%`, backgroundColor: 'rgba(79, 70, 229, 0.4)', borderRadius: '2px' }}></div>
                                                    ))}
                                                </div>
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
                                    <strong style={{ color: '#fff', display: 'block', marginBottom: '0.25rem' }}>{t('landing.solutions.old.subjective.title')}</strong>
                                    <span style={{ color: '#a1a1aa' }}>{t('landing.solutions.old.subjective.desc')}</span>
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
                                        <strong style={{ color: '#fff', display: 'block', marginBottom: '0.25rem' }}>{t('landing.solutions.mavi.standardized.title')}</strong>
                                        <span style={{ color: '#a1a1aa' }}>{t('landing.solutions.mavi.standardized.desc')}</span>
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

                </div>
            </section>

            {/* Target Audience / Use Cases */}
            <section style={styles.section}>
                <h2 style={styles.sectionTitle}>{t('landing.audience.title')}</h2>
                <div style={styles.grid}>
                    <div style={styles.card}>
                        <div style={{ ...styles.cardIcon, color: '#fda4af', backgroundColor: 'rgba(253, 164, 175, 0.1)' }}><Briefcase size={24} /></div>
                        <h3 style={styles.cardTitle}>{t('landing.audience.ie.title')}</h3>
                        <p style={styles.cardText}>{t('landing.audience.ie.desc')}</p>
                    </div>
                    <div style={styles.card}>
                        <div style={{ ...styles.cardIcon, color: '#93c5fd', backgroundColor: 'rgba(147, 197, 253, 0.1)' }}><Factory size={24} /></div>
                        <h3 style={styles.cardTitle}>{t('landing.audience.pm.title')}</h3>
                        <p style={styles.cardText}>{t('landing.audience.pm.desc')}</p>
                    </div>
                    <div style={styles.card}>
                        <div style={{ ...styles.cardIcon, color: '#fcd34d', backgroundColor: 'rgba(252, 211, 77, 0.1)' }}><TrendingUp size={24} /></div>
                        <h3 style={styles.cardTitle}>{t('landing.audience.lc.title')}</h3>
                        <p style={styles.cardText}>{t('landing.audience.lc.desc')}</p>
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
