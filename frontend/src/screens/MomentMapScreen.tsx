import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Linking, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MapLibreGL from "@maplibre/maplibre-react-native";

MapLibreGL.setAccessToken(null);

const defaultMapStyle = JSON.stringify({
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap",
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
    },
  ],
});
import { SafeAreaView } from "react-native-safe-area-context";
import { buildImageUrl } from "@/src/utils/imageHelper";
import ImageMarker from "@/src/components/ImageMarker";

const { width } = Dimensions.get("window");

// Kích thước ImageMarker — phải khớp với size truyền vào <ImageMarker>
const MARKER_SIZE = 150;
const MARKER_TAIL_H = 14;
const MARKER_TOTAL_H = MARKER_SIZE + MARKER_TAIL_H;

export default function MomentMapScreen() {
  const { latitude, longitude, addressName, provinceName, imageUrl } =
    useLocalSearchParams<{
      latitude: string;
      longitude: string;
      addressName: string;
      provinceName?: string;
      imageUrl?: string;
    }>();

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const fullImageUrl = imageUrl ? buildImageUrl(imageUrl, "moment") : null;

  const handleDirections = () => {
    // Tạo đường dẫn mở app bản đồ mặc định của hệ điều hành
    const url = Platform.select({
      ios: `maps:0,0?q=${addressName}@${lat},${lng}`,
      android: `google.navigation:q=${lat},${lng}&mode=d`, // d = driving
    });

    if (url) {
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          // Dự phòng mở bằng trình duyệt nếu không có app
          const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
          Linking.openURL(webUrl);
        }
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>Vị trí</Text>
          {provinceName ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>{provinceName}</Text>
          ) : null}
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {/* Map: Sử dụng MapLibreGL hiển thị bản đồ OSM */}
        <MapLibreGL.MapView
          style={StyleSheet.absoluteFillObject}
          mapStyle={defaultMapStyle}
          logoEnabled={false}
          attributionEnabled={false}
        >
          <MapLibreGL.Camera
            zoomLevel={15}
            centerCoordinate={[lng, lat]}
          />
          {/* 
            MapLibreGL.PointAnnotation sẽ tự động định hướng marker đúng tại tọa độ GPS.
            Sử dụng anchor để căn chỉnh đáy của marker khớp với tọa độ bản đồ.
            Và thêm thuộc tính onSelected để đảm bảo nó nhận tương tác.
          */}
          <MapLibreGL.PointAnnotation
            id="momentMarker"
            coordinate={[lng, lat]}
            anchor={{ x: 0.5, y: 1 }}
          >
            <ImageMarker imageUrl={fullImageUrl ?? undefined} size={MARKER_SIZE} />
          </MapLibreGL.PointAnnotation>
        </MapLibreGL.MapView>

        {/* Địa chỉ floating ở dưới cùng map */}
        <View style={styles.addressCard}>
          <Ionicons name="location" size={20} color="#e53935" />
          <View style={styles.addressCardText}>
            <Text style={styles.addressText} numberOfLines={2}>{addressName}</Text>
            <Text style={styles.coordsText}>{lat.toFixed(5)}, {lng.toFixed(5)}</Text>
          </View>

          <TouchableOpacity
            style={styles.directionButton}
            onPress={handleDirections}
            activeOpacity={0.8}
          >
            <Ionicons name="navigate-circle" size={42} color="#1a73e8" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a73e8" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1a73e8",
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  backButton: { padding: 4 },
  headerCenter: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  headerSubtitle: { fontSize: 13, color: "#E3F2FD", marginTop: 2 },
  placeholder: { width: 32 },
  mapContainer: {
    flex: 1,
    position: "relative",
  },

  addressCard: {
    position: "absolute",
    bottom: 20,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  addressCardText: { flex: 1 },
  addressText: { fontSize: 14, fontWeight: "600", color: "#1a1a1a", lineHeight: 20 },
  coordsText: { fontSize: 11, color: "#9e9e9e", marginTop: 2 },
  directionButton: {
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
});
