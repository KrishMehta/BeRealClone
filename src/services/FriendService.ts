import { User, FriendRequest, Friendship } from '../types/User';
import * as UserStorage from './UserStorage';

export const sendFriendRequest = async (fromUserId: string, toUserId: string): Promise<boolean> => {
  try {
    // Check if users exist
    const fromUser = await UserStorage.getUserById(fromUserId);
    const toUser = await UserStorage.getUserById(toUserId);
    
    if (!fromUser || !toUser) {
      throw new Error('One or both users not found');
    }
    
    // Check if they're already friends
    const areFriends = await UserStorage.areFriends(fromUserId, toUserId);
    if (areFriends) {
      throw new Error('Users are already friends');
    }
    
    // Check if request already exists
    const existingRequests = await UserStorage.getFriendRequests();
    const existingRequest = existingRequests.find(r => 
      r.fromUserId === fromUserId && r.toUserId === toUserId && r.status === 'pending'
    );
    
    if (existingRequest) {
      throw new Error('Friend request already sent');
    }
    
    // Check if target user allows friend requests
    if (!toUser.settings.allowFriendRequests) {
      throw new Error('User is not accepting friend requests');
    }
    
    // Create friend request
    const friendRequest: FriendRequest = {
      id: UserStorage.generateFriendRequestId(),
      fromUserId,
      toUserId,
      status: 'pending',
      timestamp: Date.now(),
    };
    
    await UserStorage.saveFriendRequest(friendRequest);
    return true;
  } catch (error) {
    console.error('Error sending friend request:', error);
    return false;
  }
};

export const acceptFriendRequest = async (requestId: string, userId: string): Promise<boolean> => {
  try {
    // Get the friend request
    const requests = await UserStorage.getFriendRequests();
    const request = requests.find(r => r.id === requestId && r.toUserId === userId);
    
    if (!request || request.status !== 'pending') {
      throw new Error('Friend request not found or already processed');
    }
    
    // Update request status
    request.status = 'accepted';
    await UserStorage.saveFriendRequest(request);
    
    // Create friendship
    const friendship: Friendship = {
      id: UserStorage.generateFriendshipId(),
      user1Id: request.fromUserId,
      user2Id: request.toUserId,
      createdAt: Date.now(),
      status: 'active',
    };
    
    await UserStorage.saveFriendship(friendship);
    
    // Update both users' friend counts
    await UserStorage.updateUserStats(request.fromUserId);
    await UserStorage.updateUserStats(request.toUserId);
    
    return true;
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return false;
  }
};

export const declineFriendRequest = async (requestId: string, userId: string): Promise<boolean> => {
  try {
    const requests = await UserStorage.getFriendRequests();
    const request = requests.find(r => r.id === requestId && r.toUserId === userId);
    
    if (!request || request.status !== 'pending') {
      throw new Error('Friend request not found or already processed');
    }
    
    request.status = 'declined';
    await UserStorage.saveFriendRequest(request);
    
    return true;
  } catch (error) {
    console.error('Error declining friend request:', error);
    return false;
  }
};

export const cancelFriendRequest = async (requestId: string, userId: string): Promise<boolean> => {
  try {
    const requests = await UserStorage.getFriendRequests();
    const requestIndex = requests.findIndex(r => r.id === requestId && r.fromUserId === userId);
    
    if (requestIndex === -1) {
      throw new Error('Friend request not found');
    }
    
    // Remove the request
    requests.splice(requestIndex, 1);
    await UserStorage.saveFriendRequest(requests[0]); // This will save the updated array
    
    return true;
  } catch (error) {
    console.error('Error canceling friend request:', error);
    return false;
  }
};

export const removeFriend = async (userId: string, friendId: string): Promise<boolean> => {
  try {
    const friendships = await UserStorage.getFriendships();
    const friendship = friendships.find(f => 
      ((f.user1Id === userId && f.user2Id === friendId) ||
       (f.user1Id === friendId && f.user2Id === userId)) &&
      f.status === 'active'
    );
    
    if (!friendship) {
      throw new Error('Friendship not found');
    }
    
    friendship.status = 'blocked'; // We'll use 'blocked' to indicate removed
    await UserStorage.saveFriendship(friendship);
    
    // Update both users' friend counts
    await UserStorage.updateUserStats(userId);
    await UserStorage.updateUserStats(friendId);
    
    return true;
  } catch (error) {
    console.error('Error removing friend:', error);
    return false;
  }
};

