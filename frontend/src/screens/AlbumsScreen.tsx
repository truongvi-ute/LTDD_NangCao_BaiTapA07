import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Linking,
} from "react-native";
import { useAlert } from "@/src/context/AlertContext";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, useLocationPermission } from "@/src/hooks";
import MomentCard from "@/src/components/MomentCard";
import { Moment } from "@/src/services/momentService";
import albumService, { Album } from "@/src/services/albumService";

const { width } = Dimensions.get("window");

export default function AlbumsScreen() {
  const { user } = useAuth();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const { getCurrentPosition } = useLocationPermission();
  const { showAlert } = useAlert();

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [albumName, setAlbumName] = useState("");
  const [albumDescription, setAlbumDescription] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    try {
      setLoading(true);
      const albumsData = await albumService.getUserAlbums();

      // Load first 5 moments for each album as preview
      const albumsWithMoments = await Promise.all(
        albumsData.map(async (album) => {
          if (album.itemCount > 0) {
            try {
              const details = await albumService.getAlbumDetails(album.id);
              return {
                ...album,
                moments: details.moments?.slice(0, 5) || [],
              };
            } catch (error) {
              console.error(
                `Error loading moments for album ${album.id}:`,
                error,
              );
              return {
                ...album,
                moments: [],
              };
            }
          }
          return {
            ...album,
            moments: [],
          };
        }),
      );

      setAlbums(albumsWithMoments);
    } catch (error) {
      console.error("Error loading albums:", error);
      showAlert("Lỗi", "Không thể tải danh sách album");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlbum = () => {
    setAlbumName("");
    setAlbumDescription("");
    setModalVisible(true);
  };

  const createAlbum = async () => {
    if (!albumName.trim()) {
      showAlert("Lỗi", "Vui lòng nhập tên album");
      return;
    }

    try {
      setCreating(true);
      await albumService.createAlbum({
        name: albumName.trim(),
        description: albumDescription.trim() || undefined,
      });
      setModalVisible(false);
      await loadAlbums();
      showAlert("Thành công", "Đã tạo album mới!");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Không thể tạo album";
      showAlert("Lỗi", errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleRemoveFromAlbum = async (albumId: number, momentId: number) => {
    showAlert("Xác nhận", "Bạn có chắc muốn loại bỏ moment này khỏi album?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await albumService.removeMomentFromAlbum(albumId, momentId);
            await loadAlbums();
          } catch (error: any) {
            showAlert("Lỗi", "Không thể xóa moment khỏi album");
          }
        },
      },
    ]);
  };
  const handleCreateJourney = async (album: Album) => {
    try {
      if (album.itemCount === 0) {
        showAlert("Thông báo", "Album không có moment nào để tạo hành trình");
        return;
      }
      setLoading(true);
      const currentLocation = await getCurrentPosition();
      if (!currentLocation) {
        setLoading(false);
        return;
      }
      const { latitude: curLat, longitude: curLng } = currentLocation.coords;
      // Ensure we have all moments for the journey
      const details = await albumService.getAlbumDetails(album.id);
      const moments = details.moments || [];
      if (moments.length === 0) {
        showAlert("Thông báo", "Không tìm thấy dữ liệu tọa độ các moment trong album");
        setLoading(false);
        return;
      }
      // Construct Google Maps URL with waypoints
      // Last moment is the destination, others are waypoints
      const lastMoment = moments[moments.length - 1];
      const destLat = lastMoment.latitude;
      const destLng = lastMoment.longitude;
      let url = `https://www.google.com/maps/dir/?api=1&origin=${curLat},${curLng}&destination=${destLat},${destLng}&travelmode=driving`;
      if (moments.length > 1) {
        // Points except the destination
        const waypoints = moments
          .slice(0, -1)
          .map((m) => `${m.latitude},${m.longitude}`)
          .join("|");
        url += `&waypoints=${waypoints}`;
      }
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        // Fallback to web browser
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error("Error creating journey:", error);
      showAlert("Lỗi", "Không thể tạo hành trình dẫn đường");
    } finally {
      setLoading(false);
    }
  };

  const renderAlbumCard = ({ item }: { item: Album }) => {
    return (
      <View style={styles.albumCard}>
        <View style={styles.albumHeader}>
          <View style={styles.albumHeaderTitleRow}>
            <View style={styles.albumHeaderInfo}>
              <Text style={styles.albumName}>{item.name}</Text>
              {item.description && (
                <Text style={styles.albumDescription}>{item.description}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.journeyButton}
              onPress={() => handleCreateJourney(item)}
            >
              <Ionicons name="navigate-circle" size={24} color="#1a73e8" />
              <Text style={styles.journeyButtonText}>Hành trình</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.albumCount}>
            {item.itemCount} moment{item.itemCount !== 1 ? "s" : ""}
          </Text>
        </View>

        <View style={styles.albumContent}>
          {item.moments && item.moments.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.momentsScroll}
              contentContainerStyle={styles.momentsContainer}
              pagingEnabled={false}
              decelerationRate="fast"
              snapToInterval={width * 0.65}
              snapToAlignment="start"
            >
              {item.moments.map((moment) => (
                <View key={moment.id} style={styles.momentCardContainer}>
                  <MomentCard
                    moment={moment}
                    currentUserId={Number(user?.id) || 0}
                    compact={true}
                    onReactionChange={loadAlbums}
                    onRemove={() => handleRemoveFromAlbum(item.id, moment.id)}
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            <TouchableOpacity
              style={styles.emptyAlbum}
              onPress={() => router.push("/(tabs)/home")}
            >
              <Ionicons name="add-circle-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyText}>Thêm moment đầu tiên</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
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
        <Text style={styles.headerTitle}>Albums</Text>
        <TouchableOpacity
          onPress={handleCreateAlbum}
          style={styles.createButton}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={albums}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderAlbumCard}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1a73e8" />
              <Text style={styles.loadingText}>Đang tải albums...</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="albums-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyStateText}>Chưa có album nào</Text>
              <Text style={styles.emptyStateSubtext}>
                Tạo album đầu tiên để tổ chức moments của bạn
              </Text>
              <TouchableOpacity
                style={styles.createFirstButton}
                onPress={handleCreateAlbum}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.createFirstButtonText}>Tạo Album</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      {/* Create Album Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.modalContainer}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Tạo Album mới</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#1C1C1E" />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Tên Album *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập tên album..."
                    value={albumName}
                    onChangeText={setAlbumName}
                    autoFocus={true}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Mô tả (tùy chọn)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Nhập mô tả..."
                    value={albumDescription}
                    onChangeText={setAlbumDescription}
                    multiline={true}
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.submitButton,
                      !albumName.trim() && styles.disabledButton,
                    ]}
                    onPress={createAlbum}
                    disabled={creating || !albumName.trim()}
                  >
                    {creating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.submitButtonText}>Tạo</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
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
  createButton: {
    padding: 8,
  },
  content: {
    flexGrow: 1,
    padding: 16,
  },
  albumCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  albumHeader: {
    padding: 16,
    paddingBottom: 12,
  },
  albumHeaderTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  albumHeaderInfo: {
    flex: 1,
    marginRight: 8,
  },
  journeyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  journeyButtonText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1a73e8",
  },
  albumName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  albumDescription: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 8,
  },
  albumCount: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "500",
  },
  albumContent: {
    height: 310,
  },
  momentsScroll: {
    flex: 1,
  },
  momentsContainer: {
    paddingHorizontal: 8,
  },
  momentCardContainer: {
    width: width * 0.67,
    paddingHorizontal: 4,
  },
  emptyAlbum: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#8E8E93",
    fontWeight: "500",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#8E8E93",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 24,
  },
  createFirstButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a73e8",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  createFirstButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1C1C1E",
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3A3A3C",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1C1C1E",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#E5E5EA",
  },
  cancelButtonText: {
    color: "#1C1C1E",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#1a73e8",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#A0C3F7",
  },
});
