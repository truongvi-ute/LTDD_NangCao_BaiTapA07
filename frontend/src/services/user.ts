import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api/apiClient';

export const UserService = {
  async saveUser(user: any): Promise<void> {
    await AsyncStorage.setItem('user', JSON.stringify(user));
  },

  async getUser(): Promise<any> {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  async clearUser(): Promise<void> {
    await AsyncStorage.removeItem('user');
  },

  async fetchProfile(): Promise<any> {
    const response = await apiClient.get('/user/profile');
    if (response.success && response.data) {
      const userData = response.data;
      
      // Ensure property consistency: map avatarUrl to avatar if needed
      if (userData.avatarUrl && !userData.avatar) {
        userData.avatar = userData.avatarUrl;
      }
      
      // Save to AsyncStorage
      await this.saveUser(userData);
      return userData;
    }
    return null;
  },
};
