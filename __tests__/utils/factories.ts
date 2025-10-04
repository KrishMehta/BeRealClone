import { AuthSession, User } from '../../src/types/User';
import { Post } from '../../src/types/Post';
import { AuthContextType } from '../../src/contexts/AuthContext';

let userSequence = 0;
let postSequence = 0;

const defaultSettings = {
  allowFriendRequests: true,
  showActiveStatus: true,
  notifyOnFriendRequest: true,
  notifyOnNewPost: true,
  profileVisibility: 'public' as const,
};

export const createTestUser = (overrides: Partial<User> = {}): User => {
  userSequence += 1;
  const count = userSequence;
  return {
    id: overrides.id ?? `user-${count}`,
    username: overrides.username ?? `user${count}`,
    email: overrides.email ?? `user${count}@example.com`,
    displayName: overrides.displayName ?? `User ${count}`,
    bio: overrides.bio ?? '',
    avatar: overrides.avatar,
    isPrivate: overrides.isPrivate ?? false,
    joinedAt: overrides.joinedAt ?? Date.now(),
    lastActive: overrides.lastActive ?? Date.now(),
    friendsCount: overrides.friendsCount ?? 0,
    postsCount: overrides.postsCount ?? 0,
    streak: overrides.streak ?? 0,
    settings: overrides.settings ?? { ...defaultSettings },
  };
};

export const createTestSession = (overrides: Partial<AuthSession> = {}): AuthSession => {
  const now = Date.now();
  return {
    userId: overrides.userId ?? `user-${userSequence || 1}`,
    token: overrides.token ?? `token-${now}`,
    expiresAt: overrides.expiresAt ?? now + 1000 * 60 * 60,
    lastRefresh: overrides.lastRefresh ?? now,
  };
};

export const createTestPost = (overrides: Partial<Post> = {}): Post => {
  postSequence += 1;
  const count = postSequence;
  const ownerId = overrides.userId ?? `user-${userSequence || 1}`;
  return {
    id: overrides.id ?? `post-${count}`,
    userId: ownerId,
    username: overrides.username ?? `user${count}`,
    displayName: overrides.displayName ?? `User ${count}`,
    userAvatar: overrides.userAvatar,
    frontImage: overrides.frontImage ?? `https://example.com/front-${count}.jpg`,
    backImage: overrides.backImage ?? `https://example.com/back-${count}.jpg`,
    timestamp: overrides.timestamp ?? Date.now(),
    location: overrides.location,
    isLate: overrides.isLate ?? false,
    lateMinutes: overrides.lateMinutes ?? 0,
    likes: overrides.likes ?? [],
    comments: overrides.comments ?? [],
    visibility: overrides.visibility ?? 'friends',
    createdAt: overrides.createdAt ?? Date.now(),
    updatedAt: overrides.updatedAt,
  };
};

export const createAuthContextValue = (
  overrides: Partial<AuthContextType> = {}
): AuthContextType => {
  const defaultUser = overrides.user ?? null;
  const defaultLogin: AuthContextType['login'] = overrides.login ?? (jest.fn(async () => true) as AuthContextType['login']);
  const defaultRegister: AuthContextType['register'] =
    overrides.register ?? (jest.fn(async () => true) as AuthContextType['register']);
  const defaultLogout: AuthContextType['logout'] =
    overrides.logout ?? (jest.fn(async () => undefined) as AuthContextType['logout']);
  const defaultUpdateUser: AuthContextType['updateUser'] =
    overrides.updateUser ?? (jest.fn(async () => undefined) as AuthContextType['updateUser']);
  const defaultRefreshSession: AuthContextType['refreshSession'] =
    overrides.refreshSession ?? (jest.fn(async () => undefined) as AuthContextType['refreshSession']);
  return {
    user: defaultUser,
    isLoading: overrides.isLoading ?? false,
    isAuthenticated: overrides.isAuthenticated ?? !!defaultUser,
    login: defaultLogin,
    register: defaultRegister,
    logout: defaultLogout,
    updateUser: defaultUpdateUser,
    refreshSession: defaultRefreshSession,
  };
};

export const resetTestSequences = () => {
  userSequence = 0;
  postSequence = 0;
};
