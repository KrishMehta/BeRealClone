# BeReal Clone - Multi-User Social Media App

A full-stack React Native application that replicates the core functionality of BeReal with multi-user support, built using Expo, Express.js, and MongoDB.

## 🚀 Quick Start

```bash
# 1. Clone and setup
git clone <repository-url>
cd BeRealClone
npm install

# 2. Setup MongoDB Atlas (see detailed instructions below)
# Create account at https://www.mongodb.com/atlas
# Get your connection string

# 3. Create environment file
cat > .env << 'EOF'
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/?retryWrites=true&w=majority&appName=BeRealClone
JWT_SECRET=your-super-secret-jwt-key-here
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:19006
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads
EOF

# 4. Create directories and run
mkdir -p uploads/avatars uploads/posts
chmod +x run.sh
./run.sh

# 5. Test the app
# - Install Expo Go on your phone
# - Scan the QR code
# - Or visit http://localhost:19006 in browser
```

## Features

### Core BeReal Features
- **Dual Camera Capture**: Take both front and back photos simultaneously
- **Daily Posting**: One post per day limit with countdown timer
- **Real-time Feed**: View posts from friends and public users
- **Photo Sharing**: Share posts with friends or publicly

### Multi-User Features
- **User Authentication**: Register, login, and secure JWT-based sessions
- **User Profiles**: Customizable profiles with avatars, bios, and stats
- **Friend System**: Send/accept friend requests, manage friends list
- **Privacy Controls**: Control who can see your posts and location
- **Real-time Notifications**: Get notified of likes, comments, and friend requests
- **Discovery**: Find and connect with nearby users or mutual friends
- **Location Services**: Optional location sharing for discovery features

## Tech Stack

### Frontend
- **React Native** with Expo
- **TypeScript** for type safety
- **Context API** for state management
- **AsyncStorage** for local data persistence
- **Expo Camera** and **Image Picker** for photo capture
- **Expo Location** for location services

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Socket.io** for real-time features
- **Multer** for file uploads
- **bcryptjs** for password hashing

## Prerequisites

Before running the application, make sure you have:

