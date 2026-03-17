import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useAlert } from "@/src/context/AlertContext";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import momentService from "@/src/services/momentService";
import { buildImageUrl } from "@/src/utils/imageHelper";
import { useLocationPermission } from "@/src/hooks";

type MomentCategory =
  | "LANDSCAPE"
  | "PEOPLE"
  | "FOOD"
  | "ARCHITECTURE"
  | "CULTURE"
  | "NATURE"
  | "URBAN"
  | "EVENT"
  | "OTHER";

interface CategoryOption {
  value: MomentCategory;
  label: string;
  icon: string;
  color: string;
}

const CATEGORIES: CategoryOption[] = [
  { value: "LANDSCAPE", label: "Phong cảnh", icon: "image", color: "#4CAF50" },
  { value: "PEOPLE", label: "Con người", icon: "people", color: "#2196F3" },
  { value: "FOOD", label: "Món ăn", icon: "restaurant", color: "#FF9800" },
  {
    value: "ARCHITECTURE",
    label: "Kiến trúc",
    icon: "business",
    color: "#9C27B0",
  },
  {
    value: "CULTURE",
    label: "Văn hóa",
    icon: "color-palette",
    color: "#E91E63",
  },
  { value: "NATURE", label: "Thiên nhiên", icon: "leaf", color: "#8BC34A" },
  { value: "URBAN", label: "Đô thị", icon: "business", color: "#607D8B" },
  { value: "EVENT", label: "Sự kiện", icon: "calendar", color: "#F44336" },
  {
    value: "OTHER",
    label: "Khác",
    icon: "ellipsis-horizontal-circle",
    color: "#9E9E9E",
  },
];

