import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { User, FriendRequest } from '../types/User';
import * as UserStorage from '../services/UserStorage';
import * as FriendService from '../services/FriendService';

const FriendsScreen: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<(FriendRequest & { fromUser: User })[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFriends, setFilteredFriends] = useState<User[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, activeTab]);

  useEffect(() => {
    filterFriends();
  }, [searchQuery, friends]);

  const loadData = async () => {
    if (!user) return;

    try {
      if (activeTab === 'friends') {
        await loadFriends();
      } else {
        await loadFriendRequests();
      }
    } catch (error) {
      console.error('Error loading friends data:', error);
    }
  };

  const loadFriends = async () => {
    if (!user) return;

    try {
      const userFriends = await UserStorage.getUserFriends(user.id);
      setFriends(userFriends);
      setFilteredFriends(userFriends);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadFriendRequests = async () => {
    if (!user) return;

    try {
      const requests = await FriendService.getPendingFriendRequests(user.id);
      setFriendRequests(requests);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const filterFriends = () => {
    if (searchQuery.trim() === '') {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter(friend =>
        friend.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFriends(filtered);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    if (!user) return;

    try {
      const success = await FriendService.acceptFriendRequest(requestId, user.id);
      if (success) {
        Alert.alert('Success', 'Friend request accepted!');
        await loadFriendRequests(); // Refresh requests
        if (activeTab === 'friends') {
          await loadFriends(); // Refresh friends if on friends tab
        }
      } else {
        Alert.alert('Error', 'Failed to accept friend request');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    if (!user) return;

    try {
      const success = await FriendService.declineFriendRequest(requestId, user.id);
      if (success) {
        await loadFriendRequests(); // Refresh requests
      } else {
        Alert.alert('Error', 'Failed to decline friend request');
      }
    } catch (error) {
      console.error('Error declining friend request:', error);
      Alert.alert('Error', 'Failed to decline friend request');
    }
  };

  const handleRemoveFriend = (friendId: string, friendName: string) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friendName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            if (!user) return;
            const success = await FriendService.removeFriend(user.id, friendId);
            if (success) {
              await loadFriends(); // Refresh friends list
            } else {
              Alert.alert('Error', 'Failed to remove friend');
            }
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderFriendItem = ({ item }: { item: User }) => (
    <View style={styles.friendItem}>
      <View style={styles.friendInfo}>
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.displayName[0].toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{item.displayName}</Text>
          <Text style={styles.username}>@{item.username}</Text>
          {item.bio && (
            <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>
          )}
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => handleRemoveFriend(item.id, item.displayName)}
      >
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFriendRequestItem = ({ item }: { item: FriendRequest & { fromUser: User } }) => (
    <View style={styles.friendItem}>
      <View style={styles.friendInfo}>
        <View style={styles.avatarContainer}>
          {item.fromUser.avatar ? (
            <Image source={{ uri: item.fromUser.avatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.fromUser.displayName[0].toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{item.fromUser.displayName}</Text>
          <Text style={styles.username}>@{item.fromUser.username}</Text>
          {item.fromUser.bio && (
            <Text style={styles.bio} numberOfLines={1}>{item.fromUser.bio}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.requestActions}>
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={() => handleAcceptRequest(item.id)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.declineButton}
          onPress={() => handleDeclineRequest(item.id)}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => {
    if (activeTab === 'friends') {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No friends yet</Text>
          <Text style={styles.emptyStateSubtitle}>
            Search for users in Discovery to send friend requests!
          </Text>
        </View>
      );
    } else {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No friend requests</Text>
          <Text style={styles.emptyStateSubtitle}>
            Friend requests will appear here
          </Text>
        </View>
      );
    }
  };

  const getCurrentData = () => {
    if (activeTab === 'requests') {
      return friendRequests;
    }
    return filteredFriends;
  };

  const getCurrentRenderItem = () => {
    if (activeTab === 'requests') {
      return renderFriendRequestItem;
    }
    return renderFriendItem;
  };

  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.emptyStateTitle}>Please log in to view friends</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friends</Text>
        <View style={styles.headerBadge}>
          {friendRequests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{friendRequests.length}</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Friends ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
            Requests ({friendRequests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'friends' && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search friends..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}
      
      <FlatList
        data={getCurrentData()}
        renderItem={getCurrentRenderItem()}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.friendsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
      />
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
  headerBadge: {
    position: 'relative',
  },
  badge: {
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    color: '#888',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#fff',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
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
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  username: {
    color: '#888',
    fontSize: 14,
    marginBottom: 4,
  },
  bio: {
    color: '#ccc',
    fontSize: 13,
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
  requestActions: {
    flexDirection: 'row',
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
  declineButton: {
    backgroundColor: '#666',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  declineButtonText: {
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
  },
});

export default FriendsScreen;
