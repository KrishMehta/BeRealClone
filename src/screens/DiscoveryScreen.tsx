import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DiscoveryUser {
  id: string;
  username: string;
  avatar?: string;
  mutualFriends: number;
  isNearby: boolean;
  distance?: number;
  lastActive: string;
}

const DiscoveryScreen: React.FC = () => {
  const [discoveryUsers, setDiscoveryUsers] = useState<DiscoveryUser[]>([]);
  const [filter, setFilter] = useState<'all' | 'nearby' | 'mutual'>('all');

  useEffect(() => {
    loadDiscoveryUsers();
  }, []);

  const loadDiscoveryUsers = async () => {
    try {
      const storedUsers = await AsyncStorage.getItem('discoveryUsers');
      if (storedUsers) {
        setDiscoveryUsers(JSON.parse(storedUsers));
      } else {
        // Add some sample discovery users for demo
        const sampleUsers: DiscoveryUser[] = [
          {
            id: '1',
            username: 'Jessica Martinez',
            mutualFriends: 3,
            isNearby: true,
            distance: 0.5,
            lastActive: '2h ago',
          },
          {
            id: '2',
            username: 'David Kim',
            mutualFriends: 7,
            isNearby: false,
            lastActive: '1d ago',
          },
          {
            id: '3',
            username: 'Lisa Thompson',
            mutualFriends: 1,
            isNearby: true,
            distance: 1.2,
            lastActive: '30m ago',
          },
          {
            id: '4',
            username: 'Ryan O\'Connor',
            mutualFriends: 5,
            isNearby: true,
            distance: 0.8,
            lastActive: '1h ago',
          },
          {
            id: '5',
            username: 'Maya Patel',
            mutualFriends: 2,
            isNearby: false,
            lastActive: '3h ago',
          },
        ];
        setDiscoveryUsers(sampleUsers);
        await AsyncStorage.setItem('discoveryUsers', JSON.stringify(sampleUsers));
      }
    } catch (error) {
      console.error('Error loading discovery users:', error);
    }
  };

  const getFilteredUsers = () => {
    switch (filter) {
      case 'nearby':
        return discoveryUsers.filter(user => user.isNearby);
      case 'mutual':
        return discoveryUsers.filter(user => user.mutualFriends > 0);
      default:
        return discoveryUsers;
    }
  };

  const sendFriendRequest = (userId: string) => {
    Alert.alert(
      'Send Friend Request',
      'Friend request sent! They\'ll be notified.',
      [{ text: 'OK' }]
    );
  };

  const renderUserItem = ({ item }: { item: DiscoveryUser }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.username[0].toUpperCase()}
            </Text>
          </View>
          {item.isNearby && <View style={styles.nearbyIndicator} />}
        </View>
        
        <View style={styles.userDetails}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.mutualFriends}>
            {item.mutualFriends} mutual friends
          </Text>
          {item.isNearby && item.distance && (
            <Text style={styles.distance}>
              {item.distance}km away
            </Text>
          )}
          <Text style={styles.lastActive}>
            Last active {item.lastActive}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => sendFriendRequest(item.id)}
      >
        <Text style={styles.addButtonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No new people to discover</Text>
      <Text style={styles.emptyStateSubtitle}>
        Check back later for more suggestions!
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discovery</Text>
        <TouchableOpacity style={styles.refreshButton}>
          <Text style={styles.refreshButtonText}>⟳</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'nearby' && styles.activeFilter]}
          onPress={() => setFilter('nearby')}
        >
          <Text style={[styles.filterText, filter === 'nearby' && styles.activeFilterText]}>
            Nearby
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterButton, filter === 'mutual' && styles.activeFilter]}
          onPress={() => setFilter('mutual')}
        >
          <Text style={[styles.filterText, filter === 'mutual' && styles.activeFilterText]}>
            Mutual
          </Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={getFilteredUsers()}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.usersList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#1a1a1a',
  },
  activeFilter: {
    backgroundColor: '#4CAF50',
  },
  filterText: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold',
  },
  activeFilterText: {
    color: '#fff',
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
  nearbyIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff6b6b',
    borderWidth: 2,
    borderColor: '#000',
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
  mutualFriends: {
    color: '#888',
    fontSize: 12,
    marginBottom: 2,
  },
  distance: {
    color: '#ff6b6b',
    fontSize: 12,
    marginBottom: 2,
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