export default function CreateMomentScreen() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState<MomentCategory>("OTHER");
  const [isPublic, setIsPublic] = useState(true);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const { getCurrentPosition } = useLocationPermission();

  // Debug: Log when imageUri changes
  React.useEffect(() => {
    console.log("imageUri changed:", imageUri);
  }, [imageUri]);

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        showAlert("Lỗi", "Cần cấp quyền truy cập thư viện ảnh");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log("Selected image URI:", asset.uri);
        setImageUri(asset.uri);
        console.log("Image URI state updated to:", asset.uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      showAlert("Lỗi", "Không thể chọn ảnh");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        showAlert("Lỗi", "Cần cấp quyền truy cập camera");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        console.log("Captured photo URI:", asset.uri);
        setImageUri(asset.uri);
        console.log("Image URI state updated to:", asset.uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      showAlert("Lỗi", "Không thể chụp ảnh");
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      const currentLocation = await getCurrentPosition();
      if (!currentLocation) {
        setLoadingLocation(false);
        return;
      }

      const { latitude, longitude } = currentLocation.coords;

      // Reverse geocoding to get address
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      let address = "Vị trí hiện tại";
      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        const parts = [];
        if (addr.street) parts.push(addr.street);
        if (addr.district) parts.push(addr.district);
        if (addr.region) {
          parts.push(addr.region);
        } else if (addr.city) {
          parts.push(addr.city);
        }
        if (addr.country) parts.push(addr.country);
        address = parts.filter(Boolean).join(", ");
      }

      setLocation({ latitude, longitude, address });
      setLoadingLocation(false);
    } catch (error: any) {
      console.error("Error getting location:", error);
      setLoadingLocation(false);
      showAlert(
        "Lỗi vị trí",
        error.message || "Không thể lấy vị trí hiện tại",
      );
    }
  };

  const handleSubmit = async () => {
    if (!imageUri) {
      showAlert("Lỗi", "Vui lòng chọn ảnh");
      return;
    }

    if (!location) {
      showAlert("Lỗi", "Vui lòng chọn vị trí");
      return;
    }

    setLoading(true);

    try {
      // Create moment with the local image URI
      // The backend will handle the upload
      const fileExtension = imageUri.split(".").pop() || "jpg";

      await momentService.createMoment({
        image: {
          uri: imageUri,
          type: `image/${fileExtension}`,
          name: `moment_${Date.now()}.${fileExtension}`,
        },
        caption: caption || "Không có mô tả",
        latitude: location.latitude,
        longitude: location.longitude,
        addressName: location.address,
        isPublic: isPublic,
        category: category,
      });

      showAlert("Thành công", "Đã tạo moment mới", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Không thể tạo moment";
      showAlert("Lỗi", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="close" size={28} color="#ff0000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo Moment</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          style={styles.submitButton}
          disabled={loading || !imageUri || !location}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text
              style={[
                styles.submitText,
                (!imageUri || !location) && styles.submitTextDisabled,
              ]}
            >
              Đăng
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ảnh *</Text>

          {imageUri ? (
            <View>
              <View
                style={[
                  styles.imageContainer,
                  {
                    borderWidth: 3,
                    borderColor: "lime",
                    borderStyle: "dashed",
                  },
                ]}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={styles.image}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="none"
                  onLoad={() => console.log("Image loaded successfully")}
                  onError={(error) => console.error("Image load error:", error)}
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setImageUri(null)}
                >
                  <Ionicons name="close-circle" size={32} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={64} color="#C7C7CC" />
              <Text style={styles.placeholderText}>Chọn ảnh để chia sẻ</Text>

              <View style={styles.imageButtons}>
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={takePhoto}
                >
                  <Ionicons name="camera" size={24} color="#007AFF" />
                  <Text style={styles.imageButtonText}>Chụp ảnh</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={pickImage}
                >
                  <Ionicons name="images" size={24} color="#007AFF" />
                  <Text style={styles.imageButtonText}>Thư viện</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Caption Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mô tả</Text>
          <TextInput
            style={styles.captionInput}
            placeholder="Chia sẻ cảm nghĩ của bạn..."
            placeholderTextColor="#C7C7CC"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={1000}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{caption.length}/1000</Text>
        </View>

        {/* Category Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danh mục</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryChip,
                  category === cat.value && styles.categoryChipActive,
                ]}
                onPress={() => setCategory(cat.value)}
              >
                <View
                  style={[
                    styles.categoryIconContainer,
                    { backgroundColor: cat.color + "20" },
                  ]}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={20}
                    color={cat.color}
                  />
                </View>
                <Text
                  style={[
                    styles.categoryLabel,
                    category === cat.value && styles.categoryLabelActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vị trí *</Text>

          {location ? (
            <View style={styles.locationCard}>
              <View style={styles.locationInfo}>
                <Ionicons name="location" size={24} color="#007AFF" />
                <View style={styles.locationText}>
                  <Text style={styles.locationAddress}>{location.address}</Text>
                  <Text style={styles.locationCoords}>
                    {location.latitude.toFixed(6)},{" "}
                    {location.longitude.toFixed(6)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setLocation(null)}>
                <Ionicons name="close-circle" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.locationButton}
              onPress={getCurrentLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <>
                  <Ionicons name="location-outline" size={24} color="#007AFF" />
                  <Text style={styles.locationButtonText}>
                    Lấy vị trí hiện tại
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <View style={styles.privacyRow}>
            <View style={styles.privacyInfo}>
              <Text style={styles.sectionTitle}>Công khai</Text>
              <Text style={styles.privacyDescription}>
                {isPublic ? "Mọi người có thể xem" : "Chỉ bạn bè có thể xem"}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, isPublic && styles.toggleActive]}
              onPress={() => setIsPublic(!isPublic)}
            >
              <View
                style={[
                  styles.toggleThumb,
                  isPublic && styles.toggleThumbActive,
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: "#1a73e8",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
  },
  submitButton: {
    padding: 4,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1aff00",
  },
  submitTextDisabled: {
    color: "#C7C7CC",
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 12,
  },
  imageContainer: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    height: 300,
    width: "100%",
  },
  image: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    backgroundColor: "#E5E5EA",
  },
  removeImageButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
  },
  imagePlaceholder: {
    height: 300,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E5EA",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
  },
  placeholderText: {
    fontSize: 16,
    color: "#8E8E93",
    marginTop: 12,
    marginBottom: 24,
  },
  imageButtons: {
    flexDirection: "row",
    gap: 16,
  },
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#007AFF",
  },
  captionInput: {
    height: 120,
    fontSize: 16,
    color: "#1C1C1E",
    padding: 12,
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  charCount: {
    fontSize: 12,
    color: "#8E8E93",
    textAlign: "right",
    marginTop: 4,
  },
  categoriesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#F2F2F7",
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  categoryChipActive: {
    backgroundColor: "#E3F2FD",
    borderColor: "#007AFF",
  },
  categoryIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryLabel: {
    fontSize: 14,
    color: "#1C1C1E",
  },
  categoryLabelActive: {
    fontWeight: "600",
    color: "#007AFF",
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  locationText: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  locationCoords: {
    fontSize: 12,
    color: "#8E8E93",
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  locationButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#007AFF",
  },
  privacyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  privacyInfo: {
    flex: 1,
  },
  privacyDescription: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 4,
  },
  toggle: {
    width: 51,
    height: 31,
    borderRadius: 15.5,
    backgroundColor: "#E5E5EA",
    padding: 2,
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: "#34C759",
  },
  toggleThumb: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  uploadingText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 12,
  },
});
