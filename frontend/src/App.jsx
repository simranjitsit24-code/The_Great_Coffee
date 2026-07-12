import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import Menu from './components/Menu.jsx';
import axios from 'axios';
import './App.css';

// Get API URL from environment variables (set on Render)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Log for debugging
console.log('🔗 API URL:', API_URL);
console.log('🔧 Environment:', import.meta.env.MODE);

// Configure axios
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Add request interceptor for debugging
axios.interceptors.request.use(
  (config) => {
    console.log(`📤 ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
axios.interceptors.response.use(
  (response) => {
    console.log(`📥 ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ ${error.config?.url}:`, error.message);
    return Promise.reject(error);
  }
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuth = useCallback(async () => {
    try {
      console.log('🔍 Checking authentication...');
      const response = await axios.get('/api/current_user');
      console.log('✅ Auth successful:', response.data);
      setUser(response.data);
      setError(null);
    } catch (error) {
      console.error('❌ Auth check error:', error);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
        setError(`Server error: ${error.response.status} - ${error.response.data?.error || 'Unknown error'}`);
      } else if (error.request) {
        console.error('No response received');
        setError('Cannot connect to server. Please check if backend is running.');
      } else {
        setError(error.message);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner">⏳</div>
        <p>Loading...</p>
        <p style={{ fontSize: '0.8rem', color: '#666' }}>
          Connecting to: {API_URL}
        </p>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="error-container">
        <h2>⚠️ Connection Error</h2>
        <p>Could not connect to the server at:</p>
        <code>{API_URL}</code>
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px', textAlign: 'left' }}>
          <p><strong>Debug Info:</strong></p>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            • Environment: {import.meta.env.MODE}<br />
            • API URL: {API_URL}<br />
            • Error: {error}
          </p>
        </div>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button onClick={() => window.location.reload()}>
            🔄 Retry
          </button>
          <button onClick={() => window.location.href = 'https://the-great-coffee.onrender.com/health'}>
            🏥 Check Backend
          </button>
        </div>
        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
          Make sure your backend URL is correct in Render environment variables.
        </p>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">☕ Coffee Shop</div>
          <div className="nav-links">
            {user ? (
              <>
                <span className="user-name">Welcome, {user.username}!</span>
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </>
            ) : (
              <>
                <a href="/login">Login</a>
                <a href="/register">Register</a>
              </>
            )}
          </div>
        </nav>
        <Routes>
          <Route
            path="/"
            element={user ? <Menu user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/login"
            element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />}
          />
          <Route
            path="/register"
            element={!user ? <Register setUser={setUser} /> : <Navigate to="/" />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
