import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import Menu from './components/Menu.jsx';
import axios from 'axios';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://the-great-coffee.onrender.com';

axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';

console.log('🔗 API URL:', API_URL);

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
      console.error('❌ Auth error:', error);
      
      if (error.response && error.response.status === 401) {
        console.log('ℹ️ Not logged in (this is normal)');
        setUser(null);
        setError(null);
      } else if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
        setError(`Server error: ${error.response.status}`);
      } else if (error.request) {
        console.error('No response from server');
        setError('Cannot connect to server');
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
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
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
          <Route
            path="*"
            element={<Navigate to="/" />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
