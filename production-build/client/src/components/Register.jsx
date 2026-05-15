import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, User, CheckCircle2, AlertCircle } from 'lucide-react';
import './authPremium.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(true);
  const [touched, setTouched] = useState({ username: false, email: false, password: false, confirmPassword: false });
  
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) navigate('/feed');
  }, [navigate]);

  const passwordStrength = useMemo(() => {
    const p = password || '';
    let score = 0;
    if (p.length >= 8) score += 1;
    if (/[A-Z]/.test(p)) score += 1;
    if (/[0-9]/.test(p)) score += 1;
    if (/[^A-Za-z0-9]/.test(p)) score += 1;
    return score; // 0..4
  }, [password]);

  const fieldErrors = useMemo(() => {
    const next = {};

    const u = username.trim();
    if (!u) next.username = 'Username is required.';
    else if (u.length < 3) next.username = 'Username must be at least 3 characters.';
    else if (u.length > 20) next.username = 'Username must be 20 characters or less.';

    const e = email.trim();
    if (!e) next.email = 'Email is required.';
    else if (!/^\S+@\S+\.\S+$/.test(e)) next.email = 'Enter a valid email address.';

    if (!password) next.password = 'Password is required.';
    else if (password.length < 8) next.password = 'Password must be at least 8 characters.';
    else if (!/[A-Z]/.test(password)) next.password = 'Password must contain at least one uppercase letter.';
    else if (!/[0-9]/.test(password)) next.password = 'Password must contain at least one number.';

    if (!confirmPassword) next.confirmPassword = 'Please confirm your password.';
    else if (confirmPassword !== password) next.confirmPassword = 'Passwords do not match.';

    if (!agree) next.agree = 'You must accept the terms to continue.';

    return next;
  }, [agree, confirmPassword, email, password, username]);

  const canSubmit = !loading && Object.keys(fieldErrors).length === 0;

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setTouched({ username: true, email: true, password: true, confirmPassword: true });
    
    if (!canSubmit) {
        if (!agree) setError('Please accept the Terms & Conditions to proceed.');
        return;
    }
    
    setLoading(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);
      const { data } = await axios.post(`${apiUrl}/api/auth/register`, {
        username: username.trim(),
        email: email.trim(),
        password
      });
      
      localStorage.setItem('userInfo', JSON.stringify(data));
      navigate('/feed');
    } catch (err) {
      if (err.response?.data?.errors) {
          const msg = err.response.data.errors.map(e => e.msg).join('. ');
          setError(msg);
      } else {
          setError(err.response?.data?.message || 'An error occurred during registration. Please try again.');
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
            <span className="auth-aside-kicker">Premium Experience</span>
            <h2 className="auth-aside-title">Connect with the world.</h2>
            <p className="auth-aside-desc">
              Join thousands of users in a seamless, secure, and real-time social experience. 
              Build your presence and start chatting today.
            </p>
            
            <div className="auth-badges">
              <div className="auth-badge">
                <ShieldCheck size={18} className="text-primary" />
                <span>JWT Secured</span>
              </div>
              <div className="auth-badge">
                <CheckCircle2 size={18} className="text-success" />
                <span>Verified Cloud</span>
              </div>
              <div className="auth-badge">
                <div className="auth-dot" />
                <span>Active Community</span>
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
            <h1>Get Started</h1>
            <p>Create your premium account in seconds.</p>
          </div>
          
          {error && (
            <div className="error-message">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
          
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div className="input-wrapper">
                <User size={20} />
                <input
                  type="text"
                  id="username"
                  className="form-input"
                  placeholder="e.g. johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, username: true }))}
                  required
                />
              </div>
              {touched.username && fieldErrors.username && <span className="field-error">{fieldErrors.username}</span>}
            </div>
            
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

              <div className="auth-strength">
                <div className="auth-strength-bar" data-score={passwordStrength}>
                  <span />
                </div>
                <div className="auth-strength-text">
                  {passwordStrength === 0 && 'Too Weak'}
                  {passwordStrength === 1 && 'Weak'}
                  {passwordStrength === 2 && 'Fair'}
                  {passwordStrength === 3 && 'Good'}
                  {passwordStrength === 4 && 'Strong'}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <Lock size={20} />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  id="confirmPassword"
                  className="form-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                  required
                />
                <button
                  type="button"
                  className="auth-icon-btn"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {touched.confirmPassword && fieldErrors.confirmPassword && (
                <span className="field-error">{fieldErrors.confirmPassword}</span>
              )}
            </div>

            <div className="auth-row">
              <label className="auth-check">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                <span>
                  I agree to the <button type="button" className="auth-link">Terms of Service</button>
                </span>
              </label>
            </div>
            
            <button type="submit" className="btn-primary" disabled={!canSubmit || loading}>
              {loading ? (
                <>
                  <div className="spinner" />
                  Processing...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
          
          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
