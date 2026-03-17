import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useAlert } from '@/src/context/AlertContext';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/hooks';
import { apiClient } from '@/src/services/api/apiClient';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  const handleChangePassword = async () => {
    showAlert(
      'Đổi mật khẩu',
      'Bạn sẽ nhận được mã OTP qua email để xác thực',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Tiếp tục',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await apiClient.post('/auth/request-change-password', {
                email: user?.email,
              });

              if (response.success) {
                showAlert('Thành công', 'Mã OTP đã được gửi đến email của bạn', [
                  {
                    text: 'OK',
                    onPress: () => {
                      router.push({
                        pathname: '/verify-otp',
                        params: {
                          email: user?.email,
                          type: 'change-password',
                        },
                      });
                    },
                  },
                ]);
              } else {
                showAlert('Lỗi', response.message || 'Không thể gửi OTP');
              }
            } catch (error: any) {
              showAlert('Lỗi', error.message || 'Không thể kết nối đến server');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    showAlert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleEditProfile}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#e3f2fd' }]}>
                <Ionicons name="create-outline" size={22} color="#1a73e8" />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemText}>Chỉnh sửa thông tin</Text>
                <Text style={styles.menuItemDescription}>Cập nhật tên, bio, ngày sinh</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleChangePassword}
            disabled={loading}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#fff3e0' }]}>
                <Ionicons name="lock-closed-outline" size={22} color="#ff9800" />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemText}>Đổi mật khẩu</Text>
                <Text style={styles.menuItemDescription}>Thay đổi mật khẩu đăng nhập</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>


        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông báo</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => showAlert('Thông báo', 'Tính năng đang phát triển')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#fce4ec' }]}>
                <Ionicons name="notifications-outline" size={22} color="#e91e63" />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemText}>Thông báo</Text>
                <Text style={styles.menuItemDescription}>Quản lý thông báo push</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Về ứng dụng</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => showAlert('MAPIC', 'Version 1.0.0\n\nỨng dụng mạng xã hội dựa trên vị trí')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#e0f2f1' }]}>
                <Ionicons name="information-circle-outline" size={22} color="#009688" />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemText}>Thông tin ứng dụng</Text>
                <Text style={styles.menuItemDescription}>Version 1.0.0</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => showAlert('Thông báo', 'Tính năng đang phát triển')}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#fff9c4' }]}>
                <Ionicons name="help-circle-outline" size={22} color="#fbc02d" />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemText}>Trợ giúp & Hỗ trợ</Text>
                <Text style={styles.menuItemDescription}>Câu hỏi thường gặp, liên hệ</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#f44336" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        {/* Spacer */}
        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a73e8',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 12,
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 2,
  },
  menuItemDescription: {
    fontSize: 13,
    color: '#999',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
  },
  spacer: {
    height: 32,
  },
});
