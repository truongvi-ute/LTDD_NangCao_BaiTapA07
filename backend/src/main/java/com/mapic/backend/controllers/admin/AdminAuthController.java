package com.mapic.backend.controllers.admin;

import com.mapic.backend.dtos.ApiResponse;
import com.mapic.backend.dtos.AuthResponse;
import com.mapic.backend.dtos.LoginRequest;
import com.mapic.backend.services.AdminAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/auth")
@RequiredArgsConstructor
public class AdminAuthController {
    
    private final AdminAuthService adminAuthService;
    
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@RequestBody LoginRequest loginRequest) {
        try {
            AuthResponse response = adminAuthService.login(loginRequest.getUsername(), loginRequest.getPassword());
            return ResponseEntity.ok(new ApiResponse<>(true, "Đăng nhập thành công", response));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> register(@jakarta.validation.Valid @RequestBody com.mapic.backend.dtos.ModeratorRegisterRequest registerRequest) {
        try {
            adminAuthService.registerModerator(registerRequest);
            return ResponseEntity.ok(new ApiResponse<>(true, "Đăng ký thành công", "Vui lòng đăng nhập"));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}
