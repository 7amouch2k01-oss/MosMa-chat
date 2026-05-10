import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, Lock, LogIn, Mail, ShieldCheck } from 'lucide-react';
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
    else if (password.length < 6) next.password = 'Password must be at least 6 characters.';

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
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const { data } = await axios.post(`${apiUrl}/api/auth/login`, {
        email: email.trim(),
        password
      });
      
      localStorage.setItem('userInfo', JSON.stringify(data));
      if (rememberMe) localStorage.setItem('rememberedEmail', email.trim());
      else localStorage.removeItem('rememberedEmail');
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
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
                <div className="auth-brand-tag">Premium social chat experience</div>
              </div>
            </div>
            <div className="auth-aside-card">
              <div className="auth-aside-kicker">Secure access</div>
              <div className="auth-aside-title">Sign in with confidence.</div>
              <div className="auth-aside-desc">
                JWT auth, modern UI, and fast real-time features across your app.
              </div>
              <div className="auth-badges">
                <div className="auth-badge">
                  <ShieldCheck size={16} />
                  <span>Protected sessions</span>
                </div>
                <div className="auth-badge">
                  <span className="auth-dot" />
                  <span>Realtime-ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-card auth-card-premium">
        <div className="auth-header">
          <div className="auth-header-top">
            <h1>Welcome back</h1>
            <p>Sign in to continue.</p>
          </div>
        </div>
        
        {error && (
          <div className="error-message" role="alert" aria-live="polite">
            {error}
          </div>
        )}
        
        <form className="auth-form" onSubmit={handleLogin}>
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                required
                autoComplete="current-password"
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
            <button
              type="button"
              className="auth-link subtle"
              onClick={() => setError('Password reset is not added yet. (We can add it next.)')}
            >
              Forgot password?
            </button>
          </div>
          
          <button type="submit" className="btn-primary" disabled={!canSubmit}>
            {loading ? 'Signing in...' : 'Sign in'}
            {!loading && <LogIn size={18} />}
          </button>

          <div className="auth-divider">
            <span>or continue with</span>
          </div>
          <div className="auth-provider-row">
            <button
              type="button"
              className="auth-provider"
              onClick={() => setError('Google sign-in is not wired yet. (We can add OAuth later.)')}
            >
              Google
            </button>
            <button
              type="button"
              className="auth-provider"
              onClick={() => setError('GitHub sign-in is not wired yet. (We can add OAuth later.)')}
            >
              GitHub
            </button>
          </div>
        </form>
        
        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one here</Link>
          <div className="auth-copyright">&copy; 2026 Mohamed amine Rzeigui</div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Login;
