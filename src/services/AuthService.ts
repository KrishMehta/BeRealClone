import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, CreateUserData, AuthSession, UserSettings } from '../types/User';
import * as UserStorage from './UserStorage';

const STORAGE_KEYS = {
  SESSION: '@BeReal:session',
  CURRENT_USER: '@BeReal:currentUser',
};

// Session duration: 30 days
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000;

interface AuthResult {
  success: boolean;
  user?: User;
  session?: AuthSession;
  error?: string;
}

export const login = async (email: string, password: string): Promise<AuthResult> => {
  try {
    // In a real app, this would make an API call
    // For now, we'll simulate with local storage
    const users = await UserStorage.getAllUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // In a real app, you'd verify the password hash
    // For now, we'll use a simple check (not secure)
    const storedPassword = await AsyncStorage.getItem(`@BeReal:password:${user.id}`);
    if (storedPassword !== password) {
      return { success: false, error: 'Invalid password' };
    }
    
    // Update last active
    const updatedUser = {
      ...user,
      lastActive: Date.now(),
    };
    await UserStorage.updateUser(updatedUser);
    
    // Create session
    const session: AuthSession = {
      userId: user.id,
      token: generateToken(),
      expiresAt: Date.now() + SESSION_DURATION,
      lastRefresh: Date.now(),
    };
    
    return { success: true, user: updatedUser, session };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Login failed' };
  }
};

export const register = async (userData: CreateUserData): Promise<AuthResult> => {
  try {
    // Check if user already exists
    const existingUsers = await UserStorage.getAllUsers();
    const existingEmail = existingUsers.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
    const existingUsername = existingUsers.find(u => u.username.toLowerCase() === userData.username.toLowerCase());
    
    if (existingEmail) {
      return { success: false, error: 'Email already exists' };
    }
    
    if (existingUsername) {
      return { success: false, error: 'Username already taken' };
    }
    
    // Create new user
    const defaultSettings: UserSettings = {
      allowFriendRequests: true,
      showActiveStatus: true,
      notifyOnFriendRequest: true,
      notifyOnNewPost: true,
      profileVisibility: 'public',
    };
    
    const newUser: User = {
      id: generateUserId(),
      username: userData.username,
      email: userData.email,
      displayName: userData.displayName,
      bio: userData.bio || '',
      isPrivate: false,
      joinedAt: Date.now(),
      lastActive: Date.now(),
      friendsCount: 0,
      postsCount: 0,
      streak: 0,
      settings: defaultSettings,
    };
    
    // Save user
    await UserStorage.saveUser(newUser);
    
    // Store password (in a real app, this would be hashed)
    await AsyncStorage.setItem(`@BeReal:password:${newUser.id}`, userData.password);
    
    // Create session
    const session: AuthSession = {
      userId: newUser.id,
      token: generateToken(),
      expiresAt: Date.now() + SESSION_DURATION,
      lastRefresh: Date.now(),
    };
    
    return { success: true, user: newUser, session };
  } catch (error) {
    console.error('Register error:', error);
    return { success: false, error: 'Registration failed' };
  }
};

export const logout = async (): Promise<void> => {
  try {
    await clearSession();
  } catch (error) {
    console.error('Logout error:', error);
  }
};

export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    return await UserStorage.getUserById(userId);
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<User | null> => {
  try {
    const user = await UserStorage.getUserById(userId);
    if (!user) return null;
    
    const updatedUser = {
      ...user,
      ...updates,
      lastActive: Date.now(),
    };
    
    await UserStorage.updateUser(updatedUser);
    return updatedUser;
  } catch (error) {
    console.error('Update user error:', error);
    return null;
  }
};

export const storeSession = async (session: AuthSession): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  } catch (error) {
    console.error('Store session error:', error);
  }
};

export const getStoredSession = async (): Promise<AuthSession | null> => {
  try {
    const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    console.error('Get stored session error:', error);
    return null;
  }
};

export const clearSession = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  } catch (error) {
    console.error('Clear session error:', error);
  }
};

export const refreshSession = async (session: AuthSession): Promise<AuthSession | null> => {
  try {
    if (session.expiresAt <= Date.now()) {
      return null;
    }
    
    const newSession: AuthSession = {
      ...session,
      token: generateToken(),
      expiresAt: Date.now() + SESSION_DURATION,
      lastRefresh: Date.now(),
    };
    
    return newSession;
  } catch (error) {
    console.error('Refresh session error:', error);
    return null;
  }
};

// Helper functions
const generateUserId = (): string => {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const generateToken = (): string => {
  return `token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
};
