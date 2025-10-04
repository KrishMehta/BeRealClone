import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthSession } from '../types/User';
import * as AuthService from '../services/AuthService';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);

  const isAuthenticated = !!user && !!session;

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      const savedSession = await AuthService.getStoredSession();
      
      if (savedSession && savedSession.expiresAt > Date.now()) {
        const userData = await AuthService.getUserById(savedSession.userId);
        if (userData) {
          setUser(userData);
          setSession(savedSession);
        } else {
          await AuthService.clearSession();
        }
      } else if (savedSession) {
        // Session expired
        await AuthService.clearSession();
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      await AuthService.clearSession();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await AuthService.login(email, password);
      
      if (result.success && result.user && result.session) {
        setUser(result.user);
        setSession(result.session);
        await AuthService.storeSession(result.session);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await AuthService.register(userData);
      
      if (result.success && result.user && result.session) {
        setUser(result.user);
        setSession(result.session);
        await AuthService.storeSession(result.session);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await AuthService.logout();
      await AuthService.clearSession();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<void> => {
    if (!user) return;
    
    try {
      const updatedUser = await AuthService.updateUser(user.id, userData);
      if (updatedUser) {
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Update user error:', error);
    }
  };

  const refreshSession = async (): Promise<void> => {
    if (!session || !user) return;
    
    try {
      const newSession = await AuthService.refreshSession(session);
      if (newSession) {
        setSession(newSession);
        await AuthService.storeSession(newSession);
      }
    } catch (error) {
      console.error('Refresh session error:', error);
      await logout();
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };
