import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAlert } from '@/src/context/AlertContext';
import {
  validateUsername,
  validateEmailDetailed,
  validatePasswordDetailed,
  validatePasswordMatch,
} from '@/src/utils/validation';
import authService from '@/src/services/authService';
import ValidatedInput from '@/src/components/ValidatedInput';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Error states
  const [errors, setErrors] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const router = useRouter();
  const { showAlert } = useAlert();

  const validateAllFields = (): boolean => {
    const usernameValidation = validateUsername(username);
    const emailValidation = validateEmailDetailed(email);
    const passwordValidation = validatePasswordDetailed(password);
    const confirmPasswordValidation = validatePasswordMatch(password, confirmPassword);

    const newErrors = {
      username: usernameValidation.isValid ? '' : usernameValidation.error || '',
      email: emailValidation.isValid ? '' : emailValidation.error || '',
      password: passwordValidation.isValid ? '' : passwordValidation.error || '',
      confirmPassword: confirmPasswordValidation.isValid ? '' : confirmPasswordValidation.error || '',
    };

    setErrors(newErrors);

    return Object.values(newErrors).every(error => error === '');
  };

  const handleRegister = async () => {
    if (!validateAllFields()) {
      return;
    }

    setLoading(true);
    try {
      const response = await authService.register({
        username: username.trim(),
        name: username.trim(), // Use username as name
        email: email.trim().toLowerCase(),
        password,
      });

      if (response.success) {
        showAlert('Thành công', response.message);
        router.push({
          pathname: '/verify-otp',
          params: { email: email.trim().toLowerCase(), type: 'registration' }
        });
      } else {
        showAlert('Lỗi', response.message);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Đăng ký thất bại';
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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Đăng ký</Text>
            <Text style={styles.subtitle}>Tạo tài khoản MAPIC mới</Text>

            <ValidatedInput
              placeholder="Tên tài khoản"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                clearError('username');
              }}
              error={errors.username}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <ValidatedInput
              placeholder="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearError('email');
              }}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <ValidatedInput
              placeholder="Mật khẩu"
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
              placeholder="Xác nhận mật khẩu"
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
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.registerButtonText}>
                {loading ? 'Đang xử lý...' : 'Đăng ký'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginText}>
                Đã có tài khoản? <Text style={styles.loginLink}>Đăng nhập</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: '100%',
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
  },
  registerButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loginText: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
  },
  loginLink: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
