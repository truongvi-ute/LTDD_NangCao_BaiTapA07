import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAlert } from '@/src/context/AlertContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { buildImageUrl } from '@/src/utils/imageHelper';
import api from '@/src/services/api';
import momentService, { Moment } from '@/src/services/momentService';
import MomentCard from '@/src/components/MomentCard';
import authService from '@/src/services/authService';
import { FriendshipService } from '@/src/services/friendship';

const DEFAULT_AVATAR = require('@/assets/images/avatar_default.png');

const GENDER_LABELS: { [key: string]: string } = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

interface UserProfile {
  id: number;
  username: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  dateOfBirth: string | null;
  gender: string | null;
}

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
};

const formatGender = (gender: string): string => {
  switch (gender) {
    case 'MALE':
      return 'Nam';
    case 'FEMALE':
      return 'Nữ';
    case 'OTHER':
      return 'Khác';
    default:
      return gender;
  }
};

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<'FRIEND' | 'STRANGER' | 'PENDING'>('STRANGER');
  const [loadingFriendship, setLoadingFriendship] = useState(false);
  const { showAlert } = useAlert();

  const PAGE_SIZE = 10;

  useEffect(() => {
    loadCurrentUser();
    loadProfile();
    loadMoments();
  }, [userId]);

  const loadCurrentUser = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      // Fetch user profile info, which will include updated bio, DOB, and gender if they just changed
      const response = await api.get(`/user/profile/${userId}`);
      setProfile(response.data.data);
      checkFriendshipStatus(response.data.data.username);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFriendshipStatus = async (username: string) => {
    try {
      // Check if they are in friends list
      const friends = await FriendshipService.getFriends();
      const isFriend = friends.some(f => f.username === username);
      if (isFriend) {
        setFriendshipStatus('FRIEND');
        return;
      }
      
      // Check if they are in pending requests
      const pending = await FriendshipService.getPendingRequests();
      const isPending = pending.some(f => f.username === username);
      if (isPending) {
        setFriendshipStatus('PENDING');
        return;
      }
      
      setFriendshipStatus('STRANGER');
    } catch (error) {
      console.error('Error checking friendship status', error);
      setFriendshipStatus('STRANGER');
    }
  };

  const handleAddFriend = async () => {
    if (!profile?.username) return;
    try {
      setLoadingFriendship(true);
      await FriendshipService.sendFriendRequest(profile.username);
      setFriendshipStatus('PENDING');
      showAlert('Thành công', 'Đã gửi lời mời kết bạn');
    } catch (error: any) {
      showAlert('Lỗi', error.message || 'Không thể gửi lời mời kết bạn');
    } finally {
      setLoadingFriendship(false);
    }
  };

  const loadMoments = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    try {
      if (!append) {
        setLoading(true);
      }
      
      const response = await momentService.getUserMomentsPaginated(Number(userId), pageNum, PAGE_SIZE);
      console.log(`Loaded user moments page ${pageNum}: ${response.content.length} moments`);
      
      if (append) {
        setMoments(prev => [...prev, ...response.content]);
      } else {
        setMoments(response.content);
      }
      
      setHasMore(!response.last);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading moments:', error);
      if (!append) {
        setMoments([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [userId]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || loading) return;
    
    console.log("Loading more user moments, next page:", page + 1);
    setLoadingMore(true);
    loadMoments(page + 1, true);
  }, [loadingMore, hasMore, loading, page, loadMoments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(0);
    setHasMore(true);
    await Promise.all([loadProfile(), loadMoments(0, false)]);
    setRefreshing(false);
  }, [loadMoments]);

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#1a73e8" />
        <Text style={styles.footerText}>Đang tải thêm...</Text>
      </View>
    );
  };

  const handleAvatarPress = () => {
    if (profile?.avatarUrl) {
      const fullUrl = buildImageUrl(profile.avatarUrl);
      if (fullUrl) {
        router.push({
          pathname: '/image-viewer',
          params: { imageUrl: fullUrl }
        });
      }
    }
  };

  const renderHeader = () => (
    <>
      {/* Avatar & Info Section */}
      <View style={styles.avatarSection}>
        <TouchableOpacity
          onPress={handleAvatarPress}
          style={styles.avatarContainer}
        >
          <Image
            source={profile?.avatarUrl ? { uri: buildImageUrl(profile.avatarUrl) || undefined } : DEFAULT_AVATAR}
            style={styles.avatar}
            contentFit="cover"
          />
        </TouchableOpacity>
        <Text style={styles.userName}>{profile?.name}</Text>

        {/* Bio */}
        {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}

        {/* Date of Birth and Gender */}
        {(profile?.gender || profile?.dateOfBirth) && (
          <View style={styles.infoRow}>
            {profile.dateOfBirth && (
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <Text style={styles.infoText}>{formatDate(profile.dateOfBirth)}</Text>
              </View>
            )}
            {profile.gender && (
              <View style={styles.infoItem}>
                <Ionicons
                  name={
                    profile.gender === "MALE"
                      ? "male"
                      : profile.gender === "FEMALE"
                        ? "female"
                        : "male-female"
                  }
                  size={16}
                  color="#666"
                />
                <Text style={styles.infoText}>
                  {GENDER_LABELS[profile.gender] || profile.gender}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Friendship Section */}
      <View style={styles.friendshipSection}>
        {friendshipStatus === 'FRIEND' && (
          <View style={[styles.statusBadge, styles.friendBadge]}>
            <Ionicons name="people" size={18} color="#1a73e8" />
            <Text style={styles.friendText}>Bạn bè</Text>
          </View>
        )}
        
        {friendshipStatus === 'STRANGER' && (
          <View style={styles.strangerContainer}>
             <View style={[styles.statusBadge, styles.strangerBadge]}>
              <Ionicons name="person-outline" size={18} color="#666" />
              <Text style={styles.strangerText}>Người lạ</Text>
            </View>
            <TouchableOpacity 
              style={styles.addFriendButton}
              onPress={handleAddFriend}
              disabled={loadingFriendship}
            >
              <Ionicons name="person-add" size={18} color="#fff" />
              <Text style={styles.addFriendText}>
                {loadingFriendship ? 'Đang gửi...' : 'Kết bạn'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {friendshipStatus === 'PENDING' && (
          <View style={[styles.statusBadge, styles.pendingBadge]}>
            <Ionicons name="time-outline" size={18} color="#f57c00" />
            <Text style={styles.pendingText}>Đã gửi lời mời</Text>
          </View>
        )}
      </View>

      {/* Section Title */}
      <View style={styles.momentsHeader}>
        <Text style={styles.sectionTitle}>Khoảnh khắc</Text>
      </View>
    </>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hồ sơ</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không thể tải thông tin người dùng</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profile?.name || 'Hồ sơ'}</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={moments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <MomentCard 
            moment={item} 
            currentUserId={currentUser?.id || 0}
            onReactionChange={() => loadMoments(0, false)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyMoments}>
            <Ionicons name="images-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyText}>Chưa có khoảnh khắc nào</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
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
  placeholder: {
    width: 40,
  },
  listContent: {
    flexGrow: 1,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#fff",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#1a73e8",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  bio: {
    fontSize: 15,
    color: "#333",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 32,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
  },
  friendshipSection: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingVertical: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  friendBadge: {
    backgroundColor: '#E3F2FD',
  },
  friendText: {
    color: '#1a73e8',
    fontWeight: 'bold',
    fontSize: 16,
  },
  strangerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  strangerBadge: {
    backgroundColor: '#F5F5F5',
  },
  strangerText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pendingBadge: {
    backgroundColor: '#FFF3E0',
  },
  pendingText: {
    color: '#f57c00',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a73e8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  addFriendText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  momentsHeader: {
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyMoments: {
    padding: 60,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginTop: 8,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    marginTop: 8,
    fontSize: 12,
    color: '#8E8E93',
  },
});
