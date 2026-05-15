import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, Lock, LogIn, Mail, ShieldCheck, ArrowRight } from 'lucide-react';
import './authPremium.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [touched, setTouched] = useState({ email: false, password: false });
  
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) navigate('/feed');
  }, [navigate]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('rememberedEmail');
      if (raw) setEmail(raw);
    } catch {
      // ignore storage errors
    }
  }, []);

  const fieldErrors = useMemo(() => {
    const next = {};
    const emailTrimmed = email.trim();
    if (!emailTrimmed) next.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(emailTrimmed)) next.email = 'Enter a valid email address.';

    if (!password) next.password = 'Password is required.';
    else if (password.length < 8) next.password = 'Password must be at least 8 characters.';

    return next;
  }, [email, password]);

  const canSubmit = !loading && Object.keys(fieldErrors).length === 0;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setTouched({ email: true, password: true });
    if (!canSubmit) return;
    setLoading(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);
      const { data } = await axios.post(`${apiUrl}/api/auth/login`, {
        email: email.trim(),
        password
      });
      
      localStorage.setItem('userInfo', JSON.stringify(data));
      if (rememberMe) localStorage.setItem('rememberedEmail', email.trim());
      else localStorage.removeItem('rememberedEmail');
      navigate('/feed');
    } catch (err) {
      if (err.response?.data?.errors) {
          const msg = err.response.data.errors.map(e => e.msg).join('. ');
          setError(msg);
      } else {
          setError(err.response?.data?.message || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-shell">
        {/* Left Side - Hero Section */}
        <div className="auth-aside">
          <div className="auth-brand">
            <div className="auth-logo">
              <img src="/mosma_logo.png" alt="MosMA Logo" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
            </div>
            <div className="auth-brand-name">MosMA Chat</div>
          </div>
          
          <div className="auth-aside-content">
            <span className="auth-aside-kicker">Welcome Back</span>
            <h2 className="auth-aside-title">Continue your journey.</h2>
            <p className="auth-aside-desc">
              Log in to access your chats, social feed, and community. 
              Stay connected with your friends across all devices.
            </p>
            
            <div className="auth-badges">
              <div className="auth-badge">
                <ShieldCheck size={18} className="text-primary" />
                <span>Secure Session</span>
              </div>
              <div className="auth-badge">
                <div className="auth-dot" />
                <span>Live Community</span>
              </div>
            </div>
          </div>

          <div className="auth-copyright">
            &copy; 2026 Mohamed amine Rzeigui. All rights reserved.
          </div>
        </div>

        {/* Right Side - Form Section */}
        <div className="auth-card">
          <div className="auth-header">
            <h1>Sign In</h1>
            <p>Enter your credentials to continue.</p>
          </div>
          
          {error && (
            <div className="error-message">
              <LogIn size={18} />
              <span>{error}</span>
            </div>
          )}
          
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <Mail size={20} />
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                  required
                  autoComplete="email"
                />
              </div>
              {touched.email && fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <Lock size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-icon-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {touched.password && fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
            </div>

            <div className="auth-row">
              <label className="auth-check">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <Link className="auth-link" to="/register">
                Forgot password?
              </Link>
            </div>
            
            <button type="submit" className="btn-primary" disabled={!canSubmit || loading}>
              {loading ? (
                <>
                  <div className="spinner" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
          
          <div className="auth-footer">
            Don't have an account? <Link to="/register">Create Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
