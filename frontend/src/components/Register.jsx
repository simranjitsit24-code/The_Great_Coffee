import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Register({ setUser }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // Calculate password strength
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: 'Empty', color: '#ddd', feedback: [] };
    
    let score = 0;
    let feedback = [];
    
    // Length check
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    
    // Complexity checks
    if (/[a-z]/.test(pass)) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pass)) score += 1;
    
    // Calculate strength
    let label, color;
    if (score === 0) { 
      label = 'Very Weak'; 
      color = '#ff4444';
      feedback = ['Add at least 8 characters'];
    } else if (score === 1) { 
      label = 'Weak'; 
      color = '#ff6b6b';
      feedback = ['Add uppercase letters', 'Add numbers', 'Add special characters'];
    } else if (score === 2) { 
      label = 'Fair'; 
      color = '#ffa94d';
      feedback = ['Add more characters (8+)', 'Mix uppercase and lowercase'];
    } else if (score === 3) { 
      label = 'Good'; 
      color = '#51cf66';
      feedback = ['Add special characters for stronger password'];
    } else if (score === 4) { 
      label = 'Strong'; 
      color = '#40c057';
      feedback = ['Great password!'];
    } else { 
      label = 'Very Strong'; 
      color = '#2b8a3e';
      feedback = ['Excellent password!'];
    }
    
    return { score, label, color, feedback, strength: score };
  };

  // Validate password requirements
  const validatePassword = (pass) => {
    const errors = [];
    if (pass.length < 8) errors.push('At least 8 characters');
    if (!/[a-z]/.test(pass)) errors.push('Lowercase letter');
    if (!/[A-Z]/.test(pass)) errors.push('Uppercase letter');
    if (!/[0-9]/.test(pass)) errors.push('Number');
    if (!/[^a-zA-Z0-9]/.test(pass)) errors.push('Special character');
    return errors;
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordErrors = validatePassword(password);
  const isPasswordValid = passwordErrors.length === 0;
  const doPasswordsMatch = password === confirmPassword && password !== '';
  const percentage = (passwordStrength.score / 6) * 100;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate all fields
    if (!username || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (!isPasswordValid) {
      setError('Please meet all password requirements');
      return;
    }

    if (!doPasswordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting registration...');

      // Register
      await axios.post('/api/register', {
        username,
        email,
        password
      });

      console.log('Registration successful');

      // Auto login after registration
      const loginResponse = await axios.post('/api/login', {
        username,
        password
      });

      console.log('Auto-login successful:', loginResponse.data);
      setUser(loginResponse.data.user);
      navigate('/');

    } catch (error) {
      console.error('Registration error:', error);

      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        setError(error.response.data?.error || 'Registration failed');
      } else if (error.request) {
        console.error('No response from server');
        setError('Cannot connect to server. Please check if backend is running.');
      } else {
        setError('An error occurred during registration.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Create Account</h2>
      <p className="auth-subtitle">Join our coffee community</p>

      <form onSubmit={handleSubmit}>
        {/* Username */}
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {/* Email */}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {/* Password */}
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="password-input-wrapper">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
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

        {/* Password Strength Meter */}
        {password && (
          <div className="password-strength-container">
            <div className="strength-bar">
              <div 
                className="strength-fill" 
                style={{ 
                  width: `${percentage}%`, 
                  backgroundColor: passwordStrength.color
                }}
              />
            </div>
            <div className="strength-info">
              <span className="strength-label" style={{ color: passwordStrength.color }}>
                {passwordStrength.label}
              </span>
              <span className="strength-score">
                {passwordStrength.score}/6
              </span>
            </div>
            <div className="strength-feedback">
              {passwordStrength.feedback.map((msg, index) => (
                <span key={index} className="feedback-item">• {msg}</span>
              ))}
            </div>
            <div className="strength-requirements">
              <div className={`req-item ${password.length >= 8 ? 'met' : ''}`}>
                {password.length >= 8 ? '✅' : '⬜'} At least 8 characters
              </div>
              <div className={`req-item ${/[a-z]/.test(password) ? 'met' : ''}`}>
                {/[a-z]/.test(password) ? '✅' : '⬜'} Lowercase letter
              </div>
              <div className={`req-item ${/[A-Z]/.test(password) ? 'met' : ''}`}>
                {/[A-Z]/.test(password) ? '✅' : '⬜'} Uppercase letter
              </div>
              <div className={`req-item ${/[0-9]/.test(password) ? 'met' : ''}`}>
                {/[0-9]/.test(password) ? '✅' : '⬜'} Number
              </div>
              <div className={`req-item ${/[^a-zA-Z0-9]/.test(password) ? 'met' : ''}`}>
                {/[^a-zA-Z0-9]/.test(password) ? '✅' : '⬜'} Special character
              </div>
            </div>
          </div>
        )}

        {/* Confirm Password */}
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <div className="password-input-wrapper">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex="-1"
            >
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {confirmPassword && (
            <div className={`password-match ${doPasswordsMatch ? 'match' : 'mismatch'}`}>
              {doPasswordsMatch ? '✅ Passwords match' : '❌ Passwords do not match'}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && <div className="error">{error}</div>}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !isPasswordValid || !doPasswordsMatch}
          className="register-btn"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <div className="link">
          Already have an account? <Link to="/login">Login here</Link>
        </div>
      </form>
    </div>
  );
}

export default Register;
