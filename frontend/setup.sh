#!/bin/bash

# Create backend
echo "Setting up backend..."
mkdir -p backend
cd backend

# Create requirements.txt
cat > requirements.txt << 'EOF'
Flask==2.3.2
Flask-CORS==4.0.0
Flask-SQLAlchemy==3.0.5
Flask-Login==0.6.2
bcrypt==4.0.1
python-dotenv==1.0.0
EOF

# Copy app.py content here (use the updated app.py from above)
# You can create the file manually with the content provided above

cd ..

# Create frontend
echo "Setting up frontend..."
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install axios react-router-dom

# Update vite.config.js
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
EOF

cd ..

echo "Setup complete!"
echo "To start the backend: cd backend && python app.py"
echo "To start the frontend: cd frontend && npm run dev"