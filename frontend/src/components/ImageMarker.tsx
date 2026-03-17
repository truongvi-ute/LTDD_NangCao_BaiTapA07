import React, { useState } from "react";
import { View, Image, StyleProp, ViewStyle } from "react-native";

interface ImageMarkerProps {
  imageUrl?: string;
  style?: StyleProp<ViewStyle>;
  size?: number;
  onImageLoad?: () => void;
}

export default function ImageMarker({
  imageUrl,
  style,
  size = 150,
  onImageLoad,
}: ImageMarkerProps) {
  // Hack cho MapLibre: Cập nhật key để buộc PointAnnotation render lại khi ảnh tải xong
  const [imageLoaded, setImageLoaded] = useState(false);

  const BORDER = 4;
  const RADIUS = 12;
  const TAIL_W = 18;
  const TAIL_H = 14;

  // Kích thước chuẩn xác 100%, không dùng padding bao quanh nữa
  const TOTAL_WIDTH = size;
  const TOTAL_HEIGHT = size + TAIL_H;

  return (
    <View
      key={imageLoaded ? "loaded" : "loading"}
      collapsable={false}
      style={[
        {
          width: TOTAL_WIDTH,
          height: TOTAL_HEIGHT,
          alignItems: "center",
        },
        style,
      ]}
    >
      {/* KHUNG NỀN TRẮNG (Đóng vai trò làm viền) */}
      <View
        style={{
          width: size,
          height: size,
          backgroundColor: "#ffffff",
          borderRadius: RADIUS,
          justifyContent: "center",
          alignItems: "center",
          // QUAN TRỌNG: Tuyệt đối KHÔNG dùng elevation hay shadow ở đây trên Android
        }}
      >
        {/* KHUNG CHỨA ẢNH (Nhỏ hơn khung trắng để lộ viền) */}
        <View
          style={{
            width: size - BORDER * 2,
            height: size - BORDER * 2,
            borderRadius: RADIUS - BORDER / 2, // Bo góc nhỏ hơn khung ngoài một chút cho mượt
            overflow: "hidden",
            backgroundColor: "#e0e0e0",
          }}
        >
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: size - BORDER * 2, height: size - BORDER * 2 }}
              resizeMode="cover"
              onLoad={() => {
                setImageLoaded(true);
                if (onImageLoad) onImageLoad();
              }}
              fadeDuration={0}
            />
          ) : (
            <View style={{ flex: 1, backgroundColor: "#e53935" }} />
          )}
        </View>
      </View>

      {/* ĐUÔI TAM GIÁC */}
      <View
        style={{
          width: 0,
          height: 0,
          borderStyle: "solid",
          borderLeftWidth: TAIL_W / 2,
          borderRightWidth: TAIL_W / 2,
          borderTopWidth: TAIL_H,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderTopColor: "#ffffff",
        }}
      />
    </View>
  );
}
