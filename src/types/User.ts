export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  isPrivate: boolean;
  joinedAt: number;
  lastActive: number;
  // Social stats
  friendsCount: number;
  postsCount: number;
  streak: number;
  // Privacy settings
  settings: UserSettings;
}

export interface UserSettings {
  allowFriendRequests: boolean;
  showActiveStatus: boolean;
  notifyOnFriendRequest: boolean;
  notifyOnNewPost: boolean;
  profileVisibility: 'public' | 'friends' | 'private';
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: number;
}

export interface Friendship {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: number;
  status: 'active' | 'blocked';
}

export interface CreateUserData {
  username: string;
  email: string;
  displayName: string;
  password: string;
  bio?: string;
}

export interface AuthSession {
  userId: string;
  token: string;
  expiresAt: number;
  lastRefresh: number;
}
