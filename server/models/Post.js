const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  frontImage: {
    type: String,
    required: true
  },
  backImage: {
    type: String,
    required: true
  },
  caption: {
    type: String,
    maxlength: 200,
    default: ''
  },
  location: {
    latitude: Number,
    longitude: Number,
    city: String,
    country: String
  },
  visibility: {
    type: String,
    enum: ['public', 'friends', 'private'],
    default: 'friends'
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: 200
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  shares: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDailyPost: {
    type: Boolean,
    default: true
  },
  postedAt: {
    type: Date,
    required: true
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Posts expire after 24 hours
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
postSchema.index({ author: 1, postedAt: -1 });
postSchema.index({ visibility: 1, postedAt: -1 });
postSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for share count
postSchema.virtual('shareCount').get(function() {
  return this.shares.length;
});

// Method to add like
postSchema.methods.addLike = function(userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString());
  if (!existingLike) {
    this.likes.push({ user: userId });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove like
postSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  return this.save();
};

// Method to add comment
postSchema.methods.addComment = function(userId, text) {
  this.comments.push({ user: userId, text });
  return this.save();
};

// Method to add share
postSchema.methods.addShare = function(userId) {
  this.shares.push({ user: userId });
  return this.save();
};

// Ensure virtual fields are serialized
postSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Post', postSchema);
