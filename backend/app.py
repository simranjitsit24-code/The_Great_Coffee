from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import bcrypt
import secrets
import os

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', secrets.token_hex(16))

# Database configuration
database_url = os.environ.get('DATABASE_URL', 'sqlite:///coffee_shop.db')
if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Session configuration
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'None'

# ============ FIX CORS ============
# Get allowed origins from environment or use defaults
allowed_origins = os.environ.get('CORS_ORIGINS', 'https://the-great-coffee-1.onrender.com,http://localhost:5173,http://localhost:5174').split(',')

CORS(app, 
     supports_credentials=True, 
     origins=allowed_origins,
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
     expose_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'])

db = SQLAlchemy(app)

# Models
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class MenuItem(db.Model):
    __tablename__ = 'menu_items'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price_small = db.Column(db.Float)
    price_large = db.Column(db.Float)
    image_url = db.Column(db.String(500))
    category = db.Column(db.String(50))
    rating = db.Column(db.Float, default=0)
    votes = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Vote(db.Model):
    __tablename__ = 'votes'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('menu_items.id'), nullable=False)
    voted_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('user_id', 'item_id', name='unique_user_item_vote'),)

# Create tables and seed data
with app.app_context():
    db.create_all()
    
    if MenuItem.query.count() == 0:
        sample_items = [
            ('Hot Coffee', 'Premium roasted coffee', 4.00, 5.50, 
             'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop', 
             'Hot', 4.8, 4800),
            ('Cold Brew', 'Smooth cold brew coffee', 5.75, 7.25, 
             'https://images.unsplash.com/photo-1517701604599-bb29b880090f?w=400&h=300&fit=crop', 
             'Cold', 3.2, 3200),
            ('Caramel Latte', 'Smooth espresso blended with creamy milk and rich caramel flavor for a perfect balance of sweetness and boldness.', 
             6.50, 8.50, 
             'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop', 
             'Hot', 5.0, 5000),
            ('Vanilla Cappuccino', 'Rich cappuccino with vanilla', 5.75, 7.25, 
             'https://images.unsplash.com/photo-1517957754642-2870518e16f8?w=400&h=300&fit=crop', 
             'Hot', 2.7, 2700),
            ('Hazelnut Mocha', 'Chocolate and hazelnut blend', 6.00, 8.00, 
             'https://images.unsplash.com/photo-1559563362-c667ba5f5480?w=400&h=300&fit=crop', 
             'Hot', 4.2, 4200),
            ('Espresso Macchiato', 'Bold espresso with milk foam', 4.00, 5.50, 
             'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=300&fit=crop', 
             'Hot', 3.8, 3800)
        ]
        
        for item in sample_items:
            menu_item = MenuItem(
                name=item[0],
                description=item[1],
                price_small=item[2],
                price_large=item[3],
                image_url=item[4],
                category=item[5],
                rating=item[6],
                votes=item[7]
            )
            db.session.add(menu_item)
        
        db.session.commit()
        print("✅ Sample menu items added!")

def get_current_user():
    user_id = session.get('user_id')
    if user_id:
        return User.query.get(user_id)
    return None

# Routes
@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'message': '☕ Coffee Shop API is running!',
        'status': 'healthy',
        'version': '1.0.0',
        'endpoints': {
            'auth': {
                'register': '/api/register [POST]',
                'login': '/api/login [POST]',
                'logout': '/api/logout [POST]',
                'current_user': '/api/current_user [GET]'
            },
            'menu': {
                'list': '/api/menu [GET]',
                'vote': '/api/menu/<id>/vote [POST]',
                'vote_status': '/api/menu/<id>/vote_status [GET]'
            },
            'health': '/health [GET]'
        }
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'port': os.environ.get('PORT', '5000'),
        'environment': os.environ.get('FLASK_ENV', 'development'),
        'database': 'connected'
    })

@app.route('/api/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not username or not email or not password:
            return jsonify({'error': 'All fields are required'}), 400
        
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already exists'}), 400
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already exists'}), 400
        
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        user = User(username=username, email=email, password_hash=hashed.decode('utf-8'))
        db.session.add(user)
        db.session.commit()
        
        return jsonify({'message': 'User created successfully'}), 201
    
    except Exception as e:
        print(f"Registration error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400
        
        user = User.query.filter_by(username=username).first()
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        session['user_id'] = user.id
        
        return jsonify({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }), 200
    
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/logout', methods=['POST', 'OPTIONS'])
def logout():
    if request.method == 'OPTIONS':
        return '', 200
    
    session.pop('user_id', None)
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/api/current_user', methods=['GET', 'OPTIONS'])
def get_current_user_route():
    if request.method == 'OPTIONS':
        return '', 200
    
    user = get_current_user()
    if user:
        return jsonify({
            'id': user.id,
            'username': user.username,
            'email': user.email
        }), 200
    return jsonify({'error': 'Not logged in'}), 401

@app.route('/api/menu', methods=['GET', 'OPTIONS'])
def get_menu():
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        items = MenuItem.query.all()
        return jsonify([{
            'id': item.id,
            'name': item.name,
            'description': item.description,
            'price_small': item.price_small,
            'price_large': item.price_large,
            'image_url': item.image_url,
            'category': item.category,
            'rating': item.rating,
            'votes': item.votes
        } for item in items])
    except Exception as e:
        print(f"Menu error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/menu/<int:item_id>/vote', methods=['POST', 'OPTIONS'])
def vote_item(item_id):
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'Please login first'}), 401
        
        item = MenuItem.query.get(item_id)
        if not item:
            return jsonify({'error': 'Item not found'}), 404
        
        existing_vote = Vote.query.filter_by(user_id=user.id, item_id=item_id).first()
        
        if existing_vote:
            db.session.delete(existing_vote)
            item.votes -= 1
            if item.votes > 0:
                item.rating = max(0, round(item.rating - 0.2, 1))
            else:
                item.rating = 0
        else:
            vote = Vote(user_id=user.id, item_id=item_id)
            db.session.add(vote)
            item.votes += 1
            item.rating = min(5.0, round(item.rating + 0.2, 1))
        
        db.session.commit()
        
        return jsonify({
            'votes': item.votes,
            'rating': item.rating,
            'has_voted': not bool(existing_vote)
        }), 200
    except Exception as e:
        print(f"Vote error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/menu/<int:item_id>/vote_status', methods=['GET', 'OPTIONS'])
def get_vote_status(item_id):
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        user = get_current_user()
        if not user:
            return jsonify({'has_voted': False}), 200
        
        vote = Vote.query.filter_by(user_id=user.id, item_id=item_id).first()
        return jsonify({'has_voted': bool(vote)}), 200
    except Exception as e:
        print(f"Vote status error: {str(e)}")
        return jsonify({'has_voted': False}), 200

@app.after_request
def after_request(response):
    # Get the origin from the request
    origin = request.headers.get('Origin')
    
    # List of allowed origins (same as CORS configuration)
    allowed_origins = os.environ.get('CORS_ORIGINS', 'https://the-great-coffee-1.onrender.com,http://localhost:5173,http://localhost:5174').split(',')
    
    # If the origin is allowed, add the CORS headers
    if origin in allowed_origins:
        response.headers.add('Access-Control-Allow-Origin', origin)
    elif '*' in allowed_origins:
        response.headers.add('Access-Control-Allow-Origin', '*')
    
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,PUT,DELETE')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# For Gunicorn
application = app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    print(f"🚀 Starting server on port {port}")
    print(f"🔗 Access at: http://0.0.0.0:{port}")
    print(f"🐛 Debug mode: {debug}")
    app.run(debug=debug, host='0.0.0.0', port=port)
