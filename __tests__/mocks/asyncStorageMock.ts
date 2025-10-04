const store = new Map<string, string>();

const AsyncStorageMock = {
  getItem: jest.fn(async (key: string) => {
    return store.has(key) ? store.get(key)! : null;
  }),
  setItem: jest.fn(async (key: string, value: string) => {
    store.set(key, value);
  }),
  removeItem: jest.fn(async (key: string) => {
    store.delete(key);
  }),
  clear: jest.fn(async () => {
    store.clear();
  }),
  getAllKeys: jest.fn(async () => {
    return Array.from(store.keys());
  }),
  multiGet: jest.fn(async (keys: string[]) => {
    return keys.map((key) => [key, store.get(key) ?? null]);
  }),
  multiSet: jest.fn(async (entries: [string, string][]) => {
    entries.forEach(([key, value]) => {
      store.set(key, value);
    });
  }),
  multiRemove: jest.fn(async (keys: string[]) => {
    keys.forEach((key) => store.delete(key));
  }),
};

export const resetAsyncStorage = () => {
  store.clear();
  AsyncStorageMock.getItem.mockClear();
  AsyncStorageMock.setItem.mockClear();
  AsyncStorageMock.removeItem.mockClear();
  AsyncStorageMock.clear.mockClear();
  AsyncStorageMock.getAllKeys.mockClear();
  AsyncStorageMock.multiGet.mockClear();
  AsyncStorageMock.multiSet.mockClear();
  AsyncStorageMock.multiRemove.mockClear();
};

export type AsyncStorageMockType = typeof AsyncStorageMock;

export default AsyncStorageMock as AsyncStorageMockType;
