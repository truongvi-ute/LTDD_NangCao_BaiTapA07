import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from "react-native";
import { useAlert } from "@/src/context/AlertContext";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/src/hooks";
import { UserService } from "@/src/services/user";
import { apiClient } from "@/src/services/api/apiClient";
import momentService, { Moment } from "@/src/services/momentService";
import albumService from "@/src/services/albumService";
import { buildImageUrl } from "@/src/utils/imageHelper";
import MomentCard from "@/src/components/MomentCard";

const GENDER_LABELS: { [key: string]: string } = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function ProfileScreen() {
  const { user, updateUser } = useAuth();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState<string | null>(null);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [savedMoments, setSavedMoments] = useState<Moment[]>([]);
  const [totalSavedCount, setTotalSavedCount] = useState<number>(0);
  const [totalMyMomentsCount, setTotalMyMomentsCount] = useState<number>(0);
  const [totalAlbumsCount, setTotalAlbumsCount] = useState<number>(0);
  const [loadingMoments, setLoadingMoments] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [myMomentsPage, setMyMomentsPage] = useState(0);
  const [savedMomentsPage, setSavedMomentsPage] = useState(0);
  const [hasMoreMyMoments, setHasMoreMyMoments] = useState(true);
  const [hasMoreSavedMoments, setHasMoreSavedMoments] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-moments' | 'saved' | 'albums'>('my-moments');
  const [avatarVersion, setAvatarVersion] = useState<number>(Date.now());

  const PAGE_SIZE = 10;

  // Reload user data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserData();

      // Also fetch counts when profile comes into focus to ensure they're fresh
      fetchCounts();
    }, []),
  );

  const loadUserData = async () => {
    try {
      const userData = await UserService.fetchProfile();
      if (userData) {
        // Ensure property consistency
        if (userData.avatarUrl && !userData.avatar) {
          userData.avatar = userData.avatarUrl;
        }
        updateUser(userData);
        // Refresh avatar version to force re-load
        setAvatarVersion(Date.now());
        // Update local state with profile data
        setBio(userData.bio || null);
        setGender(userData.gender || null);
        setDateOfBirth(userData.dateOfBirth || null);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  useEffect(() => {
    if (user) {
      const displayName = user.name || user.email.split("@")[0];
      setName(displayName);

      // Build avatar URL using helper
      setAvatarUri(buildImageUrl(user.avatar, 'avatar', avatarVersion));

      // Load user moments
      loadMoments();
    }
  }, [user]);

  // Fetch counts independently
  const fetchCounts = async () => {
    try {
      const myResponse = await momentService.getMyMomentsPaginated(0, 1);
      setTotalMyMomentsCount(myResponse.totalElements || 0);

      const savedResponse = await momentService.getSavedMomentsPaginated(0, 1);
      setTotalSavedCount(savedResponse.totalElements || 0);

      const albums = await albumService.getUserAlbums();
      setTotalAlbumsCount(albums.length || 0);
    } catch (countErr) {
      console.error("Error loading counts", countErr);
    }
  };

  // Load moments when tab changes
  useEffect(() => {
    if (user) {
      console.log("Tab changed to:", activeTab);

      // Fetch fresh counts when tab changes just to be sure
      fetchCounts();

      // If we already have some data, we don't necessarily have to reload from scratch,
      // but to ensure freshness we'll refresh page 0.
      loadMoments(0, false, activeTab);
    }
  }, [activeTab]);

  const handlePickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showAlert("Thông báo", "Cần quyền truy cập thư viện ảnh!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      showAlert("Lỗi", "Không thể chọn ảnh");
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        showAlert("Thông báo", "Cần quyền truy cập camera!");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      showAlert("Lỗi", "Không thể chụp ảnh");
    }
  };

  const uploadAvatar = async (uri: string) => {
    setLoading(true);
    try {
      const fileExtension = uri.split(".").pop() || "jpg";
      const fileName = `avatar_${Date.now()}.${fileExtension}`;

      const response = await apiClient.uploadFile("/user/upload-avatar", {
        uri,
        name: fileName,
        type: `image/${fileExtension}`,
      });

      if (response.success && response.data && response.data.avatarUrl) {
        const avatarUrlFromServer = response.data.avatarUrl;

        // Build full URL using helper
        const fullAvatarUrl = buildImageUrl(avatarUrlFromServer);
        setAvatarUri(fullAvatarUrl);

        if (user) {
          const updatedUser = {
            ...user,
            avatar: avatarUrlFromServer, // Use 'avatar' for consistency
          };
          updateUser(updatedUser);
          await UserService.saveUser(updatedUser);
          // Refresh version to force Image update
          setAvatarVersion(Date.now());
        }

        showAlert("Thành công", "Cập nhật avatar thành công!");
      } else {
        showAlert("Lỗi", response.message || "Không thể upload avatar");
      }
    } catch (error: any) {
      showAlert("Lỗi", error.message || "Không thể kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarPress = () => {
    showAlert("Thay đổi ảnh đại diện", "Chọn nguồn ảnh", [
      { text: "Hủy", style: "cancel" },
      { text: "Chụp ảnh", onPress: handleTakePhoto },
      { text: "Thư viện", onPress: handlePickImage },
    ]);
  };

  const loadMoments = useCallback(async (pageNum: number = 0, append: boolean = false, tab: 'my-moments' | 'saved' | 'albums' = activeTab) => {
    try {
      if (!append) {
        setLoadingMoments(true);
      }

      if (tab === 'albums') {
        // Albums tab content is managed separately or navigates away
        setLoadingMoments(false);
        return;
      }

      if (tab === 'my-moments') {
        const response = await momentService.getMyMomentsPaginated(pageNum, PAGE_SIZE);
        console.log("Loaded my moments page:", pageNum, "count:", response.content.length);

        if (append) {
          setMoments(prev => [...prev, ...response.content]);
        } else {
          setMoments(response.content);
        }

        setHasMoreMyMoments(!response.last);
        setMyMomentsPage(pageNum);
      } else {
        const response = await momentService.getSavedMomentsPaginated(pageNum, PAGE_SIZE);
        console.log("Loaded saved moments page:", pageNum, "count:", response.content.length);

        if (append) {
          setSavedMoments(prev => [...prev, ...response.content]);
        } else {
          setSavedMoments(response.content);
        }

        setHasMoreSavedMoments(!response.last);
        setSavedMomentsPage(pageNum);
      }
    } catch (error) {
      console.error("Error loading moments:", error);
      if (!append) {
        if (tab === 'my-moments') {
          setMoments([]);
        } else {
          setSavedMoments([]);
        }
      }
    } finally {
      setLoadingMoments(false);
      setLoadingMore(false);
    }
  }, [activeTab]);

  const loadMore = useCallback(() => {
    if (loadingMore || loadingMoments) return;

    if (activeTab === 'my-moments') {
      if (!hasMoreMyMoments) return;
      console.log("Loading more my moments, next page:", myMomentsPage + 1);
      setLoadingMore(true);
      loadMoments(myMomentsPage + 1, true, 'my-moments');
    } else {
      if (!hasMoreSavedMoments) return;
      console.log("Loading more saved moments, next page:", savedMomentsPage + 1);
      setLoadingMore(true);
      loadMoments(savedMomentsPage + 1, true, 'saved');
    }
  }, [loadingMore, loadingMoments, activeTab, hasMoreMyMoments, hasMoreSavedMoments, myMomentsPage, savedMomentsPage, loadMoments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === 'my-moments') {
      setMyMomentsPage(0);
      setHasMoreMyMoments(true);
    } else {
      setSavedMomentsPage(0);
      setHasMoreSavedMoments(true);
    }
    await Promise.all([loadUserData(), loadMoments(0, false, activeTab)]);
    setRefreshing(false);
  }, [activeTab, loadMoments]);

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#1a73e8" />
        <Text style={styles.footerText}>Đang tải thêm...</Text>
      </View>
    );
  };

  const renderHeader = () => (
    <>
      {/* Avatar Section */}
      <View style={styles.avatarSection}>
        <TouchableOpacity
          onPress={handleAvatarPress}
          style={styles.avatarContainer}
        >
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri || '' }}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              onError={(error) => {
                console.error("Avatar load error:", error);
                setAvatarUri(null);
              }}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.userName}>{name}</Text>

        {/* Bio */}
        {bio && <Text style={styles.bio}>{bio}</Text>}

        {/* Gender and Date of Birth */}
        {(gender || dateOfBirth) && (
          <View style={styles.infoRow}>
            {dateOfBirth && (
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <Text style={styles.infoText}>{formatDate(dateOfBirth)}</Text>
              </View>
            )}
            {gender && (
              <View style={styles.infoItem}>
                <Ionicons
                  name={
                    gender === "MALE"
                      ? "male"
                      : gender === "FEMALE"
                        ? "female"
                        : "male-female"
                  }
                  size={16}
                  color="#666"
                />
                <Text style={styles.infoText}>
                  {GENDER_LABELS[gender] || gender}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Moments Section Header */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my-moments' && styles.activeTab]}
          onPress={() => setActiveTab('my-moments')}
        >
          <Ionicons
            name="images"
            size={18}
            color={activeTab === 'my-moments' ? '#1a73e8' : '#8E8E93'}
          />
          <Text
            style={[styles.tabText, activeTab === 'my-moments' && styles.activeTabText]}
            numberOfLines={1}
          >
            Của tôi
          </Text>
          <View style={[styles.badge, activeTab === 'my-moments' && styles.activeBadge]}>
            <Text style={[styles.badgeText, activeTab === 'my-moments' && styles.activeBadgeText]}>
              {totalMyMomentsCount}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
          onPress={() => setActiveTab('saved')}
        >
          <Ionicons
            name="bookmark"
            size={18}
            color={activeTab === 'saved' ? '#1a73e8' : '#8E8E93'}
          />
          <Text
            style={[styles.tabText, activeTab === 'saved' && styles.activeTabText]}
            numberOfLines={1}
          >
            Đã lưu
          </Text>
          <View style={[styles.badge, activeTab === 'saved' && styles.activeBadge]}>
            <Text style={[styles.badgeText, activeTab === 'saved' && styles.activeBadgeText]}>
              {totalSavedCount}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'albums' && styles.activeTab]}
          onPress={() => router.push('/albums')}
        >
          <Ionicons
            name="albums"
            size={18}
            color={activeTab === 'albums' ? '#1a73e8' : '#8E8E93'}
          />
          <Text
            style={[styles.tabText, activeTab === 'albums' && styles.activeTabText]}
            numberOfLines={1}
          >
            Albums
          </Text>
          <View style={[styles.badge, activeTab === 'albums' && styles.activeBadge]}>
            <Text style={[styles.badgeText, activeTab === 'albums' && styles.activeBadgeText]}>
              {totalAlbumsCount}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderEmptyMoments = () => {
    if (activeTab === 'my-moments') {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={64} color="#C7C7CC" />
          <Text style={styles.emptyText}>Chưa có khoảnh khắc nào</Text>
          <Text style={styles.emptySubtext}>
            Hãy chia sẻ khoảnh khắc đầu tiên của bạn!
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push("/create-moment")}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.createButtonText}>Tạo khoảnh khắc</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={64} color="#C7C7CC" />
          <Text style={styles.emptyText}>Chưa có khoảnh khắc đã lưu</Text>
          <Text style={styles.emptySubtext}>
            Lưu những khoảnh khắc yêu thích để xem lại sau!
          </Text>
        </View>
      );
    }
  };

  const getInitials = () => {
    if (name) {
      const parts = name.split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    return user?.email[0].toUpperCase() || "U";
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trang cá nhân</Text>
        <TouchableOpacity
          onPress={() => router.push("/settings")}
          style={styles.settingsButton}
        >
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loadingMoments ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a73e8" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          key={activeTab}
          data={activeTab === 'my-moments' ? moments : savedMoments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <MomentCard
              moment={item}
              currentUserId={user?.id ? Number(user.id) : 0}
              onReactionChange={() => {
                fetchCounts();
                loadMoments(0, false, activeTab);
              }}
            />
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyMoments}
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1a73e8",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  settingsButton: {
    padding: 8,
  },
  listContent: {
    flexGrow: 1,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#fff",
    marginBottom: 12,
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
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#1a73e8",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  avatarText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#1a73e8",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  activeTab: {
    backgroundColor: "#E3F2FD",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8E8E93",
  },
  activeTabText: {
    color: "#1a73e8",
  },
  badge: {
    backgroundColor: "#E5E5EA",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  activeBadge: {
    backgroundColor: "#1a73e8",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#8E8E93",
  },
  activeBadgeText: {
    color: "#fff",
  },
  momentsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  momentsCount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a73e8",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#8E8E93",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
    backgroundColor: "#fff",
    marginTop: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 24,
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
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a73e8",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
