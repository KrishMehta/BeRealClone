import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { CreateUserData } from '../../types/User';

interface RegisterScreenProps {
  onSwitchToLogin: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    displayName: '',
    password: '',
    confirmPassword: '',
    bio: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string | null => {
    const { username, email, displayName, password, confirmPassword } = formData;

    if (!username.trim() || !email.trim() || !displayName.trim() || !password.trim()) {
      return 'Please fill in all required fields';
    }

    if (username.length < 3) {
      return 'Username must be at least 3 characters long';
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Username can only contain letters, numbers, and underscores';
    }

    if (!isValidEmail(email)) {
      return 'Please enter a valid email address';
    }

    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }

    return null;
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    setIsLoading(true);
    try {
      const userData: CreateUserData = {
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        displayName: formData.displayName.trim(),
        password: formData.password,
        bio: formData.bio.trim(),
      };

      const success = await register(userData);
      if (!success) {
        Alert.alert('Registration Failed', 'Unable to create account. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Join BeReal!</Text>
            <Text style={styles.subtitle}>Create your account to start sharing authentic moments</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username *</Text>
              <TextInput
                style={styles.input}
                placeholder="Choose a username"
                placeholderTextColor="#666"
                value={formData.username}
                onChangeText={(text) => updateFormData('username', text)}
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#666"
                value={formData.email}
                onChangeText={(text) => updateFormData('email', text)}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Display Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="How should we display your name?"
                placeholderTextColor="#666"
                value={formData.displayName}
                onChangeText={(text) => updateFormData('displayName', text)}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Bio (Optional)</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                placeholder="Tell us about yourself..."
                placeholderTextColor="#666"
                value={formData.bio}
                onChangeText={(text) => updateFormData('bio', text)}
                multiline
                numberOfLines={3}
                maxLength={150}
                editable={!isLoading}
              />
              <Text style={styles.characterCount}>{formData.bio.length}/150</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor="#666"
                value={formData.password}
                onChangeText={(text) => updateFormData('password', text)}
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="#666"
                value={formData.confirmPassword}
                onChangeText={(text) => updateFormData('confirmPassword', text)}
                secureTextEntry
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.disabledButton]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={onSwitchToLogin} disabled={isLoading}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
    height: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  registerButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#888',
    marginRight: 5,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
});

export default RegisterScreen;
