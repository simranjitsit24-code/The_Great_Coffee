import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login({ setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔐 Attempting login...');
      const response = await axios.post('/api/login', {
        username,
        password
      });

      console.log('✅ Login successful:', response.data);
      setUser(response.data.user);
      navigate('/');

    } catch (error) {
      console.error('❌ Login error:', error);

      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
        setError(error.response.data?.error || 'Login failed');
      } else if (error.request) {
        console.error('No response from server');
        setError('Cannot connect to server. Please check if backend is running.');
      } else {
        setError('An error occurred during login.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Welcome Back</h2>
      <p className="auth-subtitle">Login to your coffee account</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="password-input-wrapper">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex="-1"
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="login-btn"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className="link">
          Don't have an account? <Link to="/register">Register here</Link>
        </div>
      </form>
    </div>
  );
}

export default Login;
