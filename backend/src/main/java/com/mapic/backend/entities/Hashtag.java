package com.mapic.backend.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Entity Hashtag - Lưu trữ các hashtag duy nhất trong hệ thống
 * 
 * Thiết kế:
 * - Mỗi hashtag chỉ lưu 1 lần (unique constraint)
 * - Đếm số lần sử dụng (usageCount) để tính trending
 * - Index trên name để tìm kiếm nhanh
 * 
 * Ví dụ:
 * - #dalat → name="dalat", usageCount=1250
 * - #travel → name="travel", usageCount=5430
 */
@Entity
@Table(
    name = "hashtags",
    indexes = {
        // Index cho tìm kiếm hashtag theo tên (autocomplete, search)
        @Index(name = "idx_hashtag_name", columnList = "name"),
        
        // Index cho trending hashtags (ORDER BY usageCount DESC)
        @Index(name = "idx_hashtag_usage_count", columnList = "usage_count DESC")
    },
    uniqueConstraints = {
        // Đảm bảo mỗi hashtag chỉ tồn tại 1 lần
        @UniqueConstraint(name = "uk_hashtag_name", columnNames = "name")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Hashtag {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * Tên hashtag (không bao gồm dấu #)
     * Ví dụ: "dalat", "travel", "foodie"
     * 
     * Quy tắc:
     * - Chữ thường (lowercase)
     * - Không dấu (unaccented)
     * - Không khoảng trắng
     * - Độ dài: 1-50 ký tự
     */
    @Column(nullable = false, unique = true, length = 50)
    private String name;
    
    /**
     * Số lần hashtag được sử dụng
     * 
     * Tăng khi:
     * - Tạo mới Tagging với hashtag này
     * 
     * Giảm khi:
     * - Xóa Tagging với hashtag này
     * 
     * Dùng để:
     * - Tính trending hashtags
     * - Hiển thị popularity
     * - Gợi ý hashtag phổ biến
     */
    @Column(name = "usage_count", nullable = false)
    private Long usageCount = 0L;
    
    /**
     * Thời điểm hashtag được tạo lần đầu
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    /**
     * Thời điểm hashtag được sử dụng gần nhất
     * Dùng để tính "trending now" (kết hợp với usageCount)
     */
    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastUsedAt = LocalDateTime.now();
        if (usageCount == null) {
            usageCount = 0L;
        }
    }
    
    /**
     * Tăng usage count khi hashtag được sử dụng
     */
    public void incrementUsage() {
        this.usageCount++;
        this.lastUsedAt = LocalDateTime.now();
    }
    
    /**
     * Giảm usage count khi xóa tagging
     */
    public void decrementUsage() {
        if (this.usageCount > 0) {
            this.usageCount--;
        }
    }
}
