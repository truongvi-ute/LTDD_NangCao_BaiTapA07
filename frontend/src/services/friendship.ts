import { apiClient } from './api/apiClient';
import api from './api';

export interface FriendshipDto {
  id: number;
  userId: number;
  username: string;
  name: string;
  avatarUrl: string | null;
  status: string;
  type?: string;
  createdAt: string;
}

export interface SearchUserResult {
  id: number;
  username: string;
  name: string;
  avatarUrl: string | null;
}

export const FriendshipService = {
  // Send friend request by username
  sendFriendRequest: async (username: string) => {
    const response = await apiClient.post('/friends/send-request', { username });
    return response.data;
  },

  // Accept friend request
  acceptFriendRequest: async (friendshipId: number) => {
    const response = await apiClient.post(`/friends/accept/${friendshipId}`);
    return response.data;
  },

  // Reject friend request
  rejectFriendRequest: async (friendshipId: number) => {
    const response = await apiClient.post(`/friends/reject/${friendshipId}`);
    return response.data;
  },

  // Unfriend
  unfriend: async (friendshipId: number) => {
    const response = await apiClient.delete(`/friends/unfriend/${friendshipId}`);
    return response.data;
  },

  // Get friends list
  getFriends: async (): Promise<FriendshipDto[]> => {
    const response = await apiClient.get('/friends/list');
    return response.data || [];
  },

  // Get pending requests
  getPendingRequests: async (): Promise<FriendshipDto[]> => {
    const response = await apiClient.get('/friends/requests');
    return response.data || [];
  },

  // Search user by name
  searchUser: async (name: string): Promise<SearchUserResult[]> => {
    const response = await api.get('/friends/search', {
      params: { name }
    });
    return response.data.data;
  },
};
