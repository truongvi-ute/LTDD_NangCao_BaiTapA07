package com.mapic.backend.services;

import com.mapic.backend.dtos.AuthResponse;
import com.mapic.backend.entities.AccountStatus;
import com.mapic.backend.entities.Admin;
import com.mapic.backend.entities.Moderator;
import com.mapic.backend.repositories.AdminRepository;
import com.mapic.backend.repositories.ModeratorRepository;
import com.mapic.backend.utils.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminAuthService {
    
    private final AdminRepository adminRepository;
    private final ModeratorRepository moderatorRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    
    public AuthResponse login(String username, String password) {
        // Try to find in Admin first
        Admin admin = adminRepository.findByUsername(username).orElse(null);
        if (admin != null) {
            return authenticateAdmin(admin, password);
        }
        
        // Then try in Moderator
        Moderator moderator = moderatorRepository.findByUsername(username).orElse(null);
        if (moderator != null) {
            return authenticateModerator(moderator, password);
        }
        
        throw new RuntimeException("Username hoặc mật khẩu không đúng");
    }
    
    private AuthResponse authenticateAdmin(Admin admin, String password) {
        if (!passwordEncoder.matches(password, admin.getPassword())) {
            throw new RuntimeException("Username hoặc mật khẩu không đúng");
        }
        
        if (admin.getStatus() != AccountStatus.ACTIVE) {
            throw new RuntimeException("Tài khoản Admin không hoạt động");
        }
        
        String role = admin.getIsSuperAdmin() ? "ADMIN" : "ADMIN"; // For now both use ADMIN role prefix for security simplicity
        String token = jwtUtil.generateTokenWithRole(admin.getUsername(), admin.getId(), role);
        
        log.info("Admin logged in successfully: {}", admin.getUsername());
        return new AuthResponse(token, admin.getId(), admin.getUsername(), admin.getEmail(), admin.getFullName(), null);
    }
    
    private AuthResponse authenticateModerator(Moderator moderator, String password) {
        if (!passwordEncoder.matches(password, moderator.getPassword())) {
            throw new RuntimeException("Username hoặc mật khẩu không đúng");
        }
        
        if (moderator.getStatus() != AccountStatus.ACTIVE) {
            throw new RuntimeException("Tài khoản Moderator không hoạt động");
        }
        
        String token = jwtUtil.generateTokenWithRole(moderator.getUsername(), moderator.getId(), "MODERATOR");
        
        log.info("Moderator logged in successfully: {}", moderator.getUsername());
        return new AuthResponse(token, moderator.getId(), moderator.getUsername(), moderator.getEmail(), moderator.getFullName(), null);
    }
    
    public void registerModerator(com.mapic.backend.dtos.ModeratorRegisterRequest request) {
        if (adminRepository.findByUsername(request.getUsername()).isPresent() || 
            moderatorRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username đã được sử dụng");
        }
        
        if (moderatorRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email đã được sử dụng");
        }
        
        Moderator moderator = new Moderator();
        moderator.setUsername(request.getUsername());
        moderator.setFullName(request.getFullName());
        moderator.setEmail(request.getEmail());
        moderator.setPassword(passwordEncoder.encode(request.getPassword()));
        moderator.setStatus(AccountStatus.ACTIVE); // Auto-active for now or set to PENDING
        
        moderatorRepository.save(moderator);
        log.info("New moderator registered: {}", moderator.getUsername());
    }
}
