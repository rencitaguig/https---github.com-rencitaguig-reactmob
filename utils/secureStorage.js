import * as SecureStore from 'expo-secure-store';

export const storeSecureItem = async (key, value) => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error('Error storing secure item:', error);
  }
};

export const getSecureItem = async (key) => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error('Error getting secure item:', error);
    return null;
  }
};

export const removeSecureItem = async (key) => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error('Error removing secure item:', error);
  }
};
