import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, LogIn } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const { data } = await axios.post(`${apiUrl}/api/auth/login`, {
        email,
        password
      });
      
      localStorage.setItem('userInfo', JSON.stringify(data));
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">💬</div>
          <h1>Welcome Back</h1>
          <p>Sign in to continue to NexChat</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
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
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock />
              <input
                type="password"
                id="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <LogIn size={18} />}
          </button>
        </form>
        
        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one here</Link>
          <div className="auth-copyright">&copy; 2026 Mohamed amine Rzeigui</div>
        </div>
      </div>
    </div>
  );
};

export default Login;

