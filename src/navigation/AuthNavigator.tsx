import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

const AuthNavigator: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  const switchToLogin = () => setIsLogin(true);
  const switchToRegister = () => setIsLogin(false);

  return (
    <View style={styles.container}>
      {isLogin ? (
        <LoginScreen onSwitchToRegister={switchToRegister} />
      ) : (
        <RegisterScreen onSwitchToLogin={switchToLogin} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default AuthNavigator;
