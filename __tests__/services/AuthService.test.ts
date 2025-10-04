import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthService from '../../src/services/AuthService';
import * as UserStorage from '../../src/services/UserStorage';
import { AuthSession } from '../../src/types/User';
import { createTestSession } from '../utils/factories';

describe('AuthService', () => {
  it('registers a new user and stores credentials', async () => {
    const result = await AuthService.register({
      username: 'tester',
      email: 'tester@example.com',
      displayName: 'Tester',
      password: 'secret123',
      bio: 'Hello',
    });

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.session).toBeDefined();

    const users = await UserStorage.getAllUsers();
    expect(users).toHaveLength(1);

    const storedPassword = await AsyncStorage.getItem(`@BeReal:password:${result.user!.id}`);
    expect(storedPassword).toBe('secret123');
  });

  it('prevents duplicate email registrations', async () => {
    await AuthService.register({
      username: 'tester',
      email: 'tester@example.com',
      displayName: 'Tester',
      password: 'secret123',
      bio: '',
    });

    const duplicate = await AuthService.register({
      username: 'tester2',
      email: 'tester@example.com',
      displayName: 'Tester 2',
      password: 'secret123',
      bio: '',
    });

    expect(duplicate.success).toBe(false);
    expect(duplicate.error).toBe('Email already exists');
  });

  it('logs in an existing user with correct password', async () => {
    const registration = await AuthService.register({
      username: 'tester',
      email: 'tester@example.com',
      displayName: 'Tester',
      password: 'secret123',
      bio: '',
    });

    const preLoginLastActive = registration.user!.lastActive;

    const loginResult = await AuthService.login('tester@example.com', 'secret123');

    expect(loginResult.success).toBe(true);
    expect(loginResult.user).toBeDefined();
    expect(loginResult.session).toBeDefined();
    expect(loginResult.user!.lastActive).toBeGreaterThanOrEqual(preLoginLastActive);
  });

  it('returns user not found when logging in with unknown email', async () => {
    const result = await AuthService.login('missing@example.com', 'password');
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });

  it('rejects login with invalid password', async () => {
    await AuthService.register({
      username: 'tester',
      email: 'tester@example.com',
      displayName: 'Tester',
      password: 'secret123',
      bio: '',
    });

    const loginResult = await AuthService.login('tester@example.com', 'wrong');

    expect(loginResult.success).toBe(false);
    expect(loginResult.error).toBe('Invalid password');
  });

  it('stores and retrieves session data', async () => {
    const session = createTestSession({ userId: 'session-user' });
    await AuthService.storeSession(session);

    const stored = await AuthService.getStoredSession();
    expect(stored).toEqual(session);

    await AuthService.clearSession();
    const cleared = await AuthService.getStoredSession();
    expect(cleared).toBeNull();
  });

  it('refreshes active sessions and expires old ones', async () => {
    const activeSession = createTestSession({ userId: 'user-1', expiresAt: Date.now() + 10_000 });
    const refreshed = await AuthService.refreshSession(activeSession);
    expect(refreshed).toBeDefined();
    expect(refreshed?.token).not.toBe(activeSession.token);

    const expiredSession = createTestSession({ userId: 'user-1', expiresAt: Date.now() - 1 });
    const expiredResult = await AuthService.refreshSession(expiredSession);
    expect(expiredResult).toBeNull();
  });

  it('updates user information and persists changes', async () => {
    const registration = await AuthService.register({
      username: 'tester',
      email: 'tester@example.com',
      displayName: 'Tester',
      password: 'secret123',
      bio: '',
    });

    const updated = await AuthService.updateUser(registration.user!.id, {
      displayName: 'Updated Tester',
      bio: 'Updated bio',
    });

    expect(updated).toBeDefined();
    expect(updated?.displayName).toBe('Updated Tester');

    const stored = await UserStorage.getUserById(registration.user!.id);
    expect(stored?.bio).toBe('Updated bio');
  });

  it('handles login errors gracefully', async () => {
    const spy = jest.spyOn(UserStorage, 'getAllUsers').mockRejectedValueOnce(new Error('storage failure'));
    try {
      const result = await AuthService.login('any@example.com', 'password');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Login failed');
    } finally {
      spy.mockRestore();
    }
  });

  it('handles registration errors gracefully', async () => {
    const spy = jest.spyOn(UserStorage, 'saveUser').mockRejectedValueOnce(new Error('save failure'));
    try {
      const result = await AuthService.register({
        username: 'user',
        email: 'user@example.com',
        displayName: 'User',
        password: 'password',
        bio: '',
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Registration failed');
    } finally {
      spy.mockRestore();
    }
  });

  it('catches errors during logout', async () => {
    const spy = jest.spyOn(AuthService, 'clearSession').mockRejectedValueOnce(new Error('clear failure'));
    try {
      await expect(AuthService.logout()).resolves.toBeUndefined();
    } finally {
      spy.mockRestore();
    }
  });

  it('returns null when getUserById encounters an error', async () => {
    const spy = jest.spyOn(UserStorage, 'getUserById').mockRejectedValueOnce(new Error('read failure'));
    try {
      const result = await AuthService.getUserById('user-id');
      expect(result).toBeNull();
    } finally {
      spy.mockRestore();
    }
  });

  it('returns null when updateUser encounters an error', async () => {
    const spy = jest.spyOn(UserStorage, 'getUserById').mockRejectedValueOnce(new Error('read failure'));
    try {
      const result = await AuthService.updateUser('user-id', { displayName: 'Nope' });
      expect(result).toBeNull();
    } finally {
      spy.mockRestore();
    }
  });

  it('handles storeSession errors', async () => {
    const spy = jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('write failure'));
    try {
      await AuthService.storeSession(createTestSession({ userId: 'user-id' }));
    } finally {
      spy.mockRestore();
    }
  });

  it('handles getStoredSession errors', async () => {
    const spy = jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('read failure'));
    try {
      const result = await AuthService.getStoredSession();
      expect(result).toBeNull();
    } finally {
      spy.mockRestore();
    }
  });

  it('handles clearSession errors', async () => {
    const spy = jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('remove failure'));
    try {
      await AuthService.clearSession();
    } finally {
      spy.mockRestore();
    }
  });

  it('handles refresh session exceptions', async () => {
    const result = await AuthService.refreshSession(null as unknown as AuthSession);
    expect(result).toBeNull();
  });
});
