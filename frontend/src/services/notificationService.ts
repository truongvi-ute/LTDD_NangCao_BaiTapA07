import api from './api';

export interface Notification {
  id: number;
  type: 'NEW_MESSAGE' | 'FRIEND_REQUEST' | 'FRIEND_POST' | 'FRIEND_SOS' | 'COMMENT_REACTION' | 'MOMENT_REACTION' | 'NEW_COMMENT' | 'NEW_REPLY';
  actor: {
    id: number;
    username: string;
    name: string;
    profile?: {
      avatarUrl?: string;
    };
  };
  targetId: number;
  targetType: 'MOMENT' | 'ALBUM' | 'VIDEO' | 'LOCATION' | 'COMMENT' | 'USER';
  metadata?: string;
  isRead: boolean;
  createdAt: string;
}

const notificationService = {
  getNotifications: async (page = 0, size = 20) => {
    const response = await api.get(`/notifications?page=${page}&size=${size}`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data.count;
  },

  markAsRead: async (id: number) => {
    await api.put(`/notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    await api.put('/notifications/read-all');
  },
};

export default notificationService;
