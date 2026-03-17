import { useAuthStore } from '@/src/store';

export interface LoginRequest {
  email: string;
  password: string;
}

export const useAuth = () => {
  const { user, isAuthenticated, setUser, setToken, logout: logoutStore } = useAuthStore();

  const login = async (credentials: LoginRequest) => {
    try {
      // TODO: Replace with actual API call
      // const response = await authService.login(credentials);
      
      // Mock login for now
      const mockUser = {
        id: '1',
        email: credentials.email,
        name: 'Test User',
      };
      
      setUser(mockUser);
      setToken('mock-token');
      
      return { success: true, data: { user: mockUser, token: 'mock-token' } };
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // TODO: Call API logout
      // await authService.logout();
    } finally {
      logoutStore();
    }
  };

  const updateUser = (updatedUser: any) => {
    setUser(updatedUser);
  };

  return {
    user,
    isAuthenticated,
    login,
    logout,
    updateUser,
  };
};
