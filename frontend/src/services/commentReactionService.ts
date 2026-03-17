import api from './api';
import { ReactionType } from '../components/ReactionPicker';

export interface ReactionDto {
  id: number;
  momentId?: number;
  commentId?: number;
  userId: number;
  userName: string;
  userAvatarUrl?: string;
  type: ReactionType;
  createdAt: string;
}

const commentReactionService = {
  async toggleReaction(commentId: number, type: ReactionType): Promise<ReactionDto | null> {
    const response = await api.post(`/reactions/comment/${commentId}?type=${type}`);
    return response.data.data;
  },

  async getCommentReactions(commentId: number): Promise<ReactionDto[]> {
    const response = await api.get(`/reactions/comment/${commentId}`);
    return response.data.data;
  },

  async getMyReaction(commentId: number): Promise<ReactionDto | null> {
    const response = await api.get(`/reactions/comment/${commentId}/my-reaction`);
    return response.data.data;
  },
};

export default commentReactionService;