export const blockUser = async (userId: string, userToBlockId: string): Promise<boolean> => {
  try {
    // Remove friendship if exists
    await removeFriend(userId, userToBlockId);
    
    // Decline any pending friend requests from the blocked user
    const receivedRequests = await UserStorage.getUserFriendRequests(userId, 'received');
    const requestFromBlockedUser = receivedRequests.find(r => r.fromUserId === userToBlockId);
    
    if (requestFromBlockedUser) {
      await declineFriendRequest(requestFromBlockedUser.id, userId);
    }
    
    // Cancel any pending requests to the blocked user
    const sentRequests = await UserStorage.getUserFriendRequests(userId, 'sent');
    const requestToBlockedUser = sentRequests.find(r => r.toUserId === userToBlockId);
    
    if (requestToBlockedUser) {
      await cancelFriendRequest(requestToBlockedUser.id, userId);
    }
    
    // In a full implementation, you'd maintain a separate blocked users list
    // For now, we'll just remove the friendship
    
    return true;
  } catch (error) {
    console.error('Error blocking user:', error);
    return false;
  }
};

export const getPendingFriendRequests = async (userId: string): Promise<(FriendRequest & { fromUser: User })[]> => {
  try {
    const requests = await UserStorage.getUserFriendRequests(userId, 'received');
    const users = await UserStorage.getAllUsers();
    
    return requests
      .filter(r => r.status === 'pending')
      .map(request => {
        const fromUser = users.find(u => u.id === request.fromUserId);
        return fromUser ? { ...request, fromUser } : null;
      })
      .filter(Boolean) as (FriendRequest & { fromUser: User })[];
  } catch (error) {
    console.error('Error getting pending friend requests:', error);
    return [];
  }
};

export const getSentFriendRequests = async (userId: string): Promise<(FriendRequest & { toUser: User })[]> => {
  try {
    const requests = await UserStorage.getUserFriendRequests(userId, 'sent');
    const users = await UserStorage.getAllUsers();
    
    return requests
      .filter(r => r.status === 'pending')
      .map(request => {
        const toUser = users.find(u => u.id === request.toUserId);
        return toUser ? { ...request, toUser } : null;
      })
      .filter(Boolean) as (FriendRequest & { toUser: User })[];
  } catch (error) {
    console.error('Error getting sent friend requests:', error);
    return [];
  }
};

export const getFriendshipStatus = async (userId: string, otherUserId: string): Promise<'none' | 'pending_sent' | 'pending_received' | 'friends'> => {
  try {
    // Check if they're friends
    const areFriends = await UserStorage.areFriends(userId, otherUserId);
    if (areFriends) return 'friends';
    
    // Check for pending requests
    const requests = await UserStorage.getFriendRequests();
    
    // Check if current user sent a request
    const sentRequest = requests.find(r => 
      r.fromUserId === userId && r.toUserId === otherUserId && r.status === 'pending'
    );
    if (sentRequest) return 'pending_sent';
    
    // Check if current user received a request
    const receivedRequest = requests.find(r => 
      r.fromUserId === otherUserId && r.toUserId === userId && r.status === 'pending'
    );
    if (receivedRequest) return 'pending_received';
    
    return 'none';
  } catch (error) {
    console.error('Error getting friendship status:', error);
    return 'none';
  }
};

export const getFriendSuggestions = async (userId: string, limit: number = 10): Promise<User[]> => {
  try {
    const allUsers = await UserStorage.getAllUsers();
    const userFriends = await UserStorage.getUserFriends(userId);
    const friendIds = userFriends.map(f => f.id);
    
    // Get users who are not the current user and not already friends
    const suggestions = allUsers.filter(user => 
      user.id !== userId && 
      !friendIds.includes(user.id) &&
      !user.isPrivate // Only suggest public users
    );
    
    // In a real implementation, you might use more sophisticated algorithms
    // like mutual friends, location, interests, etc.
    
    // For now, just return random users, prioritizing recently active ones
    suggestions.sort((a, b) => b.lastActive - a.lastActive);
    
    return suggestions.slice(0, limit);
  } catch (error) {
    console.error('Error getting friend suggestions:', error);
    return [];
  }
};
