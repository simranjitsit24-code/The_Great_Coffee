import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import Menu from './components/Menu.jsx';
import axios from 'axios';
import './App.css';

// Get API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Configure axios
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Log the API URL for debugging
console.log('🔗 API URL:', API_URL);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuth = useCallback(async () => {
    try {
      console.log('Checking authentication...');
      const response = await axios.get('/api/current_user');
      console.log('Auth response:', response.data);
      setUser(response.data);
      setError(null);
    } catch (error) {
      console.error('Auth check error:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      setUser(null);
      setError(error.message);
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
        <p style={{ fontSize: '0.8rem', color: '#666' }}>Connecting to {API_URL}</p>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="error-container">
        <h2>⚠️ Connection Error</h2>
        <p>Could not connect to the server at:</p>
        <code>{API_URL}</code>
        <p style={{ marginTop: '1rem' }}>
          Make sure the backend is running and the URL is correct.
        </p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
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
