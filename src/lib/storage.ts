import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'cosmosmatch_token';

export const storage = {
  getToken: async () => {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken: async (token: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  removeToken: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
};