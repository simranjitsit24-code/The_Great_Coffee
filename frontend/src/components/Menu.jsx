import React, { useState, useEffect } from 'react';
import MenuItem from './MenuItem';
import axios from 'axios';
import './Menu.css';

function Menu({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await axios.get('/api/menu');
      // Get vote status for each item
      const itemsWithVoteStatus = await Promise.all(
        response.data.map(async (item) => {
          try {
            const voteResponse = await axios.get(`/api/menu/${item.id}/vote_status`);
            return { ...item, hasVoted: voteResponse.data.has_voted };
          } catch (error) {
            return { ...item, hasVoted: false };
          }
        })
      );
      setItems(itemsWithVoteStatus);
    } catch (error) {
      console.error('Error fetching menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (itemId) => {
    try {
      const response = await axios.post(`/api/menu/${itemId}/vote`);
      setItems(items.map(item => 
        item.id === itemId 
          ? { ...item, votes: response.data.votes, rating: response.data.rating, hasVoted: response.data.has_voted }
          : item
      ));
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const filteredItems = filter === 'All' 
    ? items 
    : items.filter(item => item.category === filter);

  const categories = [
    { id: 'All', icon: '📋', label: 'All' },
    { id: 'Hot', icon: '☕', label: 'Hot' },
    { id: 'Cold', icon: '🧊', label: 'Cold' }
  ];

  if (loading) {
    return <div className="loading">⏳ Loading menu...</div>;
  }

  return (
    <div className="menu-container">
      <div className="menu-header">
        <div className="menu-title">
          <h1>☕ Our Menu</h1>
          <p className="menu-subtitle">Discover our premium coffee selection</p>
        </div>
        <div className="filter-section">
          <span className="filter-icon">🔍</span>
          <div className="filter-buttons">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`filter-btn ${filter === cat.id ? 'active' : ''}`}
                onClick={() => setFilter(cat.id)}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="menu-grid">
        {filteredItems.length > 0 ? (
          filteredItems.map(item => (
            <MenuItem
              key={item.id}
              item={item}
              onVote={handleVote}
              user={user}
            />
          ))
        ) : (
          <div className="no-items">No items found</div>
        )}
      </div>
    </div>
  );
}

export default Menu;