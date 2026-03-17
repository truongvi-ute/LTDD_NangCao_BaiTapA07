import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { useAlert } from '@/src/context/AlertContext';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { buildImageUrl } from '@/src/utils/imageHelper';
import momentService, { Moment } from '@/src/services/momentService';
import CommentsModal, { Comment } from './CommentsModal';
import ReactionPicker, { ReactionType } from './ReactionPicker';
import AlbumSelectModal from './AlbumSelectModal';
import api from '@/src/services/api';

const { width } = Dimensions.get('window');
const DEFAULT_AVATAR = require('@/assets/images/avatar_default.png');
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface MomentCardProps {
  moment: Moment;
  currentUserId: number;
  onReactionChange?: () => void;
  compact?: boolean; // New prop for compact mode in albums
  onRemove?: (momentId: number) => void;
}

export default function MomentCard({ moment, currentUserId, onReactionChange, compact = false, onRemove }: MomentCardProps) {
  const { showAlert } = useAlert();
  const [showComments, setShowComments] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAlbumSelect, setShowAlbumSelect] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [myReaction, setMyReaction] = useState<ReactionType | null>(null);
  const [reactionCount, setReactionCount] = useState(moment.reactionCount);
  const [commentCount, setCommentCount] = useState(moment.commentCount);
  const [isSaved, setIsSaved] = useState(false);
  const [saveCount, setSaveCount] = useState(moment.saveCount);

  // Animation for reaction button
  const reactionScale = useSharedValue(1);

  const reactionAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reactionScale.value }],
  }));

  useEffect(() => {
    // Load user's reaction on mount
    const loadMyReaction = async () => {
      try {
        const response = await api.get(`/reactions/moment/${moment.id}/my-reaction`);
        if (response.data.data) {
          setMyReaction(response.data.data.type);
        }
      } catch (error) {
        console.error('Error loading my reaction:', error);
      }
    };

    // Check save status on mount
    const checkSaveStatus = async () => {
      try {
        const saved = await momentService.checkIsSaved(moment.id);
        setIsSaved(saved);
      } catch (error) {
        console.error('Error checking save status:', error);
      }
    };

    loadMyReaction();
    checkSaveStatus();
  }, [moment.id]);

  useEffect(() => {
    if (myReaction) {
      // Bounce animation when reaction changes
      reactionScale.value = withSequence(
        withSpring(1.2, { damping: 10, stiffness: 200 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );
    }
  }, [myReaction]);
  const handleAuthorPress = () => {
    if (moment.authorId === currentUserId) {
      router.push('/profile');
    } else {
      router.push({
        pathname: '/user-profile',
        params: { userId: moment.authorId.toString() }
      });
    }
  };

  const handleImagePress = () => {
    const fullUrl = buildImageUrl(moment.imageUrl, 'moment');
    if (fullUrl) {
      router.push({
        pathname: '/image-viewer',
        params: { imageUrl: fullUrl }
      });
    }
  };

  const loadComments = async () => {
    try {
      setLoadingComments(true);
      const response = await api.get(`/comments/moment/${moment.id}`);
      setComments(response.data.data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleCommentPress = async () => {
    setShowComments(true);
    await loadComments();
  };

  const handleAddComment = async (content: string, parentId?: number) => {
    try {
      await api.post(`/comments/moment/${moment.id}`, {
        content,
        parentCommentId: parentId,
      });
      await loadComments();
      setCommentCount(prev => prev + 1);
    } catch (error) {
      console.error('Error adding comment:', error);
      showAlert('Lỗi', 'Không thể thêm bình luận');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await api.delete(`/comments/${commentId}`);
      await loadComments();
      setCommentCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error deleting comment:', error);
      showAlert('Lỗi', 'Không thể xóa bình luận');
    }
  };

  const handleReactionPress = async () => {
    if (myReaction) {
      // If already reacted, tapping again will remove the current reaction
      await handleReactionSelect(myReaction);
    } else {
      // If no reaction, tapping defaults to 'LIKE'
      await handleReactionSelect('LIKE');
    }
  };

  const handleReactionLongPress = () => {
    setShowReactionPicker(true);
  };

  const handleReactionSelect = async (type: ReactionType) => {
    try {
      const response = await api.post(`/reactions/moment/${moment.id}?type=${type}`);
      const data = response.data.data;

      if (data === null) {
        // Removed reaction
        setMyReaction(null);
        setReactionCount(prev => Math.max(0, prev - 1));
      } else {
        // Added or changed reaction
        const wasNull = myReaction === null;
        setMyReaction(type);
        setReactionCount(prev => wasNull ? prev + 1 : prev);
      }

      onReactionChange?.();
    } catch (error) {
      console.error('Error toggling reaction:', error);
      showAlert('Lỗi', 'Không thể thả cảm xúc');
    }
  };

  const getReactionIcon = () => {
    if (!myReaction) return 'heart-outline';

    const icons: Record<ReactionType, any> = {
      LIKE: 'thumbs-up',
      LOVE: 'heart',
      HAHA: 'happy-outline',
      WOW: 'star',
      SAD: 'sad-outline',
      ANGRY: 'flame',
    };

    return icons[myReaction] || 'heart-outline';
  };

  const getReactionColor = () => {
    if (!myReaction) return '#65676B';

    const colors: Record<ReactionType, string> = {
      LIKE: '#1877F2',
      LOVE: '#F33E58',
      HAHA: '#F7B125',
      WOW: '#F7B125',
      SAD: '#F7B125',
      ANGRY: '#E9710F',
    };

    return colors[myReaction] || '#65676B';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      LANDSCAPE: 'image',
      PEOPLE: 'people',
      FOOD: 'restaurant',
      ARCHITECTURE: 'business',
      CULTURE: 'color-palette',
      NATURE: 'leaf',
      URBAN: 'business',
      EVENT: 'calendar',
      OTHER: 'ellipsis-horizontal-circle',
    };
    return icons[category] || 'ellipsis-horizontal-circle';
  };

  const handleSaveMoment = async () => {
    try {
      setShowMenu(false);
      const result = await momentService.toggleSaveMoment(moment.id);
      setIsSaved(result.saved);
      setSaveCount(result.saveCount);
      showAlert('Thành công', result.saved ? 'Đã lưu moment' : 'Đã bỏ lưu moment');

      // Reload moments if callback provided
      if (onReactionChange) {
        onReactionChange();
      }
    } catch (error) {
      console.error('Error saving moment:', error);
      showAlert('Lỗi', 'Không thể lưu moment');
    }
  };

  const handleReportMoment = () => {
    setShowMenu(false);
    showAlert(
      'Báo cáo moment',
      'Chọn lý do báo cáo',
      [
        { text: 'Nội dung không phù hợp', onPress: () => submitReport('INAPPROPRIATE') },
        { text: 'Spam', onPress: () => submitReport('SPAM') },
        { text: 'Thông tin sai lệch', onPress: () => submitReport('MISINFORMATION') },
        { text: 'Hủy', style: 'cancel' },
      ]
    );
  };

  const submitReport = async (reason: string) => {
    try {
      // TODO: Implement report moment API
      showAlert('Thành công', 'Đã gửi báo cáo. Chúng tôi sẽ xem xét trong thời gian sớm nhất.');
    } catch (error) {
      console.error('Error reporting moment:', error);
      showAlert('Lỗi', 'Không thể gửi báo cáo');
    }
  };

  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      {/* Header */}
      {!compact && (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.authorInfo}
            onPress={handleAuthorPress}
          >
            <Image
              source={
                moment.authorAvatarUrl
                  ? { uri: buildImageUrl(moment.authorAvatarUrl) || undefined }
                  : DEFAULT_AVATAR
              }
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.authorText}>
              <Text style={styles.authorName}>{moment.authorName}</Text>
              <View style={styles.metaInfo}>
                <Text style={styles.timestamp}>{formatDate(moment.createdAt)}</Text>
                <Text style={styles.dot}> • </Text>
                <Ionicons
                  name={moment.isPublic ? 'globe-outline' : 'lock-closed-outline'}
                  size={12}
                  color="#65676B"
                />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => setShowMenu(true)}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#65676B" />
          </TouchableOpacity>
        </View>
      )}

      {/* Album Select Modal */}
      <AlbumSelectModal
        visible={showAlbumSelect}
        onClose={() => setShowAlbumSelect(false)}
        momentId={moment.id}
      />

      {/* Caption */}
      {!compact && moment.caption && (
        <View style={styles.captionContainer}>
          <Text style={styles.caption}>{moment.caption}</Text>
        </View>
      )}

      {/* Image */}
      <TouchableOpacity onPress={handleImagePress} activeOpacity={0.95}>
        <Image
          source={{ uri: buildImageUrl(moment.imageUrl, 'moment') || undefined }}
          style={[styles.image, compact && styles.compactImage]}
          contentFit="cover"
          onError={(error) => {
            console.error('Failed to load moment image:', {
              momentId: moment.id,
              imageUrl: moment.imageUrl,
              builtUrl: buildImageUrl(moment.imageUrl, 'moment'),
              error
            });
          }}
        />
        {compact && onRemove && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(moment.id)}
          >
            <Ionicons name="close-circle" size={26} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Location & Category */}
      <View style={[styles.locationContainer, compact && styles.compactLocationContainer]}>
        <TouchableOpacity
          style={styles.locationRow}
          onPress={() => router.push({
            pathname: '/moment-map',
            params: {
              latitude: moment.latitude.toString(),
              longitude: moment.longitude.toString(),
              addressName: moment.addressName,
              provinceName: moment.provinceName || '',
              imageUrl: moment.imageUrl,
            }
          })}
          activeOpacity={0.7}
        >
          <Ionicons name="location" size={compact ? 14 : 16} color="#1a73e8" />
          <Text style={[styles.locationText, compact && styles.compactLocationText]} numberOfLines={1}>
            {moment.addressName}
          </Text>
          {moment.provinceName && (
            <View style={styles.provinceTag}>
              <Text style={[styles.provinceTagText, compact && styles.compactProvinceTagText]}>{moment.provinceName}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={compact ? 14 : 16} color="#8E8E93" style={styles.chevron} />
        </TouchableOpacity>
        {!compact && (
          <View style={styles.categoryIcon}>
            <Ionicons name={getCategoryIcon(moment.category) as any} size={16} color="#65676B" />
          </View>
        )}
      </View>

      {/* Stats */}
      {!compact && (
        <View style={styles.stats}>
          <View style={styles.statsLeft}>
            {reactionCount > 0 && (
              <>
                <View style={styles.reactionIcons}>
                  <View style={[styles.reactionIcon, { backgroundColor: '#1877F2' }]}>
                    <Ionicons name="thumbs-up" size={10} color="#FFF" />
                  </View>
                  <View style={[styles.reactionIcon, { backgroundColor: '#F33E58' }]}>
                    <Ionicons name="heart" size={10} color="#FFF" />
                  </View>
                </View>
                <Text style={styles.statsText}>{reactionCount}</Text>
              </>
            )}
          </View>
          <View style={styles.statsRight}>
            {commentCount > 0 && (
              <Text style={styles.statsText}>{commentCount} bình luận</Text>
            )}
            {saveCount > 0 && (
              <>
                {commentCount > 0 && <Text style={styles.dot}> • </Text>}
                <Text style={styles.statsText}>{saveCount} lưu</Text>
              </>
            )}
          </View>
        </View>
      )}

      {/* Actions */}
      {!compact && (
        <View style={styles.actions}>
          <AnimatedTouchable
            style={[styles.actionButton, reactionAnimatedStyle]}
            onPress={handleReactionPress}
            onLongPress={handleReactionLongPress}
          >
            <Ionicons
              name={getReactionIcon()}
              size={20}
              color={getReactionColor()}
            />
            <Text style={[styles.actionText, myReaction && { color: getReactionColor() }]}>
              {myReaction ? 'Đã thích' : 'Thích'}
            </Text>
          </AnimatedTouchable>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCommentPress}
          >
            <Ionicons name="chatbubble-outline" size={20} color="#65676B" />
            <Text style={styles.actionText}>Bình luận</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleSaveMoment}
            >
              <Ionicons
                name={isSaved ? "bookmark" : "bookmark-outline"}
                size={24}
                color={isSaved ? "#1877F2" : "#050505"}
              />
              <Text style={[styles.menuText, isSaved && { color: '#1877F2' }]}>
                {isSaved ? 'Bỏ lưu' : 'Lưu moment'}
              </Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false);
                setShowAlbumSelect(true);
              }}
            >
              <Ionicons name="add-circle-outline" size={24} color="#050505" />
              <Text style={styles.menuText}>Thêm vào Album</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleReportMoment}
            >
              <Ionicons name="flag-outline" size={24} color="#050505" />
              <Text style={styles.menuText}>Báo cáo</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setShowMenu(false)}
            >
              <Ionicons name="close-circle-outline" size={24} color="#65676B" />
              <Text style={[styles.menuText, { color: '#65676B' }]}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Modals */}
      <ReactionPicker
        visible={showReactionPicker}
        onClose={() => setShowReactionPicker(false)}
        onSelect={handleReactionSelect}
      />

      <CommentsModal
        visible={showComments}
        momentId={moment.id}
        onClose={() => setShowComments(false)}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        comments={comments}
        loading={loadingComments}
        currentUserId={currentUserId}
        onCommentUpdate={loadComments}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    borderRadius: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E4E6EB',
  },
  authorText: {
    marginLeft: 10,
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#050505',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 13,
    color: '#65676B',
  },
  dot: {
    fontSize: 13,
    color: '#65676B',
  },
  moreButton: {
    padding: 8,
  },
  captionContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  caption: {
    fontSize: 15,
    color: '#050505',
    lineHeight: 20,
  },
  image: {
    width: width,
    height: width,
    backgroundColor: '#E4E6EB',
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F0F2F5',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#1a73e8',
    marginLeft: 6,
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
  provinceTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  provinceTagText: {
    fontSize: 11,
    color: '#1a73e8',
    fontWeight: '600',
  },
  chevron: {
    marginLeft: 4,
  },
  categoryIcon: {
    marginLeft: 8,
    padding: 4,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E6EB',
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionIcons: {
    flexDirection: 'row',
    marginRight: 6,
  },
  reactionIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -4,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  statsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 13,
    color: '#65676B',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 1,
  },
  actionText: {
    fontSize: 15,
    color: '#65676B',
    fontWeight: '600',
    marginLeft: 6,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: width * 0.8,
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuText: {
    fontSize: 16,
    color: '#050505',
    marginLeft: 16,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E4E6EB',
  },

  // Compact mode styles for albums
  compactCard: {
    marginBottom: 4,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  compactHeader: {
    padding: 8,
  },
  compactAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  compactAuthorName: {
    fontSize: 13,
    fontWeight: '600',
  },
  compactTimestamp: {
    fontSize: 11,
  },
  compactImage: {
    width: width * 0.65 - 8, // Adjust to match the width property in AlbumsScreen or card container
    height: (width * 0.65 - 8) * 1.1,
  },
  compactLocationContainer: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  compactLocationText: {
    fontSize: 11,
  },
  compactProvinceTagText: {
    fontSize: 10,
  },
  compactActions: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  compactActionButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  compactActionText: {
    fontSize: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#fff',
    borderRadius: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
});
