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
                    <div className="logo-icon">💬</div>
                    <span>NexChat</span>
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
                            Launch NexChat <ArrowRight size={20} />
                        </Link>
                        <Link to="/login" className="hero-btn-secondary">
                            View Demo
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
                        <img src="/chat_app_hero_illustration.png" alt="NexChat Illustration" className="hero-image" />
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

            {/* --- Theme Preview --- */}
            <section className="theme-preview-section">
                <div className="preview-content">
                    <h2>8 Premium <span>Atmospheres</span></h2>
                    <p>Customize your experience with animated backgrounds that fit your mood. From Cosmic to Midnight, find your vibe.</p>
                    <div className="theme-dots">
                        <div className="dot cosmic"></div>
                        <div className="dot ember"></div>
                        <div className="dot cyber"></div>
                        <div className="dot rose"></div>
                        <div className="dot aurora"></div>
                        <div className="dot midnight"></div>
                        <div className="dot forest"></div>
                        <div className="dot oceanic"></div>
                    </div>
                </div>
                <div className="preview-showcase">
                    <div className="mock-ui">
                        <div className="mock-header"></div>
                        <div className="mock-body">
                            <div className="mock-msg left">Hey there! 👋</div>
                            <div className="mock-msg right">The new themes look amazing! 🔥</div>
                            <div className="mock-msg left">React to this message! 👍</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Footer --- */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <div className="logo-icon">💬</div>
                        <span>NexChat</span>
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
