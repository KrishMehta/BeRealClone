import '@testing-library/jest-native/extend-expect';
import React from 'react';
import { cleanup } from '@testing-library/react-native';
import { resetAsyncStorage } from '../mocks/asyncStorageMock';

jest.mock('react-native-safe-area-context', () => {
  const mock = jest.requireActual('react-native-safe-area-context/jest/mock');
  return {
    ...mock,
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

beforeEach(() => {
  resetAsyncStorage();
  jest.clearAllMocks();
});

afterEach(async () => {
  await cleanup();
});

jest.setTimeout(15000);
