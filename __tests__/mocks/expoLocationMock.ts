export const Accuracy = {
  High: 4,
  Balanced: 3,
  Low: 2,
  Lowest: 1,
} as const;

export const requestForegroundPermissionsAsync = jest.fn(async () => ({
  status: 'granted',
  granted: true,
}));

export const getCurrentPositionAsync = jest.fn(async () => ({
  coords: {
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 5,
  },
  timestamp: Date.now(),
}));

export default {
  Accuracy,
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
};
