import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = await AsyncStorage.getItem('authToken');

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // User endpoints
  async getUserProfile(userId) {
    return this.request(`/users/${userId}`);
  }

  async updateProfile(profileData) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async uploadAvatar(imageUri) {
    const formData = new FormData();
    formData.append('avatar', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    });

    return this.request('/users/avatar', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
  }

  async updateLocation(locationData) {
    return this.request('/users/location', {
      method: 'PUT',
      body: JSON.stringify(locationData),
    });
  }

  async searchUsers(query, page = 1, limit = 20) {
    return this.request(`/users/search/${encodeURIComponent(query)}?page=${page}&limit=${limit}`);
  }

  async getNearbyUsers(latitude, longitude, maxDistance = 10) {
    return this.request(`/users/nearby?latitude=${latitude}&longitude=${longitude}&maxDistance=${maxDistance}`);
  }

  // Post endpoints
  async createPost(postData) {
    const formData = new FormData();
    formData.append('frontImage', {
      uri: postData.frontImage,
      type: 'image/jpeg',
      name: 'front.jpg',
    });
    formData.append('backImage', {
      uri: postData.backImage,
      type: 'image/jpeg',
      name: 'back.jpg',
    });
    formData.append('caption', postData.caption || '');
    formData.append('visibility', postData.visibility || 'friends');
    if (postData.location) {
      formData.append('location', JSON.stringify(postData.location));
    }

    return this.request('/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
  }

  async getFeed(page = 1, limit = 20) {
    return this.request(`/posts/feed?page=${page}&limit=${limit}`);
  }

  async getUserPosts(userId, page = 1, limit = 20) {
    return this.request(`/posts/user/${userId}?page=${page}&limit=${limit}`);
  }

  async likePost(postId) {
    return this.request(`/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  async unlikePost(postId) {
    return this.request(`/posts/${postId}/like`, {
      method: 'DELETE',
    });
  }

  async addComment(postId, text) {
    return this.request(`/posts/${postId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async sharePost(postId) {
    return this.request(`/posts/${postId}/share`, {
      method: 'POST',
    });
  }

  async deletePost(postId) {
    return this.request(`/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  // Friend endpoints
  async sendFriendRequest(recipientId) {
    return this.request('/friends/request', {
      method: 'POST',
      body: JSON.stringify({ recipientId }),
    });
  }

  async acceptFriendRequest(requestId) {
    return this.request(`/friends/accept/${requestId}`, {
      method: 'POST',
    });
  }

  async rejectFriendRequest(requestId) {
    return this.request(`/friends/reject/${requestId}`, {
      method: 'POST',
    });
  }

  async getFriends() {
    return this.request('/friends');
  }

  async getPendingRequests() {
    return this.request('/friends/pending');
  }

  async getSentRequests() {
    return this.request('/friends/sent');
  }

  async removeFriend(friendId) {
    return this.request(`/friends/${friendId}`, {
      method: 'DELETE',
    });
  }

  async getMutualFriends(userId) {
    return this.request(`/friends/mutual/${userId}`);
  }

  async blockUser(userId) {
    return this.request(`/friends/block/${userId}`, {
      method: 'POST',
    });
  }

  async unblockUser(userId) {
    return this.request(`/friends/block/${userId}`, {
      method: 'DELETE',
    });
  }

  // Notification endpoints
  async getNotifications(page = 1, limit = 20) {
    return this.request(`/notifications?page=${page}&limit=${limit}`);
  }

  async getUnreadCount() {
    return this.request('/notifications/unread-count');
  }

  async markNotificationAsRead(notificationId) {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/mark-all-read', {
      method: 'PUT',
    });
  }

  async deleteNotification(notificationId) {
    return this.request(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  async clearAllNotifications() {
    return this.request('/notifications', {
      method: 'DELETE',
    });
  }
}

export default new ApiService();
