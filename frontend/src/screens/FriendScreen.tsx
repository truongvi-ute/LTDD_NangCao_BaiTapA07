import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { useAlert } from "@/src/context/AlertContext";
import { Ionicons } from "@expo/vector-icons";
import { FriendshipService, FriendshipDto } from "@/src/services/friendship";

const { width, height } = Dimensions.get("window");

export default function FriendsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");
  const [friends, setFriends] = useState<FriendshipDto[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendshipDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const { showAlert } = useAlert();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === "friends") {
        const data = await FriendshipService.getFriends();
        setFriends(data);
      } else {
        const data = await FriendshipService.getPendingRequests();
        setFriendRequests(data);
      }
    } catch (error: any) {
      console.error("Load data error:", error);
      showAlert("Lỗi", error.message || "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarUrl = (avatarUrl: string | null) => {
    if (!avatarUrl) return null;

    const cleanAvatarUrl = avatarUrl.trim();
    if (
      cleanAvatarUrl.startsWith("http://") ||
      cleanAvatarUrl.startsWith("https://")
    ) {
      return cleanAvatarUrl;
    }

    const filename = cleanAvatarUrl.split("/").pop() || cleanAvatarUrl;
    if (filename && filename.length > 0) {
      const apiUrl =
        process.env.EXPO_PUBLIC_API_URL || "http://192.168.100.177:8080/api";
      const baseUrl = apiUrl.replace(/\/api$/, "");
      return `${baseUrl}/uploads/avatars/${filename}`;
    }

    return null;
  };

  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAcceptRequest = async (friendshipId: number, name: string) => {
    try {
      const response =
        await FriendshipService.acceptFriendRequest(friendshipId);
      if (response) {
        showAlert("Thành công", `Đã chấp nhận lời mời kết bạn từ ${name}`);
        // Reload data
        await loadData();
      } else {
        showAlert("Loi", "Không thể chấp nhận lời mời");
      }
    } catch (error: any) {
      showAlert("Lỗi", error.message || "Không thể chấp nhận lời mời");
    }
  };

  const handleRejectRequest = async (friendshipId: number, name: string) => {
    showAlert(
      "Xác nhận",
      `Bạn có chắc chắn muốn từ chối lời mời kết bạn từ ${name}?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Từ chối",
          style: "destructive",
          onPress: async () => {
            try {
              const response =
                await FriendshipService.rejectFriendRequest(friendshipId);
              if (response) {
                showAlert("Thành công", "Đã từ chối lời mời kết bạn");
                await loadData();
              } else {
                showAlert("Loi", "Không thể từ chối lời mời");
              }
            } catch (error: any) {
              showAlert("Lỗi", error.message || "Không thể từ chối lời mời");
            }
          },
        },
      ],
    );
  };

  const handleRemoveFriend = async (friendshipId: number, name: string) => {
    showAlert(
      "Xác nhận",
      `Bạn có chắc chắn muốn xóa ${name} khỏi danh sách bạn bè?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await FriendshipService.unfriend(friendshipId);
              if (response) {
                showAlert("Thành công", "Đã xóa bạn bè");
                await loadData();
              } else {
                showAlert("Loi", "Không thể xóa bạn bè");
              }
            } catch (error: any) {
              showAlert("Lỗi", error.message || "Không thể xóa bạn bè");
            }
          },
        },
      ],
    );
  };

  const handleViewAvatar = (avatarUrl: string | null) => {
    const fullAvatarUrl = getAvatarUrl(avatarUrl);
    if (fullAvatarUrl) {
      setSelectedAvatar(fullAvatarUrl);
      setShowAvatarModal(true);
    }
  };

  const handleViewProfile = (friend: FriendshipDto) => {
    router.push({
      pathname: "/user-profile",
      params: {
        userId: friend.userId.toString(),
        userName: friend.name,
        userAvatar: friend.avatarUrl || "",
      },
    });
  };

  const renderFriendItem = ({ item }: { item: FriendshipDto }) => {
    const avatarUrl = getAvatarUrl(item.avatarUrl);

    return (
      <View style={styles.friendItem}>
        <View style={styles.friendInfo}>
          <TouchableOpacity onPress={() => handleViewAvatar(item.avatarUrl)}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.friendDetails}
            onPress={() => handleViewProfile(item)}
          >
            <View style={styles.nameContainer}>
              <Text style={styles.friendName}>{item.name}</Text>
              {item.status === "online" && (
                <View style={styles.onlineIndicator} />
              )}
            </View>
            <Text style={styles.mutualFriends}>Bạn bè</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => handleRemoveFriend(item.id, item.name)}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderRequestItem = ({ item }: { item: FriendshipDto }) => {
    const avatarUrl = getAvatarUrl(item.avatarUrl);

    return (
      <View style={styles.requestItem}>
        <View style={styles.requestInfo}>
          <TouchableOpacity onPress={() => handleViewAvatar(item.avatarUrl)}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.requestDetails}
            onPress={() => handleViewProfile(item)}
          >
            <Text style={styles.friendName}>{item.name}</Text>
            <Text style={styles.mutualFriends}>
              Lời mời kết bạn • {item.createdAt}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptRequest(item.id, item.name)}
          >
            <Text style={styles.acceptButtonText}>Chấp nhận</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleRejectRequest(item.id, item.name)}
          >
            <Text style={styles.rejectButtonText}>Từ chối</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
        <Text style={styles.headerTitle}>Bạn bè</Text>
        <TouchableOpacity
          style={styles.addButton}
          //onPress={() => router.push('/qr-code')}
        >
          <Ionicons name="qr-code-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm bạn bè..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "friends" && styles.activeTab]}
          onPress={() => setActiveTab("friends")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "friends" && styles.activeTabText,
            ]}
          >
            Bạn bè ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "requests" && styles.activeTab]}
          onPress={() => setActiveTab("requests")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "requests" && styles.activeTabText,
            ]}
          >
            Lời mời ({friendRequests.length})
          </Text>
          {friendRequests.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{friendRequests.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1a73e8" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : activeTab === "friends" ? (
          filteredFriends.length > 0 ? (
            <FlatList
              data={filteredFriends}
              renderItem={renderFriendItem}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#ccc" />
              <Text style={styles.emptyStateText}>
                {searchQuery ? "Không tìm thấy bạn bè" : "Chưa có bạn bè nào"}
              </Text>
            </View>
          )
        ) : friendRequests.length > 0 ? (
          <FlatList
            data={friendRequests}
            renderItem={renderRequestItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="mail-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>Không có lời mời kết bạn</Text>
          </View>
        )}
      </View>

      {/* Avatar Modal */}
      <Modal
        visible={showAvatarModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAvatarModal(false)}
        >
          <View style={styles.modalContent}>
            {selectedAvatar && (
              <Image
                source={{ uri: selectedAvatar }}
                style={styles.fullAvatar}
                resizeMode="contain"
              />
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAvatarModal(false)}
            >
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  addButton: {
    padding: 8,
  },
  searchContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    gap: 8,
  },
  activeTab: {
    borderBottomColor: "#1a73e8",
  },
  tabText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#1a73e8",
    fontWeight: "700",
  },
  badge: {
    backgroundColor: "#ff3b30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  friendItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  friendInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#1a73e8",
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1a73e8",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  friendDetails: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  friendName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4caf50",
  },
  mutualFriends: {
    fontSize: 14,
    color: "#999",
  },
  moreButton: {
    padding: 8,
  },
  requestItem: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  requestInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  requestDetails: {
    flex: 1,
  },
  requestActions: {
    flexDirection: "row",
    gap: 8,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: "#1a73e8",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  rejectButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  rejectButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#999",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width,
    height: height,
    justifyContent: "center",
    alignItems: "center",
  },
  fullAvatar: {
    width: width,
    height: width,
  },
  closeButton: {
    position: "absolute",
    top: 60,
    right: 20,
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
  },
});
