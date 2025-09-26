module.exports = {
  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/berealclone',
  
  // JWT Secret
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
  
  // Server Configuration
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Client URL (for CORS)
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:19006',
  
  // File Upload Configuration
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
  UPLOAD_PATH: process.env.UPLOAD_PATH || 'uploads'
};
