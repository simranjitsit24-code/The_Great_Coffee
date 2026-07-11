import sqlite3
from datetime import datetime

def get_db_connection():
    conn = sqlite3.connect('coffee_shop.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create menu items table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS menu_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price_small REAL,
            price_large REAL,
            image_url TEXT,
            category TEXT,
            rating REAL DEFAULT 0,
            votes INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create votes table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS votes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            item_id INTEGER NOT NULL,
            voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (item_id) REFERENCES menu_items (id),
            UNIQUE(user_id, item_id)
        )
    ''')
    
    # Insert sample menu items
    sample_items = [
        ('Hot Coffee', 'Premium roasted coffee', 4.00, 5.50, '☕', 'Hot', 4.8, 4800),
        ('Cold Brew', 'Smooth cold brew coffee', 5.75, 7.25, '🧊', 'Cold', 3.2, 3200),
        ('Caramel Latte', 'Smooth espresso blended with creamy milk and rich caramel flavor for a perfect balance of sweetness and boldness.', 6.50, 8.50, '☕', 'Hot', 5.0, 5000),
        ('Vanilla Cappuccino', 'Rich cappuccino with vanilla', 5.75, 7.25, '☕', 'Hot', 2.7, 2700),
        ('Hazelnut Mocha', 'Chocolate and hazelnut blend', 6.00, 8.00, '☕', 'Hot', 4.2, 4200),
        ('Espresso Macchiato', 'Bold espresso with milk foam', 4.00, 5.50, '☕', 'Hot', 3.8, 3800)
    ]
    
    for item in sample_items:
        cursor.execute('''
            INSERT OR IGNORE INTO menu_items 
            (name, description, price_small, price_large, image_url, category, rating, votes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', item)
    
    conn.commit()
    conn.close()
    print("Database initialized successfully!")

if __name__ == '__main__':
    init_database()