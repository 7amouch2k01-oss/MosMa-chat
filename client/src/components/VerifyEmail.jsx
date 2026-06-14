import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import './authPremium.css';

const VerifyEmail = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [touched, setTouched] = useState(false);
  const [devCode, setDevCode] = useState('');
  const navigate = useNavigate();

  const storedUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('userInfo');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!storedUser) {
      navigate('/login');
      return;
    }
    if (storedUser.isVerified) {
      navigate('/feed');
      return;
    }
    if (storedUser.devVerificationCode) {
      setDevCode(storedUser.devVerificationCode);
    }
  }, [storedUser, navigate]);

  const validationError = useMemo(() => {
    const trimmed = code.trim();
    if (!trimmed) {
      return 'Verification code is required';
    }
    if (!/^\d{6}$/.test(trimmed)) {
      return 'Verification code must be a 6-digit number';
    }
    return '';
  }, [code]);

  const isValid = !validationError;

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setTouched(true);

    if (!isValid || !storedUser) return;

    setLoading(true);
    try {
      const apiUrl = import.meta.env.PROD 
        ? window.location.origin 
        : `${window.location.protocol}//${window.location.hostname}:5000`;

      const { data } = await axios.post(
        `${apiUrl}/api/auth/verify-email`, 
        { code: code.trim() },
        { headers: { Authorization: `Bearer ${storedUser.token}` } }
      );

      setSuccess('Email verified successfully! Redirecting...');
      
      // Update stored user info
      const updatedUser = { ...storedUser, ...data };
      delete updatedUser.devVerificationCode; // clean up dev helper
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));

      setTimeout(() => {
        navigate('/feed');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!storedUser) return;
    setError('');
    setSuccess('');
    setResending(true);

    try {
      const apiUrl = import.meta.env.PROD 
        ? window.location.origin 
        : `${window.location.protocol}//${window.location.hostname}:5000`;

      const { data } = await axios.post(
        `${apiUrl}/api/auth/resend-verification`,
        {},
        { headers: { Authorization: `Bearer ${storedUser.token}` } }
      );

      setSuccess('A new verification code has been generated!');
      if (data.devVerificationCode) {
        setDevCode(data.devVerificationCode);
        
        // Also save to localStorage
        const updatedUser = { ...storedUser, devVerificationCode: data.devVerificationCode };
        localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code. Please try again later.');
    } finally {
      setResending(false);
    }
  };

  const handleSkip = () => {
    navigate('/feed');
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
            <span className="auth-aside-kicker">Security First</span>
            <h2 className="auth-aside-title">Verify your email.</h2>
            <p className="auth-aside-desc">
              Please verify your email address to secure your account and unlock premium messaging features.
            </p>
            
            <div className="auth-badges">
              <div className="auth-badge">
                <ShieldCheck size={18} className="text-primary" />
                <span>Verified Account</span>
              </div>
              <div className="auth-badge">
                <div className="auth-dot" />
                <span>Secure Inbox</span>
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
            <h1>Email Verification</h1>
            <p>Enter the 6-digit code sent to your email address.</p>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="success-message" style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: '#a7f3d0',
              padding: '1rem',
              borderRadius: '1rem',
              fontSize: '0.9rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
              <span>{success}</span>
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
              💡 <strong>Dev Mode Tip:</strong> Your simulation code is: <strong>{devCode}</strong>
            </div>
          )}

          <form className="auth-form" onSubmit={handleVerify} noValidate>
            <div className="form-group">
              <label htmlFor="code">6-Digit Code</label>
              <div className="input-wrapper">
                <ShieldCheck size={20} />
                <input
                  type="text"
                  id="code"
                  className={`form-input ${touched && validationError ? 'input-error' : ''}`}
                  placeholder="e.g. 123456"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  onBlur={() => setTouched(true)}
                  required
                />
              </div>
              {touched && validationError && (
                <span className="field-error">{validationError}</span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={handleSkip}
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-primary)',
                  boxShadow: 'none'
                }}
              >
                Skip Verification
              </button>
              
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading || (touched && !isValid)}
              >
                {loading ? (
                  <><div className="spinner" />Verifying...</>
                ) : (
                  <>Verify <ArrowRight size={20} /></>
                )}
              </button>
            </div>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button 
              className="auth-link" 
              onClick={handleResend} 
              disabled={resending}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {resending ? <RefreshCw size={14} className="spin" /> : <RefreshCw size={14} />}
              Resend verification code
            </button>
          </div>

          <div className="auth-footer">
            Logged in as <strong>{storedUser?.username}</strong>? <Link to="/login" onClick={() => localStorage.removeItem('userInfo')}>Sign Out</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
