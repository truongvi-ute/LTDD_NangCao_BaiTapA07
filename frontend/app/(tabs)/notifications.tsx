import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  View
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { ThemedText } from '@/src/components/themed-text';
import { ThemedView } from '@/src/components/themed-view';
import notificationService, { Notification } from '@/src/services/notificationService';
import { buildImageUrl } from '@/src/utils/imageHelper';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const loadNotifications = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      setError(null);
      const data = await notificationService.getNotifications(0, 50);
      if (data && data.content) {
        setNotifications(data.content);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
      setError("Không thể tải thông báo. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification.id);
        // Optimistically update UI
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    }

    // Navigate based on type
    switch (notification.type) {
      case 'FRIEND_REQUEST':
        router.push('/friends');
        break;
      case 'MOMENT_REACTION':
      case 'FRIEND_POST':
      case 'NEW_COMMENT':
        router.push(`/(tabs)/home?momentId=${notification.targetId}`);
        break;
      case 'COMMENT_REACTION':
      case 'NEW_REPLY':
        // For now, navigate to the moment containing the comment
        // In a real app, we might want to highlight the specific comment
        router.push(`/(tabs)/home?commentId=${notification.targetId}`);
        break;
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    let message = "";
    let iconName: keyof typeof Ionicons.glyphMap = "notifications";
    let iconColor = "#1a73e8";

    switch (item.type) {
      case 'FRIEND_REQUEST':
        message = "đã gửi cho bạn lời mời kết bạn";
        iconName = "person-add";
        break;
      case 'NEW_COMMENT':
      case 'FRIEND_POST':
        message = "đã bình luận vào bài viết của bạn";
        iconName = "chatbubble-outline";
        break;
      case 'NEW_REPLY':
        message = "đã trả lời bình luận của bạn";
        iconName = "chatbubbles-outline";
        break;
      case 'MOMENT_REACTION':
        message = `đã bày tỏ cảm xúc vào bài viết của bạn`;
        iconName = "heart";
        iconColor = "#e91e63";
        break;
      case 'COMMENT_REACTION':
        message = `đã bày tỏ cảm xúc vào bình luận của bạn`;
        iconName = "heart-outline";
        iconColor = "#e91e63";
        break;
      case 'FRIEND_SOS':
        message = "đang gửi tín hiệu khẩn cấp!";
        iconName = "warning";
        iconColor = "#f44336";
        break;
    }

    return (
      <TouchableOpacity 
        style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
        onPress={() => handleNotificationPress(item)}
      >
        <Image
          source={item.actor?.profile?.avatarUrl 
            ? { uri: buildImageUrl(item.actor.profile.avatarUrl) } 
            : require("@/assets/images/avatar_default.png")}
          style={styles.avatar}
        />
        <View style={styles.content}>
          <ThemedText style={styles.messageText}>
            <ThemedText type="defaultSemiBold">{item.actor?.name || 'Người dùng'}</ThemedText> {message}
          </ThemedText>
          <ThemedText style={styles.timeText}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''} {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </ThemedText>
        </View>
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>
        {!item.isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Thông báo', headerShown: true }} />
      {loading ? (
        <ActivityIndicator size="large" color="#1a73e8" style={styles.loader} />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={item => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadNotifications(true)} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {error ? (
                <>
                  <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
                  <ThemedText style={styles.errorText}>{error}</ThemedText>
                  <TouchableOpacity style={styles.retryButton} onPress={() => loadNotifications()}>
                    <ThemedText style={styles.retryText}>Thử lại</ThemedText>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
                  <ThemedText style={styles.emptyText}>Chưa có thông báo nào</ThemedText>
                </>
              )}
            </View>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
    alignItems: 'center',
    position: 'relative',
  },
  unreadItem: {
    backgroundColor: 'rgba(26, 115, 232, 0.05)',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  timeText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  iconContainer: {
    marginLeft: 8,
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1a73e8',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#1a73e8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
});
