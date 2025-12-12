import React, { useState, useEffect } from 'react';
import { Play, ArrowRight, CheckCircle, BarChart2, BookOpen, Layers, Users, Shield, Zap, Cloud, AlertTriangle, XCircle, Briefcase, Factory, TrendingUp, HelpCircle, ChevronDown, ChevronUp, Video, Brain } from 'lucide-react';

const LandingPage = ({ onLogin, onDemo }) => {
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
            gap: '2rem',
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
                    <a href="#features" style={styles.link}>Features</a>
                    <a href="#solutions" style={styles.link}>Solutions</a>
                    <a href="#pricing" style={styles.link}>Pricing</a>
                    <button onClick={onLogin} style={{ ...styles.btnSecondary, padding: '0.5rem 1.5rem', marginLeft: 0 }}>
                        Log In
                    </button>
                    <button onClick={onDemo} style={{ ...styles.btnPrimary, padding: '0.5rem 1.5rem' }}>
                        Start Demo
                    </button>
                </div>
            </nav>

            {/* Hero */}
            <header style={styles.hero}>
                <div style={{ display: 'inline-block', padding: '0.5rem 1rem', borderRadius: '999px', backgroundColor: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', fontWeight: '600', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    ✨ New: AI Manual Generation
                </div>
                <h1 style={styles.h1}>
                    Optimize Motion with <br />
                    <span style={styles.highlight}>Intelligent Analysis</span>
                </h1>
                <p style={styles.subtitle}>
                    Mavi uses advanced computer vision to analyze workflows, calculating standard times
                    and identifying waste automatically. Increase productivity by up to 40%.
                </p>
                <div>
                    <button onClick={onDemo} style={styles.btnPrimary}>
                        Start Free Demo <ArrowRight size={18} />
                    </button>
                    <button onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} style={styles.btnSecondary}>
                        Learn More
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
                <h2 style={styles.sectionTitle}>Why choose Mavi?</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '4rem', alignItems: 'center' }}>

                    {/* The Old Way */}
                    <div style={{ opacity: 0.7 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                                <AlertTriangle size={24} />
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>The Old Way</h3>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            <li style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                                <XCircle size={20} color="#ef4444" style={{ marginTop: '4px', flexShrink: 0 }} />
                                <div>
                                    <strong style={{ color: '#fff', display: 'block', marginBottom: '0.25rem' }}>Manual Stopwatch</strong>
                                    <span style={{ color: '#a1a1aa' }}>Inaccurate timing dependent on human reaction speed.</span>
                                </div>
                            </li>
                            <li style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                                <XCircle size={20} color="#ef4444" style={{ marginTop: '4px', flexShrink: 0 }} />
                                <div>
                                    <strong style={{ color: '#fff', display: 'block', marginBottom: '0.25rem' }}>Paper & Clipboard</strong>
                                    <span style={{ color: '#a1a1aa' }}>Data is trapped on paper, requiring manual entry into Excel later.</span>
                                </div>
                            </li>
                            <li style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                                <XCircle size={20} color="#ef4444" style={{ marginTop: '4px', flexShrink: 0 }} />
                                <div>
                                    <strong style={{ color: '#fff', display: 'block', marginBottom: '0.25rem' }}>Subjective Analysis</strong>
                                    <span style={{ color: '#a1a1aa' }}>Different engineers produce different results for the same task.</span>
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
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>The Mavi Solution</h3>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                <li style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                                    <CheckCircle size={20} color="#10b981" style={{ marginTop: '4px', flexShrink: 0 }} />
                                    <div>
                                        <strong style={{ color: '#fff', display: 'block', marginBottom: '0.25rem' }}>AI Video Analysis</strong>
                                        <span style={{ color: '#a1a1aa' }}>Frame-perfect timing automatically extracted from video footage.</span>
                                    </div>
                                </li>
                                <li style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                                    <CheckCircle size={20} color="#10b981" style={{ marginTop: '4px', flexShrink: 0 }} />
                                    <div>
                                        <strong style={{ color: '#fff', display: 'block', marginBottom: '0.25rem' }}>Digital & Instant</strong>
                                        <span style={{ color: '#a1a1aa' }}>Data is digitizied immediately. Generate reports and manuals in one click.</span>
                                    </div>
                                </li>
                                <li style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                                    <CheckCircle size={20} color="#10b981" style={{ marginTop: '4px', flexShrink: 0 }} />
                                    <div>
                                        <strong style={{ color: '#fff', display: 'block', marginBottom: '0.25rem' }}>Standardized & Accurate</strong>
                                        <span style={{ color: '#a1a1aa' }}>Consistent analysis every time, eliminating human error and bias.</span>
                                    </div>
                                </li>
                            </ul>
                            <button onClick={onDemo} style={{ ...styles.btnPrimary, width: '100%', marginTop: '1rem', justifyContent: 'center' }}>
                                Switch to Mavi Today
                            </button>
                        </div>
                    </div>

                </div>
            </section>

            {/* Features Grid (Kept below for detail) */}
            <section id="features" style={styles.section}>
                <h2 style={styles.sectionTitle}>More powerful features</h2>
                <div style={styles.grid}>
                    <div style={styles.card}>
                        <div style={styles.cardIcon}><BookOpen size={24} /></div>
                        <h3 style={styles.cardTitle}>Manual Creator</h3>
                        <p style={styles.cardText}>Turn analysis into training manuals. Import from Excel/Word or generate from video steps.</p>
                    </div>
                    <div style={styles.card}>
                        <div style={styles.cardIcon}><Layers size={24} /></div>
                        <h3 style={styles.cardTitle}>Drag & Drop Workflow</h3>
                        <p style={styles.cardText}>Rearrange process elements visually to test new layouts without disrupting the line.</p>
                    </div>
                    <div style={styles.card}>
                        <div style={styles.cardIcon}><Cloud size={24} /></div>
                        <h3 style={styles.cardTitle}>Cloud Sync</h3>
                        <p style={styles.cardText}>Collaborate with your team in real-time. Sync projects and manuals across devices securely.</p>
                    </div>
                </div>
            </section>



            {/* How It Works */}
            <section style={{ ...styles.section, backgroundColor: '#0a0a0a', textAlign: 'center' }}>
                <h2 style={styles.sectionTitle}>How Mavi Works</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '4rem', marginTop: '3rem' }}>

                    {/* Step 1 */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '300px' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', position: 'relative' }}>
                            <Video size={40} />
                            <div style={{ position: 'absolute', top: '-5px', right: '-5px', width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>1</div>
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Capture</h3>
                        <p style={{ color: '#a1a1aa', lineHeight: '1.6' }}>Record your production line or upload an existing video file directly to the platform.</p>
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
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Analyze</h3>
                        <p style={{ color: '#a1a1aa', lineHeight: '1.6' }}>Our Computer Vision engine detects cycles, calculates times, and identifies waste automatically.</p>
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
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Improve</h3>
                        <p style={{ color: '#a1a1aa', lineHeight: '1.6' }}>Use data-backed insights to rebalance lines, eliminate bottlenecks, and boost productivity.</p>
                    </div>

                </div>
            </section>

            {/* Target Audience / Use Cases */}
            <section style={styles.section}>
                <h2 style={styles.sectionTitle}>Built for professionals</h2>
                <div style={styles.grid}>
                    <div style={styles.card}>
                        <div style={{ ...styles.cardIcon, color: '#fda4af', backgroundColor: 'rgba(253, 164, 175, 0.1)' }}><Briefcase size={24} /></div>
                        <h3 style={styles.cardTitle}>Industrial Engineers</h3>
                        <p style={styles.cardText}>Stop spending hours on manual data entry. Capture cycles automatically and generate standard work charts in minutes.</p>
                    </div>
                    <div style={styles.card}>
                        <div style={{ ...styles.cardIcon, color: '#93c5fd', backgroundColor: 'rgba(147, 197, 253, 0.1)' }}><Factory size={24} /></div>
                        <h3 style={styles.cardTitle}>Plant Managers</h3>
                        <p style={styles.cardText}>Gain full visibility into your production lines. Identify bottlenecks instantly and track efficiency improvements over time.</p>
                    </div>
                    <div style={styles.card}>
                        <div style={{ ...styles.cardIcon, color: '#fcd34d', backgroundColor: 'rgba(252, 211, 77, 0.1)' }}><TrendingUp size={24} /></div>
                        <h3 style={styles.cardTitle}>Lean Consultants</h3>
                        <p style={styles.cardText}>Deliver value to your clients faster. Use Mavi to provide data-backed recommendations and impressive "Before/After" visual proof.</p>
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" style={styles.section}>
                <h2 style={styles.sectionTitle}>Simple, transparent pricing</h2>
                <div style={styles.grid}>
                    {/* Starter */}
                    <div style={styles.pricingCard}>
                        <h3 style={styles.cardTitle}>Starter</h3>
                        <div style={styles.price}>$0<span style={styles.pricePeriod}>/mo</span></div>
                        <p style={styles.cardText}>Perfect for trying out Mavi.</p>
                        <button onClick={onDemo} style={{ ...styles.btnSecondary, width: '100%', margin: '2rem 0' }}>Start Free</button>
                        <ul style={styles.featureList}>
                            <li style={styles.featureItem}><CheckCircle size={16} color="#4f46e5" /> Basic Video Analysis</li>
                            <li style={styles.featureItem}><CheckCircle size={16} color="#4f46e5" /> 1 User</li>
                            <li style={styles.featureItem}><CheckCircle size={16} color="#4f46e5" /> Local Storage Only</li>
                        </ul>
                    </div>
                    {/* Pro */}
                    <div style={{ ...styles.pricingCard, borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.05)' }}>
                        <div style={styles.popularBadge}>Most Popular</div>
                        <h3 style={styles.cardTitle}>Pro</h3>
                        <div style={styles.price}>$49<span style={styles.pricePeriod}>/mo</span></div>
                        <p style={styles.cardText}>For professional engineers.</p>
                        <button onClick={onLogin} style={{ ...styles.btnPrimary, width: '100%', margin: '2rem 0' }}>Get Started</button>
                        <ul style={styles.featureList}>
                            <li style={styles.featureItem}><CheckCircle size={16} color="#4f46e5" /> Advanced AI Analysis</li>
                            <li style={styles.featureItem}><CheckCircle size={16} color="#4f46e5" /> Unlimited Projects</li>
                            <li style={styles.featureItem}><CheckCircle size={16} color="#4f46e5" /> Cloud Sync & Backup</li>
                            <li style={styles.featureItem}><CheckCircle size={16} color="#4f46e5" /> Manual Creator (Excel/Word)</li>
                        </ul>
                    </div>
                    {/* Enterprise */}
                    <div style={styles.pricingCard}>
                        <h3 style={styles.cardTitle}>Enterprise</h3>
                        <div style={styles.price}>Custom</div>
                        <p style={styles.cardText}>For large organizations.</p>
                        <button style={{ ...styles.btnSecondary, width: '100%', margin: '2rem 0' }}>Contact Sales</button>
                        <ul style={styles.featureList}>
                            <li style={styles.featureItem}><CheckCircle size={16} color="#4f46e5" /> Custom AI Models</li>
                            <li style={styles.featureItem}><CheckCircle size={16} color="#4f46e5" /> On-Premise Deployment</li>
                            <li style={styles.featureItem}><CheckCircle size={16} color="#4f46e5" /> Dedicated Support</li>
                            <li style={styles.featureItem}><CheckCircle size={16} color="#4f46e5" /> SSO Integration</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section style={{ ...styles.section, maxWidth: '800px' }}>
                <h2 style={styles.sectionTitle}>Frequently Asked Questions</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ padding: '1.5rem', backgroundColor: '#111', borderRadius: '12px', border: '1px solid #222' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <HelpCircle size={18} color="#4f46e5" /> Is my video data secure?
                        </h4>
                        <p style={{ color: '#a1a1aa', lineHeight: '1.6', margin: 0 }}>
                            Yes. Mavi uses enterprise-grade encryption. For Pro plans, data is stored securely in the cloud. For Starter plans, data never leaves your local device.
                        </p>
                    </div>
                    <div style={{ padding: '1.5rem', backgroundColor: '#111', borderRadius: '12px', border: '1px solid #222' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <HelpCircle size={18} color="#4f46e5" /> Can I export reports to Excel?
                        </h4>
                        <p style={{ color: '#a1a1aa', lineHeight: '1.6', margin: 0 }}>
                            Absolutely. You can export all analysis data, charts, and standard work sheets directly to Excel, PDF, or Word formats.
                        </p>
                    </div>
                    <div style={{ padding: '1.5rem', backgroundColor: '#111', borderRadius: '12px', border: '1px solid #222' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <HelpCircle size={18} color="#4f46e5" /> Do I need special hardware?
                        </h4>
                        <p style={{ color: '#a1a1aa', lineHeight: '1.6', margin: 0 }}>
                            No. Mavi works with any standard video file (MP4, WEBM) or direct webcam input. No expensive sensors required.
                        </p>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section style={{ padding: '6rem 2rem', textAlign: 'center', background: 'linear-gradient(180deg, #050505 0%, rgba(79, 70, 229, 0.1) 100%)' }}>
                <h2 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '1.5rem' }}>Ready to optimize your workflow?</h2>
                <p style={{ fontSize: '1.25rem', color: '#a1a1aa', maxWidth: '600px', margin: '0 auto 3rem' }}>
                    Join thousands of engineers who are saving time and improving efficiency with Mavi.
                </p>
                <div style={{ display: 'inline-flex', gap: '1rem', justifyContent: 'center' }}>
                    <button onClick={onDemo} style={{ ...styles.btnPrimary, padding: '1.25rem 3rem', fontSize: '1.2rem' }}>
                        Start Free Trial
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer style={styles.footer}>
                <div style={{ marginBottom: '1rem', ...styles.logo, justifyContent: 'center' }}>
                    <Zap size={24} /> Mavi
                </div>
                <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '2rem' }}>
                    <a href="#" style={styles.link}>Product</a>
                    <a href="#" style={styles.link}>Company</a>
                    <a href="#" style={styles.link}>Resources</a>
                    <a href="#" style={styles.link}>Legal</a>
                </div>
                <div>© 2025 Mavi Systems Inc. All rights reserved.</div>
            </footer>
        </div>
    );
};

export default LandingPage;
