import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, FriendRequest, Friendship } from '../types/User';

const STORAGE_KEYS = {
  USERS: '@BeReal:users',
  FRIEND_REQUESTS: '@BeReal:friendRequests',
  FRIENDSHIPS: '@BeReal:friendships',
  USER_POSTS: '@BeReal:userPosts',
};

// User Management
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    return usersData ? JSON.parse(usersData) : [];
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
};

export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const users = await getAllUsers();
    return users.find(user => user.id === userId) || null;
  } catch (error) {
    console.error('Error getting user by id:', error);
    return null;
  }
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  try {
    const users = await getAllUsers();
    return users.find(user => user.username.toLowerCase() === username.toLowerCase()) || null;
  } catch (error) {
    console.error('Error getting user by username:', error);
    return null;
  }
};

export const saveUser = async (user: User): Promise<void> => {
  try {
    const users = await getAllUsers();
    const existingIndex = users.findIndex(u => u.id === user.id);
    
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (error) {
    console.error('Error saving user:', error);
    throw error;
  }
};

export const updateUser = async (user: User): Promise<void> => {
  try {
    await saveUser(user);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const users = await getAllUsers();
    const filteredUsers = users.filter(user => user.id !== userId);
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filteredUsers));
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const searchUsers = async (query: string, excludeUserId?: string): Promise<User[]> => {
  try {
    const users = await getAllUsers();
    const lowercaseQuery = query.toLowerCase();
    
    return users.filter(user => {
      if (excludeUserId && user.id === excludeUserId) return false;
      
      return (
        user.username.toLowerCase().includes(lowercaseQuery) ||
        user.displayName.toLowerCase().includes(lowercaseQuery) ||
        (user.email && user.email.toLowerCase().includes(lowercaseQuery))
      );
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

// Friend Request Management
export const getFriendRequests = async (): Promise<FriendRequest[]> => {
  try {
    const requestsData = await AsyncStorage.getItem(STORAGE_KEYS.FRIEND_REQUESTS);
    return requestsData ? JSON.parse(requestsData) : [];
  } catch (error) {
    console.error('Error getting friend requests:', error);
    return [];
  }
};

export const saveFriendRequest = async (request: FriendRequest): Promise<void> => {
  try {
    const requests = await getFriendRequests();
    const existingIndex = requests.findIndex(r => r.id === request.id);
    
    if (existingIndex >= 0) {
      requests[existingIndex] = request;
    } else {
      requests.push(request);
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.FRIEND_REQUESTS, JSON.stringify(requests));
  } catch (error) {
    console.error('Error saving friend request:', error);
    throw error;
  }
};

export const getUserFriendRequests = async (userId: string, type: 'sent' | 'received'): Promise<FriendRequest[]> => {
  try {
    const requests = await getFriendRequests();
    
    if (type === 'sent') {
      return requests.filter(r => r.fromUserId === userId);
    } else {
      return requests.filter(r => r.toUserId === userId && r.status === 'pending');
    }
  } catch (error) {
    console.error('Error getting user friend requests:', error);
    return [];
  }
};

// Friendship Management
export const getFriendships = async (): Promise<Friendship[]> => {
  try {
    const friendshipsData = await AsyncStorage.getItem(STORAGE_KEYS.FRIENDSHIPS);
    return friendshipsData ? JSON.parse(friendshipsData) : [];
  } catch (error) {
    console.error('Error getting friendships:', error);
    return [];
  }
};

export const saveFriendship = async (friendship: Friendship): Promise<void> => {
  try {
    const friendships = await getFriendships();
    const existingIndex = friendships.findIndex(f => f.id === friendship.id);
    
    if (existingIndex >= 0) {
      friendships[existingIndex] = friendship;
    } else {
      friendships.push(friendship);
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.FRIENDSHIPS, JSON.stringify(friendships));
  } catch (error) {
    console.error('Error saving friendship:', error);
    throw error;
  }
};

export const getUserFriends = async (userId: string): Promise<User[]> => {
  try {
    const friendships = await getFriendships();
    const users = await getAllUsers();
    
    const userFriendships = friendships.filter(f => 
      (f.user1Id === userId || f.user2Id === userId) && f.status === 'active'
    );
    
    const friendIds = userFriendships.map(f => 
      f.user1Id === userId ? f.user2Id : f.user1Id
    );
    
    return users.filter(user => friendIds.includes(user.id));
  } catch (error) {
    console.error('Error getting user friends:', error);
    return [];
  }
};

export const areFriends = async (userId1: string, userId2: string): Promise<boolean> => {
  try {
    const friendships = await getFriendships();
    
    return friendships.some(f => 
      ((f.user1Id === userId1 && f.user2Id === userId2) ||
       (f.user1Id === userId2 && f.user2Id === userId1)) &&
      f.status === 'active'
    );
  } catch (error) {
    console.error('Error checking friendship:', error);
    return false;
  }
};

// Utility functions
export const generateFriendRequestId = (): string => {
  return `friendRequest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const generateFriendshipId = (): string => {
  return `friendship_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Statistics
export const updateUserStats = async (userId: string): Promise<void> => {
  try {
    const user = await getUserById(userId);
    if (!user) return;
    
    const friends = await getUserFriends(userId);
    
    // Get user's posts count (we'll implement this when we update the post system)
    const postsData = await AsyncStorage.getItem(`@BeReal:posts:${userId}`);
    const posts = postsData ? JSON.parse(postsData) : [];
    
    // Calculate streak (simplified)
    const streak = await calculateUserStreak(userId);
    
    const updatedUser: User = {
      ...user,
      friendsCount: friends.length,
      postsCount: posts.length,
      streak,
    };
    
    await updateUser(updatedUser);
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
};

const calculateUserStreak = async (userId: string): Promise<number> => {
  try {
    const postsData = await AsyncStorage.getItem(`@BeReal:posts:${userId}`);
    if (!postsData) return 0;
    
    const posts = JSON.parse(postsData);
    const sortedPosts = posts.sort((a: any, b: any) => b.timestamp - a.timestamp);
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < sortedPosts.length; i++) {
      const postDate = new Date(sortedPosts[i].timestamp);
      const daysDiff = Math.floor((today.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === i) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
};
