import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  TextInput,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types/User';
import { Post } from '../types/Post';
import * as UserStorage from '../services/UserStorage';
import * as FriendService from '../services/FriendService';
import * as PostService from '../services/PostService';

const DiscoveryScreen: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'posts'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [discoveryPosts, setDiscoveryPosts] = useState<Post[]>([]);
  const [friendStatuses, setFriendStatuses] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, activeTab]);

  const loadData = async () => {
    if (!user) return;

    try {
      if (activeTab === 'users') {
        await loadSuggestedUsers();
        if (searchQuery.trim()) {
          await handleSearch();
        }
      } else {
        await loadDiscoveryPosts();
      }
    } catch (error) {
      console.error('Error loading discovery data:', error);
    }
  };

  const loadSuggestedUsers = async () => {
    if (!user) return;

    try {
      const suggestions = await FriendService.getFriendSuggestions(user.id, 20);
      setSuggestedUsers(suggestions);
      
      // Load friendship statuses
      const statuses: Record<string, string> = {};
      for (const suggestedUser of suggestions) {
        const status = await FriendService.getFriendshipStatus(user.id, suggestedUser.id);
        statuses[suggestedUser.id] = status;
      }
      setFriendStatuses(statuses);
    } catch (error) {
      console.error('Error loading suggested users:', error);
    }
  };

  const loadDiscoveryPosts = async () => {
    if (!user) return;

    try {
      const posts = await PostService.getDiscoveryPosts(user.id);
      setDiscoveryPosts(posts);
    } catch (error) {
      console.error('Error loading discovery posts:', error);
    }
  };

  const handleSearch = async () => {
    if (!user || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await UserStorage.searchUsers(searchQuery.trim(), user.id);
      setSearchResults(results);
      
      // Load friendship statuses for search results
      const statuses: Record<string, string> = {};
      for (const searchUser of results) {
        const status = await FriendService.getFriendshipStatus(user.id, searchUser.id);
        statuses[searchUser.id] = status;
      }
      setFriendStatuses(prev => ({ ...prev, ...statuses }));
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleFriendRequest = async (targetUserId: string) => {
    if (!user) return;

    try {
      const success = await FriendService.sendFriendRequest(user.id, targetUserId);
      if (success) {
        setFriendStatuses(prev => ({ ...prev, [targetUserId]: 'pending_sent' }));
        Alert.alert('Success', 'Friend request sent!');
      } else {
        Alert.alert('Error', 'Failed to send friend request');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const status = friendStatuses[item.id] || 'none';
    
    const renderActionButton = () => {
      switch (status) {
        case 'friends':
          return (
            <View style={[styles.addButton, styles.friendsButton]}>
              <Text style={[styles.addButtonText, styles.friendsButtonText]}>Friends</Text>
            </View>
          );
        case 'pending_sent':
          return (
            <View style={[styles.addButton, styles.pendingButton]}>
              <Text style={[styles.addButtonText, styles.pendingButtonText]}>Sent</Text>
            </View>
          );
        case 'pending_received':
          return (
            <TouchableOpacity 
              style={[styles.addButton, styles.acceptButton]}
              onPress={() => {
                // Handle accept friend request - would need to implement this
                Alert.alert('Accept Friend Request', 'This feature would accept the friend request');
              }}
            >
              <Text style={styles.addButtonText}>Accept</Text>
            </TouchableOpacity>
          );
        default:
          return (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => handleFriendRequest(item.id)}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          );
      }
    };

    return (
      <View style={styles.userItem}>
        <View style={styles.userInfo}>
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
          
          <View style={styles.userDetails}>
            <Text style={styles.username}>{item.displayName}</Text>
            <Text style={styles.usernameHandle}>@{item.username}</Text>
            {item.bio && (
              <Text style={styles.userBio} numberOfLines={1}>{item.bio}</Text>
            )}
            <Text style={styles.lastActive}>
              {item.friendsCount} friends
            </Text>
          </View>
        </View>
        
        {renderActionButton()}
      </View>
    );
  };

  const renderEmptyState = () => {
    if (activeTab === 'users') {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>
            {searchQuery ? 'No users found' : 'No new people to discover'}
          </Text>
          <Text style={styles.emptyStateSubtitle}>
            {searchQuery ? 'Try searching for something else' : 'Check back later for more suggestions!'}
          </Text>
        </View>
      );
    } else {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No posts to discover</Text>
          <Text style={styles.emptyStateSubtitle}>
            Posts from users you're not friends with will appear here
          </Text>
        </View>
      );
    }
  };

  const getCurrentData = () => {
    if (activeTab === 'posts') {
      return discoveryPosts;
    }
    return searchQuery.trim() ? searchResults : suggestedUsers;
  };

  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.emptyStateTitle}>Please log in to discover</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discovery</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Text style={styles.refreshButtonText}>⟳</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
            Posts
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'users' && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for users..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text.trim()) {
                const timeoutId = setTimeout(() => handleSearch(), 500);
                return () => clearTimeout(timeoutId);
              } else {
                setSearchResults([]);
              }
            }}
          />
        </View>
      )}
      
      <FlatList
        data={getCurrentData()}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.usersList}
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
  refreshButton: {
    padding: 10,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 20,
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
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  usersList: {
    paddingHorizontal: 20,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  userInfo: {
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
  userDetails: {
    flex: 1,
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  usernameHandle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 4,
  },
  userBio: {
    color: '#ccc',
    fontSize: 13,
    marginBottom: 4,
  },
  lastActive: {
    color: '#666',
    fontSize: 11,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  friendsButton: {
    backgroundColor: '#666',
  },
  friendsButtonText: {
    color: '#fff',
  },
  pendingButton: {
    backgroundColor: '#ff9800',
  },
  pendingButtonText: {
    color: '#fff',
  },
  acceptButton: {
    backgroundColor: '#2196F3',
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

export default DiscoveryScreen;
