const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  bio: {
    type: String,
    maxlength: 150,
    default: 'Add a bio to your profile'
  },
  avatar: {
    type: String,
    default: ''
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  location: {
    latitude: Number,
    longitude: Number,
    city: String,
    country: String
  },
  privacy: {
    showLocation: {
      type: Boolean,
      default: true
    },
    showLastSeen: {
      type: Boolean,
      default: true
    },
    allowFriendRequests: {
      type: Boolean,
      default: true
    },
    allowDiscovery: {
      type: Boolean,
      default: true
    }
  },
  stats: {
    totalPosts: {
      type: Number,
      default: 0
    },
    streak: {
      type: Number,
      default: 0
    },
    friendsCount: {
      type: Number,
      default: 0
    }
  },
  preferences: {
    notifications: {
      friendRequests: {
        type: Boolean,
        default: true
      },
      newPosts: {
        type: Boolean,
        default: true
      },
      comments: {
        type: Boolean,
        default: true
      },
      likes: {
        type: Boolean,
        default: true
      }
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update last seen
userSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  this.isOnline = true;
  return this.save();
};

// Get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  const userObj = this.toObject();
  delete userObj.password;
  delete userObj.email;
  return userObj;
};

// Index for search
userSchema.index({ username: 'text', bio: 'text' });
userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);
