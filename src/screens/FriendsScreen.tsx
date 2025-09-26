import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

interface Friend {
  _id: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen: string;
  stats: {
    friendsCount: number;
  };
}

interface FriendRequest {
  _id: string;
  requester: {
    _id: string;
    username: string;
    avatar?: string;
  };
  recipient: {
    _id: string;
    username: string;
    avatar?: string;
  };
  status: string;
  createdAt: string;
}

const FriendsScreen: React.FC = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');

  useEffect(() => {
    loadFriends();
    loadPendingRequests();
  }, []);

  useEffect(() => {
    filterFriends();
  }, [searchQuery, friends]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getFriends();
      setFriends(response.friends);
    } catch (error) {
      console.error('Error loading friends:', error);
      Alert.alert('Error', 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const response = await ApiService.getPendingRequests();
      setPendingRequests(response.pendingRequests);
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  const filterFriends = () => {
    if (searchQuery.trim() === '') {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter(friend =>
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFriends(filtered);
    }
  };

  const addFriend = () => {
    Alert.prompt(
      'Add Friend',
      'Enter username to send a friend request',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Request', 
          onPress: async (username) => {
            if (username && username.trim()) {
              try {
                // First search for the user
                const searchResponse = await ApiService.searchUsers(username.trim());
                if (searchResponse.users.length > 0) {
                  const userToAdd = searchResponse.users[0];
                  await ApiService.sendFriendRequest(userToAdd._id);
                  Alert.alert('Success', `Friend request sent to ${userToAdd.username}`);
                } else {
                  Alert.alert('Error', 'User not found');
                }
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to send friend request');
              }
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const removeFriend = (friendId: string) => {
    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.removeFriend(friendId);
              setFriends(friends.filter(f => f._id !== friendId));
              Alert.alert('Success', 'Friend removed successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove friend');
            }
          }
        }
      ]
    );
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      await ApiService.acceptFriendRequest(requestId);
      await loadFriends();
      await loadPendingRequests();
      Alert.alert('Success', 'Friend request accepted');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept friend request');
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      await ApiService.rejectFriendRequest(requestId);
      await loadPendingRequests();
      Alert.alert('Success', 'Friend request rejected');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to reject friend request');
    }
  };

  const renderFriendItem = ({ item }: { item: Friend }) => (
    <View style={styles.friendItem}>
      <View style={styles.friendInfo}>
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.username[0].toUpperCase()}
              </Text>
            </View>
          )}
          {item.isOnline && <View style={styles.onlineIndicator} />}
        </View>
        
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{item.username}</Text>
          <Text style={styles.lastSeen}>
            {item.isOnline ? 'Online' : `Last seen ${item.lastSeen}`}
          </Text>
          <Text style={styles.mutualFriends}>
            {item.stats.friendsCount} friends
          </Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => removeFriend(item._id)}
      >
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFriendRequestItem = ({ item }: { item: FriendRequest }) => (
    <View style={styles.friendItem}>
      <View style={styles.friendInfo}>
        <View style={styles.avatarContainer}>
          {item.requester.avatar ? (
            <Image source={{ uri: item.requester.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.requester.username[0].toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{item.requester.username}</Text>
          <Text style={styles.lastSeen}>
            Sent {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.requestButtons}>
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={() => acceptFriendRequest(item._id)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.rejectButton}
          onPress={() => rejectFriendRequest(item._id)}
        >
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No friends yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Add friends to see their BeReals!
      </Text>
      <TouchableOpacity style={styles.addFriendButton} onPress={addFriend}>
        <Text style={styles.addFriendButtonText}>Add Friends</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading friends...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friends</Text>
        <TouchableOpacity style={styles.addButton} onPress={addFriend}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Friends ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests ({pendingRequests.length})
          </Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'friends' && (
        <>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search friends..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          
          <FlatList
            data={filteredFriends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.friendsList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
          />
        </>
      )}
      
      {activeTab === 'requests' && (
        <FlatList
          data={pendingRequests}
          renderItem={renderFriendRequestItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.friendsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No pending requests</Text>
              <Text style={styles.emptyStateSubtitle}>
                You're all caught up!
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
  },
  friendsList: {
    paddingHorizontal: 20,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#000',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  lastSeen: {
    color: '#888',
    fontSize: 12,
    marginBottom: 2,
  },
  mutualFriends: {
    color: '#666',
    fontSize: 11,
  },
  removeButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  addFriendButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  addFriendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginHorizontal: 5,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#fff',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  requestButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rejectButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default FriendsScreen;
