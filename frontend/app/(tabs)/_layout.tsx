import React, { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme, View } from 'react-native';
import { Image } from 'expo-image';
import authService from '@/src/services/authService';
import notificationService from '@/src/services/notificationService';
import { buildImageUrl } from '@/src/utils/imageHelper';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await authService.getCurrentUser();
        if (userData?.avatarUrl) {
          setAvatarUri(buildImageUrl(userData.avatarUrl));
        }
      } catch (error) {
        console.error("Error loading user for tab bar:", error);
      }
    };
    
    const fetchUnreadCount = async () => {
      try {
        const count = await notificationService.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    loadUser();
    fetchUnreadCount();

    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1a73e8',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
          borderTopColor: colorScheme === 'dark' ? '#38383A' : '#E5E5EA',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Khám phá',
          tabBarIcon: ({ focused }) => (
            <View style={{ 
              borderRadius: 12, 
              borderWidth: focused ? 2 : 0, 
              borderColor: '#1a73e8',
              padding: 1
            }}>
              <Image
                source={require("@/assets/images/explore_icon.png")}
                style={{ width: 24, height: 24, borderRadius: 12 }}
                contentFit="cover"
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="create-moment"
        options={{
          title: 'Tạo mới',
          tabBarIcon: ({ color }) => <Ionicons name="add-circle" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Bạn bè',
          tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Thông báo',
          tabBarIcon: ({ color }) => <Ionicons name="notifications" size={24} color={color} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ 
              borderRadius: 12, 
              borderWidth: focused ? 2 : 0, 
              borderColor: '#1a73e8',
              padding: 1
            }}>
              <Image
                source={avatarUri ? { uri: avatarUri } : require("@/assets/images/avatar_default.png")}
                style={{ width: 24, height: 24, borderRadius: 12 }}
                contentFit="cover"
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
