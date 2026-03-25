import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  // Use 10.0.2.2 for Android Emulator, or your machine's IP for physical devices
  static const String baseUrl = 'http://192.168.100.177:8080/api';

  static Future<Map<String, dynamic>> login(
    String username,
    String password,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/admin/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'username': username, 'password': password}),
      ).timeout(const Duration(seconds: 10));

      if (response.body.isEmpty) {
        return {
          'success': false, 
          'message': 'Phản hồi từ server trống (Mã: ${response.statusCode})'
        };
      }

      final responseData = jsonDecode(utf8.decode(response.bodyBytes));

      if (response.statusCode == 200 && responseData['success'] == true) {
        final data = responseData['data'];
        final token = data['token'];

        // Save token and user info
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('jwt_token', token);
        await prefs.setString('username', data['username']);
        await prefs.setString('user_id', data['userId'].toString());
        await prefs.setString(
          'role',
          data['role'] ?? 'ADMIN',
        ); // Backend should return role

        return {'success': true, 'message': responseData['message']};
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Đăng nhập thất bại (${response.statusCode})',
        };
      }
    } catch (e) {
      String errorMsg = 'Lỗi kết nối';
      if (e.toString().contains('FormatException')) {
        errorMsg = 'Lỗi định dạng dữ liệu từ server';
      } else if (e.toString().contains('TimeoutException')) {
        errorMsg = 'Kết nối quá hạn (Timeout)';
      } else {
        errorMsg = 'Lỗi: $e';
      }
      return {'success': false, 'message': errorMsg};
    }
  }

  static Future<Map<String, dynamic>> register({
    required String username,
    required String fullName,
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/admin/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'username': username,
          'fullName': fullName,
          'email': email,
          'password': password,
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.body.isEmpty) {
        return {
          'success': false, 
          'message': 'Phản hồi từ server trống (Mã: ${response.statusCode})'
        };
      }

      final responseData = jsonDecode(utf8.decode(response.bodyBytes));

      if (response.statusCode == 200 && responseData['success'] == true) {
        return {'success': true, 'message': responseData['message']};
      } else {
        return {
          'success': false,
          'message': responseData['message'] ?? 'Đăng ký thất bại (${response.statusCode})',
        };
      }
    } catch (e) {
      String errorMsg = 'Lỗi kết nối';
      if (e.toString().contains('FormatException')) {
        errorMsg = 'Lỗi định dạng dữ liệu từ server';
      } else if (e.toString().contains('TimeoutException')) {
        errorMsg = 'Kết nối quá hạn (Timeout)';
      } else {
        errorMsg = 'Lỗi: $e';
      }
      return {'success': false, 'message': errorMsg};
    }
  }


  static Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/forgot-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      ).timeout(const Duration(seconds: 10));

      if (response.body.isEmpty) {
        return {
          'success': false, 
          'message': 'Phản hồi từ server trống (Mã: ${response.statusCode})'
        };
      }

      final responseData = jsonDecode(utf8.decode(response.bodyBytes));
      return {
        'success': responseData['success'] ?? false,
        'message':
            responseData['message'] ??
            (response.statusCode == 200
                ? 'Yêu cầu đã được gửi'
                : 'Gửi yêu cầu thất bại (${response.statusCode})'),
      };
    } catch (e) {
      String errorMsg = 'Lỗi kết nối';
      if (e.toString().contains('FormatException')) {
        errorMsg = 'Lỗi định dạng dữ liệu từ server';
      } else if (e.toString().contains('TimeoutException')) {
        errorMsg = 'Kết nối quá hạn (Timeout)';
      } else {
        errorMsg = 'Lỗi: $e';
      }
      return {'success': false, 'message': errorMsg};
    }
  }


  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('jwt_token');
  }

  static Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null;
  }
}
