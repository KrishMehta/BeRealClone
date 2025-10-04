import React from 'react';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import { FlatList } from 'react-native';
import FeedScreen from '../../src/screens/FeedScreen';
import { renderWithProviders } from '../utils/renderWithProviders';
import { createTestPost, createTestUser, resetTestSequences } from '../utils/factories';
import * as PostService from '../../src/services/PostService';

jest.mock('../../src/services/PostService');

const mockedPostService = jest.mocked(PostService, true);

describe('FeedScreen', () => {
  const currentUser = createTestUser();

  beforeEach(() => {
    resetTestSequences();
    mockedPostService.getFeedPosts.mockResolvedValue([]);
    mockedPostService.likePost.mockResolvedValue(true);
    mockedPostService.unlikePost.mockResolvedValue(true);
  });

  const renderFeed = () =>
    renderWithProviders(<FeedScreen />, {
      auth: { value: { user: currentUser, isAuthenticated: true } },
    });

  it('renders posts for the authenticated user', async () => {
    const post = createTestPost({ userId: currentUser.id, displayName: 'Friend 1', likes: [] });
    mockedPostService.getFeedPosts.mockResolvedValueOnce([post]);

    const { getByText } = renderFeed();

    await waitFor(() => {
      expect(getByText('Friend 1')).toBeTruthy();
    });

    expect(mockedPostService.getFeedPosts).toHaveBeenCalledWith(currentUser.id);
  });

  it('handles like and unlike interactions', async () => {
    const basePost = createTestPost({
      id: 'post-1',
      userId: 'friend-1',
      displayName: 'Friend',
      likes: [],
    });

    const likedPost = {
      ...basePost,
      likes: [{ id: 'like-1', userId: currentUser.id, username: currentUser.username, timestamp: Date.now() }],
    };

    mockedPostService.getFeedPosts
      .mockResolvedValueOnce([basePost])
      .mockResolvedValueOnce([likedPost])
      .mockResolvedValueOnce([basePost]);

    const { getAllByText, queryAllByText } = renderFeed();

    await waitFor(() => expect(getAllByText('🤍').length).toBeGreaterThan(0));

    await act(async () => {
      fireEvent.press(getAllByText('🤍')[0]);
    });

    expect(mockedPostService.likePost).toHaveBeenCalledWith('post-1', currentUser.id);

    await waitFor(() => expect(getAllByText('❤️').length).toBeGreaterThan(0));

    await act(async () => {
      fireEvent.press(getAllByText('❤️')[0]);
    });

    expect(mockedPostService.unlikePost).toHaveBeenCalledWith('post-1', currentUser.id);
    await waitFor(() => expect(queryAllByText('❤️').length).toBe(0));
  });

  it('renders empty state when there are no posts', async () => {
    mockedPostService.getFeedPosts.mockResolvedValueOnce([]);

    const { findByText } = renderFeed();

    expect(await findByText('No posts yet')).toBeTruthy();
    expect(await findByText('Take your first BeReal to get started!')).toBeTruthy();
  });

  it('refreshes the feed when pulling to refresh', async () => {
    const initialPost = createTestPost({ id: 'post-initial', displayName: 'Initial' });
    const refreshedPost = createTestPost({ id: 'post-refreshed', displayName: 'Refreshed' });

    mockedPostService.getFeedPosts
      .mockResolvedValueOnce([initialPost])
      .mockResolvedValueOnce([refreshedPost]);

    const { UNSAFE_getByType, getByText } = renderFeed();

    await waitFor(() => expect(getByText('Initial')).toBeTruthy());

    const flatList = UNSAFE_getByType(FlatList);

    await act(async () => {
      await flatList.props.refreshControl.props.onRefresh();
    });

    await waitFor(() => expect(getByText('Refreshed')).toBeTruthy());
    expect(mockedPostService.getFeedPosts).toHaveBeenCalledTimes(2);
  });
});
