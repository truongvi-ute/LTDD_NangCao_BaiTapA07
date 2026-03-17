import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useAlert } from "@/src/context/AlertContext";
import { useRouter } from "expo-router";
import {
  validateUsername,
  validatePasswordDetailed,
} from "@/src/utils/validation";
import authService from "@/src/services/authService";
import ValidatedInput from "@/src/components/ValidatedInput";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    username: "",
    password: "",
  });
  const router = useRouter();
  const { showAlert } = useAlert();

  const validateFields = (): boolean => {
    const usernameValidation = validateUsername(username);
    const passwordValidation = validatePasswordDetailed(password);

    const newErrors = {
      username: usernameValidation.isValid
        ? ""
        : usernameValidation.error || "",
      password: passwordValidation.isValid
        ? ""
        : passwordValidation.error || "",
    };

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  const handleLogin = async () => {
    if (!validateFields()) {
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login({
        username: username.trim(),
        password,
      });

      if (response.success) {
        showAlert("Thành công", "Đăng nhập thành công!", [
          {
            text: "OK",
            onPress: () => router.replace("/home"),
          },
        ]);
      } else {
        showAlert("Lỗi", response.message);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "Đăng nhập thất bại";
      showAlert("Lỗi", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field: keyof typeof errors) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleForgotPassword = () => {
    router.push("/forgot-password");
  };

  const handleRegister = () => {
    router.push("/register");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.card}>
          <Text style={styles.title}>MAPIC Login</Text>

          <ValidatedInput
            placeholder="Username"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              clearError("username");
            }}
            error={errors.username}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <ValidatedInput
            placeholder="Mật khẩu"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              clearError("password");
            }}
            error={errors.password}
            isPassword
            autoCapitalize="none"
          />

          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={styles.forgotPassword}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRegister}>
            <Text style={styles.registerText}>
              Chưa có tài khoản?{" "}
              <Text style={styles.registerLink}>Đăng ký ngay</Text>
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
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    shadowColor: "#000",
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
    fontWeight: "bold",
    color: "#007AFF",
    textAlign: "center",
    marginBottom: 40,
  },
  forgotPassword: {
    color: "#007AFF",
    fontSize: 14,
    textAlign: "right",
    marginBottom: 30,
    marginTop: -8,
  },
  loginButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  registerText: {
    color: "#8E8E93",
    fontSize: 14,
    textAlign: "center",
  },
  registerLink: {
    color: "#007AFF",
    fontWeight: "600",
  },
});
