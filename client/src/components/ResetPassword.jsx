import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle, Mail, ShieldCheck } from 'lucide-react';
import './authPremium.css';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [touched, setTouched] = useState({
    email: false,
    code: false,
    password: false,
    confirmPassword: false
  });

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
    if (location.state?.devResetCode) {
      setCode(location.state.devResetCode);
      setDevCode(location.state.devResetCode);
    }
  }, [location]);

  const apiUrl = import.meta.env.PROD 
    ? window.location.origin 
    : `${window.location.protocol}//${window.location.hostname}:5000`;

  // Validation
  const validations = useMemo(() => {
    const errors = {};
    const trimmedEmail = email.trim();
    const trimmedCode = code.trim();

    if (!trimmedEmail) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!trimmedCode) {
      errors.code = 'Reset code is required';
    } else if (!/^\d{6}$/.test(trimmedCode)) {
      errors.code = 'Reset code must be a 6-digit number';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else {
      if (password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }
      if (!/[A-Z]/.test(password)) {
        errors.password = 'Password must contain at least one uppercase letter';
      }
      if (!/[0-9]/.test(password)) {
        errors.password = 'Password must contain at least one number';
      }
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  }, [email, code, password, confirmPassword]);

  const isValid = Object.keys(validations).length === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setTouched({
      email: true,
      code: true,
      password: true,
      confirmPassword: true
    });

    if (!isValid) return;

    setLoading(true);
    try {
      await axios.post(`${apiUrl}/api/auth/reset-password`, { 
        email: email.trim(), 
        code: code.trim(),
        password 
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The code may be incorrect or has expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-shell">
        {/* Left Side */}
        <div className="auth-aside">
          <div className="auth-brand">
            <div className="auth-logo">
              <img src="/mosma_logo.png" alt="MosMA Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
            </div>
            <div className="auth-brand-name">MosMA Chat</div>
          </div>
          <div className="auth-aside-content">
            <span className="auth-aside-kicker">Account Recovery</span>
            <h2 className="auth-aside-title">Create a new password.</h2>
            <p className="auth-aside-desc">
              Choose a strong password with at least 8 characters, one uppercase letter, and one number.
            </p>
          </div>
          <div className="auth-copyright">&copy; 2026 Mohamed amine Rzeigui. All rights reserved.</div>
        </div>

        {/* Right Side */}
        <div className="auth-card">
          <div className="auth-header">
            <h1>Reset Password</h1>
            <p>Enter the code sent to your email to verify and reset.</p>
          </div>

          {success ? (
            <div className="reset-success-box" style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div className="reset-success-icon" style={{ color: 'var(--success)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                <CheckCircle size={48} />
              </div>
              <h3>Password Reset!</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                Your password has been changed successfully. Redirecting you to login...
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="error-message">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {devCode && (
                <div className="dev-notice" style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  color: '#c7d2fe',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.85rem',
                  marginBottom: '1.5rem'
                }}>
                  💡 <strong>Dev Mode Tip:</strong> Pre-filled simulation code is: <strong>{devCode}</strong>
                </div>
              )}

              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                {/* Email Input */}
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

                {/* Reset Code Input */}
                <div className="form-group">
                  <label htmlFor="code">Reset Code</label>
                  <div className="input-wrapper">
                    <ShieldCheck size={20} />
                    <input
                      type="text"
                      id="code"
                      className={`form-input ${touched.code && validations.code ? 'input-error' : ''}`}
                      placeholder="e.g. 123456"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      onBlur={() => setTouched(prev => ({ ...prev, code: true }))}
                      required
                    />
                  </div>
                  {touched.code && validations.code && (
                    <span className="field-error">{validations.code}</span>
                  )}
                </div>

                {/* New Password */}
                <div className="form-group">
                  <label htmlFor="password">New Password</label>
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

                {/* Confirm New Password */}
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <div className="input-wrapper">
                    <Lock size={20} />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      id="confirmPassword"
                      className={`form-input ${touched.confirmPassword && validations.confirmPassword ? 'input-error' : ''}`}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
                      required
                    />
                    <button 
                      type="button" 
                      className="auth-icon-btn" 
                      onClick={() => setShowConfirm(!showConfirm)}
                      tabIndex="-1"
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {touched.confirmPassword && validations.confirmPassword && (
                    <span className="field-error">{validations.confirmPassword}</span>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={loading || (Object.keys(touched).some(k => touched[k]) && !isValid)}
                >
                  {loading ? (
                    <>
                      <div className="spinner" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      Set New Password 
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          <div className="auth-footer">
            Back to <Link to="/login">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
