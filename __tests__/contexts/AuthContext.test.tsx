import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { renderHookWithProviders } from '../utils/renderWithProviders';
import { createTestSession, createTestUser } from '../utils/factories';
import * as AuthService from '../../src/services/AuthService';

jest.mock('../../src/services/AuthService');

const mockedAuthService = jest.mocked(AuthService, true);

describe('AuthContext', () => {
  beforeEach(() => {
    mockedAuthService.getStoredSession.mockResolvedValue(null);
    mockedAuthService.getUserById.mockResolvedValue(null);
    mockedAuthService.storeSession.mockResolvedValue();
    mockedAuthService.clearSession.mockResolvedValue();
    mockedAuthService.logout.mockResolvedValue();
    mockedAuthService.updateUser.mockResolvedValue(null);
  });

  it('initializes with stored session when valid', async () => {
    const user = createTestUser();
    const session = createTestSession({ userId: user.id, expiresAt: Date.now() + 10_000 });
    mockedAuthService.getStoredSession.mockResolvedValueOnce(session);
    mockedAuthService.getUserById.mockResolvedValueOnce(user);

    const { result } = renderHookWithProviders(() => useAuth(), {
      auth: { useAuthProvider: true },
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.user).toEqual(expect.objectContaining({ id: user.id }));
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('clears expired stored sessions on init', async () => {
    const expiredSession = createTestSession({ expiresAt: Date.now() - 1 });
    mockedAuthService.getStoredSession.mockResolvedValueOnce(expiredSession);

    const { result } = renderHookWithProviders(() => useAuth(), {
      auth: { useAuthProvider: true },
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(mockedAuthService.clearSession).toHaveBeenCalledTimes(1);
  });

  it('logs in successfully and stores session', async () => {
    const user = createTestUser();
    const session = createTestSession({ userId: user.id });
    mockedAuthService.login.mockResolvedValueOnce({ success: true, user, session });

    const { result } = renderHookWithProviders(() => useAuth(), {
      auth: { useAuthProvider: true },
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      const success = await result.current.login(user.email, 'password');
      expect(success).toBe(true);
    });

    await waitFor(() => expect(result.current.user?.id).toBe(user.id));
    expect(mockedAuthService.storeSession).toHaveBeenCalledWith(session);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('handles login failure gracefully', async () => {
    mockedAuthService.login.mockResolvedValueOnce({ success: false, error: 'Invalid' });

    const { result } = renderHookWithProviders(() => useAuth(), {
      auth: { useAuthProvider: true },
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      const success = await result.current.login('user@example.com', 'wrong');
      expect(success).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(mockedAuthService.storeSession).not.toHaveBeenCalled();
  });

  it('registers and authenticates new users', async () => {
    const user = createTestUser();
    const session = createTestSession({ userId: user.id });
    mockedAuthService.register.mockResolvedValueOnce({ success: true, user, session });

    const { result } = renderHookWithProviders(() => useAuth(), {
      auth: { useAuthProvider: true },
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      const success = await result.current.register({
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        password: 'password123',
      });
      expect(success).toBe(true);
    });

    expect(result.current.user).toEqual(expect.objectContaining({ id: user.id }));
    expect(mockedAuthService.storeSession).toHaveBeenCalledWith(session);
  });

  it('logs out and clears session data', async () => {
    const user = createTestUser();
    const session = createTestSession({ userId: user.id });
    mockedAuthService.login.mockResolvedValueOnce({ success: true, user, session });

    const { result } = renderHookWithProviders(() => useAuth(), {
      auth: { useAuthProvider: true },
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login(user.email, 'password');
    });

    await waitFor(() => expect(result.current.user?.id).toBe(user.id));

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(mockedAuthService.clearSession).toHaveBeenCalled();
    expect(mockedAuthService.logout).toHaveBeenCalled();
  });

  it('refreshes session when available', async () => {
    const user = createTestUser();
    const session = createTestSession({ userId: user.id });
    const refreshedSession = createTestSession({ userId: user.id, token: 'new-token' });
    mockedAuthService.getStoredSession.mockResolvedValueOnce(session);
    mockedAuthService.getUserById.mockResolvedValueOnce(user);
    mockedAuthService.refreshSession.mockResolvedValueOnce(refreshedSession);

    const { result } = renderHookWithProviders(() => useAuth(), {
      auth: { useAuthProvider: true },
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.refreshSession();
    });

    expect(mockedAuthService.storeSession).toHaveBeenCalledWith(refreshedSession);
  });

  it('handles refresh errors by logging out', async () => {
    const user = createTestUser();
    const session = createTestSession({ userId: user.id });
    mockedAuthService.getStoredSession.mockResolvedValueOnce(session);
    mockedAuthService.getUserById.mockResolvedValueOnce(user);
    mockedAuthService.refreshSession.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHookWithProviders(() => useAuth(), {
      auth: { useAuthProvider: true },
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.refreshSession();
    });

    expect(mockedAuthService.logout).toHaveBeenCalled();
    expect(mockedAuthService.clearSession).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('clears session when stored user details are missing', async () => {
    const session = createTestSession({ userId: 'missing-user' });
    mockedAuthService.getStoredSession.mockResolvedValueOnce(session);
    mockedAuthService.getUserById.mockResolvedValueOnce(null);

    const { result } = renderHookWithProviders(() => useAuth(), {
      auth: { useAuthProvider: true },
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockedAuthService.clearSession).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('handles initialization errors gracefully', async () => {
    mockedAuthService.getStoredSession.mockRejectedValueOnce(new Error('init failure'));

    const { result } = renderHookWithProviders(() => useAuth(), {
      auth: { useAuthProvider: true },
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockedAuthService.clearSession).toHaveBeenCalled();
  });

  it('returns false when login throws an error', async () => {
    mockedAuthService.login.mockRejectedValueOnce(new Error('login failure'));

    const { result } = renderHookWithProviders(() => useAuth(), {
      auth: { useAuthProvider: true },
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      const success = await result.current.login('user@example.com', 'password');
      expect(success).toBe(false);
    });
  });

  it('returns false when registration throws an error', async () => {
    mockedAuthService.register.mockRejectedValueOnce(new Error('register failure'));

    const { result } = renderHookWithProviders(() => useAuth(), {
      auth: { useAuthProvider: true },
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      const success = await result.current.register({
        username: 'test',
        email: 'test@example.com',
        displayName: 'Test',
        password: 'password',
      });
      expect(success).toBe(false);
    });
  });

  it('logs errors during logout but resets loading state', async () => {
    const user = createTestUser();
    const session = createTestSession({ userId: user.id });
    mockedAuthService.getStoredSession.mockResolvedValueOnce(session);
    mockedAuthService.getUserById.mockResolvedValueOnce(user);
    mockedAuthService.logout.mockRejectedValueOnce(new Error('logout failure'));

    const { result } = renderHookWithProviders(() => useAuth(), {
      auth: { useAuthProvider: true },
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toEqual(expect.objectContaining({ id: user.id }));
    expect(result.current.isLoading).toBe(false);
    expect(mockedAuthService.clearSession).not.toHaveBeenCalled();
  });

  it('does not attempt to update user when no user is set', async () => {
    const { result } = renderHookWithProviders(() => useAuth(), {
      auth: { useAuthProvider: true },
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.updateUser({ displayName: 'New name' });
    });

    expect(mockedAuthService.updateUser).not.toHaveBeenCalled();
  });

  it('updates the current user when updateUser succeeds', async () => {
    const user = createTestUser();
    const session = createTestSession({ userId: user.id });
    mockedAuthService.login.mockResolvedValueOnce({ success: true, user, session });
    const updatedUser = { ...user, displayName: 'Updated' };
    mockedAuthService.updateUser.mockResolvedValueOnce(updatedUser);

    const { result } = renderHookWithProviders(() => useAuth(), {
      auth: { useAuthProvider: true },
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.login(user.email, 'password');
    });

    await act(async () => {
      await result.current.updateUser({ displayName: 'Updated' });
    });

    expect(mockedAuthService.updateUser).toHaveBeenCalledWith(user.id, { displayName: 'Updated' });
    expect(result.current.user?.displayName).toBe('Updated');
  });

  it('throws when useAuth is used outside of the provider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider'
    );
  });
});
