import AsyncStorage from '@react-native-async-storage/async-storage';
import { Post, CreatePostData, PostLike, PostComment } from '../types/Post';
import { User } from '../types/User';
import * as UserStorage from './UserStorage';

const STORAGE_KEYS = {
  POSTS: '@BeReal:posts',
  USER_POSTS: '@BeReal:userPosts',
  POST_LIKES: '@BeReal:postLikes',
  POST_COMMENTS: '@BeReal:postComments',
  DAILY_POSTS: '@BeReal:dailyPosts',
};

// Post Management
export const createPost = async (userId: string, postData: CreatePostData): Promise<Post | null> => {
  try {
    const user = await UserStorage.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user already posted today (BeReal's core mechanic)
    const hasPostedToday = await hasUserPostedToday(userId);
    if (hasPostedToday) {
      throw new Error('User has already posted today');
    }

    const post: Post = {
      id: generatePostId(),
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      userAvatar: user.avatar,
      frontImage: postData.frontImage,
      backImage: postData.backImage,
      timestamp: Date.now(),
      location: postData.location,
      isLate: postData.isLate || false,
      lateMinutes: postData.lateMinutes || 0,
      likes: [],
      comments: [],
      visibility: postData.visibility || 'friends',
      createdAt: Date.now(),
    };

    await savePost(post);
    await updateDailyPost(userId, post.id);
    await UserStorage.updateUserStats(userId);

    return post;
  } catch (error) {
    console.error('Error creating post:', error);
    return null;
  }
};

export const savePost = async (post: Post): Promise<void> => {
  try {
    const posts = await getAllPosts();
    const existingIndex = posts.findIndex(p => p.id === post.id);
    
    if (existingIndex >= 0) {
      posts[existingIndex] = post;
    } else {
      posts.push(post);
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    
    // Also save to user-specific posts
    await saveUserPost(post.userId, post);
  } catch (error) {
    console.error('Error saving post:', error);
    throw error;
  }
};

export const getAllPosts = async (): Promise<Post[]> => {
  try {
    const postsData = await AsyncStorage.getItem(STORAGE_KEYS.POSTS);
    return postsData ? JSON.parse(postsData) : [];
  } catch (error) {
    console.error('Error getting all posts:', error);
    return [];
  }
};

export const getPostById = async (postId: string): Promise<Post | null> => {
  try {
    const posts = await getAllPosts();
    return posts.find(post => post.id === postId) || null;
  } catch (error) {
    console.error('Error getting post by id:', error);
    return null;
  }
};

export const getUserPosts = async (userId: string): Promise<Post[]> => {
  try {
    const posts = await getAllPosts();
    return posts
      .filter(post => post.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error getting user posts:', error);
    return [];
  }
};

export const saveUserPost = async (userId: string, post: Post): Promise<void> => {
  try {
    const userPostsData = await AsyncStorage.getItem(`${STORAGE_KEYS.USER_POSTS}:${userId}`);
    const userPosts = userPostsData ? JSON.parse(userPostsData) : [];
    
    const existingIndex = userPosts.findIndex((p: Post) => p.id === post.id);
    if (existingIndex >= 0) {
      userPosts[existingIndex] = post;
    } else {
      userPosts.push(post);
    }
    
    await AsyncStorage.setItem(`${STORAGE_KEYS.USER_POSTS}:${userId}`, JSON.stringify(userPosts));
  } catch (error) {
    console.error('Error saving user post:', error);
    throw error;
  }
};

// Feed Management
export const getFeedPosts = async (userId: string): Promise<Post[]> => {
  try {
    const user = await UserStorage.getUserById(userId);
    if (!user) return [];

    const friends = await UserStorage.getUserFriends(userId);
    const friendIds = friends.map(f => f.id);
    
    const allPosts = await getAllPosts();
    
    // Get posts from friends and user's own posts
    const feedPosts = allPosts.filter(post => {
      // Always show user's own posts
      if (post.userId === userId) return true;
      
      // Show public posts from everyone
      if (post.visibility === 'public') return true;
      
      // Show friends' posts if they're friends
      if (post.visibility === 'friends' && friendIds.includes(post.userId)) {
        return true;
      }
      
      return false;
    });

    // Sort by timestamp (newest first)
    return feedPosts.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error getting feed posts:', error);
    return [];
  }
};

export const getDiscoveryPosts = async (userId: string): Promise<Post[]> => {
  try {
    const allPosts = await getAllPosts();
    const user = await UserStorage.getUserById(userId);
    if (!user) return [];

    const friends = await UserStorage.getUserFriends(userId);
    const friendIds = friends.map(f => f.id);

    // Get only public posts from non-friends
    const discoveryPosts = allPosts.filter(post => 
      post.visibility === 'public' && 
      post.userId !== userId && 
      !friendIds.includes(post.userId)
    );

    // Sort by timestamp (newest first) with some randomization
    return discoveryPosts
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50); // Limit to recent posts for performance
  } catch (error) {
    console.error('Error getting discovery posts:', error);
    return [];
  }
};

// Likes Management
export const likePost = async (postId: string, userId: string): Promise<boolean> => {
  try {
    const post = await getPostById(postId);
    if (!post) return false;

    const user = await UserStorage.getUserById(userId);
    if (!user) return false;

    // Check if user already liked the post
    const existingLike = post.likes.find(like => like.userId === userId);
    if (existingLike) return false; // Already liked

    const newLike: PostLike = {
      id: generateLikeId(),
      userId: user.id,
      username: user.username,
      timestamp: Date.now(),
    };

    post.likes.push(newLike);
    await savePost(post);

    return true;
  } catch (error) {
    console.error('Error liking post:', error);
    return false;
  }
};

export const unlikePost = async (postId: string, userId: string): Promise<boolean> => {
  try {
    const post = await getPostById(postId);
    if (!post) return false;

    post.likes = post.likes.filter(like => like.userId !== userId);
    await savePost(post);

    return true;
  } catch (error) {
    console.error('Error unliking post:', error);
    return false;
  }
};

// Comments Management
export const addComment = async (postId: string, userId: string, content: string): Promise<boolean> => {
  try {
    const post = await getPostById(postId);
    if (!post) return false;

    const user = await UserStorage.getUserById(userId);
    if (!user) return false;

    const newComment: PostComment = {
      id: generateCommentId(),
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      content: content.trim(),
      timestamp: Date.now(),
      userAvatar: user.avatar,
    };

    post.comments.push(newComment);
    await savePost(post);

    return true;
  } catch (error) {
    console.error('Error adding comment:', error);
    return false;
  }
};

export const deleteComment = async (postId: string, commentId: string, userId: string): Promise<boolean> => {
  try {
    const post = await getPostById(postId);
    if (!post) return false;

    // Only comment author or post author can delete comment
    const comment = post.comments.find(c => c.id === commentId);
    if (!comment || (comment.userId !== userId && post.userId !== userId)) {
      return false;
    }

    post.comments = post.comments.filter(c => c.id !== commentId);
    await savePost(post);

    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
};

// Daily Posts (BeReal's core feature)
export const hasUserPostedToday = async (userId: string): Promise<boolean> => {
  try {
    const today = new Date().toDateString();
    const dailyPostData = await AsyncStorage.getItem(`${STORAGE_KEYS.DAILY_POSTS}:${userId}:${today}`);
    return !!dailyPostData;
  } catch (error) {
    console.error('Error checking daily post:', error);
    return false;
  }
};

export const updateDailyPost = async (userId: string, postId: string): Promise<void> => {
  try {
    const today = new Date().toDateString();
    await AsyncStorage.setItem(`${STORAGE_KEYS.DAILY_POSTS}:${userId}:${today}`, postId);
  } catch (error) {
    console.error('Error updating daily post:', error);
  }
};

export const getTodaysPosts = async (): Promise<Post[]> => {
  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const todayEnd = todayStart + (24 * 60 * 60 * 1000);

    const allPosts = await getAllPosts();
    return allPosts.filter(post => 
      post.timestamp >= todayStart && post.timestamp < todayEnd
    );
  } catch (error) {
    console.error('Error getting today\'s posts:', error);
    return [];
  }
};

// Utility functions
const generatePostId = (): string => {
  return `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const generateLikeId = (): string => {
  return `like_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const generateCommentId = (): string => {
  return `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Post visibility and permissions
export const canUserSeePost = async (post: Post, viewerUserId: string): Promise<boolean> => {
  try {
    // User can always see their own posts
    if (post.userId === viewerUserId) return true;

    // Public posts are visible to everyone
    if (post.visibility === 'public') return true;

    // Private posts are only visible to the author
    if (post.visibility === 'private') return false;

    // Friends-only posts require friendship
    if (post.visibility === 'friends') {
      return await UserStorage.areFriends(post.userId, viewerUserId);
    }

    return false;
  } catch (error) {
    console.error('Error checking post visibility:', error);
    return false;
  }
};

export const deletePost = async (postId: string, userId: string): Promise<boolean> => {
  try {
    const post = await getPostById(postId);
    if (!post || post.userId !== userId) return false;

    // Remove from all posts
    const posts = await getAllPosts();
    const filteredPosts = posts.filter(p => p.id !== postId);
    await AsyncStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(filteredPosts));

    // Remove from user posts
    const userPosts = await getUserPosts(userId);
    const filteredUserPosts = userPosts.filter(p => p.id !== postId);
    await AsyncStorage.setItem(`${STORAGE_KEYS.USER_POSTS}:${userId}`, JSON.stringify(filteredUserPosts));

    // Update user stats
    await UserStorage.updateUserStats(userId);

    return true;
  } catch (error) {
    console.error('Error deleting post:', error);
    return false;
  }
};
