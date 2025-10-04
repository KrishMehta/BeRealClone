import React from 'react';

export const NavigationContainer = ({ children }: { children: React.ReactNode }) => children;

export const useNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
});

export const useRoute = () => ({
  params: {},
});

export const createNavigationContainerRef = jest.fn(() => ({ current: null }));

export const CommonActions = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  reset: jest.fn(),
};

export const StackActions = {
  push: jest.fn(),
  pop: jest.fn(),
};

export const useFocusEffect = jest.fn();
export const useIsFocused = jest.fn(() => true);

export default {
  NavigationContainer,
  useNavigation,
  useRoute,
  createNavigationContainerRef,
  CommonActions,
  StackActions,
  useFocusEffect,
  useIsFocused,
};
