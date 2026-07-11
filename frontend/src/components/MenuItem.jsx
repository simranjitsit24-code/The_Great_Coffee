import React from 'react';
import './MenuItem.css';

// Import local images - match your actual filenames
import hotCoffee from '../images/hot-coffee.jpg';
import coldBrew from '../images/cold-brew.jpg';
import caramelLatte from '../images/caramel-latte.jpg';
import vanillaCappuccino from '../images/vanilla-cappuccino.jpg';
import hazelnutMocha from '../images/hazelnut-mocha.jpg';
import espressoMacchiato from '../images/espresso-macchiato.jpg';

// If you have different filenames, use these imports instead:
// import hotCoffee from '../images/hot_coffee.jpg';
// import coldBrew from '../images/cold_brew.jpg';
// import caramelLatte from '../images/caramel_latte.jpg';
// import vanillaCappuccino from '../images/vanilla_cappuccin.jpg';
// import hazelnutMocha from '../images/hazelnut_mocha.jpg';
// import espressoMacchiato from '../images/espresso_macchiato.jpg';

function MenuItem({ item, onVote, user }) {
  const handleVoteClick = () => {
    if (user) {
      onVote(item.id);
    }
  };

  // Map item names to imported images
  const imageMap = {
    'Hot Coffee': hotCoffee,
    'Cold Brew': coldBrew,
    'Caramel Latte': caramelLatte,
    'Vanilla Cappuccino': vanillaCappuccino,
    'Hazelnut Mocha': hazelnutMocha,
    'Espresso Macchiato': espressoMacchiato
  };

  // Fallback images if primary fails
  const fallbackImage = hotCoffee;

  // Get the image source
  const getImageSrc = () => {
    // First try to get from map by name
    if (imageMap[item.name]) {
      return imageMap[item.name];
    }
    
    // If not found, try to match by filename pattern
    if (item.image_url) {
      // If it's a local path like /images/cold-brew.jpg
      if (item.image_url.startsWith('/images/')) {
        const filename = item.image_url.split('/').pop().replace('.jpg', '');
        // Try to find matching image
        for (const [key, value] of Object.entries(imageMap)) {
          if (key.toLowerCase().includes(filename.replace('-', ' '))) {
            return value;
          }
        }
      }
      return item.image_url;
    }
    
    return fallbackImage;
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
      stars += '⭐';
    }
    if (hasHalfStar) {
      stars += '⭐';
    }
    const totalStars = Math.floor((stars.length) / 2);
    for (let i = 0; i < 5 - totalStars; i++) {
      stars += '☆';
    }
    
    return stars;
  };

  const getCategoryEmoji = (category) => {
    switch(category?.toLowerCase()) {
      case 'hot':
        return '☕';
      case 'cold':
        return '🧊';
      default:
        return '☕';
    }
  };

  return (
    <div className="menu-item-card">
      <div className="image-container">
        <img 
          src={getImageSrc()} 
          alt={item.name}
          className="coffee-image"
          onError={(e) => {
            // If image fails, try fallback
            e.target.src = fallbackImage;
          }}
        />
        <div className="category-badge">
          <span>{getCategoryEmoji(item.category)}</span>
          <span>{item.category}</span>
        </div>
      </div>
      
      <div className="content">
        <div className="header">
          <h3>{item.name}</h3>
          <div className="rating">
            <div className="stars" style={{ fontSize: '1rem' }}>{renderStars(item.rating)}</div>
            <span className="rating-number">{item.rating.toFixed(1)}</span>
          </div>
        </div>
        
        <p className="description">{item.description}</p>
        
        <div className="prices">
          {item.price_small && (
            <span className="price-tag">
              💰 Small: ${item.price_small.toFixed(2)}
            </span>
          )}
          {item.price_large && (
            <span className="price-tag">
              💰 Large: ${item.price_large.toFixed(2)}
            </span>
          )}
        </div>
        
        <div className="footer">
          <div className="vote-section">
            <button 
              className={`vote-btn ${item.hasVoted ? 'voted' : ''}`}
              onClick={handleVoteClick}
              disabled={!user}
            >
              {item.hasVoted ? '❤️' : '🤍'} 
              <span>{item.hasVoted ? 'Voted' : 'Vote'}</span>
            </button>
            <span className="vote-count">
              ❤️ {item.votes} votes
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MenuItem;