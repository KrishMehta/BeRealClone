module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/jestSetup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|react-clone-referenced-element|@expo|expo(nent)?|expo-.*|@expo-google-fonts|@unimodules|unimodules|sentry-expo|native-base|react-native-svg|@react-navigation)'
  ],
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': '<rootDir>/__tests__/mocks/styleMock.js',
    '\\.(gif|jpg|jpeg|png|svg|webp|bmp)$': '<rootDir>/__tests__/mocks/fileMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '@react-native-async-storage/async-storage': '<rootDir>/__tests__/mocks/asyncStorageMock.ts',
    'expo-camera': '<rootDir>/__tests__/mocks/expoCameraMock.ts',
    'expo-location': '<rootDir>/__tests__/mocks/expoLocationMock.ts',
    'expo-image-picker': '<rootDir>/__tests__/mocks/expoImagePickerMock.ts',
    '@react-navigation/native': '<rootDir>/__tests__/mocks/navigationMock.ts',
    '@react-navigation/native-stack': '<rootDir>/__tests__/mocks/navigationMock.ts',
    'react-native/Libraries/Animated/NativeAnimatedHelper': '<rootDir>/__tests__/mocks/nativeAnimatedHelper.js'
  },
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/types/**',
    '!src/**/__tests__/**'
  ],
  coverageReporters: ['text', 'lcov']
};
