import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { useSharedValue, useAnimatedScrollHandler } from "react-native-reanimated";
import authService from "@/src/services/authService";
import momentService, { Moment } from "@/src/services/momentService";
import { buildImageUrl } from "@/src/utils/imageHelper";
import MomentCard from "@/src/components/MomentCard";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Moment>);

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const scrollY = useSharedValue(0);

  const PAGE_SIZE = 10;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Reload user and moments when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUser();
      loadMoments();
    }, []),
  );

  useEffect(() => {
    loadUser();
    loadMoments();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);

      // Build avatar URL using helper
      const avatarUrl = buildImageUrl(userData?.avatarUrl);
      setAvatarUri(avatarUrl);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadMoments = async (pageNum: number = 0, append: boolean = false) => {
    try {
      if (!append) {
        setLoading(true);
      }
      
      const response = await momentService.getFeedPaginated(pageNum, PAGE_SIZE);
      console.log("Loaded moments page:", pageNum, "count:", response.content.length);
      
      if (append) {
        setMoments(prev => [...prev, ...response.content]);
      } else {
        setMoments(response.content);
      }
      
      setHasMore(!response.last);
      setPage(pageNum);
    } catch (error) {
      console.error("Error loading moments:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (loadingMore || !hasMore || loading) return;
    
    console.log("Loading more moments, next page:", page + 1);
    setLoadingMore(true);
    loadMoments(page + 1, true);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(0);
    setHasMore(true);
    await Promise.all([loadUser(), loadMoments(0, false)]);
    setRefreshing(false);
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.footerText}>Đang tải thêm...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a73e8" />

      {/* Content */}
      <AnimatedFlatList
        data={moments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <MomentCard
            moment={item}
            currentUserId={user?.id || 0}
            onReactionChange={loadMoments}
          />
        )}
        contentContainerStyle={styles.content}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Đang tải moments...</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📸</Text>
              <Text style={styles.emptyText}>Chưa có moment nào</Text>
              <Text style={styles.emptySubtext}>
                Hãy chia sẻ khoảnh khắc đầu tiên của bạn!
              </Text>
            </View>
          )
        }
        ListFooterComponent={renderFooter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  content: {
    flexGrow: 1,
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
    backgroundColor: "#FFFFFF",
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: {
    marginTop: 8,
    fontSize: 12,
    color: "#8E8E93",
  },
});
