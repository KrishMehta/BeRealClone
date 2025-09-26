#!/bin/bash

# BeReal Clone - Multi-User Deployment Script
echo "🚀 Starting BeReal Clone Multi-User App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if MongoDB is running (optional check)
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB not found in PATH. Make sure MongoDB is installed and running."
    echo "   You can install MongoDB from: https://www.mongodb.com/try/download/community"
fi

# Create uploads directories
echo "📁 Creating upload directories..."
mkdir -p uploads/avatars
mkdir -p uploads/posts

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists, if not create one
if [ ! -f .env ]; then
    echo "⚙️  Creating .env file..."
    cat > .env << EOF
# Database
MONGODB_URI=mongodb://localhost:27017/berealclone

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here-$(date +%s)

# Server Configuration
PORT=3000
NODE_ENV=development

# Client URL (for CORS)
CLIENT_URL=http://localhost:19006

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads
EOF
    echo "✅ Created .env file with default values"
fi

# Start the application
echo "🎯 Starting the application..."
echo "   - Backend server will run on http://localhost:3000"
echo "   - Frontend will run on http://localhost:19006"
echo "   - Make sure MongoDB is running on mongodb://localhost:27017"
echo ""
echo "📱 To test the app:"
echo "   1. Open Expo Go on your phone"
echo "   2. Scan the QR code that appears"
echo "   3. Or run 'npm run web' to test in browser"
echo ""

# Start both backend and frontend concurrently
npm run dev
