const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'blocked'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure unique friend relationships
friendSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Update the updatedAt field before saving
friendSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get friends for a user
friendSchema.statics.getFriends = function(userId) {
  return this.find({
    $or: [
      { requester: userId, status: 'accepted' },
      { recipient: userId, status: 'accepted' }
    ]
  }).populate('requester recipient', 'username avatar isOnline lastSeen');
};

// Static method to get pending friend requests
friendSchema.statics.getPendingRequests = function(userId) {
  return this.find({
    recipient: userId,
    status: 'pending'
  }).populate('requester', 'username avatar');
};

// Static method to get sent friend requests
friendSchema.statics.getSentRequests = function(userId) {
  return this.find({
    requester: userId,
    status: 'pending'
  }).populate('recipient', 'username avatar');
};

// Static method to check if users are friends
friendSchema.statics.areFriends = function(userId1, userId2) {
  return this.findOne({
    $or: [
      { requester: userId1, recipient: userId2, status: 'accepted' },
      { requester: userId2, recipient: userId1, status: 'accepted' }
    ]
  });
};

// Static method to get mutual friends
friendSchema.statics.getMutualFriends = async function(userId1, userId2) {
  const user1Friends = await this.getFriends(userId1);
  const user2Friends = await this.getFriends(userId2);
  
  const user1FriendIds = user1Friends.map(f => 
    f.requester._id.toString() === userId1.toString() 
      ? f.recipient._id.toString() 
      : f.requester._id.toString()
  );
  
  const user2FriendIds = user2Friends.map(f => 
    f.requester._id.toString() === userId2.toString() 
      ? f.recipient._id.toString() 
      : f.requester._id.toString()
  );
  
  const mutualFriendIds = user1FriendIds.filter(id => user2FriendIds.includes(id));
  
  return this.find({
    $or: [
      { requester: { $in: mutualFriendIds }, recipient: userId1, status: 'accepted' },
      { requester: userId1, recipient: { $in: mutualFriendIds }, status: 'accepted' }
    ]
  }).populate('requester recipient', 'username avatar');
};

module.exports = mongoose.model('Friend', friendSchema);
