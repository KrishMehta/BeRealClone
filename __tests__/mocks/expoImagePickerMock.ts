export const MediaTypeOptions = {
  Images: 'Images',
  Videos: 'Videos',
  All: 'All',
} as const;

export const CameraType = {
  front: 'front',
  back: 'back',
} as const;

export const getCameraPermissionsAsync = jest.fn(async () => ({
  status: 'granted',
  granted: true,
}));

export const requestCameraPermissionsAsync = jest.fn(async () => ({
  status: 'granted',
  granted: true,
}));

export const getMediaLibraryPermissionsAsync = jest.fn(async () => ({
  status: 'granted',
  granted: true,
}));

export const requestMediaLibraryPermissionsAsync = jest.fn(async () => ({
  status: 'granted',
  granted: true,
}));

export const launchCameraAsync = jest.fn(async () => ({
  canceled: false,
  assets: [
    {
      uri: 'mock://camera-image.jpg',
      width: 400,
      height: 300,
      type: 'image',
    },
  ],
}));

export const launchImageLibraryAsync = jest.fn(async () => ({
  canceled: false,
  assets: [
    {
      uri: 'mock://library-image.jpg',
      width: 800,
      height: 600,
      type: 'image',
    },
  ],
}));

export default {
  MediaTypeOptions,
  CameraType,
  getCameraPermissionsAsync,
  requestCameraPermissionsAsync,
  getMediaLibraryPermissionsAsync,
  requestMediaLibraryPermissionsAsync,
  launchCameraAsync,
  launchImageLibraryAsync,
};
