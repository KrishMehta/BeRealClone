import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import * as PostService from '../services/PostService';
import { Post } from '../types/Post';
// import ImageView from 'react-native-image-viewing';

const { width, height } = Dimensions.get('window');

interface FeedItemProps {
  post: Post;
  onImagePress: (image: string) => void;
  currentUserId: string;
  onLike: (postId: string) => void;
  onUnlike: (postId: string) => void;
}

const FeedItem: React.FC<FeedItemProps> = ({ post, onImagePress, currentUserId, onLike, onUnlike }) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <View style={styles.feedItem}>
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            {post.userAvatar ? (
              <Image source={{ uri: post.userAvatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {post.displayName ? post.displayName[0].toUpperCase() : 'U'}
              </Text>
            )}
          </View>
          <View>
            <Text style={styles.username}>
              {post.displayName || post.username}
            </Text>
            <View style={styles.timestampContainer}>
              <Text style={styles.timestamp}>
                {formatTime(post.timestamp)}
              </Text>
              {post.isLate && (
                <Text style={styles.lateIndicator}>
                  • {post.lateMinutes}m late
                </Text>
              )}
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Text style={styles.moreButtonText}>⋯</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.dualImageContainer}>
        <TouchableOpacity 
          style={styles.imageContainer}
          onPress={() => onImagePress(post.frontImage)}
        >
          <Image source={{ uri: post.frontImage }} style={styles.postImage} />
          <View style={styles.imageLabel}>
            <Text style={styles.imageLabelText}>Front</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.imageContainer}
          onPress={() => onImagePress(post.backImage)}
        >
          <Image source={{ uri: post.backImage }} style={styles.postImage} />
          <View style={styles.imageLabel}>
            <Text style={styles.imageLabelText}>Back</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {
            const userLiked = post.likes.some(like => like.userId === currentUserId);
            if (userLiked) {
              onUnlike(post.id);
            } else {
              onLike(post.id);
            }
          }}
        >
          <Text style={styles.actionText}>
            {post.likes.some(like => like.userId === currentUserId) ? '❤️' : '🤍'}
          </Text>
          {post.likes.length > 0 && (
            <Text style={styles.actionCount}>{post.likes.length}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>💬</Text>
          {post.comments.length > 0 && (
            <Text style={styles.actionCount}>{post.comments.length}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>📤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const FeedScreen: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageViewVisible, setImageViewVisible] = useState(false);

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user]);

  const loadPosts = async () => {
    if (!user) return;
    
    try {
      const feedPosts = await PostService.getFeedPosts(user.id);
      setPosts(feedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleImagePress = (imageUri: string) => {
    setSelectedImage(imageUri);
    setImageViewVisible(true);
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    
    try {
      const success = await PostService.likePost(postId, user.id);
      if (success) {
        await loadPosts(); // Refresh posts to show updated likes
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleUnlike = async (postId: string) => {
    if (!user) return;
    
    try {
      const success = await PostService.unlikePost(postId, user.id);
      if (success) {
        await loadPosts(); // Refresh posts to show updated likes
      }
    } catch (error) {
      console.error('Error unliking post:', error);
    }
  };

  const renderFeedItem = ({ item }: { item: Post }) => (
    <FeedItem 
      post={item} 
      onImagePress={handleImagePress}
      currentUserId={user?.id || ''}
      onLike={handleLike}
      onUnlike={handleUnlike}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No posts yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Take your first BeReal to get started!
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>BeReal</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Text style={styles.headerButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={posts}
        renderItem={renderFeedItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.feedList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
      
      {/* Image viewing functionality removed for simplicity */}
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
  headerButton: {
    padding: 10,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  feedList: {
    paddingBottom: 20,
  },
  feedItem: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 15,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timestamp: {
    color: '#888',
    fontSize: 12,
  },
  moreButton: {
    padding: 5,
  },
  moreButtonText: {
    color: '#fff',
    fontSize: 20,
  },
  dualImageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  imageContainer: {
    flex: 1,
    marginHorizontal: 5,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  imageLabel: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageLabelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  postActions: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    padding: 5,
  },
  actionText: {
    fontSize: 20,
  },
  actionCount: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 5,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lateIndicator: {
    color: '#ff6b6b',
    fontSize: 11,
    marginLeft: 5,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
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

export default FeedScreen;