1. **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
2. **npm** (comes with Node.js)
3. **MongoDB Atlas Account** (free) - [Sign up here](https://www.mongodb.com/atlas)
4. **Expo Go** app on your mobile device - [iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd BeRealClone
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up MongoDB Atlas (Recommended)

#### Option A: Use MongoDB Atlas (Cloud - Easier)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster (choose the free M0 tier)
4. Create a database user:
   - Go to "Database Access" → "Add New Database User"
   - Choose "Password" authentication
   - Create username and password (save these!)
5. Whitelist your IP address:
   - Go to "Network Access" → "Add IP Address"
   - Click "Add Current IP Address" or "Allow Access from Anywhere" (0.0.0.0/0)
6. Get your connection string:
   - Go to "Clusters" → "Connect" → "Connect your application"
   - Copy the connection string (it looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

#### Option B: Use Local MongoDB
```bash
# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community

# Windows: Download from https://www.mongodb.com/try/download/community
# Linux: Follow instructions at https://docs.mongodb.com/manual/installation/
```

### 4. Set Up Environment Variables
Create a `.env` file in the root directory:

**For MongoDB Atlas:**
```env
# Database Configuration - MongoDB Atlas
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/?retryWrites=true&w=majority&appName=BeRealClone

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-here

# Server Configuration
PORT=3000
NODE_ENV=development

# Client URL (for CORS)
CLIENT_URL=http://localhost:19006

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads
```

**For Local MongoDB:**
```env
# Database Configuration - Local MongoDB
MONGODB_URI=mongodb://localhost:27017/berealclone

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-here

# Server Configuration
PORT=3000
NODE_ENV=development

# Client URL (for CORS)
CLIENT_URL=http://localhost:19006

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads
```

### 5. Create Upload Directories
```bash
mkdir -p uploads/avatars
mkdir -p uploads/posts
```

### 6. Make Scripts Executable
```bash
chmod +x run.sh
```

## Running the Application

### Option 1: Using the Deployment Script (Recommended)
```bash
./run.sh
```
This will:
- Start the backend server on `http://localhost:3000`
- Start the frontend on `http://localhost:19006`
- Show QR code for mobile testing

### Option 2: Manual Setup
```bash
# Terminal 1 - Start the backend server
npm run server

# Terminal 2 - Start the frontend
npx expo start
```

### Option 3: Development Mode (Both servers concurrently)
```bash
npm run dev
```

## Testing the Application

### Mobile Testing (Recommended)
1. Install **Expo Go** on your mobile device:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. Start the application using one of the methods above
3. Scan the QR code that appears in your terminal with Expo Go
4. The app will load on your device

### Web Testing
```bash
npx expo start --web
```
Then open your browser and navigate to `http://localhost:19006`

### Verify Setup
- **Backend API**: Visit `http://localhost:3000/api/health` - should return `{"status":"OK"}`
- **Frontend**: Visit `http://localhost:19006` - should show the app
- **Database**: Check MongoDB Atlas dashboard for new collections

## 🎯 First Time Setup Guide

### What Happens When You First Run the App

1. **Database Collections**: The app will automatically create these collections in your MongoDB Atlas database:
   - `users` - User accounts and profiles
   - `posts` - User posts and media
   - `friends` - Friend relationships and requests
   - `notifications` - Real-time notifications

2. **User Registration**: 
   - Open the app and tap "Sign up"
   - Create your first account
   - Upload a profile picture
   - Set your bio and preferences

3. **Testing Core Features**:
   - **Camera**: Take dual photos (front + back)
   - **Posts**: Create your first BeReal post
   - **Friends**: Add friends by username
   - **Feed**: View posts from friends
   - **Profile**: Customize your profile

4. **Multi-User Testing**:
   - Create multiple accounts on different devices
   - Send friend requests between accounts
   - Test real-time notifications
   - Try the discovery features

### Expected Behavior

- **Login Screen**: Clean, modern interface with email/password fields
- **Camera Screen**: Dual camera interface with photo capture
- **Feed Screen**: Timeline of posts from friends
- **Friends Screen**: Manage friend requests and connections
- **Profile Screen**: Edit profile, view stats, logout option
- **Real-time Updates**: Instant notifications for likes, comments, friend requests

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/avatar` - Upload avatar
- `GET /api/users/search/:query` - Search users
- `GET /api/users/nearby` - Get nearby users

### Posts
- `POST /api/posts` - Create new post
- `GET /api/posts/feed` - Get feed posts
- `GET /api/posts/user/:userId` - Get user posts
- `POST /api/posts/:postId/like` - Like a post
- `DELETE /api/posts/:postId/like` - Unlike a post
- `POST /api/posts/:postId/comment` - Add comment
- `POST /api/posts/:postId/share` - Share a post

### Friends
- `POST /api/friends/request` - Send friend request
- `POST /api/friends/accept/:requestId` - Accept friend request
- `POST /api/friends/reject/:requestId` - Reject friend request
- `GET /api/friends` - Get friends list
- `GET /api/friends/pending` - Get pending requests
- `DELETE /api/friends/:friendId` - Remove friend

### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/mark-all-read` - Mark all as read

## Project Structure

```
BeRealClone/
├── src/
│   ├── components/          # Reusable UI components
│   ├── contexts/           # React Context providers
│   ├── screens/            # Main app screens
│   └── services/           # API service layer
├── server/
│   ├── models/             # MongoDB models
│   ├── routes/             # API route handlers
│   ├── middleware/         # Custom middleware
│   └── index.js            # Server entry point
├── uploads/                # File upload directory
├── run.sh                  # Deployment script
└── package.json
```

## Key Features Implementation

### Authentication Flow
1. User registers with username, email, and password
2. JWT token is generated and stored securely
3. Token is included in all API requests
4. User session persists across app restarts

### Post Creation
1. User takes front and back photos
2. Images are uploaded to server with metadata
3. Post is created with privacy settings
4. Friends are notified of new post

### Friend System
1. Users can search for other users by username
2. Friend requests are sent and managed
3. Mutual friends are calculated and displayed
4. Privacy settings control friend visibility

### Real-time Features
1. Socket.io handles real-time notifications
2. Users receive instant updates for likes, comments
3. Friend request notifications are pushed immediately
4. Online status is tracked and displayed

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Input Validation**: Server-side validation for all inputs
- **File Upload Security**: Type and size validation for uploads
- **CORS Protection**: Configured for specific origins
- **Rate Limiting**: Prevents API abuse

## Privacy & Permissions

- **Location Privacy**: Users can control location sharing
- **Post Visibility**: Choose between public, friends, or private
- **Profile Privacy**: Control who can see profile information
- **Friend Discovery**: Opt-in for discovery features

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - **Atlas**: Check your connection string in `.env`
   - **Atlas**: Verify your IP is whitelisted in Network Access
   - **Atlas**: Ensure your database user has proper permissions
   - **Local**: Ensure MongoDB is running (`brew services start mongodb/brew/mongodb-community`)

2. **Port Already in Use**
   ```bash
   # Check what's using port 3000
   lsof -i :3000
   
   # Kill the process if needed
   kill -9 <PID>
   ```

3. **Expo App Won't Load**
   - Ensure both servers are running
   - Check network connectivity
   - Try clearing Expo cache: `npx expo start -c`
   - Make sure you're using the correct QR code

4. **Image Upload Fails**
   - Check uploads directory permissions: `ls -la uploads/`
   - Verify file size limits in `.env`
   - Ensure directories exist: `mkdir -p uploads/avatars uploads/posts`

5. **Authentication Issues**
   - Check JWT_SECRET in `.env` file
   - Verify token expiration settings
   - Clear app data and try logging in again

6. **Permission Errors (macOS)**
   ```bash
   # Fix npm permissions
   sudo chown -R $(whoami) ~/.npm
   
   # Or use npx instead of global installs
   npx expo start
   ```

### Development Tips

- **Debugging**: Use React Native Debugger or Expo DevTools
- **Logs**: Check server logs in terminal for API errors
- **Database**: Use MongoDB Compass to view your data
- **Testing**: Test on both iOS and Android devices
- **Performance**: Use Expo DevTools for performance monitoring

### Quick Fixes

```bash
# Reset everything
rm -rf node_modules package-lock.json
npm install
npx expo start -c

# Check if servers are running
curl http://localhost:3000/api/health
curl http://localhost:19006

# View MongoDB collections
mongosh "your-connection-string"
use berealclone
show collections
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational purposes. Please respect BeReal's terms of service and intellectual property.

## Future Enhancements

- Push notifications for mobile
- Video support for posts
- Advanced privacy controls
- Group features
- Story functionality
- Enhanced discovery algorithms
- Analytics dashboard
- Admin panel

---

**Note**: This is a clone/educational project. BeReal is a trademark of BeReal Inc. This project is not affiliated with or endorsed by BeReal Inc.