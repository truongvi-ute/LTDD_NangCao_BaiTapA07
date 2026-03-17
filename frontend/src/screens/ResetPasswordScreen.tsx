import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAlert } from '@/src/context/AlertContext';
import { validatePasswordDetailed, validatePasswordMatch } from '@/src/utils/validation';
import authService from '@/src/services/authService';
import ValidatedInput from '@/src/components/ValidatedInput';
import { apiClient } from '@/src/services/api/apiClient';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: '',
  });
  const router = useRouter();
  const params = useLocalSearchParams();
  const { email, otp, type } = params;
  const { showAlert } = useAlert();

  const isChangePassword = type === 'change-password';

  const validateFields = (): boolean => {
    const passwordValidation = validatePasswordDetailed(password);
    const confirmPasswordValidation = validatePasswordMatch(password, confirmPassword);

    const newErrors = {
      password: passwordValidation.isValid ? '' : passwordValidation.error || '',
      confirmPassword: confirmPasswordValidation.isValid ? '' : confirmPasswordValidation.error || '',
    };

    setErrors(newErrors);
    return Object.values(newErrors).every(error => error === '');
  };

  const handleResetPassword = async () => {
    if (!validateFields()) {
      return;
    }

    setLoading(true);
    try {
      let response;
      
      if (isChangePassword) {
        // Use change-password endpoint
        response = await apiClient.post('/auth/change-password', {
          email: email as string,
          otp: otp as string,
          newPassword: password,
        });
      } else {
        // Use reset-password endpoint (forgot password)
        response = await authService.resetPassword({
          email: email as string,
          otp: otp as string,
          newPassword: password,
        });
      }

      if (response.success) {
        if (isChangePassword) {
          // Logout and redirect to login
          await authService.logout();
          showAlert(
            'Thành công',
            'Mật khẩu đã được thay đổi. Vui lòng đăng nhập lại',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/login')
              }
            ]
          );
        } else {
          // Just redirect to login
          showAlert(
            'Thành công',
            'Mật khẩu đã được đặt lại thành công',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/login')
              }
            ]
          );
        }
      } else {
        showAlert('Lỗi', response.message);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Đặt lại mật khẩu thất bại';
      showAlert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field: keyof typeof errors) => {
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.card}>
        <Text style={styles.title}>{isChangePassword ? 'Đổi mật khẩu' : 'Đặt lại mật khẩu'}</Text>
        <Text style={styles.subtitle}>
          Nhập mật khẩu mới cho tài khoản{'\n'}
          <Text style={styles.email}>{email}</Text>
        </Text>

        <ValidatedInput
          placeholder="Mật khẩu mới"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            clearError('password');
          }}
          error={errors.password}
          isPassword
          autoCapitalize="none"
        />

        <ValidatedInput
          placeholder="Xác nhận mật khẩu mới"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            clearError('confirmPassword');
          }}
          error={errors.confirmPassword}
          isPassword
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.resetButton, loading && styles.resetButtonDisabled]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          <Text style={styles.resetButtonText}>
            {loading ? 'Đang xử lý...' : (isChangePassword ? 'Đổi mật khẩu' : 'Đặt lại mật khẩu')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/login')}>
          <Text style={styles.backText}>
            <Text style={styles.backLink}>← Quay lại đăng nhập</Text>
          </Text>
        </TouchableOpacity>
      </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  email: {
    color: '#007AFF',
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  resetButtonDisabled: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  backText: {
    fontSize: 14,
    textAlign: 'center',
  },
  backLink: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
