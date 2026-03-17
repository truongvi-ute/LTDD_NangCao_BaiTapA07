import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { useAlert } from "@/src/context/AlertContext";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/hooks";
import {
  FriendshipService,
  SearchUserResult,
  FriendshipDto,
} from "@/src/services/friendship";
import { buildImageUrl } from "@/src/utils/imageHelper";

const DEFAULT_AVATAR = require("@/assets/images/avatar_default.png");

export default function AddFriendScreen() {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [activeTab, setActiveTab] = useState<"search" | "qr">("search");
  const [searchText, setSearchText] = useState("");
  const [searchResult, setSearchResult] = useState<SearchUserResult[] | null>(
    null,
  );
  const [searching, setSearching] = useState(false);
  const [sendingUsernames, setSendingUsernames] = useState<
    Record<string, boolean>
  >({});
  const [friends, setFriends] = useState<FriendshipDto[]>([]);

  useEffect(() => {
    const loadFriends = async () => {
      try {
        const friendsList = await FriendshipService.getFriends();
        setFriends(friendsList);
      } catch (err) {
        console.error("Error loading friends:", err);
      }
    };
    loadFriends();
  }, []);

  const handleSearch = async () => {
    if (!searchText.trim()) {
      showAlert("Thông báo", "Vui lòng nhập tên hiển thị");
      return;
    }

    try {
      setSearching(true);
      setSearchResult(null);
      const result = await FriendshipService.searchUser(searchText.trim());

      // Filter out yourself and those who are already friends
      const filteredResult = result.filter((r) => {
        // Exclude yourself
        if (
          user &&
          (r.id.toString() === user.id.toString() ||
            r.username === user.username)
        ) {
          return false;
        }

        // Exclude already friends
        const isFriend = friends.some((f) => f.username === r.username);
        if (isFriend) return false;

        return true;
      });

      setSearchResult(filteredResult);
    } catch (error: any) {
      showAlert(
        "Lỗi",
        error.response?.data?.message || "Không tìm thấy người dùng",
      );
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (username: string) => {
    try {
      setSendingUsernames((prev) => ({ ...prev, [username]: true }));
      await FriendshipService.sendFriendRequest(username);
      showAlert("Thành công", "Đã gửi lời mời kết bạn");
      // Optionally remove from list after sending
      setSearchResult((prev) =>
        prev ? prev.filter((user) => user.username !== username) : null,
      );
    } catch (error: any) {
      showAlert(
        "Lỗi",
        error.response?.data?.message || "Không thể gửi lời mời kết bạn",
      );
    } finally {
      setSendingUsernames((prev) => ({ ...prev, [username]: false }));
    }
  };

  const handleScanQR = () => {
    // TODO: Implement QR scanner
    showAlert("Quét QR", "Tính năng đang phát triển");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm bạn bè</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "search" && styles.tabActive]}
          onPress={() => setActiveTab("search")}
        >
          <Ionicons
            name="search"
            size={20}
            color={activeTab === "search" ? "#1a73e8" : "#666"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "search" && styles.tabTextActive,
            ]}
          >
            Tìm kiếm
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "qr" && styles.tabActive]}
          onPress={() => setActiveTab("qr")}
        >
          <Ionicons
            name="qr-code"
            size={20}
            color={activeTab === "qr" ? "#1a73e8" : "#666"}
          />
          <Text
            style={[styles.tabText, activeTab === "qr" && styles.tabTextActive]}
          >
            Mã QR
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === "search" ? (
          <View style={styles.searchTab}>
            {/* Search Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Tìm kiếm bằng tên hiển thị
              </Text>
              <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                  <Ionicons name="person" size={20} color="#666" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Nhập tên hiển thị"
                    placeholderTextColor="#999"
                    value={searchText}
                    onChangeText={setSearchText}
                    autoCapitalize="sentences"
                    autoCorrect={false}
                    editable={!searching}
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.searchButton,
                    searching && styles.searchButtonDisabled,
                  ]}
                  onPress={handleSearch}
                  disabled={searching}
                >
                  {searching ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="search" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Search Result */}
            {searchResult && searchResult.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Kết quả tìm kiếm ({searchResult.length})
                </Text>
                {searchResult.map((user) => (
                  <View
                    key={user.id}
                    style={[styles.userCard, { marginBottom: 8 }]}
                  >
                    <Image
                      source={
                        user.avatarUrl
                          ? { uri: buildImageUrl(user.avatarUrl) || undefined }
                          : DEFAULT_AVATAR
                      }
                      style={styles.userAvatar}
                    />
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <Text style={styles.userUsername}>@{user.username}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.addButton,
                        sendingUsernames[user.username] &&
                          styles.addButtonDisabled,
                      ]}
                      onPress={() => handleSendRequest(user.username)}
                      disabled={sendingUsernames[user.username]}
                    >
                      {sendingUsernames[user.username] ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="person-add" size={18} color="#fff" />
                          <Text style={styles.addButtonText}>Kết bạn</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {searchResult && searchResult.length === 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Kết quả tìm kiếm</Text>
                <Text style={styles.hint}>
                  Không tìm thấy người dùng nào phù hợp.
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.qrTab}>
            {/* QR Feature Notice */}
            <View style={styles.section}>
              <View style={styles.noticeBox}>
                <Ionicons name="construct-outline" size={48} color="#ff9800" />
                <Text style={styles.noticeTitle}>
                  Tính năng đang phát triển
                </Text>
                <Text style={styles.noticeText}>
                  Tính năng mã QR sẽ được cập nhật trong phiên bản tiếp theo.
                  Hiện tại bạn có thể sử dụng tính năng tìm kiếm để kết bạn.
                </Text>
              </View>
            </View>

            {/* My QR Code Section - Disabled */}
            <View style={[styles.section, styles.sectionDisabled]}>
              <Text style={styles.sectionTitle}>Mã QR của bạn</Text>
              <View style={styles.qrCodeContainer}>
                <View style={styles.qrCodePlaceholder}>
                  <Ionicons name="qr-code" size={120} color="#ccc" />
                </View>
                <Text style={styles.username}>
                  @{user?.username || "username"}
                </Text>
                <Text style={styles.qrHint}>
                  Cho bạn bè quét mã này để kết bạn
                </Text>
              </View>
            </View>

            {/* Scan QR Section - Disabled */}
            <View style={[styles.section, styles.sectionDisabled]}>
              <Text style={styles.sectionTitle}>Quét mã QR</Text>
              <TouchableOpacity
                style={[styles.scanButton, styles.scanButtonDisabled]}
                disabled
              >
                <Ionicons name="scan" size={24} color="#999" />
                <Text
                  style={[styles.scanButtonText, styles.scanButtonTextDisabled]}
                >
                  Mở máy quét
                </Text>
              </TouchableOpacity>
              <Text style={styles.hint}>
                Quét mã QR của bạn bè để gửi lời mời kết bạn
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  placeholder: {
    width: 40,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#1a73e8",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  tabTextActive: {
    color: "#1a73e8",
  },
  content: {
    flex: 1,
  },
  searchTab: {
    padding: 16,
  },
  qrTab: {
    padding: 16,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  searchButton: {
    backgroundColor: "#1a73e8",
    borderRadius: 8,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    fontSize: 13,
    color: "#999",
    marginTop: 8,
  },
  qrCodeContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  qrCodePlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
    marginBottom: 16,
  },
  username: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  qrHint: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  scanButton: {
    flexDirection: "row",
    backgroundColor: "#1a73e8",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#e3f2fd",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#1a73e8",
    lineHeight: 18,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e0e0e0",
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  userUsername: {
    fontSize: 14,
    color: "#666",
  },
  addButton: {
    flexDirection: "row",
    backgroundColor: "#1a73e8",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
    gap: 6,
  },
  addButtonDisabled: {
    backgroundColor: "#999",
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  searchButtonDisabled: {
    backgroundColor: "#999",
  },
  noticeBox: {
    alignItems: "center",
    paddingVertical: 20,
  },
  noticeTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ff9800",
    marginTop: 16,
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  sectionDisabled: {
    opacity: 0.5,
  },
  scanButtonDisabled: {
    backgroundColor: "#e0e0e0",
  },
  scanButtonTextDisabled: {
    color: "#999",
  },
});
