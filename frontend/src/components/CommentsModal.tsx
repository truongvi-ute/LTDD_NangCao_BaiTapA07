import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { buildImageUrl } from '@/src/utils/imageHelper';

const DEFAULT_AVATAR = require('@/assets/images/avatar_default.png');

export interface Comment {
  id: number;
  userId: number;
  userName: string;
  userAvatarUrl?: string;
  content: string;
  parentCommentId?: number;
  replies: Comment[];
  createdAt: string;
}

interface CommentsModalProps {
  visible: boolean;
  momentId: number;
  onClose: () => void;
  onAddComment: (content: string, parentId?: number) => Promise<void>;
  onDeleteComment: (commentId: number) => Promise<void>;
  comments: Comment[];
  loading: boolean;
  currentUserId: number;
}

export default function CommentsModal({
  visible,
  momentId,
  onClose,
  onAddComment,
  onDeleteComment,
  comments,
  loading,
  currentUserId,
}: CommentsModalProps) {
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!commentText.trim()) return;

    try {
      setSubmitting(true);
      await onAddComment(commentText, replyingTo?.id);
      setCommentText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyingTo(comment);
  };

  const handleDelete = async (commentId: number) => {
    try {
      await onDeleteComment(commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} giờ`;
    return `${Math.floor(diffMins / 1440)} ngày`;
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentContainer}>
      <Image
        source={
          item.userAvatarUrl
            ? { uri: buildImageUrl(item.userAvatarUrl) || undefined }
            : DEFAULT_AVATAR
        }
        style={styles.avatar}
        contentFit="cover"
      />
      <View style={styles.commentContent}>
        <View style={styles.commentBubble}>
          <Text style={styles.userName}>{item.userName}</Text>
          <Text style={styles.commentText}>{item.content}</Text>
        </View>
        <View style={styles.commentActions}>
          <Text style={styles.timestamp}>{formatDate(item.createdAt)}</Text>
          <TouchableOpacity onPress={() => handleReply(item)}>
            <Text style={styles.actionText}>Trả lời</Text>
          </TouchableOpacity>
          {item.userId === currentUserId && (
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <Text style={[styles.actionText, styles.deleteText]}>Xóa</Text>
            </TouchableOpacity>
          )}
        </View>
        {/* Replies */}
        {item.replies && item.replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {item.replies.map((reply) => (
              <View key={reply.id} style={styles.replyContainer}>
                <Image
                  source={
                    reply.userAvatarUrl
                      ? { uri: buildImageUrl(reply.userAvatarUrl) || undefined }
                      : DEFAULT_AVATAR
                  }
                  style={styles.replyAvatar}
                  contentFit="cover"
                />
                <View style={styles.commentContent}>
                  <View style={styles.commentBubble}>
                    <Text style={styles.userName}>{reply.userName}</Text>
                    <Text style={styles.commentText}>{reply.content}</Text>
                  </View>
                  <View style={styles.commentActions}>
                    <Text style={styles.timestamp}>{formatDate(reply.createdAt)}</Text>
                    {reply.userId === currentUserId && (
                      <TouchableOpacity onPress={() => handleDelete(reply.id)}>
                        <Text style={[styles.actionText, styles.deleteText]}>Xóa</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bình luận</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Comments List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1877F2" />
          </View>
        ) : (
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.commentsList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Chưa có bình luận nào</Text>
                <Text style={styles.emptySubtext}>Hãy là người đầu tiên bình luận!</Text>
              </View>
            }
          />
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          {replyingTo && (
            <View style={styles.replyingBanner}>
              <Text style={styles.replyingText}>
                Đang trả lời <Text style={styles.replyingName}>{replyingTo.userName}</Text>
              </Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Ionicons name="close-circle" size={20} color="#65676B" />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Viết bình luận..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
              onPress={handleSubmit}
              disabled={!commentText.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E6EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#050505',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsList: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#050505',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#65676B',
  },
  commentContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E4E6EB',
  },
  replyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E4E6EB',
  },
  commentContent: {
    flex: 1,
    marginLeft: 8,
  },
  commentBubble: {
    backgroundColor: '#F0F2F5',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#050505',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 15,
    color: '#050505',
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 12,
    gap: 12,
  },
  timestamp: {
    fontSize: 12,
    color: '#65676B',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#65676B',
  },
  deleteText: {
    color: '#F33E58',
  },
  repliesContainer: {
    marginTop: 8,
  },
  replyContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E4E6EB',
    backgroundColor: '#FFF',
  },
  replyingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F0F2F5',
  },
  replyingText: {
    fontSize: 13,
    color: '#65676B',
  },
  replyingName: {
    fontWeight: '600',
    color: '#050505',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1877F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#BCC0C4',
  },
});
