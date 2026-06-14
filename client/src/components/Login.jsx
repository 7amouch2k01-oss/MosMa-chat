import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, LogIn, Mail, ShieldCheck, ArrowRight } from 'lucide-react';
import './authPremium.css';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [touched, setTouched] = useState({ email: false, password: false });
  
  const navigate = useNavigate();

  // Redirect if user is already authenticated
  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      navigate('/feed');
    }
  }, [navigate]);

  // Load remembered email
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('rememberedEmail');
      if (savedEmail) {
        setEmail(savedEmail);
      }
    } catch (err) {
      console.error('Failed to load remembered email:', err);
    }
  }, []);

  // Live client-side validations
  const validations = useMemo(() => {
    const errors = {};
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    return errors;
  }, [email, password]);

  const isValid = Object.keys(validations).length === 0;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setTouched({ email: true, password: true });

    if (!isValid) return;

    setLoading(true);
    try {
      const apiUrl = import.meta.env.PROD 
        ? window.location.origin 
        : `${window.location.protocol}//${window.location.hostname}:5000`;
        
      const response = await axios.post(`${apiUrl}/api/auth/login`, {
        email: email.trim(),
        password
      });

      // Save user info (includes token, username, email)
      localStorage.setItem('userInfo', JSON.stringify(response.data));

      // Remember me functionality
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email.trim());
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      navigate('/feed');
    } catch (err) {
      if (err.response?.data?.errors) {
        const errorMsgs = err.response.data.errors.map(e => e.msg).join('. ');
        setError(errorMsgs);
      } else {
        setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-shell">
        {/* Left Hero Side */}
        <div className="auth-aside">
          <div className="auth-brand">
            <div className="auth-logo">
              <img src="/mosma_logo.png" alt="MosMA Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
            </div>
            <div className="auth-brand-name">MosMA Chat</div>
          </div>
          
          <div className="auth-aside-content">
            <span className="auth-aside-kicker">Welcome Back</span>
            <h2 className="auth-aside-title">Continue your journey.</h2>
            <p className="auth-aside-desc">
              Sign in to catch up on chats, explore the social feed, and keep in touch with your friends.
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

        {/* Right Form Side */}
        <div className="auth-card">
          <div className="auth-header">
            <h1>Sign In</h1>
            <p>Enter your credentials to access your account.</p>
          </div>
          
          {error && (
            <div className="error-message">
              <LogIn size={18} />
              <span>{error}</span>
            </div>
          )}
          
          <form className="auth-form" onSubmit={handleLogin} noValidate>
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <Mail size={20} />
                <input
                  type="email"
                  id="email"
                  className={`form-input ${touched.email && validations.email ? 'input-error' : ''}`}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                  required
                  autoComplete="email"
                />
              </div>
              {touched.email && validations.email && (
                <span className="field-error">{validations.email}</span>
              )}
            </div>
            
            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <Lock size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className={`form-input ${touched.password && validations.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-icon-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {touched.password && validations.password && (
                <span className="field-error">{validations.password}</span>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="auth-row">
              <label className="auth-check">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <Link className="auth-link" to="/forgot-password">
                Forgot password?
              </Link>
            </div>
            
            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading || (Object.keys(touched).some(k => touched[k]) && !isValid)}
            >
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
