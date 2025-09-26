const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Post = require('../models/Post');
const User = require('../models/User');
const Friend = require('../models/Friend');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/posts';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `post-${req.user._id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit per file
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Create a new post
router.post('/', auth, upload.fields([
  { name: 'frontImage', maxCount: 1 },
  { name: 'backImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const { caption, visibility = 'friends', location } = req.body;

    if (!req.files.frontImage || !req.files.backImage) {
      return res.status(400).json({ message: 'Both front and back images are required' });
    }

    // Check if user has already posted today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingPost = await Post.findOne({
      author: req.user._id,
      postedAt: { $gte: today, $lt: tomorrow }
    });

    if (existingPost) {
      return res.status(400).json({ message: 'You can only post once per day' });
    }

    const frontImagePath = `/uploads/posts/${req.files.frontImage[0].filename}`;
    const backImagePath = `/uploads/posts/${req.files.backImage[0].filename}`;

    const post = new Post({
      author: req.user._id,
      frontImage: frontImagePath,
      backImage: backImagePath,
      caption,
      visibility,
      location: location ? JSON.parse(location) : undefined,
      postedAt: new Date()
    });

    await post.save();

    // Update user's post count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.totalPosts': 1 }
    });

    // Populate author info
    await post.populate('author', 'username avatar');

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get feed posts
router.get('/feed', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get user's friends
    const friends = await Friend.getFriends(req.user._id);
    const friendIds = friends.map(f => 
      f.requester._id.toString() === req.user._id.toString() 
        ? f.recipient._id.toString() 
        : f.requester._id.toString()
    );

    // Get posts from friends and user's own posts
    const posts = await Post.find({
      $or: [
        { author: req.user._id },
        { 
          author: { $in: friendIds },
          visibility: { $in: ['friends', 'public'] }
        },
        { visibility: 'public' }
      ]
    })
    .populate('author', 'username avatar')
    .populate('likes.user', 'username avatar')
    .populate('comments.user', 'username avatar')
    .sort({ postedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    res.json({ posts });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's posts
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Check if user is viewing their own posts or a friend's posts
    const isOwnPosts = userId === req.user._id.toString();
    const isFriend = await Friend.areFriends(req.user._id, userId);

    if (!isOwnPosts && !isFriend) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const posts = await Post.find({ author: userId })
      .populate('author', 'username avatar')
      .populate('likes.user', 'username avatar')
      .populate('comments.user', 'username avatar')
      .sort({ postedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ posts });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like a post
router.post('/:postId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await post.addLike(req.user._id);

    // Send notification to post author if not the current user
    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.createNotification(
        post.author,
        req.user._id,
        'post_liked',
        'New Like',
        `${req.user.username} liked your post`,
        { postId: post._id }
      );
    }

    res.json({ message: 'Post liked successfully' });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unlike a post
router.delete('/:postId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await post.removeLike(req.user._id);
    res.json({ message: 'Post unliked successfully' });
  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to post
router.post('/:postId/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    await post.addComment(req.user._id, text.trim());

    // Send notification to post author if not the current user
    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.createNotification(
        post.author,
        req.user._id,
        'post_commented',
        'New Comment',
        `${req.user.username} commented on your post`,
        { postId: post._id, comment: text.trim() }
      );
    }

    res.json({ message: 'Comment added successfully' });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Share a post
router.post('/:postId/share', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    await post.addShare(req.user._id);

    // Send notification to post author if not the current user
    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.createNotification(
        post.author,
        req.user._id,
        'post_shared',
        'Post Shared',
        `${req.user.username} shared your post`,
        { postId: post._id }
      );
    }

    res.json({ message: 'Post shared successfully' });
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a post
router.delete('/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete image files
    const frontImagePath = path.join(__dirname, '..', post.frontImage);
    const backImagePath = path.join(__dirname, '..', post.backImage);
    
    if (fs.existsSync(frontImagePath)) {
      fs.unlinkSync(frontImagePath);
    }
    if (fs.existsSync(backImagePath)) {
      fs.unlinkSync(backImagePath);
    }

    await Post.findByIdAndDelete(req.params.postId);

    // Update user's post count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.totalPosts': -1 }
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
