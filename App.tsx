import React, { useState } from 'react';
import { View, StatusBar, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import CameraScreen from './src/screens/CameraScreen';
import FeedScreen from './src/screens/FeedScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FriendsScreen from './src/screens/FriendsScreen';
import DiscoveryScreen from './src/screens/DiscoveryScreen';
import BottomTabBar from './src/components/BottomTabBar';
import AuthNavigator from './src/navigation/AuthNavigator';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Camera');
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'Camera':
        return <CameraScreen />;
      case 'Feed':
        return <FeedScreen />;
      case 'Friends':
        return <FriendsScreen />;
      case 'Discovery':
        return <DiscoveryScreen />;
      case 'Profile':
        return <ProfileScreen />;
      default:
        return <CameraScreen />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      {renderScreen()}
      <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </View>
  );
};

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
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
});

export default App;
