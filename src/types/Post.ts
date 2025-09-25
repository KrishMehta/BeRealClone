export interface Post {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  userAvatar?: string;
  frontImage: string;
  backImage: string;
  timestamp: number;
  location?: PostLocation;
  isLate?: boolean;
  lateMinutes?: number;
  // Social features
  likes: PostLike[];
  comments: PostComment[];
  visibility: 'public' | 'friends' | 'private';
  // Metadata
  createdAt: number;
  updatedAt?: number;
}

export interface PostLocation {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country?: string;
}

export interface PostLike {
  id: string;
  userId: string;
  username: string;
  timestamp: number;
}

export interface PostComment {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  content: string;
  timestamp: number;
  userAvatar?: string;
}

export interface CreatePostData {
  frontImage: string;
  backImage: string;
  location?: PostLocation;
  visibility?: 'public' | 'friends' | 'private';
  isLate?: boolean;
  lateMinutes?: number;
}
