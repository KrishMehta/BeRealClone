import AsyncStorage from '@react-native-async-storage/async-storage';
import * as PostService from '../../src/services/PostService';
import * as UserStorage from '../../src/services/UserStorage';
import { createTestPost, createTestUser, resetTestSequences } from '../utils/factories';

describe('PostService', () => {
  beforeEach(() => {
    resetTestSequences();
  });

  const createUser = async (overrides = {}) => {
    const user = createTestUser(overrides);
    await UserStorage.saveUser(user);
    return user;
  };

  it('creates a new post and saves it for the user', async () => {
    const user = await createUser({ id: 'user-1' });

    const postData = {
      frontImage: 'front.jpg',
      backImage: 'back.jpg',
      visibility: 'friends' as const,
    };

    const post = await PostService.createPost(user.id, postData);

    expect(post).toBeDefined();
    expect(post?.userId).toBe('user-1');

    const allPosts = await PostService.getAllPosts();
    expect(allPosts).toHaveLength(1);
  });

  it('prevents multiple posts in the same day', async () => {
    const user = await createUser({ id: 'user-1' });

    const first = await PostService.createPost(user.id, {
      frontImage: 'first.jpg',
      backImage: 'first-back.jpg',
    });
    const second = await PostService.createPost(user.id, {
      frontImage: 'second.jpg',
      backImage: 'second-back.jpg',
    });

    expect(first).toBeDefined();
    expect(second).toBeNull();
  });

  it('adds and removes likes on posts', async () => {
    const owner = await createUser({ id: 'owner-1' });
    const liker = await createUser({ id: 'liker-1', username: 'liker' });

    const post = createTestPost({ id: 'post-1', userId: owner.id, likes: [] });
    await PostService.savePost(post);

    const likeResult = await PostService.likePost('post-1', liker.id);
    expect(likeResult).toBe(true);

    const likedPost = await PostService.getPostById('post-1');
    expect(likedPost?.likes).toHaveLength(1);
    expect(likedPost?.likes[0].userId).toBe(liker.id);

    const unlikeResult = await PostService.unlikePost('post-1', liker.id);
    expect(unlikeResult).toBe(true);

    const unlikedPost = await PostService.getPostById('post-1');
    expect(unlikedPost?.likes).toHaveLength(0);
  });

  it('filters feed posts for the current user', async () => {
    const viewer = await createUser({ id: 'viewer-1', username: 'viewer' });
    const friend = await createUser({ id: 'friend-1', username: 'friend' });
    const stranger = await createUser({ id: 'stranger-1', username: 'stranger' });

    await UserStorage.saveFriendship({
      id: 'friendship-1',
      user1Id: viewer.id,
      user2Id: friend.id,
      createdAt: Date.now(),
      status: 'active',
    });

    const ownPost = createTestPost({ id: 'post-own', userId: viewer.id, visibility: 'private' });
    const friendPost = createTestPost({
      id: 'post-friend',
      userId: friend.id,
      visibility: 'friends',
      displayName: 'Friend User',
    });
    const publicPost = createTestPost({
      id: 'post-public',
      userId: stranger.id,
      visibility: 'public',
      displayName: 'Public User',
    });

    await PostService.savePost(ownPost);
    await PostService.savePost(friendPost);
    await PostService.savePost(publicPost);

    const feed = await PostService.getFeedPosts(viewer.id);
    const feedIds = feed.map((p) => p.id);

    expect(feedIds).toContain('post-own');
    expect(feedIds).toContain('post-friend');
    expect(feedIds).toContain('post-public');
  });

  it('deletes posts authored by the user', async () => {
    const user = await createUser({ id: 'user-1' });
    const post = createTestPost({ id: 'post-delete', userId: user.id });
    await PostService.savePost(post);

    const deletion = await PostService.deletePost('post-delete', user.id);
    expect(deletion).toBe(true);

    const posts = await PostService.getAllPosts();
    expect(posts.find((p) => p.id === 'post-delete')).toBeUndefined();
  });

  it('returns null when attempting to create a post for a missing user', async () => {
    const result = await PostService.createPost('unknown-user', {
      frontImage: 'front.jpg',
      backImage: 'back.jpg',
    });
    expect(result).toBeNull();
  });

  it('supports adding and deleting comments with proper permissions', async () => {
    const owner = await createUser({ id: 'owner-1', displayName: 'Owner' });
    const commenter = await createUser({ id: 'commenter-1', username: 'commenter', displayName: 'Commenter' });
    const stranger = await createUser({ id: 'stranger-1' });
    const post = createTestPost({ id: 'comment-post', userId: owner.id, comments: [] });
    await PostService.savePost(post);

    const addCommentResult = await PostService.addComment('comment-post', commenter.id, 'Nice post!');
    expect(addCommentResult).toBe(true);

    const postWithComment = await PostService.getPostById('comment-post');
    expect(postWithComment?.comments).toHaveLength(1);

    const commentId = postWithComment!.comments[0].id;
    const deleteByStranger = await PostService.deleteComment('comment-post', commentId, stranger.id);
    expect(deleteByStranger).toBe(false);

    const deleteByOwner = await PostService.deleteComment('comment-post', commentId, owner.id);
    expect(deleteByOwner).toBe(true);
  });

  it('produces discovery posts excluding friends and self', async () => {
    const viewer = await createUser({ id: 'viewer-1' });
    const friend = await createUser({ id: 'friend-1' });
    const publicUser = await createUser({ id: 'public-1' });

    await UserStorage.saveFriendship({
      id: 'friendship-2',
      user1Id: viewer.id,
      user2Id: friend.id,
      createdAt: Date.now(),
      status: 'active',
    });

    const friendPost = createTestPost({ id: 'friend-post', userId: friend.id, visibility: 'friends' });
    const publicPost = createTestPost({ id: 'public-post', userId: publicUser.id, visibility: 'public' });

    await PostService.savePost(friendPost);
    await PostService.savePost(publicPost);

    const discovery = await PostService.getDiscoveryPosts(viewer.id);
    const discoveryIds = discovery.map((p) => p.id);

    expect(discoveryIds).toContain('public-post');
    expect(discoveryIds).not.toContain('friend-post');
    expect(discovery.find((p) => p.userId === viewer.id)).toBeUndefined();
  });

  it('evaluates post visibility via canUserSeePost', async () => {
    const author = await createUser({ id: 'author-1' });
    const friend = await createUser({ id: 'friend-2' });
    const stranger = await createUser({ id: 'stranger-2' });

    await UserStorage.saveFriendship({
      id: 'friendship-3',
      user1Id: author.id,
      user2Id: friend.id,
      createdAt: Date.now(),
      status: 'active',
    });

    const publicPost = createTestPost({ id: 'visibility-public', userId: author.id, visibility: 'public' });
    const friendPost = createTestPost({ id: 'visibility-friends', userId: author.id, visibility: 'friends' });
    const privatePost = createTestPost({ id: 'visibility-private', userId: author.id, visibility: 'private' });

    expect(await PostService.canUserSeePost(publicPost, stranger.id)).toBe(true);
    expect(await PostService.canUserSeePost(friendPost, friend.id)).toBe(true);
    expect(await PostService.canUserSeePost(friendPost, stranger.id)).toBe(false);
    expect(await PostService.canUserSeePost(privatePost, friend.id)).toBe(false);
    expect(await PostService.canUserSeePost(privatePost, author.id)).toBe(true);
  });

  it('tracks daily posts and today feed helpers', async () => {
    const user = await createUser({ id: 'user-2' });
    const todaysPost = createTestPost({ id: 'today-post', userId: user.id, timestamp: Date.now() });
    const oldPost = createTestPost({
      id: 'old-post',
      userId: user.id,
      timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
    });

    await PostService.savePost(todaysPost);
    await PostService.savePost(oldPost);

    await PostService.updateDailyPost(user.id, todaysPost.id);
    const hasPostedToday = await PostService.hasUserPostedToday(user.id);
    expect(hasPostedToday).toBe(true);

    const todaysPosts = await PostService.getTodaysPosts();
    const postIds = todaysPosts.map((post) => post.id);
    expect(postIds).toContain('today-post');
    expect(postIds).not.toContain('old-post');
  });

  it('rethrows errors when saving a post fails', async () => {
    const user = await createUser({ id: 'error-user' });
    const post = createTestPost({ userId: user.id });
    const spy = jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('set failure'));
    await expect(PostService.savePost(post)).rejects.toThrow('set failure');
    spy.mockRestore();
  });

  it('returns safe defaults when storage operations fail', async () => {
    const getItemSpy = jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('get failure'));
    const posts = await PostService.getAllPosts();
    expect(posts).toEqual([]);
    getItemSpy.mockRestore();

    const getAllSpy = jest.spyOn(PostService, 'getAllPosts').mockRejectedValueOnce(new Error('all failure'));
    const postById = await PostService.getPostById('any');
    expect(postById).toBeNull();

    getAllSpy.mockRejectedValueOnce(new Error('user posts failure'));
    const userPosts = await PostService.getUserPosts('user');
    expect(userPosts).toEqual([]);
    getAllSpy.mockRestore();
  });

  it('rethrows errors when saving user-specific posts fails', async () => {
    const spy = jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('user set failure'));
    await expect(PostService.saveUserPost('user', createTestPost({ id: 'p', userId: 'user' })) ).rejects.toThrow(
      'user set failure'
    );
    spy.mockRestore();
  });

  it('handles failures in discovery and like flows gracefully', async () => {
    const getAllSpy = jest.spyOn(PostService, 'getAllPosts').mockRejectedValueOnce(new Error('discovery failure'));
    const discovery = await PostService.getDiscoveryPosts('user');
    expect(discovery).toEqual([]);
    getAllSpy.mockRestore();

    const author = await createUser({ id: 'author-like' });
    const liker = await createUser({ id: 'liker-like' });
    const likePost = createTestPost({ id: 'like-error', userId: author.id, likes: [] });
    await PostService.savePost(likePost);
    const saveSpy = jest.spyOn(PostService, 'savePost').mockRejectedValueOnce(new Error('like failure'));
    const likeResult = await PostService.likePost('like-error', liker.id);
    expect(likeResult).toBe(false);
    saveSpy.mockRestore();
  });

  it('handles comment and daily helper errors gracefully', async () => {
    const owner = await createUser({ id: 'owner-comment' });
    const commenter = await createUser({ id: 'commenter-error' });
    const commentPost = createTestPost({ id: 'comment-error', userId: owner.id, comments: [] });
    await PostService.savePost(commentPost);
    const saveSpy = jest.spyOn(PostService, 'savePost').mockRejectedValueOnce(new Error('comment failure'));
    const commentResult = await PostService.addComment('comment-error', commenter.id, 'content');
    expect(commentResult).toBe(false);
    saveSpy.mockRestore();

    const dailyGetSpy = jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('daily get failure'));
    const hasPosted = await PostService.hasUserPostedToday('user');
    expect(hasPosted).toBe(false);
    dailyGetSpy.mockRestore();

    const dailySetSpy = jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('daily set failure'));
    await PostService.updateDailyPost('user', 'post');
    dailySetSpy.mockRestore();

    const todaysSpy = jest.spyOn(PostService, 'getAllPosts').mockRejectedValueOnce(new Error('today failure'));
    const todays = await PostService.getTodaysPosts();
    expect(todays).toEqual([]);
    todaysSpy.mockRestore();
  });

  it('handles visibility checks errors gracefully', async () => {
    const friendSpy = jest.spyOn(UserStorage, 'areFriends').mockRejectedValueOnce(new Error('friend failure'));
    const post = createTestPost({ userId: 'author', visibility: 'friends' });
    const result = await PostService.canUserSeePost(post, 'viewer');
    expect(result).toBe(false);
    friendSpy.mockRestore();
  });
});
