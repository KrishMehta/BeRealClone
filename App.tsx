import React, { useState } from 'react';
import { View, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import CameraScreen from './src/screens/CameraScreen';
import FeedScreen from './src/screens/FeedScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FriendsScreen from './src/screens/FriendsScreen';
import DiscoveryScreen from './src/screens/DiscoveryScreen';
import BottomTabBar from './src/components/BottomTabBar';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Camera');

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
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        {renderScreen()}
        <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />
      </View>
    </SafeAreaProvider>
  );
};

export default App;
