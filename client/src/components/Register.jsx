import React, { useState, useEffect, useMemo } from 'react';
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
  const [touched, setTouched] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false
  });
  
  const navigate = useNavigate();

  // Redirect if user is already logged in
  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      navigate('/feed');
    }
  }, [navigate]);

  // Evaluate Password Strength
  const passwordStrength = useMemo(() => {
    const pass = password || '';
    let score = 0;
    
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    
    return score; // 0 to 4
  }, [password]);

  // Live client-side validation errors
  const validations = useMemo(() => {
    const errors = {};
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmedUsername) {
      errors.username = 'Username is required';
    } else if (trimmedUsername.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (trimmedUsername.length > 20) {
      errors.username = 'Username must be less than 20 characters';
    }

    if (!trimmedEmail) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address';
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
      errors.confirmPassword = 'Please confirm your password';
    } else if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!agree) {
      errors.agree = 'You must agree to the Terms of Service';
    }

    return errors;
  }, [username, email, password, confirmPassword, agree]);

  const isValid = Object.keys(validations).length === 0;

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    // Mark all fields as touched to trigger visual error messages
    setTouched({
      username: true,
      email: true,
      password: true,
      confirmPassword: true
    });

    if (!isValid) {
      if (!agree) {
        setError('Please accept the Terms & Conditions to proceed.');
      }
      return;
    }

    setLoading(true);
    try {
      const apiUrl = import.meta.env.PROD 
        ? window.location.origin 
        : `${window.location.protocol}//${window.location.hostname}:5000`;
        
      const response = await axios.post(`${apiUrl}/api/auth/register`, {
        username: username.trim(),
        email: email.trim(),
        password
      });

      // Save credentials (includes token, username, email)
      localStorage.setItem('userInfo', JSON.stringify(response.data));
      
      // Redirect to verification screen
      navigate('/verify');
    } catch (err) {
      if (err.response?.data?.errors) {
        const errorMsgs = err.response.data.errors.map(e => e.msg).join('. ');
        setError(errorMsgs);
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
        {/* Left Hero Side */}
        <div className="auth-aside">
          <div className="auth-brand">
            <div className="auth-logo">
              <img src="/mosma_logo.png" alt="MosMA Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
            </div>
            <div className="auth-brand-name">MosMA Chat</div>
          </div>
          
          <div className="auth-aside-content">
            <span className="auth-aside-kicker">Premium Experience</span>
            <h2 className="auth-aside-title">Connect with the world.</h2>
            <p className="auth-aside-desc">
              Join thousands of users in a secure, beautiful, real-time social experience. Start sharing and chatting today.
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
            </div>
          </div>

          <div className="auth-copyright">
            &copy; 2026 Mohamed amine Rzeigui. All rights reserved.
          </div>
        </div>

        {/* Right Form Side */}
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
          
          <form className="auth-form" onSubmit={handleRegister} noValidate>
            {/* Username Field */}
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div className="input-wrapper">
                <User size={20} />
                <input
                  type="text"
                  id="username"
                  className={`form-input ${touched.username && validations.username ? 'input-error' : ''}`}
                  placeholder="e.g. johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, username: true }))}
                  required
                />
              </div>
              {touched.username && validations.username && (
                <span className="field-error">{validations.username}</span>
              )}
            </div>

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

              {/* Password Strength Indicator */}
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

            {/* Confirm Password Field */}
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
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

            {/* Terms and Conditions agreement */}
            <div className="auth-row">
              <label className="auth-check">
                <input 
                  type="checkbox" 
                  checked={agree} 
                  onChange={(e) => setAgree(e.target.checked)} 
                />
                <span>
                  I agree to the <button type="button" className="auth-link">Terms of Service</button>
                </span>
              </label>
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
