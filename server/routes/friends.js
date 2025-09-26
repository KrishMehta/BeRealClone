const express = require('express');
const Friend = require('../models/Friend');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const router = express.Router();

// Send friend request
router.post('/request', auth, async (req, res) => {
  try {
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ message: 'Recipient ID is required' });
    }

    if (recipientId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already friends or request already exists
    const existingRelationship = await Friend.findOne({
      $or: [
        { requester: req.user._id, recipient: recipientId },
        { requester: recipientId, recipient: req.user._id }
      ]
    });

    if (existingRelationship) {
      if (existingRelationship.status === 'accepted') {
        return res.status(400).json({ message: 'Already friends' });
      } else if (existingRelationship.status === 'pending') {
        return res.status(400).json({ message: 'Friend request already sent' });
      } else {
        return res.status(400).json({ message: 'User is blocked' });
      }
    }

    // Create friend request
    const friendRequest = new Friend({
      requester: req.user._id,
      recipient: recipientId,
      status: 'pending'
    });

    await friendRequest.save();

    // Send notification to recipient
    await Notification.createNotification(
      recipientId,
      req.user._id,
      'friend_request',
      'New Friend Request',
      `${req.user.username} sent you a friend request`,
      { requesterId: req.user._id }
    );

    res.status(201).json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept friend request
router.post('/accept/:requestId', auth, async (req, res) => {
  try {
    const friendRequest = await Friend.findById(req.params.requestId);
    
    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (friendRequest.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Friend request already processed' });
    }

    // Update friend request status
    friendRequest.status = 'accepted';
    await friendRequest.save();

    // Update friends count for both users
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.friendsCount': 1 }
    });
    await User.findByIdAndUpdate(friendRequest.requester, {
      $inc: { 'stats.friendsCount': 1 }
    });

    // Send notification to requester
    await Notification.createNotification(
      friendRequest.requester,
      req.user._id,
      'friend_accepted',
      'Friend Request Accepted',
      `${req.user.username} accepted your friend request`,
      { recipientId: req.user._id }
    );

    res.json({ message: 'Friend request accepted successfully' });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject friend request
router.post('/reject/:requestId', auth, async (req, res) => {
  try {
    const friendRequest = await Friend.findById(req.params.requestId);
    
    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    if (friendRequest.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (friendRequest.status !== 'pending') {
      return res.status(400).json({ message: 'Friend request already processed' });
    }

    // Delete the friend request
    await Friend.findByIdAndDelete(req.params.requestId);

    res.json({ message: 'Friend request rejected successfully' });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get friends list
router.get('/', auth, async (req, res) => {
  try {
    const friends = await Friend.getFriends(req.user._id);
    res.json({ friends });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending friend requests
router.get('/pending', auth, async (req, res) => {
  try {
    const pendingRequests = await Friend.getPendingRequests(req.user._id);
    res.json({ pendingRequests });
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get sent friend requests
router.get('/sent', auth, async (req, res) => {
  try {
    const sentRequests = await Friend.getSentRequests(req.user._id);
    res.json({ sentRequests });
  } catch (error) {
    console.error('Get sent requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove friend
router.delete('/:friendId', auth, async (req, res) => {
  try {
    const friendRelationship = await Friend.findOne({
      $or: [
        { requester: req.user._id, recipient: req.params.friendId },
        { requester: req.params.friendId, recipient: req.user._id }
      ],
      status: 'accepted'
    });

    if (!friendRelationship) {
      return res.status(404).json({ message: 'Friend relationship not found' });
    }

    // Delete the friend relationship
    await Friend.findByIdAndDelete(friendRelationship._id);

    // Update friends count for both users
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.friendsCount': -1 }
    });
    await User.findByIdAndUpdate(req.params.friendId, {
      $inc: { 'stats.friendsCount': -1 }
    });

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get mutual friends
router.get('/mutual/:userId', auth, async (req, res) => {
  try {
    const mutualFriends = await Friend.getMutualFriends(req.user._id, req.params.userId);
    res.json({ mutualFriends });
  } catch (error) {
    console.error('Get mutual friends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Block user
router.post('/block/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot block yourself' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove any existing relationship
    await Friend.findOneAndDelete({
      $or: [
        { requester: req.user._id, recipient: userId },
        { requester: userId, recipient: req.user._id }
      ]
    });

    // Create block relationship
    const blockRelationship = new Friend({
      requester: req.user._id,
      recipient: userId,
      status: 'blocked'
    });

    await blockRelationship.save();

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unblock user
router.delete('/block/:userId', auth, async (req, res) => {
  try {
    const blockRelationship = await Friend.findOne({
      requester: req.user._id,
      recipient: req.params.userId,
      status: 'blocked'
    });

    if (!blockRelationship) {
      return res.status(404).json({ message: 'Block relationship not found' });
    }

    await Friend.findByIdAndDelete(blockRelationship._id);

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
