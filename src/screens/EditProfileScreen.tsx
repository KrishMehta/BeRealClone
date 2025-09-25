import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { UserSettings } from '../types/User';

interface EditProfileScreenProps {
  onClose: () => void;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    avatar: '',
  });
  const [settings, setSettings] = useState<UserSettings>({
    allowFriendRequests: true,
    showActiveStatus: true,
    notifyOnFriendRequest: true,
    notifyOnNewPost: true,
    profileVisibility: 'public' as 'public' | 'friends' | 'private',
  });
  const [imagePermission, setImagePermission] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName,
        bio: user.bio || '',
        avatar: user.avatar || '',
      });
      setSettings(user.settings);
    }
    checkImagePermissions();
  }, [user]);

  const checkImagePermissions = async () => {
    try {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        setImagePermission(newStatus === 'granted');
      } else {
        setImagePermission(true);
      }
    } catch (error) {
      console.error('Error checking image permissions:', error);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateSettings = (field: keyof UserSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string | null => {
    if (!formData.displayName.trim()) {
      return 'Display name is required';
    }

    if (formData.displayName.length < 2) {
      return 'Display name must be at least 2 characters';
    }

    if (formData.bio.length > 150) {
      return 'Bio must be 150 characters or less';
    }

    return null;
  };

  const selectAvatar = async () => {
    if (!imagePermission) {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to change your profile picture.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Permission', onPress: checkImagePermissions }
        ]
      );
      return;
    }

    Alert.alert(
      'Select Photo',
      'Choose how you want to select your profile picture',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: () => takePicture() },
        { text: 'Photo Library', onPress: () => pickFromLibrary() }
      ]
    );
  };

  const takePicture = async () => {
    try {
      const { status } = await ImagePicker.getCameraPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await ImagePicker.requestCameraPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert('Error', 'Camera permission is required to take photos');
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        updateFormData('avatar', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const pickFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        updateFormData('avatar', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const removeAvatar = () => {
    Alert.alert(
      'Remove Profile Picture',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => updateFormData('avatar', '') }
      ]
    );
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    setIsLoading(true);
    try {
      await updateUser({
        displayName: formData.displayName.trim(),
        bio: formData.bio.trim(),
        avatar: formData.avatar,
        settings,
      });

      Alert.alert(
        'Success',
        'Profile updated successfully!',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Check if there are unsaved changes
    if (user && (
      formData.displayName !== user.displayName ||
      formData.bio !== (user.bio || '') ||
      formData.avatar !== (user.avatar || '') ||
      JSON.stringify(settings) !== JSON.stringify(user.settings)
    )) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to cancel?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard Changes', style: 'destructive', onPress: onClose }
        ]
      );
    } else {
      onClose();
    }
  };

  if (!user) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.disabledButton]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Picture Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Picture</Text>
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {formData.avatar ? (
                <Image source={{ uri: formData.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {formData.displayName[0]?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.avatarActions}>
              <TouchableOpacity style={styles.avatarButton} onPress={selectAvatar}>
                <Text style={styles.avatarButtonText}>
                  {formData.avatar ? 'Change Photo' : 'Add Photo'}
                </Text>
              </TouchableOpacity>
              {formData.avatar && (
                <TouchableOpacity style={styles.removeAvatarButton} onPress={removeAvatar}>
                  <Text style={styles.removeAvatarButtonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Basic Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Display Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.displayName}
              onChangeText={(text) => updateFormData('displayName', text)}
              placeholder="Enter your display name"
              placeholderTextColor="#666"
              maxLength={50}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={formData.bio}
              onChangeText={(text) => updateFormData('bio', text)}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              maxLength={150}
              textAlignVertical="top"
              editable={!isLoading}
            />
            <Text style={styles.characterCount}>{formData.bio.length}/150</Text>
          </View>
        </View>

        {/* Privacy Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Profile Visibility</Text>
              <Text style={styles.settingDescription}>Who can see your profile</Text>
            </View>
          </View>
          
          <View style={styles.segmentedControl}>
            {(['public', 'friends', 'private'] as const).map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.segmentButton,
                  settings.profileVisibility === option && styles.activeSegmentButton
                ]}
                onPress={() => updateSettings('profileVisibility', option)}
                disabled={isLoading}
              >
                <Text style={[
                  styles.segmentButtonText,
                  settings.profileVisibility === option && styles.activeSegmentButtonText
                ]}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Allow Friend Requests</Text>
              <Text style={styles.settingDescription}>Let others send you friend requests</Text>
            </View>
            <Switch
              value={settings.allowFriendRequests}
              onValueChange={(value) => updateSettings('allowFriendRequests', value)}
              trackColor={{ false: '#333', true: '#4CAF50' }}
              thumbColor="#fff"
              disabled={isLoading}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Active Status</Text>
              <Text style={styles.settingDescription}>Let friends see when you're online</Text>
            </View>
            <Switch
              value={settings.showActiveStatus}
              onValueChange={(value) => updateSettings('showActiveStatus', value)}
              trackColor={{ false: '#333', true: '#4CAF50' }}
              thumbColor="#fff"
              disabled={isLoading}
            />
          </View>
        </View>

        {/* Notification Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Friend Request Notifications</Text>
              <Text style={styles.settingDescription}>Get notified of new friend requests</Text>
            </View>
            <Switch
              value={settings.notifyOnFriendRequest}
              onValueChange={(value) => updateSettings('notifyOnFriendRequest', value)}
              trackColor={{ false: '#333', true: '#4CAF50' }}
              thumbColor="#fff"
              disabled={isLoading}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>New Post Notifications</Text>
              <Text style={styles.settingDescription}>Get notified when friends post</Text>
            </View>
            <Switch
              value={settings.notifyOnNewPost}
              onValueChange={(value) => updateSettings('notifyOnNewPost', value)}
              trackColor={{ false: '#333', true: '#4CAF50' }}
              thumbColor="#fff"
              disabled={isLoading}
            />
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 15,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  avatarActions: {
    flexDirection: 'row',
    gap: 10,
  },
  avatarButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  avatarButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  removeAvatarButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  removeAvatarButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingInfo: {
    flex: 1,
    marginRight: 10,
  },
  settingLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    color: '#888',
    fontSize: 14,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeSegmentButton: {
    backgroundColor: '#4CAF50',
  },
  segmentButtonText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  activeSegmentButtonText: {
    color: '#fff',
  },
  bottomSpacer: {
    height: 50,
  },
});

export default EditProfileScreen;
