import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import App from '../../App';
import * as AuthService from '../../src/services/AuthService';
import * as PostService from '../../src/services/PostService';
import { createTestPost, createTestSession, createTestUser } from '../utils/factories';

jest.mock('../../src/services/AuthService');
jest.mock('../../src/services/PostService');

const mockedAuthService = jest.mocked(AuthService, true);
const mockedPostService = jest.mocked(PostService, true);

describe('Authentication and feed flow', () => {
  beforeEach(() => {
    mockedAuthService.getStoredSession.mockResolvedValue(null);
    mockedAuthService.getUserById.mockResolvedValue(null);
    mockedAuthService.storeSession.mockResolvedValue();
    mockedAuthService.clearSession.mockResolvedValue();
    mockedAuthService.logout.mockResolvedValue();
    mockedPostService.getFeedPosts.mockResolvedValue([]);
    mockedPostService.likePost.mockResolvedValue(true);
    mockedPostService.hasUserPostedToday.mockResolvedValue(false);
  });

  it('allows a user to log in, view the feed, like a post, and log out', async () => {
    const user = createTestUser({ id: 'flow-user', displayName: 'Flow User', email: 'flow@example.com' });
    const session = createTestSession({ userId: user.id });
    const feedPost = createTestPost({ id: 'feed-post', displayName: 'Friend Post', likes: [] });

    mockedAuthService.login.mockResolvedValue({ success: true, user, session });
    mockedPostService.getFeedPosts.mockResolvedValue([feedPost]);

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, _message, buttons) => {
      if (title === 'Logout' && buttons) {
        const logoutButton = buttons.find((button) => button.text === 'Logout');
        logoutButton?.onPress?.();
      }
    });

    try {
      const { findByText, getByPlaceholderText, getByText } = render(<App />);

      await findByText('Welcome Back!');

      fireEvent.changeText(getByPlaceholderText('Enter your email'), 'flow@example.com');
      fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');

      await act(async () => {
        fireEvent.press(getByText('Sign In'));
      });

      await waitFor(() =>
        expect(mockedAuthService.login).toHaveBeenCalledWith('flow@example.com', 'password123')
      );

      const feedTab = await findByText('Feed');
      fireEvent.press(feedTab);

      await waitFor(() => expect(getByText('Friend Post')).toBeTruthy());

      fireEvent.press(getByText('🤍'));
      expect(mockedPostService.likePost).toHaveBeenCalledWith('feed-post', user.id);

      fireEvent.press(getByText('Profile'));
      await waitFor(() => expect(getByText('Settings')).toBeTruthy());

      fireEvent.press(getByText('Logout'));

      await waitFor(() => expect(mockedAuthService.logout).toHaveBeenCalled());
      await findByText('Welcome Back!');
    } finally {
      alertSpy.mockRestore();
    }
  });
});
