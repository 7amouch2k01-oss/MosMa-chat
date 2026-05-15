import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Shield, Zap, Palette, Globe, Users, ArrowRight, CheckCircle } from 'lucide-react';
import './Landing.css';

const Landing = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            navigate('/feed');
        }
    }, [navigate]);

    const features = [
        {
            icon: <Zap size={24} />,
            title: "Real-time Messaging",
            desc: "Experience zero-latency communication with our advanced Socket.io integration."
        },
        {
            icon: <Palette size={24} />,
            title: "Dynamic Themes",
            desc: "Choose from 8 premium animated themes, including Aurora, Midnight, and Cyber."
        },
        {
            icon: <Shield size={24} />,
            title: "Secure & Private",
            desc: "Your conversations are protected with JWT authentication and secure data handling."
        },
        {
            icon: <Globe size={24} />,
            title: "Global Connectivity",
            desc: "Connect with friends worldwide. Discover new people and start instant DMs."
        }
    ];

    return (
        <div className="landing-container">
            {/* --- Animated Background --- */}
            <div className="landing-bg">
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div className="orb orb-3"></div>
            </div>

            {/* --- Navbar --- */}
            <nav className="landing-nav">
                <div className="nav-logo">
                    <div className="logo-icon"><img src="/mosma_logo.png" alt="MosMA Logo" style={{width: '32px', height: '32px', objectFit: 'contain'}} /></div>
                    <span>MosMA Chat</span>
                </div>
                <div className="nav-links">
                    <a href="#features">Features</a>
                    <a href="#about">About</a>
                    <Link to="/login" className="nav-login">Login</Link>
                    <Link to="/register" className="nav-cta">Get Started</Link>
                </div>
            </nav>

            {/* --- Hero Section --- */}
            <section className="hero-section">
                <div className="hero-content">
                    <div className="hero-badge">Next Generation Social App</div>
                    <h1>Connect Beyond <span>Boundaries</span></h1>
                    <p>Experience the ultimate social platform with real-time interactivity, stunning glassmorphism design, and a world of premium themes.</p>
                    <div className="hero-actions">
                        <Link to="/register" className="hero-btn-primary">
                            Get Started Now <ArrowRight size={20} />
                        </Link>
                        <Link to="/login" className="hero-btn-secondary">
                            Sign In
                        </Link>
                    </div>
                    <div className="hero-stats">
                        <div className="stat-item">
                            <strong>10k+</strong>
                            <span>Active Users</span>
                        </div>
                        <div className="stat-divider"></div>
                        <div className="stat-item">
                            <strong>24/7</strong>
                            <span>Uptime</span>
                        </div>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="visual-wrapper">
                        <img src="/mosma_banner.png" alt="MosMA Chat Illustration" className="hero-image" />
                        <div className="visual-blur"></div>
                        
                        {/* Floating elements */}
                        <div className="float-card card-1">
                            <CheckCircle size={14} color="#00ff96" />
                            <span>Message Delivered</span>
                        </div>
                        <div className="float-card card-2">
                            <div className="mini-avatar">A</div>
                            <div className="typing-dots"><span></span><span></span><span></span></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Features Grid --- */}
            <section id="features" className="features-section">
                <div className="section-header">
                    <h2>Unrivaled <span>Features</span></h2>
                    <p>Everything you need for a premium communication experience.</p>
                </div>
                <div className="features-grid">
                    {features.map((f, i) => (
                        <div key={i} className="feature-card">
                            <div className="feature-icon">{f.icon}</div>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* --- What's New --- */}
            <section className="whats-new-section">
                <div className="new-badge">Version 2.0 is here</div>
                <h2>Real-time <span>Synchronized</span></h2>
                <p>Enjoy live social feeds, message editing, and instant reactions. MosMA Chat is faster and more interactive than ever.</p>
                <div className="feature-row">
                    <div className="mini-feature">
                        <CheckCircle size={16} color="var(--accent)" />
                        <span>Live Post Updates</span>
                    </div>
                    <div className="mini-feature">
                        <CheckCircle size={16} color="var(--accent)" />
                        <span>Message Editing</span>
                    </div>
                    <div className="mini-feature">
                        <CheckCircle size={16} color="var(--accent)" />
                        <span>Admin Moderation</span>
                    </div>
                </div>
            </section>

            {/* --- Footer --- */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <div className="logo-icon"><img src="/mosma_logo.png" alt="MosMA Logo" style={{width: '24px', height: '24px', objectFit: 'contain'}} /></div>
                        <span>MosMA Chat</span>
                    </div>
                    <div className="footer-links">
                        <div className="link-group">
                            <h4>Product</h4>
                            <a href="#">Features</a>
                            <a href="#">Themes</a>
                        </div>
                        <div className="link-group">
                            <h4>Social</h4>
                            <a href="#">Twitter</a>
                            <a href="#">Discord</a>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2026 Mohamed amine Rzeigui. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
