import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAlert } from '@/src/context/AlertContext';
import { Ionicons } from '@expo/vector-icons';
import { FriendshipService, FriendshipDto } from '@/src/services/friendship';
import { buildImageUrl } from '@/src/utils/imageHelper';

const DEFAULT_AVATAR = require('@/assets/images/avatar_default.png');

export default function FriendsScreen() {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [friends, setFriends] = useState<FriendshipDto[]>([]);
  const [requests, setRequests] = useState<FriendshipDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { showAlert } = useAlert();

  const loadData = async () => {
    try {
      setLoading(true);
      const [friendsData, requestsData] = await Promise.all([
        FriendshipService.getFriends(),
        FriendshipService.getPendingRequests(),
      ]);
      setFriends(friendsData);
      setRequests(requestsData);
    } catch (error: any) {
      console.error('Error loading friends data:', error);
      showAlert('Lỗi', error.response?.data?.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAccept = async (friendshipId: number) => {
    try {
      await FriendshipService.acceptFriendRequest(friendshipId);
      showAlert('Thành công', 'Đã chấp nhận lời mời kết bạn');
      loadData();
    } catch (error: any) {
      showAlert('Lỗi', error.response?.data?.message || 'Không thể chấp nhận lời mời');
    }
  };

  const handleReject = async (friendshipId: number) => {
    try {
      await FriendshipService.rejectFriendRequest(friendshipId);
      showAlert('Thành công', 'Đã từ chối lời mời kết bạn');
      loadData();
    } catch (error: any) {
      showAlert('Lỗi', error.response?.data?.message || 'Không thể từ chối lời mời');
    }
  };

  const handleUnfriend = (friendshipId: number, name: string) => {
    showAlert(
      'Xác nhận',
      `Bạn có chắc muốn hủy kết bạn với ${name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          style: 'destructive',
          onPress: async () => {
            try {
              await FriendshipService.unfriend(friendshipId);
              showAlert('Thành công', 'Đã hủy kết bạn');
              loadData();
            } catch (error: any) {
              showAlert('Lỗi', error.response?.data?.message || 'Không thể hủy kết bạn');
            }
          },
        },
      ]
    );
  };

  const handleViewProfile = (userId: number) => {
    router.push({
      pathname: '/user-profile',
      params: { userId: userId.toString() }
    });
  };

  const handleViewAvatar = (avatarUrl: string | null) => {
    if (avatarUrl) {
      const fullUrl = buildImageUrl(avatarUrl);
      if (fullUrl) {
        router.push({
          pathname: '/image-viewer',
          params: { imageUrl: fullUrl }
        });
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bạn bè</Text>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => router.push('/add-friend')}
        >
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
            Bạn bè
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
            Lời mời
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {activeTab === 'friends' ? (
          friends.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Chưa có bạn bè</Text>
              <Text style={styles.emptySubtext}>
                Hãy kết nối với những người xung quanh bạn!
              </Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {friends.map((friend) => (
                <View key={friend.id} style={styles.friendItem}>
                  <TouchableOpacity onPress={() => handleViewAvatar(friend.avatarUrl)}>
                    <Image
                      source={friend.avatarUrl ? { uri: buildImageUrl(friend.avatarUrl) || undefined } : DEFAULT_AVATAR}
                      style={styles.avatar}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.friendInfo}
                    onPress={() => handleViewProfile(friend.userId)}
                  >
                    <Text style={styles.friendName}>{friend.name}</Text>
                    <Text style={styles.friendUsername}>@{friend.username}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.unfriendButton}
                    onPress={() => handleUnfriend(friend.id, friend.name)}
                  >
                    <Ionicons name="person-remove-outline" size={20} color="#f44336" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )
        ) : (
          requests.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="mail-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Không có lời mời kết bạn</Text>
              <Text style={styles.emptySubtext}>
                Lời mời kết bạn sẽ hiển thị ở đây
              </Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {requests.map((request) => (
                <View key={request.id} style={styles.requestItem}>
                  <TouchableOpacity onPress={() => handleViewAvatar(request.avatarUrl)}>
                    <Image
                      source={request.avatarUrl ? { uri: buildImageUrl(request.avatarUrl) || undefined } : DEFAULT_AVATAR}
                      style={styles.avatar}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.requestInfo}
                    onPress={() => handleViewProfile(request.userId)}
                  >
                    <Text style={styles.requestName}>{request.name}</Text>
                    <Text style={styles.requestUsername}>@{request.username}</Text>
                  </TouchableOpacity>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAccept(request.id)}
                    >
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleReject(request.id)}
                    >
                      <Ionicons name="close" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a73e8',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchButton: {
    padding: 8,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#1a73e8',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#1a73e8',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
  },
  friendInfo: {
    flex: 1,
    marginLeft: 12,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  friendUsername: {
    fontSize: 14,
    color: '#666',
  },
  unfriendButton: {
    padding: 8,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
    marginLeft: 12,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  requestUsername: {
    fontSize: 14,
    color: '#666',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#4caf50',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    backgroundColor: '#f44336',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
