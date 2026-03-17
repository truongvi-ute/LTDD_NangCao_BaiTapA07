// Simple storage wrapper (can be replaced with AsyncStorage later)
export const storage = {
  async setItem(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      // For now, just log. Replace with AsyncStorage in production
      console.log('Storage set:', key, jsonValue);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  },

  async getItem<T>(key: string): Promise<T | null> {
    try {
      // For now, return null. Replace with AsyncStorage in production
      return null;
    } catch (error) {
      console.error('Error reading data:', error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      console.log('Storage remove:', key);
    } catch (error) {
      console.error('Error removing data:', error);
    }
  },
};
