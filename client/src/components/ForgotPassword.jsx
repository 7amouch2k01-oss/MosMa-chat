import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, ArrowRight, KeyRound, CheckCircle, AlertCircle } from 'lucide-react';
import './authPremium.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [devResetCode, setDevResetCode] = useState('');
  const [touched, setTouched] = useState(false);
  const navigate = useNavigate();

  const apiUrl = import.meta.env.PROD 
    ? window.location.origin 
    : `${window.location.protocol}//${window.location.hostname}:5000`;

  // Validation
  const validationError = useMemo(() => {
    const trimmed = email.trim();
    if (!trimmed) {
      return 'Email address is required';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return 'Please enter a valid email address';
    }
    return '';
  }, [email]);

  const isValid = !validationError;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setTouched(true);

    if (!isValid) return;

    setLoading(true);
    try {
      const { data } = await axios.post(`${apiUrl}/api/auth/forgot-password`, { email: email.trim() });
      
      setSuccess(true);
      if (data.devResetCode) {
        setDevResetCode(data.devResetCode);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToReset = () => {
    navigate('/reset-password', { 
      state: { 
        email: email.trim(),
        devResetCode: devResetCode
      } 
    });
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
            <h2 className="auth-aside-title">Reset your password.</h2>
            <p className="auth-aside-desc">
              Enter your registered email and we'll generate a secure reset code for you instantly.
            </p>
          </div>
          <div className="auth-copyright">&copy; 2026 Mohamed amine Rzeigui. All rights reserved.</div>
        </div>

        {/* Right Side */}
        <div className="auth-card">
          <div className="auth-header">
            <h1>Forgot Password</h1>
            <p>Enter your email to get a password reset code.</p>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="reset-success-box" style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div className="reset-success-icon" style={{ color: 'var(--primary)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                <KeyRound size={48} />
              </div>
              <h3>Reset Code Generated!</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                A 6-digit password reset code has been sent to your email. It will expire in <strong>15 minutes</strong>.
              </p>

              {devResetCode && (
                <div className="dev-notice" style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  color: '#c7d2fe',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.75rem',
                  fontSize: '0.85rem',
                  marginBottom: '1.5rem',
                  textAlign: 'left'
                }}>
                  💡 <strong>Dev Mode Tip:</strong> Your simulation code is: <strong>{devResetCode}</strong>
                </div>
              )}

              <button 
                className="btn-primary" 
                onClick={handleGoToReset}
                style={{ width: '100%' }}
              >
                Go to Reset Page <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <Mail size={20} />
                  <input
                    type="email"
                    id="email"
                    className={`form-input ${touched && validationError ? 'input-error' : ''}`}
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched(true)}
                    required
                    autoComplete="email"
                  />
                </div>
                {touched && validationError && (
                  <span className="field-error">{validationError}</span>
                )}
              </div>

              <button type="submit" className="btn-primary" disabled={loading || (touched && !isValid)}>
                {loading ? (
                  <>
                    <div className="spinner" />
                    Generating Code...
                  </>
                ) : (
                  <>
                    Get Reset Code 
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="auth-footer">
            Remembered your password? <Link to="/login">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
