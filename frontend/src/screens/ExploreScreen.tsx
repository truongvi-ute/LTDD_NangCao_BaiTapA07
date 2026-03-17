import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import provinceService, { Province } from "@/src/services/provinceService";

const { width } = Dimensions.get("window");

type TabType = "provinces" | "categories";

interface Category {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  color: string;
}

const CATEGORIES: Category[] = [
  {
    id: "LANDSCAPE",
    name: "Phong cảnh",
    nameEn: "Landscape",
    icon: "image",
    color: "#4CAF50",
  },
  {
    id: "PEOPLE",
    name: "Con người",
    nameEn: "People",
    icon: "people",
    color: "#2196F3",
  },
  {
    id: "FOOD",
    name: "Món ăn",
    nameEn: "Food",
    icon: "restaurant",
    color: "#FF9800",
  },
  {
    id: "ARCHITECTURE",
    name: "Kiến trúc",
    nameEn: "Architecture",
    icon: "business",
    color: "#9C27B0",
  },
  {
    id: "CULTURE",
    name: "Văn hóa",
    nameEn: "Culture",
    icon: "color-palette",
    color: "#E91E63",
  },
  {
    id: "NATURE",
    name: "Thiên nhiên",
    nameEn: "Nature",
    icon: "leaf",
    color: "#8BC34A",
  },
  {
    id: "URBAN",
    name: "Đô thị",
    nameEn: "Urban",
    icon: "business",
    color: "#607D8B",
  },
  {
    id: "EVENT",
    name: "Sự kiện",
    nameEn: "Event",
    icon: "calendar",
    color: "#F44336",
  },
  {
    id: "OTHER",
    name: "Khác",
    nameEn: "Other",
    icon: "ellipsis-horizontal-circle",
    color: "#9E9E9E",
  },
];

export default function ExploreScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("provinces");
  const [searchQuery, setSearchQuery] = useState("");
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [filteredProvinces, setFilteredProvinces] = useState<Province[]>([]);
  const [filteredCategories, setFilteredCategories] =
    useState<Category[]>(CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProvinces();
  }, []);

  useEffect(() => {
    if (activeTab === "provinces") {
      if (searchQuery.trim() === "") {
        setFilteredProvinces(provinces);
      } else {
        const filtered = provinces.filter(
          (province) =>
            province.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            province.nameEn.toLowerCase().includes(searchQuery.toLowerCase()),
        );
        setFilteredProvinces(filtered);
      }
    } else {
      if (searchQuery.trim() === "") {
        setFilteredCategories(CATEGORIES);
      } else {
        const filtered = CATEGORIES.filter(
          (category) =>
            category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            category.nameEn.toLowerCase().includes(searchQuery.toLowerCase()),
        );
        setFilteredCategories(filtered);
      }
    }
  }, [searchQuery, provinces, activeTab]);

  const loadProvinces = async () => {
    try {
      setLoading(true);
      const data = await provinceService.getAllProvinces();
      setProvinces(data);
      setFilteredProvinces(data);
    } catch (error) {
      console.error("Error loading provinces:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProvincePress = (province: Province) => {
    router.push({
      pathname: "/province-moments",
      params: {
        provinceId: province.id.toString(),
        provinceName: province.name,
      },
    });
  };

  const handleCategoryPress = (category: Category) => {
    router.push({
      pathname: "/category-moments",
      params: {
        categoryId: category.id,
        categoryName: category.name,
      },
    });
  };

  const renderProvinceItem = ({ item }: { item: Province }) => (
    <TouchableOpacity
      style={styles.provinceCard}
      onPress={() => handleProvincePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.provinceIcon}>
        <Ionicons name="location" size={28} color="#007AFF" />
      </View>
      <View style={styles.provinceInfo}>
        <Text style={styles.provinceName}>{item.name}</Text>
        <Text style={styles.provinceCode}>
          {item.code} • {item.region}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.7}
    >
      <View
        style={[styles.categoryIcon, { backgroundColor: item.color + "20" }]}
      >
        <Ionicons name={item.icon as any} size={32} color={item.color} />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
      <Text style={styles.categoryNameEn}>{item.nameEn}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Khám phá</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Khám phá</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "provinces" && styles.activeTab]}
          onPress={() => {
            setActiveTab("provinces");
            setSearchQuery("");
          }}
        >
          <Ionicons
            name="location"
            size={20}
            color={activeTab === "provinces" ? "#007AFF" : "#8E8E93"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "provinces" && styles.activeTabText,
            ]}
          >
            Tỉnh thành
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "categories" && styles.activeTab]}
          onPress={() => {
            setActiveTab("categories");
            setSearchQuery("");
          }}
        >
          <Ionicons
            name="grid"
            size={20}
            color={activeTab === "categories" ? "#007AFF" : "#8E8E93"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "categories" && styles.activeTabText,
            ]}
          >
            Danh mục
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#8E8E93"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={
            activeTab === "provinces"
              ? "Tìm kiếm tỉnh thành..."
              : "Tìm kiếm danh mục..."
          }
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#8E8E93"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {activeTab === "provinces" ? (
        <FlatList
          key="provinces-list"
          data={filteredProvinces}
          renderItem={renderProvinceItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyText}>Không tìm thấy tỉnh thành</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          key="categories-grid"
          data={filteredCategories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyText}>Không tìm thấy danh mục</Text>
            </View>
          }
        />
      )}
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
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#007AFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  backButton: {
    padding: 8,
    color: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  placeholder: {
    width: 40,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: "#E3F2FD",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#8E8E93",
    marginLeft: 6,
  },
  activeTabText: {
    color: "#007AFF",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1C1C1E",
  },
  listContent: {
    paddingHorizontal: 16,
  },
  gridContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  provinceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  provinceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  provinceInfo: {
    flex: 1,
  },
  provinceName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  provinceCode: {
    fontSize: 13,
    color: "#8E8E93",
  },
  categoryCard: {
    width: (width - 40) / 2,
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  categoryIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
    textAlign: "center",
  },
  categoryNameEn: {
    fontSize: 13,
    color: "#8E8E93",
    textAlign: "center",
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E5EA",
    marginVertical: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#8E8E93",
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
    color: "#8E8E93",
  },
});
