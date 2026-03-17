import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RegisterData {
  username: string;
  name: string;
  email: string;
  password: string;
}

export interface VerifyOtpData {
  email: string;
  code: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ResendOtpData {
  email: string;
  type: string; // "registration" or "forgot-password"
}

export interface AuthResponse {
  token: string;
  type: string;
  userId: number;
  email: string;
  name: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

const authService = {
  async register(data: RegisterData): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>('/auth/register', data);
    return response.data;
  },

  async verifyRegistration(data: VerifyOtpData): Promise<ApiResponse<AuthResponse>> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/verify-registration', data);
    
    if (response.data.success && response.data.data) {
      const { token, avatarUrl, ...user } = response.data.data;
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify({ ...user, avatarUrl }));
    }
    
    return response.data;
  },

  async login(data: LoginData): Promise<ApiResponse<AuthResponse>> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    
    if (response.data.success && response.data.data) {
      const { token, avatarUrl, ...user } = response.data.data;
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify({ ...user, avatarUrl }));
    }
    
    return response.data;
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },

  async getCurrentUser(): Promise<any> {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('token');
    return !!token;
  },

  async forgotPassword(data: ForgotPasswordData): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>('/auth/forgot-password', data);
    return response.data;
  },

  async resetPassword(data: ResetPasswordData): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>('/auth/reset-password', data);
    return response.data;
  },

  async resendOtp(data: ResendOtpData): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>('/auth/resend-otp', data);
    return response.data;
  },
};

export default authService;
