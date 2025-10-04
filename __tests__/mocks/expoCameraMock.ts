export const CameraType = {
  back: 'back',
  front: 'front',
} as const;

export const FlashMode = {
  off: 'off',
  on: 'on',
  auto: 'auto',
} as const;

export const requestPermissionsAsync = jest.fn(async () => ({
  status: 'granted',
  granted: true,
}));

export const Camera = {
  requestCameraPermissionsAsync: requestPermissionsAsync,
  getAvailableCameraTypesAsync: jest.fn(async () => [CameraType.back, CameraType.front]),
};

export default {
  Camera,
  CameraType,
  FlashMode,
  requestPermissionsAsync,
};
