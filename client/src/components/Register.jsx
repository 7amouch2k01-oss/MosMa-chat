import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, User } from 'lucide-react';
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
    else if (password.length < 6) next.password = 'Password must be at least 6 characters.';

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
    if (!canSubmit) return;
    setLoading(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const { data } = await axios.post(`${apiUrl}/api/auth/register`, {
        username: username.trim(),
        email: email.trim(),
        password
      });
      
      localStorage.setItem('userInfo', JSON.stringify(data));
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-shell">
        <div className="auth-aside" aria-hidden="true">
          <div className="auth-aside-inner">
            <div className="auth-brand">
              <div className="auth-logo">💬</div>
              <div className="auth-brand-text">
                <div className="auth-brand-name">NexChat</div>
                <div className="auth-brand-tag">Create your premium profile</div>
              </div>
            </div>
            <div className="auth-aside-card">
              <div className="auth-aside-kicker">Get started</div>
              <div className="auth-aside-title">Join the community.</div>
              <div className="auth-aside-desc">
                Build your profile, explore the social feed, and chat in real time.
              </div>
              <div className="auth-badges">
                <div className="auth-badge">
                  <ShieldCheck size={16} />
                  <span>JWT secured</span>
                </div>
                <div className="auth-badge">
                  <span className="auth-dot" />
                  <span>Theme ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-card auth-card-premium">
        <div className="auth-header">
          <div className="auth-header-top">
            <h1>Create your account</h1>
            <p>It takes less than a minute.</p>
          </div>
        </div>
        
        {error && (
          <div className="error-message" role="alert" aria-live="polite">
            {error}
          </div>
        )}
        
        <form className="auth-form" onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <div className="input-wrapper">
              <User />
              <input
                type="text"
                id="username"
                className="form-input"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, username: true }))}
                required
                autoComplete="username"
              />
            </div>
            {touched.username && fieldErrors.username && <div className="field-error">{fieldErrors.username}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail />
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                required
                autoComplete="email"
              />
            </div>
            {touched.email && fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper auth-password-wrap">
              <Lock />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="form-input"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-icon-btn"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {touched.password && fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}

            <div className="auth-strength">
              <div className="auth-strength-bar" data-score={passwordStrength}>
                <span />
              </div>
              <div className="auth-strength-text">
                {passwordStrength <= 1 && 'Weak'}
                {passwordStrength === 2 && 'Fair'}
                {passwordStrength === 3 && 'Good'}
                {passwordStrength >= 4 && 'Strong'}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper auth-password-wrap">
              <Lock />
              <input
                type={showConfirm ? 'text' : 'password'}
                id="confirmPassword"
                className="form-input"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-icon-btn"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {touched.confirmPassword && fieldErrors.confirmPassword && (
              <div className="field-error">{fieldErrors.confirmPassword}</div>
            )}
          </div>

          <div className="auth-row">
            <label className="auth-check">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <span>
                I agree to the{' '}
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => setError('Terms/Privacy pages are not added yet. (We can add them next.)')}
                >
                  Terms
                </button>
              </span>
            </label>
          </div>
          {touched.confirmPassword && fieldErrors.agree && <div className="field-error">{fieldErrors.agree}</div>}
          
          <button type="submit" className="btn-primary" disabled={!canSubmit}>
            {loading ? 'Creating account...' : 'Create account'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
        
        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in here</Link>
          <div className="auth-copyright">&copy; 2026 Mohamed amine Rzeigui</div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Register;
