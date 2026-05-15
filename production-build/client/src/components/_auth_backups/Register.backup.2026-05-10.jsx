import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const { data } = await axios.post(`${apiUrl}/api/auth/register`, {
        username,
        email,
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
      <div className="auth-card">
        <div className="auth-header">
          <h1>Join the Chat</h1>
          <p>Create an account to start connecting</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
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
                required
              />
            </div>
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
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
        
        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in here</Link>
          <div className="auth-copyright">&copy; 2026 Mohamed amine Rzeigui</div>
        </div>
      </div>
    </div>
  );
};

export default Register;

