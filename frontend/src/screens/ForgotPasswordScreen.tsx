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
import { useRouter } from 'expo-router';
import { useAlert } from '@/src/context/AlertContext';
import { validateEmailDetailed } from '@/src/utils/validation';
import authService from '@/src/services/authService';
import ValidatedInput from '@/src/components/ValidatedInput';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '' });
  const router = useRouter();
  const { showAlert } = useAlert();

  const validateFields = (): boolean => {
    const emailValidation = validateEmailDetailed(email);
    const newErrors = {
      email: emailValidation.isValid ? '' : emailValidation.error || '',
    };
    setErrors(newErrors);
    return emailValidation.isValid;
  };

  const handleSendOTP = async () => {
    if (!validateFields()) {
      return;
    }

    setLoading(true);
    try {
      const response = await authService.forgotPassword({
        email: email.trim().toLowerCase(),
      });

      if (response.success) {
        showAlert('Thành công', response.message);
        router.push({
          pathname: '/verify-otp',
          params: { email: email.trim().toLowerCase(), type: 'forgot-password' }
        });
      } else {
        showAlert('Lỗi', response.message);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Gửi mã OTP thất bại';
      showAlert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setErrors({ email: '' });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.card}>
        <Text style={styles.title}>Quên mật khẩu</Text>
        <Text style={styles.subtitle}>
          Nhập email của bạn để nhận mã xác thực
        </Text>

        <ValidatedInput
          placeholder="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            clearError();
          }}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.sendButton, loading && styles.sendButtonDisabled]}
          onPress={handleSendOTP}
          disabled={loading}
        >
          <Text style={styles.sendButtonText}>
            {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
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
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
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
