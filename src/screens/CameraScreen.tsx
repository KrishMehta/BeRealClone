import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

interface Post {
  id: string;
  frontImage: string;
  backImage: string;
  timestamp: number;
  hasPosted: boolean;
}

const CameraScreen: React.FC = () => {
  const [frontCamera, setFrontCamera] = useState(true);
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [hasPostedToday, setHasPostedToday] = useState(false);
  const [canPost, setCanPost] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [cameraPermission, setCameraPermission] = useState<boolean>(false);
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState<boolean>(false);

  useEffect(() => {
    checkPermissions();
    checkDailyPost();
    startCountdown();
  }, []);

  const checkPermissions = async () => {
    try {
      // Check camera permission using ImagePicker
      const cameraPermissionResult = await ImagePicker.getCameraPermissionsAsync();
      if (cameraPermissionResult.status !== 'granted') {
        const cameraRequestResult = await ImagePicker.requestCameraPermissionsAsync();
        setCameraPermission(cameraRequestResult.status === 'granted');
        if (cameraRequestResult.status !== 'granted') {
          Alert.alert(
            'Camera Permission Required', 
            'Camera permission is needed to take photos. Please enable it in Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => {
                Alert.alert('Go to Settings', 'Please go to Settings > Privacy & Security > Camera and enable access for this app.');
              }}
            ]
          );
        }
      } else {
        setCameraPermission(true);
      }

      // Check media library permission
      const mediaLibraryPermissionResult = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (mediaLibraryPermissionResult.status !== 'granted') {
        const mediaLibraryRequestResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        setMediaLibraryPermission(mediaLibraryRequestResult.status === 'granted');
        if (mediaLibraryRequestResult.status !== 'granted') {
          Alert.alert(
            'Photo Library Permission Required', 
            'Photo library permission is needed to access your photos. Please enable it in Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => {
                Alert.alert('Go to Settings', 'Please go to Settings > Privacy & Security > Photos and enable access for this app.');
              }}
            ]
          );
        }
      } else {
        setMediaLibraryPermission(true);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const checkDailyPost = async () => {
    try {
      const lastPostDate = await AsyncStorage.getItem('lastPostDate');
      const today = new Date().toDateString();
      setHasPostedToday(lastPostDate === today);
    } catch (error) {
      console.error('Error checking daily post:', error);
    }
  };

  const startCountdown = () => {
    const now = new Date();
    const nextPost = new Date(now);
    nextPost.setHours(24, 0, 0, 0); // Next midnight
    const timeUntilNext = nextPost.getTime() - now.getTime();
    setTimeLeft(Math.floor(timeUntilNext / 1000));
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanPost(true);
          setHasPostedToday(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const takePicture = async () => {
    if (!cameraPermission) {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera permission in Settings to take photos.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Check Permissions', onPress: checkPermissions }
        ]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [1, 1],
        quality: 0.8,
        cameraType: frontCamera ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
      });
      
      if (!result.canceled && result.assets[0]) {
        if (frontCamera) {
          setFrontImage(result.assets[0].uri);
          setFrontCamera(false); // Switch to back camera
        } else {
          setBackImage(result.assets[0].uri);
          setFrontCamera(true); // Switch back to front camera
        }
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please check your camera permissions.');
    }
  };

  const selectFromGallery = async () => {
    if (!mediaLibraryPermission) {
      Alert.alert(
        'Photo Library Permission Required',
        'Please enable photo library permission in Settings to access your photos.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Check Permissions', onPress: checkPermissions }
        ]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        if (frontCamera) {
          setFrontImage(result.assets[0].uri);
          setFrontCamera(false);
        } else {
          setBackImage(result.assets[0].uri);
          setFrontCamera(true);
        }
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please check your photo library permissions.');
    }
  };

  const postToFeed = async () => {
    if (!frontImage || !backImage) {
      Alert.alert('Error', 'Please take both front and back photos');
      return;
    }

    if (hasPostedToday) {
      Alert.alert('Already Posted', 'You can only post once per day');
      return;
    }

    try {
      const post: Post = {
        id: Date.now().toString(),
        frontImage,
        backImage,
        timestamp: Date.now(),
        hasPosted: true,
      };

      // Save post to AsyncStorage
      const existingPosts = await AsyncStorage.getItem('posts');
      const posts = existingPosts ? JSON.parse(existingPosts) : [];
      posts.push(post);
      await AsyncStorage.setItem('posts', JSON.stringify(posts));
      
      // Update last post date
      await AsyncStorage.setItem('lastPostDate', new Date().toDateString());
      
      setHasPostedToday(true);
      setFrontImage(null);
      setBackImage(null);
      
      Alert.alert('Posted!', 'Your BeReal has been posted to the feed');
    } catch (error) {
      console.error('Error posting:', error);
      Alert.alert('Error', 'Failed to post');
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCamera = () => {
    if (frontImage && backImage) {
      return (
        <View style={styles.previewContainer}>
          <View style={styles.dualPreview}>
            <Image source={{ uri: frontImage }} style={styles.previewImage} />
            <Image source={{ uri: backImage }} style={styles.previewImage} />
          </View>
          <TouchableOpacity style={styles.postButton} onPress={postToFeed}>
            <Text style={styles.postButtonText}>Post to Feed</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.camera}>
        <View style={styles.cameraOverlay}>
          <View style={styles.topBar}>
            <Text style={styles.cameraText}>
              {frontCamera ? 'Take a selfie' : 'Take a photo of what you\'re doing'}
            </Text>
            {hasPostedToday && (
              <Text style={styles.timerText}>
                Next post in: {formatTime(timeLeft)}
              </Text>
            )}
            {!cameraPermission && (
              <Text style={styles.permissionText}>
                Camera permission required
              </Text>
            )}
            {!mediaLibraryPermission && (
              <Text style={styles.permissionText}>
                Photo library permission required
              </Text>
            )}
          </View>
          
          <View style={styles.bottomControls}>
            <TouchableOpacity 
              style={[styles.galleryButton, !mediaLibraryPermission && styles.disabledButton]} 
              onPress={selectFromGallery}
              disabled={!mediaLibraryPermission}
            >
              <Text style={[styles.buttonText, !mediaLibraryPermission && styles.disabledText]}>Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.captureButton, !cameraPermission && styles.disabledButton]} 
              onPress={takePicture}
              disabled={!cameraPermission}
            >
              <View style={[styles.captureButtonInner, !cameraPermission && styles.disabledCaptureButton]} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.flipButton} onPress={() => setFrontCamera(!frontCamera)}>
              <Text style={styles.buttonText}>Flip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderCamera()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  topBar: {
    paddingTop: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  cameraText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  timerText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  galleryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#000',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000',
  },
  flipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dualPreview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  previewImage: {
    width: width * 0.4,
    height: height * 0.4,
    borderRadius: 10,
  },
  postButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 30,
  },
  postButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  permissionText: {
    color: '#ff6b6b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#666',
  },
  disabledCaptureButton: {
    backgroundColor: '#666',
  },
});

export default CameraScreen;
